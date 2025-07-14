import OpenAI from "openai";

// Check if we're in a browser environment
const isServer = typeof window === "undefined";

// Initialize OpenAI with environment variables
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
  // Only set dangerouslyAllowBrowser to true when in browser environment
  ...(isServer ? {} : { dangerouslyAllowBrowser: true }),
});

export async function generateImage(prompt: string): Promise<string> {
  try {
    // Check if API key is available
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API key is not configured. Please add it to your environment variables.",
      );
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });

    return response.data[0].url || "";
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

export { openai };
