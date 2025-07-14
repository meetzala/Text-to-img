"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import { getDesignerRankings } from "@/lib/firebase-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Image, Trophy, Medal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DesignerRanking {
  userId: string;
  displayName: string;
  email: string;
  totalVotes: number;
  imageCount: number;
}

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const [designers, setDesigners] = useState<DesignerRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDesignerRankings = async () => {
      setIsLoading(true);
      try {
        const rankings = await getDesignerRankings();
        setDesigners(rankings);
      } catch (err) {
        console.error("Error fetching designer rankings:", err);
        setError("Failed to load leaderboard. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch rankings when the component mounts
    fetchDesignerRankings();

    // No dependencies array means this only runs once when the component mounts
  }, []);

  // Function to get trophy icon based on rank
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Trophy className="h-6 w-6 text-amber-700" />;
      default:
        return <Medal className="h-6 w-6 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Designer Leaderboard
        </h1>

        {isLoading ? (
          <div className="grid gap-6">
            {[...Array(5)].map((_, index) => (
              <Card
                key={index}
                className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="flex flex-col items-center">
                        <Skeleton className="h-6 w-16 mb-1" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <div className="flex flex-col items-center">
                        <Skeleton className="h-6 w-16 mb-1" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <div className="flex flex-col items-center">
                        <Skeleton className="h-6 w-16 mb-1" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8">
            <p>{error}</p>
          </div>
        ) : designers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No designers have received votes yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {designers.map((designer, index) => (
              <Card
                key={designer.userId}
                className={`border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow ${
                  index === 0
                    ? "bg-yellow-50"
                    : index === 1
                      ? "bg-gray-50"
                      : index === 2
                        ? "bg-amber-50"
                        : "bg-white"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-black">
                        {getRankIcon(index)}
                      </div>

                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          {designer.displayName}
                          {user?.uid === designer.userId && (
                            <Badge variant="outline" className="ml-2">
                              You
                            </Badge>
                          )}
                        </h3>
                        <p className="text-gray-500">{designer.email}</p>
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-lg font-bold">
                          <Heart className="h-5 w-5 text-pink-500" />
                          <span>{designer.totalVotes}</span>
                        </div>
                        <p className="text-xs text-gray-500">Total Votes</p>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-lg font-bold">
                          <Image className="h-5 w-5 text-blue-500" />
                          <span>{designer.imageCount}</span>
                        </div>
                        <p className="text-xs text-gray-500">Images</p>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="text-lg font-bold">
                          {designer.imageCount > 0
                            ? (
                                designer.totalVotes / designer.imageCount
                              ).toFixed(1)
                            : "0.0"}
                        </div>
                        <p className="text-xs text-gray-500">Avg. Votes</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
