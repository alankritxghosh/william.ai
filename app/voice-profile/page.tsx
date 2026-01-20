"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVoiceProfiles } from "@/lib/context/VoiceProfileContext";
import { usePosts } from "@/lib/context/PostContext";
import { VoiceProfile } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils/date";
import {
  Plus,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Check,
  Sparkles,
  Linkedin,
  Twitter,
} from "lucide-react";

export default function VoiceProfileListPage() {
  const router = useRouter();
  const { profiles, activeProfile, setActiveProfile, deleteProfile, createProfile } = useVoiceProfiles();
  const { getPostsByProfile } = usePosts();
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleSetActive = (profile: VoiceProfile) => {
    setActiveProfile(profile);
    setOpenMenuId(null);
  };

  const handleDuplicate = async (profile: VoiceProfile) => {
    const duplicated = await createProfile({
      name: `${profile.name} (Copy)`,
      rules: { ...profile.rules },
      topPosts: [...profile.topPosts],
      brandColors: { ...profile.brandColors },
    });
    setOpenMenuId(null);
    if (duplicated) {
      router.push(`/voice-profile/${duplicated.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProfile(id);
    setDeleteConfirmId(null);
  };

  const getProfileStats = (profile: VoiceProfile) => {
    const posts = getPostsByProfile(profile.id);
    return {
      postCount: posts.length,
      lastUsed: profile.stats?.lastUsed || profile.updatedAt,
    };
  };

  // Empty state
  if (profiles.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-4">No Voice Profiles Yet</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Create your first voice profile to start generating personalized,
                  slop-free content that sounds like you.
                </p>
                <Link href="/voice-profile/new">
                  <Button size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Voice Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Voice Profiles</h1>
            <p className="text-muted-foreground">
              Manage your writing styles and voice settings
            </p>
          </div>
          <Link href="/voice-profile/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Profile
            </Button>
          </Link>
        </div>

        {/* Profiles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile, index) => {
            const stats = getProfileStats(profile);
            const isActive = activeProfile?.id === profile.id;
            
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`relative hover:shadow-lg transition-all cursor-pointer ${
                    isActive ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{profile.name}</CardTitle>
                      
                      {/* Actions Menu */}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === profile.id ? null : profile.id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        
                        {openMenuId === profile.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-50">
                            <div className="py-1">
                              {!isActive && (
                                <button
                                  onClick={() => handleSetActive(profile)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                >
                                  <Check className="w-4 h-4" />
                                  Set as Active
                                </button>
                              )}
                              <Link href={`/voice-profile/${profile.id}`}>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                              </Link>
                              <button
                                onClick={() => handleDuplicate(profile)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                              >
                                <Copy className="w-4 h-4" />
                                Duplicate
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirmId(profile.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Platform Badges */}
                    <div className="flex gap-2 mt-2">
                      {profile.topPosts.some(p => p.platform === "linkedin") && (
                        <Badge variant="secondary" className="gap-1">
                          <Linkedin className="w-3 h-3" />
                          LinkedIn
                        </Badge>
                      )}
                      {profile.topPosts.some(p => p.platform === "twitter") && (
                        <Badge variant="secondary" className="gap-1">
                          <Twitter className="w-3 h-3" />
                          Twitter
                        </Badge>
                      )}
                      {profile.topPosts.length === 0 && (
                        <Badge variant="outline">No platforms set</Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{stats.postCount} posts</span>
                      <span>Updated {formatRelativeTime(stats.lastUsed)}</span>
                    </div>

                    {/* Rules Count */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Voice rules</span>
                        <span className="font-medium">
                          {profile.rules.sentencePatterns.length +
                            profile.rules.forbiddenWords.length +
                            profile.rules.signaturePhrases.length}
                        </span>
                      </div>
                    </div>

                    {/* Color Preview */}
                    <div className="mt-3 flex gap-2">
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: profile.brandColors.primary }}
                        title="Primary"
                      />
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: profile.brandColors.secondary }}
                        title="Secondary"
                      />
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: profile.brandColors.accent }}
                        title="Accent"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Voice Profile</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this voice profile? This action cannot be undone.
                Any posts created with this profile will remain, but the profile settings will be lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Click outside to close menu */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  );
}
