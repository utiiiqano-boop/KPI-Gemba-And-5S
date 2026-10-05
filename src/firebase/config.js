import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDSrEMaNJNSx6Qi79gW52sxzZw1gnXIFCs",
  authDomain: "kpi-gemba-and-5s.firebaseapp.com",
  databaseURL: "https://kpi-gemba-and-5s-default-rtdb.firebaseio.com",
  projectId: "kpi-gemba-and-5s",
  storageBucket: "kpi-gemba-and-5s.firebasestorage.app",
  messagingSenderId: "136197671183",
  appId: "1:136197671183:web:bb3a280cd2953b91cf967a",
  measurementId: "G-P0X2YRF3BZ"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
