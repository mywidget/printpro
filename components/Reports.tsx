
import React, { useMemo, useState } from 'react';
import { StorageService } from '../services/storage';
import { STATUS_COLORS } from '../constants';
import { OrderStatus, Product } from '../types';

const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const products = useMemo(() => StorageService.getProducts(), []);
  
  // Filter order berdasarkan tanggal
  const filteredOrders = useMemo(() => {
    return StorageService.getOrdersByRange(new Date(startDate), new Date(endDate));
  }, [startDate, endDate]);

  const financialData = useMemo(() => {
    let totalRevenue = 0; 
    let totalCostOfSold = 0;   
    let cancelledRevenue = 0;
    let returnedRevenue = 0;
    let materialWasteValue = 0;
    
    // Kelompokkan data harian untuk tabel
    const dailyStats: Record<string, { revenue: number, cost: number, waste: number, orders: number }> = {};

    filteredOrders.forEach(order => {
      const dateKey = new Date(order.createdAt).toLocaleDateString('id-ID');
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { revenue: 0, cost: 0, waste: 0, orders: 0 };
      }

      const isCancelled = order.status === OrderStatus.CANCELLED;
      const isReturned = order.status === OrderStatus.RETURNED;

      let orderCost = 0;
      let orderWaste = 0;

      order.items.forEach(item => {
        const itemVolume = (item.width || 1) * (item.height || 1) * item.quantity;
        const itemHPP = (item.costPrice || 0) * itemVolume;
        orderCost += itemHPP;
      });

      if (isCancelled) {
        cancelledRevenue += order.totalAmount;
        return; 
      }

      if (isReturned) {
        returnedRevenue += order.totalAmount;
        // Retur: Bahan tetap dianggap modal keluar (waste) kecuali yang recoverable
        // Berdasarkan logika storage kita, kita asumsikan waste rata-rata 80% dari HPP jika retur
        const actualWaste = orderCost * 0.8; 
        orderWaste = actualWaste;
        materialWasteValue += actualWaste;
        totalCostOfSold += actualWaste;
      } else {
        // Order Aktif/Berhasil
        totalRevenue += order.totalAmount;
        totalCostOfSold += orderCost;
        dailyStats[dateKey].revenue += order.totalAmount;
      }

      dailyStats[dateKey].cost += orderCost;
      dailyStats[dateKey].waste += orderWaste;
      dailyStats[dateKey].orders += 1;
    });

    const totalProfit = totalRevenue - totalCostOfSold;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { 
      totalRevenue, 
      totalCost: totalCostOfSold, 
      totalProfit, 
      profitMargin,
      cancelledRevenue,
      returnedRevenue,
      materialWasteValue,
      dailyStats: Object.entries(dailyStats).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    };
  }, [filteredOrders]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20 print:p-0">
      {/* Header & Filter (Sembunyi saat cetak) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-slate-900">Laporan Keuangan</h2>
          <p className="text-sm text-slate-500 font-medium">Analisa performa bisnis dan efisiensi produksi</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Dari:</label>
            <input 
              type="date" 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Hingga:</label>
            <input 
              type="date" 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button 
            onClick={handlePrint}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
          >
            <span>🖨️</span> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Tampilan Header Laporan untuk Print */}
      <div className="hidden print:block text-center mb-10">
        <h1 className="text-3xl font-black text-slate-900 uppercase">Laporan Keuangan PrintPro</h1>
        <p className="text-sm text-slate-500 mt-2">Periode: {new Date(startDate).toLocaleDateString('id-ID')} s/d {new Date(endDate).toLocaleDateString('id-ID')}</p>
        <div className="border-b-2 border-slate-900 mt-6"></div>
      </div>

      {/* Ringkasan Angka Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm print:shadow-none print:border-slate-300">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Omzet</p>
          <p className="text-xl font-black text-indigo-600">Rp {financialData.totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2">Pemasukan bersih dari order selesai</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm border-l-4 border-l-emerald-500 print:shadow-none print:border-slate-300">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Laba Bersih</p>
          <p className={`text-xl font-black ${financialData.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            Rp {financialData.totalProfit.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-500 mt-2 font-bold">Keuntungan setelah potong HPP</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm print:shadow-none print:border-slate-300">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Waste Bahan</p>
          <p className="text-xl font-black text-pink-500">Rp {financialData.materialWasteValue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2">Estimasi modal yang hangus (Retur)</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm print:shadow-none print:border-slate-300">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Profit Margin</p>
          <p className="text-xl font-black text-slate-800">{financialData.profitMargin.toFixed(1)}%</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
             <div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, financialData.profitMargin)}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabel Detail Harian */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-slate-300">
            <h3 className="text-lg font-bold mb-6">Ringkasan Aktivitas Harian</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="pb-4">Tanggal</th>
                    <th className="pb-4 text-center">Orders</th>
                    <th className="pb-4 text-right">Omzet</th>
                    <th className="pb-4 text-right">Laba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {financialData.dailyStats.map(([date, stats]: any, i) => {
                    const dailyProfit = stats.revenue - stats.cost;
                    return (
                      <tr key={i} className="text-sm">
                        <td className="py-5 font-bold text-slate-800">{date}</td>
                        <td className="py-5 text-center font-medium text-slate-400">{stats.orders}</td>
                        <td className="py-5 text-right font-bold text-indigo-600">Rp {stats.revenue.toLocaleString()}</td>
                        <td className={`py-5 text-right font-black ${dailyProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          Rp {dailyProfit.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  {financialData.dailyStats.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-slate-400 text-sm italic">Tidak ada transaksi pada periode ini</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Breakdown Kerugian (Waste & Cancel) */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white border border-slate-800 print:bg-white print:text-slate-900 print:border-slate-300 print:shadow-none">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="print:hidden">📉</span> Analisa Kebocoran
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4 print:border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Refund Retur</p>
                  <p className="text-xs text-slate-300 print:text-slate-500">Uang yang dikembalikan</p>
                </div>
                <p className="font-black text-pink-400 print:text-pink-600">Rp {financialData.returnedRevenue.toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-4 print:border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Waste Bahan Baku</p>
                  <p className="text-xs text-slate-300 print:text-slate-500">Modal bahan yang hangus</p>
                </div>
                <p className="font-black text-red-400 print:text-red-600">Rp {financialData.materialWasteValue.toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div>
                  <p className="text-[10px] font-bold text-amber-400 uppercase mb-1">Potensi Batal</p>
                  <p className="text-xs text-slate-400 print:text-slate-500">Omzet hilang dari Cancel</p>
                </div>
                <p className="font-black text-amber-400 print:text-amber-600">Rp {financialData.cancelledRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm print:hidden">
            <h3 className="text-sm font-bold mb-4 uppercase text-slate-400 tracking-widest text-center">Petunjuk Cetak</h3>
            <div className="space-y-3">
              <div className="flex gap-3 text-xs text-slate-500">
                <span className="bg-slate-100 w-5 h-5 flex items-center justify-center rounded-full font-bold">1</span>
                <p>Filter rentang tanggal yang diinginkan di atas.</p>
              </div>
              <div className="flex gap-3 text-xs text-slate-500">
                <span className="bg-slate-100 w-5 h-5 flex items-center justify-center rounded-full font-bold">2</span>
                <p>Klik tombol <b>Cetak Laporan</b> untuk membuka dialog print.</p>
              </div>
              <div className="flex gap-3 text-xs text-slate-500">
                <span className="bg-slate-100 w-5 h-5 flex items-center justify-center rounded-full font-bold">3</span>
                <p>Gunakan opsi <b>Save as PDF</b> jika ingin menyimpan digital.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { 
            background: white; 
            font-size: 12pt;
          }
          #root > div > main > header { 
            display: none !important; 
          }
          #root > div > aside { 
            display: none !important; 
          }
          main { 
            margin: 0 !important;
            padding: 0 !important;
          }
          .rounded-[2rem], .rounded-3xl {
            border-radius: 8px !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;
