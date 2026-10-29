import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { db } from './src/server/db.ts';
import {
  authenticateToken,
  requireAuth,
  requireAdmin,
  generateToken,
  AuthenticatedRequest,
} from './src/server/auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// --- Security Middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting: 100 requests per 15 minutes per IP for all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// Stricter limit on auth endpoints: 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

// Request logger for API calls
app.use('/api', (req, _res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Server-Sent Events (SSE) Live Stream ---
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE stream connected', timestamp: new Date().toISOString() })}\n\n`);

  // Subscribe to DB broadcasts
  const unsubscribe = db.subscribeSSE((msg) => {
    res.write(msg);
  });

  // Keep-alive heartbeat every 20 seconds
  const pingInterval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
  }, 20000);

  req.on('close', () => {
    clearInterval(pingInterval);
    unsubscribe();
  });
});

// --- Menu Endpoints ---
app.get('/api/menu', (_req: Request, res: Response) => {
  try {
    const menu = db.getMenu();
    res.json(menu);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch menu' });
  }
});

app.post('/api/menu/items', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = db.createMenuItem(req.body);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create menu item' });
  }
});

app.put('/api/menu/items/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = db.updateMenuItem(req.params.id, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update menu item' });
  }
});

app.delete('/api/menu/items/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteMenuItem(req.params.id);
    res.json({ success: true, message: 'Item deleted' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete menu item' });
  }
});

// Out-of-stock toggle (Stretch Feature 1)
app.patch('/api/menu/items/:id/availability', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { isAvailable } = req.body;
    const item = db.toggleItemAvailability(req.params.id, isAvailable);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to toggle availability' });
  }
});

// --- Order Endpoints ---
app.get('/api/orders', authenticateToken, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, date, orderType } = req.query;
    const orders = db.getOrders({
      status: status as any,
      date: date as string,
      orderType: orderType as string,
    });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch orders' });
  }
});

app.get('/api/orders/:id', authenticateToken, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch order' });
  }
});

// Server-side price preview calculator
app.post('/api/orders/calculate', (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const calculated = db.calculateServerOrder(items);
    res.json(calculated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Price calculation failed' });
  }
});

// Place order with authoritative server pricing & input validation
app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const order = db.createOrder(req.body);
    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Order creation failed' });
  }
});

// Status change endpoint (Kitchen KDS & Admin)
app.patch('/api/orders/:id/status', authenticateToken, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, note } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const order = db.updateOrderStatus(req.params.id, status, note);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update order status' });
  }
});

// Order cancellation endpoint
app.patch('/api/orders/:id/cancel', authenticateToken, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { note } = req.body;
    const order = db.cancelOrder(req.params.id, note);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to cancel order' });
  }
});

// Customer satisfaction rating endpoint
app.post('/api/orders/:id/rating', authenticateToken, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = db.rateOrder(req.params.id, req.body);
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit rating' });
  }
});

// --- Customer Account & Past Orders Endpoints ---
app.get('/api/customer/orders', (req: Request, res: Response) => {
  try {
    const { email, phone, customerId } = req.query;
    if (!email && !phone && !customerId) {
      return res.status(400).json({ error: 'Please provide customer email, phone, or customerId.' });
    }
    const orders = db.getCustomerOrders({
      email: typeof email === 'string' ? email : undefined,
      phone: typeof phone === 'string' ? phone : undefined,
      customerId: typeof customerId === 'string' ? customerId : undefined,
    });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch customer orders' });
  }
});

app.post('/api/customer/login', (req: Request, res: Response) => {
  try {
    const { email, name, phone } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user;
    if (cleanEmail === 'sandy@example.com') {
      user = {
        id: 'cust-1',
        name: name || 'Sandy Jaiswal',
        email: 'sandy@example.com',
        phone: phone || '+1 (555) 019-2834',
      };
    } else if (cleanEmail === 'marcus@example.com') {
      user = {
        id: 'cust-2',
        name: name || 'Marcus Vance',
        email: 'marcus@example.com',
        phone: phone || '+1 (555) 014-9821',
      };
    } else {
      user = {
        id: `cust-${Math.abs(cleanEmail.split('').reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)).toString(36)}`,
        name: name?.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: phone?.trim(),
      };
    }

    const orders = db.getCustomerOrders({ email: cleanEmail, customerId: user.id });
    res.json({ user, orders });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Customer authentication failed' });
  }
});

app.get('/api/customer/demos', (_req: Request, res: Response) => {
  res.json([
    {
      id: 'cust-1',
      name: 'Sandy Jaiswal',
      email: 'sandy@example.com',
      phone: '+1 (555) 019-2834',
      orderCount: db.getCustomerOrders({ customerId: 'cust-1' }).length,
    },
    {
      id: 'cust-2',
      name: 'Marcus Vance',
      email: 'marcus@example.com',
      phone: '+1 (555) 014-9821',
      orderCount: db.getCustomerOrders({ customerId: 'cust-2' }).length,
    },
  ]);
});


// --- Admin Endpoints ---
app.get('/api/admin/analytics', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = db.getAnalytics();
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load analytics' });
  }
});

app.post('/api/admin/reset', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    db.resetDemoData();
    res.json({ success: true, message: 'Database reset to demo state' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Reset failed' });
  }
});

// Demo login validation (issues a JWT)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email === 'admin@bistro.com' && password === 'admin123') {
    const token = generateToken({
      userId: 'admin-1',
      role: 'admin',
      email: 'admin@bistro.com',
    });
    res.json({
      success: true,
      user: {
        id: 'admin-1',
        name: 'Executive Chef & Manager',
        email: 'admin@bistro.com',
        role: 'admin',
      },
      token,
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials. Use admin@bistro.com / admin123' });
  }
});

// --- Vite Middleware / Static Serve ---
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  app.get('/', (_req, res, next) => {
    if (isProd) return res.redirect('/customer');
    next();
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Aura Bistro Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
