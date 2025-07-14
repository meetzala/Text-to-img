import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
// Remove NextAuth imports as we're using Firebase
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Firebase authentication is handled client-side
    // No need for server-side session check here

    // Get the request body
    const body = await request.json();
    const { imageData, folder } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: "No image data provided" },
        { status: 400 },
      );
    }

    // Upload the image to Cloudinary (server-side)
    const imageUrl = await uploadImage(imageData, folder || "astra-images");

    // Return the image URL
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image", details: (error as Error).message },
      { status: 500 },
    );
  }
}
