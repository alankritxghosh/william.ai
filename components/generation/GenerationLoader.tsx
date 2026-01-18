"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, CheckCircle } from "lucide-react";

interface GenerationLoaderProps {
  stage: string;
  percent: number;
  message: string;
  attempt?: number;
  maxAttempts?: number;
}

const STAGE_DETAILS: Record<string, { title: string; description: string }> = {
  initial: {
    title: "Generating Versions",
    description: "Creating 5 unique versions of your post...",
  },
  selecting: {
    title: "Evaluating Quality",
    description: "Scoring each version and selecting the best...",
  },
  refining: {
    title: "Polishing Content",
    description: "Removing AI tells and strengthening sentences...",
  },
  hooks: {
    title: "Optimizing Hook",
    description: "Testing different opening lines...",
  },
  personality: {
    title: "Adding Voice",
    description: "Injecting your unique personality and style...",
  },
  quality: {
    title: "Quality Check",
    description: "Running final quality gates...",
  },
  converting: {
    title: "Creating Formats",
    description: "Generating Twitter thread version...",
  },
  retry: {
    title: "Regenerating",
    description: "Quality threshold not met, trying again...",
  },
  complete: {
    title: "Complete!",
    description: "Your post is ready!",
  },
};

const FUN_FACTS = [
  "The average LinkedIn post takes 15 minutes to write manually. We're doing it in seconds.",
  "Posts with specific numbers get 73% more engagement.",
  "The best hooks contain either a number, a contrarian claim, or personal stakes.",
  "Most ghostwriters spend 60% of their time editing out AI slop.",
  "Posts written in the Thought Leader voice get 2x more shares.",
];

export function GenerationLoader({
  stage,
  percent,
  message,
  attempt = 1,
  maxAttempts = 3,
}: GenerationLoaderProps) {
  const stageDetails = STAGE_DETAILS[stage] || { title: stage, description: message };
  const randomFact = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
  const isComplete = stage === "complete";

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-8"
      >
        {/* Circular Progress Background */}
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
          {isComplete ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-16 h-16 text-green-500" />
            </motion.div>
          ) : (
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-12 h-12 text-primary mx-auto" />
              </motion.div>
              <div className="text-3xl font-bold text-primary mt-2">{percent}%</div>
            </div>
          )}
        </div>
        
        {/* Spinning ring */}
        {!isComplete && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        )}
      </motion.div>

      {/* Stage Info */}
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h3 className="text-xl font-semibold mb-2">{stageDetails.title}</h3>
        <p className="text-muted-foreground">{stageDetails.description}</p>
        
        {stage === "retry" && (
          <p className="text-sm text-amber-600 mt-2">
            Attempt {attempt} of {maxAttempts}
          </p>
        )}
      </motion.div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8">
        <Progress value={percent} className="h-2" />
      </div>

      {/* Fun Fact */}
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-md text-center"
        >
          <p className="text-xs text-muted-foreground italic">
            💡 {randomFact}
          </p>
        </motion.div>
      )}

      {/* Loading indicator */}
      {!isComplete && (
        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>This usually takes 30-60 seconds</span>
        </div>
      )}
    </div>
  );
}
