// ==========================================
// VOICE PROFILE TYPES
// ==========================================

export interface VoiceProfile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  
  // Voice Rules (20+ specific rules required)
  rules: {
    // Sentence construction patterns
    sentencePatterns: string[];
    
    // Words to avoid (beyond global forbidden list)
    forbiddenWords: string[];
    
    // Signature phrases that make it recognizable
    signaturePhrases: string[];
    
    // Writing rhythm preferences
    rhythmPreferences: {
      avgSentenceLength: number;
      paragraphBreaks: 'frequent' | 'moderate' | 'rare';
      punchlinePosition: 'end' | 'middle' | 'start';
      questionUsage: 'never' | 'occasional' | 'frequent';
    };
    
    // Formatting preferences
    formattingRules: {
      useEmDash: boolean;
      useBulletPoints: boolean;
      useNumberedLists: boolean;
      emojiUsage: 'never' | 'rare' | 'moderate' | 'frequent';
    };
  };
  
  // Reference Posts (top posts for voice matching)
  topPosts: {
    content: string;
    platform: 'linkedin' | 'twitter';
    engagement: number;
    url?: string;
  }[];
  
  // Brand Colors (for carousel generation)
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Analytics
  stats?: {
    totalPosts: number;
    avgQualityScore: number;
    lastUsed: string;
  };
}

// ==========================================
// VOICE MODE TYPES
// ==========================================

export type VoiceModeId = 
  | 'thought-leader' 
  | 'storyteller' 
  | 'educator' 
  | 'provocateur' 
  | 'community-builder';

export interface VoiceMode {
  id: VoiceModeId;
  name: string;
  emoji: string;
  description: string;
  
  // Mode-specific writing rules
  sentencePatterns: string[];
  forbiddenWords: string[];
  hookStyles: string[];
  
  // Tone and style
  tone: {
    formality: 'casual' | 'professional' | 'bold';
    emotionalRange: 'reserved' | 'moderate' | 'vulnerable';
    directness: 'subtle' | 'direct' | 'provocative';
  };
  
  // Examples for this mode
  exampleHooks: string[];
  examplePosts: string[];
  
  // When to suggest this mode
  suggestedFor: string[];
}

// ==========================================
// INTERVIEW TYPES
// ==========================================

export type InterviewFlowType = 'experience' | 'pattern';

export interface InterviewResponse {
  id: string;
  flowType: InterviewFlowType;
  voiceModeId: VoiceModeId;
  voiceProfileId: string;
  createdAt: string;
  
  // Answers to interview questions
  answers: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
    q6?: string;
  };
  
  // AI-extracted insight during interview
  extractedInsight?: string;
  
  // Metadata
  platform: 'linkedin' | 'twitter' | 'both';
  targetAudience?: string;
}

// ==========================================
// GENERATION PIPELINE TYPES
// ==========================================

export interface GenerationPipeline {
  stage: 'initial' | 'selected' | 'refined' | 'hook-optimized' | 'personality' | 'final';
  content: string;
  timestamp: string;
  qualityScore?: number;
}

export interface GeneratedPost {
  id: string;
  createdAt: string;
  updatedAt: string;
  
  // Input data
  interviewData: InterviewResponse;
  voiceProfileId: string;
  voiceProfile: VoiceProfile;
  
  // Generation Pipeline Results
  pipeline: {
    initialVersions: string[];
    selectedVersion: string;
    selectionReasoning: string;
    refinedVersion: string;
    refinementChanges: string[];
    hookOptions: string[];
    selectedHook: string;
    hookOptimizedVersion: string;
    personalityVersion: string;
    injectedElements: string[];
    finalVersion: string;
  };
  
  // Quality Metrics
  quality: {
    score: number;
    similarityScore: number;
    specificityCount: number;
    slopDetected: string[];
    passedGates: boolean;
  };
  
  // Platform-Specific Outputs
  outputs: {
    linkedin: {
      post: string;
      characterCount: number;
      hashtagCount: number;
    };
    twitter: {
      thread: string[];
      characterCounts: number[];
    };
  };
  
  // Carousel (if applicable)
  carousel?: {
    templateId: string;
    pages: CarouselPage[];
    exportedImages?: string[];
  };
  
  // Status and workflow
  status: 'generating' | 'passed' | 'failed' | 'exported' | 'scheduled';
  failureReason?: string;
  exportedAt?: string;
  scheduledFor?: string;
}

// ==========================================
// CAROUSEL TYPES
// ==========================================

export interface CarouselTemplate {
  id: string;
  name: string;
  category: 'list' | 'story' | 'data';
  pageCount: number;
  description: string;
  
  pages: {
    pageNumber: number;
    layout: 'title' | 'content' | 'conclusion';
    textAreas: {
      id: string;
      type: 'heading' | 'body' | 'bullet' | 'number' | 'quote';
      maxCharacters: number;
      position: { x: number; y: number; width: number; height: number };
    }[];
  }[];
  
  thumbnailUrl: string;
}

export interface CarouselPage {
  pageNumber: number;
  heading: string;
  content: string[];
  layout: 'list' | 'story' | 'data';
  backgroundColor?: string;
}

// ==========================================
// QUALITY GATE TYPES
// ==========================================

export interface QualityGate {
  name: string;
  passed: boolean;
  score?: number;
  issues: string[];
  suggestions: string[];
}

export interface QualityReport {
  overallScore: number;
  passed: boolean;
  gates: {
    forbiddenPhrases: QualityGate;
    specificity: QualityGate;
    voiceMatch: QualityGate;
    hookStrength: QualityGate;
    formatting: QualityGate;
  };
  timestamp: string;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    tokensUsed?: number;
  };
}

// ==========================================
// CONTEXT TYPES
// ==========================================

export interface VoiceProfileContextType {
  profiles: VoiceProfile[];
  activeProfile: VoiceProfile | null;
  setActiveProfile: (profile: VoiceProfile | null) => void;
  createProfile: (profile: Omit<VoiceProfile, 'id' | 'createdAt' | 'updatedAt'>) => VoiceProfile;
  updateProfile: (id: string, updates: Partial<VoiceProfile>) => void;
  deleteProfile: (id: string) => void;
}

export interface PostContextType {
  posts: GeneratedPost[];
  addPost: (post: GeneratedPost) => void;
  updatePost: (id: string, updates: Partial<GeneratedPost>) => void;
  deletePost: (id: string) => void;
  getPostsByProfile: (profileId: string) => GeneratedPost[];
}
