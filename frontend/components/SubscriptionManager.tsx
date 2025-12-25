
import React, { useState, useEffect } from 'react';
import { SubscriptionInfo, SubscriptionPlan, PaymentRequest, UserRole } from '../types';
import { ApiService } from '../services/api';
import Swal from 'sweetalert2';

interface SubscriptionManagerProps {
  subscription?: SubscriptionInfo;
  userRole?: UserRole;
  onRenew: (plan: SubscriptionPlan) => void; // This will trigger parent to reload
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ subscription, userRole, onRenew }) => {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [activeStep, setActiveStep] = useState<'PLANS' | 'PAYMENT' | 'HISTORY'>('PLANS');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const plans = [
    {
      id: SubscriptionPlan.PRO,
      name: 'Business Pro',
      price: 149000,
      period: '/bulan',
      features: ['Unlimited Orders', 'Unlimited Users', 'WhatsApp Gateway', 'Laporan Laba/Rugi'],
      color: 'bg-indigo-600 text-white shadow-indigo-100',
      recommended: true
    },
    {
      id: SubscriptionPlan.ENTERPRISE,
      name: 'Enterprise Cloud',
      price: 1499000,
      period: '/tahun',
      features: ['Multi-Site Sync', 'Custom Domain API', 'Prioritas Support', 'Backup Otomatis'],
      color: 'bg-slate-900 text-white shadow-slate-200'
    }
  ];

  const loadPayments = async () => {
    try {
      const data = await ApiService.getPayments();
      setPayments(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (userRole === UserRole.ADMIN) loadPayments();
  }, [userRole]);

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setActiveStep('PAYMENT');
  };

  const handleSubmitProof = async () => {
    setIsLoading(true);
    try {
      const payload: Partial<PaymentRequest> = {
        id: `PAY-${Date.now()}`,
        plan: selectedPlan.id,
        amount: selectedPlan.price,
        status: 'PENDING',
        created_at: new Date()
      };
      await ApiService.submitPayment(payload);
      Swal.fire('Berhasil!', 'Bukti pembayaran telah dikirim. Admin akan melakukan verifikasi.', 'success');
      setActiveStep('HISTORY');
      loadPayments();
    } catch (e) {
      Swal.fire('Gagal', 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'Setujui Pembayaran?',
      text: 'Masa aktif langganan akan otomatis bertambah.',
      icon: 'question',
      showCancelButton: true
    });

    if (confirm.isConfirmed) {
      setIsLoading(true);
      try {
        await ApiService.approvePayment(id);
        Swal.fire('Berhasil!', 'Langganan telah diaktifkan.', 'success');
        loadPayments();
        onRenew(SubscriptionPlan.PRO); // Trigger reload
      } catch (e) {
        Swal.fire('Gagal', 'Gagal memproses approval.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="p-8 pb-24 max-w-6xl mx-auto">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pusat Langganan</h2>
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setActiveStep('PLANS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeStep === 'PLANS' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>Pilih Paket</button>
          <button onClick={() => setActiveStep('HISTORY')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeStep === 'HISTORY' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>Riwayat & Admin</button>
        </div>
      </div>

      {activeStep === 'PLANS' && (
        <>
          {subscription && (
            <div className={`mb-12 p-6 rounded-[2.5rem] border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm ${subscription.status === 'EXPIRED' ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl ${subscription.status === 'ACTIVE' ? 'bg-indigo-50' : 'bg-rose-100'}`}>
                  {subscription.status === 'ACTIVE' ? '🚀' : '⏳'}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Saat Ini</p>
                  <h3 className="text-xl font-black text-slate-900">
                    Paket {subscription.plan} • <span className={subscription.status === 'ACTIVE' ? 'text-indigo-600' : 'text-rose-600'}>{subscription.status}</span>
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">Berakhir: <span className="font-bold">{subscription.endDate.toLocaleDateString('id-ID', { dateStyle: 'long' })}</span></p>
                </div>
              </div>
              <div className={`text-center px-8 py-3 rounded-2xl border ${subscription.status === 'ACTIVE' ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-100 border-rose-200'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sisa Masa Aktif</p>
                <p className={`text-2xl font-black ${subscription.status === 'ACTIVE' ? 'text-indigo-600' : 'text-rose-600'}`}>{subscription.daysRemaining} Hari</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.id} className={`p-10 rounded-[3rem] border border-slate-200 flex flex-col relative overflow-hidden transition-all hover:scale-[1.02] bg-white ${plan.recommended ? 'ring-4 ring-indigo-500/10' : ''}`}>
                {plan.recommended && (
                  <div className="absolute top-6 right-[-35px] bg-amber-400 text-amber-900 text-[8px] font-black py-1 w-32 text-center rotate-45 uppercase tracking-tighter shadow-lg">Recommended</div>
                )}
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{plan.name}</h4>
                <div className="mb-8">
                  <span className="text-3xl font-black text-slate-900">Rp {plan.price.toLocaleString()}</span>
                  <span className="text-slate-400 text-sm font-bold">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs font-bold text-slate-600 leading-tight">
                      <span className="text-emerald-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${plan.color} hover:opacity-90 active:scale-95 shadow-xl`}
                >
                  Aktifkan Paket
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeStep === 'PAYMENT' && selectedPlan && (
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl animate-in zoom-in duration-300">
           <h3 className="text-xl font-black text-slate-900 mb-2">Instruksi Pembayaran</h3>
           <p className="text-sm text-slate-500 mb-8">Silakan transfer sesuai nominal untuk paket <b>{selectedPlan.name}</b></p>
           
           <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 mb-8">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-xs font-bold text-indigo-400">Total Transfer</span>
                 <span className="text-2xl font-black text-indigo-600">Rp {selectedPlan.price.toLocaleString()}</span>
              </div>
              <div className="space-y-3 pt-4 border-t border-indigo-100">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank BCA</span>
                    <span className="font-mono font-bold text-slate-800">1234-567-890</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atas Nama</span>
                    <span className="font-bold text-slate-800 uppercase text-xs">PrintPro Digital System</span>
                 </div>
              </div>
           </div>

           <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl text-center mb-8">
              <span className="text-3xl mb-2 block">📸</span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Bukti Transfer</p>
              <p className="text-[9px] text-slate-300 mt-1">(Simulasi: Klik tombol konfirmasi di bawah)</p>
           </div>

           <div className="flex gap-4">
              <button onClick={() => setActiveStep('PLANS')} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">Batal</button>
              <button 
                onClick={handleSubmitProof} 
                disabled={isLoading}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50"
              >
                {isLoading ? 'Mengirim...' : 'Konfirmasi & Kirim'}
              </button>
           </div>
        </div>
      )}

      {activeStep === 'HISTORY' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Log Transaksi & Approval</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mode: {userRole}</span>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50/50">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <th className="px-8 py-5">Tanggal</th>
                       <th className="px-8 py-5">Paket</th>
                       <th className="px-8 py-5">Nominal</th>
                       <th className="px-8 py-5">Status</th>
                       {userRole === UserRole.ADMIN && <th className="px-8 py-5 text-right">Aksi</th>}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {payments.map(pay => (
                       <tr key={pay.id} className="text-xs font-bold text-slate-700">
                          <td className="px-8 py-5">{pay.created_at.toLocaleString('id-ID')}</td>
                          <td className="px-8 py-5">{pay.plan}</td>
                          <td className="px-8 py-5">Rp {pay.amount.toLocaleString()}</td>
                          <td className="px-8 py-5">
                             <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${pay.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : pay.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                {pay.status}
                             </span>
                          </td>
                          {userRole === UserRole.ADMIN && (
                             <td className="px-8 py-5 text-right">
                                {pay.status === 'PENDING' && (
                                   <button 
                                      onClick={() => handleApprove(pay.id)}
                                      disabled={isLoading}
                                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
                                   >
                                      APPROVE
                                   </button>
                                )}
                             </td>
                          )}
                       </tr>
                    ))}
                    {payments.length === 0 && (
                       <tr><td colSpan={5} className="py-20 text-center text-slate-300 italic font-medium">Belum ada riwayat pembayaran.</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;
