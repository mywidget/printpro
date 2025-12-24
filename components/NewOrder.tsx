
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, OrderItem, PaymentMethod, Customer, CategoryItem, PricingType } from '../types';

interface NewOrderProps {
  products: Product[];
  customers: Customer[];
  categories: CategoryItem[];
  onAddOrder: (order: any) => void;
}

const NewOrder: React.FC<NewOrderProps> = ({ products = [], customers = [], categories = [], onAddOrder }) => {
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'All'>('All');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paidAmount, setPaidAmount] = useState<string>('');
  
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
    if (val.trim().length > 0) {
      const filtered = (customers || []).filter(c => 
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
    return matchedRange ? { price: Number(matchedRange.price), isRange: true } : { price: basePrice, isRange: false };
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
        unitPrice: Number(priceResult.price),
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
        const priceResult = calculateEffectivePrice(product, updated.quantity, updated.width || 1, updated.height || 1);
        updated.unitPrice = Number(priceResult.price);
        updated.isRangePrice = priceResult.isRange;
        updated.totalPrice = product.pricingType === PricingType.DIMENSION 
          ? (Number(updated.width) || 1) * (Number(updated.height) || 1) * Number(updated.quantity) * Number(updated.unitPrice)
          : Number(updated.quantity) * Number(updated.unitPrice);
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => setCart(cart.filter(item => item.id !== id));
  
  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  }, [cart]);

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => selectedCategoryId === 'All' || p.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  const handleSubmit = () => {
    if (!customer.name.trim() || cart.length === 0) {
      alert('Nama pelanggan dan item pesanan harus diisi!');
      return;
    }
    
    // Pastikan nilai numerik bersih
    const finalPaidAmount = paidAmount.trim() === '' ? total : Number(paidAmount);
    
    // Kirim data dengan struktur yang diharapkan Backend
    onAddOrder({
      customerName: customer.name.trim(),
      customerPhone: customer.phone.trim(),
      items: [...cart],
      totalAmount: Number(total),
      paidAmount: Number(finalPaidAmount),
      paymentMethod: paymentMethod,
    });
    
    // Reset form
    setCustomer({ name: '', phone: '' });
    setCart([]);
    setPaidAmount('');
    setPaymentMethod(PaymentMethod.CASH);
  };

  return (
    <div className="p-4 md:p-8 flex flex-col lg:grid lg:grid-cols-3 gap-8 pb-24">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
            <h3 className="text-xl font-bold">Produk & Jasa</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
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
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-8">
          <h3 className="text-xl font-bold mb-6">Ringkasan Pesanan</h3>
          
          <div className="space-y-4 mb-6 pb-6 border-b border-slate-100">
            <div className="relative" ref={suggestionsRef}>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Pelanggan</label>
              <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Contoh: Budi Santoso" value={customer.name} autoComplete="off" onChange={e => handleNameChange(e.target.value)} />
              {showSuggestions && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto no-scrollbar">
                  {filteredCustomers.map(c => (
                    <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0">
                      <p className="text-sm font-bold text-slate-800">{c.name}</p><p className="text-[10px] text-slate-400">{c.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Metode Pembayaran</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Jumlah Bayar / DP (Kosongkan jika Lunas)</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                placeholder={`Total: ${total.toLocaleString()}`}
                value={paidAmount} 
                onChange={e => setPaidAmount(e.target.value)} 
              />
            </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto no-scrollbar space-y-4 mb-6">
            {cart.map(item => (
              <div key={item.id} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between mb-2">
                   <p className="font-bold text-sm truncate pr-2">{item.productName}</p>
                   <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
                </div>

                {item.width !== undefined && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">P (meter)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500" 
                        value={item.width} 
                        onChange={e => updateItem(item.id, { width: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">L (meter)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500" 
                        value={item.height} 
                        onChange={e => updateItem(item.id, { height: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
                    <button onClick={() => updateItem(item.id, { quantity: Math.max(1, Number(item.quantity) - 1) })} className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold hover:bg-slate-50 rounded-lg">-</button>
                    <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                    <button onClick={(() => updateItem(item.id, { quantity: Number(item.quantity) + 1 }))} className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold hover:bg-slate-50 rounded-lg">+</button>
                  </div>
                  <div className="text-right">
                    {item.isRangePrice && <p className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">HARGA GROSIR</p>}
                    <p className="font-black text-indigo-600 text-sm">Rp {Number(item.totalPrice || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500">Total Tagihan</span>
              <span className="text-2xl font-black text-indigo-600">Rp {Number(total || 0).toLocaleString()}</span>
            </div>
            {(paidAmount.trim() !== '' && Number(paidAmount) < total) && (
              <div className="flex justify-between items-center py-2 px-3 bg-amber-50 border border-amber-100 rounded-xl">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Sisa Piutang</span>
                <span className="text-sm font-black text-amber-600">Rp {(total - Number(paidAmount)).toLocaleString()}</span>
              </div>
            )}
            <button disabled={cart.length === 0} onClick={handleSubmit} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50">SIMPAN PESANAN</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrder;
