import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDSrEMaNJNSx6Qi79gW52sxzZw1gnXIFCs",
  authDomain: "kpi-gemba-and-5s.firebaseapp.com",
  databaseURL: "https://kpi-gemba-and-5s-default-rtdb.firebaseio.com",
  projectId: "kpi-gemba-and-5s",
  storageBucket: "kpi-gemba-and-5s.firebasestorage.app",
  messagingSenderId: "136197671183",
  appId: "1:136197671183:web:bb3a280cd2953b91cf967a",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
