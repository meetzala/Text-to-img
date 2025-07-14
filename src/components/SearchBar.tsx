import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Upload, X, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface SearchBarProps {
  onSearch: (term: string) => void;
  onImageSearch?: (file: File) => void;
  placeholder?: string;
  initialValue?: string;
}

export default function SearchBar({
  onSearch,
  onImageSearch,
  placeholder = "Search by prompt...",
  initialValue = "",
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update searchTerm when initialValue changes
  useEffect(() => {
    if (initialValue !== undefined) {
      setSearchTerm(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setSearchFeedback(null);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSearch = async () => {
    if (selectedImage && onImageSearch) {
      try {
        setIsSearching(true);
        setSearchFeedback("Analyzing image...");

        // Call the image search function
        await onImageSearch(selectedImage);

        // Reset feedback after successful search
        setSearchFeedback(null);
      } catch (error) {
        console.error("Error during image search:", error);
        setSearchFeedback("Error analyzing image. Please try again.");
      } finally {
        setIsSearching(false);
      }
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setSearchFeedback(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="text" className="flex-1">
            Search by Text
          </TabsTrigger>
          <TabsTrigger value="image" className="flex-1">
            Search by Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="flex-1 border-2 border-black"
            />
            <Button type="submit" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="image">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="border-2 border-black flex-1"
                disabled={isSearching}
              />
              <Button
                onClick={handleImageSearch}
                disabled={!selectedImage || !onImageSearch || isSearching}
                className="flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isSearching ? "Analyzing..." : "Search"}
              </Button>
            </div>

            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Selected image"
                  className="max-h-40 border-2 border-black rounded-md"
                />
                <button
                  onClick={clearSelectedImage}
                  className="absolute top-1 right-1 bg-black text-white rounded-full p-1"
                  type="button"
                  disabled={isSearching}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {searchFeedback && (
              <p className="text-sm text-blue-600">{searchFeedback}</p>
            )}

            <p className="text-sm text-gray-500">
              Upload an image to find similar images based on AI-detected
              content
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
