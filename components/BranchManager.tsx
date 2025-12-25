
import React, { useState } from 'react';
import { Branch } from '../types';

interface BranchManagerProps {
  branches: Branch[];
  onAddBranch: (branch: Branch) => void;
  onEditBranch: (branch: Branch) => void;
  onDeleteBranch: (id: string) => void;
}

const BranchManager: React.FC<BranchManagerProps> = ({ branches, onAddBranch, onEditBranch, onDeleteBranch }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<Partial<Branch>>({ name: '', address: '', phone: '', isMainBranch: false });

  const openModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData(branch);
    } else {
      setEditingBranch(null);
      setFormData({ name: '', address: '', phone: '', isMainBranch: false });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      onEditBranch({ ...editingBranch, ...formData } as Branch);
    } else {
      onAddBranch({ ...formData, id: `br-${Date.now()}` } as Branch);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Manajemen Cabang</h2>
          <p className="text-sm text-slate-500">Kelola outlet dan cabang percetakan Anda</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          + Cabang Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(br => (
          <div key={br.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative group hover:shadow-md transition-all">
            {br.isMainBranch && (
              <span className="absolute -top-3 left-6 bg-indigo-600 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg">CABANG UTAMA</span>
            )}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">{br.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{br.phone}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openModal(br)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">✏️</button>
                {!br.isMainBranch && (
                  <button onClick={() => onDeleteBranch(br.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">🗑️</button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed italic">"{br.address}"</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">{editingBranch ? 'Edit Cabang' : 'Cabang Baru'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Cabang</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Alamat</label>
                <textarea required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none h-24 font-medium" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">No. Telepon Cabang</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="isMain" checked={formData.isMainBranch} onChange={e => setFormData({...formData, isMainBranch: e.target.checked})} className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="isMain" className="text-xs font-bold text-slate-600 cursor-pointer">Jadikan Cabang Utama</label>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">Simpan Cabang</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManager;
