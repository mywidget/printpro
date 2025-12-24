
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
import Login from './components/Login';
import Profile from './components/Profile';
import { Order, OrderStatus, Product, InventoryItem, StoreSettings, Customer, CategoryItem, User } from './types';
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

  const loadData = async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setIsLoading(true);
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
      if (!silent) setIsLoading(false);
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

  const handleAddOrder = async (orderData: any) => {
    const newOrder: Order = { 
      ...orderData, 
      id: `ORD-${Date.now()}`, 
      createdAt: new Date(), 
      status: OrderStatus.PENDING 
    };
    try {
      if (useApi) {
        // Mode Online: Sinkronisasi Pelanggan ke Server
        if (newOrder.customerName) {
           // Cari apakah pelanggan sudah ada di state lokal untuk mendapatkan ID dan akumulasi
           const existing = customers.find(c => 
             (c.phone && c.phone.trim() === newOrder.customerPhone.trim()) || 
             (c.name.toLowerCase() === newOrder.customerName.toLowerCase())
           );
           
           await ApiService.upsertCustomer({
             id: existing ? existing.id : `cust-${Date.now()}`, // Kirim ID agar backend tidak error
             name: newOrder.customerName,
             phone: newOrder.customerPhone,
             total_orders: (existing?.totalOrders || 0) + 1,
             total_spent: (existing?.totalSpent || 0) + newOrder.totalAmount
           } as any);
        }
        await ApiService.upsertOrder(newOrder);
        await loadData(true);
      } else {
        StorageService.saveOrder(newOrder);
        setOrders(prev => [newOrder, ...prev]);
        setCustomers(StorageService.getCustomers());
        setInventory(StorageService.getInventory());
      }
      setActiveTab('orders');
      setSelectedOrderForInvoice(newOrder);
      Swal.fire({ icon: 'success', title: 'Order Disimpan', timer: 1000, showConfirmButton: false });
    } catch (e) { 
      console.error(e);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menyimpan pesanan.' });
    }
  };

  const handleUpdateOrder = async (updatedOrder: Order) => {
    try {
      if (useApi) {
        await ApiService.upsertOrder(updatedOrder);
        await loadData(true);
      } else {
        const all = StorageService.getOrders();
        const updated = all.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        localStorage.setItem('printpro_orders', JSON.stringify(updated));
        setOrders(updated);
      }
    } catch (e) { 
      Swal.fire({ icon: 'error', title: 'Gagal Update', text: 'Data tidak tersimpan.' });
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    const orderToUpdate = orders.find(o => o.id === id);
    if (!orderToUpdate) return;
    const updatedOrder = { ...orderToUpdate, status };
    await handleUpdateOrder(updatedOrder);
  };

  const handleUpsertProduct = async (product: Product) => {
    try {
      if (useApi) { await ApiService.upsertProduct(product); }
      else {
        const all = StorageService.getProducts();
        const existingIdx = all.findIndex(p => p.id === product.id);
        const updated = existingIdx > -1 ? all.map(p => p.id === product.id ? product : p) : [product, ...all];
        StorageService.saveProducts(updated);
        setProducts(updated);
      }
      await loadData(true);
      Swal.fire({ icon: 'success', title: 'Produk Disimpan', timer: 1000, showConfirmButton: false });
    } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menyimpan produk.' }); }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      if (useApi) { await ApiService.deleteProduct(id); }
      else {
        const updated = products.filter(p => p.id !== id);
        StorageService.saveProducts(updated);
        setProducts(updated);
      }
      await loadData(true);
    } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menghapus produk.' }); }
  };

  const handleUpsertCategory = async (cat: CategoryItem) => {
    try {
      if (useApi) { await ApiService.syncAll({ categories: [cat] }); }
      else {
        const all = StorageService.getCategories(DEFAULT_CATEGORIES);
        const exists = all.findIndex(c => c.id === cat.id);
        const updated = exists > -1 ? all.map(c => c.id === cat.id ? cat : c) : [...all, cat];
        StorageService.saveCategories(updated);
        setCategories(updated);
      }
      await loadData(true);
    } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menyimpan kategori.' }); }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      if (useApi) { await ApiService.deleteCategory(id); }
      else {
        const updated = categories.filter(c => c.id !== id);
        StorageService.saveCategories(updated);
        setCategories(updated);
      }
      await loadData(true);
    } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menghapus kategori.' }); }
  };

  const handleUpsertInventory = async (item: InventoryItem) => {
    try {
      if (useApi) { await ApiService.syncAll({ inventory: [item] }); }
      else {
        const all = StorageService.getInventory();
        const exists = all.findIndex(i => i.id === item.id);
        const updated = exists > -1 ? all.map(i => i.id === item.id ? item : i) : [...all, item];
        StorageService.saveInventory(updated);
        setInventory(updated);
      }
      await loadData(true);
    } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menyimpan stok.' }); }
  };

  const handleDeleteInventory = async (id: string) => {
    try {
      if (useApi) { await ApiService.deleteInventory(id); }
      else {
        const updated = inventory.filter(i => i.id !== id);
        StorageService.saveInventory(updated);
        setInventory(updated);
      }
      await loadData(true);
    } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menghapus stok.' }); }
  };

  const handleUpsertUser = async (user: User) => {
    try {
      if (useApi) { await ApiService.upsertUser(user); }
      else {
        const all = StorageService.getUsers();
        const exists = all.findIndex(u => u.id === user.id);
        const updated = exists > -1 ? all.map(u => u.id === user.id ? user : u) : [...all, user];
        StorageService.saveUsers(updated);
        setUsers(updated);
      }
      await loadData(true);
    } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menyimpan user.' }); }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      if (useApi) { await ApiService.deleteUser(id); }
      else {
        const updated = users.filter(u => u.id !== id);
        StorageService.saveUsers(updated);
        setUsers(updated);
      }
      await loadData(true);
    } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menghapus user.' }); }
  };

  const handleUpdateProfile = async (updatedUser: User) => {
    await handleUpsertUser(updatedUser);
    setCurrentUser(updatedUser);
    sessionStorage.setItem('printpro_current_user', JSON.stringify(updatedUser));
  };

  const handleUpdateSettings = async (newSettings: StoreSettings) => {
    try {
      if (useApi) { await ApiService.saveSettings(newSettings); }
      else { StorageService.saveSettings(newSettings); }
      setSettings(newSettings);
      await loadData(true);
    } catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menyimpan pengaturan.' }); }
  };

  const stats = useMemo(() => {
    const activeOrders = (orders || []).filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED);
    const problematicOrders = (orders || []).filter(o => o.status === OrderStatus.CANCELLED || o.status === OrderStatus.RETURNED);
    const today = new Date().toDateString();
    
    const totalSales = activeOrders.filter(o => new Date(o.createdAt).toDateString() === today).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const totalReceivable = activeOrders.reduce((sum, o) => sum + (Number(o.totalAmount || 0) - Number(o.paidAmount || 0)), 0);
    const pendingOrders = activeOrders.filter(o => o.status !== OrderStatus.DONE).length;
    const completedToday = activeOrders.filter(o => o.status === OrderStatus.DONE && new Date(o.createdAt).toDateString() === today).length;
    const problematicCount = problematicOrders.length;
    
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const amount = activeOrders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString()).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      revenueByDay.push({ date: d.toLocaleDateString('id-ID', { weekday: 'short' }), amount });
    }
    return { totalSales, totalReceivable, pendingOrders, completedToday, problematicCount, revenueByDay };
  }, [orders]);

  const renderContent = () => {
    if (apiError) return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center">
        <h3 className="text-xl font-black text-slate-900 mb-2">Server Tidak Merespon</h3>
        <p className="text-sm text-slate-500 mb-8">{apiError}</p>
        <div className="flex gap-4">
          <button onClick={() => loadData()} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100">Coba Lagi</button>
          <button onClick={() => setUseApi(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold">Mode Offline</button>
        </div>
      </div>
    );
    if (isLoading) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black text-indigo-600 animate-pulse tracking-widest">SINKRONISASI DATA...</p>
    </div>;
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats as any} recentOrders={orders} onUpdateStatus={handleUpdateOrderStatus} />;
      case 'new-order': return <NewOrder products={products} customers={customers} categories={categories} onAddOrder={handleAddOrder} />;
      case 'orders': return <OrderHistory orders={orders} onUpdateStatus={handleUpdateOrderStatus} onUpdateOrder={handleUpdateOrder} onViewInvoice={setSelectedOrderForInvoice} />;
      case 'reports': return <Reports orders={orders} products={products} categories={categories} />;
      case 'catalog': return <Catalog products={products} inventory={inventory} categories={categories} onAddProduct={handleUpsertProduct} onEditProduct={handleUpsertProduct} onDeleteProduct={handleDeleteProduct} />;
      case 'categories': return <CategoryManager categories={categories} onAddCategory={handleUpsertCategory} onEditCategory={handleUpsertCategory} onDeleteCategory={handleDeleteCategory} />;
      case 'inventory': return <Inventory items={inventory} onAddInventory={handleUpsertInventory} onEditInventory={handleUpsertInventory} onDeleteInventory={handleDeleteInventory} />;
      case 'customers': return <Customers customers={customers} onEditCustomer={() => {}} />;
      case 'users': return <UserManager users={users} onAddUser={handleUpsertUser} onEditUser={handleUpsertUser} onDeleteUser={handleDeleteUser} />;
      case 'settings': return <Settings initialSettings={settings} onUpdateSettings={handleUpdateSettings} onPush={() => loadData()} onPull={() => loadData()} />;
      case 'profile': return currentUser ? <Profile user={currentUser} onUpdate={handleUpdateProfile} /> : null;
      default: return <Dashboard stats={stats as any} recentOrders={orders} onUpdateStatus={handleUpdateOrderStatus} />;
    }
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

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
             <button onClick={() => setActiveTab('profile')} className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xs text-white font-black shadow-lg hover:scale-105 transition-transform">{currentUser.name.charAt(0)}</button>
           </div>
        </header>
        {renderContent()}
      </main>
      {selectedOrderForInvoice && <InvoiceModal order={selectedOrderForInvoice} storeSettings={settings} onClose={() => setSelectedOrderForInvoice(null)} />}
    </div>
  );
};

export default App;
