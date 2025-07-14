import { NextRequest, NextResponse } from "next/server";

// Simple mock AI image analysis function
// In a real app, you would use a service like Google Cloud Vision, Azure Computer Vision, or similar
const analyzeImage = async (imageBase64: string): Promise<string[]> => {
  // This is a mock function that simulates AI image analysis
  // In a real implementation, you would call an AI service API

  // For demo purposes, we'll return random keywords based on the image hash
  // This creates a deterministic but random-seeming result
  const hash = imageBase64.length.toString() + imageBase64.substring(0, 20);
  const hashCode = Array.from(hash).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );

  // List of potential keywords
  const keywords = [
    "landscape",
    "portrait",
    "abstract",
    "nature",
    "urban",
    "people",
    "architecture",
    "animals",
    "food",
    "technology",
    "art",
    "beach",
    "mountain",
    "forest",
    "city",
    "night",
    "sunset",
    "water",
    "flowers",
    "vintage",
    "black and white",
    "colorful",
    "minimal",
    "texture",
  ];

  // Select 1-3 keywords based on the hash
  const numKeywords = (hashCode % 3) + 1;
  const selectedKeywords = [];

  for (let i = 0; i < numKeywords; i++) {
    const index = (hashCode + i * 7) % keywords.length;
    selectedKeywords.push(keywords[index]);
  }

  return selectedKeywords;
};

export async function POST(request: NextRequest) {
  try {
    // Get the image data from the request
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert the image to base64
    const buffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");

    // Analyze the image
    const keywords = await analyzeImage(base64Image);

    // Return the keywords
    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 },
    );
  }
}
