import React, { useState } from 'react';
import { Order, SubmitRatingPayload } from '../types/restaurant.ts';
import * as api from '../services/api.ts';
import { playCustomerStatusChime } from '../utils/audio.ts';
import {
  Star,
  Heart,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Send,
  Edit3,
} from 'lucide-react';

interface CustomerSatisfactionRatingProps {
  order: Order;
  onRatingSubmitted: (updatedOrder: Order) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Disappointing',
  2: 'Needs Improvement',
  3: 'Good / Satisfactory',
  4: 'Great Dining Experience',
  5: 'Exceptional & Memorable!',
};

const COMPLIMENT_ASPECTS = [
  '⚡ Fast Service',
  '🔥 Served Piping Hot',
  '🍽️ Exquisite Plating',
  '🍷 Balanced Flavors',
  '👨‍🍳 Chef Perfection',
  '🛎️ Attentive Care',
  '🌾 Fresh Ingredients',
  '📦 Secure Packaging',
];

export const CustomerSatisfactionRating: React.FC<CustomerSatisfactionRatingProps> = ({
  order,
  onRatingSubmitted,
}) => {
  const existingRating = order.rating;

  const [rating, setRating] = useState<number>(existingRating?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedAspects, setSelectedAspects] = useState<string[]>(
    existingRating?.aspects || ['🔥 Served Piping Hot', '🍷 Balanced Flavors']
  );
  const [itemFavorites, setItemFavorites] = useState<Record<string, 'loved' | 'good' | 'could_improve'>>(
    existingRating?.itemRatings || {}
  );
  const [comment, setComment] = useState<string>(existingRating?.comment || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!existingRating);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeStarCount = hoverRating || rating;

  const toggleAspect = (aspect: string) => {
    setSelectedAspects((prev) =>
      prev.includes(aspect) ? prev.filter((a) => a !== aspect) : [...prev, aspect]
    );
  };

  const toggleItemFavorite = (itemId: string) => {
    setItemFavorites((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === 'loved' ? 'good' : 'loved',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload: SubmitRatingPayload = {
        rating,
        aspects: selectedAspects,
        comment: comment.trim() || undefined,
        itemRatings: itemFavorites,
      };

      const updated = await api.submitOrderRating(order.id, payload);
      onRatingSubmitted(updated);
      setIsEditing(false);
      setShowSuccessBanner(true);
      playCustomerStatusChime();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit satisfaction rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already rated and not actively editing, show clean submitted review card
  if (existingRating && !isEditing) {
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-stone-100">
                Your Dining Feedback
              </h3>
              <span className="text-xs text-stone-400">
                Submitted on {new Date(existingRating.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors border border-stone-700/80"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Update Review</span>
          </button>
        </div>

        {showSuccessBanner && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Thank you! Your feedback has been shared directly with Chef & management.</span>
          </div>
        )}

        {/* Star Rating Display */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= existingRating.rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-stone-700'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-amber-400 ml-1">
            {RATING_LABELS[existingRating.rating]}
          </span>
        </div>

        {/* Selected Compliment Aspects */}
        {existingRating.aspects?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {existingRating.aspects.map((aspect) => (
              <span
                key={aspect}
                className="text-xs text-stone-300 bg-stone-950 border border-stone-800 px-2.5 py-1 rounded-lg"
              >
                {aspect}
              </span>
            ))}
          </div>
        )}

        {/* Written Review */}
        {existingRating.comment && (
          <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-300 italic">
            "{existingRating.comment}"
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Decorative Warm Ambient Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="border-b border-stone-800 pb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Customer Satisfaction & Feedback</span>
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-100">
          How was your meal today?
        </h2>
        <p className="text-xs text-stone-400 mt-1">
          Your order was served! Help our kitchen &amp; dining team keep raising the bar.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Interactive Star Rating Selector */}
        <div className="text-center sm:text-left space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400">
            Overall Rating *
          </label>
          <div className="flex items-center justify-center sm:justify-start gap-2 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 rounded-lg transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                    star <= activeStarCount
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                      : 'text-stone-700 hover:text-stone-500'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 font-serif text-sm font-bold text-amber-400">
              {RATING_LABELS[activeStarCount]}
            </span>
          </div>
        </div>

        {/* Aspect Compliments / Badges */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400">
            What stood out to you? (Select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {COMPLIMENT_ASPECTS.map((aspect) => {
              const isSelected = selectedAspects.includes(aspect);
              return (
                <button
                  key={aspect}
                  type="button"
                  onClick={() => toggleAspect(aspect)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold shadow-xs'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                  }`}
                >
                  {aspect}
                </button>
              );
            })}
          </div>
        </div>

        {/* Item-Specific Feedback (Heart your favorites!) */}
        {order.items.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400">
              Highlight Your Favorite Dishes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {order.items.map((it, idx) => {
                const isLoved = itemFavorites[it.itemId] === 'loved';
                return (
                  <div
                    key={idx}
                    onClick={() => toggleItemFavorite(it.itemId)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isLoved
                        ? 'bg-amber-500/10 border-amber-500/40 text-stone-100'
                        : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="text-xs font-semibold block truncate">
                        {it.name}
                      </span>
                      {it.variantName && (
                        <span className="text-[11px] text-stone-500 block">
                          {it.variantName}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`p-1 rounded-full transition-transform hover:scale-110 ${
                        isLoved ? 'text-rose-400' : 'text-stone-600'
                      }`}
                      aria-label="Favorite item"
                    >
                      <Heart className={`w-4 h-4 ${isLoved ? 'fill-rose-400' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Written Review Textarea */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center justify-between">
            <span>Notes for Chef &amp; Team (Optional)</span>
            <span className="text-stone-600 font-normal">Max 500 chars</span>
          </label>
          <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Tell us what you loved, or any constructive notes for your next visit..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
            />
            <MessageSquare className="w-3.5 h-3.5 absolute right-3 bottom-3 text-stone-600 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800">
          {existingRating && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-stone-400 hover:text-stone-200 underline"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-98 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-md"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                <span>Submitting Feedback...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Satisfaction Rating</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
