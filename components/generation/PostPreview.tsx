"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneratedPost } from "@/lib/types";
import { getScoreBadgeVariant } from "@/lib/guardrails/quality-gates";
import { formatThreadForCopy } from "@/lib/utils/platform-converter";
import { toast } from "@/hooks/use-toast";
import { 
  Copy, 
  Download, 
  Twitter, 
  Linkedin, 
  Check,
  Edit,
  Eye,
} from "lucide-react";

interface PostPreviewProps {
  post: GeneratedPost;
  onUpdate?: (content: string) => void;
}

export function PostPreview({ post, onUpdate }: PostPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.outputs.linkedin.post);
  const [copiedPlatform, setCopiedPlatform] = useState<"linkedin" | "twitter" | null>(null);

  const handleCopy = async (platform: "linkedin" | "twitter") => {
    const content = platform === "linkedin" 
      ? editedContent 
      : formatThreadForCopy(post.outputs.twitter.thread);
    
    await navigator.clipboard.writeText(content);
    setCopiedPlatform(platform);
    
    toast({
      title: "Copied!",
      description: `${platform === "linkedin" ? "LinkedIn" : "Twitter"} content copied to clipboard`,
    });
    
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const handleDownload = (platform: "linkedin" | "twitter") => {
    const content = platform === "linkedin" 
      ? editedContent 
      : formatThreadForCopy(post.outputs.twitter.thread);
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `post_${platform}_${post.quality.score}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Post saved to file",
    });
  };

  const handleSaveEdit = () => {
    onUpdate?.(editedContent);
    setIsEditing(false);
    toast({
      title: "Saved!",
      description: "Your edits have been saved",
    });
  };

  const scoreVariant = getScoreBadgeVariant(post.quality.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Generated Post</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={scoreVariant}>
              Score: {post.quality.score}/100
            </Badge>
            {post.quality.passedGates ? (
              <Badge variant="green">Passed</Badge>
            ) : (
              <Badge variant="destructive">Issues Found</Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="linkedin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="linkedin" className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </TabsTrigger>
              <TabsTrigger value="twitter" className="flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                Twitter Thread
              </TabsTrigger>
            </TabsList>

            <TabsContent value="linkedin" className="space-y-4">
              {/* Edit/View Toggle */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>

              {/* Content */}
              {isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
              ) : (
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                  {editedContent}
                </div>
              )}

              {/* Character Count */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{editedContent.length} characters</span>
                <span>
                  {editedContent.length > 3000 ? (
                    <span className="text-destructive">Exceeds LinkedIn limit</span>
                  ) : (
                    `${3000 - editedContent.length} remaining`
                  )}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isEditing && (
                  <Button onClick={handleSaveEdit}>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleCopy("linkedin")}
                >
                  {copiedPlatform === "linkedin" ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  Copy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownload("linkedin")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="twitter" className="space-y-4">
              {/* Thread Preview */}
              <div className="space-y-3">
                {post.outputs.twitter.thread.map((tweet, i) => (
                  <div key={i} className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs">
                        Tweet {i + 1}/{post.outputs.twitter.thread.length}
                      </Badge>
                      <span className={`text-xs ${tweet.length > 280 ? "text-destructive" : "text-muted-foreground"}`}>
                        {tweet.length}/280
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{tweet}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopy("twitter")}
                >
                  {copiedPlatform === "twitter" ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  Copy Thread
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownload("twitter")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Quality Details (Collapsible) */}
          <details className="mt-6">
            <summary className="text-sm font-medium cursor-pointer hover:text-primary">
              Quality Details & Pipeline Stages
            </summary>
            <div className="mt-4 space-y-4 text-sm">
              {/* Specificity */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">Specificity</p>
                <p className="text-muted-foreground">
                  {post.quality.specificityCount} specific details found
                </p>
              </div>
              
              {/* Slop Detection */}
              {post.quality.slopDetected.length > 0 && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="font-medium mb-1 text-destructive">Slop Detected</p>
                  <p className="text-sm">{post.quality.slopDetected.join(", ")}</p>
                </div>
              )}

              {/* Pipeline Stages */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">Generation Stages</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✓ Generated {post.pipeline.initialVersions?.length || 5} versions</li>
                  <li>✓ Selected best version</li>
                  <li>✓ Refined: {post.pipeline.refinementChanges?.length || 0} changes</li>
                  <li>✓ Hook optimized from {post.pipeline.hookOptions?.length || 3} options</li>
                  <li>✓ Personality injected: {post.pipeline.injectedElements?.length || 0} elements</li>
                </ul>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>
    </motion.div>
  );
}
