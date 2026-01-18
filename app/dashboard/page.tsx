"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVoiceProfiles } from "@/lib/context/VoiceProfileContext";
import { usePosts } from "@/lib/context/PostContext";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { PostCard } from "@/components/dashboard/PostCard";
import {
  Plus,
  Lightbulb,
  TrendingUp,
  FileText,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const { profiles, activeProfile, setActiveProfile } = useVoiceProfiles();
  const { posts, getPostsByProfile, deletePost } = usePosts();

  const filteredPosts = useMemo(() => {
    if (activeProfile) {
      return getPostsByProfile(activeProfile.id);
    }
    return posts;
  }, [activeProfile, posts, getPostsByProfile]);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredPosts]);

  const stats = useMemo(() => {
    const relevantPosts = filteredPosts;
    const totalPosts = relevantPosts.length;
    const avgScore = totalPosts > 0
      ? Math.round(relevantPosts.reduce((sum, p) => sum + p.quality.score, 0) / totalPosts)
      : 0;
    
    const now = new Date();
    const thisMonth = relevantPosts.filter(p => {
      const postDate = new Date(p.createdAt);
      return postDate.getMonth() === now.getMonth() && 
             postDate.getFullYear() === now.getFullYear();
    }).length;
    
    // Time saved: 13 min per post (15 min manual - 2 min with william.ai)
    const timeSavedMinutes = totalPosts * 13;
    const timeSavedHours = Math.round(timeSavedMinutes / 60 * 10) / 10;

    return { totalPosts, avgScore, thisMonth, timeSavedHours };
  }, [filteredPosts]);

  const handleProfileChange = (profileId: string) => {
    if (profileId === "all") {
      setActiveProfile(null);
    } else {
      const profile = profiles.find(p => p.id === profileId);
      if (profile) {
        setActiveProfile(profile);
      }
    }
  };

  // Empty state - no profiles
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
                <h2 className="text-2xl font-bold mb-4">Welcome to william.ai</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Create your first voice profile to start generating high-quality,
                  slop-free LinkedIn and Twitter content.
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
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your generated posts and voice profiles
            </p>
          </div>
          
          {/* Profile Selector */}
          <div className="flex items-center gap-4">
            <Select
              value={activeProfile?.id || "all"}
              onValueChange={handleProfileChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Profiles</SelectItem>
                {profiles.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <StatsOverview
            totalPosts={stats.totalPosts}
            avgScore={stats.avgScore}
            thisMonth={stats.thisMonth}
            timeSaved={stats.timeSavedHours}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/create/experience">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Experience Post</p>
                      <p className="text-sm text-muted-foreground">Share your story</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/create/pattern">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Pattern Post</p>
                      <p className="text-sm text-muted-foreground">Share observations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/voice-profile/new">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">New Profile</p>
                      <p className="text-sm text-muted-foreground">Add voice profile</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/create/carousel">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Create Carousel</p>
                      <p className="text-sm text-muted-foreground">Turn posts into slides</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* Recent Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Posts</h2>
            {sortedPosts.length > 0 && (
              <Badge variant="secondary">{sortedPosts.length} posts</Badge>
            )}
          </div>

          {sortedPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">No posts yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first post to see it here
                </p>
                <Link href="/create">
                  <Button>Create Post</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPosts.slice(0, 9).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <PostCard post={post} onDelete={deletePost} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
