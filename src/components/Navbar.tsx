import React from 'react';
import { useRestaurant, RoleType } from '../context/RestaurantContext.tsx';
import {
  ShoppingBag,
  ChefHat,
  Utensils,
  History,
  User,
  Bell,
  BellRing,
  BellOff,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    role,
    setRole,
    customerTab,
    setCustomerTab,
    customerUser,
    cart,
    setIsCartDrawerOpen,
    activeOrderId,
    notificationPermission,
    requestNotificationPermission,
    testNotification,
  } = useRestaurant();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 backdrop-blur-md bg-opacity-95 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 py-2 lg:flex-nowrap">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setRole('customer');
                setCustomerTab('menu');
              }}
              className="text-left group flex items-center gap-2.5 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-stone-950 font-serif font-bold text-lg shadow-inner">
                H
              </div>
              <div>
                <span className="font-serif text-lg font-bold tracking-tight text-stone-100 group-hover:text-amber-400 transition-colors whitespace-nowrap">
                  Hunger Helpers
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs text-stone-400 font-sans tracking-widest uppercase">
                  Restaurant Operations
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Role & View Navigation */}
          <nav className="order-3 flex w-full min-w-0 flex-1 items-center justify-start gap-2 overflow-x-auto py-1 scrollbar-none lg:order-none lg:w-auto lg:justify-center">
            <button
              onClick={() => {
                setRole('customer');
                setCustomerTab('menu');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                role === 'customer' && customerTab === 'menu'
                  ? 'bg-stone-800 text-amber-400 font-semibold'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              <span>Customer</span>
            </button>

            {/* Past Orders History tab for Customer */}
            <button
              onClick={() => {
                setRole('customer');
                setCustomerTab('history');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                role === 'customer' && customerTab === 'history'
                  ? 'bg-stone-800 text-amber-400 font-semibold'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              <span>Past Orders</span>
            </button>

            {activeOrderId && (
              <button
                onClick={() => {
                  setRole('customer');
                  setCustomerTab('tracker');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  role === 'customer' && customerTab === 'tracker'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Order</span>
              </button>
            )}

            <button
              onClick={() => setRole('kitchen')}
              aria-label="Open Kitchen Display System"
              title="Open the live cook screen: received, preparing, ready, and completed orders"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap shrink-0 border shadow-sm ${
                role === 'kitchen'
                  ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-amber-950/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-stone-950 border-amber-500 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Kitchen KDS</span>
              <span className="hidden xl:inline text-[10px] uppercase tracking-wide opacity-75">Live</span>
            </button>

   </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Browser Notification Indicator / Permission Button */}
            {role === 'customer' && (
              <button
                onClick={async () => {
                  if (notificationPermission !== 'granted') {
                    await requestNotificationPermission();
                  } else {
                    await testNotification();
                  }
                }}
                title={
                  notificationPermission === 'granted'
                    ? 'Desktop Push Notifications: Enabled. Click to test alert chime & notification.'
                    : notificationPermission === 'denied'
                    ? 'Desktop Notifications: Blocked in browser settings.'
                    : 'Click to enable browser notifications for order ready alerts.'
                }
                className={`p-1.5 sm:px-2.5 sm:py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : notificationPermission === 'denied'
                    ? 'bg-stone-800 text-stone-500 border-stone-700/60'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
                }`}
              >
                {notificationPermission === 'granted' ? (
                  <>
                    <Bell className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden xl:inline text-[11px] font-medium">Alerts Active</span>
                  </>
                ) : notificationPermission === 'denied' ? (
                  <BellOff className="w-3.5 h-3.5" />
                ) : (
                  <>
                    <BellRing className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden xl:inline text-[11px] font-semibold">Enable Alerts</span>
                  </>
                )}
              </button>
            )}
            {role === 'customer' && customerUser && (
              <button
                onClick={() => {
                  setCustomerTab('history');
                }}
                title={`Signed in as ${customerUser.name} (${customerUser.email}). Click to view past orders.`}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-300 hover:text-amber-400 bg-stone-800/80 hover:bg-stone-800 rounded-lg border border-stone-700/60 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                  {customerUser.name.charAt(0)}
                </div>
                <span className="font-medium truncate max-w-[100px]">{customerUser.name}</span>
              </button>
            )}

            {/* Shopping Cart button for Customer */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap shadow-sm"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {totalCartCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold bg-stone-950 text-amber-400 rounded-md tabular-nums">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
