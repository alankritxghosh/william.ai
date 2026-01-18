"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useVoiceProfiles } from "@/lib/context/VoiceProfileContext";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Check, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { id: 1, title: "Basic Info", description: "Update your profile name" },
  { id: 2, title: "Voice Rules", description: "Refine your writing style" },
  { id: 3, title: "Reference Posts", description: "Update your top-performing posts" },
  { id: 4, title: "Brand Colors", description: "Adjust your visual identity" },
  { id: 5, title: "Review", description: "Confirm and save changes" },
];

export default function EditVoiceProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;
  const { profiles, updateProfile } = useVoiceProfiles();
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [name, setName] = useState("");
  const [platforms, setPlatforms] = useState<("linkedin" | "twitter")[]>(["linkedin"]);
  const [sentencePatterns, setSentencePatterns] = useState("");
  const [forbiddenWords, setForbiddenWords] = useState("");
  const [signaturePhrases, setSignaturePhrases] = useState("");
  const [avgSentenceLength, setAvgSentenceLength] = useState(15);
  const [paragraphBreaks, setParagraphBreaks] = useState<"frequent" | "moderate" | "rare">("frequent");
  const [punchlinePosition, setPunchlinePosition] = useState<"end" | "middle" | "start">("end");
  const [questionUsage, setQuestionUsage] = useState<"never" | "occasional" | "frequent">("occasional");
  const [useEmDash, setUseEmDash] = useState(false);
  const [useBulletPoints, setUseBulletPoints] = useState(false);
  const [useNumberedLists, setUseNumberedLists] = useState(true);
  const [emojiUsage, setEmojiUsage] = useState<"never" | "rare" | "moderate" | "frequent">("rare");
  
  const [post1, setPost1] = useState({ content: "", engagement: 0 });
  const [post2, setPost2] = useState({ content: "", engagement: 0 });
  const [post3, setPost3] = useState({ content: "", engagement: 0 });
  
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [secondaryColor, setSecondaryColor] = useState("#8B5CF6");
  const [accentColor, setAccentColor] = useState("#10B981");

  // Load profile data
  useEffect(() => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setName(profile.name);
      setSentencePatterns(profile.rules.sentencePatterns.join("\n"));
      setForbiddenWords(profile.rules.forbiddenWords.join("\n"));
      setSignaturePhrases(profile.rules.signaturePhrases.join("\n"));
      setAvgSentenceLength(profile.rules.rhythmPreferences.avgSentenceLength || 15);
      setParagraphBreaks(profile.rules.rhythmPreferences.paragraphBreaks);
      setPunchlinePosition(profile.rules.rhythmPreferences.punchlinePosition);
      setQuestionUsage(profile.rules.rhythmPreferences.questionUsage);
      setUseEmDash(profile.rules.formattingRules.useEmDash);
      setUseBulletPoints(profile.rules.formattingRules.useBulletPoints);
      setUseNumberedLists(profile.rules.formattingRules.useNumberedLists);
      setEmojiUsage(profile.rules.formattingRules.emojiUsage);
      
      if (profile.topPosts[0]) {
        setPost1({ content: profile.topPosts[0].content, engagement: profile.topPosts[0].engagement });
      }
      if (profile.topPosts[1]) {
        setPost2({ content: profile.topPosts[1].content, engagement: profile.topPosts[1].engagement });
      }
      if (profile.topPosts[2]) {
        setPost3({ content: profile.topPosts[2].content, engagement: profile.topPosts[2].engagement });
      }
      
      // Detect platforms from posts
      const detectedPlatforms: ("linkedin" | "twitter")[] = [];
      if (profile.topPosts.some(p => p.platform === "linkedin")) detectedPlatforms.push("linkedin");
      if (profile.topPosts.some(p => p.platform === "twitter")) detectedPlatforms.push("twitter");
      if (detectedPlatforms.length > 0) setPlatforms(detectedPlatforms);
      
      setPrimaryColor(profile.brandColors.primary);
      setSecondaryColor(profile.brandColors.secondary);
      setAccentColor(profile.brandColors.accent);
      
      setIsLoading(false);
    } else {
      toast({
        title: "Profile not found",
        description: "The voice profile you're looking for doesn't exist.",
        variant: "destructive",
      });
      router.push("/voice-profile");
    }
  }, [profileId, profiles, router]);

  const parseToArray = (text: string): string[] => {
    return text
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  const getTotalRules = () => {
    return (
      parseToArray(sentencePatterns).length +
      parseToArray(forbiddenWords).length +
      parseToArray(signaturePhrases).length
    );
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return name.trim().length >= 2;
      case 2:
        return getTotalRules() >= 10;
      case 3:
        return post1.content.length > 50 || post2.content.length > 50 || post3.content.length > 50;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast({
        title: "Incomplete",
        description: getValidationMessage(currentStep),
        variant: "destructive",
      });
    }
  };

  const getValidationMessage = (step: number): string => {
    switch (step) {
      case 1:
        return "Please enter a name for your voice profile";
      case 2:
        return `Add more rules (${getTotalRules()}/10 minimum)`;
      case 3:
        return "Add at least one reference post with 50+ characters";
      default:
        return "Please complete this step";
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = () => {
    const topPosts = [post1, post2, post3]
      .filter(p => p.content.length > 0)
      .map(p => ({
        content: p.content,
        platform: platforms[0] as "linkedin" | "twitter",
        engagement: p.engagement,
      }));

    updateProfile(profileId, {
      name,
      rules: {
        sentencePatterns: parseToArray(sentencePatterns),
        forbiddenWords: parseToArray(forbiddenWords),
        signaturePhrases: parseToArray(signaturePhrases),
        rhythmPreferences: {
          avgSentenceLength,
          paragraphBreaks,
          punchlinePosition,
          questionUsage,
        },
        formattingRules: {
          useEmDash,
          useBulletPoints,
          useNumberedLists,
          emojiUsage,
        },
      },
      topPosts,
      brandColors: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
      },
    });

    toast({
      title: "Profile Updated",
      description: `"${name}" has been saved successfully!`,
    });

    router.push("/voice-profile");
  };

  const togglePlatform = (platform: "linkedin" | "twitter") => {
    setPlatforms(prev => {
      if (prev.includes(platform)) {
        return prev.filter(p => p !== platform);
      }
      return [...prev, platform];
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back Link */}
        <Link href="/voice-profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Profiles
        </Link>

        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Edit Voice Profile</h1>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
          <div className="mt-2 flex justify-between">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`text-xs ${
                  step.id <= currentStep ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step.id === currentStep && step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Profile Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., My LinkedIn Voice"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Platforms</Label>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={platforms.includes("linkedin") ? "default" : "outline"}
                          onClick={() => togglePlatform("linkedin")}
                        >
                          LinkedIn
                        </Button>
                        <Button
                          type="button"
                          variant={platforms.includes("twitter") ? "default" : "outline"}
                          onClick={() => togglePlatform("twitter")}
                        >
                          Twitter
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 2: Voice Rules */}
                {currentStep === 2 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="patterns">
                        Sentence Patterns (one per line)
                        <span className="text-muted-foreground ml-2">
                          {parseToArray(sentencePatterns).length} rules
                        </span>
                      </Label>
                      <Textarea
                        id="patterns"
                        placeholder="Never use em-dashes&#10;Start paragraphs with action verbs&#10;Keep sentences under 20 words"
                        value={sentencePatterns}
                        onChange={(e) => setSentencePatterns(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="forbidden">
                        Forbidden Words (one per line)
                        <span className="text-muted-foreground ml-2">
                          {parseToArray(forbiddenWords).length} words
                        </span>
                      </Label>
                      <Textarea
                        id="forbidden"
                        placeholder="utilize&#10;implement&#10;leverage"
                        value={forbiddenWords}
                        onChange={(e) => setForbiddenWords(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signature">
                        Signature Phrases (one per line)
                        <span className="text-muted-foreground ml-2">
                          {parseToArray(signaturePhrases).length} phrases
                        </span>
                      </Label>
                      <Textarea
                        id="signature"
                        placeholder="Here's the thing:&#10;Real talk:&#10;Most founders miss this:"
                        value={signaturePhrases}
                        onChange={(e) => setSignaturePhrases(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        Total rules: <strong>{getTotalRules()}</strong> / 10 minimum
                      </p>
                    </div>
                    
                    {/* Rhythm & Formatting Options */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Avg Sentence Length</Label>
                        <Input
                          type="number"
                          min={8}
                          max={25}
                          value={avgSentenceLength}
                          onChange={(e) => setAvgSentenceLength(parseInt(e.target.value) || 15)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Paragraph Breaks</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={paragraphBreaks}
                          onChange={(e) => setParagraphBreaks(e.target.value as typeof paragraphBreaks)}
                        >
                          <option value="frequent">Frequent</option>
                          <option value="moderate">Moderate</option>
                          <option value="rare">Rare</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Punchline Position</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={punchlinePosition}
                          onChange={(e) => setPunchlinePosition(e.target.value as typeof punchlinePosition)}
                        >
                          <option value="end">End</option>
                          <option value="middle">Middle</option>
                          <option value="start">Start</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Question Usage</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={questionUsage}
                          onChange={(e) => setQuestionUsage(e.target.value as typeof questionUsage)}
                        >
                          <option value="never">Never</option>
                          <option value="occasional">Occasional</option>
                          <option value="frequent">Frequent</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Emoji Usage</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={emojiUsage}
                          onChange={(e) => setEmojiUsage(e.target.value as typeof emojiUsage)}
                        >
                          <option value="never">Never</option>
                          <option value="rare">Rare</option>
                          <option value="moderate">Moderate</option>
                          <option value="frequent">Frequent</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 3: Reference Posts */}
                {currentStep === 3 && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Add your best-performing posts. These help us match your voice.
                    </p>
                    {[
                      { state: post1, setter: setPost1, label: "Post 1" },
                      { state: post2, setter: setPost2, label: "Post 2" },
                      { state: post3, setter: setPost3, label: "Post 3" },
                    ].map(({ state, setter, label }) => (
                      <div key={label} className="space-y-2 p-4 border rounded-lg">
                        <Label>{label}</Label>
                        <Textarea
                          placeholder="Paste your post content here..."
                          value={state.content}
                          onChange={(e) => setter({ ...state, content: e.target.value })}
                          rows={4}
                        />
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Engagement:</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            className="w-24"
                            value={state.engagement || ""}
                            onChange={(e) => setter({ ...state, engagement: parseInt(e.target.value) || 0 })}
                          />
                          <span className="text-sm text-muted-foreground">likes/reactions</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Step 4: Brand Colors */}
                {currentStep === 4 && (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      These colors will be used for carousel generation.
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Primary</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-12 h-12 rounded cursor-pointer"
                          />
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-24"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-12 h-12 rounded cursor-pointer"
                          />
                          <Input
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-24"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Accent</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="w-12 h-12 rounded cursor-pointer"
                          />
                          <Input
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="w-24"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Color Preview */}
                    <div
                      className="mt-6 p-6 rounded-lg"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                    >
                      <p className="text-white font-bold text-lg">Preview</p>
                      <p className="text-white/80 text-sm">Your carousel slides will use these colors</p>
                      <div
                        className="mt-4 inline-block px-4 py-2 rounded-md text-white font-medium"
                        style={{ backgroundColor: accentColor }}
                      >
                        Accent Button
                      </div>
                    </div>
                  </>
                )}

                {/* Step 5: Review */}
                {currentStep === 5 && (
                  <>
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Profile Name</span>
                        <span className="font-medium">{name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Platforms</span>
                        <span className="font-medium">{platforms.join(", ")}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Total Rules</span>
                        <span className="font-medium">{getTotalRules()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Reference Posts</span>
                        <span className="font-medium">
                          {[post1, post2, post3].filter(p => p.content.length > 0).length}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Brand Colors</span>
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: primaryColor }} />
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: secondaryColor }} />
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: accentColor }} />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
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
          
          {currentStep < 5 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
