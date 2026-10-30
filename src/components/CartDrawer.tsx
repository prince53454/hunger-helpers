import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import { OrderType, CreateOrderPayload } from '../types/restaurant.ts';
import * as api from '../services/api.ts';
import { getMenuImage } from '../utils/menuImages.ts';
import { X, Plus, Minus, Trash2, ShoppingBag, UtensilsCrossed, Package, AlertCircle } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    role,
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    setActiveOrderId,
    setRole,
    customerTab,
    setCustomerTab,
    customerUser,
    reloadCustomerOrders,
  } = useRestaurant();

  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState<number>(4);
  const [customerName, setCustomerName] = useState<string>(customerUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(customerUser?.phone || '');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Update customer fields if active guest user changes
  useEffect(() => {
    if (customerUser) {
      if (!customerName) setCustomerName(customerUser.name);
      if (!customerPhone && customerUser.phone) setCustomerPhone(customerUser.phone);
    }
  }, [customerUser]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authoritative server preview calculation
  const [isPriceCalculating, setIsPriceCalculating] = useState(false);
  const [serverCalculation, setServerCalculation] = useState<{
    subtotal: number;
    tax: number;
    totalAmount: number;
  } | null>(null);

  // Recalculate prices authoritatively on server whenever cart changes
  useEffect(() => {
    let isCurrentRequest = true;
    if (cart.length === 0) {
      setServerCalculation(null);
      setIsPriceCalculating(false);
      return () => { isCurrentRequest = false; };
    }

    const payloadItems = cart.map((ci) => ({
      itemId: ci.itemId,
      variantId: ci.variantId,
      quantity: ci.quantity,
      notes: ci.notes,
    }));

    setIsPriceCalculating(true);
    setServerCalculation(null);
    api
      .calculateOrderPrices(payloadItems)
      .then((res) => {
        if (!isCurrentRequest) return;
        setServerCalculation({
          subtotal: res.subtotal,
          tax: res.tax,
          totalAmount: res.totalAmount,
        });
        setErrorMessage(null);
      })
      .catch((err) => {
        if (!isCurrentRequest) return;
        setServerCalculation(null);
        setErrorMessage(err.message || 'Unable to calculate order pricing');
      })
      .finally(() => {
        if (isCurrentRequest) setIsPriceCalculating(false);
      });
    return () => { isCurrentRequest = false; };
  }, [cart]);

  if (!isCartDrawerOpen) return null;

  const handlePlaceOrder = async () => {
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Please add delicious dishes to order.');
      return;
    }
    if (isPriceCalculating || !serverCalculation) {
      setErrorMessage('Please wait while we verify your cart prices.');
      return;
    }

    if (orderType === 'dine_in') {
      if (!tableNumber || tableNumber < 1 || tableNumber > 100) {
        setErrorMessage('Please select a valid table number (1-100).');
        return;
      }
    } else {
      if (!customerName.trim() || customerName.trim().length < 2) {
        setErrorMessage('Please enter your name for takeaway pickup.');
        return;
      }
      if (!customerPhone.trim() || customerPhone.trim().length < 7) {
        setErrorMessage('Please enter a valid phone number for takeaway orders.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: CreateOrderPayload = {
        orderType,
        tableNumber: orderType === 'dine_in' ? Number(tableNumber) : undefined,
        customerName: orderType === 'takeaway' ? customerName.trim() : (customerUser?.name || undefined),
        customerPhone: orderType === 'takeaway' ? customerPhone.trim() : (customerUser?.phone || undefined),
        customerEmail: customerUser?.email || undefined,
        customerId: customerUser?.id || undefined,
        notes: orderNotes.trim() || undefined,
        items: cart.map((ci) => ({
          itemId: ci.itemId,
          variantId: ci.variantId,
          quantity: ci.quantity,
          notes: ci.notes,
        })),
      };

      // Server calculates authoritative prices and validates items & stock
      const createdOrder = await api.placeOrder(payload);

      // Successfully placed!
      clearCart();
      setIsCartDrawerOpen(false);
      setActiveOrderId(createdOrder.id);
      setRole('customer');
      setCustomerTab('tracker');
      reloadCustomerOrders();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please review your cart.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => setIsCartDrawerOpen(false)} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-stone-900 border-l border-stone-800 text-stone-100 flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <h2 className="font-serif text-lg font-bold text-stone-100">Your Dining Order</h2>
              <span className="text-xs text-stone-400">
                ({cart.reduce((s, i) => s + i.quantity, 0)} items)
              </span>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close cart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-stone-500 p-6 border border-dashed border-stone-800 rounded-2xl">
                <ShoppingBag className="w-10 h-10 stroke-1 mb-2 text-stone-600" />
                <p className="font-serif text-base text-stone-300">Your cart is currently empty</p>
                <p className="text-xs text-stone-500 mt-1">Explore our chef-curated menu to add dishes</p>
                <button
                  onClick={() => { setIsCartDrawerOpen(false); setRole('customer'); setCustomerTab('menu'); }}
                  className="mt-4 px-4 py-2 text-xs font-bold bg-amber-600 text-stone-950 rounded-xl hover:bg-amber-500 transition-colors"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((cartItem) => {
                  const variant = cartItem.item.variants?.find((v) => v.id === cartItem.variantId);
                  const unitPrice = variant ? variant.price : cartItem.item.basePrice;
                  const itemTotal = unitPrice * cartItem.quantity;

                  return (
                    <div
                      key={cartItem.cartId}
                      className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl flex gap-3 items-start"
                    >
                      {cartItem.item.image ? (
                        <img
                          src={getMenuImage(cartItem.item.image)}
                          alt={cartItem.item.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-lg object-cover bg-stone-900 shrink-0 border border-stone-800"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500 shrink-0 text-[9px] text-center">No photo</div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-stone-200 truncate">
                            {cartItem.item.name}
                          </h4>
                          <span className="text-sm font-bold tabular-nums text-amber-400 shrink-0">
                            ${itemTotal.toFixed(2)}
                          </span>
                        </div>

                        {variant && (
                          <span className="text-[11px] text-amber-500/90 block mt-0.5">
                            {variant.name} (${variant.price.toFixed(2)} ea)
                          </span>
                        )}

                        {cartItem.notes && (
                          <p className="text-xs text-stone-400 italic mt-1 bg-stone-900/60 p-1 rounded">
                            "{cartItem.notes}"
                          </p>
                        )}

                        {/* Quantity & Delete Controls */}
                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-lg px-2 py-0.5">
                            <button
                              onClick={() => updateCartQuantity(cartItem.cartId, -1)}
                              className="text-stone-400 hover:text-white p-0.5 transition-colors"
                              aria-label="Decrease"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold tabular-nums text-stone-200 w-4 text-center">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(cartItem.cartId, 1)}
                              className="text-stone-400 hover:text-white p-0.5 transition-colors"
                              aria-label="Increase"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(cartItem.cartId)}
                            className="text-stone-500 hover:text-rose-400 p-1 text-xs transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={clearCart}
                    className="text-xs text-stone-500 hover:text-stone-300 underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* Order Settings Form */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-stone-800 space-y-4">
                
                {/* Dining Option Toggle (Dine-in vs Takeaway) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Dining Preference
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-stone-950 border border-stone-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setOrderType('dine_in')}
                      className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                        orderType === 'dine_in'
                          ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>Dine-In (Table)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('takeaway')}
                      className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                        orderType === 'takeaway'
                          ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Takeaway (Pickup)</span>
                    </button>
                  </div>
                </div>

                {/* Table selector for Dine-in */}
                {orderType === 'dine_in' ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                      Select Table Number
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 12, 15].map((tbl) => (
                        <button
                          key={tbl}
                          type="button"
                          onClick={() => setTableNumber(tbl)}
                          className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                            tableNumber === tbl
                              ? 'bg-amber-500 text-stone-950 shadow-sm'
                              : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          T-{tbl}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400">Other Table:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={tableNumber}
                        onChange={(e) => setTableNumber(Number(e.target.value))}
                        className="w-20 bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                ) : (
                  /* Customer info for Takeaway */
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. +1 (555) 019-2834"
                        className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* Chef Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                    Special Dining Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Allergies, birthday celebration, seating requests..."
                    maxLength={200}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

              </div>
            )}
          </div>

          {/* Footer & Server Price Calculation Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-stone-200">
                    {isPriceCalculating ? 'Calculating…' : `${(serverCalculation?.subtotal ?? 0).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sales Tax (5%)</span>
                  <span className="tabular-nums font-medium text-stone-200">
                    {isPriceCalculating ? 'Calculating…' : `${(serverCalculation?.tax ?? 0).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-stone-100 text-sm font-bold pt-2 border-t border-stone-800">
                  <span>Authoritative Total</span>
                  <span className="tabular-nums text-amber-400 font-serif text-base">
                    {isPriceCalculating ? 'Calculating…' : `${(serverCalculation?.totalAmount ?? 0).toFixed(2)}`}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 text-right">
                  Prices verified & calculated server-side from active menu
                </p>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting || isPriceCalculating || !serverCalculation}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying & Sending Order...</span>
                  </>
                ) : (
                  <span>
                    {isPriceCalculating ? 'Verifying cart…' : `Send Order to Kitchen • ${(serverCalculation?.totalAmount ?? 0).toFixed(2)}`}
                  </span>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
