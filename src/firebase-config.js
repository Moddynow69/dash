import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCJQ0SRVBAaFdhkfjHgtAun2JnEHWwQCTg",
  authDomain: "dashboard-68cbd.firebaseapp.com",
  projectId: "dashboard-68cbd",
  storageBucket: "dashboard-68cbd.firebasestorage.app",
  messagingSenderId: "1031436922799",
  appId: "1:1031436922799:web:55a0ebf5d12eb88008495a",
  measurementId: "G-9XJB78TPFY"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };