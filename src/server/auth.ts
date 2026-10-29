import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'aura-bistro-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

export interface TokenPayload {
  userId: string;
  role: 'customer' | 'admin';
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/** Sign a JWT token */
export function generateToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}

/** Verify a JWT token and return the decoded payload */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const options: VerifyOptions = {};
    const decoded = jwt.verify(token, JWT_SECRET, options) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/** Extract Bearer token from Authorization header */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
}

/** Middleware: authenticate via Bearer JWT. Attaches req.user if valid. */
export function authenticateToken(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const token = extractBearerToken(req);
  if (!token) {
    return next(); // no token -> continue as unauthenticated
  }

  const payload = verifyToken(token);
  if (payload) {
    req.user = payload;
  }
  next();
}

/** Middleware: require a valid authenticated user. */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

/** Middleware: require admin role. */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
