import React, { useState } from 'react';
import { MenuItem, ItemVariant } from '../types/restaurant.ts';
import { X, Plus, Minus, Check, Clock } from 'lucide-react';
import { getMenuImage } from '../utils/menuImages.ts';

interface VariantModalProps {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (variantId?: string, quantity?: number, notes?: string) => void;
}

export const VariantModal: React.FC<VariantModalProps> = ({ item, onClose, onConfirm }) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    item.variants?.[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  const activeVariant: ItemVariant | undefined = item.variants?.find(
    (v) => v.id === selectedVariantId
  ) || item.variants?.[0];

  const currentUnitPrice = activeVariant ? activeVariant.price : item.basePrice;
  const currentTotal = Math.round(currentUnitPrice * quantity * 100) / 100;

  const handleAdd = () => {
    onConfirm(selectedVariantId, quantity, notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-stone-900 border border-stone-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Media */}
        <div className="relative">
          {item.image ? <>
            <div className="h-44 sm:h-52 w-full overflow-hidden bg-stone-950">
              <img
                src={getMenuImage(item.image)}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-black/30" />
            </div>
          </> : <div className="h-28 bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center border-b border-stone-800"><span className="font-serif text-2xl text-stone-400 font-bold">{item.name}</span></div>}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-900/80 hover:bg-stone-900 text-stone-300 hover:text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-stone-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
              {item.prepTimeMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  ~{item.prepTimeMinutes} min prep
                </span>
              )}
              {item.dietary?.map((tag) => (
                <span key={tag} className="capitalize text-stone-400">
                  · {tag}
                </span>
              ))}
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-100">{item.name}</h3>
            <p className="text-sm text-stone-400 mt-1 leading-relaxed">{item.description}</p>
          </div>

          {/* Variant Selector (e.g. Half Plate vs Full Plate) */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                Portion Size / Variant
              </label>
              <div className="grid grid-cols-1 gap-2">
                {item.variants.map((variant) => {
                  const isSelected = selectedVariantId === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-stone-100'
                          : 'border-stone-800 hover:border-stone-700 bg-stone-800/40 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-amber-500 bg-amber-500 text-stone-950' : 'border-stone-600'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-sm font-medium">{variant.name}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-amber-400">
                        ${variant.price.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Kitchen Instructions / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. dressing on the side, no onion, extra crispy..."
              maxLength={150}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Quantity Stepper & Add Action */}
          <div className="pt-2 flex items-center justify-between gap-4 border-t border-stone-800">
            <div className="flex items-center gap-3 bg-stone-950 border border-stone-800 rounded-lg px-2 py-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 rounded flex items-center justify-center text-stone-400 hover:text-white transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-bold tabular-nums text-stone-100">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(20, quantity + 1))}
                className="w-7 h-7 rounded flex items-center justify-center text-stone-400 hover:text-white transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 flex items-center justify-between px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-stone-950 font-bold text-sm rounded-xl transition-all shadow-md"
            >
              <span>Add to Order</span>
              <span className="tabular-nums">${currentTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
