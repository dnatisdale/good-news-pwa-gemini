// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBHE6i8TMUtY1XuvDTMPAapd-VQH1N7SK4",
  authDomain: "tgn-pwa-gemini.firebaseapp.com",
  projectId: "tgn-pwa-gemini",
  storageBucket: "tgn-pwa-gemini.firebasestorage.app",
  messagingSenderId: "996175606482",
  appId: "1:996175606482:web:8ad13677c230b42f39730b",
  measurementId: "G-7QZ8VPRBRY",
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// --- END IMPORTANT ---

// Initialize all instances right away, or use a single export function.
// We will use a single function that returns everything.

// We will store the initialized components here
let appInstance = null;
let authInstance = null;
let dbInstance = null;

// The function that initializes and returns all components
export const initializeAppIfNeeded = () => {
  if (!appInstance) {
    appInstance = initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
  }
  return { app: appInstance, auth: authInstance, db: dbInstance };
};

// Call the function once so that the following exports are properly assigned
const { app, auth, db } = initializeAppIfNeeded();

// Export the initialized instances for use in other files
// These exports will now be correctly defined
export { app, auth, db };
