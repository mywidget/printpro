
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  const [useApi, setUseApi] = useState(() => {
    const savedMode = localStorage.getItem('printpro_use_api');
    return savedMode === 'true';
  });

  const loadData = async () => {
    setIsLoading(true);
    setApiError(null);
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
        if (cats && cats.length > 0) setCategories(cats);
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
      if (useApi) {
        setApiError(err instanceof Error ? err.message : 'Koneksi ke server gagal (Error 500)');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('printpro_use_api', String(useApi));
    loadData();
  }, [useApi]);

  const handlePushToDatabase = async () => {
    setIsSyncing(true);
    try {
      const payload = {
        categories: StorageService.getCategories(DEFAULT_CATEGORIES),
        products: StorageService.getProducts(),
        inventory: StorageService.getInventory(),
        orders: StorageService.getOrders(),
        customers: StorageService.getCustomers(),
        settings: StorageService.getSettings(DEFAULT_SETTINGS) // Menyertakan settings dalam payload
      };
      await ApiService.syncAll(payload);
      alert('SINKRONISASI BERHASIL: Seluruh data lokal Anda kini tersimpan aman di database server.');
    } catch (err) {
      alert('SINKRONISASI GAGAL: ' + (err instanceof Error ? err.message : 'Internal Server Error (500)'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromDatabase = async () => {
    setIsSyncing(true);
    try {
      const [prods, inv, ords, custs, sett, cats] = await Promise.all([
        ApiService.getProducts(),
        ApiService.getInventory(),
        ApiService.getOrders(),
        ApiService.getCustomers(),
        ApiService.getSettings(),
        ApiService.getCategories()
      ]);

      StorageService.saveProducts(prods);
      StorageService.saveInventory(inv);
      localStorage.setItem('printpro_orders', JSON.stringify(ords));
      localStorage.setItem('printpro_customers', JSON.stringify(custs));
      StorageService.saveSettings(sett || DEFAULT_SETTINGS);
      StorageService.saveCategories(cats || DEFAULT_CATEGORIES);

      setProducts(prods);
      setInventory(inv);
      setOrders(ords);
      setCustomers(custs);
      setSettings(sett || DEFAULT_SETTINGS);
      setCategories(cats || DEFAULT_CATEGORIES);

      alert('UNDUH BERHASIL: Data lokal Anda kini sinkron dengan versi terbaru dari server.');
    } catch (err) {
      alert('UNDUH GAGAL: ' + (err instanceof Error ? err.message : 'Internal Server Error (500)'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddOrder = async (orderData: any) => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Date.now()}`,
      createdAt: new Date(),
      status: OrderStatus.PENDING
    };

    try {
      if (useApi) {
        await ApiService.createOrder(newOrder);
      } else {
        StorageService.saveOrder(newOrder);
      }
      setOrders(prev => [newOrder, ...prev]);
      setActiveTab('orders');
      setSelectedOrderForInvoice(newOrder);
    } catch (err) {
      alert("Gagal menyimpan ke server. Pesanan tetap tersimpan sementara di memori, silakan coba lagi.");
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      if (useApi) {
        await ApiService.updateOrderStatus(id, status);
      }
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      if (!useApi) {
        StorageService.updateOrderStatus(id, status);
      }
    } catch (err) {
      alert("Gagal memperbarui status di server.");
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
      revenueByDay.push({ date: d.toLocaleDateString('id-ID', { weekday: 'short' }), amount });
    }
    return { totalSales, pendingOrders, completedToday, revenueByDay };
  }, [orders]);

  const renderContent = () => {
    if (apiError) return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-6 animate-bounce">⚠️</div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Koneksi Database Terputus</h3>
        <p className="text-sm text-slate-500 max-w-md mb-8">
          Aplikasi tidak dapat terhubung ke server. Pastikan backend Anda sudah memiliki <strong>method sync</strong> dan database aktif.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => loadData()} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">Coba Lagi</button>
          <button onClick={() => setUseApi(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all">Gunakan Mode Lokal</button>
        </div>
      </div>
    );

    if (isLoading || isSyncing) return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
           <p className="font-black text-slate-900 text-sm uppercase tracking-widest">{isSyncing ? 'Sinkronisasi Cloud' : 'Sinkronisasi Data'}</p>
           <p className="text-[10px] text-slate-400 font-bold mt-1">Harap tunggu sebentar...</p>
        </div>
      </div>
    );
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} recentOrders={orders} onUpdateStatus={handleUpdateOrderStatus} />;
      case 'new-order': return <NewOrder products={products} customers={customers} categories={categories} onAddOrder={handleAddOrder} />;
      case 'orders': return <OrderHistory orders={orders} onUpdateStatus={handleUpdateOrderStatus} onViewInvoice={setSelectedOrderForInvoice} />;
      case 'catalog': return <Catalog products={products} inventory={inventory} categories={categories} onUpdateProducts={(p) => { setProducts(p); if(!useApi) StorageService.saveProducts(p); }} />;
      case 'categories': return <CategoryManager categories={categories} onUpdateCategories={(c) => { setCategories(c); if(!useApi) StorageService.saveCategories(c); }} />;
      case 'inventory': return <Inventory items={inventory} onUpdateItems={(i) => { setInventory(i); if(!useApi) StorageService.saveInventory(i); }} />;
      case 'customers': return <Customers customers={customers.map(c => ({...c, total_orders: c.totalOrders, total_spent: c.totalSpent, email: c.email || '-'}))} />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings initialSettings={settings} onUpdateSettings={(s) => { setSettings(s); if(!useApi) StorageService.saveSettings(s); }} onPush={handlePushToDatabase} onPull={handlePullFromDatabase} />;
      default: return <Dashboard stats={stats} recentOrders={orders} onUpdateStatus={handleUpdateOrderStatus} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
           <div className="flex items-center gap-4">
             <h2 className="font-black text-slate-900 uppercase tracking-tighter text-sm">{activeTab.replace('-', ' ')}</h2>
             <button 
                onClick={() => setUseApi(!useApi)}
                className={`flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-full border transition-all duration-300 transform active:scale-95 ${useApi ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-100' : 'bg-amber-100 text-amber-700 border-amber-200'}`}
             >
               <span className={`w-1.5 h-1.5 rounded-full ${useApi ? 'bg-white animate-pulse' : 'bg-amber-500'}`}></span>
               {useApi ? 'SERVER MODE' : 'LOCAL MODE'}
             </button>
           </div>
           
           <div className="flex items-center gap-3">
             {useApi && !apiError && (
                <button onClick={handlePullFromDatabase} title="Ambil data terbaru dari server" className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">🔄</button>
             )}
             <div className="text-right hidden sm:block">
               <p className="text-[10px] font-black text-slate-900 leading-none uppercase tracking-tighter">Administrator</p>
               <p className={`text-[8px] font-bold mt-1 uppercase tracking-widest ${apiError ? 'text-red-500' : 'text-slate-400'}`}>
                  {apiError ? 'Connection Error' : (useApi ? 'Server Active' : 'LocalStorage')}
               </p>
             </div>
             <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xs text-white font-black shadow-lg shadow-indigo-100">PR</div>
           </div>
        </header>
        {renderContent()}
      </main>
      {selectedOrderForInvoice && <InvoiceModal order={selectedOrderForInvoice} storeSettings={settings} onClose={() => setSelectedOrderForInvoice(null)} />}
    </div>
  );
};

export default App;
