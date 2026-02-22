import React, { useState, useEffect } from 'react';
import { Layout, Package, Truck, ClipboardCheck, Bell, LogOut, User as UserIcon } from 'lucide-react';

import { InventoryItem, VehicleInventory, User } from './types';
import { INITIAL_VEHICLES } from './constants';

import Dashboard from './components/Dashboard';
import MainWarehouse from './components/MainWarehouse';
import VehicleManagement from './components/VehicleManagement';
import ChecklistManagement from './components/ChecklistManagement';
import UserManagement from './components/UserManagement';
import Login from './components/Login';

import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'main' | 'vehicle' | 'checklist' | 'users'>('dashboard');

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleInventory[]>(INITIAL_VEHICLES);

  /* ===========================
     🔥 FIRESTORE REALTIME
  ============================ */

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as InventoryItem[];

      setInventory(data);
    });

    return () => unsubscribe();
  }, []);

  /* ===========================
     🚚 TRANSFER ITEMS
  ============================ */

  const handleTransferItems = async (
    vehicleId: string,
    transfers: { itemId: string; quantity: number }[]
  ) => {

    for (const transfer of transfers) {
      const item = inventory.find(i => i.id === transfer.itemId);
      if (!item) continue;

      const newQty = Math.max(0, item.quantity - transfer.quantity);

      await updateDoc(doc(db, "inventory", item.id), {
        quantity: newQty
      });
    }
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const lowStockCount = inventory.filter(i => i.quantity <= i.minThreshold).length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6">
        <h1 className="text-xl font-bold mb-6">PEA BPN</h1>

        <button onClick={() => setActiveTab('dashboard')} className="block mb-2">Dashboard</button>
        <button onClick={() => setActiveTab('main')} className="block mb-2">
          คลังหลัก {lowStockCount > 0 && `(${lowStockCount})`}
        </button>
        <button onClick={() => setActiveTab('vehicle')} className="block mb-2">พัสดุรถ</button>
        <button onClick={() => setActiveTab('checklist')} className="block mb-2">เช็คลิสต์</button>

        {user.role === 'ADMIN' && (
          <button onClick={() => setActiveTab('users')} className="block mb-2">
            ผู้ใช้
          </button>
        )}

        <button
          onClick={() => setUser(null)}
          className="mt-6 text-red-400"
        >
          ออกจากระบบ
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">

        {activeTab === 'dashboard' && (
          <Dashboard
            inventory={inventory}
            vehicles={vehicles}
            lowStockCount={lowStockCount}
          />
        )}

        {activeTab === 'main' && (
          <MainWarehouse
            inventory={inventory}
          />
        )}

        {activeTab === 'vehicle' && (
          <VehicleManagement
            inventory={inventory}
            vehicles={vehicles}
            onTransferItems={handleTransferItems}
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistManagement />
        )}

        {activeTab === 'users' && (
          <UserManagement />
        )}

      </main>
    </div>
  );
};

export default App;
