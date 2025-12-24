
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { OrderStatus, Order, Product, CategoryItem } from '../types';

interface ReportsProps {
  orders: Order[];
  products: Product[];
  categories?: CategoryItem[];
}

const Reports: React.FC<ReportsProps> = ({ orders = [], products = [], categories = [] }) => {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const dateFilteredOrders = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return (orders || []).filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, startDate, endDate]);

  const financialSummary = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let cancelledRevenue = 0;
    let returnedRevenue = 0;
    let returnedCost = 0;
    const statusCounts: Record<string, number> = {};

    dateFilteredOrders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      const orderTotal = Number(o.totalAmount || 0);
      let orderCost = 0;
      (o.items || []).forEach(i => {
        const vol = (Number(i.width) || 1) * (Number(i.height) || 1) * Number(i.quantity);
        orderCost += (Number(i.costPrice) || 0) * vol;
      });

      if (o.status === OrderStatus.CANCELLED) {
        cancelledRevenue += orderTotal;
      } else if (o.status === OrderStatus.RETURNED) {
        returnedRevenue += orderTotal;
        returnedCost += orderCost;
      } else {
        revenue += orderTotal;
        cost += orderCost;
      }
    });

    return { 
      revenue, cost, profit: revenue - cost, 
      cancelledRevenue, returnedRevenue, returnedCost,
      statusData: Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
    };
  }, [dateFilteredOrders]);

  const COLORS = ['#4f46e5', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#f43f5e'];

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Laporan Keuangan & Operasional</h2>
          <p className="text-sm text-slate-500 font-medium">Analisa mendalam performa bisnis dan analisa kerugian</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold">
            <label className="text-slate-400 uppercase">Periode:</label>
            <input type="date" className="px-2 py-1 bg-slate-50 border rounded-lg" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span className="text-slate-300">/</span>
            <input type="date" className="px-2 py-1 bg-slate-50 border rounded-lg" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold">🖨️ Cetak</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl">
          <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Total Omzet (Bersih)</p>
          <p className="text-2xl font-black">Rp {financialSummary.revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimasi Laba</p>
          <p className="text-2xl font-black text-emerald-600">Rp {financialSummary.profit.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kerugian Retur (HPP)</p>
          <p className="text-2xl font-black text-rose-600">Rp {financialSummary.returnedCost.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Omzet Hilang (Batal)</p>
          <p className="text-2xl font-black text-amber-600">Rp {financialSummary.cancelledRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-8">📊 Distribusi Status Transaksi</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={financialSummary.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {financialSummary.statusData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">⚠️ Log Batal & Retur</h3>
          <div className="overflow-y-auto max-h-[300px] no-scrollbar">
             <table className="w-full text-left">
               <thead className="sticky top-0 bg-white">
                 <tr className="border-b text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <th className="pb-4">Order ID</th>
                   <th className="pb-4">Pelanggan</th>
                   <th className="pb-4 text-center">Status</th>
                   <th className="pb-4 text-right">Nilai</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {dateFilteredOrders.filter(o => o.status === OrderStatus.CANCELLED || o.status === OrderStatus.RETURNED).map(o => (
                   <tr key={o.id} className="text-sm">
                     <td className="py-4 font-mono font-bold text-indigo-500">#{o.id.slice(-6)}</td>
                     <td className="py-4 font-medium">{o.customerName}</td>
                     <td className="py-4 text-center">
                       <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${o.status === OrderStatus.CANCELLED ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                         {o.status}
                       </span>
                     </td>
                     <td className="py-4 text-right font-bold text-slate-400">Rp {o.totalAmount.toLocaleString()}</td>
                   </tr>
                 ))}
                 {dateFilteredOrders.filter(o => o.status === OrderStatus.CANCELLED || o.status === OrderStatus.RETURNED).length === 0 && (
                   <tr><td colSpan={4} className="py-12 text-center text-slate-300 italic">Tidak ada catatan pada periode ini.</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
