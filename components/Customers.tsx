
import React, { useState, useMemo } from 'react';
import { Customer } from '../types';

interface CustomersProps {
  customers: Customer[];
  onEditCustomer: (customer: Customer) => void;
}

const ITEMS_PER_PAGE = 12;

const Customers: React.FC<CustomersProps> = ({ customers, onEditCustomer }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  // Filter Logic
  const filteredCustomers = useMemo(() => {
    return (customers || []).filter(c => 
      (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.phone || '').includes(search)
    );
  }, [customers, search]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      onEditCustomer({ ...editingCustomer, ...formData } as Customer);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Database Pelanggan</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Pantau pelanggan setia dan riwayat transaksi mereka</p>
        </div>
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Cari nama atau telepon..."
            className="w-full sm:w-72 pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm group-hover:shadow-md"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
          <span className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">🔍</span>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi Pelanggan</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Order</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Belanja</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Loyalty</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCustomers.map((customer) => {
                const starCount = Math.max(0, Math.min(5, Math.ceil(Number(customer.totalOrders) / 2)));
                
                return (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900">{customer.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-bold">{customer.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black">
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-800">Rp {Number(customer.totalSpent || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center gap-0.5">
                        {starCount > 0 ? [...Array(starCount)].map((_, i) => (
                          <span key={i} className="text-[10px]">⭐</span>
                        )) : <span className="text-[10px] text-slate-300">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button 
                        onClick={() => openEditModal(customer)}
                        className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-100/50 transition-all active:scale-90"
                       >
                         ✏️
                       </button>
                    </td>
                  </tr>
                );
              })}
              {paginatedCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                     <div className="max-w-xs mx-auto">
                        <p className="text-4xl mb-4 grayscale">👥</p>
                        <p className="text-slate-400 text-sm font-black uppercase tracking-widest">Tidak ada pelanggan</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             Halaman {currentPage} dari {totalPages}
           </p>
           <div className="flex items-center gap-2">
             <button 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-all"
             >
               ⬅️
             </button>
             <button 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-all"
             >
               ➡️
             </button>
           </div>
        </div>
      )}

      {/* Modal Edit Pelanggan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900">Edit Pelanggan</h3>
                <p className="text-xs text-slate-400 mt-1">Ubah identitas kontak pelanggan</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Lengkap</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">No. Telepon / WhatsApp</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" 
                  value={formData.phone || ''} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Email (Opsional)</label>
                <input 
                  type="email" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" 
                  value={formData.email || ''} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
