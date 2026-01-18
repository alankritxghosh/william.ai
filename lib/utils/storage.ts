import { VoiceProfile, GeneratedPost, InterviewResponse } from "@/lib/types";
import { secureStorage } from "@/lib/security/encryption";

const STORAGE_KEYS = {
  VOICE_PROFILES: "william_voice_profiles",
  POSTS: "william_posts",
  ACTIVE_PROFILE: "william_active_profile",
  INTERVIEW_DRAFT: "william_interview_draft",
  STORAGE_VERSION: "william_storage_version",
} as const;

// Current storage version - increment when making breaking changes
const CURRENT_STORAGE_VERSION = 2;

// Flag to track if encryption is enabled
// Set to true for production, false for easier debugging in development
const USE_ENCRYPTION = typeof window !== "undefined" && 
  (process.env.NODE_ENV === "production" || localStorage.getItem("william_use_encryption") === "true");

// ==========================================
// STORAGE HELPERS
// ==========================================

/**
 * Save data to storage (encrypted in production)
 */
async function saveToStorage<T>(key: string, data: T): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (USE_ENCRYPTION) {
      await secureStorage.setItem(key, data);
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error(`Failed to save to ${key}:`, error);
    throw error;
  }
}

/**
 * Load data from storage (decrypted in production)
 */
async function loadFromStorage<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;

  try {
    if (USE_ENCRYPTION) {
      return await secureStorage.getItem<T>(key);
    } else {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) as T : null;
    }
  } catch (error) {
    console.error(`Failed to load from ${key}:`, error);
    return null;
  }
}

/**
 * Sync version of loadFromStorage for backward compatibility
 * Falls back to unencrypted storage if needed
 */
function loadFromStorageSync<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const data = localStorage.getItem(key);
    if (!data) return null;

    // Try to parse as JSON (works for both encrypted and unencrypted)
    try {
      return JSON.parse(data) as T;
    } catch {
      // If it's encrypted data, we can't read it synchronously
      // Return null and let async function handle it
      return null;
    }
  } catch (error) {
    console.error(`Failed to load from ${key}:`, error);
    return null;
  }
}

// ==========================================
// VOICE PROFILES
// ==========================================

export function saveVoiceProfiles(profiles: VoiceProfile[]): void {
  try {
    // Use sync storage for now to maintain backward compatibility
    // The VoiceProfileContext can be updated to use async version
    localStorage.setItem(STORAGE_KEYS.VOICE_PROFILES, JSON.stringify(profiles));
    
    // Also save encrypted version in background
    if (USE_ENCRYPTION) {
      saveToStorage(STORAGE_KEYS.VOICE_PROFILES, profiles).catch(console.error);
    }
  } catch (error) {
    console.error("Failed to save voice profiles:", error);
    throw new Error("Storage quota exceeded");
  }
}

export function loadVoiceProfiles(): VoiceProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VOICE_PROFILES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load voice profiles:", error);
    return [];
  }
}

export async function loadVoiceProfilesAsync(): Promise<VoiceProfile[]> {
  const profiles = await loadFromStorage<VoiceProfile[]>(STORAGE_KEYS.VOICE_PROFILES);
  return profiles || [];
}

export function saveVoiceProfile(profile: VoiceProfile): void {
  const profiles = loadVoiceProfiles();
  const existingIndex = profiles.findIndex(p => p.id === profile.id);
  
  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }
  
  saveVoiceProfiles(profiles);
}

export function deleteVoiceProfile(id: string): void {
  const profiles = loadVoiceProfiles().filter(p => p.id !== id);
  saveVoiceProfiles(profiles);
}

export function getActiveProfileId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE);
}

export function setActiveProfileId(id: string | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE);
  }
}

// ==========================================
// POSTS
// ==========================================

export function savePosts(posts: GeneratedPost[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    
    // Also save encrypted version in background
    if (USE_ENCRYPTION) {
      saveToStorage(STORAGE_KEYS.POSTS, posts).catch(console.error);
    }
  } catch (error) {
    console.error("Failed to save posts:", error);
    // If quota exceeded, remove oldest posts
    if (posts.length > 10) {
      const trimmedPosts = posts.slice(-10);
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(trimmedPosts));
    }
  }
}

export function loadPosts(): GeneratedPost[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.POSTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load posts:", error);
    return [];
  }
}

export async function loadPostsAsync(): Promise<GeneratedPost[]> {
  const posts = await loadFromStorage<GeneratedPost[]>(STORAGE_KEYS.POSTS);
  return posts || [];
}

export function savePost(post: GeneratedPost): void {
  const posts = loadPosts();
  const existingIndex = posts.findIndex(p => p.id === post.id);
  
  if (existingIndex >= 0) {
    posts[existingIndex] = post;
  } else {
    posts.push(post);
  }
  
  savePosts(posts);
}

export function deletePost(id: string): void {
  const posts = loadPosts().filter(p => p.id !== id);
  savePosts(posts);
}

export function getPostsByProfile(profileId: string): GeneratedPost[] {
  return loadPosts().filter(p => p.voiceProfileId === profileId);
}

// ==========================================
// INTERVIEW DRAFTS
// ==========================================

export function saveDraft(draft: Partial<InterviewResponse>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INTERVIEW_DRAFT, JSON.stringify(draft));
  } catch (error) {
    console.error("Failed to save draft:", error);
  }
}

export function loadDraft(): Partial<InterviewResponse> | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INTERVIEW_DRAFT);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to load draft:", error);
    return null;
  }
}

export function clearDraft(): void {
  localStorage.removeItem(STORAGE_KEYS.INTERVIEW_DRAFT);
}

// ==========================================
// DATA EXPORT & DELETION (GDPR COMPLIANCE)
// ==========================================

/**
 * Export all user data for GDPR compliance
 */
export async function exportAllUserData(): Promise<{
  voiceProfiles: VoiceProfile[];
  posts: GeneratedPost[];
  activeProfileId: string | null;
  exportedAt: string;
}> {
  return {
    voiceProfiles: loadVoiceProfiles(),
    posts: loadPosts(),
    activeProfileId: getActiveProfileId(),
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Delete all user data for GDPR compliance
 */
export function deleteAllUserData(): void {
  if (typeof window === "undefined") return;

  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
  
  // Also clear encryption salt
  localStorage.removeItem("william_encryption_salt");
}

/**
 * Download user data as JSON file
 */
export async function downloadUserData(): Promise<void> {
  const data = await exportAllUserData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `william-ai-data-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// UTILITIES
// ==========================================

export function generateId(): string {
  // Use crypto for better randomness if available
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function checkStorageQuota(): { used: number; available: boolean } {
  try {
    let used = 0;
    for (const key of Object.values(STORAGE_KEYS)) {
      const item = localStorage.getItem(key);
      if (item) {
        used += item.length * 2; // UTF-16 encoding
      }
    }
    return { used, available: used < 4 * 1024 * 1024 }; // 4MB threshold
  } catch {
    return { used: 0, available: false };
  }
}

/**
 * Check and update storage version
 * Handles migrations between versions
 */
export function checkStorageVersion(): void {
  if (typeof window === "undefined") return;

  const storedVersion = localStorage.getItem(STORAGE_KEYS.STORAGE_VERSION);
  const version = storedVersion ? parseInt(storedVersion, 10) : 1;

  if (version < CURRENT_STORAGE_VERSION) {
    if (process.env.NODE_ENV === "development") {
      console.log(`Migrating storage from v${version} to v${CURRENT_STORAGE_VERSION}`);
    }
    // Add migration logic here as needed
    localStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, CURRENT_STORAGE_VERSION.toString());
  }
}

/**
 * Enable encryption for storage (call this to opt-in during development)
 */
export function enableEncryption(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("william_use_encryption", "true");
  window.location.reload();
}

/**
 * Disable encryption for storage (for debugging)
 */
export function disableEncryption(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("william_use_encryption");
  window.location.reload();
}
