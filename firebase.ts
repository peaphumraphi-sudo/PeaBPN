// src/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "peabpn.firebaseapp.com",
  projectId: "peabpn",
  storageBucket: "peabpn.firebasestorage.app",
  messagingSenderId: "929356206450",
  appId: "1:929356206450:web:2e0ca1f6e46e5fa8cb4deb"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
