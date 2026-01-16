import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDGUFE-PkiX-bu4F4dTwwebziQ8dHZalUk",
  authDomain: "kingandqueen-8a7bb.firebaseapp.com",
  projectId: "kingandqueen-8a7bb",
  storageBucket: "kingandqueen-8a7bb.firebasestorage.app",
  messagingSenderId: "109431662334",
  appId: "1:109431662334:web:9943fc718bfbc64682a7af",
  measurementId: "G-6SZJQMXN4Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User
};
