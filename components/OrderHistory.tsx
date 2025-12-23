
import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface OrderHistoryProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onViewInvoice: (order: Order) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, onUpdateStatus, onViewInvoice }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredOrders = orders.filter(o => filterStatus === 'ALL' || o.status === filterStatus);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Riwayat Pesanan</h2>
          <p className="text-sm text-slate-500">Kelola status produksi dan pengiriman pesanan</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
          <button 
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${filterStatus === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}
          >
            SEMUA
          </button>
          {Object.values(OrderStatus).map(status => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${filterStatus === status ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Pelanggan</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Total</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs font-bold text-indigo-600">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{order.customerName}</p>
                    <p className="text-[10px] text-slate-400">{order.items.length} Item</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-900">Rp {order.totalAmount.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={order.status}
                      onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className={`text-[10px] font-black px-2 py-1.5 rounded-lg border outline-none cursor-pointer transition-all ${STATUS_COLORS[order.status]}`}
                    >
                      {Object.values(OrderStatus).map(s => <option key={s} value={s} className="bg-white text-slate-900">{s}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onViewInvoice(order)}
                      className="text-xs font-bold text-slate-400 hover:text-indigo-600 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-all"
                    >
                      Struk
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic text-sm">Tidak ada pesanan ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
