"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CarouselPage, CarouselTemplate, VoiceProfile } from "@/lib/types";

type BrandColors = VoiceProfile["brandColors"];
import { htmlToImage, generatePageHTML, downloadCarouselImages } from "@/lib/carousel/generator";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Check,
  X,
  ZoomIn,
  Loader2,
} from "lucide-react";

interface CarouselPreviewProps {
  pages: CarouselPage[];
  template: CarouselTemplate;
  brandColors: BrandColors;
  onPagesChange?: (pages: CarouselPage[]) => void;
  isEditable?: boolean;
}

export function CarouselPreview({
  pages,
  template,
  brandColors,
  onPagesChange,
  isEditable = true,
}: CarouselPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [zoomedPage, setZoomedPage] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate preview images
  useEffect(() => {
    const generatePreviews = async () => {
      if (pages.length === 0) return;
      
      setIsGeneratingPreviews(true);
      const urls: string[] = [];
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        try {
          const html = generatePageHTML(page, brandColors, i, pages.length);
          const url = await htmlToImage(html);
          urls.push(url);
        } catch {
          urls.push("");
        }
      }
      
      setPreviewUrls(urls);
      setIsGeneratingPreviews(false);
    };

    generatePreviews();
  }, [pages, template, brandColors]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pages.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + pages.length) % pages.length);
  };

  const startEditing = (pageIndex: number) => {
    const page = pages[pageIndex];
    // Convert array content to editable format
    const content: Record<string, string> = {
      heading: page.heading || "",
      content: page.content.join("\n"),
    };
    setEditedContent(content);
    setEditingPage(pageIndex);
  };

  const saveEdit = () => {
    if (editingPage === null || !onPagesChange) return;
    
    const updatedPages = [...pages];
    updatedPages[editingPage] = {
      ...updatedPages[editingPage],
      heading: editedContent.heading || "",
      content: editedContent.content?.split("\n").filter(Boolean) || [],
    };
    onPagesChange(updatedPages);
    setEditingPage(null);
    setEditedContent({});
  };

  const cancelEdit = () => {
    setEditingPage(null);
    setEditedContent({});
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadCarouselImages(pages, brandColors, "carousel");
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingPage !== null) return;
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "ArrowLeft") goToPrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingPage, pages.length]);

  // Touch/swipe handling
  const touchStartX = useRef<number | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    
    touchStartX.current = null;
  };

  if (pages.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No carousel pages generated yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Preview */}
      <div 
        ref={containerRef}
        className="relative aspect-square max-w-lg mx-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <Card className="w-full h-full overflow-hidden">
              <CardContent className="p-0 w-full h-full relative">
                {isGeneratingPreviews ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : previewUrls[currentIndex] ? (
                  <img
                    src={previewUrls[currentIndex]}
                    alt={`Carousel page ${currentIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full p-8 flex flex-col justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary})`,
                    }}
                  >
                    <div className="text-white text-center space-y-4">
                      <h3 className="text-2xl font-bold">
                        {pages[currentIndex]?.heading || `Page ${currentIndex + 1}`}
                      </h3>
                      {pages[currentIndex]?.content && pages[currentIndex].content.length > 0 && (
                        <p className="text-white/80">{pages[currentIndex].content.join(" ")}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Overlay actions */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="opacity-80 hover:opacity-100"
                    onClick={() => setZoomedPage(currentIndex)}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  {isEditable && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="opacity-80 hover:opacity-100"
                      onClick={() => startEditing(currentIndex)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {pages.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white"
              onClick={goToPrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white"
              onClick={goToNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2">
        {pages.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? "bg-primary w-6"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      {/* Page counter */}
      <p className="text-center text-sm text-muted-foreground">
        Page {currentIndex + 1} of {pages.length}
      </p>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto py-2 px-1">
        {pages.map((_, index) => (
          <button
            key={index}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
              index === currentIndex ? "border-primary" : "border-transparent opacity-60"
            }`}
            onClick={() => setCurrentIndex(index)}
          >
            {previewUrls[index] ? (
              <img
                src={previewUrls[index]}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary})`,
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Download button */}
      <div className="flex justify-center">
        <Button onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download All Pages
            </>
          )}
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingPage !== null} onOpenChange={() => cancelEdit()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Page {(editingPage ?? 0) + 1}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {Object.entries(editedContent).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium capitalize">{key}</label>
                <Textarea
                  value={value}
                  onChange={(e) =>
                    setEditedContent((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  rows={key === "body" ? 4 : 2}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={saveEdit}>
                <Check className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Zoom Dialog */}
      <Dialog open={zoomedPage !== null} onOpenChange={() => setZoomedPage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          {zoomedPage !== null && previewUrls[zoomedPage] && (
            <img
              src={previewUrls[zoomedPage]}
              alt={`Carousel page ${zoomedPage + 1}`}
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
