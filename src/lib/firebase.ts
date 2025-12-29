import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyAQwhojpJHoSNI6dLPw9YWehuSeP2x-rzY",
    authDomain: "impostor-709e6.firebaseapp.com",
    databaseURL: "https://impostor-709e6-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "impostor-709e6",
    storageBucket: "impostor-709e6.firebasestorage.app",
    messagingSenderId: "759389324366",
    appId: "1:759389324366:web:8d398712fffa21f1832f1f",
    measurementId: "G-X38J2EY20J"
};

// Initialize Firebase (singleton pattern)
// Prevent crash during build if env vars are missing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

try {
    if (typeof window === 'undefined' && !firebaseConfig.databaseURL) {
        console.warn("Firebase config missing during server build. Skipping.");
    } else {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        db = getDatabase(app);
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

export { app, db };
