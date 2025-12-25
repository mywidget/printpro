
import { Order, OrderStatus, Product, InventoryItem, StoreSettings, Customer, CategoryItem, User, UserRole, Branch } from './types';
import { StorageService } from './services/storage';
import { ApiService } from './services/api';
import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
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
import UserManager from './components/UserManager';
import BranchManager from './components/BranchManager';
import Login from './components/Login';
import Profile from './components/Profile';

const DEFAULT_SETTINGS: StoreSettings = {
  name: 'PrintPro Digital Solutions',
  address: 'Jl. Percetakan Raya No. 123, Jakarta Selatan',
  phone: '0812-3456-7890',
  email: 'hello@printpro.pos',
  footerNote: 'Terima kasih atas kepercayaan Anda!',
  currency: 'IDR',
  apiEndpoints: [],
  fonnteToken: ''
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('printpro_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [useApi, setUseApi] = useState(() => localStorage.getItem('printpro_use_api') === 'true');
  const [currentApiUrl, setCurrentApiUrl] = useState(() => localStorage.getItem('printpro_active_api_url') || '');

  useEffect(() => {
    localStorage.setItem('printpro_use_api', useApi.toString());
    if (currentApiUrl) {
      localStorage.setItem('printpro_active_api_url', currentApiUrl);
      ApiService.setBaseUrl(currentApiUrl);
    }
  }, [useApi, currentApiUrl]);

  useEffect(() => {
    if (currentUser) {
      const allBranches = StorageService.getBranches();
      setBranches(allBranches);
      if (currentUser.role === UserRole.STAFF) {
        setActiveBranchId(currentUser.branchId || allBranches[0].id);
      } else if (!activeBranchId && allBranches.length > 0) {
        setActiveBranchId(allBranches[0].id);
      }
    }
  }, [currentUser]);

  const loadData = async (silent = false) => {
    if (!currentUser || !activeBranchId) return;
    if (!silent) setIsLoading(true);
    setApiError(null);
    try {
      if (useApi && ApiService.getBaseUrl()) {
        const [prods, inv, ords, custs, sett, cats, usrs, brs] = await Promise.all([
          ApiService.getProducts(),
          ApiService.getInventory(activeBranchId),
          ApiService.getOrders(activeBranchId),
          ApiService.getCustomers(),
          ApiService.getSettings(),
          ApiService.getCategories(),
          ApiService.getUsers(),
          ApiService.getBranches()
        ]);
        
        setProducts(prods);
        setInventory(inv);
        setOrders(ords);
        setCustomers(custs);
        setCategories(cats && cats.length > 0 ? cats : StorageService.getCategories());
        setUsers(usrs);
        setBranches(brs);

        // PERBAIKAN: Prioritaskan apiEndpoints dari Server (sett), 
        // tapi jika server kosong, baru ambil dari Local Storage sebagai fallback
        const localSett = StorageService.getSettings(DEFAULT_SETTINGS);
        setSettings({ 
          ...sett, 
          apiEndpoints: (sett.apiEndpoints && sett.apiEndpoints.length > 0) 
            ? sett.apiEndpoints 
            : (localSett.apiEndpoints || []) 
        });

      } else {
        setProducts(StorageService.getProducts());
        setInventory(StorageService.getInventory(activeBranchId));
        setOrders(StorageService.getOrders(activeBranchId));
        setCustomers(StorageService.getCustomers());
        setSettings(StorageService.getSettings(DEFAULT_SETTINGS));
        setCategories(StorageService.getCategories());
        setUsers(StorageService.getUsers());
        setBranches(StorageService.getBranches());
      }
    } catch (err) {
      if (useApi) setApiError(err instanceof Error ? err.message : 'Koneksi Gagal');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && activeBranchId) {
      loadData();
    }
  }, [useApi, currentUser, activeBranchId, currentApiUrl]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveBranchId('');
    sessionStorage.removeItem('printpro_current_user');
  };

  const saveAction = async (action: () => Promise<any>) => {
    try {
      await action();
      await loadData(true);
      Swal.fire({ icon: 'success', title: 'Berhasil', timer: 1000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan sistem' });
    }
  };

  const handlePush = async () => {
    const confirm = await Swal.fire({ title: 'Push ke Server?', text: `Data lokal akan dikirim ke: ${currentApiUrl}`, icon: 'question', showCancelButton: true, confirmButtonText: 'Ya, Unggah!' });
    if (!confirm.isConfirmed) return;
    setIsLoading(true);
    try {
      await ApiService.syncAll({
        categories: StorageService.getCategories(),
        products: StorageService.getProducts(),
        inventory: StorageService.getInventory(),
        customers: StorageService.getCustomers(),
        orders: StorageService.getOrders()
      });
      Swal.fire('Berhasil!', 'Data lokal telah disinkronkan.', 'success');
    } catch (err) {
      Swal.fire('Gagal!', err instanceof Error ? err.message : 'Gagal', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    const confirm = await Swal.fire({ title: 'Pull dari Server?', text: `Data lokal akan diganti dengan data dari: ${currentApiUrl}`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Tarik!' });
    if (!confirm.isConfirmed) return;
    setIsLoading(true);
    try {
      const [prods, cats, custs, sett, usrs, brs, allInv, allOrders] = await Promise.all([
        ApiService.getProducts(), ApiService.getCategories(), ApiService.getCustomers(), ApiService.getSettings(), ApiService.getUsers(), ApiService.getBranches(), ApiService.getInventory(), ApiService.getOrders()
      ]);
      StorageService.saveProducts(prods);
      StorageService.saveCategories(cats);
      StorageService.saveCustomers(custs);
      const currentLocal = StorageService.getSettings(DEFAULT_SETTINGS);
      StorageService.saveSettings({ ...sett, apiEndpoints: currentLocal.apiEndpoints });
      StorageService.saveUsers(usrs);
      StorageService.saveBranches(brs);
      StorageService.saveInventory(allInv);
      localStorage.setItem('printpro_orders', JSON.stringify(allOrders));
      await loadData();
      Swal.fire('Berhasil!', 'Data lokal telah diperbarui.', 'success');
    } catch (err) {
      Swal.fire('Gagal!', err instanceof Error ? err.message : 'Gagal', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    StorageService.exportAllData({ orders, products, inventory: StorageService.getInventory(), customers, categories, users, branches, settings });
  };

  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED);
    const problematicCount = orders.filter(o => o.status === OrderStatus.CANCELLED || o.status === OrderStatus.RETURNED).length;
    const today = new Date().toDateString();
    const totalSales = activeOrders.filter(o => new Date(o.createdAt).toDateString() === today).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const totalReceivable = activeOrders.reduce((sum, o) => sum + (Number(o.totalAmount || 0) - Number(o.paidAmount || 0)), 0);
    const pendingOrders = activeOrders.filter(o => o.status !== OrderStatus.DONE).length;
    const completedToday = activeOrders.filter(o => o.status === OrderStatus.DONE && new Date(o.createdAt).toDateString() === today).length;
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const amount = activeOrders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString()).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      revenueByDay.push({ date: d.toLocaleDateString('id-ID', { weekday: 'short' }), amount });
    }
    const productMap: Record<string, number> = {};
    activeOrders.forEach(o => { o.items.forEach(item => { productMap[item.productName] = (productMap[item.productName] || 0) + item.quantity; }); });
    const productSales = Object.entries(productMap).map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    return { totalSales, totalReceivable, pendingOrders, completedToday, problematicCount, revenueByDay, productSales };
  }, [orders]);

  if (!currentUser) return <Login onLogin={(u, api, url) => { setCurrentUser(u); setUseApi(api); if (url) setCurrentApiUrl(url); sessionStorage.setItem('printpro_current_user', JSON.stringify(u)); }} />;

  const activeBranch = branches.find(b => b.id === activeBranchId);
  const activeEndpoint = settings.apiEndpoints?.find(ep => ep.url === currentApiUrl);

  const renderContent = () => {
    if (apiError) return <div className="p-20 text-center"><p className="text-red-500 font-bold mb-4">{apiError}</p><button onClick={() => loadData()} className="bg-indigo-600 text-white px-6 py-2 rounded-xl">Coba Lagi</button></div>;
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats as any} recentOrders={orders} onUpdateStatus={(id, s) => saveAction(() => useApi ? ApiService.upsertOrder({...orders.find(o => o.id === id)!, status: s}) : Promise.resolve(StorageService.saveOrder({...orders.find(o => o.id === id)!, status: s})))} />;
      case 'new-order': return <NewOrder products={products} customers={customers} categories={categories} onAddOrder={async (data) => {
          const newOrder = { ...data, id: `ORD-${Date.now()}`, branchId: activeBranchId, createdAt: new Date(), status: OrderStatus.PENDING };
          await saveAction(() => useApi ? ApiService.upsertOrder(newOrder) : Promise.resolve(StorageService.saveOrder(newOrder)));
          setSelectedOrderForInvoice(newOrder);
      }} />;
      case 'orders': return <OrderHistory orders={orders} onUpdateStatus={(id, s) => saveAction(() => useApi ? ApiService.upsertOrder({...orders.find(o => o.id === id)!, status: s}) : Promise.resolve(StorageService.saveOrder({...orders.find(o => o.id === id)!, status: s})))} onUpdateOrder={o => saveAction(() => useApi ? ApiService.upsertOrder(o) : Promise.resolve(StorageService.saveOrder(o)))} onViewInvoice={setSelectedOrderForInvoice} />;
      case 'catalog': return <Catalog products={products} inventory={inventory} categories={categories} onAddProduct={p => saveAction(() => useApi ? ApiService.upsertProduct(p) : Promise.resolve(StorageService.saveProducts([...products, p])))} onEditProduct={p => saveAction(() => useApi ? ApiService.upsertProduct(p) : Promise.resolve(StorageService.saveProducts(products.map(x => x.id === p.id ? p : x))))} onDeleteProduct={id => saveAction(() => useApi ? ApiService.deleteProduct(id) : Promise.resolve(StorageService.saveProducts(products.filter(x => x.id !== id))))} userRole={currentUser.role} />;
      case 'categories': return <CategoryManager categories={categories} onAddCategory={c => saveAction(() => useApi ? ApiService.upsertCategory(c) : Promise.resolve(StorageService.saveCategories([...categories, c])))} onEditCategory={c => saveAction(() => useApi ? ApiService.upsertCategory(c) : Promise.resolve(StorageService.saveCategories(categories.map(x => x.id === c.id ? c : x))))} onDeleteCategory={id => saveAction(() => useApi ? ApiService.deleteCategory(id) : Promise.resolve(StorageService.saveCategories(categories.filter(x => x.id !== id))))} />;
      
      case 'inventory': return (
        <Inventory 
          items={inventory} 
          branches={branches}
          activeBranchId={activeBranchId}
          onBranchChange={setActiveBranchId}
          onAddInventory={i => saveAction(() => useApi ? ApiService.upsertInventory(i) : Promise.resolve(StorageService.saveInventory([...StorageService.getInventory(), i])))} 
          onEditInventory={i => saveAction(() => useApi ? ApiService.upsertInventory(i) : Promise.resolve(StorageService.saveInventory(StorageService.getInventory().map(x => x.id === i.id ? i : x))))} 
          onDeleteInventory={id => saveAction(() => useApi ? ApiService.deleteInventory(id) : Promise.resolve(StorageService.saveInventory(StorageService.getInventory().filter(x => x.id !== id))))} 
          userRole={currentUser.role} 
        />
      );

      case 'customers': return <Customers customers={customers} onEditCustomer={c => saveAction(() => useApi ? ApiService.upsertCustomer(c) : Promise.resolve(StorageService.saveCustomers(customers.map(x => x.id === c.id ? c : x))))} />;
      case 'reports': return <Reports orders={orders} products={products} categories={categories} />;
      case 'settings': return <Settings initialSettings={settings} onUpdateSettings={s => saveAction(() => { StorageService.saveSettings(s); return useApi ? ApiService.saveSettings(s) : Promise.resolve(); })} onPush={handlePush} onPull={handlePull} onExport={handleExport} />;
      case 'branches': return <BranchManager branches={branches} onAddBranch={b => saveAction(() => useApi ? ApiService.upsertBranch(b) : Promise.resolve(StorageService.saveBranches([...branches, b])))} onEditBranch={b => saveAction(() => useApi ? ApiService.upsertBranch(b) : Promise.resolve(StorageService.saveBranches(branches.map(x => x.id === b.id ? b : x))))} onDeleteBranch={id => saveAction(() => useApi ? ApiService.deleteBranch(id) : Promise.resolve(StorageService.saveBranches(branches.filter(x => x.id !== id))))} />;
      case 'users': return <UserManager users={users} branches={branches} onAddUser={u => saveAction(() => useApi ? ApiService.upsertUser(u) : Promise.resolve(StorageService.saveUsers([...users, u])))} onEditUser={u => saveAction(() => useApi ? ApiService.upsertUser(u) : Promise.resolve(StorageService.saveUsers(users.map(x => x.id === u.id ? u : x))))} onDeleteUser={id => saveAction(() => useApi ? ApiService.deleteUser(id) : Promise.resolve(StorageService.saveUsers(users.filter(x => x.id !== id))))} />;
      case 'profile': return <Profile user={currentUser} onUpdate={u => saveAction(() => useApi ? ApiService.upsertUser(u) : Promise.resolve(StorageService.saveUsers(users.map(x => x.id === u.id ? u : x))))} />;
      default: return <Dashboard stats={stats as any} recentOrders={orders} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} extraMenuItems={currentUser.role === UserRole.ADMIN ? [{ id: 'branches', label: 'Cabang / Outlet', icon: '🏪' }] : []} />
      <main className="flex-1 lg:ml-64 min-h-screen pb-20 lg:pb-0 print:hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
           <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <h2 className="font-black text-slate-900 uppercase tracking-tighter text-[10px] leading-tight">{activeTab.replace('-', ' ')}</h2>
               <div className="flex items-center gap-2 mt-0.5">
                 <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${useApi ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                   {activeBranch?.name || 'Cabang...'} {useApi && activeEndpoint ? `• Site: ${activeEndpoint.name}` : ''}
                 </p>
               </div>
             </div>
           </div>
           <div className="flex items-center gap-4">
             {useApi && (
               <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400">SERVER</span>
                  <span className="text-[9px] font-bold text-indigo-600 truncate max-w-[120px]">{currentApiUrl}</span>
               </div>
             )}
             <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black border transition-all ${useApi ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
               {useApi ? 'ONLINE' : 'OFFLINE'}
             </span>
           </div>
        </header>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-indigo-600 animate-pulse uppercase tracking-widest">Inisialisasi Database...</p>
          </div>
        ) : renderContent()}
      </main>
      {selectedOrderForInvoice && <InvoiceModal order={selectedOrderForInvoice} storeSettings={settings} onClose={() => setSelectedOrderForInvoice(null)} />}
    </div>
  );
};

export default App;
