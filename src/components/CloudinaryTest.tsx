"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CloudinaryTest() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleTestUpload = async () => {
    if (!file) {
      setErrorMessage("Please select a file to upload");
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage(null);
      setUploadedImageUrl(null);

      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;

          // Upload to Cloudinary via API route instead of direct upload
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageData: base64Image,
              folder: "cloudinary-test",
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to upload image");
          }

          const data = await response.json();
          const cloudinaryUrl = data.imageUrl;

          setUploadedImageUrl(cloudinaryUrl);
          setStatus("success");
        } catch (error: any) {
          console.error("Error in FileReader onload:", error);
          setStatus("error");
          setErrorMessage(`Error: ${error.message || "Unknown error"}`);
        }
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        setStatus("error");
        setErrorMessage("Error reading file. Please try again.");
      };
    } catch (error: any) {
      console.error("Cloudinary Test Error:", error);
      setStatus("error");
      setErrorMessage(`Error: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
      <h2 className="text-2xl font-bold mb-4">Cloudinary Upload Test</h2>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-black p-4 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="cloudinary-test-file"
          />
          <label
            htmlFor="cloudinary-test-file"
            className="cursor-pointer block p-4 hover:bg-gray-50"
          >
            {file ? (
              <div className="flex flex-col items-center">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Selected file"
                  className="w-32 h-32 object-cover mb-2 border-2 border-black"
                />
                <span className="text-sm">{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Click to select an image</span>
              </div>
            )}
          </label>
        </div>

        <Button
          onClick={handleTestUpload}
          disabled={status === "loading" || !file}
          className="w-full"
        >
          {status === "loading" ? "Uploading..." : "Test Cloudinary Upload"}
        </Button>

        {status === "success" && uploadedImageUrl && (
          <Alert className="bg-green-100 border-green-500">
            <AlertDescription>
              <p className="font-bold">Upload successful!</p>
              <div className="mt-2">
                <p className="mb-2">
                  <strong>Image URL:</strong> {uploadedImageUrl}
                </p>
                <img
                  src={uploadedImageUrl}
                  alt="Uploaded"
                  className="w-full h-auto border-2 border-black"
                />
              </div>
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
                    Make sure your Cloudinary credentials are correct in your
                    .env.local file
                  </li>
                  <li>Check that the image file is valid</li>
                  <li>Try with a smaller image file</li>
                  <li>
                    Check the browser console for more detailed error messages
                  </li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
