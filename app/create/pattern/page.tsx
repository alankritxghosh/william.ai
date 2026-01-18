"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/interview/QuestionCard";
import { ProgressBar } from "@/components/interview/ProgressBar";
import { VoiceModeSelector } from "@/components/interview/VoiceModeSelector";
import { NavigationButtons } from "@/components/interview/NavigationButtons";
import { InsightExtractor, PatternInsight } from "@/components/interview/InsightExtractor";
import { useVoiceProfiles } from "@/lib/context/VoiceProfileContext";
import { VoiceModeId, InterviewResponse } from "@/lib/types";
import { saveDraft, loadDraft, clearDraft, generateId } from "@/lib/utils/storage";
import { toast } from "@/hooks/use-toast";
import { Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

const QUESTIONS = [
  {
    id: "q1",
    text: "How many times have you seen this pattern? What's your sample size?",
    placeholder: "e.g., I've worked with 47 startups over 8 years. Reviewed 200+ pitch decks...",
  },
  {
    id: "q2",
    text: "Give me 2-3 specific examples with numbers or names.",
    placeholder: "e.g., Company A raised $5M, burned through it in 8 months. Company B raised $500K, hit profitability in 12 months...",
  },
  {
    id: "q3",
    text: "What's ALWAYS true? What's the pattern you've identified?",
    placeholder: "e.g., The startups that succeed always have one thing in common: they talk to customers before building. Every. Single. Time...",
  },
  {
    id: "q4",
    text: "What do most people miss? What's the blind spot?",
    placeholder: "e.g., Everyone focuses on the product. Nobody focuses on distribution. But distribution is 80% of success...",
  },
  {
    id: "q5",
    text: "What surprises you about this pattern? What's contrarian?",
    placeholder: "e.g., The companies with the worst products often win. Because they nail distribution and iterate based on real feedback...",
  },
];

const TOTAL_STEPS = QUESTIONS.length + 2; // +1 for voice mode selection, +1 for insight extraction

export default function PatternFlowPage() {
  const router = useRouter();
  const { profiles, activeProfile } = useVoiceProfiles();

  const [currentStep, setCurrentStep] = useState(0);
  const [voiceModeId, setVoiceModeId] = useState<VoiceModeId | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    q5: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedInsight, setExtractedInsight] = useState<PatternInsight | null>(null);
  const [isExtractingInsight, setIsExtractingInsight] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.flowType === "pattern") {
      if (draft.voiceModeId) setVoiceModeId(draft.voiceModeId);
      if (draft.answers) setAnswers(draft.answers as Record<string, string>);
    }
  }, []);

  // Save draft on changes
  useEffect(() => {
    const draft: Partial<InterviewResponse> = {
      flowType: "pattern",
      voiceModeId: voiceModeId || undefined,
      answers: answers as InterviewResponse["answers"],
    };
    saveDraft(draft);
  }, [voiceModeId, answers]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return voiceModeId !== null;
    }
    const questionIndex = currentStep - 1;
    if (questionIndex >= 0 && questionIndex < QUESTIONS.length) {
      const questionId = QUESTIONS[questionIndex].id;
      return answers[questionId]?.length >= 20;
    }
    return true;
  };

  const extractInsight = async () => {
    setIsExtractingInsight(true);
    try {
      const response = await fetch("/api/extract-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowType: "pattern",
          answers,
          voiceModeId,
        }),
      });

      if (!response.ok) throw new Error("Failed to extract insight");

      const data = await response.json();
      if (data.success && data.insight) {
        setExtractedInsight(data.insight);
      }
    } catch (error) {
      console.error("Error extracting insight:", error);
      toast({
        title: "Note",
        description: "Couldn't extract AI insights. You can continue to generate.",
      });
    } finally {
      setIsExtractingInsight(false);
    }
  };

  const handleNext = async () => {
    if (canProceed()) {
      // If moving to insight step (after all questions), trigger extraction
      if (currentStep === QUESTIONS.length && !extractedInsight && !isExtractingInsight) {
        setCurrentStep(prev => prev + 1);
        extractInsight();
      } else {
        setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
      }
    }
  };

  const handleInsightEdit = (edited: PatternInsight) => {
    setExtractedInsight(edited);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!activeProfile) {
      toast({
        title: "No Voice Profile",
        description: "Please select a voice profile first",
        variant: "destructive",
      });
      return;
    }

    if (!voiceModeId) {
      toast({
        title: "No Voice Mode",
        description: "Please select a voice mode",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create interview response
      const interview: InterviewResponse = {
        id: generateId(),
        flowType: "pattern",
        voiceModeId,
        voiceProfileId: activeProfile.id,
        createdAt: new Date().toISOString(),
        answers: answers as InterviewResponse["answers"],
        platform: "linkedin",
      };

      // Store in session storage for the generation page
      sessionStorage.setItem("pendingInterview", JSON.stringify(interview));
      sessionStorage.setItem("pendingProfile", JSON.stringify(activeProfile));
      if (extractedInsight) {
        sessionStorage.setItem("pendingInsight", JSON.stringify(extractedInsight));
      }

      clearDraft();
      router.push("/create/generate");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to start generation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has a voice profile
  if (profiles.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="max-w-md">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <CardTitle>Create a Voice Profile First</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You need to create a voice profile before generating posts.
              This helps us match your unique writing style.
            </p>
            <Link href="/voice-profile/new">
              <Button className="w-full">
                Create Voice Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            flowType="pattern"
            voiceModeId={voiceModeId || undefined}
          />
        </div>

        {/* Content */}
        <Card>
          <CardContent className="pt-6">
            <AnimatePresence mode="wait">
              {currentStep === 0 ? (
                <motion.div
                  key="voice-mode"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <VoiceModeSelector
                    selectedMode={voiceModeId}
                    onSelect={setVoiceModeId}
                  />
                </motion.div>
              ) : currentStep <= QUESTIONS.length ? (
                <motion.div
                  key={`question-${currentStep}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <QuestionCard
                    questionNumber={currentStep}
                    questionText={QUESTIONS[currentStep - 1].text}
                    value={answers[QUESTIONS[currentStep - 1].id]}
                    onChange={(value) => handleAnswerChange(QUESTIONS[currentStep - 1].id, value)}
                    placeholder={QUESTIONS[currentStep - 1].placeholder}
                  />
                </motion.div>
              ) : currentStep === QUESTIONS.length + 1 ? (
                <motion.div
                  key="insight-extraction"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold mb-2">AI Insight Extraction</h2>
                    <p className="text-sm text-muted-foreground">
                      We&apos;re analyzing your answers to find the unique angle for your post
                    </p>
                  </div>
                  <InsightExtractor
                    insight={extractedInsight}
                    flowType="pattern"
                    loading={isExtractingInsight}
                    onEdit={(edited) => handleInsightEdit(edited as PatternInsight)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Ready to Generate</h2>
                    <p className="text-muted-foreground">
                      Review your answers and generate your post
                    </p>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {QUESTIONS.map((q, i) => (
                      <div key={q.id} className="p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Q{i + 1}: {q.text}
                        </p>
                        <p className="text-sm">{answers[q.id]}</p>
                      </div>
                    ))}
                  </div>

                  {extractedInsight && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-primary mb-2">
                        AI-Extracted Insights:
                      </p>
                      <div className="text-sm space-y-1">
                        <p><strong>Pattern:</strong> {extractedInsight.pattern}</p>
                        <p><strong>Blind Spot:</strong> {extractedInsight.blindSpot}</p>
                        <p><strong>Urgency:</strong> {extractedInsight.urgency}</p>
                        {extractedInsight.proof && (
                          <p><strong>Proof:</strong> {extractedInsight.proof}</p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <NavigationButtons
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
              onBack={handleBack}
              onNext={handleNext}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              canProceed={canProceed()}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
