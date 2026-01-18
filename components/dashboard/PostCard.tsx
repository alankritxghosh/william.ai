"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GeneratedPost } from "@/lib/types";
import { getScoreBadgeVariant } from "@/lib/guardrails/quality-gates";
import { exportToCSV, exportToJSON } from "@/lib/utils/csv-exporter";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "@/lib/utils/date";
import {
  Copy,
  Trash2,
  Eye,
  Linkedin,
  Check,
  MoreVertical,
  Download,
  Edit2,
  FileText,
  FileJson,
} from "lucide-react";

interface PostCardProps {
  post: GeneratedPost;
  onDelete: (id: string) => void;
  onClick?: () => void;
}

export function PostCard({ post, onDelete, onClick }: PostCardProps) {
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Handle different post structures
  const getPostContent = () => {
    if (post.outputs?.linkedin?.post) return post.outputs.linkedin.post;
    if (post.pipeline?.finalVersion) return post.pipeline.finalVersion;
    return "";
  };

  const getPostScore = () => {
    return post.quality?.score || 0;
  };

  const getCharacterCount = () => {
    return post.outputs?.linkedin?.characterCount || getPostContent().length;
  };

  const getTweetCount = () => {
    return post.outputs?.twitter?.thread?.length || 0;
  };

  const content = getPostContent();
  const score = getPostScore();
  const preview = content.slice(0, 150) + (content.length > 150 ? "..." : "");
  const scoreVariant = getScoreBadgeVariant(score);

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Post copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    onDelete(post.id);
    setShowDeleteDialog(false);
    toast({
      title: "Deleted",
      description: "Post has been removed",
    });
  };

  const handleExportCSV = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportToCSV([post], `post-${post.id}.csv`);
    toast({
      title: "Exported",
      description: "Post exported as CSV",
    });
  };

  const handleExportJSON = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportToJSON([post], `post-${post.id}.json`);
    toast({
      title: "Exported",
      description: "Post exported as JSON",
    });
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt));

  return (
    <Card 
      className="flex flex-col hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="pt-6 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge 
              variant={scoreVariant === "gold" ? "default" : scoreVariant === "green" ? "secondary" : scoreVariant === "yellow" ? "outline" : "destructive"}
              className={scoreVariant === "gold" ? "bg-yellow-500" : scoreVariant === "green" ? "bg-green-500 text-white" : ""}
            >
              {score}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Linkedin className="w-3 h-3 mr-1" />
              LinkedIn
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Preview */}
        <p className="text-sm text-muted-foreground line-clamp-4 mb-3">
          {preview}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{getCharacterCount()} chars</span>
          <span>•</span>
          <span>{getTweetCount()} tweets</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        {/* View */}
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>

        {/* Copy */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Download className="w-4 h-4 mr-2" />
                Export
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON}>
                  <FileJson className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this post? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
