// scripts/make-admin.js
// This script sets a user as an admin in the Firestore database

const { initializeApp } = require("firebase/app");
const {
  collection,
  getDocs,
  query,
  where,
  getFirestore,
  updateDoc,
  doc,
} = require("firebase/firestore");

// Initialize Firebase with your config
const firebaseConfig = {
  apiKey: "AIzaSyBcYImaFhsvZChjWJIMPsgN86clx2EXcYM",
  authDomain: "astra-demo-app.firebaseapp.com",
  projectId: "astra-demo-app",
  storageBucket: "astra-demo-app.firebasestorage.app",
  messagingSenderId: "845834493684",
  appId: "1:845834493684:web:fa236993dbfaf10bf5c8a1",
  measurementId: "G-W04L6F1DQ1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function makeUserAdmin(email) {
  try {
    console.log(`Searching for user with email: ${email}`);

    // Find the user by email
    const userQuery = query(
      collection(db, "users"),
      where("email", "==", email),
    );
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      console.error(`No user found with email: ${email}`);
      return false;
    }

    // Get the first matching user document
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    console.log(
      `Found user: ${userData.displayName || "Unknown"} (${userData.email})`,
    );
    console.log(`Current role: ${userData.role || "designer"}`);

    // Update the user's role to admin
    await updateDoc(doc(db, "users", userDoc.id), {
      role: "admin",
    });

    console.log(`Successfully updated user to admin role!`);
    return true;
  } catch (error) {
    console.error("Error making user admin:", error);
    return false;
  }
}

// Get email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.error("Please provide a user email as an argument");
  console.error("Usage: node make-admin.js user@example.com");
  process.exit(1);
}

// Make the user an admin
makeUserAdmin(userEmail)
  .then((success) => {
    if (success) {
      console.log("Operation completed successfully");
    } else {
      console.error("Operation failed");
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
