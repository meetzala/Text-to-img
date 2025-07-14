import { getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { app, auth, db } from "./firebase";

// Initialize Storage (not initialized in the main firebase.ts)
const storage = getStorage(app);

// Function to verify Firebase configuration
export async function verifyFirebaseConfig() {
  try {
    console.log("Verifying Firebase configuration...");

    // Check if Firebase app is initialized
    if (!app) {
      console.error("Firebase app initialization failed");
      return false;
    }
    console.log("✅ Firebase app initialized successfully");

    // Check if Auth is initialized
    if (!auth) {
      console.error("Firebase Auth initialization failed");
      return false;
    }
    console.log("✅ Firebase Auth initialized successfully");

    // Check if Firestore is initialized
    if (!db) {
      console.error("Firebase Firestore initialization failed");
      return false;
    }
    console.log("✅ Firebase Firestore initialized successfully");

    // Check if Storage is initialized
    if (!storage) {
      console.error("Firebase Storage initialization failed");
      return false;
    }
    console.log("✅ Firebase Storage initialized successfully");

    console.log("Firebase configuration verified successfully!");
    return true;
  } catch (error) {
    console.error("Error verifying Firebase configuration:", error);
    return false;
  }
}

// Export for use in other files
export { storage };
