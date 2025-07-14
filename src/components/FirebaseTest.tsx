"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function FirebaseTest() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authDetails, setAuthDetails] = useState<any>(null);

  const handleTestAuth = async () => {
    try {
      setStatus("loading");
      setErrorMessage(null);
      setAuthDetails(null);

      // Test direct sign-in with popup
      const result = await signInWithPopup(auth, googleProvider);

      // If successful, show the user info
      setAuthDetails({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });

      setStatus("success");
    } catch (error: any) {
      console.error("Firebase Test Error:", error);
      setStatus("error");
      setErrorMessage(`Error: ${error.code} - ${error.message}`);

      // Log detailed error information
      if (error.code === "auth/configuration-not-found") {
        console.error(
          "Firebase Auth Configuration Error: Make sure Google Auth is enabled in your Firebase project",
        );
      }
    }
  };

  return (
    <div className="p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
      <h2 className="text-2xl font-bold mb-4">Firebase Authentication Test</h2>

      <div className="space-y-4">
        <Button
          onClick={handleTestAuth}
          disabled={status === "loading"}
          className="w-full"
        >
          {status === "loading" ? "Testing..." : "Test Google Authentication"}
        </Button>

        {status === "success" && (
          <Alert className="bg-green-100 border-green-500">
            <AlertDescription>
              <p className="font-bold">Authentication successful!</p>
              {authDetails && (
                <div className="mt-2">
                  <p>
                    <strong>User ID:</strong> {authDetails.uid}
                  </p>
                  <p>
                    <strong>Email:</strong> {authDetails.email}
                  </p>
                  <p>
                    <strong>Name:</strong> {authDetails.displayName}
                  </p>
                  {authDetails.photoURL && (
                    <img
                      src={authDetails.photoURL}
                      alt="Profile"
                      className="w-10 h-10 rounded-full mt-2 border-2 border-black"
                    />
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertDescription>
              {errorMessage || "An unknown error occurred"}
              <div className="mt-2">
                <p className="font-bold">Troubleshooting:</p>
                <ul className="list-disc pl-5">
                  <li>
                    Make sure Google authentication is enabled in your Firebase
                    project
                  </li>
                  <li>Verify that your Firebase configuration is correct</li>
                  <li>
                    Check that "localhost" is in the authorized domains list in
                    Firebase Authentication settings
                  </li>
                  <li>Try clearing your browser cache and cookies</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
