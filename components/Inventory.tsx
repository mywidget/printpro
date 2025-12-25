
import React, { useState } from 'react';
import { InventoryItem, UserRole } from '../types';

interface InventoryProps {
  items: InventoryItem[];
  onAddInventory: (item: InventoryItem) => void;
  onEditInventory: (item: InventoryItem) => void;
  onDeleteInventory: (id: string) => void;
  userRole?: UserRole;
}

const Inventory: React.FC<InventoryProps> = ({ items, onAddInventory, onEditInventory, onDeleteInventory, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'restock'>('add');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});
  const [restockAmount, setRestockAmount] = useState<number>(0);

  const isAdmin = userRole === UserRole.ADMIN;

  const openModal = (mode: 'add' | 'edit' | 'restock', item?: InventoryItem) => {
    if (!isAdmin) return;
    setModalMode(mode);
    if (item) {
      setSelectedItem(item);
      setFormData(item);
      setRestockAmount(0);
    } else {
      setSelectedItem(null);
      setFormData({ category: 'Paper', unit: 'sheets', stock: 0, minStock: 10 });
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
    if (!isAdmin) return;
    if (modalMode === 'add') {
      onAddInventory({ ...formData, id: `inv-${Date.now()}` } as InventoryItem);
    } else if (modalMode === 'edit' && selectedItem) {
      onEditInventory({ ...selectedItem, ...formData } as InventoryItem);
    } else if (modalMode === 'restock' && selectedItem) {
      onEditInventory({ ...selectedItem, stock: selectedItem.stock + restockAmount });
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Hapus material ini dari database?')) {
      onDeleteInventory(id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Inventory</h2>
          <p className="text-sm text-slate-500">Manage your printing materials and supplies</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => openModal('add')}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <span>➕</span> Add New Material
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">{item.category}</span>
                <h3 className="font-bold text-lg mt-2 text-slate-800">{item.name}</h3>
              </div>
              {isAdmin && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openModal('edit', item)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <p className={`text-3xl font-bold ${item.stock <= item.minStock ? 'text-red-600' : 'text-slate-900'}`}>
                  {item.stock}
                </p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{item.unit}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Min. Alert: {item.minStock}</p>
                {isAdmin && (
                  <button 
                    onClick={() => openModal('restock', item)}
                    className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    📥 Restock
                  </button>
                )}
              </div>
            </div>

            {item.stock <= item.minStock && (
              <div className="mt-4 p-2.5 bg-red-50 border border-red-100 rounded-xl text-[10px] text-red-600 font-bold flex items-center gap-2 animate-pulse">
                <span>⚠️</span> CRITICAL STOCK WARNING
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">Inventori kosong.</div>
        )}
      </div>

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <form onSubmit={handleSave}>
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    {modalMode === 'add' ? 'New Material' : modalMode === 'edit' ? 'Edit Material' : `Restock ${selectedItem?.name}`}
                  </h3>
                  <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                {modalMode === 'restock' ? (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">Current Stock</span>
                      <span className="text-lg font-bold text-slate-900">{selectedItem?.stock} {selectedItem?.unit}</span>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Amount to Add</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold"
                        value={restockAmount}
                        onChange={(e) => setRestockAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Material Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Art Paper 150gr"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Category</label>
                        <select 
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={formData.category || 'Paper'}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                          <option>Paper</option>
                          <option>Large Format</option>
                          <option>Ink</option>
                          <option>Finishing</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Unit</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={formData.unit || ''}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Initial Stock</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={formData.stock || 0}
                          onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Min. Stock Alert</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={formData.minStock || 0}
                          onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 bg-slate-50 flex gap-3 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
