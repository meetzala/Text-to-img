"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import ImageGenerator from "@/components/ImageGenerator";
import ImageGallery from "@/components/ImageGallery";
import ImageVersionHistory from "@/components/ImageVersionHistory";
import SearchBar from "@/components/SearchBar";
import {
  getUserImages,
  ImageData,
  searchImagesByPrompt,
  searchImagesBySimilarity,
} from "@/lib/firebase-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user, loading, logOut } = useAuth();
  const router = useRouter();
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<"text" | "image">("text");
  const [selectedImageForReprompt, setSelectedImageForReprompt] =
    useState<ImageData | null>(null);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [selectedVersionImageId, setSelectedVersionImageId] = useState<
    string | null
  >(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const userImages = await getUserImages(user.uid);
        setImages(userImages);
        setFilteredImages(userImages);
      } catch (error) {
        console.error("Error fetching images:", error);
        setError("Failed to load images. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchImages();
    }
  }, [user]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setSearchMode("text");

    if (!term.trim()) {
      setFilteredImages(images);
      return;
    }

    try {
      // For user dashboard, we filter locally from already fetched images
      const lowerTerm = term.toLowerCase();
      const filtered = images.filter((image) =>
        image.prompt.toLowerCase().includes(lowerTerm),
      );
      setFilteredImages(filtered);
    } catch (error) {
      console.error("Error searching images:", error);
      setError("Failed to search images. Please try again.");
    }
  };

  const handleImageSearch = async (file: File) => {
    if (!user) return;

    setSearchTerm("");
    setSearchMode("image");
    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      // Search by image similarity
      const allSimilarImages = await searchImagesBySimilarity(file);

      // Filter to only show the user's images
      const userSimilarImages = allSimilarImages.filter(
        (image) => image.userId === user.uid,
      );
      setFilteredImages(userSimilarImages);

      // If no results found, show a message
      if (userSimilarImages.length === 0) {
        setError(
          "No similar images found in your collection. Try a different image or search term.",
        );
      }
    } catch (error) {
      console.error("Error searching images by similarity:", error);
      setError("Failed to search images by similarity. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewVersions = (imageId: string) => {
    setSelectedVersionImageId(imageId);
    setIsVersionHistoryOpen(true);
  };

  const handleReprompt = (image: ImageData) => {
    setSelectedImageForReprompt(image);
    setIsVersionHistoryOpen(false);
  };

  const handleClearSourceImage = () => {
    setSelectedImageForReprompt(null);
  };

  const refreshImages = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userImages = await getUserImages(user.uid);
      setImages(userImages);
      setFilteredImages(userImages);
    } catch (error) {
      console.error("Error refreshing images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-12">
          <Skeleton className="h-10 w-64 mb-8" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-40 w-full mb-4" />
              <Skeleton className="h-10 w-32 mx-auto" />
            </div>

            <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-10 w-full mb-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4"
              >
                <Skeleton className="aspect-square w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Designer Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <ImageGenerator
            sourceImage={selectedImageForReprompt}
            onClearSourceImage={handleClearSourceImage}
          />

          <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            <h2 className="text-2xl font-bold mb-4">Search Your Images</h2>
            <SearchBar
              onSearch={handleSearch}
              onImageSearch={handleImageSearch}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4"
              >
                <Skeleton className="aspect-square w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <ImageGallery
            images={filteredImages}
            title={
              searchMode === "text"
                ? searchTerm
                  ? `Search Results for "${searchTerm}"`
                  : "Your Images"
                : "Similar Image Search Results"
            }
            currentUserId={user.uid}
            showDownload={true}
            showVersions={true}
            onViewVersions={handleViewVersions}
          />
        )}
      </div>

      {/* Version History Dialog */}
      <Dialog
        open={isVersionHistoryOpen}
        onOpenChange={setIsVersionHistoryOpen}
      >
        <DialogContent className="max-w-3xl bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Image Version History
            </DialogTitle>
          </DialogHeader>
          {selectedVersionImageId && (
            <ImageVersionHistory
              imageId={selectedVersionImageId}
              onReprompt={handleReprompt}
            />
          )}
        </DialogContent>
      </Dialog>

      <footer className="bg-black text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>
            &copy; {new Date().getFullYear()} Astra Labs. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
