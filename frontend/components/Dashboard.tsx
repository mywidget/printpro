
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DashboardStats, Order, OrderStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface ExtendedStats extends DashboardStats {
  problematicCount?: number;
}

interface DashboardProps {
  stats: ExtendedStats;
  recentOrders: Order[];
  onUpdateStatus?: (id: string, status: OrderStatus) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, recentOrders, onUpdateStatus }) => {
  const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8 pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        <StatCard title="Daily Revenue" value={`Rp ${stats.totalSales.toLocaleString()}`} icon="💰" color="text-indigo-600" />
        <StatCard title="Total Piutang" value={`Rp ${stats.totalReceivable.toLocaleString()}`} icon="📉" color="text-amber-600" />
        <StatCard title="Pending Jobs" value={stats.pendingOrders.toString()} icon="⏳" color="text-blue-600" />
        <StatCard title="Completed Today" value={stats.completedToday.toString()} icon="✅" color="text-emerald-600" />
        <StatCard title="Batal & Retur" value={stats.problematicCount?.toString() || '0'} icon="⚠️" color="text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base md:text-lg font-bold">Revenue Overview</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last 7 Days</span>
          </div>
          <div className="h-[250px] md:h-[300px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={window.innerWidth < 640 ? 20 : 40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base md:text-lg font-bold">Top Selling Products</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">By Quantity</span>
          </div>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.productSales} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#475569' }} width={100} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="quantity" radius={[0, 4, 4, 0]} barSize={24}>
                  {stats.productSales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base md:text-lg font-bold mb-6">Live Production status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentOrders.slice(0, 8).map((order) => (
            <div key={order.id} className="p-3 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-xs truncate text-slate-800">{order.customerName}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {order.items?.[0]?.productName || 'No items'} {order.items?.[0] ? `x ${order.items[0].quantity}` : ''}
                  </p>
                </div>
                <p className="text-[9px] font-mono font-bold text-indigo-400">#{order.id.slice(-4)}</p>
              </div>
              
              <select 
                value={order.status}
                onChange={(e) => onUpdateStatus?.(order.id, e.target.value as OrderStatus)}
                className={`w-full text-[10px] font-bold px-2 py-1.5 rounded-lg border outline-none cursor-pointer transition-all ${STATUS_COLORS[order.status]}`}
              >
                {Object.values(OrderStatus).map(status => (
                  <option key={status} value={status} className="bg-white text-slate-900">{status}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-transform active:scale-95 sm:hover:scale-[1.02]">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
      <span className="text-xl">{icon}</span>
    </div>
    <div className={`text-xl md:text-2xl font-black ${color}`}>{value}</div>
  </div>
);

export default Dashboard;
