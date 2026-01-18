"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CarouselPreview } from "@/components/carousel/CarouselPreview";
import { useVoiceProfiles } from "@/lib/context/VoiceProfileContext";
import { usePosts } from "@/lib/context/PostContext";
import { CarouselTemplate, CarouselPage, GeneratedPost } from "@/lib/types";
import { CAROUSEL_TEMPLATES } from "@/data/carousel-templates";
import { selectCarouselTemplate } from "@/lib/carousel/template-selector";
import { generateCarouselPages } from "@/lib/carousel/generator";
import { toast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  FileText,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const STEPS = [
  { id: 1, title: "Content", description: "Enter your post or select from history" },
  { id: 2, title: "Template", description: "Choose a carousel style" },
  { id: 3, title: "Preview", description: "Review and edit your carousel" },
];

export default function CarouselCreationPage() {
  const router = useRouter();
  const { activeProfile } = useVoiceProfiles();
  const { posts } = usePosts();

  const [currentStep, setCurrentStep] = useState(1);
  const [postContent, setPostContent] = useState("");
  const [selectedPost, setSelectedPost] = useState<GeneratedPost | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CarouselTemplate | null>(null);
  const [suggestedTemplate, setSuggestedTemplate] = useState<CarouselTemplate | null>(null);
  const [generatedPages, setGeneratedPages] = useState<CarouselPage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingTemplate, setIsSuggestingTemplate] = useState(false);

  // Get recent posts for quick selection
  const recentPosts = posts.slice(0, 5);

  // Auto-suggest template when content changes
  useEffect(() => {
    const suggestTemplate = async () => {
      if (postContent.length < 100) return;
      
      setIsSuggestingTemplate(true);
      try {
        const suggested = await selectCarouselTemplate(postContent);
        setSuggestedTemplate(suggested);
      } catch (error) {
        console.error("Template suggestion failed:", error);
      } finally {
        setIsSuggestingTemplate(false);
      }
    };

    const debounce = setTimeout(suggestTemplate, 1000);
    return () => clearTimeout(debounce);
  }, [postContent]);

  const handleSelectPost = (post: GeneratedPost) => {
    setSelectedPost(post);
    // Handle different post structures
    const content = post.outputs?.linkedin?.post || post.pipeline?.finalVersion || "";
    setPostContent(content);
  };

  const handleSelectTemplate = (template: CarouselTemplate) => {
    setSelectedTemplate(template);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !postContent || !activeProfile) return;

    setIsGenerating(true);
    try {
      const result = await generateCarouselPages(
        postContent,
        selectedTemplate,
        activeProfile.brandColors
      );
      setGeneratedPages(result.pages);
      setCurrentStep(3);
    } catch (error) {
      console.error("Generation failed:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate carousel. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && postContent.length < 50) {
      toast({
        title: "Content Required",
        description: "Please enter at least 50 characters of content.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 2) {
      if (!selectedTemplate) {
        toast({
          title: "Template Required",
          description: "Please select a carousel template.",
          variant: "destructive",
        });
        return;
      }
      handleGenerate();
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePagesChange = (pages: CarouselPage[]) => {
    setGeneratedPages(pages);
  };

  if (!activeProfile) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Create a Voice Profile First</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You need a voice profile with brand colors to create carousels.
            </p>
            <Link href="/voice-profile/new">
              <Button className="w-full">Create Voice Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>

        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Create Carousel</h1>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
          <div className="mt-4 flex justify-between">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`text-sm ${
                  step.id <= currentStep ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Content Input */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{STEPS[0].title}</CardTitle>
                  <CardDescription>{STEPS[0].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Post Content</label>
                    <Textarea
                      placeholder="Paste or type your LinkedIn post content here..."
                      value={postContent}
                      onChange={(e) => {
                        setPostContent(e.target.value);
                        setSelectedPost(null);
                      }}
                      rows={8}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {postContent.length} characters
                    </p>
                  </div>

                  {recentPosts.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Or select from recent posts:</p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {recentPosts.map((post) => (
                          <button
                            key={post.id}
                            onClick={() => handleSelectPost(post)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              selectedPost?.id === post.id
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-primary/50"
                            }`}
                          >
                            <p className="text-sm line-clamp-2">{post.outputs?.linkedin?.post || post.pipeline?.finalVersion || ""}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Score: {post.quality?.score || 0}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{STEPS[1].title}</CardTitle>
                  <CardDescription>{STEPS[1].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* AI Suggestion */}
                  {isSuggestingTemplate && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm">AI is analyzing your content...</span>
                    </div>
                  )}

                  {suggestedTemplate && !isSuggestingTemplate && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          AI Recommended
                        </span>
                      </div>
                      <button
                        onClick={() => handleSelectTemplate(suggestedTemplate)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          selectedTemplate?.id === suggestedTemplate.id
                            ? "border-primary bg-white"
                            : "border-primary/50 hover:border-primary"
                        }`}
                      >
                        <p className="font-medium">{suggestedTemplate.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {suggestedTemplate.description}
                        </p>
                      </button>
                    </div>
                  )}

                  {/* Template Categories */}
                  {(["list", "story", "data"] as const).map((category) => {
                    const categoryTemplates = CAROUSEL_TEMPLATES.filter(
                      (t) => t.category === category
                    );
                    if (categoryTemplates.length === 0) return null;

                    return (
                      <div key={category} className="space-y-3">
                        <h3 className="text-sm font-medium capitalize flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {category} Templates
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {categoryTemplates.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => handleSelectTemplate(template)}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                selectedTemplate?.id === template.id
                                  ? "border-primary bg-primary/5"
                                  : "border-muted hover:border-primary/50"
                              }`}
                            >
                              <p className="font-medium text-sm">{template.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {template.pageCount} pages
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{STEPS[2].title}</CardTitle>
                  <CardDescription>{STEPS[2].description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isGenerating ? (
                    <div className="py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Generating your carousel...</p>
                    </div>
                  ) : generatedPages.length > 0 && selectedTemplate ? (
                    <CarouselPreview
                      pages={generatedPages}
                      template={selectedTemplate}
                      brandColors={activeProfile.brandColors}
                      onPagesChange={handlePagesChange}
                      isEditable={true}
                    />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No carousel generated yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} disabled={isGenerating}>
              {currentStep === 2 && isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  {currentStep === 2 ? "Generate" : "Next"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={() => router.push("/dashboard")}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
