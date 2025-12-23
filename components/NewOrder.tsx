
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, OrderItem, PaymentMethod, Customer, InventoryItem, PricingType, CategoryItem } from '../types';
import { getAiRecommendation } from '../geminiService';
import { StorageService } from '../services/storage';

interface NewOrderProps {
  products: Product[];
  customers: Customer[];
  categories: CategoryItem[];
  onAddOrder: (order: any) => void;
}

const NewOrder: React.FC<NewOrderProps> = ({ products = [], customers = [], categories = [], onAddOrder }) => {
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  // Fix: use string for category ID
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'All'>('All');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [aiInput, setAiInput] = useState('');
  const [aiAdvice, setAiAdvice] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNameChange = (val: string) => {
    setCustomer({ ...customer, name: val });
    if (val.length > 0) {
      const filtered = customers.filter(c => 
        (c.name || '').toLowerCase().includes(val.toLowerCase()) || 
        (c.phone || '').includes(val)
      );
      setFilteredCustomers(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCustomer = (c: Customer) => {
    setCustomer({ name: c.name, phone: c.phone });
    setShowSuggestions(false);
  };

  const calculateEffectivePrice = (product: Product, qty: number, width: number = 1, height: number = 1): { price: number, isRange: boolean } => {
    const basePrice = Number(product.basePrice || 0);
    if (!product.priceRanges || product.priceRanges.length === 0) {
      return { price: basePrice, isRange: false };
    }

    const volume = product.pricingType === PricingType.DIMENSION ? (width * height * qty) : qty;
    const sortedRanges = [...product.priceRanges].sort((a, b) => b.min - a.min);
    const matchedRange = sortedRanges.find(r => volume >= r.min);

    if (matchedRange) {
      return { price: Number(matchedRange.price), isRange: true };
    }

    return { price: basePrice, isRange: false };
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing && product.pricingType === PricingType.UNIT) {
      updateItem(existing.id, { quantity: existing.quantity + 1 });
    } else {
      const isDim = product.pricingType === PricingType.DIMENSION;
      const initialQty = 1;
      const initialW = 1;
      const initialH = 1;
      
      const priceResult = calculateEffectivePrice(product, initialQty, initialW, initialH);

      const newItem: OrderItem = {
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        productName: product.name,
        quantity: initialQty,
        width: isDim ? initialW : undefined,
        height: isDim ? initialH : undefined,
        unitPrice: priceResult.price,
        costPrice: Number(product.costPrice || 0),
        totalPrice: isDim ? (initialW * initialH * initialQty * priceResult.price) : (initialQty * priceResult.price),
        specs: '',
        isRangePrice: priceResult.isRange
      };
      setCart([...cart, newItem]);
    }
  };

  const updateItem = (id: string, updates: Partial<OrderItem>) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === item.productId);
        if (!product) return item;
        
        const updated = { ...item, ...updates };
        const qty = updated.quantity;
        const w = updated.width || 1;
        const h = updated.height || 1;
        
        const priceResult = calculateEffectivePrice(product, qty, w, h);
        updated.unitPrice = priceResult.price;
        updated.isRangePrice = priceResult.isRange;

        if (product.pricingType === PricingType.DIMENSION) {
          updated.totalPrice = w * h * qty * updated.unitPrice;
        } else {
          updated.totalPrice = qty * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => setCart(cart.filter(item => item.id !== id));
  const total = cart.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  const filteredProducts = useMemo(() => {
    // Fix: filter by categoryId
    return (products || []).filter(p => selectedCategoryId === 'All' || p.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  const handleSubmit = () => {
    if (!customer.name || cart.length === 0) {
      alert('Nama pelanggan dan item pesanan harus diisi!');
      return;
    }
    onAddOrder({
      customerName: customer.name,
      customerPhone: customer.phone,
      items: cart,
      totalAmount: total,
      paidAmount: paidAmount || total,
      paymentMethod: paymentMethod,
    });
    setCustomer({ name: '', phone: '' });
    setCart([]);
    setPaidAmount(0);
    setPaymentMethod(PaymentMethod.CASH);
  };

  return (
    <div className="p-4 md:p-8 flex flex-col lg:grid lg:grid-cols-3 gap-8 pb-24">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
            <h3 className="text-xl font-bold">Produk & Jasa</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {/* Fix: handle dynamic categories */}
              {[{ id: 'All', name: 'All' }, ...categories].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    selectedCategoryId === cat.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition-all flex flex-col h-full group relative"
              >
                {product.priceRanges && product.priceRanges.length > 0 && (
                  <span className="absolute -top-2 -right-1 bg-amber-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-sm z-10 animate-bounce">GROSIR</span>
                )}
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-sm group-hover:text-indigo-600 leading-tight">{product.name}</p>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${product.pricingType === PricingType.DIMENSION ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {product.pricingType === PricingType.DIMENSION ? 'Meter' : 'Pcs'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-4 line-clamp-2">{product.description}</p>
                <div className="mt-auto">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mulai dari</p>
                   <p className="text-xs font-black text-slate-900">Rp {(Number(product.basePrice) || 0).toLocaleString()}</p>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-slate-400 font-bold">Produk tidak tersedia</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">✨ AI Expert Printing</h3>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none"
                placeholder="Rekomendasi cetak banner indoor..."
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
              />
              <button onClick={async () => { if(!aiInput) return; setIsAiLoading(true); setAiAdvice(await getAiRecommendation(aiInput)); setIsAiLoading(false); }} className="bg-white text-indigo-900 font-bold px-4 rounded-xl text-xs hover:bg-indigo-50">{isAiLoading ? '...' : 'Tanya'}</button>
            </div>
            {aiAdvice && <p className="text-xs leading-relaxed text-indigo-100 bg-white/5 p-4 rounded-2xl border border-white/5">{aiAdvice}</p>}
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-8">
          <h3 className="text-xl font-bold mb-6">Ringkasan Pesanan</h3>
          
          <div className="space-y-3 mb-6 pb-6 border-b border-slate-100">
            <div className="relative" ref={suggestionsRef}>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Pelanggan</label>
              <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Contoh: Budi Santoso" value={customer.name} autoComplete="off" onChange={e => handleNameChange(e.target.value)} onFocus={() => customer.name.length > 0 && setShowSuggestions(filteredCustomers.length > 0)} />
              {showSuggestions && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto no-scrollbar">
                  {filteredCustomers.map(c => (
                    <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0 flex justify-between items-center group">
                      <div><p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600">{c.name}</p><p className="text-[10px] text-slate-400">{c.phone}</p></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">No. Telepon</label>
              <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="0812xxxx" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
            </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto no-scrollbar space-y-4 mb-6">
            {cart.map(item => {
              const product = products.find(p => p.id === item.productId);
              const isDim = product?.pricingType === PricingType.DIMENSION;
              return (
                <div key={item.id} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between mb-3">
                    <div>
                       <p className="font-bold text-sm truncate pr-2">{item.productName}</p>
                       {item.isRangePrice && <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Grosir Applied</span>}
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                  {isDim && (
                    <div className="grid grid-cols-2 gap-3 mb-3 bg-white p-3 rounded-xl border border-slate-100">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Lebar (m)</label>
                        <input type="number" step="0.1" min="0.1" className="w-full px-2 py-1.5 bg-slate-50 border border-slate-100 rounded text-xs outline-none" value={item.width} onChange={e => updateItem(item.id, { width: parseFloat(e.target.value) || 0.1 })} />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Tinggi (m)</label>
                        <input type="number" step="0.1" min="0.1" className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none" value={item.height} onChange={e => updateItem(item.id, { height: parseFloat(e.target.value) || 0.1 })} />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
                      <button onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold">-</button>
                      <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                      <button onClick={(() => updateItem(item.id, { quantity: item.quantity + 1 }))} className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold">+</button>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] text-slate-400 line-through">Rp {(Number(product?.basePrice) || 0).toLocaleString()}</p>
                       <p className="font-black text-indigo-600 text-sm">Rp {(Number(item.totalPrice) || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-bold text-slate-500">Total Tagihan</span>
              <span className="text-2xl font-black text-indigo-600">Rp {(Number(total) || 0).toLocaleString()}</span>
            </div>
            <button disabled={cart.length === 0} onClick={handleSubmit} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50">SIMPAN PESANAN</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrder;
