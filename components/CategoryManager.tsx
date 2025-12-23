
import React, { useState } from 'react';
import { CategoryItem } from '../types';

interface CategoryManagerProps {
  categories: CategoryItem[];
  onUpdateCategories: (categories: CategoryItem[]) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onUpdateCategories }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<CategoryItem>>({ name: '', description: '' });

  const openModal = (category?: CategoryItem) => {
    if (category) {
      setEditingCategory(category);
      setFormData(category);
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      onUpdateCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...formData } as CategoryItem : c));
    } else {
      const newCat: CategoryItem = {
        id: `cat-${Date.now()}`,
        name: formData.name || '',
        description: formData.description || '',
      };
      onUpdateCategories([...categories, newCat]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus kategori ini? Produk dengan kategori ini mungkin perlu diupdate.')) {
      onUpdateCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Manajemen Kategori</h2>
          <p className="text-sm text-slate-500">Sesuaikan menu layanan sesuai kebutuhan percetakan Anda</p>
        </div>
        <button onClick={() => openModal()} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          + Kategori Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex justify-between items-start group">
            <div>
              <h3 className="text-lg font-black text-slate-800">{cat.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{cat.description || 'Tidak ada deskripsi'}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => openModal(cat)} className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-xl transition-colors">✏️</button>
              <button onClick={() => handleDelete(cat.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-black">{editingCategory ? 'Edit Kategori' : 'Kategori Baru'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Kategori</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Deskripsi</label>
                <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
