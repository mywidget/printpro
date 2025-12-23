
import React, { useState } from 'react';
import { Product, InventoryItem, ProductMaterialLink, PricingType, PriceRange, CategoryItem } from '../types';

interface CatalogProps {
  products: Product[];
  inventory: InventoryItem[];
  categories: CategoryItem[];
  onUpdateProducts: (products: Product[]) => void;
}

const Catalog: React.FC<CatalogProps> = ({ products = [], inventory = [], categories = [], onUpdateProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({ 
    materials: [], 
    priceRanges: [],
    pricingType: PricingType.UNIT 
  });

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ 
        ...product, 
        materials: product.materials || [],
        priceRanges: product.priceRanges || []
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        categoryId: categories[0]?.id || '', 
        name: '',
        unit: 'sheet', 
        basePrice: 0, 
        costPrice: 0, 
        materials: [], 
        priceRanges: [],
        pricingType: PricingType.UNIT,
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...formData } as Product : p));
    } else {
      const newProduct: Product = {
        ...formData as Product,
        id: `prod-${Date.now()}`,
      };
      onUpdateProducts([...products, newProduct]);
    }
    closeModal();
  };

  const addMaterialLink = () => {
    const currentMaterials = formData.materials || [];
    setFormData({
      ...formData,
      materials: [...currentMaterials, { materialId: inventory[0]?.id || '', quantityPerUnit: 1, isRecoverable: false }]
    });
  };

  const updateMaterialLink = (index: number, updates: Partial<ProductMaterialLink>) => {
    const currentMaterials = [...(formData.materials || [])];
    currentMaterials[index] = { ...currentMaterials[index], ...updates };
    setFormData({ ...formData, materials: currentMaterials });
  };

  const removeMaterialLink = (index: number) => {
    const currentMaterials = [...(formData.materials || [])];
    currentMaterials.splice(index, 1);
    setFormData({ ...formData, materials: currentMaterials });
  };

  const addPriceRange = () => {
    const currentRanges = formData.priceRanges || [];
    setFormData({
      ...formData,
      priceRanges: [...currentRanges, { min: 1, price: formData.basePrice || 0 }]
    });
  };

  const updatePriceRange = (index: number, updates: Partial<PriceRange>) => {
    const currentRanges = [...(formData.priceRanges || [])];
    currentRanges[index] = { ...currentRanges[index], ...updates };
    setFormData({ ...formData, priceRanges: currentRanges });
  };

  const removePriceRange = (index: number) => {
    const currentRanges = [...(formData.priceRanges || [])];
    currentRanges.splice(index, 1);
    setFormData({ ...formData, priceRanges: currentRanges });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Katalog Produk</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Kelola harga, stok otomatis, dan kebijakan retur bahan</p>
        </div>
        <button onClick={() => openModal()} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
          + Tambah Produk
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Produk</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Tipe</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Harga Jual</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Konfigurasi Bahan</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{product.name || 'Produk Tanpa Nama'}</p>
                    {/* Fix: use dynamic category name */}
                    <p className="text-[10px] text-slate-400">{categories.find(c => c.id === product.categoryId)?.name || 'Tanpa Kategori'}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${product.pricingType === PricingType.DIMENSION ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      {product.pricingType === PricingType.DIMENSION ? 'LUASAN' : 'SATUAN'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-indigo-600">Rp {(Number(product.basePrice) || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1">
                      {product.materials?.map((m, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${m.isRecoverable ? 'bg-emerald-500' : 'bg-slate-200'}`} title={m.isRecoverable ? 'Bisa Balik Stok' : 'Sekali Pakai'}></div>
                      ))}
                      {(!product.materials || product.materials.length === 0) && <span className="text-[10px] text-slate-300 italic">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openModal(product)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all">Edit</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 text-sm font-bold italic">
                    Belum ada produk dalam database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">{editingProduct ? 'Edit Katalog' : 'Produk Baru'}</h3>
                <p className="text-xs text-slate-400">Atur harga dan keterkaitan bahan baku</p>
              </div>
              <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleSave} id="catalog-form" className="flex-1 overflow-y-auto p-8 no-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Section 1: Dasar */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-2">Informasi Produk</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Nama Layanan</label>
                      <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Harga Modal</label>
                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={formData.costPrice || 0} onChange={e => setFormData({...formData, costPrice: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Harga Jual</label>
                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={formData.basePrice || 0} onChange={e => setFormData({...formData, basePrice: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Kategori & Logika</label>
                        <div className="flex gap-2">
                           {/* Fix: use categoryId and dynamic categories */}
                           <select className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={formData.categoryId || ''} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                           </select>
                           <select className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={formData.pricingType} onChange={e => setFormData({...formData, pricingType: e.target.value as PricingType})}>
                             <option value={PricingType.UNIT}>Unit</option>
                             <option value={PricingType.DIMENSION}>m²</option>
                           </select>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Bahan Baku & Recovery */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-emerald-50 pb-2">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Bahan Baku & Retur</h4>
                    <button type="button" onClick={addMaterialLink} className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl hover:bg-emerald-100">+ Link</button>
                  </div>
                  
                  <div className="space-y-4">
                    {(formData.materials || []).map((link, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 relative group">
                        <button type="button" onClick={() => removeMaterialLink(idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                        <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={link.materialId} onChange={e => updateMaterialLink(idx, { materialId: e.target.value })}>
                          {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                        </select>
                        <div className="flex items-center justify-between gap-4">
                           <div className="flex-1">
                             <label className="text-[8px] font-bold text-slate-400 uppercase mb-1 block">Jumlah Pakai</label>
                             <input type="number" step="0.01" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs" value={link.quantityPerUnit} onChange={e => updateMaterialLink(idx, { quantityPerUnit: parseFloat(e.target.value) || 0 })} />
                           </div>
                           <div className="flex items-center gap-2 pt-4">
                             <input type="checkbox" id={`rec-${idx}`} checked={link.isRecoverable} onChange={e => updateMaterialLink(idx, { isRecoverable: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                             <label htmlFor={`rec-${idx}`} className="text-[10px] font-black text-slate-500 cursor-pointer">Kembali?</label>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Grosir */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-amber-50 pb-2">
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Harga Grosir</h4>
                    <button type="button" onClick={addPriceRange} className="text-[10px] font-bold bg-amber-50 text-amber-600 px-3 py-1 rounded-xl hover:bg-amber-100">+ Range</button>
                  </div>
                  <div className="space-y-3">
                    {(formData.priceRanges || []).map((range, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-amber-50/20 p-4 rounded-2xl border border-amber-100">
                        <div className="flex-1">
                          <label className="text-[8px] font-bold text-amber-600 mb-1 block">Min Qty</label>
                          <input type="number" className="w-full px-2 py-2 bg-white border border-amber-100 rounded-xl text-xs font-bold" value={range.min} onChange={e => updatePriceRange(idx, { min: parseFloat(e.target.value) || 1 })} />
                        </div>
                        <div className="flex-1">
                          <label className="text-[8px] font-bold text-amber-600 mb-1 block">Harga Jual</label>
                          <input type="number" className="w-full px-2 py-2 bg-white border border-amber-100 rounded-xl text-xs font-bold text-indigo-600" value={range.price} onChange={e => updatePriceRange(idx, { price: parseInt(e.target.value) || 0 })} />
                        </div>
                        <button type="button" onClick={() => removePriceRange(idx)} className="mt-4 text-red-400 hover:text-red-600 p-1">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button type="button" onClick={closeModal} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Batal</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Simpan Katalog</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
