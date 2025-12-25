
import React, { useState, useRef } from 'react';
import { StoreSettings } from '../types';
import { StorageService } from '../services/storage';
import Swal from 'sweetalert2';

interface SettingsProps {
  initialSettings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  onPush: () => void;
  onPull: () => void;
}

const Settings: React.FC<SettingsProps> = ({ initialSettings, onUpdateSettings, onPush, onPull }) => {
  const [localSettings, setLocalSettings] = useState<StoreSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onUpdateSettings(localSettings);
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 600);
  };

  const handleExport = () => {
    Swal.fire({
      title: 'Menyiapkan Backup',
      text: 'Sistem sedang merangkum seluruh database Anda...',
      icon: 'info',
      timer: 1500,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    }).then(() => {
      StorageService.exportAllData();
      Swal.fire({
        title: 'Export Berhasil!',
        text: 'File backup telah diunduh ke perangkat Anda.',
        icon: 'success',
        confirmButtonColor: '#4f46e5'
      });
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input agar bisa pilih file yang sama lagi jika gagal
    e.target.value = '';

    const result = await Swal.fire({
      title: 'Konfirmasi Import',
      text: 'Import data akan MENGHAPUS dan MENIMPA database lokal Anda saat ini. Tindakan ini tidak dapat dibatalkan. Lanjutkan?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Timpa Data!',
      cancelButtonText: 'Batal',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Sedang Memproses',
          text: 'Harap tunggu, database sedang diperbarui...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await StorageService.importData(file);
        
        await Swal.fire({
          title: 'Import Selesai!',
          text: 'Seluruh data berhasil dipulihkan. Halaman akan dimuat ulang.',
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });

        window.location.reload();
      } catch (err) {
        Swal.fire({
          title: 'Gagal Import',
          text: err instanceof Error ? err.message : 'Terjadi kesalahan saat membaca file backup.',
          icon: 'error',
          confirmButtonColor: '#4f46e5'
        });
      }
    }
  };

  return (
    <div className="p-8 max-w-6xl relative pb-24">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Konfigurasi Sistem</h2>
        <p className="text-sm text-slate-500">Kelola identitas toko dan sinkronisasi data antar perangkat</p>
      </div>
      
      {showToast && (
        <div className="fixed top-24 right-8 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl z-50 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <span className="font-bold text-sm">Pengaturan berhasil disimpan!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Business Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-sm uppercase tracking-widest">
               <span className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-lg">🏢</span> Identitas Percetakan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Usaha</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                  value={localSettings.name}
                  onChange={e => setLocalSettings({...localSettings, name: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Alamat Workshop</label>
                <textarea 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none h-24 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                  value={localSettings.address}
                  onChange={e => setLocalSettings({...localSettings, address: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">No. Telepon / WhatsApp</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800"
                  value={localSettings.phone}
                  onChange={e => setLocalSettings({...localSettings, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Mata Uang</label>
                <select 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
                  value={localSettings.currency}
                  onChange={e => setLocalSettings({...localSettings, currency: e.target.value})}
                >
                  <option value="IDR">IDR (Rp)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <h3 className="font-black text-emerald-600 flex items-center gap-3 text-sm uppercase tracking-widest mb-6">
                 <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-lg">💬</span> WhatsApp Gateway (Fonnte)
              </h3>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fonnte API Token</label>
                <input 
                  type="password" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-mono text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Paste your Fonnte token here"
                  value={localSettings.fonnteToken || ''}
                  onChange={e => setLocalSettings({...localSettings, fonnteToken: e.target.value})}
                />
                <p className="mt-2 text-[9px] text-slate-400 font-medium">Dapatkan token di <a href="https://fonnte.com" target="_blank" className="text-indigo-500 underline">fonnte.com</a> untuk mengaktifkan fitur kirim invoice otomatis.</p>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
              </button>
            </div>
          </div>
        </div>

        {/* Sync & Backup Area */}
        <div className="space-y-8">
          {/* Cloud Sync Center */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <h3 className="font-black text-lg mb-2 flex items-center gap-3 relative z-10">
               ☁️ Sync Center
            </h3>
            <p className="text-[10px] text-indigo-300 mb-6 font-bold uppercase tracking-wider relative z-10">Sinkronkan Lokal & Cloud</p>
            
            <div className="space-y-4 relative z-10">
              <button 
                onClick={onPush}
                className="w-full flex items-center justify-between p-4 bg-white/10 border border-white/10 rounded-2xl hover:bg-white/20 transition-all group/btn"
              >
                <div className="text-left">
                  <p className="text-xs font-black">Push to Server</p>
                  <p className="text-[9px] text-white/50">Upload data lokal ke Database</p>
                </div>
                <span className="text-lg group-hover/btn:translate-x-1 transition-transform">📤</span>
              </button>

              <button 
                onClick={onPull}
                className="w-full flex items-center justify-between p-4 bg-indigo-500/30 border border-indigo-400/20 rounded-2xl hover:bg-indigo-500/40 transition-all group/btn"
              >
                <div className="text-left">
                  <p className="text-xs font-black">Pull from Server</p>
                  <p className="text-[9px] text-indigo-200/50">Ganti data lokal dengan Server</p>
                </div>
                <span className="text-lg group-hover/btn:translate-x-1 transition-transform">📥</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
               <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Gunakan Push setelah bekerja Offline</p>
            </div>
          </div>

          {/* Local Backup */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-900 mb-6 flex items-center gap-3 text-sm uppercase tracking-widest">
               📦 Backup File
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleExport}
                className="flex flex-col items-center gap-3 p-5 bg-slate-50 border border-slate-200 rounded-3xl hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
              >
                <span className="text-2xl">📑</span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-indigo-600 text-center">Export .JSON</span>
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-5 bg-slate-50 border border-slate-200 rounded-3xl hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
              >
                <span className="text-2xl">📥</span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-emerald-600 text-center">Import .JSON</span>
                <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
