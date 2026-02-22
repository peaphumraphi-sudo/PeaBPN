// src/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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

export const db = getFirestore(app);

