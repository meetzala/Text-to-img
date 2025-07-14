"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import ImageGallery from "@/components/ImageGallery";
import SearchBar from "@/components/SearchBar";
import {
  getAllImages,
  ImageData,
  searchImagesByPrompt,
} from "@/lib/firebase-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTopVotedImages } from "@/lib/firebase-service";
import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryPage() {
  const { user, loading } = useAuth();
  const [images, setImages] = useState<ImageData[]>([]);
  const [topImages, setTopImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ImageData[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const allImages = await getAllImages();
      setImages(allImages);

      const topVotedImages = await getTopVotedImages(10);
      setTopImages(topVotedImages);
    } catch (err) {
      console.error("Error fetching images:", err);
      setError("Failed to load images. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);

    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchImagesByPrompt(term);
      setSearchResults(results);
      setActiveTab("search");
    } catch (err) {
      console.error("Error searching images:", err);
      setError("Failed to search images. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Clear search results when switching away from search tab
    if (value !== "search") {
      setSearchTerm("");
      setSearchResults([]);
    }
  };

  const handleVoteChange = () => {
    // No longer need to refresh images after a vote
    // The ImageGallery component now handles votes locally
    // This function is kept for compatibility but doesn't do anything
    console.log("Vote changed - no refresh needed");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Image Gallery</h1>

        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search images by prompt..."
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="mb-8"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Images</TabsTrigger>
            <TabsTrigger value="top">Top Voted</TabsTrigger>
            <TabsTrigger value="search" disabled={!searchTerm}>
              Search Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
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
                images={images}
                title="All Images"
                currentUserId={user?.uid || null}
                showVoting={true}
                showDownload={true}
                onVoteChange={handleVoteChange}
              />
            )}
          </TabsContent>

          <TabsContent value="top" className="mt-6">
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
                images={topImages}
                title="Top Voted Images"
                currentUserId={user?.uid || null}
                showVoting={true}
                showDownload={true}
                onVoteChange={handleVoteChange}
              />
            )}
          </TabsContent>

          <TabsContent value="search" className="mt-6">
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
                images={searchResults}
                title={`Search Results for "${searchTerm}"`}
                currentUserId={user?.uid || null}
                showVoting={true}
                showDownload={true}
                onVoteChange={handleVoteChange}
              />
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8">
            <p>{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}
