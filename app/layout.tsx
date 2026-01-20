import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { VoiceProfileProvider } from "@/lib/context/VoiceProfileContext";
import { PostProvider } from "@/lib/context/PostContext";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/Navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "william.ai - AI Ghostwriting Platform",
  description: "Eliminate AI slop through structural constraints and multi-layer quality control",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <VoiceProfileProvider>
            <PostProvider>
              <div className="min-h-screen flex flex-col">
                <Navigation />
                <main className="flex-1">
                  {children}
                </main>
              </div>
              <Toaster />
            </PostProvider>
          </VoiceProfileProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
