import React from 'react';
import { Order } from '../types/restaurant.ts';
import { Printer, X, Check, Copy, FileText } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const receiptTime = new Date(order.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleCopyText = () => {
    const lines = [
      'AURA BISTRO - KITCHEN & DINING RECEIPT',
      '======================================',
      `Order Ticket: #${order.orderNumber}`,
      `Date: ${receiptDate} ${receiptTime}`,
      `Type: ${order.orderType === 'dine_in' ? `Dine-In (Table ${order.tableNumber})` : `Takeaway (${order.customerName})`}`,
      order.customerPhone ? `Contact: ${order.customerPhone}` : '',
      '--------------------------------------',
      ...order.items.map(
        (it) =>
          `${it.quantity}x ${it.name}${it.variantName ? ` (${it.variantName})` : ''} - $${it.itemTotal.toFixed(2)}${
            it.notes ? `\n   Note: ${it.notes}` : ''
          }`
      ),
      '--------------------------------------',
      `Subtotal:      $${order.subtotal.toFixed(2)}`,
      `Tax (5%):      $${order.tax.toFixed(2)}`,
      `TOTAL AMOUNT:  $${order.totalAmount.toFixed(2)}`,
      order.notes ? `Special Notes: ${order.notes}` : '',
      '======================================',
      'Thank you for dining with Aura Bistro!',
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Bar (Hidden during actual paper print) */}
        <div className="print:hidden p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <h3 className="font-serif text-sm font-bold text-stone-100">
              Order Receipt Ticket #{order.orderNumber}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors border border-stone-700"
              title="Copy Receipt Text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-lg transition-colors shadow-sm"
              title="Send to Printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thermal / Paper Receipt Body */}
        <div className="overflow-y-auto p-6 bg-stone-950/60 print:bg-white print:p-0">
          
          {/* Printable Ticket Slip */}
          <div
            id="printable-receipt"
            className="w-full max-w-sm mx-auto bg-stone-50 text-stone-950 rounded-xl p-6 font-mono text-xs shadow-xl border border-stone-200 print:shadow-none print:border-none print:p-2 print:max-w-none print:rounded-none"
          >
            {/* Header Lockup */}
            <div className="text-center pb-4 border-b border-dashed border-stone-400 space-y-1">
              <h2 className="font-serif font-black text-xl tracking-tight text-stone-950 uppercase">
                Aura Bistro
              </h2>
              <p className="text-[11px] text-stone-600 font-sans">
                Handcrafted Kitchen &amp; Wood-Fired Bar
              </p>
              <p className="text-[10px] text-stone-500">
                100 Artisan Way · Tel: +1 (555) 019-2834
              </p>
            </div>

            {/* Ticket Metadata */}
            <div className="py-3 border-b border-dashed border-stone-300 space-y-1 text-[11px]">
              <div className="flex justify-between font-bold text-stone-900">
                <span>ORDER TICKET:</span>
                <span className="text-sm">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>Date &amp; Time:</span>
                <span>{receiptDate} · {receiptTime}</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>Service Type:</span>
                <span className="font-bold uppercase">
                  {order.orderType === 'dine_in' ? `Table ${order.tableNumber}` : 'Takeaway Counter'}
                </span>
              </div>
              {order.customerName && (
                <div className="flex justify-between text-stone-700">
                  <span>Guest:</span>
                  <span>{order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ''}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600 text-[10px]">
                <span>Status:</span>
                <span className="uppercase font-semibold">{order.status}</span>
              </div>
            </div>

            {/* Items Column Header */}
            <div className="py-2 border-b border-stone-300 flex justify-between font-bold text-[10px] text-stone-600 uppercase">
              <span>Qty / Item Description</span>
              <span>Amount</span>
            </div>

            {/* Items List */}
            <div className="py-3 divide-y divide-stone-200 space-y-2">
              {order.items.map((it, idx) => (
                <div key={idx} className="pt-2 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5 flex-1 min-w-0">
                      <span className="font-bold text-stone-900 shrink-0">{it.quantity}x</span>
                      <div>
                        <span className="font-semibold text-stone-900 block leading-tight">{it.name}</span>
                        {it.variantName && (
                          <span className="text-[10px] text-stone-600 block">
                            Size: {it.variantName} (${it.unitPrice.toFixed(2)} ea)
                          </span>
                        )}
                        {it.notes && (
                          <span className="text-[10px] text-stone-700 italic block mt-0.5 bg-stone-100 p-1 rounded">
                            * {it.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold tabular-nums text-stone-900 shrink-0">
                      ${it.itemTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="pt-3 border-t-2 border-stone-950 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-stone-700">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>Sales Tax (5%)</span>
                <span className="tabular-nums font-medium">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-stone-950 pt-2 border-t border-dashed border-stone-400">
                <span>TOTAL PAID</span>
                <span className="tabular-nums font-black text-base">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Special Instructions */}
            {order.notes && (
              <div className="mt-3 p-2 bg-stone-100 border border-stone-300 rounded text-[10px] text-stone-800">
                <span className="font-bold uppercase block">Special Instructions:</span>
                <p className="italic">"{order.notes}"</p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-5 mt-4 border-t border-dashed border-stone-400 text-center space-y-1 text-[10px] text-stone-600">
              <p className="font-semibold text-stone-800">
                Thank you for dining with Aura Bistro!
              </p>
              <p>For inquiries or catering: chef@aurabistro.com</p>
              <p className="text-[9px] text-stone-400 pt-1">
                Generated via Aura Bistro KDS &middot; {receiptTime}
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="print:hidden p-4 border-t border-stone-800 bg-stone-900 flex items-center justify-between">
          <span className="text-xs text-stone-400">
            Thermal slip format ready for physical receipt or ticket print
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-stone-950 bg-amber-600 hover:bg-amber-500 rounded-xl transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
