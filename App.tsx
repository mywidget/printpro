
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

  const [useApi, setUseApi] = useState(() => localStorage.getItem('printpro_use_api') === 'true');

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
      if (useApi) setApiError(err instanceof Error ? err.message : 'Koneksi Gagal');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('printpro_use_api', String(useApi));
    loadData();
  }, [useApi]);

  // --- AUTOMATIC SYNC HANDLERS ---

  const handleUpdateProducts = async (newProducts: Product[]) => {
    if (useApi) {
      try {
        if (newProducts.length > products.length) {
          const added = newProducts.find(p => !products.find(op => op.id === p.id));
          if (added) await ApiService.upsertProduct(added);
        } else if (newProducts.length < products.length) {
          const deleted = products.find(p => !newProducts.find(np => np.id === p.id));
          if (deleted) await ApiService.deleteProduct(deleted.id);
        } else {
          const updated = newProducts.find(p => {
             const old = products.find(op => op.id === p.id);
             return JSON.stringify(old) !== JSON.stringify(p);
          });
          if (updated) await ApiService.upsertProduct(updated);
        }
      } catch (e) { alert(`Server Error: ${e instanceof Error ? e.message : 'Gagal sinkronisasi produk.'}`); return; }
    } else {
      StorageService.saveProducts(newProducts);
    }
    setProducts(newProducts);
  };

  const handleUpdateCategories = async (newCats: CategoryItem[]) => {
    if (useApi) {
      try {
        if (newCats.length > categories.length) {
          const added = newCats.find(c => !categories.find(oc => oc.id === c.id));
          if (added) await ApiService.upsertCategory(added);
        } else if (newCats.length < categories.length) {
          const deleted = categories.find(c => !newCats.find(nc => nc.id === c.id));
          if (deleted) await ApiService.deleteCategory(deleted.id);
        } else {
          const updated = newCats.find(c => {
             const old = categories.find(oc => oc.id === c.id);
             return JSON.stringify(old) !== JSON.stringify(c);
          });
          if (updated) await ApiService.upsertCategory(updated);
        }
      } catch (e) { alert(`Server Error: ${e instanceof Error ? e.message : 'Gagal sinkronisasi kategori.'}`); return; }
    } else {
      StorageService.saveCategories(newCats);
    }
    setCategories(newCats);
  };

  const handleUpdateInventory = async (newInv: InventoryItem[]) => {
    if (useApi) {
      try {
        if (newInv.length > inventory.length) {
          const added = newInv.find(i => !inventory.find(oi => oi.id === i.id));
          if (added) await ApiService.upsertInventory(added);
        } else if (newInv.length < inventory.length) {
          const deleted = inventory.find(i => !newInv.find(ni => ni.id === i.id));
          if (deleted) await ApiService.deleteInventory(deleted.id);
        } else {
          const updated = newInv.find(i => {
             const old = inventory.find(oi => oi.id === i.id);
             return JSON.stringify(old) !== JSON.stringify(i);
          });
          if (updated) await ApiService.upsertInventory(updated);
        }
      } catch (e) { alert(`Server Error: ${e instanceof Error ? e.message : 'Gagal sinkronisasi inventori.'}`); return; }
    } else {
      StorageService.saveInventory(newInv);
    }
    setInventory(newInv);
  };

  const handleUpdateSettings = async (newSettings: StoreSettings) => {
    if (useApi) {
      try {
        await ApiService.saveSettings(newSettings);
      } catch (e) { alert(`Server Error: ${e instanceof Error ? e.message : 'Gagal simpan pengaturan.'}`); return; }
    } else {
      StorageService.saveSettings(newSettings);
    }
    setSettings(newSettings);
  };

  const handleAddOrder = async (orderData: any) => {
    const newOrder: Order = { ...orderData, id: `ORD-${Date.now()}`, createdAt: new Date(), status: OrderStatus.PENDING };
    try {
      if (useApi) await ApiService.upsertOrder(newOrder);
      else StorageService.saveOrder(newOrder);
      setOrders(prev => [newOrder, ...prev]);
      setActiveTab('orders');
      setSelectedOrderForInvoice(newOrder);
    } catch (e) { alert(`Gagal menyimpan pesanan: ${e instanceof Error ? e.message : 'Server Error'}`); }
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      // Langsung update state lokal agar UI terasa responsif
      const previousOrders = [...orders];
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

      if (useApi) {
        try {
          await ApiService.updateOrderStatus(id, status);
        } catch (serverError) {
          // Jika gagal di server, kembalikan state lokal (Rollback)
          setOrders(previousOrders);
          alert(`Gagal sinkron status ke server: ${serverError instanceof Error ? serverError.message : 'Silakan cek koneksi database.'}`);
        }
      } else {
        StorageService.updateOrderStatus(id, status);
      }
    } catch (e) { 
      alert("Kesalahan aplikasi saat memperbarui status."); 
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
      const d = new Date(); d.setDate(d.getDate() - i);
      const dayString = d.toDateString();
      const amount = activeOrders.filter(o => new Date(o.createdAt).toDateString() === dayString).reduce((sum, o) => sum + o.totalAmount, 0);
      revenueByDay.push({ date: d.toLocaleDateString('id-ID', { weekday: 'short' }), amount });
    }
    return { totalSales, pendingOrders, completedToday, revenueByDay };
  }, [orders]);

  const renderContent = () => {
    if (apiError) return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-6">⚠️</div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Server Tidak Merespon</h3>
        <p className="text-sm text-slate-500 max-w-md mb-8">{apiError}</p>
        <div className="flex gap-4">
          <button onClick={() => loadData()} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">Coba Lagi</button>
          <button onClick={() => setUseApi(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold">Gunakan Offline</button>
        </div>
      </div>
    );

    if (isLoading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} recentOrders={orders} onUpdateStatus={handleUpdateOrderStatus} />;
      case 'new-order': return <NewOrder products={products} customers={customers} categories={categories} onAddOrder={handleAddOrder} />;
      case 'orders': return <OrderHistory orders={orders} onUpdateStatus={handleUpdateOrderStatus} onViewInvoice={setSelectedOrderForInvoice} />;
      case 'catalog': return <Catalog products={products} inventory={inventory} categories={categories} onUpdateProducts={handleUpdateProducts} />;
      case 'categories': return <CategoryManager categories={categories} onUpdateCategories={handleUpdateCategories} />;
      case 'inventory': return <Inventory items={inventory} onUpdateItems={handleUpdateInventory} />;
      case 'customers': return <Customers customers={customers.map(c => ({...c, total_orders: c.totalOrders, total_spent: c.totalSpent, email: c.email || '-'}))} />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings initialSettings={settings} onUpdateSettings={handleUpdateSettings} onPush={() => {}} onPull={loadData} />;
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
             <button onClick={() => setUseApi(!useApi)} className={`flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-full border transition-all ${useApi ? 'bg-indigo-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
               <span className={`w-1.5 h-1.5 rounded-full ${useApi ? 'bg-white' : 'bg-amber-500'}`}></span>
               {useApi ? 'SERVER MODE' : 'LOCAL MODE'}
             </button>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xs text-white font-black">PR</div>
           </div>
        </header>
        {renderContent()}
      </main>
      {selectedOrderForInvoice && <InvoiceModal order={selectedOrderForInvoice} storeSettings={settings} onClose={() => setSelectedOrderForInvoice(null)} />}
    </div>
  );
};

export default App;
