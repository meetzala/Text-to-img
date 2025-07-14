"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBcYImaFhsvZChjWJIMPsgN86clx2EXcYM",
  authDomain: "astra-demo-app.firebaseapp.com",
  projectId: "astra-demo-app",
  storageBucket: "astra-demo-app.firebasestorage.app", // Using the exact value from Firebase console
  messagingSenderId: "845834493684",
  appId: "1:845834493684:web:fa236993dbfaf10bf5c8a1",
  measurementId: "G-W04L6F1DQ1",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Add scopes to the Google provider
googleProvider.addScope("profile");
googleProvider.addScope("email");

// Set custom parameters
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { app, auth, db, googleProvider };
