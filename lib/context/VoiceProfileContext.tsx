"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { VoiceProfile, VoiceProfileContextType } from "@/lib/types";
import { 
  loadVoiceProfiles, 
  saveVoiceProfiles, 
  getActiveProfileId, 
  setActiveProfileId,
  generateId 
} from "@/lib/utils/storage";

const VoiceProfileContext = createContext<VoiceProfileContextType | null>(null);

export function VoiceProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<VoiceProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load profiles from localStorage on mount
  useEffect(() => {
    const loadedProfiles = loadVoiceProfiles();
    setProfiles(loadedProfiles);
    
    const activeId = getActiveProfileId();
    if (activeId) {
      const active = loadedProfiles.find(p => p.id === activeId);
      if (active) {
        setActiveProfileState(active);
      }
    }
    
    setIsLoaded(true);
  }, []);

  // Save profiles to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveVoiceProfiles(profiles);
    }
  }, [profiles, isLoaded]);

  const setActiveProfile = useCallback((profile: VoiceProfile | null) => {
    setActiveProfileState(profile);
    setActiveProfileId(profile?.id || null);
  }, []);

  const createProfile = useCallback((profileData: Omit<VoiceProfile, 'id' | 'createdAt' | 'updatedAt'>): VoiceProfile => {
    const now = new Date().toISOString();
    const newProfile: VoiceProfile = {
      ...profileData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    
    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  }, []);

  const updateProfile = useCallback((id: string, updates: Partial<VoiceProfile>) => {
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
  }, [activeProfile]);

  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (activeProfile?.id === id) {
      setActiveProfile(null);
    }
  }, [activeProfile, setActiveProfile]);

  return (
    <VoiceProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        setActiveProfile,
        createProfile,
        updateProfile,
        deleteProfile,
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
