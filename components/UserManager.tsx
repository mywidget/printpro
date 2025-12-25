
import React, { useState } from 'react';
import { User, UserRole, Branch } from '../types';

interface UserManagerProps {
  users: User[];
  branches: Branch[];
  onAddUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

const UserManager: React.FC<UserManagerProps> = ({ users, branches, onAddUser, onEditUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({ role: UserRole.STAFF });

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({ username: '', name: '', password: '', role: UserRole.STAFF, branchId: branches[0]?.id });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onEditUser({ ...editingUser, ...formData } as User);
    } else {
      onAddUser({ ...formData, id: `u-${Date.now()}` } as User);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen User</h2>
          <p className="text-sm text-slate-500">Kelola hak akses admin dan staf percetakan</p>
        </div>
        <button onClick={() => openModal()} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          + User Baru
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username / Role</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Penugasan Cabang</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => {
                const userBranch = branches.find(b => b.id === user.branchId);
                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono text-indigo-600">{user.username}</p>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase mt-1 inline-block ${user.role === UserRole.ADMIN ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === UserRole.ADMIN ? (
                        <span className="text-[10px] font-black text-slate-400 italic">SEMUA CABANG</span>
                      ) : (
                        <p className="text-xs font-bold text-slate-700 uppercase">{userBranch?.name || 'TIDAK TERDAFTAR'}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <button onClick={() => openModal(user)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all">Edit</button>
                         {user.username !== 'admin' && (
                           <button onClick={() => onDeleteUser(user.id)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-all">Hapus</button>
                         )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-black">{editingUser ? 'Edit User' : 'Tambah User'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Lengkap</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Username</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Password</label>
                  <input required={!editingUser} type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editingUser ? "Ganti password?" : ""} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Role Hak Akses</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    <option value={UserRole.ADMIN}>ADMINISTRATOR</option>
                    <option value={UserRole.STAFF}>STAFF OPERATOR</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Lokasi Tugas (Cabang)</label>
                  <select 
                    disabled={formData.role === UserRole.ADMIN}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs disabled:opacity-50" 
                    value={formData.branchId || ''} 
                    onChange={e => setFormData({...formData, branchId: e.target.value})}
                  >
                    {branches.map(br => <option key={br.id} value={br.id}>{br.name.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
