
import React, { useState } from 'react';
import { InventoryItem, UserRole, Branch } from '../types';

interface InventoryProps {
  items: InventoryItem[];
  branches: Branch[];
  activeBranchId: string;
  onBranchChange: (branchId: string) => void;
  onAddInventory: (item: InventoryItem) => void;
  onEditInventory: (item: InventoryItem) => void;
  onDeleteInventory: (id: string) => void;
  userRole?: UserRole;
}

const Inventory: React.FC<InventoryProps> = ({ 
  items, 
  branches, 
  activeBranchId, 
  onBranchChange,
  onAddInventory, 
  onEditInventory, 
  onDeleteInventory, 
  userRole 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'restock'>('add');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});
  const [restockAmount, setRestockAmount] = useState<number>(0);

  const isAdmin = userRole === UserRole.ADMIN;

  const openModal = (mode: 'add' | 'edit' | 'restock', item?: InventoryItem) => {
    setModalMode(mode);
    if (item) {
      setSelectedItem(item);
      setFormData(item);
      setRestockAmount(0);
    } else {
      setSelectedItem(null);
      // Default ke cabang yang sedang aktif dilihat
      setFormData({ 
        category: 'Paper', 
        unit: 'sheet', 
        stock: 0, 
        minStock: 10, 
        branchId: activeBranchId 
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setFormData({});
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'add') {
      onAddInventory({ 
        ...formData, 
        id: `inv-${Date.now()}`,
        // Pastikan branchId terisi, jika admin tidak pilih, gunakan activeBranchId
        branchId: formData.branchId || activeBranchId 
      } as InventoryItem);
    } else if (modalMode === 'edit' && selectedItem) {
      onEditInventory({ ...selectedItem, ...formData } as InventoryItem);
    } else if (modalMode === 'restock' && selectedItem) {
      onEditInventory({ ...selectedItem, stock: Number(selectedItem.stock) + Number(restockAmount) });
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus material ini dari database?')) {
      onDeleteInventory(id);
    }
  };

  const currentBranchName = branches.find(b => b.id === activeBranchId)?.name || 'Cabang';

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gudang Bahan Baku</h2>
          <p className="text-sm text-slate-500 font-medium italic">Monitor stok di: <span className="text-indigo-600 font-bold">{currentBranchName}</span></p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* FITUR KHUSUS ADMIN: FILTER CABANG */}
          {isAdmin && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gudang Cabang:</span>
              <select 
                className="text-xs font-bold text-indigo-600 outline-none bg-transparent"
                value={activeBranchId}
                onChange={(e) => onBranchChange(e.target.value)}
              >
                {branches.map(br => (
                  <option key={br.id} value={br.id}>{br.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
          )}
          
          <button 
            onClick={() => openModal('add')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
          >
            <span>➕</span> TAMBAH MATERIAL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 tracking-tighter">
                  {item.category}
                </span>
                <h3 className="font-black text-slate-800 mt-3 leading-tight uppercase text-sm">{item.name}</h3>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                <button 
                  onClick={() => openModal('edit', item)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  ✏️
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-end justify-between bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stok Tersedia</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-black ${item.stock <= item.minStock ? 'text-red-600' : 'text-slate-900'}`}>
                    {item.stock}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.unit}</span>
                </div>
              </div>
              <button 
                onClick={() => openModal('restock', item)}
                className="bg-white text-indigo-600 border border-indigo-100 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              >
                RESTOCK
              </button>
            </div>

            {item.stock <= item.minStock && (
              <div className="mt-4 flex items-center gap-2 text-red-600 animate-pulse">
                <span className="text-xs">⚠️</span>
                <span className="text-[9px] font-black uppercase tracking-tighter text-red-600">STOK KRITIS (Min: {item.minStock})</span>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <p className="text-4xl mb-4 grayscale">📦</p>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Tidak ada material di gudang ini</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <form onSubmit={handleSave}>
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {modalMode === 'add' ? 'Material Baru' : modalMode === 'edit' ? 'Ubah Material' : `Restock: ${selectedItem?.name}`}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">Lokasi: {currentBranchName}</p>
                  </div>
                  <button type="button" onClick={closeModal} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400">✕</button>
                </div>

                {modalMode === 'restock' ? (
                  <div className="space-y-6">
                    <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Stok Saat Ini</span>
                      <span className="text-xl font-black text-indigo-700">{selectedItem?.stock} {selectedItem?.unit}</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Jumlah Stok Masuk</label>
                      <input 
                        type="number" 
                        required
                        autoFocus
                        min="1"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-2xl font-black text-indigo-600"
                        value={restockAmount}
                        onChange={(e) => setRestockAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* KHUSUS ADMIN: PILIH CABANG SAAT TAMBAH MATERIAL */}
                    {isAdmin && modalMode === 'add' && (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Target Cabang</label>
                        <select 
                          className="w-full px-5 py-3.5 bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold rounded-2xl outline-none"
                          value={formData.branchId || activeBranchId}
                          onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                        >
                          {branches.map(br => <option key={br.id} value={br.id}>{br.name.toUpperCase()}</option>)}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Nama Material</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:border-indigo-500 transition-all"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Contoh: Kertas Art Paper 210gr"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Kategori</label>
                        <select 
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                          value={formData.category || 'Paper'}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                          <option>Paper</option>
                          <option>Large Format</option>
                          <option>Ink</option>
                          <option>Display</option>
                          <option>Finishing</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Satuan</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                          value={formData.unit || ''}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          placeholder="pcs / sheet"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Stok Awal</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          disabled={modalMode === 'edit'}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none disabled:opacity-50"
                          value={formData.stock || 0}
                          onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Batas Minimum</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none"
                          value={formData.minStock || 0}
                          onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-8 bg-slate-50 flex gap-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">BATAL</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">SIMPAN</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
