
import React, { useState, useRef } from 'react';
import { StoreSettings } from '../types';
import { StorageService } from '../services/storage';

interface SettingsProps {
  initialSettings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ initialSettings, onUpdateSettings }) => {
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
    StorageService.exportAllData();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm('Importing data will overwrite your current database. Continue?')) {
        try {
          await StorageService.importData(file);
          alert('Data imported successfully! App will reload.');
          window.location.reload();
        } catch (err) {
          alert('Failed to import data. Please check the file format.');
        }
      }
    }
  };

  return (
    <div className="p-8 max-w-4xl relative pb-24">
      <h2 className="text-2xl font-bold mb-8 text-slate-900 tracking-tight">Store Configuration</h2>
      
      {showToast && (
        <div className="fixed top-24 right-8 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl z-50 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <span className="font-bold text-sm">Settings saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
             <span className="text-indigo-500">🏢</span> Business Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Store Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800"
                value={localSettings.name}
                onChange={e => setLocalSettings({...localSettings, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Store Address</label>
              <textarea 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none h-24 font-medium text-slate-800"
                value={localSettings.address}
                onChange={e => setLocalSettings({...localSettings, address: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Phone Number</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800"
                  value={localSettings.phone}
                  onChange={e => setLocalSettings({...localSettings, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Currency</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={localSettings.currency}
                  onChange={e => setLocalSettings({...localSettings, currency: e.target.value})}
                >
                  <option value="IDR">IDR (Rp)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Database Management */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
               <span className="text-indigo-500">💾</span> Database Management
            </h3>
            <p className="text-[10px] text-slate-400 mb-6 leading-relaxed">Backup your data regularly to prevent loss. The backup file contains all orders, customers, and inventory settings.</p>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleExport}
                className="flex flex-col items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
              >
                <span className="text-xl">📤</span>
                <span className="text-[10px] font-black text-slate-600 uppercase group-hover:text-indigo-600">Export Backup</span>
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
              >
                <span className="text-xl">📥</span>
                <span className="text-[10px] font-black text-slate-600 uppercase group-hover:text-emerald-600">Restore Data</span>
                <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <h3 className="font-bold text-xl mb-2 flex items-center gap-2">☁️ Local Storage</h3>
            <p className="text-xs text-indigo-100 mb-4 leading-relaxed">Data is stored securely in your browser's private storage. Clearing browser cache might delete your data!</p>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full w-[45%]"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-3 ${isSaving ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
