import { useState, useEffect, useCallback } from "react";
import {
  signInAnonymously,
  onAuthStateChanged,
  createUserWithEmailAndPassword, // New Import
  signInWithEmailAndPassword, // New Import
  signOut, // New Import
} from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { i18n } from "../i18n";

// Hook for Firebase Auth and Data Loading
export function useFirebase(setLang) {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userData, setUserData] = useState({ bookmarks: [], notes: [] });
  const [error, setError] = useState(null);

  // 1. Authentication Listener (runs once)
  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth is not initialized.");
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // If no user is logged in, sign in anonymously to ensure every user has a UID for data storage.
        console.log(i18n.en.sign_in_guest);
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error(`Anonymous sign-in failed:`, e);
          setError(i18n.en.error_auth);
        }
      }
      // User ID is updated here whether it's anonymous or email/password
      setUserId(user ? user.uid : null);
      setIsAuthReady(true);
    });

    const storedLang = localStorage.getItem("appLang") || "en";
    setLang(storedLang);

    return () => unsubscribe();
  }, [setLang]);

  // 2. Data Listener (runs once auth is ready)
  useEffect(() => {
    if (!isAuthReady || !userId || !db) return;

    const userDataRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(
      userDataRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            bookmarks: data.bookmarks || [],
            notes: data.notes || [],
          });
        } else {
          // Initialize user data if it doesn't exist
          const initialData = { bookmarks: [], notes: [] };
          setDoc(userDataRef, initialData).catch((e) =>
            console.error("Error initializing user data:", e)
          );
          setUserData(initialData);
        }
      },
      (e) => {
        console.error("Firestore data snapshot error:", e);
        setError("Error fetching user data.");
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, userId]);

  // 3. Data Setter
  const saveUserData = useCallback(
    async (newUserData) => {
      if (!db || !userId) return;
      const userDataRef = doc(db, "users", userId);
      try {
        await setDoc(userDataRef, newUserData, { merge: true });
      } catch (e) {
        console.error("Error saving user data:", e);
      }
    },
    [userId]
  );

  // 4. NEW AUTH FUNCTIONS
  const signUp = useCallback(async (email, password) => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return true; // Success
    } catch (e) {
      console.error("Sign up failed:", e);
      setError(e.message);
      return false; // Failure
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true; // Success
    } catch (e) {
      console.error("Sign in failed:", e);
      setError(e.message);
      return false; // Failure
    }
  }, []);

  const logOut = useCallback(async () => {
    await signOut(auth);
    // Note: The onAuthStateChanged listener will automatically sign them back in anonymously
  }, []);

  return {
    isAuthReady,
    userId,
    userData,
    saveUserData,
    error,
    signUp,
    signIn,
    logOut,
  };
}
