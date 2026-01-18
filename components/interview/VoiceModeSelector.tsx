"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceModeId } from "@/lib/types";
import { VOICE_MODE_LIST } from "@/data/voice-modes";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface VoiceModeSelectorProps {
  selectedMode: VoiceModeId | null;
  onSelect: (modeId: VoiceModeId) => void;
}

export function VoiceModeSelector({
  selectedMode,
  onSelect,
}: VoiceModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Select Your Voice Mode</h2>
        <p className="text-muted-foreground">
          Choose the style that best matches the content you want to create
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {VOICE_MODE_LIST.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg relative",
                selectedMode === mode.id
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "hover:border-primary/50"
              )}
              onClick={() => onSelect(mode.id)}
            >
              {selectedMode === mode.id && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="text-3xl mb-2">{mode.emoji}</div>
                <CardTitle className="text-lg">{mode.name}</CardTitle>
                <CardDescription className="text-sm">
                  {mode.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Best for:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {mode.suggestedFor.slice(0, 2).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
