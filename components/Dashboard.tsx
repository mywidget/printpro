
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardStats, Order, OrderStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface DashboardProps {
  stats: DashboardStats;
  recentOrders: Order[];
  onUpdateStatus?: (id: string, status: OrderStatus) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, recentOrders, onUpdateStatus }) => {
  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8 pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Daily Revenue" value={`Rp ${stats.totalSales.toLocaleString()}`} icon="💰" color="text-emerald-600" />
        <StatCard title="Pending Jobs" value={stats.pendingOrders.toString()} icon="⏳" color="text-amber-600" />
        <StatCard title="Completed Today" value={stats.completedToday.toString()} icon="✅" color="text-indigo-600" />
        <StatCard title="Total Orders" value={recentOrders.length.toString()} icon="📝" color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
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
          <h3 className="text-base md:text-lg font-bold mb-6">Live Production status</h3>
          <div className="space-y-3">
            {recentOrders.slice(0, 6).map((order) => (
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
            {recentOrders.length === 0 && (
              <div className="text-center py-10">
                <p className="text-slate-300 text-3xl mb-2">📭</p>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No active jobs</p>
              </div>
            )}
          </div>
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
