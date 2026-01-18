"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { GeneratedPost, PostContextType } from "@/lib/types";
import { loadPosts, savePosts } from "@/lib/utils/storage";

const PostContext = createContext<PostContextType | null>(null);

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load posts from localStorage on mount
  useEffect(() => {
    const loadedPosts = loadPosts();
    setPosts(loadedPosts);
    setIsLoaded(true);
  }, []);

  // Save posts to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      savePosts(posts);
    }
  }, [posts, isLoaded]);

  const addPost = useCallback((post: GeneratedPost) => {
    setPosts(prev => [...prev, post]);
  }, []);

  const updatePost = useCallback((id: string, updates: Partial<GeneratedPost>) => {
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
  }, []);

  const deletePost = useCallback((id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  const getPostsByProfile = useCallback((profileId: string) => {
    return posts.filter(p => p.voiceProfileId === profileId);
  }, [posts]);

  return (
    <PostContext.Provider
      value={{
        posts,
        addPost,
        updatePost,
        deletePost,
        getPostsByProfile,
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
