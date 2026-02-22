import React, { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDoc
} from "firebase/firestore"

import { db } from "./firebase"

import { InventoryItem, VehicleInventory, User } from './types'

import Dashboard from './components/Dashboard'
import MainWarehouse from './components/MainWarehouse'
import VehicleManagement from './components/VehicleManagement'
import ChecklistManagement from './components/ChecklistManagement'
import UserManagement from './components/UserManagement'
import Login from './components/Login'

const App: React.FC = () => {

  /* ================================
     STATE
  ================================= */

  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'main' | 'vehicle' | 'checklist' | 'users'
  >('dashboard')

  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [vehicles, setVehicles] = useState<VehicleInventory[]>([])

  /* ================================
     🔥 INVENTORY REALTIME
  ================================= */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "inventory"),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as InventoryItem[]

        setInventory(data)
      }
    )

    return () => unsubscribe()
  }, [])

  /* ================================
     🚚 VEHICLES REALTIME
  ================================= */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "vehicles"),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VehicleInventory[]

        setVehicles(data)
      }
    )

    return () => unsubscribe()
  }, [])

  /* ================================
     🔁 TRANSFER ITEMS
  ================================= */

  const handleTransferItems = async (
    vehicleId: string,
    transfers: { itemId: string; quantity: number }[]
  ) => {

    try {

      for (const transfer of transfers) {

        // 🔍 หา item ในคลังหลัก
        const itemRef = doc(db, "inventory", transfer.itemId)
        const itemSnap = await getDoc(itemRef)

        if (!itemSnap.exists()) continue

        const itemData = itemSnap.data() as InventoryItem

        // ❌ กันของติดลบ
        if (itemData.quantity < transfer.quantity) {
          alert("จำนวนสินค้าไม่เพียงพอ")
          return
        }

        const newQty = itemData.quantity - transfer.quantity

        // 🔥 อัปเดตคลังหลัก
        await updateDoc(itemRef, {
          quantity: newQty,
          updatedAt: serverTimestamp()
        })

        // 🔥 อัปเดตรถ
        const vehicleRef = doc(db, "vehicles", vehicleId)
        const vehicleSnap = await getDoc(vehicleRef)

        if (vehicleSnap.exists()) {
          const vehicleData = vehicleSnap.data() as VehicleInventory

          const existingItem = vehicleData.items?.find(
            (i: any) => i.itemId === transfer.itemId
          )

          let updatedItems

          if (existingItem) {
            updatedItems = vehicleData.items.map((i: any) =>
              i.itemId === transfer.itemId
                ? { ...i, quantity: i.quantity + transfer.quantity }
                : i
            )
          } else {
            updatedItems = [
              ...(vehicleData.items || []),
              {
                itemId: transfer.itemId,
                quantity: transfer.quantity
              }
            ]
          }

          await updateDoc(vehicleRef, {
            items: updatedItems,
            updatedAt: serverTimestamp()
          })
        }

        // 📝 บันทึก Log
        await addDoc(collection(db, "logs"), {
          type: "TRANSFER",
          vehicleId,
          itemId: transfer.itemId,
          quantity: transfer.quantity,
          user: user?.name || "Unknown",
          createdAt: serverTimestamp()
        })
      }

      alert("โอนสินค้าเรียบร้อย ✅")

    } catch (error) {
      console.error(error)
      alert("เกิดข้อผิดพลาด ❌")
    }
  }

  /* ================================
     LOGIN
  ================================= */

  if (!user) {
    return <Login onLogin={setUser} />
  }

  const lowStockCount = inventory.filter(
    i => i.quantity <= i.minThreshold
  ).length

  /* ================================
     UI
  ================================= */

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6">
        <h1 className="text-xl font-bold mb-6">PEA BPN</h1>

        <button onClick={() => setActiveTab('dashboard')} className="block mb-2">
          Dashboard
        </button>

        <button onClick={() => setActiveTab('main')} className="block mb-2">
          คลังหลัก {lowStockCount > 0 && `(${lowStockCount})`}
        </button>

        <button onClick={() => setActiveTab('vehicle')} className="block mb-2">
          พัสดุรถ
        </button>

        <button onClick={() => setActiveTab('checklist')} className="block mb-2">
          เช็คลิสต์
        </button>

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
  )
}

export default App
