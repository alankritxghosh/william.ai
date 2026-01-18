"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Edit2, Check, X } from "lucide-react";

export interface ExperienceInsight {
  insight: string;
  angle: string;
  hook: string;
  contrarian?: string;
}

export interface PatternInsight {
  pattern: string;
  blindSpot: string;
  urgency: string;
  proof?: string;
}

interface InsightExtractorProps {
  insight: ExperienceInsight | PatternInsight | null;
  flowType: "experience" | "pattern";
  loading: boolean;
  onEdit: (edited: ExperienceInsight | PatternInsight) => void;
}

export function InsightExtractor({ insight, flowType, loading, onEdit }: InsightExtractorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInsight, setEditedInsight] = useState(insight);

  const handleStartEdit = () => {
    setEditedInsight(insight);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedInsight) {
      onEdit(editedInsight);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedInsight(insight);
    setIsEditing(false);
  };

  const updateField = (field: string, value: string) => {
    if (editedInsight) {
      setEditedInsight({ ...editedInsight, [field]: value });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <CardTitle className="text-lg">Extracting Insights...</CardTitle>
          </div>
          <CardDescription>
            AI is analyzing your answers to find the unique angle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insight) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">AI-Extracted Insights</CardTitle>
            </div>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleSaveEdit}>
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            )}
          </div>
          <CardDescription>
            Review and refine these insights before generating your post
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {flowType === "experience" ? (
            // Experience Flow Insights
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-primary">Unique Angle</Label>
                {isEditing ? (
                  <Textarea
                    value={(editedInsight as ExperienceInsight)?.insight || ""}
                    onChange={(e) => updateField("insight", e.target.value)}
                    rows={2}
                    className="bg-white"
                  />
                ) : (
                  <p className="text-sm bg-white/50 p-3 rounded-lg">
                    {(insight as ExperienceInsight).insight}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-primary">Story Angle</Label>
                {isEditing ? (
                  <Textarea
                    value={(editedInsight as ExperienceInsight)?.angle || ""}
                    onChange={(e) => updateField("angle", e.target.value)}
                    rows={2}
                    className="bg-white"
                  />
                ) : (
                  <p className="text-sm bg-white/50 p-3 rounded-lg">
                    {(insight as ExperienceInsight).angle}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-primary">Emotional Hook</Label>
                {isEditing ? (
                  <Textarea
                    value={(editedInsight as ExperienceInsight)?.hook || ""}
                    onChange={(e) => updateField("hook", e.target.value)}
                    rows={2}
                    className="bg-white"
                  />
                ) : (
                  <p className="text-sm bg-white/50 p-3 rounded-lg">
                    {(insight as ExperienceInsight).hook}
                  </p>
                )}
              </div>

              {(insight as ExperienceInsight).contrarian && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-primary">Contrarian Element</Label>
                  {isEditing ? (
                    <Textarea
                      value={(editedInsight as ExperienceInsight)?.contrarian || ""}
                      onChange={(e) => updateField("contrarian", e.target.value)}
                      rows={2}
                      className="bg-white"
                    />
                  ) : (
                    <p className="text-sm bg-white/50 p-3 rounded-lg">
                      {(insight as ExperienceInsight).contrarian}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            // Pattern Flow Insights
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-primary">Pattern Claim</Label>
                {isEditing ? (
                  <Textarea
                    value={(editedInsight as PatternInsight)?.pattern || ""}
                    onChange={(e) => updateField("pattern", e.target.value)}
                    rows={2}
                    className="bg-white"
                  />
                ) : (
                  <p className="text-sm bg-white/50 p-3 rounded-lg">
                    {(insight as PatternInsight).pattern}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-primary">Blind Spot</Label>
                {isEditing ? (
                  <Textarea
                    value={(editedInsight as PatternInsight)?.blindSpot || ""}
                    onChange={(e) => updateField("blindSpot", e.target.value)}
                    rows={2}
                    className="bg-white"
                  />
                ) : (
                  <p className="text-sm bg-white/50 p-3 rounded-lg">
                    {(insight as PatternInsight).blindSpot}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-primary">Urgency/Timing</Label>
                {isEditing ? (
                  <Textarea
                    value={(editedInsight as PatternInsight)?.urgency || ""}
                    onChange={(e) => updateField("urgency", e.target.value)}
                    rows={2}
                    className="bg-white"
                  />
                ) : (
                  <p className="text-sm bg-white/50 p-3 rounded-lg">
                    {(insight as PatternInsight).urgency}
                  </p>
                )}
              </div>

              {(insight as PatternInsight).proof && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-primary">Data Points to Emphasize</Label>
                  {isEditing ? (
                    <Textarea
                      value={(editedInsight as PatternInsight)?.proof || ""}
                      onChange={(e) => updateField("proof", e.target.value)}
                      rows={2}
                      className="bg-white"
                    />
                  ) : (
                    <p className="text-sm bg-white/50 p-3 rounded-lg">
                      {(insight as PatternInsight).proof}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
