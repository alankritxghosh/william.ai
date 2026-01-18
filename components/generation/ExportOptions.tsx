"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GeneratedPost } from "@/lib/types";
import { exportSinglePostToCSV, exportPostsToJSON } from "@/lib/utils/csv-exporter";
import { formatThreadForCopy } from "@/lib/utils/platform-converter";
import { toast } from "@/hooks/use-toast";
import {
  Copy,
  Download,
  FileSpreadsheet,
  FileJson,
  Share2,
  Check,
  Twitter,
  Linkedin,
} from "lucide-react";

interface ExportOptionsProps {
  post: GeneratedPost;
}

export function ExportOptions({ post }: ExportOptionsProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = async (type: "linkedin" | "twitter") => {
    const content = type === "linkedin"
      ? post.outputs.linkedin.post
      : formatThreadForCopy(post.outputs.twitter.thread);
    
    await navigator.clipboard.writeText(content);
    setCopied(type);
    
    toast({
      title: "Copied!",
      description: `${type === "linkedin" ? "LinkedIn post" : "Twitter thread"} copied to clipboard`,
    });
    
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadText = (platform: "linkedin" | "twitter") => {
    const content = platform === "linkedin"
      ? post.outputs.linkedin.post
      : formatThreadForCopy(post.outputs.twitter.thread);
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `post_${platform}_score${post.quality.score}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: `${platform === "linkedin" ? "LinkedIn" : "Twitter"} post saved`,
    });
  };

  const handleExportCSV = () => {
    exportSinglePostToCSV(post);
    toast({
      title: "Exported!",
      description: "CSV file downloaded for scheduling",
    });
    setIsOpen(false);
  };

  const handleExportJSON = () => {
    exportPostsToJSON([post]);
    toast({
      title: "Exported!",
      description: "JSON backup downloaded",
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Share2 className="w-4 h-4 mr-2" />
          Export Options
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Post</DialogTitle>
          <DialogDescription>
            Choose how you want to export this post
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* LinkedIn Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleCopy("linkedin")}
              >
                {copied === "linkedin" ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleDownloadText("linkedin")}
              >
                <Download className="w-4 h-4 mr-2" />
                .txt
              </Button>
            </div>
          </div>

          {/* Twitter Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Twitter className="w-4 h-4" />
              Twitter Thread
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleCopy("twitter")}
              >
                {copied === "twitter" ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copy Thread
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleDownloadText("twitter")}
              >
                <Download className="w-4 h-4 mr-2" />
                .txt
              </Button>
            </div>
          </div>

          {/* Bulk Export Section */}
          <div className="pt-4 border-t space-y-2">
            <h4 className="text-sm font-medium">For Scheduling Tools</h4>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={handleExportCSV}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={handleExportJSON}
              >
                <FileJson className="w-4 h-4 mr-2" />
                Backup JSON
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
