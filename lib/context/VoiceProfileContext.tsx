"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { VoiceProfile } from "@/lib/types";
import { 
  loadVoiceProfiles as loadFromLocalStorage, 
  saveVoiceProfiles as saveToLocalStorage, 
  getActiveProfileId, 
  setActiveProfileId,
  generateId 
} from "@/lib/utils/storage";
import { createClient } from "@/lib/supabase/client";
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

export function VoiceProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<VoiceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  /**
   * Load profiles from Supabase or localStorage
   */
  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
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

      // Restore active profile
      const activeId = getActiveProfileId();
      if (activeId) {
        const active = profiles.find(p => p.id === activeId);
        if (active) {
          setActiveProfileState(active);
        }
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
  }, [supabase]);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          await loadProfiles();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadProfiles]);

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

      setProfiles(prev => [...prev, data]);
      saveToLocalStorage([...profiles, data]); // Update cache
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
  }, [isAuthenticated, profiles]);

  /**
   * Update a voice profile
   */
  const updateProfile = useCallback(async (id: string, updates: Partial<VoiceProfile>) => {
    setError(null);

    // Optimistic update
    setProfiles(prev => prev.map(p => {
      if (p.id === id) {
        const updated = {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        // Update active profile if it's the one being updated
        if (activeProfile?.id === id) {
          setActiveProfileState(updated);
        }
        return updated;
      }
      return p;
    }));

    if (isAuthenticated) {
      // Update in Supabase
      const { error: updateError } = await updateProfileInDb(id, updates);
      
      if (updateError) {
        console.error("[VoiceProfile] Update error:", updateError);
        setError("Failed to save changes. Will retry.");
        // Revert would require storing previous state - for now, just log
      }
    }

    // Update localStorage cache
    saveToLocalStorage(profiles);
  }, [isAuthenticated, profiles, activeProfile]);

  /**
   * Delete a voice profile
   */
  const deleteProfile = useCallback(async (id: string) => {
    setError(null);

    // Optimistic update
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (activeProfile?.id === id) {
      setActiveProfile(null);
    }

    if (isAuthenticated) {
      // Delete from Supabase
      const { error: deleteError } = await deleteProfileFromDb(id);
      
      if (deleteError) {
        console.error("[VoiceProfile] Delete error:", deleteError);
        setError("Failed to delete profile");
        // Could revert, but profile is already removed from UI
      }
    }

    // Update localStorage cache
    saveToLocalStorage(profiles.filter(p => p.id !== id));
  }, [isAuthenticated, profiles, activeProfile, setActiveProfile]);

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
