"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { VoiceModeId } from "@/lib/types";
import { VOICE_MODES } from "@/data/voice-modes";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  flowType: "experience" | "pattern";
  voiceModeId?: VoiceModeId;
}

export function ProgressBar({
  currentStep,
  totalSteps,
  flowType,
  voiceModeId,
}: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;
  const voiceMode = voiceModeId ? VOICE_MODES[voiceModeId] : null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {flowType === "experience" ? "Personal Experience" : "Pattern Recognition"}
          </Badge>
          {voiceMode && (
            <Badge variant="outline">
              {voiceMode.emoji} {voiceMode.name}
            </Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {currentStep} / {totalSteps}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
