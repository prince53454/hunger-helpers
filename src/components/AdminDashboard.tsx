import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext.tsx';
import { MenuItem, Category, ItemVariant, DietaryType } from '../types/restaurant.ts';
import * as api from '../services/api.ts';
import { getMenuImage } from '../utils/menuImages.ts';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  BarChart3,
  UtensilsCrossed,
  ShieldAlert,
  Search,
  Star,
  Heart,
  MessageSquare,
  Printer,
} from 'lucide-react';
import { Order } from '../types/restaurant.ts';
import { ReceiptModal } from './ReceiptModal.tsx';

export const AdminDashboard: React.FC = () => {
  const {
    adminAnalytics,
    reloadAnalytics,
    categories,
    menuItems,
    reloadMenu,
    toggleStock,
    kitchenOrders,
    isAdminAuthenticated,
    setIsAdminAuthenticated,
    resetDemo,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'analytics' | 'menu' | 'orders'>('analytics');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('admin@bistro.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Menu item modal state
  const [isEditingItem, setIsEditingItem] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [variantInputs, setVariantInputs] = useState<ItemVariant[]>([]);

  // Search filter for menu items
  const [menuSearch, setMenuSearch] = useState('');

  // Printable receipt state
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await api.loginAdmin(loginEmail, loginPassword);
      api.setAuthToken(res.token);
      setIsAdminAuthenticated(true);
      localStorage.setItem('aura_admin_auth', 'true');
      reloadAnalytics();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem({
      categoryId: categories[0]?.id || 'mains',
      name: '',
      description: '',
      basePrice: 15.00,
      image: '',
      isAvailable: true,
      dietary: ['veg'],
      prepTimeMinutes: 12,
      popular: false,
      variants: [
        { id: 'half', name: 'Half Plate', price: 12.00 },
        { id: 'full', name: 'Full Plate', price: 20.00 },
      ],
    });
    setVariantInputs([
      { id: 'half', name: 'Half Plate', price: 12.00 },
      { id: 'full', name: 'Full Plate', price: 20.00 },
    ]);
    setIsEditingItem(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem({ ...item });
    setVariantInputs(item.variants ? [...item.variants] : []);
    setIsEditingItem(true);
  };

  const handleSaveItem = async () => {
    if (!editingItem || !editingItem.name?.trim()) {
      alert('Dish name is required');
      return;
    }
    if (!editingItem.basePrice || editingItem.basePrice <= 0) {
      alert('Valid base price is required');
      return;
    }

    try {
      const payload: Partial<MenuItem> = {
        ...editingItem,
        variants: variantInputs.filter((v) => v.name.trim() && v.price > 0),
      };

      if (editingItem.id) {
        await api.updateMenuItem(editingItem.id, payload);
      } else {
        await api.createMenuItem(payload);
      }
      setIsEditingItem(false);
      setEditingItem(null);
      await reloadMenu();
    } catch (err: any) {
      alert(err.message || 'Failed to save menu item');
    }
  };

  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the menu?`)) return;
    try {
      await api.deleteMenuItem(itemId);
      await reloadMenu();
    } catch (err: any) {
      alert(err.message || 'Failed to delete dish');
    }
  };

  const handleAddVariantRow = () => {
    setVariantInputs([
      ...variantInputs,
      { id: `var-${Date.now()}`, name: 'Special Size', price: 15.00 },
    ]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setVariantInputs(variantInputs.filter((_, i) => i !== index));
  };

  // If not authenticated, show demo login screen
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-stone-950 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-100">Manager & Chef Portal</h2>
            <p className="text-xs text-stone-400">
              Access real-time revenue analytics, active tickets, and menu stock controls.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-400 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-400 mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm rounded-xl transition-colors shadow-md"
            >
              Sign In to Admin
            </button>
          </form>

          {/* Quick Demo Autofill Notice */}
          <div className="pt-2 border-t border-stone-800 text-center">
            <p className="text-xs text-stone-400 mb-2">Pre-configured Demo Credentials:</p>
            <div className="bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs font-mono text-stone-300">
              admin@bistro.com / admin123
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await api.loginAdmin('admin@bistro.com', 'admin123');
                  api.setAuthToken(res.token);
                } catch {
                  api.setAuthToken('demo-admin-token-session-789');
                }
                setLoginEmail('admin@bistro.com');
                setLoginPassword('admin123');
                setIsAdminAuthenticated(true);
                localStorage.setItem('aura_admin_auth', 'true');
                reloadAnalytics();
              }}
              className="mt-3 text-xs text-amber-400 hover:text-amber-300 font-semibold underline"
            >
              1-Click Instant Demo Login →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered menu items for admin search
  const displayedMenuItems = menuItems.filter((i) => {
    if (!menuSearch.trim()) return true;
    return (
      i.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      i.description.toLowerCase().includes(menuSearch.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-20">
      
      {/* Admin Header */}
      <header className="sticky top-16 z-30 bg-stone-900 border-b border-stone-800 px-4 sm:px-6 lg:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-stone-950 flex items-center justify-center font-bold shadow-inner">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-stone-100">
                Executive Management & Analytics
              </h1>
              <p className="text-xs text-stone-400">
                Live Sales &amp; Dynamic Menu Configuration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-semibold border border-stone-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Seed</span>
            </button>

            <button
              onClick={() => {
                api.setAuthToken(null);
                setIsAdminAuthenticated(false);
                localStorage.removeItem('aura_admin_auth');
              }}
              className="px-3 py-1.5 bg-stone-800/80 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg text-xs transition-colors"
            >
              Sign Out
            </button>
          </div>

        </div>

        {/* Tab Switcher */}
        <div className="max-w-7xl mx-auto pt-3 flex items-center gap-2">
          {[
            { id: 'analytics', label: "Today's Revenue & Orders" },
            { id: 'menu', label: `Menu & Stock Management (${menuItems.length})` },
            { id: 'orders', label: `Order Audit Log (${kitchenOrders.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-stone-950 shadow-sm'
                  : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* TAB 1: ANALYTICS & REVENUE */}
        {activeTab === 'analytics' && adminAnalytics && (
          <div className="space-y-6">
            
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-stone-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Today's Total Revenue</span>
                  <DollarSign className="w-4 h-4 text-amber-500" />
                </div>
                <div className="font-serif text-3xl font-bold text-stone-100 mt-2 tabular-nums">
                  ${adminAnalytics.todayRevenue.toFixed(2)}
                </div>
                <span className="text-xs text-stone-500 mt-1 block">
                  Authoritatively computed by server
                </span>
              </div>

              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-stone-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Today's Orders Placed</span>
                  <ShoppingBag className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="font-serif text-3xl font-bold text-stone-100 mt-2 tabular-nums">
                  {adminAnalytics.todayOrdersCount}
                </div>
                <span className="text-xs text-stone-500 mt-1 block">
                  Dine-in and takeaway tickets
                </span>
              </div>

              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-stone-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Average Order Value</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-serif text-3xl font-bold text-stone-100 mt-2 tabular-nums">
                  ${adminAnalytics.averageOrderValue.toFixed(2)}
                </div>
                <span className="text-xs text-stone-500 mt-1 block">
                  Per completed customer ticket
                </span>
              </div>

              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-stone-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Active Kitchen Queue</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="font-serif text-3xl font-bold text-amber-400 mt-2 tabular-nums">
                  {adminAnalytics.activeOrdersCount}
                </div>
                <span className="text-xs text-stone-500 mt-1 block">
                  In Received / Prep / Plating
                </span>
              </div>

              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-stone-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Guest Satisfaction</span>
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="font-serif text-3xl font-bold text-amber-400 tabular-nums">
                    {adminAnalytics.satisfactionSummary?.averageRating.toFixed(1) || '5.0'}
                  </span>
                  <span className="text-xs text-stone-400">/ 5.0</span>
                </div>
                <span className="text-xs text-stone-500 mt-1 block">
                  {adminAnalytics.satisfactionSummary?.totalRatings || 0} reviews received
                </span>
              </div>

            </div>

            {/* Status Breakdown & Popular Dishes Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Status Breakdown */}
              <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-serif text-base font-bold text-stone-100">
                  Order Status Breakdown
                </h3>
                <div className="space-y-3">
                  {[
                    { key: 'received', label: 'Received (Queued)', count: adminAnalytics.statusBreakdown.received, color: 'text-amber-400' },
                    { key: 'preparing', label: 'In Kitchen (Cooking)', count: adminAnalytics.statusBreakdown.preparing, color: 'text-cyan-400' },
                    { key: 'ready', label: 'Ready for Service', count: adminAnalytics.statusBreakdown.ready, color: 'text-emerald-400' },
                    { key: 'served', label: 'Served & Closed', count: adminAnalytics.statusBreakdown.served, color: 'text-stone-300' },
                  ].map((s) => (
                    <div key={s.key} className="flex items-center justify-between p-3 bg-stone-950 border border-stone-800 rounded-xl">
                      <span className="text-xs text-stone-300 font-medium">{s.label}</span>
                      <span className={`text-base font-bold tabular-nums ${s.color}`}>
                        {s.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Selling Dishes */}
              <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-serif text-base font-bold text-stone-100">
                  Top Selling Dishes Today
                </h3>
                {adminAnalytics.popularItems.length === 0 ? (
                  <p className="text-xs text-stone-500 italic py-4">No dish sales recorded yet today.</p>
                ) : (
                  <div className="space-y-2.5">
                    {adminAnalytics.popularItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-stone-950 border border-stone-800 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-stone-800 text-amber-500 text-xs font-bold flex items-center justify-center tabular-nums">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="text-sm font-semibold text-stone-200">{item.name}</span>
                            <span className="text-xs text-stone-500 block">
                              {item.count} portions sold
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-amber-400">
                          ${item.revenue.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Hourly Sales Distribution */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-serif text-base font-bold text-stone-100">
                Hourly Activity &amp; Revenue Trends
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-2 pt-2">
                {adminAnalytics.hourlySales.map((h, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="h-24 w-full bg-stone-950 rounded-lg flex items-end p-1 border border-stone-800">
                      <div
                        className="w-full bg-amber-600 rounded-xs transition-all duration-500"
                        style={{
                          height: `${Math.min(100, Math.max(10, h.revenue > 0 ? (h.revenue / 100) * 100 : 0))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-500 mt-1 tabular-nums">{h.hour}</span>
                    <span className="text-[10px] text-amber-400 font-bold tabular-nums">${h.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Satisfaction & Live Guest Feedback Section */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h3 className="font-serif text-base font-bold text-stone-100">
                    Guest Satisfaction &amp; Service Feedback (CSAT)
                  </h3>
                </div>
                <span className="text-xs text-stone-400 font-mono">
                  {adminAnalytics.satisfactionSummary?.totalRatings || 0} Ratings Total
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left 4 cols: Rating Score & Bar Breakdown */}
                <div className="lg:col-span-4 bg-stone-950 border border-stone-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
                      Overall Rating
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-serif text-4xl font-bold text-amber-400 tabular-nums">
                        {adminAnalytics.satisfactionSummary?.averageRating.toFixed(1) || '5.0'}
                      </span>
                      <span className="text-stone-400 text-sm">out of 5</span>
                    </div>

                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(adminAnalytics.satisfactionSummary?.averageRating || 5)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Rating distribution bars */}
                  <div className="space-y-1.5 pt-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = adminAnalytics.satisfactionSummary?.ratingBreakdown?.[stars] || 0;
                      const total = adminAnalytics.satisfactionSummary?.totalRatings || 1;
                      const pct = Math.round((count / total) * 100);

                      return (
                        <div key={stars} className="flex items-center gap-2 text-xs">
                          <span className="w-4 text-stone-400 tabular-nums">{stars}★</span>
                          <div className="flex-1 h-2 bg-stone-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-6 text-right text-stone-500 tabular-nums">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right 8 cols: Recent Customer Feedback Cards */}
                <div className="lg:col-span-8 space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-2">
                    Recent Customer Reviews
                  </span>

                  {!adminAnalytics.satisfactionSummary?.recentFeedbacks || adminAnalytics.satisfactionSummary.recentFeedbacks.length === 0 ? (
                    <div className="p-6 text-center text-stone-500 border border-dashed border-stone-800 rounded-xl">
                      <p className="text-xs">No customer reviews recorded yet today.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {adminAnalytics.satisfactionSummary.recentFeedbacks.map((fb, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-400">
                                #{fb.orderNumber}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${
                                      s <= fb.rating
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-stone-700'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-[11px] text-stone-500 tabular-nums">
                              {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {fb.aspects?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {fb.aspects.map((aspect) => (
                                <span
                                  key={aspect}
                                  className="text-[11px] text-stone-300 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded"
                                >
                                  {aspect}
                                </span>
                              ))}
                            </div>
                          )}

                          {fb.comment && (
                            <p className="text-xs text-stone-300 italic bg-stone-900/50 p-2 rounded border border-stone-800/60">
                              "{fb.comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MENU & STOCK MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Filter menu dishes by name..."
                  className="w-full pl-10 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-md"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add New Menu Item</span>
                </button>
              </div>
            </div>

            {/* Menu Items Table / Cards */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="divide-y divide-stone-800">
                {displayedMenuItems.map((item) => {
                  const category = categories.find((c) => c.id === item.categoryId);

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-800/30 transition-colors"
                    >
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-start gap-4">
                        {item.image ? (
                          <img
                            src={getMenuImage(item.image)}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-xl object-cover bg-stone-950 shrink-0 border border-stone-800"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center font-serif text-xs text-stone-500 text-center shrink-0">No photo</div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif text-base font-bold text-stone-100">
                              {item.name}
                            </h4>
                            <span className="text-[11px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded">
                              {category?.name || item.categoryId}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mt-1 max-w-xl line-clamp-1">
                            {item.description}
                          </p>

                          {/* Variants list */}
                          {item.variants && item.variants.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-[11px] text-stone-500 font-semibold">Variants:</span>
                              {item.variants.map((v) => (
                                <span
                                  key={v.id}
                                  className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded tabular-nums"
                                >
                                  {v.name}: ${v.price.toFixed(2)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Availability Toggle (Stretch 1) & Edit / Delete Actions */}
                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        
                        {/* Live Stock Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleStock(item.id, !item.isAvailable)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            item.isAvailable
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/80'
                              : 'bg-rose-950/70 text-rose-300 border-rose-700/80 hover:bg-rose-900/80'
                          }`}
                          title="Click to toggle availability. Instantly updates carts & kitchen."
                        >
                          {item.isAvailable ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>In Stock</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Out of Stock</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition-colors"
                          title="Edit Dish & Variants"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-2 bg-stone-800 hover:bg-rose-900/80 text-stone-400 hover:text-rose-200 rounded-lg text-xs transition-colors"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: ORDER AUDIT LOG */}
        {activeTab === 'orders' && (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-stone-100">
                All Recorded Order Tickets
              </h3>
              <span className="text-xs text-stone-400">
                Total: {kitchenOrders.length} tickets
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Type / Location</th>
                    <th className="py-3 px-4">Items Summary</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Placed At</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {kitchenOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-stone-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        #{o.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        {o.orderType === 'dine_in' ? `Table ${o.tableNumber}` : `Takeaway (${o.customerName})`}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-stone-300">
                          {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold tabular-nums text-stone-200">
                        ${o.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            o.status === 'served'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : o.status === 'ready'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : o.status === 'preparing'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-stone-800 text-stone-300'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {o.rating ? (
                          <div className="flex items-center gap-1 text-amber-400 font-bold" title={o.rating.comment || 'Guest Review'}>
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{o.rating.rating}★</span>
                          </div>
                        ) : (
                          <span className="text-stone-600 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-400 tabular-nums">
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setReceiptOrder(o)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg border border-stone-700 transition-colors shadow-xs"
                          title={`Print thermal receipt for ticket #${o.orderNumber}`}
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Print Receipt</span>
                        </button>
                        {o.status === 'received' || o.status === 'preparing' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Cancel order #${o.orderNumber}? This cannot be undone.`
                                )
                              ) {
                                api
                                  .cancelOrder(o.id, 'Cancelled by admin from audit log')
                                  .then(() => reloadAnalytics())
                                  .catch((err: any) =>
                                    alert(err.message || 'Failed to cancel order')
                                  );
                              }
                            }}
                            className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-lg border border-rose-800/60 transition-colors shadow-xs"
                            title={`Cancel ticket #${o.orderNumber}`}
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Edit / Add Menu Item Modal */}
      {isEditingItem && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-100">
                {editingItem.id ? `Edit: ${editingItem.name}` : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => setIsEditingItem(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-400 uppercase font-semibold mb-1">Dish Name *</label>
                <input
                  type="text"
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="e.g. Lobster Ravioli"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 uppercase font-semibold mb-1">Category</label>
                  <select
                    value={editingItem.categoryId || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-stone-200"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 uppercase font-semibold mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingItem.basePrice || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 uppercase font-semibold mb-1">Description</label>
                <textarea
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={2}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-stone-200"
                />
              </div>

              {/* Variants Builder (Half Plate / Full Plate / Sizes) */}
              <div className="border-t border-stone-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-stone-400 uppercase font-semibold">
                    Portion Variants (e.g. Half / Full Plate)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {variantInputs.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => {
                          const updated = [...variantInputs];
                          updated[idx].name = e.target.value;
                          setVariantInputs(updated);
                        }}
                        placeholder="Variant name (e.g. Half Plate)"
                        className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-stone-200"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-stone-500">$</span>
                        <input
                          type="number"
                          step="0.5"
                          value={v.price}
                          onChange={(e) => {
                            const updated = [...variantInputs];
                            updated[idx].price = parseFloat(e.target.value) || 0;
                            setVariantInputs(updated);
                          }}
                          className="w-20 bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-200"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantRow(idx)}
                        className="text-stone-500 hover:text-rose-400 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsEditingItem(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-xl text-xs font-bold shadow-md"
              >
                Save Menu Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
    </div>
  );
};
