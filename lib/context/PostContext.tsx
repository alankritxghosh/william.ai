"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { GeneratedPost } from "@/lib/types";
import { loadPosts as loadFromLocalStorage, savePosts as saveToLocalStorage } from "@/lib/utils/storage";
import { createClient } from "@/lib/supabase/client";
import {
  fetchGeneratedPosts,
  createGeneratedPost as createPostInDb,
  updateGeneratedPost as updatePostInDb,
  deleteGeneratedPost as deletePostFromDb,
} from "@/lib/supabase/database";
import { useVoiceProfiles } from "./VoiceProfileContext";

/**
 * Extended context type with loading and error states
 */
export interface PostContextType {
  posts: GeneratedPost[];
  isLoading: boolean;
  error: string | null;
  addPost: (post: GeneratedPost) => Promise<void>;
  updatePost: (id: string, updates: Partial<GeneratedPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  getPostsByProfile: (profileId: string) => GeneratedPost[];
  refreshPosts: () => Promise<void>;
}

const PostContext = createContext<PostContextType | null>(null);

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const supabase = createClient();
  const { profiles, isLoading: profilesLoading } = useVoiceProfiles();

  /**
   * Load posts from Supabase or localStorage
   */
  const loadPosts = useCallback(async () => {
    // Wait for profiles to load first (needed to map voice_profile_id to profile)
    if (profilesLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);

        // Fetch from Supabase
        const { data, error: fetchError } = await fetchGeneratedPosts(profiles);
        
        if (fetchError) {
          console.error("[PostContext] Supabase fetch error:", fetchError);
          // Fall back to localStorage
          const localPosts = loadFromLocalStorage();
          setPosts(localPosts);
          setError("Using offline data. Changes may not sync.");
        } else {
          setPosts(data);
          // Also update localStorage as cache
          saveToLocalStorage(data);
        }
      } else {
        setIsAuthenticated(false);
        // Not authenticated - use localStorage only
        const localPosts = loadFromLocalStorage();
        setPosts(localPosts);
      }
    } catch (err) {
      console.error("[PostContext] Load error:", err);
      // Fall back to localStorage
      const localPosts = loadFromLocalStorage();
      setPosts(localPosts);
      setError("Failed to load posts. Using offline data.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, profiles, profilesLoading]);

  // Load posts when profiles are ready
  useEffect(() => {
    if (!profilesLoading) {
      loadPosts();
    }
  }, [profilesLoading, loadPosts]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          await loadPosts();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadPosts]);

  /**
   * Add a new post
   */
  const addPost = useCallback(async (post: GeneratedPost) => {
    setError(null);

    // Optimistic update
    setPosts(prev => [...prev, post]);

    if (isAuthenticated) {
      // Create in Supabase
      const { error: createError } = await createPostInDb(post);
      
      if (createError) {
        console.error("[PostContext] Create error:", createError);
        setError("Failed to save post. Will retry.");
        // Post is already in UI, it will be saved to localStorage
      }
    }

    // Update localStorage cache
    saveToLocalStorage([...posts, post]);
  }, [isAuthenticated, posts]);

  /**
   * Update a post
   */
  const updatePost = useCallback(async (id: string, updates: Partial<GeneratedPost>) => {
    setError(null);

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    }));

    if (isAuthenticated) {
      // Update in Supabase (only status fields are updatable)
      const { error: updateError } = await updatePostInDb(id, {
        status: updates.status,
        exportedAt: updates.exportedAt,
        scheduledFor: updates.scheduledFor,
        failureReason: updates.failureReason,
      });
      
      if (updateError) {
        console.error("[PostContext] Update error:", updateError);
        setError("Failed to save changes.");
      }
    }

    // Update localStorage cache
    const updatedPosts = posts.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    saveToLocalStorage(updatedPosts);
  }, [isAuthenticated, posts]);

  /**
   * Delete a post
   */
  const deletePost = useCallback(async (id: string) => {
    setError(null);

    // Optimistic update
    setPosts(prev => prev.filter(p => p.id !== id));

    if (isAuthenticated) {
      // Delete from Supabase
      const { error: deleteError } = await deletePostFromDb(id);
      
      if (deleteError) {
        console.error("[PostContext] Delete error:", deleteError);
        setError("Failed to delete post.");
      }
    }

    // Update localStorage cache
    saveToLocalStorage(posts.filter(p => p.id !== id));
  }, [isAuthenticated, posts]);

  /**
   * Get posts by voice profile ID
   */
  const getPostsByProfile = useCallback((profileId: string) => {
    return posts.filter(p => p.voiceProfileId === profileId);
  }, [posts]);

  /**
   * Refresh posts from server
   */
  const refreshPosts = useCallback(async () => {
    await loadPosts();
  }, [loadPosts]);

  return (
    <PostContext.Provider
      value={{
        posts,
        isLoading,
        error,
        addPost,
        updatePost,
        deletePost,
        getPostsByProfile,
        refreshPosts,
      }}
    >
      {children}
    </PostContext.Provider>
  );
}

export function usePosts(): PostContextType {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error("usePosts must be used within a PostProvider");
  }
  return context;
}
