
import React, { useState } from 'react';

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string;
  total_orders: number;
  total_spent: string | number;
}

interface CustomersProps {
  customers: CustomerData[];
}

const Customers: React.FC<CustomersProps> = ({ customers }) => {
  const [search, setSearch] = useState('');

  const filteredCustomers = (customers || []).filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (c.phone || '').includes(search)
  );

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Customer Database</h2>
          <p className="text-xs md:text-sm text-slate-500">Track loyal customers and their spending</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search name or phone..."
            className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Orders</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Total Spent</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase text-right">Loyalty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => {
                // Defensive check for star count to prevent RangeError
                const rawOrders = Number(customer.total_orders);
                const starCount = isNaN(rawOrders) ? 0 : Math.max(0, Math.min(5, Math.ceil(rawOrders / 2)));
                
                return (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{customer.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{customer.phone} • {customer.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">{customer.total_orders}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-indigo-600">Rp {Number(customer.total_spent || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {starCount > 0 && [...Array(starCount)].map((_, i) => (
                          <span key={i} className="text-[10px]">⭐</span>
                        ))}
                        {starCount === 0 && <span className="text-[10px] text-slate-300">-</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                     <p className="text-slate-400 text-sm font-bold">No customers found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;
