import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import { OrderStatus } from '../types/restaurant.ts';
import {
  CheckCircle2,
  Clock,
  Flame,
  BellRing,
  UtensilsCrossed,
  ArrowLeft,
  Receipt,
  Sparkles,
  Bell,
  Check,
  Volume2,
} from 'lucide-react';

import { CustomerSatisfactionRating } from './CustomerSatisfactionRating.tsx';

const STATUS_STEPS: { key: OrderStatus; label: string; icon: any; description: string }[] = [
  {
    key: 'received',
    label: 'Received',
    icon: Clock,
    description: 'Ticket received by kitchen expo line',
  },
  {
    key: 'preparing',
    label: 'Preparing',
    icon: Flame,
    description: 'Chef is firing pans and wood-fired oven',
  },
  {
    key: 'ready',
    label: 'Ready',
    icon: BellRing,
    description: 'Plated and ready for runner or pickup counter',
  },
  {
    key: 'served',
    label: 'Served',
    icon: UtensilsCrossed,
    description: 'Delivered to your table / picked up',
  },
];

export const CustomerOrderTracker: React.FC = () => {
  const {
    activeOrder,
    setActiveOrderId,
    setRole,
    kitchenOrders,
    reloadActiveOrder,
    notificationPermission,
    requestNotificationPermission,
    testNotification,
  } = useRestaurant();

  const [testSuccess, setTestSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  if (!activeOrder) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center space-y-4">
          <Receipt className="w-12 h-12 text-stone-600 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-stone-200">No Active Order Selected</h2>
          <p className="text-sm text-stone-400">
            Browse our menu and place an order to watch live kitchen updates here.
          </p>
          <button
            onClick={() => setRole('customer')}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm rounded-xl transition-colors"
          >
            Explore Menu
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === activeOrder.status);
  const isCancelled = activeOrder.status === 'cancelled';
  const isCompleted = activeOrder.status === 'served';

  // Calculate elapsed minutes since order placed
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(activeOrder.createdAt).getTime()) / 60000)
  );

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-20">
      
      {/* Top Banner & Return */}
      <div className="border-b border-stone-800 bg-stone-900/60 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              // Return to menu without clearing order id
              setRole('customer');
            }}
            className="flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Real-Time Tracker Connected</span>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Main Status Hero Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-amber-500 font-bold">
                  Order #{activeOrder.orderNumber}
                </span>
                <span className="text-stone-500">·</span>
                <span className="text-xs text-stone-400">
                  {new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({elapsedMinutes}m ago)
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 mt-1">
                {activeOrder.orderType === 'dine_in'
                  ? `Table ${activeOrder.tableNumber}`
                  : `Takeaway for ${activeOrder.customerName}`}
              </h1>
            </div>

            {/* Current Status Pill */}
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                  isCancelled
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                }`}
              >
                {activeOrder.status}
              </span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          {!isCancelled ? (
            <div className="py-8">
              <div className="relative">
                {/* Connecting track line */}
                <div className="absolute top-5 left-4 right-4 h-0.5 bg-stone-800 -z-0" />
                <div
                  className="absolute top-5 left-4 h-0.5 bg-amber-500 transition-all duration-700 -z-0"
                  style={{
                    width: `${Math.min(100, Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 96))}%`,
                  }}
                />

                <div className="grid grid-cols-4 relative z-10">
                  {STATUS_STEPS.map((step, idx) => {
                    const isStepCompleted = currentStepIndex > idx;
                    const isCurrent = currentStepIndex === idx;
                    const IconComponent = step.icon;

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                            isCurrent
                              ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-500/20 scale-110 shadow-lg'
                              : isStepCompleted
                              ? 'bg-stone-800 border-2 border-amber-500 text-amber-400'
                              : 'bg-stone-800 border-2 border-stone-700 text-stone-500'
                          }`}
                        >
                          {isStepCompleted ? (
                            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <IconComponent className="w-5 h-5" />
                          )}
                        </div>

                        <span
                          className={`mt-3 text-xs font-bold ${
                            isCurrent
                              ? 'text-amber-400'
                              : isStepCompleted
                              ? 'text-stone-200'
                              : 'text-stone-500'
                          }`}
                        >
                          {step.label}
                        </span>

                        <span className="hidden sm:block text-[11px] text-stone-500 mt-1 max-w-[120px] leading-tight">
                          {step.description}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Announcement Box */}
              <div className="mt-8 p-4 bg-stone-950/80 border border-stone-800 rounded-xl flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="text-xs text-stone-300">
                  {activeOrder.status === 'received' && (
                    <span>Your order is queued in our kitchen. Kitchen staff will begin preparation shortly.</span>
                  )}
                  {activeOrder.status === 'preparing' && (
                    <span className="text-amber-300 font-medium">The chef is actively preparing your dishes. Wood-fired pizza and pasta are on the line!</span>
                  )}
                  {activeOrder.status === 'ready' && (
                    <span className="text-emerald-400 font-medium">Your dishes are plated and ready! A food runner is bringing them to Table {activeOrder.tableNumber} (or pickup counter).</span>
                  )}
                  {activeOrder.status === 'served' && (
                    <span className="text-amber-300 font-medium">All items have been served! Please rate your dining satisfaction below to let our chef &amp; staff know how we did.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-rose-400">
              <p className="font-serif text-lg font-bold">This order was cancelled.</p>
            </div>
          )}

          {/* Action to Place another order or start new ticket */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-stone-800 text-xs gap-3">
            <button
              onClick={() => {
                setActiveOrderId(null);
                setRole('customer');
              }}
              className="text-stone-400 hover:text-stone-200 underline"
            >
              Order Additional Dishes
            </button>

            {/* Quick Demo Ticket Switcher */}
            <div className="flex items-center gap-1.5 text-stone-400 text-[11px] overflow-x-auto max-w-full py-1">
              <span className="text-stone-500">Demo Tickets:</span>
              {kitchenOrders.slice(0, 5).map((o) => (
                <button
                  key={o.id}
                  onClick={() => setActiveOrderId(o.id)}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] transition-colors ${
                    activeOrder.id === o.id
                      ? 'bg-amber-600 text-stone-950 font-bold'
                      : 'bg-stone-800 text-stone-400 hover:text-white'
                  }`}
                  title={`Switch to ticket #${o.orderNumber} (${o.status})`}
                >
                  #{o.orderNumber} ({o.status})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BROWSER NOTIFICATION STATUS & CONTROLLER */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : notificationPermission === 'denied'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              <Bell className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-stone-200">
                  {notificationPermission === 'granted'
                    ? 'Browser Notifications Active'
                    : notificationPermission === 'denied'
                    ? 'Desktop Notifications Muted'
                    : 'Get Notified When Food is Ready'}
                </h4>
                {notificationPermission === 'granted' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
                {notificationPermission === 'granted'
                  ? `You will receive a system push alert and audible chime the moment Order #${activeOrder.orderNumber} is marked 'Ready', even when this tab is backgrounded or minimized.`
                  : notificationPermission === 'denied'
                  ? 'Push notifications are blocked in your browser settings. In-app floating toasts and sound chimes will alert you instead.'
                  : `Enable push notifications so you never miss your order call while switching apps, checking email, or browsing other tabs.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {notificationPermission !== 'granted' && (
              <button
                onClick={async () => {
                  await requestNotificationPermission();
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Enable Notifications</span>
              </button>
            )}

            {notificationPermission === 'granted' && (
              <button
                onClick={async () => {
                  setIsTesting(true);
                  const ok = await testNotification();
                  setTestSuccess(ok);
                  setTimeout(() => setTestSuccess(false), 3000);
                  setIsTesting(false);
                }}
                disabled={isTesting}
                className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-medium text-xs rounded-xl border border-stone-700 transition-colors flex items-center gap-1.5"
              >
                {testSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Test Sent!</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Test Notification</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* CUSTOMER SATISFACTION RATING SECTION: Appears when order is marked as 'Served' */}
        {(activeOrder.status === 'served' || activeOrder.rating) && (
          <div className="animate-in slide-in-from-bottom duration-500">
            <CustomerSatisfactionRating
              order={activeOrder}
              onRatingSubmitted={() => {
                reloadActiveOrder();
              }}
            />
          </div>
        )}

        {/* Order Receipt Details Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <h3 className="font-serif text-lg font-bold text-stone-100">Itemized Ticket</h3>
            <span className="text-xs text-stone-400">
              {activeOrder.items.reduce((s, i) => s + i.quantity, 0)} Items Total
            </span>
          </div>

          <div className="divide-y divide-stone-800/60">
            {activeOrder.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-500 tabular-nums text-sm">
                      {item.quantity}x
                    </span>
                    <span className="text-sm font-semibold text-stone-200">
                      {item.name}
                    </span>
                  </div>
                  {item.variantName && (
                    <span className="text-xs text-stone-400 block mt-0.5">
                      Portion: {item.variantName}
                    </span>
                  )}
                  {item.notes && (
                    <p className="text-xs text-stone-400 italic mt-0.5 bg-stone-950 px-2 py-0.5 rounded">
                      Note: {item.notes}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold tabular-nums text-stone-200">
                    ${item.itemTotal.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-stone-500 block tabular-nums">
                    ${item.unitPrice.toFixed(2)} ea
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="pt-4 border-t border-stone-800 space-y-2 text-xs text-stone-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium text-stone-200">
                ${activeOrder.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span className="tabular-nums font-medium text-stone-200">
                ${activeOrder.tax.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-stone-100 pt-2 border-t border-stone-800">
              <span className="font-serif">Total Charged</span>
              <span className="text-amber-400 tabular-nums font-serif text-base">
                ${activeOrder.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Customer / Table Notes */}
          {activeOrder.notes && (
            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-400">
              <span className="font-bold text-stone-300 block mb-0.5">Special Instructions:</span>
              <p className="italic">"{activeOrder.notes}"</p>
            </div>
          )}

          {/* Status Timeline History Log */}
          {activeOrder.statusHistory && activeOrder.statusHistory.length > 0 && (
            <div className="pt-4 border-t border-stone-800">
              <span className="text-xs font-semibold text-stone-400 block mb-3 uppercase tracking-wider">
                Event Activity Log
              </span>
              <div className="space-y-2 text-xs">
                {activeOrder.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-stone-400">
                    <span className="tabular-nums text-stone-500">
                      {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-amber-500/80">·</span>
                    <span className="capitalize font-medium text-stone-300">{h.status}:</span>
                    <span>{h.note || 'Status recorded'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
};
