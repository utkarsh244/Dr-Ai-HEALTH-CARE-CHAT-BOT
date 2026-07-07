import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBW0Ytl4XCEAeeOieaj82qgDDASODZCZWs",
  authDomain: "healthcare-chatbot-c667e.firebaseapp.com",
  projectId: "healthcare-chatbot-c667e",
  storageBucket: "healthcare-chatbot-c667e.firebasestorage.app",
  messagingSenderId: "807637524151",
  appId: "1:807637524151:web:f539d25248fe9a40077732"
};

// Initialize Firebase
const app        = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const storage  = getStorage(app);

// Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ── Auth Functions ─────────────────────────────────────────────────────────────

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);