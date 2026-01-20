"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { VoiceProfile } from "@/lib/types";
import { 
  loadVoiceProfiles as loadFromLocalStorage, 
  saveVoiceProfiles as saveToLocalStorage, 
  getActiveProfileId, 
  setActiveProfileId,
  generateId 
} from "@/lib/utils/storage";
import {
  fetchVoiceProfiles,
  createVoiceProfile as createProfileInDb,
  updateVoiceProfile as updateProfileInDb,
  deleteVoiceProfile as deleteProfileFromDb,
} from "@/lib/supabase/database";

/**
 * Extended context type with loading and error states
 */
export interface VoiceProfileContextType {
  profiles: VoiceProfile[];
  activeProfile: VoiceProfile | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  setActiveProfile: (profile: VoiceProfile | null) => void;
  createProfile: (profile: Omit<VoiceProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VoiceProfile | null>;
  updateProfile: (id: string, updates: Partial<VoiceProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const VoiceProfileContext = createContext<VoiceProfileContextType | null>(null);

/**
 * Safely get Supabase client (returns null if not configured)
 */
function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return null; // SSR - no client
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  try {
    // Dynamic import to avoid issues during build
    const { createBrowserClient } = require("@supabase/ssr");
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch {
    return null;
  }
}

export function VoiceProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<VoiceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<any>(null);
  const initRef = useRef(false);

  // Initialize Supabase client on mount (client-side only)
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      const client = getSupabaseClient();
      setSupabaseClient(client);
    }
  }, []);

  /**
   * Load profiles from Supabase or localStorage
   */
  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (supabaseClient) {
        // Check if user is authenticated
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (user) {
          setIsAuthenticated(true);
          setUserId(user.id);

          // Fetch from Supabase
          const { data, error: fetchError } = await fetchVoiceProfiles();
          
          if (fetchError) {
            console.error("[VoiceProfile] Supabase fetch error:", fetchError);
            // Fall back to localStorage
            const localProfiles = loadFromLocalStorage();
            setProfiles(localProfiles);
            setError("Using offline data. Changes may not sync.");
          } else {
            setProfiles(data);
            // Also update localStorage as cache
            saveToLocalStorage(data);
          }
        } else {
          setIsAuthenticated(false);
          setUserId(null);
          // Not authenticated - use localStorage only
          const localProfiles = loadFromLocalStorage();
          setProfiles(localProfiles);
        }
      } else {
        // No Supabase client - use localStorage only
        setIsAuthenticated(false);
        setUserId(null);
        const localProfiles = loadFromLocalStorage();
        setProfiles(localProfiles);
      }

      // Restore active profile
      const activeId = getActiveProfileId();
      if (activeId) {
        // We need to use the current profiles, not stale closure
        setProfiles(currentProfiles => {
          const active = currentProfiles.find(p => p.id === activeId);
          if (active) {
            setActiveProfileState(active);
          }
          return currentProfiles;
        });
      }
    } catch (err) {
      console.error("[VoiceProfile] Load error:", err);
      // Fall back to localStorage
      const localProfiles = loadFromLocalStorage();
      setProfiles(localProfiles);
      setError("Failed to load profiles. Using offline data.");
    } finally {
      setIsLoading(false);
    }
  }, [supabaseClient]);

  // Load profiles when Supabase client is ready
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Listen for auth state changes
  useEffect(() => {
    if (!supabaseClient) return;

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event: string) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          await loadProfiles();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient, loadProfiles]);

  // Update active profile when profiles change
  useEffect(() => {
    const activeId = getActiveProfileId();
    if (activeId) {
      const active = profiles.find(p => p.id === activeId);
      setActiveProfileState(active || null);
    }
  }, [profiles]);

  /**
   * Set the active profile
   */
  const setActiveProfile = useCallback((profile: VoiceProfile | null) => {
    setActiveProfileState(profile);
    setActiveProfileId(profile?.id || null);
  }, []);

  /**
   * Create a new voice profile
   */
  const createProfile = useCallback(async (
    profileData: Omit<VoiceProfile, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<VoiceProfile | null> => {
    setError(null);

    if (isAuthenticated) {
      // Create in Supabase
      const { data, error: createError } = await createProfileInDb(profileData);
      
      if (createError || !data) {
        console.error("[VoiceProfile] Create error:", createError);
        setError("Failed to create profile");
        return null;
      }

      setProfiles(prev => {
        const updated = [...prev, data];
        saveToLocalStorage(updated);
        return updated;
      });
      return data;
    } else {
      // Create locally
      const now = new Date().toISOString();
      const newProfile: VoiceProfile = {
        ...profileData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      
      setProfiles(prev => {
        const updated = [...prev, newProfile];
        saveToLocalStorage(updated);
        return updated;
      });
      return newProfile;
    }
  }, [isAuthenticated]);

  /**
   * Update a voice profile
   */
  const updateProfile = useCallback(async (id: string, updates: Partial<VoiceProfile>) => {
    setError(null);

    // Optimistic update
    setProfiles(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          const updatedProfile = {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          // Update active profile if it's the one being updated
          if (activeProfile?.id === id) {
            setActiveProfileState(updatedProfile);
          }
          return updatedProfile;
        }
        return p;
      });
      saveToLocalStorage(updated);
      return updated;
    });

    if (isAuthenticated) {
      // Update in Supabase
      const { error: updateError } = await updateProfileInDb(id, updates);
      
      if (updateError) {
        console.error("[VoiceProfile] Update error:", updateError);
        setError("Failed to save changes. Will retry.");
      }
    }
  }, [isAuthenticated, activeProfile]);

  /**
   * Delete a voice profile
   */
  const deleteProfile = useCallback(async (id: string) => {
    setError(null);

    // Optimistic update
    setProfiles(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveToLocalStorage(updated);
      return updated;
    });
    
    if (activeProfile?.id === id) {
      setActiveProfile(null);
    }

    if (isAuthenticated) {
      // Delete from Supabase
      const { error: deleteError } = await deleteProfileFromDb(id);
      
      if (deleteError) {
        console.error("[VoiceProfile] Delete error:", deleteError);
        setError("Failed to delete profile");
      }
    }
  }, [isAuthenticated, activeProfile, setActiveProfile]);

  /**
   * Refresh profiles from server
   */
  const refreshProfiles = useCallback(async () => {
    await loadProfiles();
  }, [loadProfiles]);

  return (
    <VoiceProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        isLoading,
        error,
        isAuthenticated,
        setActiveProfile,
        createProfile,
        updateProfile,
        deleteProfile,
        refreshProfiles,
      }}
    >
      {children}
    </VoiceProfileContext.Provider>
  );
}

export function useVoiceProfiles(): VoiceProfileContextType {
  const context = useContext(VoiceProfileContext);
  if (!context) {
    throw new Error("useVoiceProfiles must be used within a VoiceProfileProvider");
  }
  return context;
}
