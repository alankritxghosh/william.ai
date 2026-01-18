import { VoiceProfile, GeneratedPost, InterviewResponse } from "@/lib/types";

const STORAGE_KEYS = {
  VOICE_PROFILES: "william_voice_profiles",
  POSTS: "william_posts",
  ACTIVE_PROFILE: "william_active_profile",
  INTERVIEW_DRAFT: "william_interview_draft",
} as const;

// ==========================================
// VOICE PROFILES
// ==========================================

export function saveVoiceProfiles(profiles: VoiceProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VOICE_PROFILES, JSON.stringify(profiles));
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
// UTILITIES
// ==========================================

export function generateId(): string {
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
