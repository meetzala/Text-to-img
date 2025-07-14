"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import ImageGallery from "@/components/ImageGallery";
import SearchBar from "@/components/SearchBar";
import ImageVersionHistory from "@/components/ImageVersionHistory";
import {
  getAllImages,
  ImageData,
  searchImagesByPrompt,
  searchImagesBySimilarity,
  getDesignerDetails,
  UserData,
} from "@/lib/firebase-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
  const { user, userRole, loading, logOut } = useAuth();
  const router = useRouter();
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<"text" | "image">("text");
  const [designerFilter, setDesignerFilter] = useState<string | null>(null);
  const [designers, setDesigners] = useState<
    { id: string; name: string; email: string; imageCount: number }[]
  >([]);
  const [selectedDesigner, setSelectedDesigner] = useState<UserData | null>(
    null,
  );
  const [isDesignerModalOpen, setIsDesignerModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [selectedVersionImageId, setSelectedVersionImageId] = useState<
    string | null
  >(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only redirect if not loading and we haven't already redirected
    if (!loading && !hasRedirected) {
      if (!user) {
        console.log("Redirecting: No user logged in");
        setHasRedirected(true);
        router.push("/dashboard");
      } else if (userRole !== "admin") {
        console.log("Redirecting: User is not admin, role is", userRole);
        setHasRedirected(true);
        router.push("/dashboard");
      }
    }
  }, [user, userRole, loading, router, hasRedirected]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!user || userRole !== "admin") return;

      try {
        setIsLoading(true);
        const allImages = await getAllImages();
        setImages(allImages);
        setFilteredImages(allImages);

        // Extract unique designers
        const designerMap = new Map<
          string,
          { name: string; email: string; imageCount: number }
        >();

        allImages.forEach((image) => {
          if (!designerMap.has(image.userId)) {
            designerMap.set(image.userId, {
              name: image.userName,
              email: image.userEmail,
              imageCount: 1,
            });
          } else {
            const designer = designerMap.get(image.userId)!;
            designer.imageCount++;
            designerMap.set(image.userId, designer);
          }
        });

        const designerList = Array.from(designerMap.entries()).map(
          ([id, data]) => ({
            id,
            ...data,
          }),
        );

        setDesigners(designerList);
      } catch (error) {
        console.error("Error fetching images:", error);
        setError("Failed to load images. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && userRole === "admin") {
      fetchImages();
    }
  }, [user, userRole]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setSearchMode("text");

    if (!term.trim()) {
      // If designer filter is active, apply only that filter
      if (designerFilter) {
        const filtered = images.filter(
          (image) => image.userId === designerFilter,
        );
        setFilteredImages(filtered);
      } else {
        setFilteredImages(images);
      }
      return;
    }

    try {
      // Search by prompt
      const searchResults = await searchImagesByPrompt(term);

      // Apply designer filter if active
      if (designerFilter) {
        const filtered = searchResults.filter(
          (image) => image.userId === designerFilter,
        );
        setFilteredImages(filtered);
      } else {
        setFilteredImages(searchResults);
      }
    } catch (error) {
      console.error("Error searching images:", error);
      setError("Failed to search images. Please try again.");
    }
  };

  const handleImageSearch = async (file: File) => {
    setSearchTerm("");
    setSearchMode("image");
    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      // Search by image similarity
      const searchResults = await searchImagesBySimilarity(file);

      // Apply designer filter if active
      if (designerFilter) {
        const filtered = searchResults.filter(
          (image) => image.userId === designerFilter,
        );
        setFilteredImages(filtered);
      } else {
        setFilteredImages(searchResults);
      }

      // If no results found, show a message
      if (searchResults.length === 0) {
        setError(
          "No similar images found. Try a different image or search term.",
        );
      }
    } catch (error) {
      console.error("Error searching images by similarity:", error);
      setError("Failed to search images by similarity. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDesignerFilter = (designerId: string | null) => {
    setDesignerFilter(designerId);

    if (!designerId) {
      // Clear filter
      if (searchTerm) {
        // Re-apply search if there's a search term
        handleSearch(searchTerm);
      } else {
        setFilteredImages(images);
      }
    } else {
      // Apply filter
      const filtered = searchTerm
        ? filteredImages.filter((image) => image.userId === designerId)
        : images.filter((image) => image.userId === designerId);

      setFilteredImages(filtered);
    }
  };

  const viewDesignerDetails = async (designerId: string) => {
    try {
      const designerData = await getDesignerDetails(designerId);
      setSelectedDesigner(designerData);
      setIsDesignerModalOpen(true);
    } catch (error) {
      console.error("Error fetching designer details:", error);
      setError("Failed to load designer details. Please try again.");
    }
  };

  const handleTabChange = (value: string) => {
    // Reset filters when changing tabs
    setSearchTerm("");
    setDesignerFilter(null);
    setFilteredImages(images);
  };

  const handleViewVersions = (imageId: string) => {
    setSelectedVersionImageId(imageId);
    setIsVersionHistoryOpen(true);
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

  const handleImageDeleted = async (imageId: string) => {
    // Refresh the images list after deletion
    try {
      const allImages = await getAllImages();
      setImages(allImages);

      // Apply current filters
      if (searchTerm) {
        handleSearch(searchTerm);
      } else if (designerFilter) {
        handleDesignerFilter(designerFilter);
      } else {
        setFilteredImages(allImages);
      }

      // Show success message
      setError(null);
    } catch (error) {
      console.error("Error refreshing images after deletion:", error);
      setError(
        "Image was deleted, but there was an error refreshing the list.",
      );
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8">
            Loading Admin Dashboard...
          </h1>
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-10 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user || userRole !== "admin") {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8">Access Denied</h1>
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              You do not have permission to access the admin dashboard.
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-4"></div>
        </div>

        <Tabs
          defaultValue="images"
          className="mb-8"
          onValueChange={handleTabChange}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="designers">Designers</TabsTrigger>
          </TabsList>

          <TabsContent value="images">
            <div className="mb-6">
              <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Search Images</h2>
                  <SearchBar
                    onSearch={handleSearch}
                    onImageSearch={handleImageSearch}
                  />

                  {designerFilter && (
                    <div className="mt-4 flex items-center gap-2">
                      <p className="text-sm">Filtered by designer:</p>
                      <Badge className="px-2 py-1">
                        {designers.find((d) => d.id === designerFilter)?.name ||
                          "Unknown"}
                      </Badge>
                      <Button
                        variant="neutral"
                        size="sm"
                        onClick={() => handleDesignerFilter(null)}
                      >
                        Clear Filter
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <Skeleton key={index} className="h-64 w-full" />
                ))}
              </div>
            ) : (
              <ImageGallery
                images={filteredImages}
                title={
                  searchMode === "text"
                    ? searchTerm
                      ? `Search Results for "${searchTerm}"`
                      : "All Images"
                    : "Similar Image Search Results"
                }
                currentUserId={user.uid}
                showVoting={true}
                showDownload={true}
                showVersions={true}
                showDelete={true}
                onViewVersions={handleViewVersions}
                onImageDeleted={handleImageDeleted}
              />
            )}
          </TabsContent>

          <TabsContent value="designers">
            <h2 className="text-2xl font-bold mb-4">Designers</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {designers.map((designer) => (
                <Card
                  key={designer.id}
                  className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer"
                  onClick={() => viewDesignerDetails(designer.id)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold truncate">
                          {designer.name}
                        </h3>
                        <p className="text-gray-500 text-sm truncate">
                          {designer.email}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="default" className="px-2 py-1">
                          {designer.imageCount}{" "}
                          {designer.imageCount === 1 ? "image" : "images"}
                        </Badge>
                        <Button
                          variant="noShadow"
                          size="sm"
                          className="ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewDesignerDetails(designer.id);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Designer Modal */}
      {selectedDesigner && (
        <Dialog
          open={isDesignerModalOpen}
          onOpenChange={setIsDesignerModalOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Designer Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold">Name</h3>
                <p>{selectedDesigner.displayName || "Not provided"}</p>
              </div>
              <div>
                <h3 className="font-bold">Email</h3>
                <p>{selectedDesigner.email || "Not provided"}</p>
              </div>
              <div>
                <h3 className="font-bold">Role</h3>
                <Badge>{selectedDesigner.role}</Badge>
              </div>
              <div className="pt-4">
                <Button
                  onClick={() => {
                    setIsDesignerModalOpen(false);
                    handleDesignerFilter(selectedDesigner.uid);
                  }}
                  className="w-full"
                >
                  View Designer's Images
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
              onReprompt={() => {
                // Admin can't reprompt, just close the dialog
                setIsVersionHistoryOpen(false);
              }}
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
