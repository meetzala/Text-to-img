import { useState, useEffect } from "react";
import {
  ImageData,
  getImageVersions,
  getImageAncestors,
} from "@/lib/firebase-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History, GitBranch, ArrowRight } from "lucide-react";

interface ImageVersionHistoryProps {
  imageId: string;
  onReprompt: (imageData: ImageData) => void;
}

export default function ImageVersionHistory({
  imageId,
  onReprompt,
}: ImageVersionHistoryProps) {
  const [versions, setVersions] = useState<ImageData[]>([]);
  const [ancestors, setAncestors] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"versions" | "history">(
    "versions",
  );

  useEffect(() => {
    const fetchVersions = async () => {
      if (!imageId) return;

      try {
        setLoading(true);

        // Get all versions of this image
        const imageVersions = await getImageVersions(imageId);
        setVersions(imageVersions);

        // Get the ancestry (version history) of this image
        const imageAncestors = await getImageAncestors(imageId);
        setAncestors(imageAncestors);
      } catch (error) {
        console.error("Error fetching image versions:", error);
        setError("Failed to load image versions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [imageId]);

  const handleReprompt = (image: ImageData) => {
    onReprompt(image);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex space-x-4 mb-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const displayedItems = activeTab === "versions" ? versions : ancestors;

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex space-x-4 mb-4">
        <Button
          variant={activeTab === "versions" ? "default" : "neutral"}
          onClick={() => setActiveTab("versions")}
          className="flex items-center gap-2"
        >
          <GitBranch className="h-4 w-4" />
          <span>Versions ({versions.length})</span>
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "neutral"}
          onClick={() => setActiveTab("history")}
          className="flex items-center gap-2"
        >
          <History className="h-4 w-4" />
          <span>History ({ancestors.length})</span>
        </Button>
      </div>

      {displayedItems.length === 0 ? (
        <p className="text-gray-500">
          {activeTab === "versions"
            ? "No other versions found for this image."
            : "No version history found for this image."}
        </p>
      ) : (
        <div className="space-y-4">
          {displayedItems.map((item) => (
            <Card
              key={item.id}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 shrink-0 border border-black">
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge>v{item.version || 1}</Badge>
                      {item.isLatestVersion && <Badge>Latest</Badge>}
                    </div>
                    <p className="text-sm line-clamp-2 mb-2">{item.prompt}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {item.createdAt?.toDate().toLocaleString() ||
                          "Unknown date"}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleReprompt(item)}
                        className="flex items-center gap-1"
                      >
                        <span>Reprompt</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
