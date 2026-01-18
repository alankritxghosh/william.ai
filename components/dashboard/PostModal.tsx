"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneratedPost } from "@/lib/types";
import { usePosts } from "@/lib/context/PostContext";
import { formatRelativeTime } from "@/lib/utils/date";
import { getScoreBadgeVariant } from "@/lib/guardrails/quality-gates";
import { exportToCSV, exportToJSON } from "@/lib/utils/csv-exporter";
import {
  Edit2,
  Save,
  X,
  Copy,
  Download,
  Linkedin,
  Twitter,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface PostModalProps {
  post: GeneratedPost | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function PostModal({ post, isOpen, onClose, onDelete }: PostModalProps) {
  const { updatePost } = usePosts();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"linkedin" | "twitter">("linkedin");
  const [showQualityDetails, setShowQualityDetails] = useState(false);

  const getPostContent = (p: GeneratedPost) => {
    return p.outputs?.linkedin?.post || p.pipeline?.finalVersion || "";
  };

  const getScore = (p: GeneratedPost) => {
    return p.quality?.score || 0;
  };

  const getTwitterThread = (p: GeneratedPost) => {
    return p.outputs?.twitter?.thread || [];
  };

  useEffect(() => {
    if (post) {
      setEditedContent(getPostContent(post));
    }
  }, [post]);

  if (!post) return null;

  const handleSave = () => {
    updatePost(post.id, { 
      outputs: {
        ...post.outputs,
        linkedin: {
          ...post.outputs.linkedin,
          post: editedContent,
          characterCount: editedContent.length,
        }
      }
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(getPostContent(post));
    setIsEditing(false);
  };

  const handleCopy = async () => {
    const content = getPostContent(post);
    const thread = getTwitterThread(post);
    const textToCopy = activeTab === "linkedin" 
      ? content 
      : thread.map((t, i) => `${i + 1}/${thread.length} ${t}`).join("\n\n") || content;
    
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    exportToCSV([post], `post-${post.id}.csv`);
  };

  const handleExportJSON = () => {
    exportToJSON([post], `post-${post.id}.json`);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(post.id);
    }
    onClose();
  };

  const score = getScore(post);
  const scoreVariant = score ? getScoreBadgeVariant(score) : "default";
  const content = getPostContent(post);
  const twitterThread = getTwitterThread(post);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Post Details</DialogTitle>
            <div className="flex items-center gap-2">
              {score > 0 && (
                <Badge 
                  variant={scoreVariant === "gold" ? "default" : scoreVariant === "green" ? "secondary" : scoreVariant === "yellow" ? "outline" : "destructive"}
                  className={scoreVariant === "gold" ? "bg-yellow-500" : scoreVariant === "green" ? "bg-green-500 text-white" : ""}
                >
                  Score: {score}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Platform Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "linkedin" | "twitter")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="linkedin" className="flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger value="twitter" className="flex items-center gap-2">
              <Twitter className="w-4 h-4" />
              Twitter Thread
            </TabsTrigger>
          </TabsList>

          <TabsContent value="linkedin" className="mt-4">
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[300px] resize-none"
              />
            ) : (
              <div className="bg-muted/30 rounded-lg p-4 min-h-[200px] whitespace-pre-wrap">
                {content}
              </div>
            )}
          </TabsContent>

          <TabsContent value="twitter" className="mt-4">
            {twitterThread.length > 0 ? (
              <div className="space-y-3">
                {twitterThread.map((tweet, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-muted/30 rounded-lg p-4 relative"
                  >
                    <span className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <p className="whitespace-pre-wrap">{tweet}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Twitter thread not generated for this post
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quality Details */}
        {post.quality && (
          <div className="mt-4">
            <button
              onClick={() => setShowQualityDetails(!showQualityDetails)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {showQualityDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Quality Report Details
            </button>
            
            {showQualityDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
              >
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm font-medium">Overall Score</span>
                  <Badge variant="secondary" className="text-xs">
                    {post.quality.score}/100
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm font-medium">Voice Similarity</span>
                  <Badge variant="secondary" className="text-xs">
                    {post.quality.similarityScore}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm font-medium">Specificity Count</span>
                  <Badge variant="secondary" className="text-xs">
                    {post.quality.specificityCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm font-medium">Gates Passed</span>
                  <Badge variant={post.quality.passedGates ? "secondary" : "destructive"} className="text-xs">
                    {post.quality.passedGates ? "Yes" : "No"}
                  </Badge>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Export Dropdown */}
            <div className="relative group">
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button
                  onClick={handleExportCSV}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-muted"
                >
                  Export as CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-muted"
                >
                  Export as JSON
                </button>
              </div>
            </div>

            {onDelete && (
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
