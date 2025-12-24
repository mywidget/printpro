
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
import UserManager from './components/UserManager';
import Login from './components/Login';
import Profile from './components/Profile';
import { Order, OrderStatus, Product, InventoryItem, StoreSettings, Customer, CategoryItem, User, UserRole } from './types';
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('printpro_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
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

  const loadData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setApiError(null);
    try {
      if (useApi) {
        const [prods, inv, ords, custs, sett, cats, usrs] = await Promise.all([
          ApiService.getProducts(),
          ApiService.getInventory(),
          ApiService.getOrders(),
          ApiService.getCustomers(),
          ApiService.getSettings(),
          ApiService.getCategories(),
          ApiService.getUsers()
        ]);
        setProducts(prods);
        setInventory(inv);
        setOrders(ords);
        setCustomers(custs);
        setSettings(sett || DEFAULT_SETTINGS);
        setCategories(cats && cats.length > 0 ? cats : DEFAULT_CATEGORIES);
        setUsers(usrs);
      } else {
        setProducts(StorageService.getProducts());
        setInventory(StorageService.getInventory());
        setOrders(StorageService.getOrders());
        setCustomers(StorageService.getCustomers());
        setSettings(StorageService.getSettings(DEFAULT_SETTINGS));
        setCategories(StorageService.getCategories(DEFAULT_CATEGORIES));
        setUsers(StorageService.getUsers());
      }
    } catch (err) {
      if (useApi) setApiError(err instanceof Error ? err.message : 'Koneksi Gagal');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('printpro_use_api', String(useApi));
      loadData();
    }
  }, [useApi, currentUser]);

  const handleLogin = (user: User, isApiMode: boolean) => {
    setUseApi(isApiMode);
    setCurrentUser(user);
    sessionStorage.setItem('printpro_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('printpro_current_user');
  };

  const handleUpdateActiveProfile = async (updatedUser: User) => {
    try {
      if (useApi) {
        await ApiService.upsertUser(updatedUser);
      }
      
      // Update state user saat ini
      const { password, ...safeUser } = updatedUser;
      setCurrentUser(safeUser as User);
      sessionStorage.setItem('printpro_current_user', JSON.stringify(safeUser));

      // Update di list users agar konsisten
      const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      StorageService.saveUsers(updatedUsers);
    } catch (e) {
      throw e;
    }
  };

  // --- CRUD HANDLERS FOR USERS ---
  const handleAddUser = async (user: User) => {
    try {
      if (useApi) await ApiService.upsertUser(user);
      const updated = [...users, user];
      setUsers(updated);
      StorageService.saveUsers(updated);
    } catch (e) { alert(`Gagal: ${e instanceof Error ? e.message : 'Error'}`); }
  };

  const handleEditUser = async (user: User) => {
    try {
      if (useApi) await ApiService.upsertUser(user);
      const updated = users.map(u => u.id === user.id ? user : u);
      setUsers(updated);
      StorageService.saveUsers(updated);
      
      // Jika user yang diedit adalah user yang sedang login, update sesinya juga
      if (user.id === currentUser?.id) {
         const { password, ...safeUser } = user;
         setCurrentUser(safeUser as User);
         sessionStorage.setItem('printpro_current_user', JSON.stringify(safeUser));
      }
    } catch (e) { alert(`Gagal: ${e instanceof Error ? e.message : 'Error'}`); }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      if (useApi) await ApiService.deleteUser(id);
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      StorageService.saveUsers(updated);
    } catch (e) { alert(`Gagal: ${e instanceof Error ? e.message : 'Error'}`); }
  };

  const handlePush = async () => {
    try {
      const payload = {
        products: StorageService.getProducts(),
        inventory: StorageService.getInventory(),
        orders: StorageService.getOrders(),
        customers: StorageService.getCustomers(),
        settings: StorageService.getSettings(settings),
        categories: StorageService.getCategories(categories),
        users: StorageService.getUsers()
      };
      await ApiService.syncAll(payload);
      alert('Berhasil push!');
      loadData(); 
    } catch (e) { alert(`Gagal push: ${e instanceof Error ? e.message : 'Error'}`); }
  };

  // --- CRUD HANDLERS (Generic) ---
  const handleAddProduct = async (product: Product) => {
    try {
      if (useApi) await ApiService.upsertProduct(product);
      const updated = [...products, product];
      setProducts(updated);
      StorageService.saveProducts(updated);
    } catch (e) { alert(`Error: ${e}`); }
  };

  const handleEditProduct = async (product: Product) => {
    try {
      if (useApi) await ApiService.upsertProduct(product);
      const updated = products.map(p => p.id === product.id ? product : p);
      setProducts(updated);
      StorageService.saveProducts(updated);
    } catch (e) { alert(`Error: ${e}`); }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      if (useApi) await ApiService.deleteProduct(id);
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      StorageService.saveProducts(updated);
    } catch (e) { alert(`Error: ${e}`); }
  };

  const handleAddCategory = async (category: CategoryItem) => {
    try {
      if (useApi) await ApiService.upsertCategory(category);
      const updated = [...categories, category];
      setCategories(updated);
      StorageService.saveCategories(updated);
    } catch (e) { alert(`Error: ${e}`); }
  };

  const handleEditCategory = async (category: CategoryItem) => {
    try {
      if (useApi) await ApiService.upsertCategory(category);
      const updated = categories.map(c => c.id === category.id ? category : c);
      setCategories(updated);
      StorageService.saveCategories(updated);
    } catch (e) { alert(`Error: ${e}`); }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      if (useApi) await ApiService.deleteCategory(id);
      const updated = categories.filter(c => c.id !== id);
      setCategories(updated);
      StorageService.saveCategories(updated);
    } catch (e) { alert(`Error: ${e}`); }
  };

  const handleAddInventory = async (item: InventoryItem) => {
    try {
      if (useApi) await ApiService.upsertInventory(item);
      const updated = [...inventory, item];
      setInventory(updated);
      StorageService.saveInventory(updated);
    } catch (e) { alert(`Error: ${e}`); }
  };

  const handleEditInventory = async (item: InventoryItem) => {
    try {
      if (useApi) await ApiService.upsertInventory(item);
      const updated = inventory.map(i => i.id === item.id ? item : i);
      setInventory(updated);
      StorageService.saveInventory(updated);
    } catch (e) { alert(`Error: ${e}`); }
  };

  const handleDeleteInventory = async (id: string) => {
    try {
      if (useApi) await ApiService.deleteInventory(id);
      const updated = inventory.filter(i => i.id !== id);
      setInventory(updated);
      StorageService.saveInventory(updated);
    } catch (e) { alert(`Error: ${e}`); }
  };

  const handleUpdateSettings = async (newSettings: StoreSettings) => {
    try {
      if (useApi) await ApiService.saveSettings(newSettings);
      setSettings(newSettings);
      StorageService.saveSettings(newSettings);
    } catch (e) { alert(`Error: ${e}`); }
  };

  const handleAddOrder = async (orderData: any) => {
    const newOrder: Order = { ...orderData, id: `ORD-${Date.now()}`, createdAt: new Date(), status: OrderStatus.PENDING };
    try {
      if (useApi) await ApiService.upsertOrder(newOrder);
      StorageService.saveOrder(newOrder);
      setOrders(prev => [newOrder, ...prev]);
      setActiveTab('orders');
      setSelectedOrderForInvoice(newOrder);
    } catch (e) { alert(`Error: ${e}`); }
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      const orderToUpdate = orders.find(o => o.id === id);
      if (!orderToUpdate) return;
      const updatedOrder = { ...orderToUpdate, status };
      const previousOrders = [...orders];
      setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
      if (useApi) {
        try { await ApiService.updateOrderStatus(updatedOrder); } catch (e) { setOrders(previousOrders); alert(`Sync Failed: ${e}`); }
      } else { StorageService.updateOrderStatus(id, status); }
    } catch (e) { alert("Kesalahan."); }
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
      const amount = activeOrders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString()).reduce((sum, o) => sum + o.totalAmount, 0);
      revenueByDay.push({ date: d.toLocaleDateString('id-ID', { weekday: 'short' }), amount });
    }
    return { totalSales, pendingOrders, completedToday, revenueByDay };
  }, [orders]);

  const renderContent = () => {
    if (apiError) return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center">
        <h3 className="text-xl font-black text-slate-900 mb-2">Server Tidak Merespon</h3>
        <p className="text-sm text-slate-500 mb-8">{apiError}</p>
        <div className="flex gap-4">
          <button onClick={() => loadData()} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold">Coba Lagi</button>
          <button onClick={() => setUseApi(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold">Mode Offline</button>
        </div>
      </div>
    );

    if (isLoading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} recentOrders={orders} onUpdateStatus={handleUpdateOrderStatus} />;
      case 'new-order': return <NewOrder products={products} customers={customers} categories={categories} onAddOrder={handleAddOrder} />;
      case 'orders': return <OrderHistory orders={orders} onUpdateStatus={handleUpdateOrderStatus} onViewInvoice={setSelectedOrderForInvoice} />;
      case 'catalog': return <Catalog products={products} inventory={inventory} categories={categories} onAddProduct={handleAddProduct} onEditProduct={handleEditProduct} onDeleteProduct={handleDeleteProduct} />;
      case 'categories': return <CategoryManager categories={categories} onAddCategory={handleAddCategory} onEditCategory={handleEditCategory} onDeleteCategory={handleDeleteCategory} />;
      case 'inventory': return <Inventory items={inventory} onAddInventory={handleAddInventory} onEditInventory={handleEditInventory} onDeleteInventory={handleDeleteInventory} />;
      case 'customers': return <Customers customers={customers.map((c: any) => ({
        id: String(c.id), name: c.name || 'Pelanggan', phone: c.phone || '-', email: c.email || '-',
        total_orders: Number(c.totalOrders || c.total_orders || 0), total_spent: Number(c.totalSpent || c.total_spent || 0)
      }))} />;
      case 'reports': return <Reports />;
      case 'users': return <UserManager users={users} onAddUser={handleAddUser} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} />;
      case 'settings': return <Settings initialSettings={settings} onUpdateSettings={handleUpdateSettings} onPush={handlePush} onPull={loadData} />;
      case 'profile': return <Profile user={currentUser!} onUpdate={handleUpdateActiveProfile} />;
      default: return <Dashboard stats={stats} recentOrders={orders} onUpdateStatus={handleUpdateOrderStatus} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1 lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
           <div className="flex items-center gap-4">
             <h2 className="font-black text-slate-900 uppercase tracking-tighter text-xs">{activeTab.replace('-', ' ')}</h2>
             <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${useApi ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
               {useApi ? 'ONLINE SERVER' : 'LOCAL OFFLINE'}
             </span>
           </div>
           <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <p className="text-[10px] font-black text-slate-900 leading-none">{currentUser.name}</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.role}</p>
             </div>
             <button 
               onClick={() => setActiveTab('profile')}
               className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xs text-white font-black shadow-lg shadow-indigo-100 hover:scale-105 transition-transform"
             >
               {currentUser.name.charAt(0)}
             </button>
           </div>
        </header>
        {renderContent()}
      </main>
      {selectedOrderForInvoice && <InvoiceModal order={selectedOrderForInvoice} storeSettings={settings} onClose={() => setSelectedOrderForInvoice(null)} />}
    </div>
  );
};

export default App;
