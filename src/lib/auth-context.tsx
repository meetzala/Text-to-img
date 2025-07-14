"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User as FirebaseUser } from "firebase/auth";
import {
  signInWithGoogle,
  signOut,
  getCurrentUser,
  getUserRole,
  ensureUserExists,
} from "./firebase-service";

interface AuthContextType {
  user: FirebaseUser | null;
  userRole: string;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setError(null);
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          await ensureUserExists(currentUser);

          const role = await getUserRole(currentUser.uid);
          setUserRole(role);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setError(
          "Failed to initialize authentication. Please try again later.",
        );
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await signInWithGoogle();
      setUser(user);

      if (user) {
        await ensureUserExists(user);

        const role = await getUserRole(user.uid);
        setUserRole(role);
      }
    } catch (error: any) {
      console.error("Error signing in:", error);

      // Handle specific Firebase auth errors
      if (error.code === "auth/configuration-not-found") {
        setError(
          "Authentication configuration not found. Please make sure Firebase is properly configured and Google authentication is enabled in your Firebase project.",
        );
      } else if (error.code === "auth/popup-closed-by-user") {
        setError(
          "Sign-in popup was closed before completing the sign-in process.",
        );
      } else if (error.code === "auth/popup-blocked") {
        setError(
          "Sign-in popup was blocked by your browser. Please allow popups for this site.",
        );
      } else {
        setError(
          `Authentication failed: ${error.message || "Unknown error occurred"}`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await signOut();
      setUser(null);
      setUserRole("");
    } catch (error: any) {
      console.error("Error signing out:", error);
      setError(`Sign out failed: ${error.message || "Unknown error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    userRole,
    loading,
    error,
    signIn,
    logOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
