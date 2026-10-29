import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Category,
  MenuItem,
  Order,
  OrderStatus,
  AnalyticsSummary,
  ServerEvent,
  CreateOrderPayload,
  CustomerUser,
  OrderItem,
} from '../types/restaurant.ts';
import * as api from '../services/api.ts';
import { playNewOrderChime, playCustomerStatusChime, playUrgentWaitAlert } from '../utils/audio.ts';
import {
  notifyOrderReady,
  triggerTestNotification,
  getNotificationPermission,
  requestNotificationPermission as reqNotifPermission,
  stopDocumentTitleAlert,
} from '../services/notifications.ts';
import { ToastPayload } from '../components/NotificationToast.tsx';

export type RoleType = 'customer' | 'kitchen' | 'admin';
export type CustomerTab = 'menu' | 'tracker' | 'history';

const roleFromPath = (): RoleType => {
  const path = window.location.pathname.replace(/\/$/, '');
  if (path === '/admin') return 'admin';
  if (path === '/kitchen') return 'kitchen';
  return 'customer';
};

const pathFromRole = (role: RoleType) => role === 'customer' ? '/customer' : `/${role}`;

export interface CartItem {
  cartId: string;
  itemId: string;
  variantId?: string;
  quantity: number;
  notes?: string;
  item: MenuItem;
}

interface RestaurantContextType {
  role: RoleType;
  setRole: (role: RoleType) => void;
  customerTab: CustomerTab;
  setCustomerTab: (tab: CustomerTab) => void;

  // Menu
  categories: Category[];
  menuItems: MenuItem[];
  loadingMenu: boolean;
  reloadMenu: () => Promise<void>;
  toggleStock: (itemId: string, isAvailable?: boolean) => Promise<void>;

  // Customer Cart
  cart: CartItem[];
  addToCart: (item: MenuItem, variantId?: string, quantity?: number, notes?: string) => void;
  updateCartQuantity: (cartId: string, delta: number) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  cartWarning: string | null;
  setCartWarning: (warning: string | null) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;

  // Active Customer Order
  activeOrderId: string | null;
  activeOrder: Order | null;
  setActiveOrderId: (id: string | null) => void;
  reloadActiveOrder: () => Promise<void>;

  // Customer Auth & Dining History
  customerUser: CustomerUser | null;
  setCustomerUser: (user: CustomerUser | null) => void;
  customerOrders: Order[];
  loadingCustomerOrders: boolean;
  reloadCustomerOrders: () => Promise<void>;
  reorderWholeOrder: (order: Order) => { addedCount: number; outOfStockNames: string[] };
  reorderSingleItem: (orderItem: OrderItem) => { success: boolean; message: string };
  customerNotification: { message: string; type: 'success' | 'error' | 'info' } | null;
  setCustomerNotification: (notification: { message: string; type: 'success' | 'error' | 'info' } | null) => void;

  // Kitchen State
  kitchenOrders: Order[];
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  advanceOrderStatus: (orderId: string, nextStatus: OrderStatus, note?: string) => Promise<void>;
  loadingOrders: boolean;

  // Admin State
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (val: boolean) => void;
  adminAnalytics: AnalyticsSummary | null;
  reloadAnalytics: () => Promise<void>;
  resetDemo: () => Promise<void>;

  // Browser Notification & Alert System
  toastNotification: ToastPayload | null;
  dismissToastNotification: () => void;
  notificationPermission: NotificationPermission | 'unsupported';
  requestNotificationPermission: () => Promise<NotificationPermission>;
  testNotification: () => Promise<boolean>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<RoleType>(roleFromPath);
  const [customerTab, setCustomerTabState] = useState<CustomerTab>('menu');

  // Menu state
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('aura_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [cartWarning, setCartWarning] = useState<string | null>(null);

  // Active Customer Order tracking
  const [activeOrderId, setActiveOrderIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('aura_active_order_id') || 'order-seed-104'; // default to active seed order for immediate demo
    } catch {
      return null;
    }
  });
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Customer Account & History state
  const DEFAULT_CUSTOMER: CustomerUser = {
    id: 'cust-1',
    name: 'Sandy Jaiswal',
    email: 'sandy@example.com',
    phone: '+1 (555) 019-2834',
  };

  const [customerUser, setCustomerUserState] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('aura_customer_user');
      return saved ? JSON.parse(saved) : DEFAULT_CUSTOMER;
    } catch {
      return DEFAULT_CUSTOMER;
    }
  });
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false);
  const [customerNotification, setCustomerNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const setCustomerUser = (user: CustomerUser | null) => {
    setCustomerUserState(user);
    if (user) {
      localStorage.setItem('aura_customer_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aura_customer_user');
    }
  };

  // Kitchen state
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Admin state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('aura_admin_auth') === 'true';
  });
  const [adminAnalytics, setAdminAnalytics] = useState<AnalyticsSummary | null>(null);

  // Browser Notifications & Toast Alerts
  const [toastNotification, setToastNotification] = useState<ToastPayload | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationPermission()
  );
  const previousStatusesRef = useRef<Map<string, OrderStatus>>(new Map());

  const dismissToastNotification = useCallback(() => {
    setToastNotification(null);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    const perm = await reqNotifPermission();
    setNotificationPermission(perm);
    return perm;
  }, []);

  const testNotification = useCallback(async () => {
    const success = await triggerTestNotification();
    setNotificationPermission(getNotificationPermission());
    return success;
  }, []);

  const setCustomerTab = (tab: CustomerTab) => {
    setCustomerTabState(tab);
    if (tab === 'tracker') {
      stopDocumentTitleAlert();
    }
  };

  const setActiveOrderId = (id: string | null) => {
    setActiveOrderIdState(id);
    stopDocumentTitleAlert();
    if (id) {
      localStorage.setItem('aura_active_order_id', id);
    } else {
      localStorage.removeItem('aura_active_order_id');
      setActiveOrder(null);
    }
  };

  const setRole = (newRole: RoleType) => {
    setRoleState(newRole);
    const nextPath = pathFromRole(newRole);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    if (newRole === 'admin') {
      reloadAnalytics();
    }
  };

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('aura_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to persist cart:', e);
    }
  }, [cart]);

  // Load initial menu
  const reloadMenu = useCallback(async () => {
    try {
      const data = await api.fetchMenu();
      setCategories(data.categories);
      setMenuItems(data.items);
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  // Load kitchen orders
  const reloadKitchenOrders = useCallback(async () => {
    try {
      const orders = await api.fetchOrders();
      setKitchenOrders(orders);
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Load customer past orders
  const reloadCustomerOrders = useCallback(async () => {
    if (!customerUser) {
      setCustomerOrders([]);
      return;
    }
    setLoadingCustomerOrders(true);
    try {
      const orders = await api.fetchCustomerOrders({
        email: customerUser.email,
        customerId: customerUser.id,
        phone: customerUser.phone,
      });
      setCustomerOrders(orders);
    } catch (err) {
      console.error('Error fetching customer past orders:', err);
    } finally {
      setLoadingCustomerOrders(false);
    }
  }, [customerUser]);

  // Load active customer order
  const reloadActiveOrder = useCallback(async () => {
    if (!activeOrderId) return;
    try {
      const ord = await api.fetchOrderById(activeOrderId);
      setActiveOrder(ord);
    } catch (err) {
      console.error('Failed to reload active order:', err);
    }
  }, [activeOrderId]);

  // Load analytics
  const reloadAnalytics = useCallback(async () => {
    try {
      const data = await api.fetchAnalytics();
      setAdminAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, []);

  useEffect(() => {
    const syncRoleFromPath = () => {
      const nextRole = roleFromPath();
      setRoleState(nextRole);
      if (nextRole === 'admin') reloadAnalytics();
    };
    window.addEventListener('popstate', syncRoleFromPath);
    return () => window.removeEventListener('popstate', syncRoleFromPath);
  }, [reloadAnalytics]);

  // Initial loads
  useEffect(() => {
    reloadMenu();
    reloadKitchenOrders();
  }, [reloadMenu, reloadKitchenOrders]);

  useEffect(() => {
    kitchenOrders.forEach((o) => {
      if (!previousStatusesRef.current.has(o.id)) {
        previousStatusesRef.current.set(o.id, o.status);
      }
    });
  }, [kitchenOrders]);

  useEffect(() => {
    reloadCustomerOrders();
  }, [reloadCustomerOrders]);

  useEffect(() => {
    if (activeOrderId) {
      reloadActiveOrder();
    }
  }, [activeOrderId, reloadActiveOrder]);

  // Check for orders waiting > 15 minutes on kitchen screen and play alert pulse
  useEffect(() => {
    if (role !== 'kitchen' || !soundEnabled) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const hasLongWaitingOrder = kitchenOrders.some((o) => {
        if (!['received', 'preparing'].includes(o.status)) return false;
        const elapsedMinutes = (now - new Date(o.createdAt).getTime()) / (1000 * 60);
        return elapsedMinutes >= 15;
      });
      if (hasLongWaitingOrder) {
        // play gentle alert chime
        playUrgentWaitAlert();
      }
    }, 45000); // check periodic pulse every 45s

    return () => clearInterval(interval);
  }, [role, soundEnabled, kitchenOrders]);

  // --- Real-time SSE Stream Listener ---
  useEffect(() => {
    const unsubscribe = api.connectSSE((event: ServerEvent) => {
      if (event.type === 'ping') {
        if ((event.data as any)?.connected) {
          reloadMenu();
          reloadKitchenOrders();
          reloadCustomerOrders();
          if (activeOrderId) reloadActiveOrder();
          if (role === 'admin') reloadAnalytics();
        }
        return;
      }

      if (event.type === 'order:created') {
        const newOrder: Order = event.data;
        setKitchenOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
        if (soundEnabled) {
          playNewOrderChime();
        }
        if (activeOrderId === newOrder.id) setActiveOrder(newOrder);
        reloadAnalytics();
        reloadCustomerOrders();
      } else if (event.type === 'order:updated') {
        const updated: Order = event.data;
        if (updated.id) {
          const prevStatus = previousStatusesRef.current.get(updated.id);
          previousStatusesRef.current.set(updated.id, updated.status);

          setKitchenOrders((prev) => prev.some((o) => o.id === updated.id)
            ? prev.map((o) => (o.id === updated.id ? updated : o))
            : [updated, ...prev]);
          if (activeOrderId === updated.id) {
            setActiveOrder(updated);
          }

          // Stretch / Notification API Integration:
          // When order status updates to 'ready', send browser notification,
          // play alert chime, flash background tab title, and show toast alert
          if (updated.status === 'ready' && prevStatus !== 'ready') {
            notifyOrderReady(updated, () => {
              setActiveOrderId(updated.id);
              setRoleState('customer');
              setCustomerTabState('tracker');
              stopDocumentTitleAlert();
            });

            setToastNotification({
              id: `toast-${Date.now()}-${updated.id}`,
              order: updated,
              title: 'Order Ready for Pickup',
              message: `Order #${updated.orderNumber} is hot and ready!`,
              createdAt: Date.now(),
            });
          } else if (activeOrderId === updated.id && ['ready', 'served'].includes(updated.status)) {
            playCustomerStatusChime();
          }
        } else if ((updated as any).reset) {
          reloadKitchenOrders();
          reloadMenu();
          reloadCustomerOrders();
          if (activeOrderId) reloadActiveOrder();
        }
        reloadAnalytics();
        reloadCustomerOrders();
      } else if (event.type === 'order:rated') {
        reloadCustomerOrders();
        reloadAnalytics();
      } else if (event.type === 'item:stock_changed') {
        const { itemId, name, isAvailable } = event.data;
        // Update menu items in memory
        setMenuItems((prev) =>
          prev.map((it) => (it.id === itemId ? { ...it, isAvailable } : it))
        );

        // Stretch Feature 1: Check if an open cart contains this out-of-stock item
        if (!isAvailable) {
          setCart((prevCart) => {
            const hasOutOfStock = prevCart.some((ci) => ci.itemId === itemId);
            if (hasOutOfStock) {
              setCartWarning(`⚠️ "${name}" was just marked out of stock by the kitchen and has been removed from your cart.`);
              return prevCart.filter((ci) => ci.itemId !== itemId);
            }
            return prevCart;
          });
        }
      } else if (event.type === 'menu:updated') {
        if (event.data?.categories && event.data?.items) {
          setCategories(event.data.categories);
          setMenuItems(event.data.items);
        } else {
          reloadMenu();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeOrderId, role, soundEnabled, reloadActiveOrder, reloadAnalytics, reloadKitchenOrders, reloadMenu, reloadCustomerOrders]);

  // Cart operations
  const addToCart = (
    item: MenuItem,
    variantId?: string,
    quantity: number = 1,
    notes?: string
  ) => {
    if (!item.isAvailable) {
      alert(`Sorry, ${item.name} is currently out of stock.`);
      return;
    }

    const selectedVariant = variantId ? item.variants.find((v) => v.id === variantId) : undefined;
    const cartId = `${item.id}::${variantId || 'base'}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex((c) => c.cartId === cartId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (notes) updated[existingIndex].notes = notes;
        return updated;
      } else {
        return [
          ...prev,
          {
            cartId,
            itemId: item.id,
            variantId: selectedVariant?.id,
            quantity,
            notes,
            item,
          },
        ];
      }
    });
    setIsCartDrawerOpen(true);
  };

  const updateCartQuantity = (cartId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((ci) => {
          if (ci.cartId === cartId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((ci) => ci.cartId !== cartId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleStock = async (itemId: string, isAvailable?: boolean) => {
    try {
      await api.toggleItemStock(itemId, isAvailable);
    } catch (err: any) {
      console.error('Failed to toggle item availability:', err);
    }
  };

  const advanceOrderStatus = async (orderId: string, nextStatus: OrderStatus, note?: string) => {
    try {
      const updated = await api.updateOrderStatus(orderId, nextStatus, note);
      setKitchenOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (activeOrderId === orderId) setActiveOrder(updated);
      setCustomerOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      await reloadAnalytics();
    } catch (err: any) {
      console.error('Failed to update order status:', err);
    }
  };

  // Reorder whole meal
  const reorderWholeOrder = (order: Order): { addedCount: number; outOfStockNames: string[] } => {
    let addedCount = 0;
    const outOfStockNames: string[] = [];

    for (const item of order.items) {
      const menuItem = menuItems.find((m) => m.id === item.itemId);
      if (!menuItem || !menuItem.isAvailable) {
        outOfStockNames.push(item.name);
        continue;
      }
      const variant = menuItem.variants.find((v) => v.id === item.variantId) || menuItem.variants[0];
      addToCart(menuItem, variant?.id, item.quantity, item.notes);
      addedCount += item.quantity;
    }

    if (addedCount > 0) {
      setIsCartDrawerOpen(true);
      setCustomerNotification({
        type: 'success',
        message: `Added ${addedCount} item(s) from Order #${order.orderNumber} to your active cart.`,
      });
    }

    if (outOfStockNames.length > 0) {
      setCustomerNotification({
        type: 'info',
        message: `Some dishes could not be added because they are currently sold out: ${outOfStockNames.join(', ')}`,
      });
    }

    return { addedCount, outOfStockNames };
  };

  // Reorder single dish
  const reorderSingleItem = (orderItem: OrderItem): { success: boolean; message: string } => {
    const menuItem = menuItems.find((m) => m.id === orderItem.itemId);
    if (!menuItem) {
      const msg = `"${orderItem.name}" is no longer on the menu.`;
      setCustomerNotification({ type: 'error', message: msg });
      return { success: false, message: msg };
    }
    if (!menuItem.isAvailable) {
      const msg = `"${orderItem.name}" is currently marked out of stock.`;
      setCustomerNotification({ type: 'error', message: msg });
      return { success: false, message: msg };
    }

    const variant = menuItem.variants.find((v) => v.id === orderItem.variantId) || menuItem.variants[0];
    addToCart(menuItem, variant?.id, 1, orderItem.notes);
    setIsCartDrawerOpen(true);
    const msg = `Added ${orderItem.name} (${variant?.name || 'Standard'}) to your cart!`;
    setCustomerNotification({ type: 'success', message: msg });
    return { success: true, message: msg };
  };

  const resetDemo = async () => {
    if (!confirm('Reset menu and demo orders to fresh seed state?')) return;
    try {
      await api.resetDemoData();
      await reloadMenu();
      await reloadKitchenOrders();
      await reloadCustomerOrders();
      await reloadAnalytics();
      setActiveOrderId('order-seed-104');
    } catch (err: any) {
      console.error('Failed to reset demo data:', err);
    }
  };

  return (
    <RestaurantContext.Provider
      value={{
        role,
        setRole,
        customerTab,
        setCustomerTab,
        categories,
        menuItems,
        loadingMenu,
        reloadMenu,
        toggleStock,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartWarning,
        setCartWarning,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        activeOrderId,
        activeOrder,
        setActiveOrderId,
        reloadActiveOrder,
        customerUser,
        setCustomerUser,
        customerOrders,
        loadingCustomerOrders,
        reloadCustomerOrders,
        reorderWholeOrder,
        reorderSingleItem,
        customerNotification,
        setCustomerNotification,
        kitchenOrders,
        soundEnabled,
        setSoundEnabled,
        advanceOrderStatus,
        loadingOrders,
        isAdminAuthenticated,
        setIsAdminAuthenticated,
        adminAnalytics,
        reloadAnalytics,
        resetDemo,
        toastNotification,
        dismissToastNotification,
        notificationPermission,
        requestNotificationPermission,
        testNotification,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
