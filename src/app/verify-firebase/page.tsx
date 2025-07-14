"use client";

import { useState, useEffect } from "react";
import { verifyFirebaseConfig } from "@/lib/verify-firebase";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import FirebaseTest from "@/components/FirebaseTest";
import CloudinaryTest from "@/components/CloudinaryTest";

export default function VerifyFirebase() {
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async () => {
    try {
      setVerificationStatus("loading");
      setErrorMessage(null);

      const isVerified = await verifyFirebaseConfig();

      if (isVerified) {
        setVerificationStatus("success");
      } else {
        setVerificationStatus("error");
        setErrorMessage(
          "Firebase configuration verification failed. Check the console for details.",
        );
      }
    } catch (error: any) {
      console.error("Error during verification:", error);
      setVerificationStatus("error");
      setErrorMessage(
        `Verification error: ${error.message || "Unknown error"}`,
      );
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-4 py-12">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-8 border-b-4 border-black pb-2 inline-block">
          Configuration Verification
        </h1>

        <div className="space-y-8">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            <h2 className="text-2xl font-bold mb-4">
              Step 1: Verify Firebase Configuration
            </h2>

            <p className="mb-6">
              This step checks if your Firebase configuration is correctly
              initialized. Click the button below to verify.
            </p>

            <div className="space-y-4">
              <Button
                onClick={handleVerify}
                disabled={verificationStatus === "loading"}
                className="w-full"
              >
                {verificationStatus === "loading"
                  ? "Verifying..."
                  : "Verify Firebase Configuration"}
              </Button>

              {verificationStatus === "success" && (
                <Alert className="bg-green-100 border-green-500">
                  <AlertDescription>
                    Firebase configuration verified successfully! You can now
                    proceed to the next step.
                  </AlertDescription>
                </Alert>
              )}

              {verificationStatus === "error" && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {errorMessage || "An error occurred during verification."}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            <h2 className="text-2xl font-bold mb-4">
              Step 2: Test Firebase Authentication
            </h2>

            <p className="mb-6">
              This step tests if Google Authentication is properly configured in
              your Firebase project.
            </p>

            <FirebaseTest />
          </div>

          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            <h2 className="text-2xl font-bold mb-4">
              Step 3: Test Cloudinary Upload
            </h2>

            <p className="mb-6">
              This step tests if Cloudinary is properly configured for image
              uploads.
            </p>

            <CloudinaryTest />
          </div>

          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            <h2 className="text-2xl font-bold mb-4">Setup Guides</h2>

            <p className="mb-4">
              If you're experiencing issues, follow these guides to properly set
              up your services:
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  Firebase Authentication
                </h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Go to the{" "}
                    <a
                      href="https://console.firebase.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Firebase Console
                    </a>
                  </li>
                  <li>Make sure your project is properly set up</li>
                  <li>
                    Enable Google Authentication in the Authentication section
                  </li>
                  <li>
                    Add "localhost" to the authorized domains list in
                    Authentication settings
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-2">Cloudinary Setup</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Go to the{" "}
                    <a
                      href="https://cloudinary.com/console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Cloudinary Console
                    </a>
                  </li>
                  <li>Verify your API Key, API Secret, and Cloud Name</li>
                  <li>Make sure your account has enough credits for uploads</li>
                </ol>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-black mt-6">
              <Link href="/" className="text-blue-600 hover:underline">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
