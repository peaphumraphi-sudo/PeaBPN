
import React, { useState, useEffect } from 'react';
import { Layout, Menu, LogIn, Package, Truck, ClipboardCheck, Bell, LogOut, ChevronRight, QrCode, Plus, Minus, Download, User as UserIcon } from 'lucide-react';
import { InventoryItem, VehicleInventory, User, DailyCountLog, EquipmentChecklist } from './types';
import { INITIAL_INVENTORY, INITIAL_VEHICLES, TOOL_LIST } from './constants';

// Views
import Dashboard from './components/Dashboard';
import MainWarehouse from './components/MainWarehouse';
import VehicleManagement from './components/VehicleManagement';
import ChecklistManagement from './components/ChecklistManagement';
import UserManagement from './components/UserManagement';
import Login from './components/Login';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'main' | 'vehicle' | 'checklist' | 'users'>('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [vehicles, setVehicles] = useState<VehicleInventory[]>(INITIAL_VEHICLES);
  const [dailyLogs, setDailyLogs] = useState<DailyCountLog[]>([]);
  const [checklists, setChecklists] = useState<EquipmentChecklist[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Load from local storage
  useEffect(() => {
    const savedInventory = localStorage.getItem('inventory');
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    
    const savedVehicles = localStorage.getItem('vehicles');
    if (savedVehicles) setVehicles(JSON.parse(savedVehicles));

    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedUsers = localStorage.getItem('app_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      // Default admin
      const defaultUsers: User[] = [
        { id: 'U-ADMIN', name: 'ผู้ดูแลระบบ', username: 'admin', password: 'admin', role: 'ADMIN' }
      ];
      setUsers(defaultUsers);
      localStorage.setItem('app_users', JSON.stringify(defaultUsers));
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    localStorage.setItem('app_users', JSON.stringify(users));
  }, [inventory, vehicles, users]);

  // Handle transferring items from main warehouse to vehicle
  const handleTransferItems = (vehicleId: string, transfers: { itemId: string, quantity: number }[]) => {
    // 1. Update Main Inventory
    const newInventory = inventory.map(item => {
      const transfer = transfers.find(t => t.itemId === item.id);
      if (transfer) {
        return { ...item, quantity: Math.max(0, item.quantity - transfer.quantity) };
      }
      return item;
    });

    // 2. Update Vehicle Inventory
    const newVehicles = vehicles.map(vehicle => {
      if (vehicle.vehicleId === vehicleId) {
        const updatedItems = [...vehicle.items];
        transfers.forEach(transfer => {
          const existingItemIndex = updatedItems.findIndex(i => i.itemId === transfer.itemId);
          if (existingItemIndex > -1) {
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + transfer.quantity
            };
          } else {
            updatedItems.push({ itemId: transfer.itemId, quantity: transfer.quantity });
          }
        });
        return { ...vehicle, items: updatedItems };
      }
      return vehicle;
    });

    setInventory(newInventory);
    setVehicles(newVehicles);
  };

  const handleResetData = () => {
    localStorage.removeItem('inventory');
    localStorage.removeItem('vehicles');
    setInventory(INITIAL_INVENTORY);
    setVehicles(INITIAL_VEHICLES);
    alert('รีเซ็ตข้อมูลเรียบร้อยแล้ว');
  };

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  const lowStockCount = inventory.filter(i => i.quantity <= i.minThreshold).length;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white sticky top-0 h-screen flex-col transition-all">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-lg leading-tight">PEA BPN</h1>
        </div>

        <nav className="flex-1 mt-6">
          <ul className="space-y-1 px-3">
            <li>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <Layout className="w-5 h-5" />
                <span>แผงควบคุม</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('main')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'main' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <Package className="w-5 h-5" />
                <span className="flex-1 text-left">คลังพัสดุหลัก</span>
                {lowStockCount > 0 && <span className="bg-red-500 text-[10px] px-1.5 py-0.5 rounded-full">{lowStockCount}</span>}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('vehicle')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'vehicle' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <Truck className="w-5 h-5" />
                <span>พัสดุประจำรถ</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('checklist')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'checklist' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <ClipboardCheck className="w-5 h-5" />
                <span>เช็คลิสต์อุปกรณ์</span>
              </button>
            </li>
            {user.role === 'ADMIN' && (
              <li>
                <button 
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <UserIcon className="w-5 h-5" />
                  <span>จัดการผู้ใช้</span>
                </button>
              </li>
            )}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-lg mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setUser(null);
              localStorage.removeItem('user');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-5 h-5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border border-white/20 z-50 px-2 py-2 flex justify-around items-center shadow-2xl rounded-3xl pb-safe">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${activeTab === 'dashboard' ? 'text-purple-600 bg-purple-50' : 'text-slate-400'}`}
        >
          <Layout className={`w-6 h-6 ${activeTab === 'dashboard' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">ภาพรวม</span>
        </button>
        <button 
          onClick={() => setActiveTab('main')}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 relative ${activeTab === 'main' ? 'text-purple-600 bg-purple-50' : 'text-slate-400'}`}
        >
          <Package className={`w-6 h-6 ${activeTab === 'main' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">คลังหลัก</span>
          {lowStockCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
        </button>
        <button 
          onClick={() => setActiveTab('vehicle')}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${activeTab === 'vehicle' ? 'text-purple-600 bg-purple-50' : 'text-slate-400'}`}
        >
          <Truck className={`w-6 h-6 ${activeTab === 'vehicle' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">พัสดุรถ</span>
        </button>
        <button 
          onClick={() => setActiveTab('checklist')}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${activeTab === 'checklist' ? 'text-purple-600 bg-purple-50' : 'text-slate-400'}`}
        >
          <ClipboardCheck className={`w-6 h-6 ${activeTab === 'checklist' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">เช็คลิสต์</span>
        </button>
        {user.role === 'ADMIN' && (
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${activeTab === 'users' ? 'text-purple-600 bg-purple-50' : 'text-slate-400'}`}
          >
            <UserIcon className={`w-6 h-6 ${activeTab === 'users' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold">ผู้ใช้</span>
          </button>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-32 md:pb-8">
        <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between md:block">
            <div className="flex items-center gap-3">
              <div className="md:hidden p-2.5 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-200">
                {activeTab === 'dashboard' && <Layout className="w-6 h-6" />}
                {activeTab === 'main' && <Package className="w-6 h-6" />}
                {activeTab === 'vehicle' && <Truck className="w-6 h-6" />}
                {activeTab === 'checklist' && <ClipboardCheck className="w-6 h-6" />}
                {activeTab === 'users' && <UserIcon className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">
                  {activeTab === 'dashboard' && 'ภาพรวมระบบ'}
                  {activeTab === 'main' && 'คลังพัสดุหลัก'}
                  {activeTab === 'vehicle' && 'พัสดุประจำรถ'}
                  {activeTab === 'checklist' && 'เช็คลิสต์อุปกรณ์'}
                  {activeTab === 'users' && 'จัดการผู้ใช้งาน'}
                </h2>
                <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest">
                  {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <button className="p-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm relative">
                <Bell className="w-5 h-5 text-slate-600" />
                {lowStockCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
              </button>
              <button 
                onClick={() => {
                  if(confirm('ต้องการออกจากระบบ?')) {
                    setUser(null);
                    localStorage.removeItem('user');
                  }
                }}
                className="p-2.5 bg-red-50 text-red-500 rounded-2xl border border-red-100"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
          <Dashboard 
            inventory={inventory} 
            vehicles={vehicles} 
            lowStockCount={lowStockCount} 
            onResetData={handleResetData}
            onImportData={(data) => {
              setInventory(data.inventory);
              setVehicles(data.vehicles);
            }}
          />
        )}
          {activeTab === 'main' && (
            <MainWarehouse 
              inventory={inventory} 
              onUpdateInventory={setInventory} 
              userRole={user?.role}
            />
          )}
          {activeTab === 'vehicle' && (
            <VehicleManagement 
              inventory={inventory}
              vehicles={vehicles}
              onUpdateInventory={setInventory}
              onUpdateVehicles={setVehicles}
              onTransferItems={handleTransferItems}
              logs={dailyLogs}
              onAddLog={(log) => setDailyLogs([...dailyLogs, log])}
            />
          )}
          {activeTab === 'checklist' && (
            <ChecklistManagement 
              vehicles={vehicles}
              checklists={checklists}
              onAddChecklist={(cl) => setChecklists([...checklists, cl])}
            />
          )}
          {activeTab === 'users' && (
            <UserManagement 
              users={users}
              onAddUser={(u) => setUsers([...users, u])}
              onDeleteUser={(id) => setUsers(users.filter(u => u.id !== id))}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
