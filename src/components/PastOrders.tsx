import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import { Order, OrderItem } from '../types/restaurant.ts';
import { ReceiptModal } from './ReceiptModal.tsx';
import {
  RotateCcw,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Search,
  User,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Flame,
  UtensilsCrossed,
  ArrowRight,
  Info,
} from 'lucide-react';

interface PastOrdersProps {
  onNavigateToMenu?: () => void;
  onNavigateToTracker?: (orderId: string) => void;
}

export const PastOrders: React.FC<PastOrdersProps> = ({
  onNavigateToMenu,
  onNavigateToTracker,
}) => {
  const {
    customerUser,
    setCustomerUser,
    customerOrders,
    loadingCustomerOrders,
    reloadCustomerOrders,
    reorderWholeOrder,
    reorderSingleItem,
    customerNotification,
    setCustomerNotification,
    setActiveOrderId,
  } = useRestaurant();

  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'dine_in' | 'takeaway'>('all');
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  // Preset demo accounts for quick testing
  const demoAccounts = [
    {
      id: 'cust-1',
      name: 'Sandy Jaiswal',
      email: 'sandy@example.com',
      phone: '+1 (555) 019-2834',
      badge: 'VIP Regular',
    },
    {
      id: 'cust-2',
      name: 'Marcus Vance',
      email: 'marcus@example.com',
      phone: '+1 (555) 014-9821',
      badge: 'Gourmet Club',
    },
  ];

  const handleSelectDemoAccount = (acc: typeof demoAccounts[0]) => {
    setCustomerUser({
      id: acc.id,
      name: acc.name,
      email: acc.email,
      phone: acc.phone,
    });
    setIsSwitchingAccount(false);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      return;
    }
    setCustomerUser({
      id: `cust-${Date.now().toString(36)}`,
      name: customName.trim() || customEmail.split('@')[0],
      email: customEmail.trim().toLowerCase(),
    });
    setCustomEmail('');
    setCustomName('');
    setIsSwitchingAccount(false);
  };

  // Filter orders
  const filteredOrders = customerOrders.filter((order) => {
    if (filterType !== 'all' && order.orderType !== filterType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesOrderNum = order.orderNumber.toString().includes(q);
      const matchesDish = order.items.some((it) => it.name.toLowerCase().includes(q));
      if (!matchesOrderNum && !matchesDish) return false;
    }
    return true;
  });

  // Analytics summary for customer
  const totalSpent = customerOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalAmount : 0), 0);
  const completedOrders = customerOrders.filter((o) => o.status === 'served').length;

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3 animate-spin text-amber-400" /> Received
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <Flame className="w-3 h-3 text-orange-400" /> Preparing
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Ready
          </span>
        );
      case 'served':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-800 text-stone-300 border border-stone-700">
            <CheckCircle2 className="w-3 h-3 text-stone-400" /> Served
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3 h-3 text-red-400" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {customerNotification && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-sm transition-all duration-300 shadow-lg ${
            customerNotification.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
              : customerNotification.type === 'error'
              ? 'bg-red-950/70 border-red-500/40 text-red-200'
              : 'bg-amber-950/70 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {customerNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : customerNotification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <span>{customerNotification.message}</span>
          </div>
          <button
            onClick={() => setCustomerNotification(null)}
            className="text-xs opacity-75 hover:opacity-100 font-semibold px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Guest Profile & Dining Pass Header */}
      <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-2xl shadow-inner shrink-0">
              {customerUser?.name ? customerUser.name.charAt(0) : 'G'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-100">
                  {customerUser?.name || 'Valued Guest'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Aura Dining Pass
                </span>
              </div>
              <p className="text-sm text-stone-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{customerUser?.email}</span>
                {customerUser?.phone && (
                  <>
                    <span className="text-stone-600">•</span>
                    <span>{customerUser.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Account Switcher Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSwitchingAccount(!isSwitchingAccount)}
              className="px-3.5 py-2 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-750 border border-stone-700 rounded-xl transition-colors flex items-center gap-2"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Switch Guest Account</span>
            </button>
          </div>
        </div>

        {/* Account Switcher Dropdown Form */}
        {isSwitchingAccount && (
          <div className="mt-6 pt-6 border-t border-stone-800 animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
              Switch or Sign In Demo Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleSelectDemoAccount(acc)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    customerUser?.email === acc.email
                      ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                      : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{acc.name}</p>
                    <p className="text-xs text-stone-400">{acc.email}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-800 text-amber-400 border border-stone-700">
                    {acc.badge}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomLogin} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Guest Name (e.g. Elena Rostova)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="email"
                placeholder="Email address"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 flex-1"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap"
              >
                Sign In Guest
              </button>
            </form>
          </div>
        )}

        {/* Quick Dining Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-stone-800/80">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">Orders Placed</span>
            <p className="text-xl font-bold text-stone-100 tabular-nums mt-0.5">{customerOrders.length}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">Completed Visits</span>
            <p className="text-xl font-bold text-emerald-400 tabular-nums mt-0.5">{completedOrders}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">Lifetime Dining</span>
            <p className="text-xl font-bold text-stone-100 tabular-nums mt-0.5">${totalSpent.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">Live Order Tracking</span>
            <p className="text-sm font-medium text-amber-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time SSE</span>
            </p>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-100">Past Orders & Dining History</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            View itemized receipts, review chef ratings, and reorder your favorite meals in 1-click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes or #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 w-44 sm:w-52"
            />
          </div>

          {/* Type Filters */}
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'all' ? 'bg-stone-800 text-stone-100 font-semibold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('dine_in')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'dine_in' ? 'bg-stone-800 text-stone-100 font-semibold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Dine-In
            </button>
            <button
              onClick={() => setFilterType('takeaway')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'takeaway' ? 'bg-stone-800 text-stone-100 font-semibold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Takeaway
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loadingCustomerOrders ? (
        <div className="text-center py-16 bg-stone-900/40 rounded-2xl border border-stone-800">
          <Clock className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-300">Retrieving your culinary history...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-stone-900/40 rounded-2xl border border-stone-800 px-4">
          <UtensilsCrossed className="w-12 h-12 text-stone-600 mx-auto mb-4" />
          <h3 className="font-serif text-lg font-bold text-stone-200">No Past Orders Found</h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto mt-1 mb-6">
            {searchQuery
              ? `No previous orders matched "${searchQuery}". Try a different keyword.`
              : 'You haven\'t placed any orders with this guest profile yet. Explore our handcrafted menu to place your first table or takeaway order!'}
          </p>
          {onNavigateToMenu && (
            <button
              onClick={onNavigateToMenu}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <span>Explore Bistro Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedTime = new Date(order.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

            const isActiveOrder = ['received', 'preparing', 'ready'].includes(order.status);

            return (
              <article
                key={order.id}
                className="bg-stone-900 border border-stone-800 hover:border-stone-750 rounded-2xl overflow-hidden transition-all shadow-md group"
              >
                {/* Order Top Bar */}
                <div className="bg-stone-900/90 px-5 py-4 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-lg font-bold text-stone-100">
                      Order #{order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                    <span className="text-xs text-stone-400 font-medium px-2 py-0.5 rounded bg-stone-800 border border-stone-700/60">
                      {order.orderType === 'dine_in' ? `Dine-In • Table ${order.tableNumber}` : 'Takeaway Pickup'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-500" />
                      {formattedDate} at {formattedTime}
                    </span>
                    <span className="text-stone-600">•</span>
                    <span className="font-bold text-amber-400 text-sm tabular-nums">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="p-5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-3">
                    Ordered Dishes & Beverages ({order.items.reduce((s, i) => s + i.quantity, 0)})
                  </h4>

                  <div className="divide-y divide-stone-800/80">
                    {order.items.map((item, idx) => (
                      <div
                        key={`${item.itemId}-${idx}`}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-stone-100">
                              {item.quantity}x {item.name}
                            </span>
                            {item.variantName && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-800 text-amber-300 border border-stone-700">
                                {item.variantName}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-xs text-amber-400/80 italic mt-0.5">
                              "{item.notes}"
                            </p>
                          )}
                          <p className="text-xs text-stone-500 mt-0.5">
                            ${item.unitPrice.toFixed(2)} each • Total: ${(item.unitPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        {/* Individual Item Reorder Button */}
                        <button
                          onClick={() => reorderSingleItem(item)}
                          title={`Reorder 1x ${item.name} into cart`}
                          className="shrink-0 px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-amber-300 bg-stone-800/90 hover:bg-stone-800 border border-stone-700/80 hover:border-amber-500/40 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                          <span>Reorder Dish</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Customer Rating Section (if present) */}
                  {order.rating && (
                    <div className="mt-4 pt-4 border-t border-stone-800 bg-stone-950/40 rounded-xl p-3.5 border border-stone-800/60">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-stone-200">Your Dining Review</span>
                          <div className="flex items-center text-amber-400 text-xs ml-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= order.rating!.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-stone-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-stone-500">
                          Rated {new Date(order.rating.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {order.rating.aspects && order.rating.aspects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 my-1.5">
                          {order.rating.aspects.map((aspect, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            >
                              ★ {aspect}
                            </span>
                          ))}
                        </div>
                      )}

                      {order.rating.comment && (
                        <p className="text-xs text-stone-300 italic mt-1 bg-stone-900/60 p-2 rounded-lg border border-stone-800">
                          "{order.rating.comment}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rating Prompt for unrated served meals */}
                  {!order.rating && order.status === 'served' && (
                    <div className="mt-4 pt-3 border-t border-stone-800/60 flex items-center justify-between text-xs text-stone-400 bg-stone-950/30 p-3 rounded-xl border border-stone-800/40">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span>How was your experience with Order #{order.orderNumber}?</span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveOrderId(order.id);
                          if (onNavigateToTracker) {
                            onNavigateToTracker(order.id);
                          }
                        }}
                        className="text-amber-400 hover:text-amber-300 font-semibold hover:underline"
                      >
                        Submit Review →
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="bg-stone-950/70 px-5 py-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-stone-400 flex items-center gap-3">
                    <span>Subtotal: ${order.subtotal.toFixed(2)}</span>
                    <span className="text-stone-700">•</span>
                    <span>Tax: ${order.tax.toFixed(2)}</span>
                    <span className="text-stone-700">•</span>
                    <span className="font-semibold text-stone-200">Total: ${order.totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* View / Print Receipt */}
                    <button
                      onClick={() => setReceiptOrder(order)}
                      className="px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-750 border border-stone-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Receipt className="w-3.5 h-3.5 text-stone-400" />
                      <span>Receipt</span>
                    </button>

                    {/* Track Active Order */}
                    {isActiveOrder && onNavigateToTracker && (
                      <button
                        onClick={() => {
                          setActiveOrderId(order.id);
                          onNavigateToTracker(order.id);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Track Live Status</span>
                      </button>
                    )}

                    {/* 1-Click Reorder Whole Meal */}
                    <button
                      onClick={() => reorderWholeOrder(order)}
                      className="px-4 py-1.5 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reorder Meal</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
};
