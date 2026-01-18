"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react";

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  canProceed?: boolean;
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
  canProceed = true,
}: NavigationButtonsProps) {
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 0;

  return (
    <div className="flex justify-between items-center pt-6 border-t">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={isFirstStep || isSubmitting}
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {isLastStep ? (
        <Button
          onClick={onSubmit}
          disabled={!canProceed || isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Post
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
}
