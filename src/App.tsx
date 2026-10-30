import React from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { CustomerMenu } from './components/CustomerMenu.tsx';
import { CustomerOrderTracker } from './components/CustomerOrderTracker.tsx';
import { KitchenDisplay } from './components/KitchenDisplay.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { PastOrders } from './components/PastOrders.tsx';
import { NotificationToast } from './components/NotificationToast.tsx';
import { ShoppingBag, History } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    role,
    setRole,
    customerTab,
    setCustomerTab,
    activeOrderId,
    setActiveOrderId,
    cart,
    setIsCartDrawerOpen,
    toastNotification,
    dismissToastNotification,
  } = useRestaurant();

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Content switcher
  const renderContent = () => {
    if (role === 'kitchen') {
      return <KitchenDisplay />;
    }
    if (role === 'admin') {
      return <AdminDashboard />;
    }

    // Customer role: switch between menu, order history, and live tracker
    if (customerTab === 'history') {
      return (
        <PastOrders
          onNavigateToMenu={() => setCustomerTab('menu')}
          onNavigateToTracker={(orderId) => {
            setActiveOrderId(orderId);
            setCustomerTab('tracker');
          }}
        />
      );
    }
    if (customerTab === 'tracker' && activeOrderId) {
      return <CustomerOrderTracker />;
    }
    return <CustomerMenu />;
  };

  const appContent = (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      <Navbar />

      {/* Secondary Subnav for Customer */}
      {role === 'customer' && (
        <div className="bg-stone-900 border-b border-stone-800 px-4 py-2 sticky top-[6.5rem] lg:top-16 z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomerTab('menu')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  customerTab === 'menu'
                    ? 'bg-stone-800 text-stone-100 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Browse Menu
              </button>

              <button
                onClick={() => setCustomerTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  customerTab === 'history'
                    ? 'bg-stone-800 text-amber-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <History className="w-3.5 h-3.5 text-amber-500" />
                <span>Past Orders</span>
              </button>

              {activeOrderId && (
                <button
                  onClick={() => setCustomerTab('tracker')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    customerTab === 'tracker'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Tracker</span>
                </button>
              )}
            </div>

            <span className="text-stone-500 hidden sm:inline">
              Real-time SSE updates enabled
            </span>
          </div>
        </div>
      )}

      {/* Main Role Content */}
      <div className="flex-1">
        {renderContent()}
      </div>

      {/* Floating Bottom Cart Bar for Mobile View */}
      {role === 'customer' && cartTotalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:hidden z-30 animate-in slide-in-from-bottom duration-200">
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm rounded-2xl shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>View Dining Cart ({cartTotalItems})</span>
            </div>
            <span>Checkout →</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Global Notification Toast Alert */}
      <NotificationToast
        toast={toastNotification}
        onDismiss={dismissToastNotification}
        onViewOrder={(orderId) => {
          setActiveOrderId(orderId);
          setRole('customer');
          setCustomerTab('tracker');
        }}
      />
    </div>
  );

  return appContent;
};

export default function App() {
  return (
    <RestaurantProvider>
      <MainLayout />
    </RestaurantProvider>
  );
}
