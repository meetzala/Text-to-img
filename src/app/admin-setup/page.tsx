"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { setUserAsAdmin } from "@/lib/firebase-service";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminSetup() {
  const { user, userRole, loading } = useAuth();
  const [userId, setUserId] = useState<string>("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Debug effect to log auth state
  useEffect(() => {
    const info = `User: ${user ? "Logged in" : "Not logged in"}, Role: ${userRole}, Loading: ${loading}`;
    setDebugInfo(info);
    console.log("Auth state:", { user, userRole, loading });
  }, [user, userRole, loading]);

  const handleSetAdmin = async () => {
    if (!userId.trim()) {
      setStatus("error");
      setMessage("Please enter a user ID");
      return;
    }

    try {
      setStatus("loading");
      const success = await setUserAsAdmin(userId);

      if (success) {
        setStatus("success");
        setMessage(
          `User ${userId} has been set as admin successfully. Note: The user will need to log out and log back in for the changes to take effect.`,
        );
      } else {
        setStatus("error");
        setMessage("Failed to set user as admin. User might not exist.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred while setting the user as admin");
      console.error(error);
    }
  };

  const handleSetCurrentUserAsAdmin = async () => {
    if (!user) {
      setStatus("error");
      setMessage("You need to be logged in to perform this action");
      return;
    }

    try {
      setStatus("loading");
      const success = await setUserAsAdmin(user.uid);

      if (success) {
        setStatus("success");
        setMessage(
          `You (${user.displayName || user.email}) have been set as admin successfully. Please log out and log back in for the changes to take effect.`,
        );
      } else {
        setStatus("error");
        setMessage("Failed to set you as admin. Please try again.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred while setting you as admin");
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 border-b-4 border-black pb-2 inline-block">
          Admin Setup
        </h1>

        {debugInfo && (
          <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded">
            <h2 className="font-bold mb-2">Debug Information</h2>
            <p>{debugInfo}</p>
          </div>
        )}

        <div className="max-w-md mx-auto">
          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Set User as Admin</h2>

              {status === "success" && (
                <Alert className="mb-4 bg-green-100 border-green-500">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              {status === "error" && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium">User ID</label>
                  <Input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter user ID"
                    className="border-2 border-black"
                  />
                </div>

                <Button
                  onClick={handleSetAdmin}
                  disabled={status === "loading"}
                  className="w-full"
                >
                  {status === "loading" ? "Setting..." : "Set as Admin"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <Button
                  onClick={handleSetCurrentUserAsAdmin}
                  disabled={status === "loading" || !user}
                  className="w-full"
                >
                  {status === "loading"
                    ? "Setting..."
                    : "Set Yourself as Admin"}
                </Button>

                {user && (
                  <p className="text-sm text-gray-500">
                    Your user ID: <span className="font-mono">{user.uid}</span>
                  </p>
                )}

                {!user && (
                  <p className="text-sm text-red-500">
                    You need to be logged in to set yourself as admin
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
