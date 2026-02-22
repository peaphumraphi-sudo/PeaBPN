
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// firebase.ts

// firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// ❗ analytics ใช้ได้เฉพาะ https หรือ localhost
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBOpQ3opqqo6TbeUXjijuBPutncUPwZFqo",
  authDomain: "peabpn.firebaseapp.com",
  projectId: "peabpn",
  storageBucket: "peabpn.firebasestorage.app",
  messagingSenderId: "929356206450",
  appId: "1:929356206450:web:2e0ca1f6e46e5fa8cb4deb",
  measurementId: "G-GM2J8E6E3G"
};

const app = initializeApp(firebaseConfig);

// 🔥 เปิดใช้งาน Firestore
export const db = getFirestore(app);

// (ถ้าจะใช้ Analytics)
// const analytics = getAnalytics(app);
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

async function saveInventory() {
  try {
    await addDoc(collection(db, "inventory"), {
      name: "สายไฟแรงต่ำ",
      code: "PEA-001",
      quantity: 20,
      location: "คลัง BPN",
      createdAt: serverTimestamp()
    });

    alert("บันทึกข้อมูลสำเร็จ ✅");
  } catch (error) {
    console.error(error);
    alert("เกิดข้อผิดพลาด ❌");
  }
}
