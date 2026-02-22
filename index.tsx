import { useEffect, useState } from "react";
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [items, setItems] = useState<any[]>([]);

  // 🔥 ฟังข้อมูลแบบ realtime
  useEffect(() => {
    const q = query(
      collection(db, "inventory"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(data);
    });

    return () => unsubscribe();
  }, []);

  // ➕ เพิ่มข้อมูล
  async function saveInventory() {
    await addDoc(collection(db, "inventory"), {
      name: "สายไฟแรงต่ำ",
      code: "PEA-001",
      quantity: 20,
      location: "คลัง BPN",
      createdAt: serverTimestamp()
    });
  }

  return (
    <div className="p-4">
      <button
        onClick={saveInventory}
        className="bg-purple-600 text-white px-4 py-2 rounded-xl mb-4"
      >
        เพิ่มข้อมูล
      </button>

      {items.map(item => (
        <div key={item.id} className="bg-white p-3 rounded mb-2 shadow">
          <div>{item.name}</div>
          <div>{item.code}</div>
          <div>จำนวน: {item.quantity}</div>
        </div>
      ))}
    </div>
  );
}

export default App;
