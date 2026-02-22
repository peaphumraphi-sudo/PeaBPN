
import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    const savedUsers = localStorage.getItem('app_users');
    const users: User[] = savedUsers ? JSON.parse(savedUsers) : [
      { id: 'U-ADMIN', name: 'ผู้ดูแลระบบ', username: 'admin', password: 'admin', role: 'ADMIN' }
    ];

    const foundUser = users.find(u => 
      u.username.toLowerCase() === trimmedUsername.toLowerCase() && 
      u.password === trimmedPassword
    );

    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      onLogin(userWithoutPassword as User);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    } else {
      alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง\n(รหัสเริ่มต้นคือ admin / admin)');
    }
  };

  const handleResetAdmin = () => {
    if (confirm('คุณต้องการรีเซ็ตบัญชีผู้ดูแลระบบเป็นค่าเริ่มต้น (admin/admin) ใช่หรือไม่?\n*บัญชีผู้ใช้อื่นๆ จะยังคงอยู่')) {
      const savedUsers = localStorage.getItem('app_users');
      let users: User[] = savedUsers ? JSON.parse(savedUsers) : [];
      
      // Remove existing admin if any
      users = users.filter(u => u.username !== 'admin');
      
      // Add default admin
      users.push({ id: 'U-ADMIN', name: 'ผู้ดูแลระบบ', username: 'admin', password: 'admin', role: 'ADMIN' });
      
      localStorage.setItem('app_users', JSON.stringify(users));
      alert('รีเซ็ตบัญชี admin เรียบร้อยแล้ว\nUsername: admin\nPassword: admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-900 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden p-8">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">PEA BPN</h1>
          <p className="text-slate-500">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ใช้</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              placeholder="กรอกชื่อผู้ใช้"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              placeholder="กรอกรหัสผ่าน"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2">
          <p className="text-[10px] text-slate-400 font-bold uppercase text-center">Quick Login (สำหรับทดสอบ)</p>
          <div className="flex gap-2">
            <button 
              onClick={() => { setUsername('admin'); setPassword('admin'); }}
              className="flex-1 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg border border-slate-100 hover:bg-purple-50 hover:text-purple-600 transition"
            >
              ใช้ Admin
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-4">
          <button 
            onClick={() => {
              const bypassUser: User = { id: 'U-ADMIN', name: 'ผู้ดูแลระบบ (Bypass)', username: 'admin', role: 'ADMIN' };
              onLogin(bypassUser);
              localStorage.setItem('user', JSON.stringify(bypassUser));
            }}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            เข้าสู่ระบบทันที (Bypass)
          </button>
          
          <button 
            onClick={handleResetAdmin}
            className="text-[10px] text-slate-400 hover:text-purple-600 transition underline block w-full"
          >
            ลืมรหัสผ่านหรือเข้าใช้งานไม่ได้? (รีเซ็ต Admin)
          </button>
          <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
            PEA BPN Inventory System v1.2
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
