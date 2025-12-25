
import React, { useState, useRef } from 'react';
import { StoreSettings, ApiEndpoint } from '../types';
import { StorageService } from '../services/storage';
import Swal from 'sweetalert2';

interface SettingsProps {
  initialSettings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  onPush: () => void;
  onPull: () => void;
  onExport: () => void;
}

const Settings: React.FC<SettingsProps> = ({ initialSettings, onUpdateSettings, onPush, onPull, onExport }) => {
  const [localSettings, setLocalSettings] = useState<StoreSettings>({
    ...initialSettings,
    apiEndpoints: initialSettings.apiEndpoints || [],
    fonnteToken: initialSettings.fonnteToken || ''
  });
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

  const addEndpoint = () => {
    const newEp: ApiEndpoint = { id: `ep-${Date.now()}`, name: 'Baru', url: 'https://' };
    setLocalSettings({ ...localSettings, apiEndpoints: [...(localSettings.apiEndpoints || []), newEp] });
  };

  const updateEndpoint = (id: string, updates: Partial<ApiEndpoint>) => {
    setLocalSettings({
      ...localSettings,
      apiEndpoints: localSettings.apiEndpoints?.map(ep => ep.id === id ? { ...ep, ...updates } : ep)
    });
  };

  const removeEndpoint = (id: string) => {
    setLocalSettings({
      ...localSettings,
      apiEndpoints: localSettings.apiEndpoints?.filter(ep => ep.id !== id)
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const result = await Swal.fire({
      title: 'Konfirmasi Import',
      text: 'Import data akan MENGHAPUS database lokal saat ini. Lanjutkan?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Timpa!',
    });
    if (result.isConfirmed) {
      try {
        await StorageService.importData(file);
        Swal.fire('Berhasil!', 'Data dipulihkan. Me-refresh...', 'success').then(() => window.location.reload());
      } catch (err) {
        Swal.fire('Gagal', 'File tidak valid', 'error');
      }
    }
  };

  return (
    <div className="p-8 max-w-6xl relative pb-24">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Konfigurasi Sistem</h2>
        <p className="text-sm text-slate-500">Kelola identitas, API Multi-Site, dan WhatsApp Gateway</p>
      </div>
      
      {showToast && (
        <div className="fixed top-24 right-8 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-3 animate-in slide-in-from-right duration-300">
          <span className="font-bold text-sm">✅ Berhasil disimpan!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-sm uppercase tracking-widest">
               🏢 Identitas Percetakan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Usaha</label>
                <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={localSettings.name} onChange={e => setLocalSettings({...localSettings, name: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Alamat Workshop</label>
                <textarea className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none h-20 font-bold" value={localSettings.address} onChange={e => setLocalSettings({...localSettings, address: e.target.value})} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="font-black text-emerald-600 flex items-center gap-3 text-sm uppercase tracking-widest mb-4">
                 💬 WhatsApp Gateway (Fonnte)
              </h3>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fonnte API Token</label>
                <input 
                  type="password" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-mono text-xs" 
                  placeholder="Masukkan token dari fonnte.com"
                  value={localSettings.fonnteToken || ''} 
                  onChange={e => setLocalSettings({...localSettings, fonnteToken: e.target.value})} 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-black text-indigo-600 flex items-center gap-3 text-sm uppercase tracking-widest">
                    🌐 Multi-Site API Databases
                 </h3>
                 <button onClick={addEndpoint} className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg border border-indigo-100">+ Tambah Site</button>
              </div>
              <div className="space-y-3">
                {localSettings.apiEndpoints?.map((ep) => (
                  <div key={ep.id} className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 relative group">
                    <button onClick={() => removeEndpoint(ep.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    <div className="flex-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Label Site</label>
                      <input type="text" placeholder="Cabang A" className="w-full px-3 py-2 border rounded-xl text-xs font-bold" value={ep.name} onChange={e => updateEndpoint(ep.id, { name: e.target.value })} />
                    </div>
                    <div className="flex-[2]">
                      <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">URL API / Base Path</label>
                      <input type="text" placeholder="https://api.cabang-a.com" className="w-full px-3 py-2 border rounded-xl text-xs font-mono" value={ep.url} onChange={e => updateEndpoint(ep.id, { url: e.target.value })} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-indigo-700 active:scale-95 transition-all">
                {isSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
            <h3 className="font-black text-lg mb-2 flex items-center gap-3 relative z-10">☁️ Cloud Sync</h3>
            <p className="text-[10px] text-indigo-300 mb-6 font-bold uppercase tracking-wider relative z-10">Kirim data ke database aktif</p>
            <div className="space-y-4 relative z-10">
              <button onClick={onPush} className="w-full flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                <span className="text-xs font-black">Push to Server</span>
                <span>📤</span>
              </button>
              <button onClick={onPull} className="w-full flex items-center justify-between p-4 bg-indigo-500/30 rounded-2xl hover:bg-indigo-500/40 transition-all">
                <span className="text-xs font-black">Pull from Server</span>
                <span>📥</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-900 mb-6 flex items-center gap-3 text-sm uppercase tracking-widest">📦 Backup File</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={onExport} className="flex flex-col items-center gap-3 p-5 bg-slate-50 border border-slate-200 rounded-3xl hover:bg-indigo-50 transition-all group">
                <span className="text-2xl">📑</span>
                <span className="text-[9px] font-black text-slate-500 uppercase">Export</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-3 p-5 bg-slate-50 border border-slate-200 rounded-3xl hover:bg-emerald-50 transition-all group">
                <span className="text-2xl">📥</span>
                <span className="text-[9px] font-black text-slate-500 uppercase">Import</span>
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
