// We need to use a different approach for Cloudinary since it uses Node.js modules
// that aren't compatible with the browser

// For server-side operations
import { v2 as cloudinaryServer } from "cloudinary";

// Configure Cloudinary (server-side only)
if (typeof window === "undefined") {
  cloudinaryServer.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
  });
}

/**
 * Upload an image to Cloudinary (server-side only)
 * @param imageUrl - The image URL or base64 data URL to upload
 * @param folder - The folder to upload the image to
 * @returns The uploaded image URL
 */
export async function uploadImage(
  imageUrl: string,
  folder: string = "astra-images",
): Promise<string> {
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    throw new Error(
      "This function can only be used on the server side. Please use an API route to upload images.",
    );
  }

  // Check if Cloudinary is configured
  if (
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET ||
    !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  ) {
    throw new Error(
      "Cloudinary is not configured. Please add the required environment variables.",
    );
  }

  try {
    console.log("Uploading image to Cloudinary...");

    const uploadResult = await cloudinaryServer.uploader.upload(imageUrl, {
      folder,
      resource_type: "image",
      // Generate a unique public_id based on timestamp
      public_id: `image_${Date.now()}`,
      // Apply some basic transformations
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    console.log("Image uploaded successfully:", uploadResult.secure_url);
    return uploadResult.secure_url;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw error;
  }
}

/**
 * Generate an optimized image URL with transformations
 * This function can be used on both client and server
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  width?: number,
  height?: number,
): string {
  try {
    // Check if Cloudinary cloud name is configured
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      console.warn(
        "Cloudinary cloud name is not configured. Returning original URL.",
      );
      return imageUrl;
    }

    // Extract the public_id from the URL
    const urlParts = imageUrl.split("/");
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split(".")[0];

    // Create transformation URL manually (works in browser and server)
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    let transformationString = "f_auto,q_auto";

    if (width) transformationString += `,w_${width}`;
    if (height) transformationString += `,h_${height}`;

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}/${publicId}`;
  } catch (error) {
    console.error("Error generating optimized image URL:", error);
    return imageUrl; // Return original URL if there's an error
  }
}

// Only export the server-side cloudinary instance in server environments
export const cloudinary =
  typeof window === "undefined" ? cloudinaryServer : undefined;
