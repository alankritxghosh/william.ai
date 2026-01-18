"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenerationLoader } from "@/components/generation/GenerationLoader";
import { PostPreview } from "@/components/generation/PostPreview";
import { usePosts } from "@/lib/context/PostContext";
import { InterviewResponse, VoiceProfile, GeneratedPost } from "@/lib/types";
import { generatePost, PipelineProgress } from "@/lib/pipeline/multi-stage";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, ArrowLeft, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

type GenerationState = "loading" | "generating" | "complete" | "error";

export default function GeneratePage() {
  const router = useRouter();
  const { addPost } = usePosts();
  
  const [state, setState] = useState<GenerationState>("loading");
  const [progress, setProgress] = useState<PipelineProgress>({
    stage: "initial",
    percent: 0,
    message: "Preparing...",
  });
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interview, setInterview] = useState<InterviewResponse | null>(null);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);

  // Load data from session storage and start generation
  useEffect(() => {
    const loadAndGenerate = async () => {
      try {
        const interviewJson = sessionStorage.getItem("pendingInterview");
        const profileJson = sessionStorage.getItem("pendingProfile");

        if (!interviewJson || !profileJson) {
          setState("error");
          setError("No interview data found. Please start from the interview flow.");
          return;
        }

        const loadedInterview = JSON.parse(interviewJson) as InterviewResponse;
        const loadedProfile = JSON.parse(profileJson) as VoiceProfile;
        
        setInterview(loadedInterview);
        setVoiceProfile(loadedProfile);
        
        // Clear session storage
        sessionStorage.removeItem("pendingInterview");
        sessionStorage.removeItem("pendingProfile");

        // Start generation
        setState("generating");
        
        const post = await generatePost(
          loadedInterview,
          loadedProfile,
          (progressUpdate) => {
            setProgress(progressUpdate);
          }
        );

        setGeneratedPost(post);
        addPost(post);
        setState("complete");

        toast({
          title: "Post Generated!",
          description: `Quality score: ${post.quality.score}/100`,
        });
      } catch (err) {
        console.error("Generation error:", err);
        setState("error");
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
        
        toast({
          title: "Generation Failed",
          description: "Please try again or check your API key",
          variant: "destructive",
        });
      }
    };

    loadAndGenerate();
  }, [addPost]);

  const handleRetry = async () => {
    if (!interview || !voiceProfile) return;
    
    setState("generating");
    setError(null);
    setProgress({ stage: "initial", percent: 0, message: "Retrying..." });

    try {
      const post = await generatePost(
        interview,
        voiceProfile,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      setGeneratedPost(post);
      addPost(post);
      setState("complete");

      toast({
        title: "Post Generated!",
        description: `Quality score: ${post.quality.score}/100`,
      });
    } catch (err) {
      console.error("Retry error:", err);
      setState("error");
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  const handleUpdatePost = (newContent: string) => {
    if (generatedPost) {
      const updated = {
        ...generatedPost,
        outputs: {
          ...generatedPost.outputs,
          linkedin: {
            ...generatedPost.outputs.linkedin,
            post: newContent,
            characterCount: newContent.length,
          },
        },
        updatedAt: new Date().toISOString(),
      };
      setGeneratedPost(updated);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/create">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Create
            </Button>
          </Link>
          
          {state === "complete" && (
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          )}
        </div>

        {/* Content */}
        {state === "loading" && (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">
                  Loading...
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {state === "generating" && (
          <Card>
            <CardContent>
              <GenerationLoader
                stage={progress.stage}
                percent={progress.percent}
                message={progress.message}
              />
            </CardContent>
          </Card>
        )}

        {state === "complete" && generatedPost && (
          <PostPreview
            post={generatedPost}
            onUpdate={handleUpdatePost}
          />
        )}

        {state === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <CardTitle>Generation Failed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {error || "An unexpected error occurred during generation."}
                </p>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Troubleshooting:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Make sure your GEMINI_API_KEY is set correctly</li>
                    <li>• Check your API quota and rate limits</li>
                    <li>• Try again in a few seconds</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  {interview && voiceProfile && (
                    <Button onClick={handleRetry}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  )}
                  <Link href="/create">
                    <Button variant="outline">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Start Over
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
