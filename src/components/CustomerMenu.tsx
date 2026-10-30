import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import { MenuItem, DietaryType } from '../types/restaurant.ts';
import { VariantModal } from './VariantModal.tsx';
import { Search, Sparkles, AlertCircle, Plus, ChefHat, Flame } from 'lucide-react';
import { getMenuImage } from '../utils/menuImages.ts';

export const CustomerMenu: React.FC = () => {
  const {
    categories,
    menuItems,
    loadingMenu,
    addToCart,
    cartWarning,
    setCartWarning,
    activeOrderId,
    setRole,
  } = useRestaurant();

  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category filter
      if (activeCategoryId !== 'all' && item.categoryId !== activeCategoryId) {
        return false;
      }
      // Dietary filter
      if (dietaryFilter !== 'all') {
        if (!item.dietary?.includes(dietaryFilter as DietaryType)) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [menuItems, activeCategoryId, dietaryFilter, searchQuery]);

  const handleItemCardClick = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setSelectedItemForModal(item);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-24">
      {/* Out of stock live alert banner (Stretch feature 1) */}
      {cartWarning && (
        <div className="bg-amber-950/90 border-b border-amber-800 text-amber-200 px-4 py-3 flex items-center justify-between text-xs sm:text-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{cartWarning}</span>
          </div>
          <button
            onClick={() => setCartWarning(null)}
            className="text-amber-400 hover:text-amber-100 font-bold ml-4 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Order Kicker (if customer has placed an order) */}
      {activeOrderId && (
        <div className="bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border-b border-stone-800 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-stone-300">You have an active order in progress</span>
            </div>
            <button
              onClick={() => setRole('customer')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline"
            >
              <span>Track Live Status</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative border-b border-stone-800 bg-stone-900/40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-amber-500">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Wood-Fired & Handcrafted Kitchen</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-100 leading-tight">
                Authentic flavors, prepared live to order.
              </h1>
              <p className="text-sm sm:text-base text-stone-400 max-w-xl leading-relaxed">
                Choose your table for dine-in or select takeaway for counter pickup. Every dish is cooked to order, tracked live from our kitchen burners to your table.
              </p>

              {/* Search & Dietary Bar */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes, pasta, pizza, desserts..."
                    className="w-full pl-10 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-xl text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'veg', label: 'Vegetarian' },
                    { id: 'non-veg', label: 'Meat / Poultry' },
                    { id: 'gluten-free', label: 'Gluten-Free' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setDietaryFilter(filter.id)}
                      className={`px-3 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
                        dietaryFilter === filter.id
                          ? 'bg-amber-600 text-stone-950 font-bold'
                          : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Restaurant brand spotlight — replaces the unrelated Chef's Signature food image */}
            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative min-h-[18rem] overflow-hidden rounded-2xl border border-amber-700/40 bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 shadow-2xl">
                <div className="absolute -right-10 -top-12 h-56 w-56 rounded-full border border-amber-500/10" />
                <div className="absolute -right-2 -top-4 h-40 w-40 rounded-full border border-amber-500/10" />
                <div className="relative flex min-h-[18rem] flex-col items-center justify-center px-8 py-8 text-center">
                  <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-amber-400/60 bg-stone-950 shadow-[0_0_45px_rgba(217,119,6,0.16)]">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
                      <ChefHat className="h-9 w-9 text-amber-400" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-500">
                    <Flame className="h-3.5 w-3.5" /> Fresh from our kitchen <Flame className="h-3.5 w-3.5" />
                  </div>
                  <h2 className="font-serif text-3xl font-bold tracking-wide text-stone-100">HUNGER HELPERS</h2>
                  <div className="mt-3 h-px w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone-400">Good food. Crafted with care. Served fresh, straight from our kitchen to your table.</p>
                  <span className="mt-5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">Wood-fired · Handcrafted · Made fresh</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Category Tabs Bar */}
      <div className="sticky top-16 z-30 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveCategoryId('all')}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
              activeCategoryId === 'all'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            Full Menu ({menuItems.length})
          </button>
          {categories.map((cat) => {
            const count = menuItems.filter((i) => i.categoryId === cat.id).length;
            const isActive = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Dishes Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {loadingMenu ? (
          <div className="py-20 text-center text-stone-500">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading handcrafted menu...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-stone-500 border border-dashed border-stone-800 rounded-2xl p-8">
            <p className="text-base text-stone-300 font-serif">No dishes found matching your selection.</p>
            <p className="text-xs text-stone-500 mt-1">Try resetting your search query or dietary filter.</p>
            <button
              onClick={() => {
                setActiveCategoryId('all');
                setDietaryFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isAvailable = item.isAvailable;
              const hasMultipleVariants = item.variants && item.variants.length > 1;
              const variantHeading = item.categoryId === 'beverages'
                ? 'Choose a drink size'
                : item.categoryId === 'pizza-burgers'
                  ? 'Choose a size or style'
                  : 'Choose a portion';
              const lowestPrice = item.variants?.length
                ? Math.min(...item.variants.map((v) => v.price))
                : item.basePrice;

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemCardClick(item)}
                  className={`group relative bg-stone-900 border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col ${
                    isAvailable
                      ? 'border-stone-800/90 hover:border-stone-700 hover:shadow-xl cursor-pointer'
                      : 'border-stone-800/50 opacity-75'
                  }`}
                >
                  {/* Dish Image */}
                  <div className="relative h-48 w-full bg-stone-950 overflow-hidden">
                    {item.image ? <img
                        src={getMenuImage(item.image)}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          isAvailable ? 'group-hover:scale-105' : 'grayscale'
                        }`}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      /> : <div className="w-full h-full flex items-center justify-center bg-stone-900 text-stone-500 font-serif text-sm">{item.name}</div>}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-80" />

                    {/* Out of Stock Overlay (Stretch feature 1) */}
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center">
                        <div className="bg-stone-900 border border-rose-500/40 px-3 py-1.5 rounded-lg text-rose-400 text-xs font-bold tracking-wider uppercase">
                          Sold Out
                        </div>
                      </div>
                    )}

                    {/* Popular Tag */}
                    {item.popular && isAvailable && (
                      <div className="absolute top-3 left-3 bg-amber-500 text-stone-950 px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase shadow-sm">
                        Popular
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Dietary & Prep Time Unboxed Metadata */}
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1.5 flex-wrap">
                        {item.prepTimeMinutes && (
                          <span>~{item.prepTimeMinutes} min</span>
                        )}
                        {item.dietary?.map((tag) => (
                          <span key={tag} className="capitalize">
                            · {tag}
                          </span>
                        ))}
                      </div>

                      <h3 className="font-serif text-lg font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                        {item.name}
                      </h3>

                      <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Variant tags preview */}
                      {hasMultipleVariants && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {item.variants.map((v) => (
                            <span
                              key={v.id}
                              className="text-[11px] text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded-md"
                            >
                              {v.name}: ${v.price.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pricing & Add Button */}
                    <div className="pt-4 mt-3 border-t border-stone-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-stone-500 uppercase block tracking-wider">
                          {hasMultipleVariants ? variantHeading : 'Price'}
                        </span>
                        <span className="font-bold text-base text-amber-400 tabular-nums">
                          ${lowestPrice.toFixed(2)}
                        </span>
                      </div>

                      {isAvailable ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemCardClick(item);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-stone-950 text-xs font-bold rounded-lg transition-all shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{hasMultipleVariants ? 'Select Options' : 'Add to Order'}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-stone-500 italic">Currently Unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Variant Selector Modal */}
      {selectedItemForModal && (
        <VariantModal
          item={selectedItemForModal}
          onClose={() => setSelectedItemForModal(null)}
          onConfirm={(variantId, quantity, notes) => {
            addToCart(selectedItemForModal, variantId, quantity, notes);
          }}
        />
      )}
    </div>
  );
};
