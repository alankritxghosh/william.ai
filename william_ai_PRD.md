# william.ai - Complete Product Requirements Document (PRD)
## For Cursor AI Development with Claude Opus 4.5

**Version:** 1.0  
**Last Updated:** January 17, 2026  
**Development Mode:** Solo vibe coding (0 → Production GTM)  
**AI Assistant:** Claude Opus 4.5 in Cursor  

---

## 📋 TABLE OF CONTENTS

1. [Product Overview](#product-overview)
2. [Technical Architecture](#technical-architecture)
3. [Development Phases](#development-phases)
4. [Data Models](#data-models)
5. [Core Features](#core-features)
6. [AI Pipeline Architecture](#ai-pipeline-architecture)
7. [UI/UX Specifications](#uiux-specifications)
8. [Quality Control System](#quality-control-system)
9. [Deployment Strategy](#deployment-strategy)
10. [Cursor Prompting Guide](#cursor-prompting-guide)

---

## 🎯 PRODUCT OVERVIEW

### What is william.ai?

An AI ghostwriting platform for LinkedIn and Twitter that **eliminates AI slop** through structural constraints and multi-layer quality control.

### The Core Problem

Ghostwriters already use Claude + manual editing workflow:
- Generate content with Claude: 2 minutes
- Edit out AI slop: 15 minutes per post
- Total time per client: 7.5 hours/month just editing slop

### The william.ai Solution

**Prevent slop BEFORE generation** through:
1. Constrained input types (only Personal Experience or Pattern Recognition)
2. Multi-stage quality pipeline (6 automated refinement stages)
3. Voice mode system (5 distinct writing styles)
4. 100+ forbidden phrase guardrails
5. Quality gates (85+ score required)

### Target Users

**Primary:** Superstrat Labs (ghostwriting agency) at ₹15-25k/month  
**Secondary:** Individual founders/consultants needing thought leadership content

### Success Metrics

- **Time saved:** 10+ hours/month per client
- **Quality score:** 85+ required, 90+ target
- **Editing time:** <2 minutes per post (vs 15 minutes manual)
- **Turing test:** Clients can't tell it's AI

---

## 🏗️ TECHNICAL ARCHITECTURE

### Tech Stack (Non-Negotiable)

```yaml
Frontend:
  Framework: Next.js 14 (App Router)
  Language: TypeScript (strict mode)
  Styling: Tailwind CSS
  Components: shadcn/ui
  Animations: Framer Motion

AI Layer:
  Provider: Anthropic Claude API
  Model: Claude Opus 4 (claude-opus-4-20250514)
  Features: 
    - Streaming responses
    - Multi-stage generation
    - Prompt chaining

State Management:
  Global State: React Context
  Persistence: localStorage (MVP)
  Future: Supabase/PostgreSQL

Deployment:
  Platform: Vercel
  CI/CD: GitHub Actions (auto-deploy)
  Environment: .env.local for secrets
```

### Project File Structure

```
william.ai/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Landing page
│   ├── globals.css                   # Global styles
│   │
│   ├── dashboard/
│   │   ├── page.tsx                  # Main dashboard view
│   │   └── layout.tsx                # Dashboard layout wrapper
│   │
│   ├── create/
│   │   ├── page.tsx                  # Post creation hub
│   │   ├── experience/
│   │   │   └── page.tsx              # Personal Experience flow
│   │   └── pattern/
│   │       └── page.tsx              # Pattern Recognition flow
│   │
│   ├── voice-profile/
│   │   ├── page.tsx                  # Voice profile setup
│   │   ├── new/
│   │   │   └── page.tsx              # Create new profile
│   │   └── [id]/
│   │       ├── page.tsx              # Edit profile
│   │       └── reference-posts/
│   │           └── page.tsx          # Add reference posts
│   │
│   └── api/
│       ├── generate/
│       │   └── route.ts              # Main generation endpoint
│       ├── hooks/
│       │   └── route.ts              # Hook optimization endpoint
│       ├── score/
│       │   └── route.ts              # Quality scoring endpoint
│       └── extract-insight/
│           └── route.ts              # Insight extraction endpoint
│
├── components/
│   ├── ui/                           # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── progress.tsx
│   │   ├── badge.tsx
│   │   └── dialog.tsx
│   │
│   ├── interview/
│   │   ├── QuestionCard.tsx          # Individual question component
│   │   ├── ProgressBar.tsx           # Interview progress indicator
│   │   ├── VoiceModeSelector.tsx     # Voice mode picker
│   │   ├── InsightExtractor.tsx      # Real-time insight display
│   │   └── NavigationButtons.tsx     # Next/Back/Submit buttons
│   │
│   ├── generation/
│   │   ├── GenerationLoader.tsx      # Multi-stage loading animation
│   │   ├── PostPreview.tsx           # Post preview with editing
│   │   ├── QualityScore.tsx          # Score visualization
│   │   ├── PlatformToggle.tsx        # LinkedIn/Twitter switcher
│   │   └── ExportOptions.tsx         # Copy/Download options
│   │
│   ├── dashboard/
│   │   ├── PostCard.tsx              # Individual post card
│   │   ├── StatsOverview.tsx         # Dashboard stats
│   │   ├── VoiceProfileCard.tsx      # Profile selector
│   │   └── RecentPosts.tsx           # Recent posts list
│   │
│   └── voice-profile/
│       ├── RulesEditor.tsx           # Voice rules input
│       ├── ReferencePostUpload.tsx   # Upload top posts
│       ├── BrandColorPicker.tsx      # Color selection
│       └── ProfilePreview.tsx        # Profile summary
│
├── lib/
│   ├── anthropic.ts                  # Claude API wrapper
│   │
│   ├── prompts/
│   │   ├── interview.ts              # Interview flow prompts
│   │   ├── generation.ts             # Generation stage prompts
│   │   ├── hooks.ts                  # Hook optimization prompts
│   │   ├── scoring.ts                # Quality scoring prompts
│   │   └── personality.ts            # Personality injection prompts
│   │
│   ├── guardrails/
│   │   ├── forbidden-phrases.ts      # 100+ forbidden terms
│   │   ├── quality-gates.ts          # Quality validation logic
│   │   ├── voice-matching.ts         # Voice consistency checker
│   │   └── slop-detector.ts          # AI slop detection
│   │
│   ├── pipeline/
│   │   ├── multi-stage.ts            # Multi-stage generation orchestrator
│   │   ├── version-selector.ts       # Best version selection logic
│   │   ├── hook-optimizer.ts         # Hook optimization logic
│   │   └── personality-injector.ts   # Personality injection logic
│   │
│   ├── utils/
│   │   ├── storage.ts                # localStorage wrapper
│   │   ├── formatting.ts             # Text formatting utilities
│   │   ├── platform-converter.ts     # LinkedIn → Twitter conversion
│   │   └── csv-exporter.ts           # Export to CSV
│   │
│   ├── context/
│   │   ├── VoiceProfileContext.tsx   # Voice profile state
│   │   └── PostContext.tsx           # Posts state
│   │
│   └── types.ts                      # TypeScript type definitions
│
├── data/
│   ├── voice-modes.ts                # 5 voice mode configurations
│   ├── carousel-templates.ts         # Carousel template definitions
│   └── example-posts.ts              # Example posts for each mode
│
├── public/
│   └── templates/                    # Carousel template assets
│       ├── list-style/
│       ├── story-style/
│       └── data-style/
│
├── .env.local                        # Environment variables (gitignored)
├── .env.example                      # Template for environment variables
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies
```

---

## 📊 DATA MODELS

### TypeScript Type Definitions

**File:** `lib/types.ts`

```typescript
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
    sentencePatterns: string[];          // e.g., "Never use em-dashes", "Start with action verbs"
    
    // Words to avoid (beyond global forbidden list)
    forbiddenWords: string[];            // e.g., "utilize", "implement"
    
    // Signature phrases that make it recognizable
    signaturePhrases: string[];          // e.g., "Here's the thing:", "Real talk:"
    
    // Writing rhythm preferences
    rhythmPreferences: {
      avgSentenceLength: number;         // 12-18 words typical
      paragraphBreaks: 'frequent' | 'moderate' | 'rare';
      punchlinePosition: 'end' | 'middle' | 'start';
      questionUsage: 'never' | 'occasional' | 'frequent';
    };
    
    // Formatting preferences
    formattingRules: {
      useEmDash: boolean;                // Almost always false
      useBulletPoints: boolean;
      useNumberedLists: boolean;
      emojiUsage: 'never' | 'rare' | 'moderate' | 'frequent';
    };
  };
  
  // Reference Posts (top 5 posts for voice matching)
  topPosts: {
    content: string;
    platform: 'linkedin' | 'twitter';
    engagement: number;
    url?: string;
  }[];
  
  // Brand Colors (for carousel generation)
  brandColors: {
    primary: string;      // Hex color
    secondary: string;    // Hex color
    accent: string;       // Hex color
  };
  
  // For users with zero posts - reference another creator
  referenceCreator?: {
    name: string;
    platform: 'linkedin' | 'twitter';
    samplePosts: string[];
    notes: string;        // Why this creator as reference
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
  sentencePatterns: string[];          // How sentences should be structured
  forbiddenWords: string[];            // Words to avoid in this mode
  hookStyles: string[];                // Types of hooks that work
  
  // Tone and style
  tone: {
    formality: 'casual' | 'professional' | 'bold';
    emotionalRange: 'reserved' | 'moderate' | 'vulnerable';
    directness: 'subtle' | 'direct' | 'provocative';
  };
  
  // Examples for this mode
  exampleHooks: string[];              // 5+ example opening lines
  examplePosts: string[];              // 3+ full example posts
  
  // When to suggest this mode
  suggestedFor: string[];              // e.g., "data-heavy insights", "personal stories"
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
    q6?: string;  // Only for experience flow
  };
  
  // AI-extracted insight during interview
  extractedInsight?: string;
  
  // Metadata
  platform: 'linkedin' | 'twitter' | 'both';
  targetAudience?: string;
}

// Personal Experience Flow Questions
export interface ExperienceFlowQuestions {
  q1: "What happened? (Describe the factual events)";
  q2: "What were the results? (Specific numbers)";
  q3: "How did that make you feel? (Emotional element)";
  q4: "What did you try instead? (Contrast/alternative)";
  q5: "What happened from that? (Alternative results)";
  q6: "Why do you think it worked/failed? (Your theory)";
}

// Pattern Recognition Flow Questions
export interface PatternFlowQuestions {
  q1: "How many times have you seen this? (Sample size)";
  q2: "Give me 2-3 specific examples (With numbers/names)";
  q3: "What's ALWAYS true? (The pattern)";
  q4: "What do most people miss? (The insight)";
  q5: "What surprises you? (Contrarian element)";
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
  voiceProfile: VoiceProfile;  // Denormalized for easy access
  
  // Generation Pipeline Results (all stages saved)
  pipeline: {
    // Stage 1: Generate 5 versions
    initialVersions: string[];        // 5 different versions
    
    // Stage 2: Select best version
    selectedVersion: string;          // Best of 5 (with reasoning)
    selectionReasoning: string;       // Why this one was chosen
    
    // Stage 3: Refinement
    refinedVersion: string;           // After improvements
    refinementChanges: string[];      // List of changes made
    
    // Stage 4: Hook Optimization
    hookOptions: string[];            // 10 different hooks generated
    selectedHook: string;             // Best hook chosen
    hookOptimizedVersion: string;     // Post with new hook
    
    // Stage 5: Personality Injection
    personalityVersion: string;       // After adding quirks
    injectedElements: string[];       // What was added
    
    // Stage 6: Final Quality Check
    finalVersion: string;             // After all quality gates
  };
  
  // Quality Metrics
  quality: {
    score: number;                    // 0-100 (must be 85+)
    similarityScore: number;          // 0-100 vs top posts (must be 90+)
    specificityCount: number;         // Number of specific details
    slopDetected: string[];           // Forbidden phrases caught
    passedGates: boolean;             // Did it pass all gates?
  };
  
  // Platform-Specific Outputs
  outputs: {
    linkedin: {
      post: string;
      characterCount: number;
      hashtagCount: number;
    };
    twitter: {
      thread: string[];               // Array of tweets
      characterCounts: number[];      // Count for each tweet
    };
  };
  
  // Carousel (if applicable)
  carousel?: {
    templateId: string;
    pages: CarouselPage[];
    exportedImages?: string[];        // Base64 or URLs
  };
  
  // Status and workflow
  status: 'generating' | 'passed' | 'failed' | 'exported' | 'scheduled';
  failureReason?: string;             // If status is 'failed'
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
  
  // Page layouts
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
  
  // Preview
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
    details?: any;
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
  createProfile: (profile: Omit<VoiceProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
```

---

## 🚀 DEVELOPMENT PHASES

### Phase 1: Foundation (Session 1, 2-3 hours)

**Goal:** Get the project running with basic infrastructure

#### Tasks:

1. **Project Setup**
   ```bash
   # Cursor Prompt:
   "Create a Next.js 14 project with TypeScript and App Router. 
   Install and configure:
   - Tailwind CSS
   - shadcn/ui (with all components we'll need: button, card, input, textarea, select, progress, badge, dialog)
   - Framer Motion
   Set up the file structure as defined in the PRD.
   Create .env.example with ANTHROPIC_API_KEY placeholder."
   ```

2. **Anthropic API Wrapper**
   ```typescript
   // Cursor Prompt for lib/anthropic.ts:
   "Create a TypeScript wrapper for the Anthropic Claude API with:
   - Function to call Claude Opus 4 (claude-opus-4-20250514)
   - Support for streaming responses
   - Error handling and retry logic for rate limits
   - Helper function to generate multiple versions in parallel
   - Helper function for sequential prompt chaining
   - Full TypeScript types for all requests/responses"
   ```

3. **localStorage Wrapper**
   ```typescript
   // Cursor Prompt for lib/utils/storage.ts:
   "Create a type-safe localStorage wrapper that:
   - Saves/loads VoiceProfile objects with full type safety
   - Saves/loads GeneratedPost objects
   - Handles JSON serialization/deserialization
   - Has error handling for quota exceeded
   - Has migration support if schema changes
   - Includes functions: saveVoiceProfile, loadVoiceProfiles, savePost, loadPosts"
   ```

4. **Basic UI Components**
   ```bash
   # Cursor Prompt:
   "Set up shadcn/ui theme with:
   - Primary color: Blue (#3B82F6)
   - Dark mode support
   - Install these components: button, card, input, textarea, select, progress, badge, dialog, label
   - Create a basic layout.tsx with navigation header"
   ```

**Deliverables:**
- ✅ Next.js app running on localhost:3000
- ✅ Anthropic API connected and tested
- ✅ localStorage working
- ✅ shadcn/ui components available
- ✅ Basic navigation structure

---

### Phase 2: Voice Profile System (Session 2, 2-3 hours)

**Goal:** Build the voice profile creation and management

#### Tasks:

1. **Voice Mode Definitions**
   ```typescript
   // Cursor Prompt for data/voice-modes.ts:
   "Create the 5 voice modes as TypeScript objects:
   
   1. Thought Leader
      - Tone: Authoritative, data-driven
      - Sentence patterns: Direct statements, cite sources, use data
      - Forbidden: Fluffy language, unsubstantiated claims
      - Hook styles: Start with surprising stat, bold claim
      
   2. Storyteller
      - Tone: Vulnerable, narrative-driven
      - Sentence patterns: Short punchy sentences, emotion words
      - Forbidden: Corporate speak, jargon
      - Hook styles: Start with a moment, set the scene
      
   3. Educator
      - Tone: Clear, helpful, step-by-step
      - Sentence patterns: Use analogies, numbered steps
      - Forbidden: Condescending language, complexity
      - Hook styles: Start with the problem, promise a solution
      
   4. Provocateur
      - Tone: Bold, controversial, direct
      - Sentence patterns: Challenge assumptions, ask hard questions
      - Forbidden: Hedging language, apologies
      - Hook styles: Contrarian take, controversial statement
      
   5. Community Builder
      - Tone: Casual, friendly, conversational
      - Sentence patterns: Ask questions, use 'we/us', relatable
      - Forbidden: Corporate speak, formal language
      - Hook styles: Start with shared experience, ask a question
   
   Each mode should export:
   - Complete VoiceMode object with all fields
   - 5+ example hooks
   - 3+ full example posts
   - List of when to suggest this mode"
   ```

2. **Forbidden Phrases Database**
   ```typescript
   // Cursor Prompt for lib/guardrails/forbidden-phrases.ts:
   "Create a comprehensive forbidden phrases system:
   
   1. Array of 100+ forbidden AI slop terms including:
      - Buzzwords: leverage, ecosystem, synergy, paradigm, cutting-edge, next-level
      - Filler: dive deep, delve into, unpack, let's explore
      - Fluff: transformative, revolutionary, game-changing, innovative
      - Clichés: at the end of the day, think outside the box, paradigm shift
      (Add 80+ more based on common AI writing patterns)
   
   2. Function checkForForbiddenPhrases(text: string) that:
      - Finds all forbidden phrases in text
      - Returns array of { phrase, position, context }
      - Suggests replacements for each
   
   3. Function scoreTextQuality(text: string) that:
      - Returns 0-100 score
      - Deducts points for forbidden phrases
      - Deducts points for lack of specificity
      - Awards points for numbers, names, dates"
   ```

3. **Voice Profile UI**
   ```typescript
   // Cursor Prompt for app/voice-profile/new/page.tsx:
   "Create a multi-step form for creating a voice profile:
   
   Step 1: Basic Info
   - Profile name input
   - Target platform checkboxes (LinkedIn, Twitter, Both)
   
   Step 2: Voice Rules (20+ required)
   - Dynamic textarea array for sentence patterns
   - Dynamic textarea array for forbidden words
   - Dynamic textarea array for signature phrases
   - Rhythm preferences selectors
   - Formatting preferences toggles
   - Validation: Must have 20+ total rules
   
   Step 3: Reference Posts
   - If they have posts: Upload 5 top-performing posts
   - If they don't: Select reference creator + sample posts
   - For each post: content textarea, platform, engagement number
   
   Step 4: Brand Colors
   - Color pickers for primary, secondary, accent
   - Preview of how carousels will look
   
   Step 5: Review & Save
   - Summary of all inputs
   - Save to localStorage
   - Redirect to dashboard
   
   Use shadcn/ui components throughout.
   Add progress bar at top showing current step.
   Include Next/Back navigation buttons."
   ```

4. **Voice Profile Context**
   ```typescript
   // Cursor Prompt for lib/context/VoiceProfileContext.tsx:
   "Create a React Context for managing voice profiles:
   
   - State: Array of VoiceProfile objects
   - State: Currently active profile
   - Load profiles from localStorage on mount
   - Functions:
     - createProfile(profile) - validates, saves, adds to state
     - updateProfile(id, updates) - updates and persists
     - deleteProfile(id) - removes from state and localStorage
     - setActiveProfile(profile) - sets current active
   
   Wrap the entire app in this provider in layout.tsx"
   ```

**Deliverables:**
- ✅ 5 voice modes fully defined
- ✅ Forbidden phrases database working
- ✅ Voice profile creation form complete
- ✅ Voice profiles persisted in localStorage
- ✅ Context managing profile state

---

### Phase 3: Interview Flows (Session 3, 3-4 hours)

**Goal:** Build both interview flows with AI insight extraction

#### Tasks:

1. **Interview Flow Components**
   ```typescript
   // Cursor Prompt for components/interview/QuestionCard.tsx:
   "Create a QuestionCard component that:
   - Displays question text with number
   - Has a large textarea for answer
   - Shows character count
   - Validates that answer is not empty
   - Has subtle animation on mount (Framer Motion)
   - Props: questionNumber, questionText, value, onChange, error"
   
   // Cursor Prompt for components/interview/ProgressBar.tsx:
   "Create a ProgressBar component that:
   - Shows current question number / total questions
   - Visual progress bar with percentage
   - Displays current flow type (Experience vs Pattern)
   - Shows selected voice mode
   - Animated transitions between steps"
   
   // Cursor Prompt for components/interview/VoiceModeSelector.tsx:
   "Create a VoiceModeSelector component that:
   - Shows all 5 voice modes as cards
   - Each card shows emoji, name, description
   - Highlights selected mode
   - Can suggest a mode based on answers so far
   - Animated selection feedback"
   ```

2. **Personal Experience Flow**
   ```typescript
   // Cursor Prompt for app/create/experience/page.tsx:
   "Create the Personal Experience interview flow:
   
   Flow structure:
   1. Select voice mode (VoiceModeSelector)
   2. Question 1: What happened? (factual events)
   3. Question 2: What were the results? (specific numbers)
   4. Question 3: How did that make you feel? (emotional)
   5. Question 4: What did you try instead? (contrast)
   6. Question 5: What happened from that? (alternative results)
   7. Question 6: Why do you think it worked/failed? (theory)
   8. Review screen with all answers
   
   Features:
   - One question per screen
   - Next/Back navigation
   - Answer validation (not empty, minimum length)
   - Progress bar at top
   - Save answers to localStorage as draft
   - AI insight extraction after Q6
   - Submit button sends to generation
   
   Use QuestionCard, ProgressBar components.
   Handle navigation state properly.
   Store draft in localStorage so users don't lose progress."
   ```

3. **Pattern Recognition Flow**
   ```typescript
   // Cursor Prompt for app/create/pattern/page.tsx:
   "Create the Pattern Recognition interview flow:
   
   Flow structure:
   1. Select voice mode
   2. Question 1: How many times have you seen this? (sample size)
   3. Question 2: Give me 2-3 specific examples (with numbers)
   4. Question 3: What's ALWAYS true? (the pattern)
   5. Question 4: What do most people miss? (the insight)
   6. Question 5: What surprises you? (contrarian element)
   7. Review screen with all answers
   
   Same features as Experience flow.
   Different questions but same component structure."
   ```

4. **AI Insight Extraction**
   ```typescript
   // Cursor Prompt for app/api/extract-insight/route.ts:
   "Create an API endpoint for real-time insight extraction:
   
   Endpoint: POST /api/extract-insight
   Input: { answers: object, flowType: string }
   
   For Experience flow:
   - Analyze the story they told
   - Extract the unique angle they don't see
   - Find the emotional hook
   - Identify the contrarian element
   - Return: { insight: string, angle: string, hook: string }
   
   For Pattern flow:
   - Analyze the pattern they described
   - Extract the clear claim
   - Identify what others miss
   - Find why it matters now
   - Return: { pattern: string, blindSpot: string, urgency: string }
   
   Use Claude API with specific prompts for extraction.
   Show this to user before final submission.
   Let them edit the extracted insight."
   ```

**Deliverables:**
- ✅ Personal Experience flow complete
- ✅ Pattern Recognition flow complete
- ✅ AI insight extraction working
- ✅ Draft saving to localStorage
- ✅ Clean navigation between questions

---

### Phase 4: Multi-Stage Generation Pipeline (Session 4, 4-5 hours)

**Goal:** Build the 6-stage generation system that prevents slop

#### Tasks:

1. **Generation Prompts Library**
   ```typescript
   // Cursor Prompt for lib/prompts/generation.ts:
   "Create comprehensive prompts for each generation stage:
   
   Stage 1: Initial Generation (5 versions)
   - Prompt that takes interview answers + voice mode + voice profile
   - Asks Claude to generate 5 different versions
   - Each version must include specific numbers from answers
   - Each version must match voice mode style
   - Return array of 5 posts
   
   Stage 2: Version Selection
   - Prompt that evaluates all 5 versions
   - Scores each against: specificity, voice match, hook strength, no slop
   - Returns best version + reasoning for selection
   
   Stage 3: Refinement
   - Prompt that takes selected version
   - Removes any remaining AI tells
   - Strengthens weak sentences
   - Ensures narrative flow
   - Returns refined version + list of changes
   
   Stage 4: Hook Optimization
   - Prompt that generates 10 different hooks
   - Each hook must be: specific, contrarian, or emotional
   - Evaluates hooks against criteria
   - Returns best hook + reasoning
   
   Stage 5: Personality Injection
   - Prompt that takes voice profile's signature phrases
   - Injects personality without making it obvious
   - Matches rhythm of user's top posts
   - Returns personalized version + what was added
   
   Stage 6: Final Quality Check
   - Prompt that scores final post 0-100
   - Checks: forbidden phrases, specificity, voice match, hook strength
   - Returns score + pass/fail + issues if any
   
   Each prompt should be a function that takes inputs and returns formatted string."
   ```

2. **Multi-Stage Pipeline Orchestrator**
   ```typescript
   // Cursor Prompt for lib/pipeline/multi-stage.ts:
   "Create the pipeline orchestrator that runs all 6 stages:
   
   Function: async generatePost(interview, voiceProfile, onProgress?)
   
   Process:
   1. Call Stage 1: Generate 5 versions (parallel)
      - onProgress?.({ stage: 'initial', progress: 20 })
   
   2. Call Stage 2: Select best version
      - onProgress?.({ stage: 'selected', progress: 35 })
   
   3. Call Stage 3: Refine version
      - onProgress?.({ stage: 'refined', progress: 50 })
   
   4. Call Stage 4: Optimize hook
      - onProgress?.({ stage: 'hook-optimized', progress: 65 })
   
   5. Call Stage 5: Inject personality
      - onProgress?.({ stage: 'personality', progress: 80 })
   
   6. Call Stage 6: Quality check
      - onProgress?.({ stage: 'final', progress: 95 })
   
   7. If quality score < 85:
      - Regenerate entire pipeline (max 3 attempts)
      - If still failing, return error with details
   
   8. If quality score >= 85:
      - Generate Twitter version (convert LinkedIn → Twitter)
      - Return complete GeneratedPost object
   
   Include detailed error handling.
   Save all intermediate stages for debugging.
   Return full pipeline data."
   ```

3. **Quality Gates**
   ```typescript
   // Cursor Prompt for lib/guardrails/quality-gates.ts:
   "Create the quality gate validation system:
   
   Function: validatePost(post: string, voiceProfile: VoiceProfile)
   
   Gates to check:
   1. Forbidden Phrases Gate
      - Check against 100+ forbidden terms
      - Fail if any found
      - Return: { passed: boolean, issues: string[] }
   
   2. Specificity Gate
      - Count specific numbers, names, dates
      - Require at least 3 specific details
      - Fail if < 3
      - Return: { passed: boolean, count: number }
   
   3. Voice Match Gate
      - Compare to voice profile's top posts
      - Use Claude to score similarity 0-100
      - Require 90%+ similarity
      - Return: { passed: boolean, score: number }
   
   4. Hook Strength Gate
      - Evaluate first 1-2 lines
      - Must have: number, or contrarian claim, or personal stake
      - Return: { passed: boolean, hookType: string }
   
   5. Formatting Gate
      - Check for em-dashes if forbidden
      - Check for excessive bullet points
      - Check sentence length variation
      - Return: { passed: boolean, issues: string[] }
   
   Return QualityReport object with overall score and each gate result."
   ```

4. **Generation API Endpoint**
   ```typescript
   // Cursor Prompt for app/api/generate/route.ts:
   "Create the main generation API endpoint:
   
   Endpoint: POST /api/generate
   Input: { 
     interviewData: InterviewResponse,
     voiceProfileId: string 
   }
   
   Process:
   1. Load voice profile from localStorage (server-side)
   2. Call multi-stage pipeline
   3. Stream progress updates to client
   4. If generation fails after 3 attempts:
      - Return error with detailed failure reasons
   5. If generation succeeds:
      - Save to localStorage
      - Return complete GeneratedPost object
   
   Support streaming responses for progress updates.
   Handle all errors gracefully.
   Include request timeout (60 seconds max)."
   ```

5. **Generation UI**
   ```typescript
   // Cursor Prompt for components/generation/GenerationLoader.tsx:
   "Create an engaging generation loader component:
   
   Features:
   - Shows current stage name and progress percentage
   - Animated progress bar
   - Stage descriptions:
     - Initial: 'Generating 5 unique versions...'
     - Selected: 'Evaluating and selecting best version...'
     - Refined: 'Removing AI tells and polishing...'
     - Hook-optimized: 'Testing 10 different hooks...'
     - Personality: 'Injecting your unique voice...'
     - Final: 'Running quality checks...'
   
   - If regenerating (score < 85):
     - Show 'Quality check failed, regenerating...'
     - Show attempt number (Attempt 2/3)
   
   - Smooth animations between stages
   - Estimated time remaining
   - Fun facts about ghostwriting while waiting
   
   Use Framer Motion for animations."
   
   // Cursor Prompt for components/generation/PostPreview.tsx:
   "Create a post preview component:
   
   Features:
   - Platform toggle (LinkedIn / Twitter)
   - Editable post content (textarea)
   - Character count for each platform
   - Quality score badge (color-coded: 85-89 yellow, 90-94 green, 95+ gold)
   - Specificity highlights (numbers, names, dates in blue)
   - Voice similarity score
   - Export options:
     - Copy to clipboard
     - Download as text
     - Export to CSV (for scheduling)
   
   - Twitter version shows as thread with tweet numbers
   - LinkedIn version shows as single post
   
   - Show pipeline stages in collapsible section (for debugging)
   
   Use shadcn/ui Card, Badge, Button components."
   ```

**Deliverables:**
- ✅ All 6 generation stages working
- ✅ Quality gates validating posts
- ✅ Multi-stage pipeline orchestration
- ✅ Generation API endpoint
- ✅ Beautiful loading UI
- ✅ Post preview with editing
- ✅ Regeneration on quality failure

---

### Phase 5: Platform Conversion & Export (Session 5, 2-3 hours)

**Goal:** Convert LinkedIn → Twitter and export functionality

#### Tasks:

1. **Platform Converter**
   ```typescript
   // Cursor Prompt for lib/utils/platform-converter.ts:
   "Create LinkedIn to Twitter conversion system:
   
   Function: convertToTwitterThread(linkedinPost: string)
   
   Rules:
   1. Preserve ALL numbers, names, dates (80%+ specificity retention)
   2. Break into tweets (280 chars each)
   3. Adapt sentence length only
   4. NO genericizing allowed
   5. Keep the hook as first tweet
   6. Number each tweet (1/X, 2/X, etc.)
   7. Ensure thread flow is coherent
   
   Algorithm:
   - Split LinkedIn post into paragraphs
   - Convert long paragraphs to multiple tweets
   - Ensure each tweet is self-contained but flows
   - Maintain voice and tone
   - Keep specificity intact
   
   Return: string[] (array of tweets)
   
   Include validation:
   - Check specificity retention percentage
   - Warn if < 80%
   - Count total characters
   - Suggest thread length optimization"
   ```

2. **CSV Exporter**
   ```typescript
   // Cursor Prompt for lib/utils/csv-exporter.ts:
   "Create CSV export for scheduling tools:
   
   Function: exportPostsToCSV(posts: GeneratedPost[])
   
   CSV Format:
   - Column 1: Date (empty for manual scheduling)
   - Column 2: Time (empty)
   - Column 3: Platform (LinkedIn/Twitter)
   - Column 4: Post Content
   - Column 5: Quality Score
   - Column 6: Voice Profile Name
   
   Features:
   - Download as .csv file
   - Properly escape special characters
   - Handle multi-line content
   - Include BOM for Excel compatibility
   
   Return: Trigger browser download of CSV file"
   ```

3. **Export Options UI**
   ```typescript
   // Cursor Prompt for components/generation/ExportOptions.tsx:
   "Create export options component:
   
   Options:
   1. Copy to Clipboard
      - Button with copy icon
      - Show 'Copied!' confirmation
      - Timeout after 2 seconds
   
   2. Download as Text
      - Download .txt file
      - Include quality score in filename
      - Format: 'post_[profile]_[date]_[score].txt'
   
   3. Export to CSV
      - Opens modal to select multiple posts
      - Choose posts to include in CSV
      - Download scheduling CSV
   
   4. Copy Twitter Thread
      - Copy entire thread formatted
      - Include tweet numbers
      - Ready to paste in Twitter
   
   Use shadcn/ui Dialog for CSV modal.
   Use toast notifications for confirmations."
   ```

**Deliverables:**
- ✅ LinkedIn → Twitter conversion working
- ✅ Specificity preservation validated
- ✅ CSV export functionality
- ✅ Copy/download options
- ✅ Export UI components

---

### Phase 6: Dashboard & Analytics (Session 6, 2-3 hours)

**Goal:** Build dashboard for managing posts and profiles

#### Tasks:

1. **Dashboard Layout**
   ```typescript
   // Cursor Prompt for app/dashboard/page.tsx:
   "Create the main dashboard:
   
   Layout:
   - Header: Voice profile selector dropdown
   - Stats row: 
     - Total posts created
     - Average quality score
     - Posts this month
     - Time saved (vs manual: 10 hrs/client/month)
   
   - Main content:
     - Recent posts (last 10)
     - Each post card shows:
       - First 100 chars of content
       - Quality score badge
       - Platform (LinkedIn/Twitter)
       - Created date
       - Quick actions: View, Edit, Export, Delete
   
   - Sidebar:
     - Active voice profile card
     - Quick create buttons (Experience / Pattern)
     - Voice profile management link
   
   - Empty state if no posts:
     - Illustration
     - 'Create your first post' CTA
     - Link to interview flows
   
   Use shadcn/ui components: Card, Badge, Select, Button
   Make it beautiful and professional"
   ```

2. **Post Management**
   ```typescript
   // Cursor Prompt for components/dashboard/PostCard.tsx:
   "Create a post card component:
   
   Features:
   - Displays post preview (first 150 chars)
   - Shows quality score with color coding
   - Platform badge (LinkedIn/Twitter)
   - Created date (relative time: '2 days ago')
   - Quick actions dropdown:
     - View full post (opens modal)
     - Edit post (opens edit mode)
     - Export options
     - Delete (with confirmation)
   
   - Hover effects
   - Click to view full post
   
   Styling:
   - Clean card design
   - Quality score prominently displayed
   - Color code by score:
     - 95-100: Gold
     - 90-94: Green
     - 85-89: Yellow
     - <85: Red (shouldn't happen)
   
   Use Framer Motion for hover animations"
   ```

3. **Stats Overview**
   ```typescript
   // Cursor Prompt for components/dashboard/StatsOverview.tsx:
   "Create stats overview component:
   
   Stats to show:
   1. Total Posts Created
      - Count from all posts
      - Icon: Document icon
   
   2. Average Quality Score
      - Calculate avg from all posts
      - Icon: Star icon
      - Show trending (up/down from last month)
   
   3. Posts This Month
      - Count posts created this month
      - Icon: Calendar icon
   
   4. Time Saved
      - Calculate: (posts * 15 min) - (posts * 2 min)
      - Show in hours
      - Icon: Clock icon
      - Subtext: 'vs manual editing'
   
   Layout:
   - 4 cards in a row (responsive: 2x2 on mobile)
   - Each card has: icon, number, label, subtext
   - Subtle animations on mount
   
   Use shadcn/ui Card component"
   ```

**Deliverables:**
- ✅ Dashboard with stats
- ✅ Post management cards
- ✅ Quick actions
- ✅ Beautiful UI
- ✅ Empty states

---

### Phase 7: Carousel System (Session 7, 3-4 hours)

**Goal:** Template-based carousel generation

#### Tasks:

1. **Carousel Templates**
   ```typescript
   // Cursor Prompt for data/carousel-templates.ts:
   "Create 20-30 carousel template definitions:
   
   Categories:
   1. List Style (10 templates)
      - 5 Tips format
      - 7 Mistakes format
      - 10 Lessons format
      - Framework breakdown
      - Checklist format
   
   2. Story Style (10 templates)
      - Before/After
      - Journey timeline
      - Case study
      - Transformation story
      - Problem → Solution
   
   3. Data Style (10 templates)
      - Statistics showcase
      - Comparison charts
      - Growth metrics
      - Survey results
      - Trend analysis
   
   Each template should define:
   - ID, name, category
   - Number of pages (5-10)
   - Layout for each page
   - Text areas with max character limits
   - Position/size of text areas
   - Background style
   - When to use this template
   
   Export as array of CarouselTemplate objects"
   ```

2. **Template Selector**
   ```typescript
   // Cursor Prompt: Create AI template selector:
   "
   Function: selectCarouselTemplate(postContent: string)
   
   Use Claude API to:
   - Analyze the post content
   - Determine post type (list, story, data)
   - Count main points
   - Select best template match
   - Return template ID + reasoning
   
   Fallback:
   - If AI selection fails, use default template
   - Let user manually select template"
   ```

3. **Carousel Generator**
   ```typescript
   // Cursor Prompt for lib/carousel/generator.ts:
   "Create carousel page generator:
   
   Function: generateCarouselPages(
     post: string,
     template: CarouselTemplate,
     brandColors: VoiceProfile['brandColors']
   )
   
   Process:
   1. Use Claude to break post into carousel pages
   2. Extract heading for each page
   3. Extract content bullets/text for each page
   4. Ensure content fits template character limits
   5. Apply brand colors to template
   6. Generate HTML for each page
   7. Convert HTML to image (using html2canvas or similar)
   8. Return array of base64 images
   
   Validation:
   - Check all pages have content
   - Check no text overflow
   - Check brand colors applied
   
   Return CarouselConfig with pages and images"
   ```

4. **Carousel Preview UI**
   ```typescript
   // Cursor Prompt: Create carousel preview component:
   "
   Component: CarouselPreview
   
   Features:
   - Shows all carousel pages as image previews
   - Swipeable carousel view
   - Page numbers (1/7, 2/7, etc.)
   - Download options:
     - Download all as ZIP
     - Download individual pages
     - Download as PDF
   
   - Edit mode:
     - Click page to edit text
     - Change template
     - Adjust colors
     - Regenerate individual page
   
   - Preview mode matches LinkedIn carousel aspect ratio (1080x1080)
   
   Use Framer Motion for swipe animations
   Use shadcn/ui Dialog for edit mode"
   ```

**Deliverables:**
- ✅ 20-30 carousel templates defined
- ✅ AI template selection
- ✅ Carousel generation pipeline
- ✅ Image export functionality
- ✅ Preview and edit UI

---

### Phase 8: Polish & Production (Session 8, 2-3 hours)

**Goal:** Production-ready polish and deployment

#### Tasks:

1. **Error Handling**
   ```typescript
   // Cursor Prompt:
   "Add comprehensive error handling across the app:
   
   1. API errors:
      - Rate limit errors → show friendly message + retry countdown
      - Network errors → show retry button
      - Invalid input → show validation errors
   
   2. Generation failures:
      - If 3 attempts fail → show detailed failure reason
      - Offer to regenerate with different voice mode
      - Save failed attempt for debugging
   
   3. localStorage errors:
      - Quota exceeded → offer to delete old posts
      - Parse errors → migrate to new schema
   
   4. Generic errors:
      - Error boundary component
      - Log errors to console
      - Show friendly error UI
   
   Use toast notifications for errors.
   Create reusable error components."
   ```

2. **Loading States**
   ```typescript
   // Cursor Prompt:
   "Add loading states everywhere:
   
   - Page transitions: Loading spinner
   - API calls: Skeleton loaders
   - Image loading: Progressive loading
   - Long operations: Progress indicators
   
   Use Framer Motion for smooth transitions.
   Use shadcn/ui Skeleton component.
   Ensure no layout shifts during loading."
   ```

3. **Responsive Design**
   ```typescript
   // Cursor Prompt:
   "Make entire app responsive:
   
   - Breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
   - Navigation: Hamburger menu on mobile
   - Dashboard: 1 column on mobile, 2 on tablet, 3 on desktop
   - Forms: Full width on mobile, max-width on desktop
   - Carousels: Swipe on mobile, click on desktop
   
   Test on:
   - iPhone (375px width)
   - iPad (768px width)
   - Desktop (1440px width)
   
   Use Tailwind responsive classes.
   Ensure touch targets are 44px minimum."
   ```

4. **Performance Optimization**
   ```typescript
   // Cursor Prompt:
   "Optimize app performance:
   
   1. Code splitting:
      - Lazy load routes
      - Lazy load heavy components (carousel generator)
   
   2. Caching:
      - Cache voice profiles in memory
      - Cache generated posts
      - Cache API responses (deduplication)
   
   3. Image optimization:
      - Use Next.js Image component
      - Compress carousel images
      - Lazy load images
   
   4. Bundle size:
      - Remove unused dependencies
      - Tree-shake libraries
      - Minimize bundle
   
   Target: < 3s initial load, < 1s navigation"
   ```

5. **Deployment**
   ```bash
   # Cursor Prompt:
   "Prepare for Vercel deployment:
   
   1. Environment variables:
      - Add ANTHROPIC_API_KEY to Vercel
      - Add NEXT_PUBLIC_APP_URL
   
   2. Build configuration:
      - Optimize production build
      - Enable compression
      - Configure caching headers
   
   3. Analytics:
      - Add Vercel Analytics
      - Track: page views, API calls, errors
   
   4. Monitoring:
      - Set up error tracking
      - Monitor API usage
      - Track generation success rate
   
   5. Deploy:
      - Connect GitHub repo
      - Enable auto-deploy on push to main
      - Set up preview deployments for PRs
   
   Create deployment checklist."
   ```

**Deliverables:**
- ✅ All errors handled gracefully
- ✅ Loading states everywhere
- ✅ Fully responsive design
- ✅ Optimized performance
- ✅ Deployed to Vercel
- ✅ Production monitoring

---

## 🤖 AI PIPELINE ARCHITECTURE

### The 6-Stage Generation System

This is the **core differentiator** of william.ai. Each stage prevents different types of slop.

```
INPUT: Interview Answers + Voice Profile + Voice Mode
↓
STAGE 1: Generate 5 Versions (parallel)
├── Version A
├── Version B
├── Version C
├── Version D
└── Version E
↓
STAGE 2: Select Best Version
├── Score each version (0-100)
├── Criteria: specificity, voice match, hook strength, no slop
├── Select highest scoring
└── Output: Selected version + reasoning
↓
STAGE 3: Refinement
├── Remove AI tells
├── Strengthen weak sentences
├── Improve narrative flow
└── Output: Refined version + changes made
↓
STAGE 4: Hook Optimization
├── Generate 10 different hooks
├── Test each hook against criteria
├── Select strongest hook
├── Replace original hook
└── Output: Hook-optimized version
↓
STAGE 5: Personality Injection
├── Add signature phrases from voice profile
├── Match rhythm of top posts
├── Inject quirks without being obvious
└── Output: Personalized version
↓
STAGE 6: Quality Gates
├── Check forbidden phrases (must be 0)
├── Check specificity (must be 3+ details)
├── Check voice match (must be 90%+)
├── Check hook strength (must pass criteria)
├── Overall score (must be 85+)
└── Output: Final post + quality report
↓
IF SCORE < 85: Regenerate entire pipeline (max 3 attempts)
IF SCORE >= 85: Convert to Twitter + Save
↓
OUTPUT: GeneratedPost object with all stages
```

### Prompt Engineering Principles

Each stage requires carefully crafted prompts:

**Stage 1: Initial Generation**
```
Context: You are generating LinkedIn/Twitter content that sounds human-written.
Input: [interview answers], [voice mode], [voice profile rules]
Task: Generate 5 completely different versions of a post based on this input.

Requirements:
- Each version must include specific numbers/names/dates from the interview
- Match the [voice mode] style exactly
- Follow all voice profile rules
- NO forbidden phrases (never use: [forbidden list])
- Each version should take a different angle on the same story

Output format:
VERSION 1:
[post content]

VERSION 2:
[post content]

...
```

**Stage 2: Version Selection**
```
Context: You are evaluating 5 versions of a post to select the best one.
Input: [5 versions]
Task: Score each version and select the best.

Scoring criteria (0-100):
- Specificity (30 points): Count of specific numbers/names/dates
- Voice match (25 points): How well it matches the voice mode
- Hook strength (25 points): Is the opening line compelling?
- No slop (20 points): Zero forbidden phrases, no AI tells

Output format:
SCORES:
Version 1: X/100 (specificity: X, voice: X, hook: X, no-slop: X)
Version 2: ...

SELECTED: Version X
REASONING: [why this version is best]
```

**Stage 3: Refinement**
```
Context: You are refining a good post to make it great.
Input: [selected version]
Task: Improve the post without losing its core.

Improvements to make:
- Remove any remaining AI tells (check for: "delve", "in today's world", etc.)
- Strengthen weak sentences (make them more punchy)
- Ensure smooth narrative flow between paragraphs
- Keep all specific details intact

Output format:
REFINED VERSION:
[improved post]

CHANGES MADE:
- [list each change]
```

**Stage 4: Hook Optimization**
```
Context: You are optimizing the opening line (hook) of a post.
Input: [refined version]
Task: Generate 10 alternative hooks and select the best.

Hook requirements (must have ONE of these):
- Specific number in first line
- Contrarian claim that challenges conventional wisdom
- Personal failure with real stakes
- Surprising data point
- Bold action taken

Output format:
HOOK 1: [hook text]
HOOK 2: [hook text]
...
HOOK 10: [hook text]

SELECTED HOOK: Hook X
REASONING: [why this hook is strongest]

POST WITH NEW HOOK:
[full post with new hook]
```

**Stage 5: Personality Injection**
```
Context: You are adding personality to make this post uniquely theirs.
Input: [hook-optimized version], [signature phrases], [top posts for reference]
Task: Inject personality without making it obvious.

Personality elements to add:
- Use 1-2 signature phrases from: [list]
- Match sentence rhythm of their top posts
- Add subtle quirks that make it recognizable
- Don't overdo it - should feel natural

Output format:
PERSONALIZED VERSION:
[post with personality]

INJECTED ELEMENTS:
- [list what was added and where]
```

**Stage 6: Quality Check**
```
Context: You are performing final quality validation.
Input: [personalized version], [voice profile]
Task: Score the post and validate all quality gates.

Quality Gates:
1. Forbidden Phrases: Check against [forbidden list] - must be 0
2. Specificity: Count numbers/names/dates - must be 3+
3. Voice Match: Compare to top posts - must be 90%+ similar
4. Hook Strength: Evaluate opening - must pass criteria
5. Formatting: Check for em-dashes, excessive lists - per profile rules

Output format:
QUALITY SCORE: X/100

GATE RESULTS:
✓/✗ Forbidden Phrases: [count found], [list if any]
✓/✗ Specificity: [count] specific details
✓/✗ Voice Match: X% similar to top posts
✓/✗ Hook Strength: [analysis]
✓/✗ Formatting: [issues if any]

OVERALL: PASS/FAIL
ISSUES: [list if any]
FINAL POST: [if passed]
```

---

## 🎨 UI/UX SPECIFICATIONS

### Design System

**Colors:**
```css
--primary: #3B82F6 (Blue)
--secondary: #8B5CF6 (Purple)
--accent: #10B981 (Green)
--background: #FFFFFF
--surface: #F9FAFB
--text: #111827
--text-secondary: #6B7280
--border: #E5E7EB
--error: #EF4444
--warning: #F59E0B
--success: #10B981

/* Quality Score Colors */
--score-gold: #F59E0B (95-100)
--score-green: #10B981 (90-94)
--score-yellow: #FCD34D (85-89)
--score-red: #EF4444 (<85)
```

**Typography:**
```css
/* Font Family */
font-family: 'Inter', sans-serif;

/* Sizes */
--text-xs: 0.75rem (12px)
--text-sm: 0.875rem (14px)
--text-base: 1rem (16px)
--text-lg: 1.125rem (18px)
--text-xl: 1.25rem (20px)
--text-2xl: 1.5rem (24px)
--text-3xl: 1.875rem (30px)

/* Weights */
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

**Spacing:**
```css
--space-1: 0.25rem (4px)
--space-2: 0.5rem (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem (16px)
--space-6: 1.5rem (24px)
--space-8: 2rem (32px)
--space-12: 3rem (48px)
--space-16: 4rem (64px)
```

**Shadows:**
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

**Border Radius:**
```css
--radius-sm: 0.375rem (6px)
--radius-md: 0.5rem (8px)
--radius-lg: 0.75rem (12px)
--radius-xl: 1rem (16px)
--radius-full: 9999px
```

### Key User Flows

**Flow 1: First-Time User → First Post**
```
1. Land on home page
   ↓
2. Click "Get Started" CTA
   ↓
3. Create voice profile (5 steps)
   - Basic info
   - Voice rules
   - Reference posts
   - Brand colors
   - Review
   ↓
4. Redirected to dashboard
   ↓
5. Click "Create Post" → Choose flow
   ↓
6. Complete interview (6 questions)
   ↓
7. Review answers + extracted insight
   ↓
8. Submit for generation
   ↓
9. Watch generation progress (30-45 sec)
   ↓
10. Review generated post
    ↓
11. Export or edit
```

**Flow 2: Returning User → Quick Post**
```
1. Login → Dashboard
   ↓
2. Select voice profile (if multiple)
   ↓
3. Click "New Post" → Choose flow
   ↓
4. Complete interview
   ↓
5. Generate
   ↓
6. Export
```

**Flow 3: Edit Voice Profile**
```
1. Dashboard → Click voice profile card
   ↓
2. Edit voice profile page
   ↓
3. Update rules, posts, or colors
   ↓
4. Save changes
   ↓
5. All future posts use new rules
```

### Component Specifications

**QuestionCard Component:**
```typescript
// Visual design:
- Full-screen card with subtle shadow
- Question number badge (top-left, blue circle)
- Question text (large, bold, 24px)
- Textarea (min height 200px, auto-expand)
- Character count (bottom-right, gray)
- Error message (red, below textarea)
- Smooth fade-in animation (300ms)

// Behavior:
- Auto-focus textarea on mount
- Save to localStorage on every change (debounced 500ms)
- Show error if empty on submit attempt
- Enter key adds new line (not submit)
```

**GenerationLoader Component:**
```typescript
// Visual design:
- Centered modal overlay (backdrop blur)
- Progress circle (large, 200px diameter)
- Stage name (center, bold, 20px)
- Progress percentage (below stage, 48px, colored)
- Stage description (below percentage, gray, 14px)
- Estimated time (bottom, gray, 12px)
- Fun fact carousel (bottom, rotates every 10 sec)

// Stages:
1. Initial (0-20%): "Generating 5 unique versions..."
2. Selected (20-35%): "Evaluating and selecting best..."
3. Refined (35-50%): "Removing AI tells and polishing..."
4. Hook (50-65%): "Testing 10 different hooks..."
5. Personality (65-80%): "Injecting your unique voice..."
6. Final (80-95%): "Running quality checks..."
7. Complete (95-100%): "Perfect! Your post is ready."

// Animations:
- Progress circle fills smoothly
- Stage transitions fade (200ms)
- Success checkmark appears at 100%
```

**PostPreview Component:**
```typescript
// Visual design:
- Large card (max-width 800px)
- Platform toggle (top-right, pills: LinkedIn | Twitter)
- Quality score badge (top-left, colored circle)
- Editable textarea (full post content)
- Character count (below textarea, platform-specific)
- Specificity highlights (numbers/names in blue)
- Export buttons row (bottom)

// Features:
- Real-time character counting
- Platform-specific limits (LinkedIn: 3000, Twitter: 280/tweet)
- Edit mode: inline editing
- View mode: formatted preview
- Copy button with tooltip "Copied!"
- Download button → downloads .txt
- CSV export button → opens modal

// Twitter thread view:
- Shows each tweet in separate box
- Tweet numbers (1/X, 2/X)
- Thread flow indicators (arrows)
- Individual tweet copy buttons
```

---

## ✅ QUALITY CONTROL SYSTEM

### Forbidden Phrases Database (100+ terms)

**Category: Buzzwords**
```
leverage, ecosystem, synergy, paradigm, cutting-edge, next-level, 
game-changing, world-class, best-in-class, industry-leading, 
state-of-the-art, innovative, groundbreaking, revolutionary, 
transformative, disruptive, holistic, robust, scalable, seamless
```

**Category: Filler**
```
dive deep, delve into, unpack, let's explore, in today's world, 
in this day and age, at the end of the day, when all is said and done,
it goes without saying, needless to say, suffice it to say,
the fact of the matter is, for all intents and purposes
```

**Category: Generic Openers**
```
let me tell you, imagine this, picture this, think about it,
have you ever wondered, in my experience, as you know,
it's no secret that, we all know that, everyone knows
```

**Category: Engagement Bait**
```
what do you think?, let me know in the comments, 
drop a comment below, tag someone who, share if you agree,
thoughts?, agree or disagree?, hot take:, unpopular opinion:
```

**Category: Corporate Speak**
```
circle back, touch base, reach out, loop in, move the needle,
low-hanging fruit, quick win, value-add, drill down, 
take it offline, think outside the box, paradigm shift,
win-win, best practice, core competency, bandwidth
```

**Category: AI Tells**
```
moreover, furthermore, additionally, in conclusion,
it's worth noting that, it's important to note,
to summarize, in summary, as we've seen, as mentioned earlier,
moving forward, going forward, that being said, with that in mind
```

### Quality Scoring Algorithm

```typescript
function calculateQualityScore(post: string, voiceProfile: VoiceProfile): number {
  let score = 100;
  
  // Forbidden Phrases (-5 points each, max -30)
  const forbiddenFound = checkForbiddenPhrases(post);
  score -= Math.min(forbiddenFound.length * 5, 30);
  
  // Specificity (+10 points per detail, max +30)
  const specificityCount = countSpecificDetails(post);
  score += Math.min(specificityCount * 10, 30);
  score -= Math.max(0, (3 - specificityCount) * 10); // Penalty if < 3
  
  // Voice Match (compare to top posts, 0-25 points)
  const voiceMatchScore = calculateVoiceSimilarity(post, voiceProfile.topPosts);
  score += voiceMatchScore; // Already 0-25
  
  // Hook Strength (0-20 points)
  const hookScore = evaluateHook(post);
  score += hookScore; // Already 0-20
  
  // Formatting (-5 points per violation, max -15)
  const formattingIssues = checkFormatting(post, voiceProfile.rules.formattingRules);
  score -= Math.min(formattingIssues.length * 5, 15);
  
  // Sentence length variation (+5 if good, 0 if bad)
  const hasVariation = checkSentenceLengthVariation(post);
  score += hasVariation ? 5 : 0;
  
  // Ensure score stays in 0-100 range
  return Math.max(0, Math.min(100, score));
}
```

### Voice Similarity Algorithm

```typescript
function calculateVoiceSimilarity(post: string, topPosts: VoiceProfile['topPosts']): number {
  // Use Claude API to score similarity
  const prompt = `
    Compare this new post to the reference posts and score similarity 0-100.
    
    NEW POST:
    ${post}
    
    REFERENCE POSTS:
    ${topPosts.map(p => p.content).join('\n\n---\n\n')}
    
    Evaluate:
    - Sentence structure similarity
    - Rhythm and pacing
    - Word choice patterns
    - Tone consistency
    
    Return only a number 0-100.
  `;
  
  const similarity = await claudeAPI(prompt);
  return Math.min(25, similarity / 4); // Scale to 0-25 for quality score
}
```

### Hook Strength Evaluator

```typescript
function evaluateHook(post: string): number {
  const firstLine = post.split('\n')[0];
  let score = 0;
  
  // Has specific number? (+8 points)
  if (/\d+/.test(firstLine)) score += 8;
  
  // Has dollar amount or percentage? (+4 points)
  if (/[$₹][\d,]+|[\d]+%/.test(firstLine)) score += 4;
  
  // Has name or specific person? (+3 points)
  if (/[A-Z][a-z]+ [A-Z][a-z]+/.test(firstLine)) score += 3;
  
  // Starts with action verb? (+3 points)
  const actionVerbs = ['spent', 'built', 'lost', 'gained', 'failed', 'learned', 'discovered'];
  if (actionVerbs.some(v => firstLine.toLowerCase().startsWith(v))) score += 3;
  
  // Has contrarian signal words? (+5 points)
  const contrarianWords = ['actually', 'wrong', 'myth', 'lie', 'secret', 'nobody'];
  if (contrarianWords.some(w => firstLine.toLowerCase().includes(w))) score += 5;
  
  // Too long? (-5 points)
  if (firstLine.split(' ').length > 20) score -= 5;
  
  // Generic opening? (-8 points)
  const genericOpeners = ['let me tell you', 'imagine this', 'picture this', 'in my experience'];
  if (genericOpeners.some(o => firstLine.toLowerCase().includes(o))) score -= 8;
  
  return Math.max(0, Math.min(20, score));
}
```

---

## 🚀 DEPLOYMENT STRATEGY

### Pre-Deployment Checklist

```markdown
## Code Quality
- [ ] All TypeScript errors resolved
- [ ] All linting warnings fixed
- [ ] No console.logs in production code
- [ ] All TODO comments addressed

## Testing
- [ ] Test all interview flows (both types)
- [ ] Test post generation (all voice modes)
- [ ] Test quality gates (intentionally bad posts)
- [ ] Test platform conversion (LinkedIn → Twitter)
- [ ] Test export features (copy, download, CSV)
- [ ] Test on mobile (iOS Safari, Android Chrome)
- [ ] Test on desktop (Chrome, Safari, Firefox)

## Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] No bundle size warnings
- [ ] Images optimized

## Security
- [ ] API keys in environment variables
- [ ] No secrets in code
- [ ] CORS configured properly
- [ ] Rate limiting on API routes

## Content
- [ ] All example posts reviewed
- [ ] Voice mode descriptions accurate
- [ ] Help text clear and helpful
- [ ] Error messages friendly

## Analytics
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured
- [ ] Key events tracked:
  - Profile created
  - Post generated
  - Post exported
  - Generation failed
```

### Environment Variables

```bash
# .env.local (development)
ANTHROPIC_API_KEY=sk-ant-xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Vercel (production)
ANTHROPIC_API_KEY=sk-ant-xxx
NEXT_PUBLIC_APP_URL=https://william-ai.vercel.app
```

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sin1"],  // Singapore (closest to India)
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key"
  }
}
```

### Deployment Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment logs
vercel logs
```

---

## 💡 CURSOR PROMPTING GUIDE

### How to Work with Claude Opus 4.5 in Cursor

**General Principles:**
1. Be specific about what you want
2. Reference the PRD section for context
3. Ask for one feature at a time
4. Request code with TypeScript types
5. Ask for explanatory comments in code
6. Request error handling
7. Ask for responsive design

**Good Prompt Structure:**

```
Context: [What part of the app]
Task: [What to build]
Requirements:
- [Specific requirement 1]
- [Specific requirement 2]
- [Specific requirement 3]
Tech: [Technologies to use]
Output: [What files to create/modify]
```

### Example Prompts for Each Phase

**Phase 1: Setup**
```
Context: Setting up william.ai Next.js project
Task: Create project structure with all dependencies
Requirements:
- Next.js 14 with App Router
- TypeScript in strict mode
- Tailwind CSS configured
- shadcn/ui installed with base components
- File structure matching PRD section 2
Tech: Next.js 14, TypeScript, Tailwind, shadcn/ui
Output: 
- package.json with all dependencies
- tsconfig.json with strict mode
- tailwind.config.ts
- Basic app/layout.tsx
- File structure created
```

**Phase 2: Voice Profiles**
```
Context: Building voice profile creation form
Task: Create multi-step form component for voice profile setup
Requirements:
- 5 steps: basic info, rules, reference posts, colors, review
- Progress indicator showing current step
- Validation on each step before proceeding
- Save to localStorage on completion
- Use shadcn/ui form components
Tech: React, TypeScript, shadcn/ui form components
Output:
- app/voice-profile/new/page.tsx
- components/voice-profile/RulesEditor.tsx
- components/voice-profile/ReferencePostUpload.tsx
- Full form logic with validation
```

**Phase 3: Interview Flow**
```
Context: Building Personal Experience interview flow
Task: Create interview flow with 6 questions and AI insight extraction
Requirements:
- One question per screen
- Progress bar showing current question
- Next/Back navigation
- Auto-save answers to localStorage
- Call AI insight extraction after Q6
- Display extracted insight for user review
Tech: React, TypeScript, Anthropic API
Output:
- app/create/experience/page.tsx
- components/interview/QuestionCard.tsx
- components/interview/ProgressBar.tsx
- app/api/extract-insight/route.ts
```

**Phase 4: Generation Pipeline**
```
Context: Building multi-stage generation pipeline
Task: Create orchestrator for 6-stage post generation
Requirements:
- Stage 1: Generate 5 versions in parallel
- Stage 2: Select best version with scoring
- Stage 3: Refine selected version
- Stage 4: Optimize hook (10 options)
- Stage 5: Inject personality from profile
- Stage 6: Run quality gates (must score 85+)
- If fail: retry up to 3 times
- Stream progress updates to frontend
Tech: TypeScript, Anthropic API, React hooks for streaming
Output:
- lib/pipeline/multi-stage.ts
- lib/prompts/generation.ts (all stage prompts)
- app/api/generate/route.ts
- Hook for frontend to call API with progress
```

### Debugging with Claude

When something doesn't work:

```
I'm getting this error:
[paste error message]

In this file:
[paste relevant code]

Context:
[explain what you were trying to do]

Help me:
1. Understand what's causing the error
2. Fix the error
3. Add error handling so it doesn't happen again
```

### Iterating on Features

When you want to improve something:

```
This feature works but I want to improve it:
[paste current code]

Improvements needed:
- [specific improvement 1]
- [specific improvement 2]
- [specific improvement 3]

Keep:
- [what should stay the same]

Change:
- [what should change]
```

---

## 📈 POST-MVP FEATURES

Once the MVP is working, consider these enhancements:

### Phase 9: Advanced Features
- **A/B Testing:** Generate 2-3 versions, let user pick
- **Engagement Analytics:** Track post performance
- **Auto-Scheduling:** Integration with Buffer/Hootsuite
- **Team Collaboration:** Multiple users per voice profile
- **White-Label:** Custom branding for agencies

### Phase 10: AI Improvements
- **Learning from Performance:** Train on well-performing posts
- **Style Transfer:** Apply one profile's voice to another's content
- **Multi-Language:** Support for non-English posts
- **Voice Cloning:** Better personality capture from fewer samples

### Phase 11: Platform Expansion
- **Instagram Captions:** Adapted generation
- **YouTube Scripts:** Long-form content
- **Email Newsletters:** Different format, same voice
- **Blog Posts:** Extended content generation

---

## 🎯 SUCCESS CRITERIA

### MVP Launch Criteria

**Technical:**
- [ ] All 2 interview flows working end-to-end
- [ ] Multi-stage generation producing quality posts
- [ ] Quality gates catching slop (< 1% slop posts through)
- [ ] Voice profiles persisting correctly
- [ ] Platform conversion working (LinkedIn → Twitter)
- [ ] Export features functional
- [ ] Mobile responsive
- [ ] Deployed to production

**Quality:**
- [ ] Generated posts score 85+ consistently
- [ ] Human reviewers can't identify AI-generated posts
- [ ] Voice similarity to reference posts 90%+
- [ ] Zero forbidden phrases in output
- [ ] Editing time < 2 minutes per post

**User Experience:**
- [ ] Interview flows feel natural and guided
- [ ] Generation completes in < 60 seconds
- [ ] Loading states are smooth and informative
- [ ] Error messages are helpful
- [ ] UI is intuitive (no explanation needed)

### Business Validation Criteria

**For Superstrat Labs:**
- [ ] Saves 10+ hours/month per client
- [ ] Quality matches or exceeds manual editing
- [ ] Clients can't tell it's AI-generated
- [ ] Reduces client revisions by 50%+
- [ ] Agency willing to pay ₹15-25k/month

**For Individual Users:**
- [ ] Can create voice profile in < 10 minutes
- [ ] Generate quality post in < 5 minutes total
- [ ] Would use instead of manual writing
- [ ] Would recommend to others
- [ ] Willing to pay subscription fee

---

## 🚨 CRITICAL REMINDERS

### Non-Negotiables

1. **NEVER skip quality gates** - If post scores < 85, regenerate
2. **NEVER allow forbidden phrases** - Zero tolerance
3. **NEVER sacrifice specificity** - Must have 3+ specific details
4. **NEVER skip voice matching** - Must be 90%+ similar to reference
5. **NEVER genericize** - LinkedIn → Twitter keeps all specifics

### Common Pitfalls to Avoid

1. **One-shot generation** - Multi-stage is mandatory
2. **Skipping refinement stages** - Each stage catches different slop
3. **Not saving all pipeline stages** - Needed for debugging
4. **Forgetting mobile responsive** - Test on phones
5. **Not handling API errors** - Claude API can fail
6. **Skipping loading states** - 30-45 sec feels long without feedback
7. **Not validating inputs** - Voice profiles need 20+ rules

### Testing Checklist

Before calling it done:

- [ ] Test with terrible inputs (all caps, no punctuation)
- [ ] Test with minimal inputs (1 word answers)
- [ ] Test with maximum inputs (1000 word answers)
- [ ] Test with emoji-filled inputs
- [ ] Test with code/special characters
- [ ] Test with non-English characters
- [ ] Test on slow internet (throttle network)
- [ ] Test with API failures (disconnect network mid-gen)
- [ ] Test localStorage quota (fill it up)
- [ ] Test on iPhone 6 (small, old device)
- [ ] Test on iPad landscape
- [ ] Test on 27" monitor (4K)

---

## 📝 APPENDIX

### Example Voice Profile

```json
{
  "id": "vp_001",
  "name": "Alankrit - Tech Founder Voice",
  "rules": {
    "sentencePatterns": [
      "Never use em-dashes",
      "Start paragraphs with action verbs",
      "Use short sentences (12-18 words avg)",
      "Always include specific numbers",
      "End with a question to audience",
      "No corporate jargon allowed",
      "Use rupee symbol ₹ not 'rupees'",
      "Refer to users as 'founders' not 'entrepreneurs'",
      "Personal stories in past tense",
      "Data points in present tense",
      "No rhetorical questions mid-post",
      "Use 'we' for shared experiences",
      "Use 'I' for personal learnings",
      "Break into 1-2 line paragraphs",
      "White space between every paragraph",
      "No bullet points unless listing exact steps",
      "Hook must include a number or name",
      "Close with actionable takeaway",
      "Never apologize or hedge",
      "State opinions as facts"
    ],
    "forbiddenWords": [
      "utilize", "implement", "facilitate", 
      "optimize", "streamline", "enhance",
      "basically", "actually", "literally",
      "amazing", "awesome", "incredible"
    ],
    "signaturePhrases": [
      "Here's what I learned:",
      "The data doesn't lie:",
      "Most founders miss this:",
      "Real talk:"
    ],
    "rhythmPreferences": {
      "avgSentenceLength": 15,
      "paragraphBreaks": "frequent",
      "punchlinePosition": "end",
      "questionUsage": "occasional"
    },
    "formattingRules": {
      "useEmDash": false,
      "useBulletPoints": false,
      "useNumberedLists": true,
      "emojiUsage": "rare"
    }
  },
  "topPosts": [
    {
      "content": "Spent ₹8L on Meta ads. Zero meetings.\n\nGot mentioned on one podcast. 12 calls. Closed ₹15L.\n\nB2B buyers don't search. They ask peers.\n\nAds interrupt them at the wrong moment.\n\nPodcasts catch them when they're already listening.\n\nMost founders waste money on the wrong channel.\n\nWhat's working for you?",
      "platform": "linkedin",
      "engagement": 1247
    },
    {
      "content": "Built our MVP in 6 weeks.\n\nRebuild took 6 months.\n\nThe rush cost us 4x the time.\n\nWhen you skip planning:\n\n1. Foundations are weak\n2. Scaling breaks everything\n3. Technical debt compounds\n4. Team morale tanks\n\nSlow is smooth. Smooth is fast.\n\nMost founders learn this the expensive way.",
      "platform": "linkedin",
      "engagement": 892
    }
  ],
  "brandColors": {
    "primary": "#3B82F6",
    "secondary": "#8B5CF6",
    "accent": "#10B981"
  }
}
```

### Example Generated Post (All Stages)

**Stage 1: Initial Versions (5)**

Version 1:
```
Spent ₹12L on hiring a senior dev.

They quit after 3 months.

Hired a junior at ₹6L.

They're still here 2 years later.

Built our entire product.

Senior devs know their worth. They leave for better offers.

Junior devs want to prove themselves. They stay and learn.

Most startups overhire. Then wonder why retention sucks.

Who's on your team?
```

Version 2:
```
Our senior dev quit after 3 months.

Cost us ₹12L in salary + hiring costs.

Replaced with a junior at ₹6L.

That junior is now our CTO.

2 years later. Still with us.

The senior had options. We were just another job.

The junior saw opportunity. We were their big break.

Loyalty isn't bought with salary. It's earned with opportunity.

Most founders chase resumes. Then complain about churn.

What matters more: experience or hunger?
```

... (3 more versions)

**Stage 2: Selected Version**

Selected: Version 2
Reasoning: Stronger narrative arc, clear before/after, ends with thought-provoking question. Has all required specifics (₹12L, ₹6L, 3 months, 2 years, CTO title).

**Stage 3: Refined Version**

```
Our senior dev quit after 3 months.

₹12L in salary plus recruiting costs. Gone.

Replaced with a junior at ₹6L annually.

That junior is now our CTO. 2 years later. Still here.

The senior had options. We were just another job.

The junior saw opportunity. We were their break.

Loyalty isn't bought with salary. It's earned with opportunity.

Most founders chase resumes. Complain about churn.

What matters more: experience or hunger?
```

Changes:
- Shortened "Cost us" to just state the loss
- Combined "2 years later. Still with us." for punch
- Removed "then" from last line (more direct)

**Stage 4: Hook-Optimized**

Best Hook: "₹12L senior dev quit in 3 months."

Final:
```
₹12L senior dev quit in 3 months.

Salary plus recruiting costs. All gone.

Replaced with ₹6L junior.

That junior is now our CTO. 2 years in. Still here.

The senior had options. We were just another gig.

The junior saw opportunity. We were their shot.

Loyalty isn't bought with salary. It's earned with opportunity.

Most founders chase resumes. Then complain about churn.

Experience or hunger. What matters more?
```

**Stage 5: Personality-Injected**

```
₹12L senior dev quit in 3 months.

Salary plus recruiting costs. All gone.

Replaced with ₹6L junior.

That junior is now our CTO. 2 years in. Still here.

Here's what I learned:

The senior had options. We were just another gig.

The junior saw opportunity. We were their shot.

Loyalty isn't bought with salary. It's earned with opportunity.

Most founders chase resumes. Complain about churn.

Real talk: Experience or hunger. What matters more?
```

Injected: "Here's what I learned:" and "Real talk:" signature phrases

**Stage 6: Final Quality Check**

Score: 92/100

Quality Gates:
✓ Forbidden Phrases: 0 found
✓ Specificity: 5 details (₹12L, 3 months, ₹6L, CTO, 2 years)
✓ Voice Match: 94% similar
✓ Hook Strength: Strong (specific number + loss)
✓ Formatting: Clean (no em-dashes, good rhythm)

PASSED - Ready for export

---

**END OF PRD**

This document contains everything needed to build william.ai from 0 to production using Cursor with Claude Opus 4.5. Follow the phases sequentially, use the example prompts, and refer back to this PRD whenever you're unsure about implementation details.

Good luck building! 🚀
