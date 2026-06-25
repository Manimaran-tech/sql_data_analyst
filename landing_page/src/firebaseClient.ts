import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAVe_Xr0Kqz_2Htog0MkBLaDkM_RK4zRo0",
  authDomain: "sih-csbs-007.firebaseapp.com",
  databaseURL: "https://sih-csbs-007-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sih-csbs-007",
  storageBucket: "sih-csbs-007.firebasestorage.app",
  messagingSenderId: "1052885228147",
  appId: "1:1052885228147:web:127b8e66656aa0642ba806",
  measurementId: "G-REPMW5XX72"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
