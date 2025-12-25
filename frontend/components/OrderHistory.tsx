
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, PaymentMethod } from '../types';
import { STATUS_COLORS } from '../constants';

interface OrderHistoryProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onUpdateOrder: (order: Order) => void;
  onViewInvoice: (order: Order) => void;
}

const ITEMS_PER_PAGE = 10;

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, onUpdateStatus, onUpdateOrder, onViewInvoice }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showRepayModal, setShowRepayModal] = useState<Order | null>(null);
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [repayPaymentMethod, setRepayPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = filterStatus === 'ALL' || 
                        (filterStatus === 'PIUTANG' ? (o.paidAmount < o.totalAmount && o.status !== OrderStatus.CANCELLED) : o.status === filterStatus);
      const matchSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         o.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [orders, filterStatus, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRepayModal) return;
    const amount = parseFloat(repayAmount);
    if (isNaN(amount) || amount <= 0) return;

    const updatedOrder = {
      ...showRepayModal,
      paidAmount: showRepayModal.paidAmount + amount,
      paymentMethod: repayPaymentMethod
    };

    onUpdateOrder(updatedOrder);
    setShowRepayModal(null);
    setRepayAmount('');
  };

  const openRepayModal = (order: Order) => {
    setShowRepayModal(order);
    setRepayAmount((order.totalAmount - order.paidAmount).toString());
    setRepayPaymentMethod(order.paymentMethod);
  };

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Riwayat Pesanan</h2>
          <p className="text-sm text-slate-500">Kelola status produksi dan piutang pelanggan</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
          <input 
            type="text" 
            placeholder="Cari Order ID atau Nama..."
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 min-w-[250px]"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button 
              onClick={() => { setFilterStatus('ALL'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${filterStatus === 'ALL' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500'}`}
            >
              SEMUA
            </button>
            <button 
              onClick={() => { setFilterStatus('PIUTANG'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${filterStatus === 'PIUTANG' ? 'bg-amber-500 text-white border-amber-500 shadow-lg' : 'bg-white text-amber-500 border-amber-200'}`}
            >
              📉 PIUTANG
            </button>
            {Object.values(OrderStatus).slice(0, 6).map(status => (
              <button 
                key={status}
                onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all whitespace-nowrap ${filterStatus === status ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pembayaran</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Produksi</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.map(order => {
                const isPaid = order.paidAmount >= order.totalAmount;
                const balance = order.totalAmount - order.paidAmount;
                
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="font-mono text-xs font-black text-indigo-600">#{order.id.slice(-6).toUpperCase()}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-800">{order.customerName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter">{order.paymentMethod.replace('_', ' ')}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase mb-1 border ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          {isPaid ? 'Lunas' : 'Belum Lunas'}
                        </span>
                        {!isPaid && <p className="text-[9px] font-bold text-slate-400">Sisa: Rp {balance.toLocaleString()}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <select 
                        value={order.status}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                        className={`text-[10px] font-black px-2 py-1.5 rounded-lg border outline-none cursor-pointer transition-all ${STATUS_COLORS[order.status]}`}
                      >
                        {Object.values(OrderStatus).map(s => <option key={s} value={s} className="bg-white text-slate-900">{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {!isPaid && order.status !== OrderStatus.CANCELLED && (
                          <button 
                            onClick={() => openRepayModal(order)}
                            className="text-[9px] font-black bg-indigo-600 text-white px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                          >
                            BAYAR
                          </button>
                        )}
                        <button 
                          onClick={() => onViewInvoice(order)}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                        >
                          📄
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 text-sm font-bold italic uppercase tracking-widest">
                    Tidak ada pesanan ditemukan.
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
             Menampilkan {paginatedOrders.length} dari {filteredOrders.length} pesanan
           </p>
           <div className="flex items-center gap-2">
             <button 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-all"
             >
               ⬅️
             </button>
             
             <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pg = i + 1;
                  // Show limited pages if too many
                  if (totalPages > 5 && Math.abs(pg - currentPage) > 2 && pg !== 1 && pg !== totalPages) {
                    if (pg === 2 || pg === totalPages - 1) return <span key={pg} className="px-1 text-slate-300">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={pg}
                      onClick={() => handlePageChange(pg)}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                        currentPage === pg ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}
             </div>

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

      {/* Repay Modal Logic Omitted for Brevity as per existing code */}
      {showRepayModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900">Pelunasan Tagihan</h3>
                <p className="text-xs text-slate-400 mt-1">Order #{showRepayModal.id.slice(-6)}</p>
              </div>
              <button onClick={() => setShowRepayModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleRepaySubmit} className="p-8 space-y-6">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <div className="flex justify-between text-xs font-bold text-indigo-400 uppercase mb-2">
                  <span>Total Tagihan</span>
                  <span>Rp {showRepayModal.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-indigo-400 uppercase">
                  <span>Telah Dibayar</span>
                  <span>Rp {showRepayModal.paidAmount.toLocaleString()}</span>
                </div>
                <div className="border-t border-indigo-100 mt-3 pt-3 flex justify-between text-sm font-black text-indigo-600">
                  <span>Sisa Piutang</span>
                  <span>Rp {(showRepayModal.totalAmount - showRepayModal.paidAmount).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Metode Pembayaran</label>
                  <select 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    value={repayPaymentMethod}
                    onChange={e => setRepayPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    {Object.values(PaymentMethod).map(m => (
                      <option key={m} value={m}>{m.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Jumlah Pembayaran Baru</label>
                  <input 
                    type="number" 
                    autoFocus
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xl text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                    value={repayAmount}
                    max={showRepayModal.totalAmount - showRepayModal.paidAmount}
                    onChange={e => setRepayAmount(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setShowRepayModal(null)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Konfirmasi Bayar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
