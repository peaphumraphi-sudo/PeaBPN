
import React, { useState } from 'react';
import { User } from '../types';
import { UserPlus, Trash2, Shield, User as UserIcon, X, Save } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onDeleteUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    role: 'OPERATOR' as 'ADMIN' | 'OPERATOR'
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.username || !newUser.password) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const user: User = {
      id: `U-${Date.now()}`,
      name: newUser.name,
      username: newUser.username,
      password: newUser.password,
      role: newUser.role
    };

    onAddUser(user);
    setIsAdding(false);
    setNewUser({ name: '', username: '', password: '', role: 'OPERATOR' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">จัดการผู้ใช้งานระบบ</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          <span>เพิ่มผู้ใช้งาน</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                  {u.role === 'ADMIN' ? <Shield className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-400">@{u.username}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                {u.role}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-xs text-slate-400 italic">รหัสผ่าน: {u.password?.replace(/./g, '*')}</span>
              <button 
                onClick={() => {
                  if(confirm(`ต้องการลบผู้ใช้ ${u.name} ใช่หรือไม่?`)) {
                    onDeleteUser(u.id);
                  }
                }}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">เพิ่มผู้ใช้งานใหม่</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                <input 
                  type="text" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="เช่น นายสมชาย ใจดี"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ใช้ (Username)</label>
                <input 
                  type="text" 
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="ภาษาอังกฤษเท่านั้น"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
                <input 
                  type="password" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="กำหนดรหัสผ่าน"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ระดับสิทธิ์</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as 'ADMIN' | 'OPERATOR'})}
                  className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="OPERATOR">OPERATOR (พนักงาน)</option>
                  <option value="ADMIN">ADMIN (หัวหน้า/ผู้ดูแล)</option>
                </select>
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
