
import React from 'react';
import { User, UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'new-order', label: 'Order Baru', icon: '➕' },
    { id: 'orders', label: 'Riwayat', icon: '📝' },
    { id: 'catalog', label: 'Produk', icon: '📒' },
    { id: 'categories', label: 'Kategori', icon: '🏷️' },
    { id: 'inventory', label: 'Stok Bahan', icon: '📦' },
    { id: 'customers', label: 'Pelanggan', icon: '👥' },
    { id: 'reports', label: 'Laporan', icon: '📈' },
    { id: 'users', label: 'Manajemen User', icon: '👤', adminOnly: true },
    { id: 'settings', label: 'Pengaturan', icon: '⚙️', adminOnly: true },
    { id: 'profile', label: 'Profil Saya', icon: '🔑' },
  ];

  const filteredMenu = menuItems.filter(item => 
    !item.adminOnly || currentUser?.role === UserRole.ADMIN
  );

  return (
    <>
      <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col h-screen fixed left-0 top-0 z-20 shadow-sm">
        <div className="p-6">
          <h1 className="text-2xl font-black text-indigo-600 flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1 rounded-lg">P</span>
            PrintPro
          </h1>
          {currentUser && (
            <button 
              onClick={() => setActiveTab('profile')}
              className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 w-full text-left hover:bg-indigo-50 transition-all group"
            >
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-400">Logged in as</p>
               <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">{currentUser.name}</p>
            </button>
          )}
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm border border-indigo-100/50'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
           <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-bold transition-all"
           >
             <span className="text-xl">🚪</span>
             <span className="text-sm">Logout</span>
           </button>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex items-center justify-around px-2 py-2 shadow-2xl">
        {filteredMenu.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[9px] font-black mt-0.5 tracking-tighter">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default Sidebar;
