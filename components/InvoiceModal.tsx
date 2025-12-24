
import React, { useState } from 'react';
import { Order, StoreSettings } from '../types';

interface InvoiceModalProps {
  order: Order;
  storeSettings: StoreSettings;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, storeSettings, onClose }) => {
  const [printMode, setPrintMode] = useState<'thermal' | 'inkjet'>('inkjet');

  const handlePrint = () => {
    window.print();
  };

  const items = order.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white overflow-y-auto">
      <div className={`bg-white rounded-3xl w-full transition-all duration-300 shadow-2xl animate-in zoom-in duration-300 print:shadow-none print:rounded-none print:m-0 ${
        printMode === 'thermal' ? 'max-w-[400px]' : 'max-w-3xl'
      }`}>
        
        {/* Print Mode Selector - Hidden on Print */}
        <div className="p-4 border-b border-slate-100 flex justify-center gap-4 print:hidden">
          <button 
            onClick={() => setPrintMode('thermal')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
              printMode === 'thermal' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            📟 MODE THERMAL
          </button>
          <button 
            onClick={() => setPrintMode('inkjet')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
              printMode === 'inkjet' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            🖨️ MODE INKJET (A4)
          </button>
        </div>

        {/* Content Area */}
        <div id="invoice-content" className={`p-8 print:p-4 ${printMode === 'thermal' ? 'font-mono text-[12px]' : ''}`}>
          
          {/* Header Layout based on Mode */}
          <div className={`flex flex-col ${printMode === 'inkjet' ? 'md:flex-row justify-between items-start mb-10' : 'items-center text-center mb-6'}`}>
            <div className={printMode === 'thermal' ? 'w-full border-b border-dashed border-slate-300 pb-4 mb-4' : ''}>
              <h1 className={`${printMode === 'thermal' ? 'text-xl' : 'text-3xl'} font-black text-indigo-600 mb-1`}>
                {storeSettings.name}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {printMode === 'thermal' ? 'Struk Belanja' : 'Faktur Penjualan'}
              </p>
              <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                {storeSettings.address}
                <br />
                Telp: {storeSettings.phone}
              </p>
            </div>
            
            <div className={`${printMode === 'thermal' ? 'w-full text-left mt-2' : 'text-right'}`}>
              <p className="text-sm font-bold text-slate-900">No: {order.id}</p>
              <p className="text-[11px] text-slate-500">{new Date(order.createdAt).toLocaleString('id-ID')}</p>
              {printMode === 'thermal' && <div className="border-b border-dashed border-slate-300 mt-4"></div>}
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className={`grid ${printMode === 'thermal' ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-8'} mb-6 ${printMode === 'inkjet' ? 'border-y border-slate-100 py-6' : ''}`}>
            <div>
              <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-1">Pelanggan:</h4>
              <p className="font-bold text-slate-900">{order.customerName || 'Umum/Tamu'}</p>
              <p className="text-[11px] text-slate-500">{order.customerPhone || '-'}</p>
            </div>
            <div className={printMode === 'thermal' ? 'border-b border-dashed border-slate-300 pb-4' : 'text-right'}>
              <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-1">Pembayaran:</h4>
              <p className="font-bold text-indigo-600 uppercase">{order.paymentMethod?.replace('_', ' ') || 'CASH'}</p>
              <p className="text-[11px] text-slate-500">
                {(order.paidAmount || 0) >= (order.totalAmount || 0) ? 'LUNAS' : 'BELUM LUNAS'}
              </p>
            </div>
          </div>

          {/* Items List */}
          <div className="mb-6">
            {printMode === 'inkjet' ? (
              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="text-left pb-3">Deskripsi Produk</th>
                    <th className="text-center pb-3">Ukuran (P x L)</th>
                    <th className="text-center pb-3">Qty</th>
                    <th className="text-right pb-3">Harga</th>
                    <th className="text-right pb-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, idx) => (
                    <tr key={idx} className="text-sm">
                      <td className="py-4">
                        <p className="font-bold text-slate-800">{item.productName}</p>
                      </td>
                      <td className="py-4 text-center text-xs text-slate-500">
                        {item.width && item.height ? `${item.width}m x ${item.height}m` : '-'}
                      </td>
                      <td className="py-4 text-center text-slate-500">{item.quantity}</td>
                      <td className="py-4 text-right text-slate-500">Rp {(item.unitPrice || 0).toLocaleString()}</td>
                      <td className="py-4 text-right font-black text-slate-900">Rp {(item.totalPrice || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={5} className="py-10 text-center text-slate-400 italic">Tidak ada item</td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              /* Thermal List View */
              <div className="space-y-3 border-b border-dashed border-slate-300 pb-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="flex justify-between font-bold">
                      <span>{item.productName}</span>
                      <span>Rp {(item.totalPrice || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>
                        {item.quantity} x {(item.unitPrice || 0).toLocaleString()} 
                        {item.width && item.height ? ` (${item.width}x${item.height}m)` : ''}
                      </span>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <p className="text-center text-slate-400 italic py-4">Tidak ada item</p>}
              </div>
            )}
          </div>

          {/* Totals Section */}
          <div className={`flex flex-col ${printMode === 'inkjet' ? 'items-end' : 'items-stretch'} mt-4`}>
            {printMode === 'thermal' && (
               <div className="flex justify-between py-1 text-slate-600">
                 <span>Subtotal</span>
                 <span>Rp {(order.totalAmount || 0).toLocaleString()}</span>
               </div>
            )}
            <div className={`${printMode === 'thermal' ? 'border-t border-dashed border-slate-300 pt-2 flex justify-between' : 'w-64 border-t border-indigo-100 pt-4 flex justify-between'} items-center`}>
              <span className={`font-black text-slate-900 ${printMode === 'thermal' ? 'text-sm' : 'text-lg'}`}>TOTAL</span>
              <span className={`font-black text-indigo-600 ${printMode === 'thermal' ? 'text-sm' : 'text-2xl'}`}>
                Rp {(order.totalAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className={`mt-10 ${printMode === 'thermal' ? 'text-center border-t border-dashed border-slate-300 pt-6' : 'border-t border-slate-50 pt-8'}`}>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Catatan:</p>
            <p className="text-[10px] text-slate-500 italic leading-relaxed">
              {storeSettings.footerNote || 'Barang yang sudah dibeli tidak dapat dikembalikan. Terima kasih!'}
            </p>
          </div>
        </div>

        {/* Action Buttons - Hidden on Print */}
        <div className="p-6 bg-slate-50 flex gap-4 print:hidden border-t border-slate-100">
          <button 
            onClick={onClose} 
            className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all"
          >
            TUTUP
          </button>
          <button 
            onClick={handlePrint} 
            className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>🖨️</span> CETAK {printMode.toUpperCase()}
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body { 
            background: white; 
          }
          #root > main { 
            display: none !important; 
          }
          #invoice-content {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          @page {
            margin: ${printMode === 'thermal' ? '0.2cm' : '1.5cm'};
            size: ${printMode === 'thermal' ? '80mm auto' : 'A4'};
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceModal;
