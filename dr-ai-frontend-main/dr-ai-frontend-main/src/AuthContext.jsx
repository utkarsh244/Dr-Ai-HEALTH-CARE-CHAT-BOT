import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Save/update user profile in Firestore on every login
        await saveUserToFirestore(user);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Save user profile to Firestore (creates if not exists, updates last login)
  const saveUserToFirestore = async (user) => {
    const userRef  = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // First time login — create profile
      await setDoc(userRef, {
        uid:         user.uid,
        name:        user.displayName || "User",
        email:       user.email,
        photoURL:    user.photoURL || null,
        createdAt:   serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    } else {
      // Returning user — update last login
      await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
    }
  };

  const value = { currentUser, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
