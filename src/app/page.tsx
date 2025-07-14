"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = async () => {
    if (!user) {
      await signIn();
    } else {
      router.push("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Create Amazing Images with AI
            </h1>
            <p className="text-xl mb-8">
              Astra Labs is an elegant, intuitive, and performant full-stack web
              application where multiple designers can generate images using
              text prompts.
            </p>
            <Button
              onClick={handleGetStarted}
              className="text-lg px-8 py-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Get Started
            </Button>
          </div>
          <div className="relative">
            <div className="relative w-full aspect-square border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
              <Image
                src="/1.jpg"
                alt="AI Generated Art"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-yellow-300 border-4 border-black z-[-1]"></div>
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-400 border-4 border-black z-[-1]"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-100 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-16 text-center border-b-8 border-black pb-4 inline-block mx-auto">
            Powerful Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-16 h-16 bg-pink-400 border-4 border-black mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Text-to-Image</h3>
              <p>
                Transform your creative ideas into stunning visuals with just a
                text prompt. Our AI understands your vision.
              </p>
            </div>

            <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-16 h-16 bg-green-400 border-4 border-black mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Image Search</h3>
              <p>
                Find similar images by uploading a reference or searching by
                text. Discover inspiration from other designers.
              </p>
            </div>

            <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-16 h-16 bg-blue-400 border-4 border-black mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Collaboration</h3>
              <p>
                Work together with multiple designers. Share, vote, and build
                upon each other's creations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-16 text-center">
            Stunning Results
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="relative w-full aspect-square border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                <Image
                  src="/2.jpg"
                  alt="AI Generated Art Example"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="order-1 md:order-2">
              <h3 className="text-3xl font-bold mb-6">
                Unleash Your Creativity
              </h3>
              <p className="text-xl mb-6">
                With Astra Labs, you're not limited by your drawing skills. Our
                AI can generate any style, from photorealistic to abstract art,
                based on your text descriptions.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-300 border-2 border-black mr-3"></div>
                  <span>Photorealistic images</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-pink-400 border-2 border-black mr-3"></div>
                  <span>Abstract art</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-blue-400 border-2 border-black mr-3"></div>
                  <span>Character designs</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-green-400 border-2 border-black mr-3"></div>
                  <span>Product visualizations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-yellow-300 py-20 relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-pink-400 border-4 border-black rounded-full"></div>
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-blue-400 border-4 border-black rounded-full"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="relative inline-block mb-8">
              <div className="w-full aspect-video border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                <Image
                  src="/3.jpg"
                  alt="AI Generated Art Showcase"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <h2 className="text-4xl font-bold mb-6">
              Ready to Transform Your Ideas into Images?
            </h2>
            <p className="text-xl mb-8">
              Join our community of designers and start creating amazing
              AI-generated art today.
            </p>
            <Button
              onClick={handleGetStarted}
              className="text-lg px-8 py-6 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Start Creating Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-3xl font-bold">Astra Labs</h2>
              <p className="text-gray-400">AI-powered image generation</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div>
                <h3 className="text-xl font-bold mb-3">Features</h3>
                <ul className="space-y-2">
                  <li>Text-to-Image</li>
                  <li>Image Search</li>
                  <li>Collaboration</li>
                  <li>Version History</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3">Resources</h3>
                <ul className="space-y-2">
                  <li>Documentation</li>
                  <li>API</li>
                  <li>Community</li>
                  <li>Support</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p>
              &copy; {new Date().getFullYear()} Astra Labs. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
