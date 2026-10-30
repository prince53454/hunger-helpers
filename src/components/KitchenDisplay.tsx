import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import { Order, OrderStatus } from '../types/restaurant.ts';
import * as api from '../services/api.ts';
import {
  ChefHat,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  RotateCcw,
  Timer,
  AlertOctagon,
  Sparkles,
  Printer,
  XCircle,
} from 'lucide-react';
import { playNewOrderChime } from '../utils/audio.ts';
import { ReceiptModal } from './ReceiptModal.tsx';

export const KitchenDisplay: React.FC = () => {
  const {
    kitchenOrders,
    advanceOrderStatus,
    soundEnabled,
    setSoundEnabled,
    loadingOrders,
    resetDemo,
  } = useRestaurant();

  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Second-by-second live timer tick for exact visual countdown and elapsed tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate counts
  const receivedCount = kitchenOrders.filter((o) => o.status === 'received').length;
  const preparingCount = kitchenOrders.filter((o) => o.status === 'preparing').length;
  const readyCount = kitchenOrders.filter((o) => o.status === 'ready').length;
  const activeCount = receivedCount + preparingCount + readyCount;

  // Check which orders have exceeded 15 minutes in 'received' or 'preparing' status
  const delayedOrders = kitchenOrders.filter((o) => {
    if (!['received', 'preparing'].includes(o.status)) return false;
    const elapsedSec = (currentTime - new Date(o.createdAt).getTime()) / 1000;
    return elapsedSec >= 15 * 60; // 15 minutes in seconds
  });
  const delayedCount = delayedOrders.length;

  // Filter orders based on selected tab
  const filteredOrders = kitchenOrders.filter((order) => {
    if (statusFilter === 'delayed') {
      if (!['received', 'preparing'].includes(order.status)) return false;
      const elapsedSec = (currentTime - new Date(order.createdAt).getTime()) / 1000;
      return elapsedSec >= 15 * 60;
    }
    if (statusFilter === 'active') {
      return ['received', 'preparing', 'ready'].includes(order.status);
    }
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-20">
      
      {/* Kitchen KDS Top Header */}
      <header className="sticky top-[6.5rem] lg:top-16 z-30 bg-stone-900 border-b border-stone-800 px-4 sm:px-6 lg:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-stone-950 shadow-inner">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg font-bold text-stone-100">
                  Kitchen Display System (KDS)
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-stone-400 font-mono uppercase tracking-widest">
                  Live Feed · 1s Sync
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {activeCount} active in queue · {receivedCount} received · {preparingCount} cooking · {readyCount} ready
              </p>
            </div>
          </div>

          {/* Quick Delayed Badge + Audio Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {delayedCount > 0 ? (
              <button
                onClick={() => setStatusFilter('delayed')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/90 hover:bg-red-900 border-2 border-red-600 text-red-200 rounded-lg text-xs font-bold animate-pulse transition-all shadow-lg shadow-red-950/50"
                title="Click to filter delayed tickets waiting > 15 minutes"
              >
                <AlertOctagon className="w-4 h-4 text-red-400 fill-red-400/20" />
                <span>{delayedCount} Delayed (&gt; 15m) — View Alert</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800/60 border border-stone-700/60 text-stone-400 rounded-lg text-xs">
                <Timer className="w-3.5 h-3.5 text-emerald-400" />
                <span>All tickets under 15m target</span>
              </div>
            )}

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Kitchen Audio' : 'Enable Kitchen Audio'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                soundEnabled
                  ? 'bg-stone-800 border-stone-700 text-amber-400 hover:bg-stone-700'
                  : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
            </button>

            <button
              onClick={() => playNewOrderChime()}
              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium border border-stone-700 transition-colors"
              title="Test Order Chime"
            >
              Test Chime
            </button>

            <button
              onClick={resetDemo}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 rounded-lg text-xs font-medium border border-stone-700 transition-colors"
              title="Reset Demo Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

        </div>

        {/* Status Filter Tabs Bar */}
        <div className="max-w-7xl mx-auto pt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'active', label: `Active (${activeCount})` },
            ...(delayedCount > 0
              ? [{ id: 'delayed', label: `🚨 Delayed > 15m (${delayedCount})` }]
              : []),
            { id: 'received', label: `New Received (${receivedCount})` },
            { id: 'preparing', label: `Cooking (${preparingCount})` },
            { id: 'ready', label: `Plated Ready (${readyCount})` },
            { id: 'served', label: 'Served / Done' },
            { id: 'all', label: `All Tickets (${kitchenOrders.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? tab.id === 'delayed'
                    ? 'bg-red-600 text-white font-extrabold shadow-md'
                    : 'bg-amber-600 text-stone-950 shadow-sm'
                  : tab.id === 'delayed'
                  ? 'bg-red-950/70 border border-red-700 text-red-300 hover:bg-red-900/60'
                  : 'bg-stone-950/70 border border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main KDS Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loadingOrders ? (
          <div className="py-20 text-center text-stone-500">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Connecting to live kitchen feed...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-stone-500 border border-dashed border-stone-800 rounded-2xl p-8">
            <ChefHat className="w-12 h-12 stroke-1 mx-auto mb-2 text-stone-600" />
            <p className="font-serif text-lg text-stone-300">All caught up on this station!</p>
            <p className="text-xs text-stone-500 mt-1">
              {statusFilter === 'delayed'
                ? 'Great job! Zero orders have exceeded the 15-minute wait threshold.'
                : 'No orders currently match the selected status filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredOrders.map((order) => {
              const elapsedSeconds = Math.max(
                0,
                Math.floor((currentTime - new Date(order.createdAt).getTime()) / 1000)
              );
              const elapsedMinutes = Math.floor(elapsedSeconds / 60);
              const elapsedRemainderSec = elapsedSeconds % 60;
              
              // 15-Minute Threshold Rule
              const isActiveCookingState = ['received', 'preparing'].includes(order.status);
              const isOver15Min = isActiveCookingState && elapsedMinutes >= 15;

              // Overdue calculation
              const overdueSec = isOver15Min ? elapsedSeconds - 15 * 60 : 0;
              const overdueMin = Math.floor(overdueSec / 60);
              const overdueRemainderSec = overdueSec % 60;

              // Percentage of 15-minute wait goal (900 seconds)
              const waitGoalSec = 15 * 60;
              const timerProgressPct = Math.min(100, (elapsedSeconds / waitGoalSec) * 100);

              return (
                <div
                  key={order.id}
                  className={`relative rounded-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                    isOver15Min
                      ? 'bg-red-950/30 border-2 border-red-500 shadow-2xl shadow-red-950/80 ring-4 ring-red-600/30'
                      : order.status === 'ready'
                      ? 'bg-stone-900 border-2 border-emerald-600/60 shadow-lg'
                      : order.status === 'preparing'
                      ? 'bg-stone-900 border border-amber-500/40 shadow-md'
                      : 'bg-stone-900 border border-stone-800 shadow-sm'
                  }`}
                >
                  {/* VISUAL TIMER HIGHLIGHT BANNER: Red alert when in Received or Preparing for > 15m */}
                  {isOver15Min ? (
                    <div className="bg-red-600 text-white font-extrabold px-3 py-1.5 text-xs uppercase tracking-wider flex items-center justify-between animate-pulse shadow-md">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 fill-white text-red-600 stroke-[2.5]" />
                        <span>OVERDUE &gt; 15 MIN IN KITCHEN</span>
                      </span>
                      <span className="tabular-nums font-mono bg-red-950/70 text-red-200 px-1.5 py-0.5 rounded text-[11px]">
                        +{overdueMin}m {overdueRemainderSec}s late
                      </span>
                    </div>
                  ) : isActiveCookingState ? (
                    /* Visual Linear Timer Gauge for Orders in Progress Under 15m */
                    <div className="bg-stone-950 px-3 py-1.5 border-b border-stone-800 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                        <span className="text-stone-400 flex items-center gap-1">
                          <Timer className={`w-3 h-3 ${elapsedMinutes >= 10 ? 'text-amber-400' : 'text-emerald-400'}`} />
                          <span>Wait Timer:</span>
                        </span>
                        <span className={`font-bold ${elapsedMinutes >= 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {String(elapsedMinutes).padStart(2, '0')}:{String(elapsedRemainderSec).padStart(2, '0')} / 15:00
                        </span>
                      </div>
                      
                      {/* Visual progress bar towards 15m limit */}
                      <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            elapsedMinutes >= 10 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${timerProgressPct}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Card Header */}
                  <div className={`p-4 border-b border-stone-800/80 ${isOver15Min ? 'bg-red-950/40' : 'bg-stone-950/40'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-amber-400">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            order.orderType === 'dine_in'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}
                        >
                          {order.orderType === 'dine_in' ? `Table ${order.tableNumber}` : 'Takeaway'}
                        </span>
                      </div>

                      {/* Actions: Print Slip & Visual Timer */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setReceiptOrder(order)}
                          className="flex items-center gap-1 px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg border border-stone-700 text-[11px] font-semibold transition-colors shadow-xs"
                          title="Print thermal kitchen slip / receipt"
                        >
                          <Printer className="w-3 h-3 text-amber-400" />
                          <span>Print Slip</span>
                        </button>

                        {/* Prominent Visual Timer Counter */}
                        <div
                          className={`flex items-center gap-1 text-xs font-mono font-bold tabular-nums px-2.5 py-1 rounded-lg border ${
                            isOver15Min
                              ? 'text-red-200 bg-red-950 border-red-600 animate-pulse'
                              : elapsedMinutes >= 10 && isActiveCookingState
                              ? 'text-amber-300 bg-amber-950/60 border-amber-800'
                              : 'text-stone-300 bg-stone-800/80 border-stone-700'
                          }`}
                          title="Total time elapsed since order was placed"
                        >
                          <Clock className={`w-3.5 h-3.5 ${isOver15Min ? 'text-red-400' : ''}`} />
                          <span>
                            {String(elapsedMinutes).padStart(2, '0')}:{String(elapsedRemainderSec).padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {order.customerName && (
                      <p className="text-xs text-stone-300 font-medium mt-1 truncate">
                        Customer: {order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ''}
                      </p>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-72">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="border-b border-stone-800/50 pb-2.5 last:border-none last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span
                              className={`w-6 h-6 rounded font-bold text-xs flex items-center justify-center shrink-0 tabular-nums ${
                                isOver15Min
                                  ? 'bg-red-900/60 text-red-200 border border-red-700'
                                  : 'bg-stone-800 text-amber-400'
                              }`}
                            >
                              {item.quantity}x
                            </span>
                            <div>
                              <span className={`text-sm font-bold ${isOver15Min ? 'text-red-100' : 'text-stone-100'}`}>
                                {item.name}
                              </span>
                              {item.variantName && (
                                <span className="block text-xs font-medium text-amber-500/90">
                                  {item.variantName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {item.notes && (
                          <div className="mt-1 ml-8 text-xs text-amber-200/90 bg-amber-950/40 border border-amber-900/60 rounded px-2 py-0.5 italic">
                            "{item.notes}"
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Order General Notes */}
                    {order.notes && (
                      <div className="mt-2 p-2 rounded-lg bg-stone-950 border border-amber-800/40 text-xs text-amber-300">
                        <span className="font-bold uppercase text-[10px] block">Table Note:</span>
                        <span>{order.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Workflow Button (Received -> Preparing -> Ready -> Served) */}
                  <div className="p-3 bg-stone-950/90 border-t border-stone-800">
                    {order.status === 'received' && (
                      <button
                        onClick={() => advanceOrderStatus(order.id, 'preparing', 'Kitchen started preparation')}
                        className={`w-full py-2.5 px-3 active:scale-98 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md ${
                          isOver15Min
                            ? 'bg-red-600 hover:bg-red-500 text-white animate-bounce'
                            : 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                        }`}
                      >
                        <Flame className={`w-4 h-4 ${isOver15Min ? 'fill-white' : 'fill-stone-950'}`} />
                        <span>Start Cooking (Expedite)</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => advanceOrderStatus(order.id, 'ready', 'Plated and ready for pickup')}
                        className={`w-full py-2.5 px-3 active:scale-98 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md ${
                          isOver15Min
                            ? 'bg-red-600 hover:bg-red-500 text-white font-extrabold'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-stone-950'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Plated & Ready {isOver15Min ? '(Priority)' : ''}</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => advanceOrderStatus(order.id, 'served', 'Delivered to table/customer')}
                        className="w-full py-2.5 px-3 bg-stone-800 hover:bg-stone-700 active:scale-98 text-stone-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-stone-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Complete (Mark Served)</span>
                      </button>
                    )}

                    {order.status === 'served' && (
                      <div className="py-1 text-center text-xs text-stone-500 font-medium">
                        Completed & Served
                      </div>
                    )}

                    {(['received', 'preparing'] as OrderStatus[]).includes(order.status) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Cancel order #${order.orderNumber}? This cannot be undone.`
                            )
                          ) {
                            api
                              .cancelOrder(order.id, 'Cancelled from kitchen KDS')
                              .catch((err: any) =>
                                alert(err.message || 'Failed to cancel order')
                              );
                          }
                        }}
                        className="w-full py-2 px-3 mt-2 active:scale-98 font-bold text-xs rounded-xl flex items-center justify-center gap-2 bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-800/60 transition-colors shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Ticket</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Printable Receipt Modal */}
      <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
    </div>
  );
};
