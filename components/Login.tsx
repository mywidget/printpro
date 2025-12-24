
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';

interface LoginProps {
  onLogin: (user: User, isApiMode: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiMode, setIsApiMode] = useState(() => localStorage.getItem('printpro_use_api') === 'true');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isApiMode) {
        const user = await ApiService.login(username, password);
        onLogin(user, true);
      } else {
        const user = StorageService.authenticate(username, password);
        if (user) {
          onLogin(user, false);
        } else {
          setError('Username atau password salah (Local Mode)');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Koneksi API Gagal');
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
          <p className="text-slate-500 font-medium">Sistem Kasir Percetakan Modern</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Username</label>
              <input 
                type="text" 
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
               <span className="text-[10px] font-bold text-slate-400 uppercase">Mode Sistem</span>
               <button 
                type="button"
                onClick={() => setIsApiMode(!isApiMode)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black border transition-all ${isApiMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}
               >
                 {isApiMode ? '☁️ SERVER' : '💻 LOCAL'}
               </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 animate-pulse">
                ⚠️ {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Mengecek...' : 'MASUK KE SISTEM'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Default Local: admin / admin</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
