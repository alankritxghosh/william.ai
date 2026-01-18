"use client";

import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface QuestionCardProps {
  questionNumber: number;
  questionText: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  minLength?: number;
}

export function QuestionCard({
  questionNumber,
  questionText,
  value,
  onChange,
  error,
  placeholder,
  minLength = 20,
}: QuestionCardProps) {
  const charCount = value.length;
  const isValid = charCount >= minLength;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
          {questionNumber}
        </div>
        <div className="flex-1">
          <Label className="text-lg font-semibold leading-relaxed">
            {questionText}
          </Label>
        </div>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Type your answer here..."}
        rows={6}
        className={`text-base ${error ? "border-destructive" : ""}`}
        autoFocus
      />

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {charCount} characters
          {!isValid && (
            <span className="text-destructive ml-2">
              (min {minLength})
            </span>
          )}
        </div>
        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}
      </div>
    </motion.div>
  );
}
