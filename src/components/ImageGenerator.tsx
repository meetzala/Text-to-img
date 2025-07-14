import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateImage } from "@/lib/openai";
import { saveGeneratedImage, ImageData } from "@/lib/firebase-service";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ImageGeneratorProps {
  sourceImage?: ImageData | null;
  onClearSourceImage?: () => void;
}

export default function ImageGenerator({
  sourceImage,
  onClearSourceImage,
}: ImageGeneratorProps) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Set the prompt from the source image if provided
  useEffect(() => {
    if (sourceImage) {
      setPrompt(sourceImage.prompt);
    }
  }, [sourceImage]);

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (!user) {
      setError("You must be signed in to generate images");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const imageUrl = await generateImage(prompt);
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error("Error generating image:", error);
      setError("Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImage = async () => {
    if (!generatedImage || !user) return;

    try {
      setLoading(true);
      // Pass the sourceImage.id as parentId if reprompting
      const parentId = sourceImage?.id || null;
      await saveGeneratedImage(prompt, generatedImage, user, parentId);
      setSuccess("Image saved successfully!");
    } catch (error) {
      console.error("Error saving image:", error);
      setError("Failed to save image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSourceImage = () => {
    if (onClearSourceImage) {
      onClearSourceImage();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Generate Image</h2>
            {sourceImage && (
              <div className="flex items-center gap-2">
                <Badge>Reprompting v{sourceImage.version || 1}</Badge>
                <Button
                  variant="noShadow"
                  size="sm"
                  onClick={handleClearSourceImage}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {sourceImage && (
            <div className="mb-4 flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 border border-black">
                <img
                  src={sourceImage.imageUrl}
                  alt={sourceImage.prompt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Based on:</p>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {sourceImage.prompt}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleGenerateImage} className="space-y-4">
            <div>
              <label
                htmlFor="prompt"
                className="block text-sm font-medium mb-1"
              >
                Enter your prompt
              </label>
              <Input
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic city with flying cars and neon lights"
                className="border-2 border-black"
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Generating..." : "Generate Image"}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 bg-green-100 border-green-500">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {generatedImage && (
            <div className="mt-6 space-y-4">
              <div className="border-4 border-black p-2 bg-white">
                <img
                  src={generatedImage}
                  alt={prompt}
                  className="w-full h-auto"
                />
              </div>

              <Button
                onClick={handleSaveImage}
                className="w-full"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : sourceImage
                    ? "Save New Version"
                    : "Save Image"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
