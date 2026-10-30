import React from 'react';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import {
  ShoppingBag,
  ChefHat,
  Utensils,
  History,
  Bell,
  BellRing,
  BellOff,
  Radio,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    role, setRole, customerTab, setCustomerTab, customerUser, cart,
    setIsCartDrawerOpen, activeOrderId, notificationPermission,
    requestNotificationPermission, testNotification,
  } = useRestaurant();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const openCart = () => {
    setRole('customer');
    setIsCartDrawerOpen(true);
  };

  const navClass = (active: boolean) =>
    `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
      active
        ? 'bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30'
        : 'text-stone-300 hover:bg-stone-800 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-stone-950/95 text-stone-100 shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[minmax(220px,1fr)_auto_minmax(220px,1fr)] lg:gap-6 lg:px-8">
        <button
          type="button"
          onClick={() => { setRole('customer'); setCustomerTab('menu'); }}
          className="flex min-w-0 items-center gap-3 justify-self-start rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label="Hunger Helpers home"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-xl font-black text-stone-950 shadow-md shadow-amber-950/30">H</span>
          <span className="flex min-w-0 flex-col">
            <span className="font-serif text-lg font-bold leading-tight tracking-wide text-white sm:text-xl">Hunger Helpers</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Restaurant & Kitchen</span>
          </span>
        </button>

        <nav aria-label="Main navigation" className="flex w-full min-w-0 items-center justify-center gap-1.5 overflow-x-auto rounded-2xl bg-stone-900/80 p-1.5 lg:w-auto lg:gap-2">
          <button type="button" onClick={() => { setRole('customer'); setCustomerTab('menu'); }} className={navClass(role === 'customer' && customerTab === 'menu')}>
            <Utensils className="h-4 w-4" /><span>Menu</span>
          </button>
          <button type="button" onClick={() => { setRole('customer'); setCustomerTab('history'); }} className={navClass(role === 'customer' && customerTab === 'history')}>
            <History className="h-4 w-4" /><span>Past Orders</span>
          </button>
          {activeOrderId && (
            <button type="button" onClick={() => { setRole('customer'); setCustomerTab('tracker'); }} className={navClass(role === 'customer' && customerTab === 'tracker')}>
              <Radio className="h-4 w-4" /><span>Live Tracking</span>
            </button>
          )}
          <button type="button" onClick={() => setRole('kitchen')} className={navClass(role === 'kitchen')}>
            <ChefHat className="h-4 w-4" /><span>Kitchen KDS</span><span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">Live</span>
          </button>
        </nav>

        <div className="flex w-full items-center justify-between gap-2 justify-self-end sm:justify-end lg:w-auto">
          {customerUser && (
            <button type="button" onClick={() => { setRole('customer'); setCustomerTab('history'); }} title={`Signed in as ${customerUser.name}`} className="hidden min-h-11 max-w-40 items-center gap-2 rounded-xl px-3 text-sm text-stone-300 transition-colors hover:bg-stone-800 hover:text-amber-300 sm:flex">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 font-bold text-amber-300">{customerUser.name.charAt(0)}</span>
              <span className="truncate">{customerUser.name}</span>
            </button>
          )}
          {(
            <button
              type="button"
              onClick={async () => {
                if (notificationPermission !== 'granted') await requestNotificationPermission();
                else await testNotification();
              }}
              title={notificationPermission === 'granted' ? 'Test order notifications' : notificationPermission === 'denied' ? 'Notifications are blocked in browser settings' : 'Enable order-ready notifications'}
              aria-label="Notification settings"
              className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                notificationPermission === 'granted'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                  : notificationPermission === 'denied'
                    ? 'border-stone-700 bg-stone-900 text-stone-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              {notificationPermission === 'granted' ? <Bell className="h-4 w-4" /> : notificationPermission === 'denied' ? <BellOff className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
              <span className="hidden xl:inline">Alerts</span>
            </button>
          )}
          <button type="button" onClick={openCart} aria-label={`Open cart, ${totalCartCount} items`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-extrabold text-stone-950 shadow-md shadow-amber-950/25 transition-all hover:-translate-y-0.5 hover:bg-amber-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950">
              <ShoppingBag className="h-4 w-4" /><span>Cart</span>
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-stone-950 px-1.5 py-0.5 text-xs font-bold tabular-nums text-amber-300">{totalCartCount}</span>
            </button>
        </div>
      </div>
    </header>
  );
};
