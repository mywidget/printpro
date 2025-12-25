
import React, { useState, useEffect } from 'react';
import { User, UserRole, ApiEndpoint } from '../types';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';

interface LoginProps {
  onLogin: (user: User, isApiMode: boolean, apiUrl?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiMode, setIsApiMode] = useState(() => localStorage.getItem('printpro_use_api') === 'true');
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedApiId, setSelectedApiId] = useState('');
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    const settings = StorageService.getSettings({ apiEndpoints: [] } as any);
    const savedEndpoints = settings.apiEndpoints || [];
    setEndpoints(savedEndpoints);
    if (savedEndpoints.length > 0) {
      setSelectedApiId(savedEndpoints[0].id);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isApiMode) {
        let apiUrl = '';
        
        // Jika ada endpoint tersimpan di LocalStorage, gunakan itu
        if (endpoints.length > 0) {
          const selected = endpoints.find(e => e.id === selectedApiId);
          if (selected) apiUrl = selected.url;
        } else {
          // Jika kosong (setelah clear cache), gunakan manual input
          if (!manualUrl) throw new Error('Silakan masukkan URL API server Anda.');
          apiUrl = manualUrl;
        }
        
        ApiService.setBaseUrl(apiUrl);
        const user = await ApiService.login(username, password);
        
        // Simpan URL aktif ke localstorage agar sesi berikutnya ingat
        localStorage.setItem('printpro_active_api_url', apiUrl);
        
        onLogin(user, true, apiUrl);
      } else {
        const user = StorageService.authenticate(username, password);
        if (user) {
          onLogin(user, false);
        } else {
          setError('Username atau password salah (Local Mode)');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Koneksi API Gagal. Periksa URL atau koneksi internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white text-3xl font-black mb-4 shadow-xl shadow-indigo-100">
            P
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">PrintPro POS</h1>
          <p className="text-slate-500 font-medium italic text-sm">Sistem Kasir Percetakan Multi-Site</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Mode</span>
               <button 
                type="button"
                onClick={() => setIsApiMode(!isApiMode)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black border transition-all ${isApiMode ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200'}`}
               >
                 {isApiMode ? '☁️ ONLINE / CLOUD' : '💻 OFFLINE LOCAL'}
               </button>
            </div>

            {isApiMode && (
              <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                {endpoints.length > 0 ? (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Pilih Server Aktif</label>
                    <select 
                      className="w-full px-5 py-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl outline-none font-bold text-indigo-700 text-xs"
                      value={selectedApiId}
                      onChange={e => setSelectedApiId(e.target.value)}
                    >
                      {endpoints.map(ep => <option key={ep.id} value={ep.id}>{ep.name.toUpperCase()}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">URL API Server (Bootstrap)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="https://percetakan-anda.com/api"
                      className="w-full px-5 py-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl outline-none font-bold text-indigo-700 text-xs placeholder:text-indigo-300"
                      value={manualUrl}
                      onChange={e => setManualUrl(e.target.value)}
                    />
                    <p className="text-[9px] text-slate-400 mt-2 italic">*Masukkan URL server sekali saja untuk memulihkan pengaturan.</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Username</label>
              <input 
                type="text" 
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black border border-red-100 animate-pulse uppercase tracking-tighter">
                ⚠️ ERROR: {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  MENGHUBUNGKAN...
                </>
              ) : 'MASUK KE SISTEM'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
           <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
             {isApiMode ? 'Data disinkronkan dengan Database Server' : 'Data disimpan di Browser ini (Mode Offline)'}
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
