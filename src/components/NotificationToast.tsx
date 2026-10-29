import React, { useEffect, useState } from 'react';
import { BellRing, CheckCircle, ChevronRight, X, Volume2, ShieldCheck } from 'lucide-react';
import { Order } from '../types/restaurant.ts';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '../services/notifications.ts';

export interface ToastPayload {
  id: string;
  order: Order;
  title: string;
  message: string;
  createdAt: number;
}

interface NotificationToastProps {
  toast: ToastPayload | null;
  onDismiss: () => void;
  onViewOrder: (orderId: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  toast,
  onDismiss,
  onViewOrder,
}) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, [toast]);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 10000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const handleEnableDesktop = async () => {
    setIsRequesting(true);
    const newPerm = await requestNotificationPermission();
    setPermission(newPerm);
    setIsRequesting(false);
  };

  const { order } = toast;
  const destination =
    order.orderType === 'dine_in'
      ? `Table ${order.tableNumber}`
      : `Takeaway · ${order.customerName}`;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-stone-900/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl text-stone-100 ring-1 ring-amber-500/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            {/* Pulsing Icon */}
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {toast.title}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-stone-400">Just now</span>
              </div>

              <h4 className="font-serif text-base font-bold text-stone-100 mt-0.5 truncate">
                Order #{order.orderNumber} is Ready!
              </h4>

              <p className="text-xs text-stone-300 mt-0.5">
                {destination} — Plated & waiting for you
              </p>

              {/* Items summary */}
              <div className="mt-2 text-xs text-stone-400 bg-stone-950/60 rounded-lg p-2 border border-stone-800">
                <span className="text-stone-300 font-medium">Items: </span>
                {order.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
              </div>
            </div>
          </div>

          <button
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
          {/* Permission Quick Status/Prompt */}
          {permission === 'default' && (
            <button
              onClick={handleEnableDesktop}
              disabled={isRequesting}
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Allow desktop alerts</span>
            </button>
          )}

          {permission === 'granted' && (
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Desktop alert sent</span>
            </div>
          )}

          {permission !== 'default' && permission !== 'granted' && (
            <span className="text-[11px] text-stone-500">Live order tracker</span>
          )}

          <button
            onClick={() => {
              onViewOrder(order.id);
              onDismiss();
            }}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm ml-auto"
          >
            <span>View Tracker</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
