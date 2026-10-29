import {
  Category,
  MenuItem,
  Order,
  OrderStatus,
  CreateOrderPayload,
  SubmitRatingPayload,
  AnalyticsSummary,
  ServerEvent,
  CustomerUser,
} from '../types/restaurant.ts';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api';

const AUTH_TOKEN_KEY = 'hunger_helpers_admin_token';

export function getAuthToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchMenu(): Promise<{ categories: Category[]; items: MenuItem[] }> {
  const res = await fetch(`${API_BASE}/menu`);
  if (!res.ok) throw new Error('Failed to load menu');
  return res.json();
}

export async function createMenuItem(item: Partial<MenuItem>): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/menu/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create menu item');
  }
  return res.json();
}

export async function updateMenuItem(id: string, patch: Partial<MenuItem>): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/menu/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update menu item');
  }
  return res.json();
}

export async function deleteMenuItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/menu/items/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete menu item');
  }
}

export async function toggleItemStock(id: string, isAvailable?: boolean): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/menu/items/${id}/availability`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ isAvailable }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update stock availability');
  }
  return res.json();
}

export async function fetchOrders(params?: { status?: string; date?: string; orderType?: string }): Promise<Order[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.date) query.set('date', params.date);
  if (params?.orderType) query.set('orderType', params.orderType);

  const res = await fetch(`${API_BASE}/orders?${query.toString()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function fetchOrderById(id: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Order not found');
  return res.json();
}

export async function calculateOrderPrices(items: CreateOrderPayload['items']) {
  const res = await fetch(`${API_BASE}/orders/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to calculate pricing');
  }
  return res.json();
}

export async function placeOrder(payload: CreateOrderPayload): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to submit order');
  }
  return res.json();
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status, note }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update order status');
  }
  return res.json();
}

export async function cancelOrder(orderId: string, note?: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to cancel order');
  }
  return res.json();
}

export async function submitOrderRating(orderId: string, payload: SubmitRatingPayload): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/rating`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to submit rating');
  }
  const data = await res.json();
  return data.order;
}

export async function fetchCustomerOrders(params: { email?: string; phone?: string; customerId?: string }): Promise<Order[]> {
  const query = new URLSearchParams();
  if (params.email) query.set('email', params.email);
  if (params.phone) query.set('phone', params.phone);
  if (params.customerId) query.set('customerId', params.customerId);

  const res = await fetch(`${API_BASE}/customer/orders?${query.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch customer past orders');
  }
  return res.json();
}

export async function loginCustomer(data: { email: string; name?: string; phone?: string }): Promise<{ user: CustomerUser; orders: Order[] }> {
  const res = await fetch(`${API_BASE}/customer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Customer login failed');
  }
  return res.json();
}

export async function fetchCustomerDemos(): Promise<Array<CustomerUser & { orderCount: number }>> {
  const res = await fetch(`${API_BASE}/customer/demos`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_BASE}/admin/analytics`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function resetDemoData(): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/reset`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to reset demo data');
}

export async function loginAdmin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Invalid credentials');
  }
  return res.json();
}

/**
 * Connect to SSE stream for live updates
 */
export function connectSSE(onEvent: (event: ServerEvent) => void): () => void {
  const eventSource = new EventSource(`${API_BASE}/events`);

  eventSource.onopen = () => {
    // Let the caller refresh its authoritative snapshot after initial connect/reconnect.
    onEvent({ type: 'ping', data: { connected: true }, timestamp: new Date().toISOString() });
  };

  eventSource.onmessage = (e) => {
    try {
      const data: ServerEvent = JSON.parse(e.data);
      onEvent(data);
    } catch (err) {
      console.error('Failed to parse SSE event:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.debug('SSE connection error, browser will auto-reconnect', err);
  };

  return () => {
    eventSource.close();
  };
}
