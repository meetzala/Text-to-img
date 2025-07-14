import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  Timestamp,
  DocumentData,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";

// Types
export interface ImageData {
  id?: string;
  prompt: string;
  imageUrl: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: Timestamp;
  votes?: number;
  voterIds?: string[];
  // Version control fields
  parentId?: string | null; // ID of the parent image (null for original images)
  version: number; // Version number (1 for original, increments for derivatives)
  isLatestVersion?: boolean; // Flag to indicate if this is the latest version
  versionHistory?: string[]; // Array of image IDs in the version history
}

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "admin" | "designer";
}

// Authentication
export const signInWithGoogle = async () => {
  try {
    // Add additional scopes to the GoogleAuthProvider
    googleProvider.addScope("profile");
    googleProvider.addScope("email");

    // Set custom parameters for the auth provider
    googleProvider.setCustomParameters({
      prompt: "select_account",
    });

    // Try to sign in with popup
    console.log("Attempting to sign in with Google...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Sign in successful:", result.user.uid);

    const user = result.user;

    // Check if user exists in the database
    console.log("Checking if user exists in database...");
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      console.log("Creating new user in database...");
      // Create new user with default role as designer
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: "designer", // Default role
        createdAt: Timestamp.now(),
      });
      console.log("New user created successfully");
    } else {
      console.log("User already exists in database");
    }

    return user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);

    // Provide more detailed error information
    if (error.code === "auth/configuration-not-found") {
      console.error(
        "Firebase Auth Configuration Error: Make sure Google Auth is enabled in your Firebase project",
      );
      console.error(
        "Please visit the Firebase console and enable Google authentication",
      );
      console.error(
        "Also verify that your domain is in the authorized domains list",
      );
    } else if (error.code === "auth/popup-closed-by-user") {
      console.error(
        "Sign-in popup was closed before completing the sign-in process",
      );
    } else if (error.code === "auth/popup-blocked") {
      console.error(
        "Sign-in popup was blocked by your browser. Please allow popups for this site",
      );
    }

    throw error;
  }
};

export const signOut = () => firebaseSignOut(auth);

export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const getUserRole = async (uid: string): Promise<string> => {
  try {
    const userQuery = query(collection(db, "users"), where("uid", "==", uid));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      return userData.role || "designer";
    }

    return "designer"; // Default role
  } catch (error) {
    console.error("Error getting user role:", error);
    return "designer"; // Default role on error
  }
};

// Image operations
export const saveGeneratedImage = async (
  prompt: string,
  imageUrl: string,
  user: FirebaseUser,
  parentId: string | null = null, // Add parentId parameter with default value null
): Promise<string> => {
  try {
    console.log("Saving generated image...");

    // Upload image to Cloudinary via API route instead of direct upload
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageData: imageUrl,
        folder: `astra-images/${user.uid}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upload image");
    }

    const data = await response.json();
    const cloudinaryUrl = data.imageUrl;

    // Get version information
    let version = 1;
    let versionHistory: string[] = [];

    // If this is a new version of an existing image
    if (parentId) {
      // Get the parent image
      const parentDocRef = doc(db, "images", parentId);
      const parentDoc = await getDoc(parentDocRef);

      if (parentDoc.exists()) {
        const parentData = parentDoc.data() as ImageData;

        // Increment version number
        version = (parentData.version || 1) + 1;

        // Update version history
        versionHistory = [
          ...(parentData.versionHistory || [parentId]),
          parentId,
        ];

        // Mark parent as not the latest version
        await updateDoc(parentDocRef, {
          isLatestVersion: false,
        });
      }
    }

    // Save image metadata to Firestore
    const docRef = await addDoc(collection(db, "images"), {
      prompt,
      imageUrl: cloudinaryUrl,
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      userEmail: user.email || "No email",
      createdAt: Timestamp.now(),
      // Version control fields
      parentId,
      version,
      isLatestVersion: true,
      versionHistory,
    });

    console.log("Image saved successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving generated image:", error);
    throw error;
  }
};

export const getUserImages = async (userId: string): Promise<ImageData[]> => {
  try {
    const imagesQuery = query(
      collection(db, "images"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );

    const imagesSnapshot = await getDocs(imagesQuery);

    return imagesSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as ImageData,
    );
  } catch (error) {
    console.error("Error getting user images:", error);
    return [];
  }
};

export const getAllImages = async (): Promise<ImageData[]> => {
  try {
    const imagesQuery = query(
      collection(db, "images"),
      orderBy("createdAt", "desc"),
    );

    const imagesSnapshot = await getDocs(imagesQuery);

    return imagesSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as ImageData,
    );
  } catch (error) {
    console.error("Error getting all images:", error);
    return [];
  }
};

export const searchImagesByPrompt = async (
  searchTerm: string,
): Promise<ImageData[]> => {
  try {
    // Get all images (Firestore doesn't support text search directly)
    const allImages = await getAllImages();

    if (!searchTerm.trim()) {
      return allImages;
    }

    // Split search term into keywords for better matching
    const keywords = searchTerm
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    // Score-based filtering
    return allImages
      .map((image) => {
        const promptLower = image.prompt.toLowerCase();

        // Calculate match score
        let score = 0;

        // Exact match gets highest score
        if (promptLower.includes(searchTerm.toLowerCase())) {
          score += 10;
        }

        // Count how many keywords match
        keywords.forEach((keyword) => {
          if (promptLower.includes(keyword)) {
            score += 1;
          }
        });

        return { image, score };
      })
      .filter((item) => item.score > 0) // Only include images with matches
      .sort((a, b) => b.score - a.score) // Sort by score (highest first)
      .map((item) => item.image); // Return just the images
  } catch (error) {
    console.error("Error searching images:", error);
    return [];
  }
};

// Function to search images by similarity using the uploaded image
export const searchImagesBySimilarity = async (
  imageFile: File,
): Promise<ImageData[]> => {
  try {
    // Get all images
    const allImages = await getAllImages();

    if (!imageFile) {
      return allImages;
    }

    // Instead of using Cloudinary, we'll use our image analysis API
    // to extract keywords from the image and then search by those keywords

    // Create form data for the API request
    const formData = new FormData();
    formData.append("image", imageFile);

    // Call our image analysis API
    const response = await fetch("/api/image-analysis", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to analyze image");
    }

    const data = await response.json();
    const keywords = data.keywords as string[];

    if (!keywords || keywords.length === 0) {
      // If no keywords were found, return all images
      return allImages;
    }

    console.log("Image analysis keywords:", keywords);

    // Use the keywords to search for images
    // Similar to searchImagesByPrompt but using the extracted keywords
    return allImages
      .map((image) => {
        const promptLower = image.prompt.toLowerCase();

        // Calculate match score
        let score = 0;

        // Count how many keywords match
        keywords.forEach((keyword) => {
          if (promptLower.includes(keyword.toLowerCase())) {
            score += 2; // Give more weight to AI-extracted keywords
          }
        });

        return { image, score };
      })
      .filter((item) => item.score > 0) // Only include images with matches
      .sort((a, b) => b.score - a.score) // Sort by score (highest first)
      .map((item) => item.image); // Return just the images
  } catch (error) {
    console.error("Error searching images by similarity:", error);
    throw error; // Re-throw to allow proper error handling in the UI
  }
};

// New function to get designer details
export const getDesignerDetails = async (
  userId: string,
): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }

    return null;
  } catch (error) {
    console.error("Error getting designer details:", error);
    return null;
  }
};

// New function to set a user as an admin
export const setUserAsAdmin = async (userId: string): Promise<boolean> => {
  try {
    // Check if user exists
    const userQuery = query(
      collection(db, "users"),
      where("uid", "==", userId),
    );
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      console.error("User not found");
      return false;
    }

    // Get the document reference
    const userDocRef = userSnapshot.docs[0].ref;

    // Update the user's role to admin
    await updateDoc(userDocRef, {
      role: "admin",
    });

    console.log(`User ${userId} has been set as admin`);
    return true;
  } catch (error) {
    console.error("Error setting user as admin:", error);
    return false;
  }
};

// Function to ensure a user exists in the database
export const ensureUserExists = async (user: FirebaseUser): Promise<void> => {
  try {
    // Check if user already exists
    const userQuery = query(
      collection(db, "users"),
      where("uid", "==", user.uid),
    );
    const userSnapshot = await getDocs(userQuery);

    // If user doesn't exist, create them
    if (userSnapshot.empty) {
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: "designer", // Default role
        createdAt: Timestamp.now(),
      });
      console.log(`User ${user.uid} created in database`);
    } else {
      console.log(`User ${user.uid} already exists in database`);
    }
  } catch (error) {
    console.error("Error ensuring user exists:", error);
  }
};

// Function to vote on an image
export const voteForImage = async (
  imageId: string,
  userId: string,
): Promise<boolean> => {
  try {
    // Get the image document
    const imageDoc = await getDoc(doc(db, "images", imageId));

    if (!imageDoc.exists()) {
      console.error("Image not found");
      return false;
    }

    const imageData = imageDoc.data();
    const voterIds = imageData.voterIds || [];

    // Check if user has already voted
    if (voterIds.includes(userId)) {
      // User already voted, remove their vote
      await updateDoc(doc(db, "images", imageId), {
        votes: (imageData.votes || 0) - 1,
        voterIds: voterIds.filter((id: string) => id !== userId),
      });
      console.log(`Vote removed from image ${imageId} by user ${userId}`);
    } else {
      // User hasn't voted, add their vote
      await updateDoc(doc(db, "images", imageId), {
        votes: (imageData.votes || 0) + 1,
        voterIds: [...voterIds, userId],
      });
      console.log(`Vote added to image ${imageId} by user ${userId}`);
    }

    return true;
  } catch (error) {
    console.error("Error voting for image:", error);
    return false;
  }
};

// Function to check if a user has voted for an image
export const hasUserVotedForImage = async (
  imageId: string,
  userId: string,
): Promise<boolean> => {
  try {
    const imageDoc = await getDoc(doc(db, "images", imageId));

    if (!imageDoc.exists()) {
      return false;
    }

    const imageData = imageDoc.data();
    const voterIds = imageData.voterIds || [];

    return voterIds.includes(userId);
  } catch (error) {
    console.error("Error checking if user voted for image:", error);
    return false;
  }
};

// Function to get top voted images
export const getTopVotedImages = async (
  limit: number = 10,
): Promise<ImageData[]> => {
  try {
    // Get all images first (Firestore doesn't support orderBy with where easily)
    const imagesQuery = query(collection(db, "images"));

    const imagesSnapshot = await getDocs(imagesQuery);

    // Convert to array, filter out images with no votes, sort by votes
    const images = imagesSnapshot.docs
      .map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            votes: doc.data().votes || 0,
          }) as ImageData,
      )
      .filter((image) => (image.votes || 0) > 0)
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      .slice(0, limit);

    return images;
  } catch (error) {
    console.error("Error getting top voted images:", error);
    return [];
  }
};

// Function to get designer rankings based on total votes
export const getDesignerRankings = async (): Promise<
  {
    userId: string;
    displayName: string;
    email: string;
    totalVotes: number;
    imageCount: number;
  }[]
> => {
  try {
    // Get all images
    const imagesQuery = query(collection(db, "images"));
    const imagesSnapshot = await getDocs(imagesQuery);

    // Group by designer and calculate total votes
    const designerStats: Record<
      string,
      {
        userId: string;
        displayName: string;
        email: string;
        totalVotes: number;
        imageCount: number;
      }
    > = {};

    imagesSnapshot.docs.forEach((doc) => {
      const data = doc.data() as ImageData;
      const userId = data.userId;

      if (!designerStats[userId]) {
        designerStats[userId] = {
          userId,
          displayName: data.userName,
          email: data.userEmail,
          totalVotes: 0,
          imageCount: 0,
        };
      }

      designerStats[userId].totalVotes += data.votes || 0;
      designerStats[userId].imageCount += 1;
    });

    // Convert to array and sort by total votes
    return Object.values(designerStats).sort(
      (a, b) => b.totalVotes - a.totalVotes,
    );
  } catch (error) {
    console.error("Error getting designer rankings:", error);
    return [];
  }
};

// Get all versions of an image
export const getImageVersions = async (
  imageId: string,
): Promise<ImageData[]> => {
  try {
    // Get the image
    const imageDocRef = doc(db, "images", imageId);
    const imageDoc = await getDoc(imageDocRef);

    if (!imageDoc.exists()) {
      throw new Error("Image not found");
    }

    const imageData = { ...imageDoc.data(), id: imageDoc.id } as ImageData;

    // If this is a derived version, get the original and all other versions
    if (imageData.parentId) {
      // Find the root parent (original image)
      let rootParentId = imageData.parentId;
      let rootParent = await getDoc(doc(db, "images", rootParentId));
      let rootParentData = rootParent.data() as ImageData;

      while (rootParentData.parentId) {
        rootParentId = rootParentData.parentId;
        rootParent = await getDoc(doc(db, "images", rootParentId));
        rootParentData = rootParent.data() as ImageData;
      }

      // Get all versions derived from the root parent
      const versionsQuery = query(
        collection(db, "images"),
        where("parentId", "==", rootParentId),
      );

      const versionDocs = await getDocs(versionsQuery);
      const versions = versionDocs.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id }) as ImageData,
      );

      // Add the root parent to the versions
      return [{ ...rootParentData, id: rootParentId }, ...versions];
    }

    // Get all versions derived from this image
    const versionsQuery = query(
      collection(db, "images"),
      where("parentId", "==", imageId),
    );

    const versionDocs = await getDocs(versionsQuery);
    const versions = versionDocs.docs.map(
      (doc) => ({ ...doc.data(), id: doc.id }) as ImageData,
    );

    // Return the original image and all its versions
    return [imageData, ...versions];
  } catch (error) {
    console.error("Error getting image versions:", error);
    throw error;
  }
};

// Get the version history of an image (all ancestors)
export const getImageAncestors = async (
  imageId: string,
): Promise<ImageData[]> => {
  try {
    const ancestors: ImageData[] = [];
    let currentId = imageId;

    while (currentId) {
      const imageDocRef = doc(db, "images", currentId);
      const imageDoc = await getDoc(imageDocRef);

      if (!imageDoc.exists()) {
        break;
      }

      const imageData = { ...imageDoc.data(), id: imageDoc.id } as ImageData;
      ancestors.push(imageData);

      // Move to parent
      currentId = imageData.parentId || "";
    }

    return ancestors.reverse(); // Return in chronological order (oldest first)
  } catch (error) {
    console.error("Error getting image ancestors:", error);
    throw error;
  }
};

// Function to delete an image by ID
export const deleteImage = async (imageId: string): Promise<boolean> => {
  try {
    // Get the image document reference
    const imageRef = doc(db, "images", imageId);

    // Delete the document
    await deleteDoc(imageRef);

    console.log(`Image ${imageId} has been deleted`);
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
};
