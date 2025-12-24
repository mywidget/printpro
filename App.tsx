
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import NewOrder from './components/NewOrder';
import Inventory from './components/Inventory';
import Catalog from './components/Catalog';
import Settings from './components/Settings';
import Customers from './components/Customers';
import Reports from './components/Reports';
import CategoryManager from './components/CategoryManager';
import InvoiceModal from './components/InvoiceModal';
import OrderHistory from './components/OrderHistory';
import { Order, OrderStatus, Product, InventoryItem, StoreSettings, Customer, CategoryItem } from './types';
import { StorageService } from './services/storage';
import { ApiService } from './services/api';

const DEFAULT_SETTINGS: StoreSettings = {
  name: 'PrintPro Digital Solutions',
  address: 'Jl. Percetakan Raya No. 123, Jakarta Selatan',
  phone: '0812-3456-7890',
  email: 'hello@printpro.pos',
  footerNote: 'Terima kasih atas kepercayaan Anda!',
  currency: 'IDR'
};

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'Digital A3+' },
  { id: 'cat-2', name: 'Outdoor Banner' },
  { id: 'cat-3', name: 'Indoor & Studio' },
  { id: 'cat-4', name: 'Sticker & Label' }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  const [useApi, setUseApi] = useState(() => {
    return localStorage.getItem('printpro_use_api') === 'true';
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (useApi) {
        const [prods, inv, ords, custs, sett, cats] = await Promise.all([
          ApiService.getProducts(),
          ApiService.getInventory(),
          ApiService.getOrders(),
          ApiService.getCustomers(),
          ApiService.getSettings(),
          ApiService.getCategories()
        ]);
        setProducts(prods);
        setInventory(inv);
        setOrders(ords);
        setCustomers(custs);
        setSettings(sett || DEFAULT_SETTINGS);
        if (cats.length > 0) setCategories(cats);
      } else {
        setProducts(StorageService.getProducts());
        setInventory(StorageService.getInventory());
        setOrders(StorageService.getOrders());
        setCustomers(StorageService.getCustomers());
        setSettings(StorageService.getSettings(DEFAULT_SETTINGS));
        setCategories(StorageService.getCategories(DEFAULT_CATEGORIES));
      }
    } catch (err) {
      console.error("Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('printpro_use_api', String(useApi));
    loadData();
  }, [useApi]);

  const handleAddOrder = async (orderData: any) => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Date.now()}`,
      createdAt: new Date(),
      status: OrderStatus.PENDING
    };

    if (useApi) {
      await ApiService.createOrder(newOrder);
    } else {
      StorageService.saveOrder(newOrder);
    }
    
    setOrders([newOrder, ...orders]);
    setActiveTab('orders'); // Pindah ke riwayat setelah pesan
    setSelectedOrderForInvoice(newOrder);
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    if (useApi) {
      await ApiService.updateOrderStatus(id, status);
    }
    
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    if (!useApi) {
      StorageService.updateOrderStatus(id, status);
    }
  };

  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== OrderStatus.CANCELLED);
    const today = new Date().toDateString();
    const totalSales = activeOrders.filter(o => new Date(o.createdAt).toDateString() === today).reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrders = activeOrders.filter(o => o.status !== OrderStatus.DONE).length;
    const completedToday = activeOrders.filter(o => o.status === OrderStatus.DONE && new Date(o.createdAt).toDateString() === today).length;
    
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayString = d.toDateString();
      const amount = activeOrders.filter(o => new Date(o.createdAt).toDateString() === dayString).reduce((sum, o) => sum + o.totalAmount, 0);
      revenueByDay.push({ 
        date: d.toLocaleDateString('id-ID', { weekday: 'short' }), 
        amount 
      });
    }
    return { totalSales, pendingOrders, completedToday, revenueByDay };
  }, [orders]);

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-slate-400">Loading data...</p>
      </div>
    );
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} recentOrders={orders} onUpdateStatus={handleUpdateOrderStatus} />;
      case 'new-order': return <NewOrder products={products} customers={customers} categories={categories} onAddOrder={handleAddOrder} />;
      case 'orders': return <OrderHistory orders={orders} onUpdateStatus={handleUpdateOrderStatus} onViewInvoice={setSelectedOrderForInvoice} />;
      case 'catalog': return <Catalog products={products} inventory={inventory} categories={categories} onUpdateProducts={(p) => { setProducts(p); StorageService.saveProducts(p); }} />;
      case 'categories': return <CategoryManager categories={categories} onUpdateCategories={(c) => { setCategories(c); StorageService.saveCategories(c); }} />;
      case 'inventory': return <Inventory items={inventory} onUpdateItems={(i) => { setInventory(i); StorageService.saveInventory(i); }} />;
      case 'customers': return <Customers customers={customers.map(c => ({...c, total_orders: c.totalOrders, total_spent: c.totalSpent, email: c.email || '-'}))} />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings initialSettings={settings} onUpdateSettings={(s) => { setSettings(s); StorageService.saveSettings(s); }} />;
      default: return <Dashboard stats={stats} recentOrders={orders} onUpdateStatus={handleUpdateOrderStatus} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
           <div className="flex items-center gap-4">
             <h2 className="font-bold text-slate-800 uppercase tracking-tight">{activeTab}</h2>
             <button 
                onClick={() => setUseApi(!useApi)}
                className={`flex items-center gap-2 text-[10px] font-black px-3 py-1.5 rounded-full border transition-all ${useApi ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-amber-50 text-amber-600 border-amber-200'}`}
             >
               <span className="w-2 h-2 rounded-full animate-pulse bg-current"></span>
               {useApi ? 'SERVER MODE' : 'LOCAL MODE'}
             </button>
           </div>
           <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-bold uppercase">ADMIN</div>
        </header>
        {renderContent()}
      </main>
      {selectedOrderForInvoice && <InvoiceModal order={selectedOrderForInvoice} storeSettings={settings} onClose={() => setSelectedOrderForInvoice(null)} />}
    </div>
  );
};

export default App;
