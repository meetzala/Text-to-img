import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ImageData,
  voteForImage,
  hasUserVotedForImage,
  deleteImage,
} from "@/lib/firebase-service";
import { Heart, Download, History, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-context";

interface ImageGalleryProps {
  images: ImageData[];
  title: string;
  currentUserId?: string | null;
  showVoting?: boolean;
  showDownload?: boolean;
  showVersions?: boolean;
  showDelete?: boolean;
  onVoteChange?: () => void;
  onViewVersions?: (imageId: string) => void;
  onImageDeleted?: (imageId: string) => void;
}

export default function ImageGallery({
  images,
  title,
  currentUserId = null,
  showVoting = false,
  showDownload = false,
  showVersions = false,
  showDelete = false,
  onVoteChange,
  onViewVersions,
  onImageDeleted,
}: ImageGalleryProps) {
  const { loading, signIn } = useAuth();
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [votedImages, setVotedImages] = useState<Record<string, boolean>>({});
  const [isVoting, setIsVoting] = useState<Record<string, boolean>>({});
  const [localImages, setLocalImages] = useState<ImageData[]>(images);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  // Update local images when the prop changes
  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  // Check which images the current user has voted for
  useEffect(() => {
    const checkVotedImages = async () => {
      if (!currentUserId || !showVoting) return;

      const votedStatus: Record<string, boolean> = {};

      for (const image of localImages) {
        if (image.id) {
          const hasVoted = await hasUserVotedForImage(image.id, currentUserId);
          votedStatus[image.id] = hasVoted;
        }
      }

      setVotedImages(votedStatus);
    };

    checkVotedImages();
  }, [localImages, currentUserId, showVoting]);

  const handleVote = async (imageId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!imageId) return;
    if(!currentUserId) await signIn();

    // Prevent double-clicking
    if (isVoting[imageId]) return;

    setIsVoting((prev) => ({ ...prev, [imageId]: true }));

    try {
      // Update local state immediately for better UX
      const isCurrentlyVoted = votedImages[imageId] || false;
      const newVotedState = !isCurrentlyVoted;

      // Update local votedImages state
      setVotedImages((prev) => ({
        ...prev,
        [imageId]: newVotedState,
      }));

      // Update local image vote count
      const updatedImages = localImages.map((img) => {
        if (img.id === imageId) {
          const currentVotes = img.votes || 0;
          return {
            ...img,
            votes: newVotedState ? currentVotes + 1 : currentVotes - 1,
          };
        }
        return img;
      });

      // Update the local images state
      setLocalImages(updatedImages);

      // Update selected image if it's the one being voted on
      if (selectedImage && selectedImage.id === imageId) {
        const currentVotes = selectedImage.votes || 0;
        setSelectedImage({
          ...selectedImage,
          votes: newVotedState ? currentVotes + 1 : currentVotes - 1,
        });
      }

      // Fire and forget - don't wait for this to complete
      voteForImage(imageId, currentUserId).catch((error) => {
        console.error("Error voting for image:", error);
        // Revert local state if the API call fails
        setVotedImages((prev) => ({
          ...prev,
          [imageId]: isCurrentlyVoted,
        }));

        // Revert local images state
        setLocalImages(localImages);

        // Revert selected image if needed
        if (selectedImage && selectedImage.id === imageId) {
          setSelectedImage(selectedImage);
        }
      });

      // Don't call onVoteChange to avoid triggering a reload
      // if (onVoteChange) {
      //   onVoteChange();
      // }
    } catch (error) {
      console.error("Error voting for image:", error);
    } finally {
      setIsVoting((prev) => ({ ...prev, [imageId]: false }));
    }
  };

  const handleDownload = async (
    imageUrl: string,
    prompt: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();

    try {
      // Create a temporary anchor element
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `astra-${prompt.substring(0, 20).replace(/\s+/g, "-")}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const handleDelete = async (imageId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!imageId) return;

    // Prevent double-clicking
    if (isDeleting[imageId]) return;

    setImageToDelete(imageId);
  };

  const confirmDelete = async () => {
    const imageId = imageToDelete;
    if (!imageId) return;

    setIsDeleting((prev) => ({ ...prev, [imageId]: true }));

    try {
      const success = await deleteImage(imageId);

      if (success) {
        // Remove the image from local state
        const updatedImages = localImages.filter((img) => img.id !== imageId);
        setLocalImages(updatedImages);

        // Close the selected image if it's the one being deleted
        if (selectedImage && selectedImage.id === imageId) {
          setSelectedImage(null);
        }

        // Notify parent component
        if (onImageDeleted) {
          onImageDeleted(imageId);
        }
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    } finally {
      setIsDeleting((prev) => ({ ...prev, [imageId]: false }));
      setImageToDelete(null);
    }
  };

  const cancelDelete = () => {
    setImageToDelete(null);
  };

  if (localImages.length === 0) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500">No images found.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {localImages.map((image) => (
          <Card
            key={image.id}
            className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer relative"
            onClick={() => setSelectedImage(image)}
          >
            <CardContent className="p-4">
              <div className="aspect-square overflow-hidden border-2 border-black mb-4 relative">
                <img
                  src={image.imageUrl}
                  alt={image.prompt}
                  className="w-full h-full object-cover"
                />
                {showVersions && image.version && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white text-black">
                      v{image.version}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="font-medium line-clamp-1">{image.prompt}</p>
                  <p className="text-sm text-gray-500">By {image.userName}</p>
                </div>
                <div className="flex items-center gap-1">
                  {showVoting && image.id && (
                    <Button
                      variant="noShadow"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={(e) => handleVote(image.id!, e)}
                      disabled={isVoting[image.id!]}
                    >
                      <Heart
                        className={`h-4 w-4 ${votedImages[image.id] ? "fill-pink-500 text-pink-500" : ""}`}
                      />
                      <span>{image.votes || 0}</span>
                    </Button>
                  )}

                  {showDownload && (
                    <Button
                      variant="noShadow"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={(e) =>
                        handleDownload(image.imageUrl, image.prompt, e)
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}

                  {showVersions && image.id && (
                    <Button
                      variant="neutral"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewVersions) onViewVersions(image.id!);
                      }}
                    >
                      <History className="h-4 w-4" />
                      <span>Versions</span>
                    </Button>
                  )}

                  {showDelete && image.id && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center gap-1 bg-red-500 hover:bg-red-600 ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.id!, e);
                      }}
                      disabled={isDeleting[image.id!]}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white p-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{selectedImage.userName}</h3>
                <p className="text-gray-500">{selectedImage.userEmail}</p>
                {showVersions && selectedImage.version && (
                  <Badge className="mt-2 bg-white text-black">
                    Version {selectedImage.version}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {showVoting && selectedImage.id && (
                  <Button
                    variant="noShadow"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={(e) => handleVote(selectedImage.id!, e)}
                    disabled={isVoting[selectedImage.id!]}
                  >
                    <Heart
                      className={`h-4 w-4 ${votedImages[selectedImage.id] ? "fill-pink-500 text-pink-500" : ""}`}
                    />
                    <span>{selectedImage.votes || 0}</span>
                  </Button>
                )}

                {showDownload && (
                  <Button
                    variant="noShadow"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={(e) =>
                      handleDownload(
                        selectedImage.imageUrl,
                        selectedImage.prompt,
                        e,
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}

                {showVersions && selectedImage.id && (
                  <Button
                    variant="neutral"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewVersions) onViewVersions(selectedImage.id!);
                    }}
                  >
                    <History className="h-4 w-4" />
                    <span>Versions</span>
                  </Button>
                )}

                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-2xl font-bold hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="border-4 border-black mb-4">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.prompt}
                className="w-full h-auto"
              />
            </div>

            <div>
              <h4 className="font-bold mb-1">Prompt:</h4>
              <p>{selectedImage.prompt}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!imageToDelete}
        onOpenChange={(open) => !open && setImageToDelete(null)}
      >
        <AlertDialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">
              Are you sure you want to delete this image?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This action cannot be undone. This will permanently delete the
              image from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-4">
            <AlertDialogCancel
              onClick={cancelDelete}
              className="border-2 border-black"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 border-2 border-black text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
