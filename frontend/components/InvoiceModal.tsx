
import React, { useState, useEffect } from 'react';
import { Order, StoreSettings } from '../types';
import { ApiService } from '../services/api';
import Swal from 'sweetalert2';

interface InvoiceModalProps {
  order: Order;
  storeSettings: StoreSettings;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, storeSettings, onClose }) => {
  const [printMode, setPrintMode] = useState<'thermal' | 'inkjet'>('inkjet');
  const [isSendingWA, setIsSendingWA] = useState(false);
  const [targetPhone, setTargetPhone] = useState(order.customerPhone || '');

  // Update target phone if order changes
  useEffect(() => {
    setTargetPhone(order.customerPhone || '');
  }, [order.customerPhone]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = async () => {
    if (!storeSettings.fonnteToken) {
      Swal.fire({
        icon: 'warning',
        title: 'Token Belum Diatur',
        text: 'Silakan isi Fonnte API Token di menu Pengaturan terlebih dahulu.',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    if (!targetPhone) {
      Swal.fire({
        icon: 'error',
        title: 'Nomor HP Kosong',
        text: 'Masukkan nomor WhatsApp tujuan terlebih dahulu.',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    setIsSendingWA(true);
    
    try {
      const itemsText = order.items.map(item => {
        const specs = item.width ? ` (${item.width}x${item.height}m)` : '';
        return `- ${item.productName}${specs} x ${item.quantity} = Rp ${item.totalPrice.toLocaleString()}`;
      }).join('\n');

      const balance = order.totalAmount - order.paidAmount;
      const statusText = balance <= 0 ? '*LUNAS*' : `*BELUM LUNAS* (Sisa: Rp ${balance.toLocaleString()})`;

      const message = `*INVOICE PERCETAKAN - ${storeSettings.name}*
------------------------------------------
ID: #${order.id.slice(-8).toUpperCase()}
Nama: ${order.customerName}
Tanggal: ${new Date(order.createdAt).toLocaleString('id-ID')}

*Rincian Pesanan:*
${itemsText}

------------------------------------------
*Total: Rp ${order.totalAmount.toLocaleString()}*
*Bayar/DP: Rp ${order.paidAmount.toLocaleString()}*
*Status: ${statusText}*

${storeSettings.footerNote || 'Terima kasih atas pesanan Anda!'}

_Pesan ini dikirim otomatis oleh sistem PrintPro POS_`;

      await ApiService.sendWhatsapp(storeSettings.fonnteToken, targetPhone, message);
      
      Swal.fire({
        icon: 'success',
        title: 'WhatsApp Terkirim!',
        text: `Invoice telah dikirim ke ${targetPhone}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Kirim WA',
        text: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengirim pesan.',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      setIsSendingWA(false);
    }
  };

  const items = order.items || [];
  const totalAmount = Number(order.totalAmount || 0);
  const paidAmount = Number(order.paidAmount || 0);
  const balance = totalAmount - paidAmount;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto print:bg-white print:overflow-visible no-scrollbar" id="invoice-modal-root">
      <div className="min-h-full flex items-start justify-center p-4 sm:p-6 print:p-0">
        <div 
          id="invoice-printable-container"
          className={`bg-white rounded-[2rem] w-full transition-all duration-300 shadow-2xl animate-in zoom-in duration-300 print:shadow-none print:rounded-none print:m-0 my-auto ${
            printMode === 'thermal' ? 'max-w-[400px]' : 'max-w-3xl'
          }`}
        >
          
          {/* Header Actions - Hidden on Print */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col items-center gap-4 print:hidden">
            <div className="flex bg-slate-100 p-1 rounded-xl w-full">
              <button 
                onClick={() => setPrintMode('thermal')}
                className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black transition-all ${
                  printMode === 'thermal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                📟 THERMAL
              </button>
              <button 
                onClick={() => setPrintMode('inkjet')}
                className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black transition-all ${
                  printMode === 'inkjet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                🖨️ INKJET (A4)
              </button>
            </div>

            <div className="flex flex-col items-center gap-2 w-full">
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="No WhatsApp..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                />
                <span className="absolute left-3 top-2.5 text-xs">📱</span>
              </div>
              <button 
                onClick={handleSendWhatsApp}
                disabled={isSendingWA}
                className={`px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap w-full ${isSendingWA ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSendingWA ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : '💬'} KIRIM WA
              </button>
            </div>
          </div>

          {/* Content Area - Ultra Optimized Spacing */}
          <div id="invoice-content" className={`p-6 sm:p-8 print:p-0 ${printMode === 'thermal' ? 'font-mono text-[11px] leading-tight' : 'text-sm'}`}>
            
            <div className={`flex flex-col ${printMode === 'inkjet' ? 'md:flex-row justify-between items-start mb-4' : 'items-center text-center mb-3'}`}>
              <div className={printMode === 'thermal' ? 'w-full border-b border-dashed border-slate-300 pb-2 mb-2' : ''}>
                <h1 className={`${printMode === 'thermal' ? 'text-lg' : 'text-2xl'} font-black text-indigo-600 mb-0.5`}>
                  {storeSettings.name}
                </h1>
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">
                  {printMode === 'thermal' ? 'Struk Transaksi' : 'Invoice Penjualan'}
                </p>
                <div className="text-[9px] text-slate-500 mt-1 leading-none font-medium">
                  {storeSettings.address}
                  <br />
                  <span className="font-bold text-slate-400">Telp:</span> {storeSettings.phone}
                </div>
              </div>
              
              <div className={`${printMode === 'thermal' ? 'w-full text-left' : 'text-right'}`}>
                <div className="bg-slate-50 inline-block px-2 py-1 rounded mb-0.5">
                  <p className="text-[9px] font-black text-slate-900">ID: #{order.id.slice(-8).toUpperCase()}</p>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            </div>

            <div className={`grid ${printMode === 'thermal' ? 'grid-cols-1 gap-1' : 'grid-cols-2 gap-4'} mb-4 ${printMode === 'inkjet' ? 'border-y border-slate-100 py-4' : 'border-b border-dashed border-slate-300 pb-2'}`}>
              <div>
                <h4 className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pelanggan:</h4>
                <p className="text-xs font-black text-slate-900 leading-none">{order.customerName || 'Umum/Tamu'}</p>
                <p className="text-[9px] text-slate-500 font-medium mt-0.5">{order.customerPhone || '-'}</p>
              </div>
              <div className={printMode === 'thermal' ? '' : 'text-right'}>
                <h4 className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status:</h4>
                <div className="flex items-center gap-2 lg:justify-end">
                   <p className="text-[9px] font-black text-indigo-600 uppercase tracking-wider leading-none">{order.paymentMethod?.replace('_', ' ') || 'CASH'}</p>
                   <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${balance <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {balance <= 0 ? 'LUNAS' : 'BELUM LUNAS'}
                   </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              {printMode === 'inkjet' ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-[0.1em]">
                      <th className="text-left pb-1">Item</th>
                      <th className="text-center pb-1">Dimensi</th>
                      <th className="text-center pb-1">Qty</th>
                      <th className="text-right pb-1">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5">
                          <p className="font-bold text-slate-800 text-xs">{item.productName}</p>
                        </td>
                        <td className="py-1.5 text-center text-[9px] text-slate-500">
                          {item.width && item.height ? `${item.width}x${item.height}m` : '-'}
                        </td>
                        <td className="py-1.5 text-center text-slate-600 font-bold text-xs">{item.quantity}</td>
                        <td className="py-1.5 text-right font-black text-slate-900 text-xs">Rp {item.totalPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="space-y-1 pb-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col">
                      <div className="flex justify-between font-black text-slate-900">
                        <span className="flex-1 pr-1 truncate">{item.productName}</span>
                        <span>{item.totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                        <span>{item.quantity} x {item.unitPrice.toLocaleString()} {item.width ? `(${item.width}x${item.height})` : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`flex flex-col ${printMode === 'inkjet' ? 'items-end' : 'items-stretch border-t border-dashed border-slate-300 pt-2'}`}>
              <div className={`${printMode === 'thermal' ? 'mb-1 flex justify-between' : 'w-56 border-t border-slate-100 pt-2 mb-1 flex justify-between items-center'}`}>
                <span className={`font-black text-slate-400 uppercase tracking-widest ${printMode === 'thermal' ? 'text-[8px]' : 'text-[9px]'}`}>Total</span>
                <span className={`font-black text-indigo-600 ${printMode === 'thermal' ? 'text-sm' : 'text-lg'}`}>
                  Rp {totalAmount.toLocaleString()}
                </span>
              </div>

              <div className={`${printMode === 'thermal' ? 'flex flex-col gap-0.5' : 'w-56 space-y-0.5'}`}>
                <div className="flex justify-between text-slate-500 text-[9px]">
                  <span className="font-bold uppercase tracking-widest">Bayar</span>
                  <span className="font-bold">Rp {paidAmount.toLocaleString()}</span>
                </div>
                
                <div className={`flex justify-between text-[9px] ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  <span className="font-black uppercase tracking-widest">{balance > 0 ? 'Kurang' : 'Kembali'}</span>
                  <span className="font-black">Rp {Math.abs(balance).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className={`mt-6 ${printMode === 'thermal' ? 'text-center border-t border-dashed border-slate-300 pt-3' : 'border-t border-slate-100 pt-4 text-center'}`}>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">*** TERIMA KASIH ***</p>
              <p className="text-[8px] text-slate-500 italic leading-tight max-w-[200px] mx-auto">
                {storeSettings.footerNote || 'Pesanan yang sudah diproses tidak dapat dibatalkan.'}
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-slate-50 flex flex-col sm:flex-row gap-3 print:hidden border-t border-slate-100 rounded-b-[2rem]">
            <button onClick={onClose} className="flex-1 bg-white border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-slate-100 transition-all active:scale-95">TUTUP</button>
            <button onClick={handlePrint} className="flex-1 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">CETAK SEKARANG</button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          /* Sembunyikan semua kecuali kontainer invoice */
          body * {
            visibility: hidden !important;
          }
          #invoice-printable-container,
          #invoice-printable-container * {
            visibility: visible !important;
          }
          #invoice-printable-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          @page {
            margin: 0;
            size: ${printMode === 'thermal' ? '80mm auto' : 'A4 portrait'};
          }
          #invoice-content { 
            width: 100% !important; 
            padding: ${printMode === 'thermal' ? '2mm' : '8mm'} !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceModal;
