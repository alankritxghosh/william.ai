# 🚀 William.ai - Zero-Slop GTM Implementation Plan
## For Cursor + Claude Opus 4.5 Vibe Coding

**100% Synced with PRD** | **No Over-Engineering** | **Security First** | **User-Focused**

---

## 🎯 IMPLEMENTATION PHILOSOPHY

### Core Principles
1. **Build exactly what the PRD specifies** - No more, no less
2. **localStorage for MVP** - No premature backend optimization
3. **Client-side generation** - Keep it simple, move to server post-MVP
4. **Template-based carousels** - No dynamic design complexity
5. **Essential features only** - Ship fast, iterate based on real usage

### What We're NOT Building (Post-MVP)
- ❌ Server-side API rewrite (Phase 1-8 is client-side)
- ❌ Database/backend (localStorage is the spec)
- ❌ 20-30 carousel templates (start with 8)
- ❌ Dark mode (not in PRD Phase 1-8)
- ❌ Advanced analytics (Vercel Analytics only)
- ❌ Sentry/monitoring services (console.error for MVP)

---

## 📋 DEVELOPMENT ROADMAP

### SESSION 1: Foundation (2-3 hours)
**PRD Reference:** Phase 1

#### 1.1 Project Setup
```bash
# Cursor Prompt:
"Following the william.ai PRD Phase 1, create a Next.js 14 project with:
- TypeScript (strict mode)
- App Router
- Tailwind CSS
- shadcn/ui with these components: button, card, input, textarea, select, progress, badge, dialog, label
- Framer Motion
- File structure EXACTLY as shown in PRD section 'Project File Structure'
- .env.example with ANTHROPIC_API_KEY placeholder
- Basic app/layout.tsx with navigation header
- Dark mode class strategy configured in Tailwind (no UI toggle yet)"
```

**Deliverables:**
- [ ] Next.js app running on localhost:3000
- [ ] All dependencies installed
- [ ] File structure matches PRD
- [ ] shadcn/ui theme configured (Primary: #3B82F6)

---

#### 1.2 Type Definitions
```typescript
// Cursor Prompt for lib/types.ts:
"Create TypeScript type definitions EXACTLY as specified in PRD 'Data Models' section.
Include all types:
- VoiceProfile (with 20+ rules requirement)
- VoiceMode
- InterviewResponse (Experience + Pattern flows)
- GeneratedPost (with full pipeline stages)
- CarouselTemplate and CarouselPage
- QualityGate and QualityReport
- APIResponse
- Context types

Ensure strict typing, no 'any' types."
```

**Deliverables:**
- [ ] lib/types.ts with all PRD-specified types
- [ ] TypeScript strict mode passing

---

#### 1.3 Anthropic API Wrapper
```typescript
// Cursor Prompt for lib/anthropic.ts:
"Create a Claude API wrapper as specified in PRD Phase 1:

Functions needed:
1. generateWithClaude(prompt, options) - single generation
2. generateMultipleVersions(prompt, count) - parallel generation for Stage 1
3. streamGeneration(prompt, onChunk) - streaming for user feedback

Requirements:
- Use Claude Opus 4 (claude-opus-4-20250514)
- Retry logic for rate limits (3 attempts max, exponential backoff)
- Error handling for network issues
- Full TypeScript types
- No over-engineering - keep it simple

Reference ANTHROPIC_API_KEY from env"
```

**Deliverables:**
- [ ] lib/anthropic.ts with 3 core functions
- [ ] Error handling for rate limits
- [ ] TypeScript types for all requests/responses

---

#### 1.4 localStorage Wrapper
```typescript
// Cursor Prompt for lib/utils/storage.ts:
"Create a type-safe localStorage wrapper as specified in PRD Phase 1:

Functions:
- saveVoiceProfile(profile: VoiceProfile): void
- loadVoiceProfiles(): VoiceProfile[]
- savePost(post: GeneratedPost): void
- loadPosts(voiceProfileId?: string): GeneratedPost[]
- deleteVoiceProfile(id: string): void
- deletePost(id: string): void

Handle:
- JSON serialization/deserialization
- localStorage quota exceeded errors (show friendly message)
- Corrupted data (graceful fallback to empty array)
- Migration support (version key in storage)

No database, no backend - just localStorage per PRD."
```

**Deliverables:**
- [ ] lib/utils/storage.ts with 6 functions
- [ ] Error handling for quota exceeded
- [ ] Migration support for schema changes

---

### SESSION 2: Voice Profile System (3-4 hours)
**PRD Reference:** Phase 2

#### 2.1 Voice Mode Definitions
```typescript
// Cursor Prompt for data/voice-modes.ts:
"Create 5 voice modes EXACTLY as specified in PRD Phase 2:

1. Thought Leader (🎯)
   - Authoritative, data-driven
   - Sentence patterns: Direct statements, cite sources, use data
   - Forbidden: Fluffy language, unsubstantiated claims
   - Hook styles: Start with surprising stat, bold claim
   - 5+ example hooks
   - 3+ full example posts

2. Storyteller (📖)
   - Vulnerable, narrative-driven
   - Sentence patterns: Short punchy sentences, emotion words
   - Forbidden: Corporate speak, jargon
   - Hook styles: Start with a moment, set the scene

3. Educator (🎓)
   - Clear, helpful, step-by-step
   - Sentence patterns: Use analogies, numbered steps
   - Forbidden: Condescending language, complexity
   - Hook styles: Start with the problem, promise solution

4. Provocateur (💥)
   - Bold, controversial, direct
   - Sentence patterns: Challenge assumptions, ask hard questions
   - Forbidden: Hedging language, apologies
   - Hook styles: Contrarian take, controversial statement

5. Community Builder (🤝)
   - Casual, friendly, conversational
   - Sentence patterns: Ask questions, use 'we/us', relatable
   - Forbidden: Corporate speak, formal language
   - Hook styles: Start with shared experience, ask question

Export as VoiceMode[] array with all fields from PRD types."
```

**Deliverables:**
- [ ] data/voice-modes.ts with 5 complete voice modes
- [ ] Each mode has 5+ hooks, 3+ example posts
- [ ] Matches PRD specification exactly

---

#### 2.2 Forbidden Phrases Database
```typescript
// Cursor Prompt for lib/guardrails/forbidden-phrases.ts:
"Create forbidden phrases system as specified in PRD Phase 2:

1. Array of 100+ forbidden AI slop terms:
   - Buzzwords: leverage, ecosystem, synergy, paradigm, cutting-edge, next-level, game-changing, world-class, best-in-class, industry-leading, state-of-the-art, innovative, groundbreaking, revolutionary, transformative, disruptive, holistic, robust, scalable, seamless
   - Filler: dive deep, delve into, unpack, let's explore, in today's world, in this day and age, at the end of the day, when all is said and done, it goes without saying, needless to say, suffice it to say, the fact of the matter is, for all intents and purposes
   - Generic Openers: let me tell you, imagine this, picture this, think about it, have you ever wondered, in my experience, as you know, it's no secret that, we all know that, everyone knows
   - Engagement Bait: what do you think?, let me know in the comments, drop a comment below, tag someone who, share if you agree, thoughts?, agree or disagree?, hot take:, unpopular opinion:
   - Corporate Speak: circle back, touch base, reach out, loop in, move the needle, low-hanging fruit, quick win, value-add, drill down, take it offline, think outside the box, paradigm shift, win-win, best practice, core competency, bandwidth
   - AI Tells: moreover, furthermore, additionally, in conclusion, it's worth noting that, it's important to note, to summarize, in summary, as we've seen, as mentioned earlier, moving forward, going forward, that being said, with that in mind

2. checkForForbiddenPhrases(text: string): { phrase: string; position: number; context: string }[]
   - Case-insensitive matching
   - Return all matches with position and context

3. scoreTextQuality(text: string): number
   - 0-100 score
   - Deduct 5 points per forbidden phrase (max -30)
   - Award 10 points per specific detail: numbers, names, dates (max +30)
   - Base score: 100

Use the exact forbidden phrases from PRD Quality Control System section."
```

**Deliverables:**
- [ ] lib/guardrails/forbidden-phrases.ts
- [ ] 100+ forbidden phrases array
- [ ] checkForForbiddenPhrases function
- [ ] scoreTextQuality function

---

#### 2.3 Voice Profile Creation Form
```typescript
// Cursor Prompt for app/voice-profile/new/page.tsx:
"Create multi-step voice profile creation form as specified in PRD Phase 2:

5 Steps with progress bar:

Step 1: Basic Info
- Profile name input (required)
- Target platform checkboxes: LinkedIn, Twitter, Both

Step 2: Voice Rules (20+ REQUIRED - this is critical)
- Dynamic array for sentence patterns (min 8)
- Dynamic array for forbidden words (min 5)
- Dynamic array for signature phrases (min 3)
- Rhythm preferences:
  - avgSentenceLength: number input (12-18 default)
  - paragraphBreaks: select (frequent/moderate/rare)
  - punchlinePosition: select (end/middle/start)
  - questionUsage: select (never/occasional/frequent)
- Formatting preferences:
  - useEmDash: checkbox (default false)
  - useBulletPoints: checkbox
  - useNumberedLists: checkbox
  - emojiUsage: select (never/rare/moderate/frequent)
- Validation: Total rules must be 20+
- Show rule count indicator

Step 3: Reference Posts (2 options)
Option A: I have posts
  - Upload 5 top-performing posts
  - For each: content textarea, platform select, engagement number
Option B: Use reference creator
  - Creator name input
  - Platform select
  - 3-5 sample posts textareas
  - Notes field (why this creator)

Step 4: Brand Colors
- Color pickers: primary, secondary, accent
- Preview swatch

Step 5: Review & Save
- Summary of all inputs
- Edit buttons for each step
- Save to localStorage via storage.ts
- Redirect to /dashboard

Use shadcn/ui components.
Add Framer Motion transitions between steps.
Next/Back navigation buttons.
Progress bar at top showing X/5 steps."
```

**Deliverables:**
- [ ] app/voice-profile/new/page.tsx
- [ ] 5-step form with validation
- [ ] 20+ rules requirement enforced
- [ ] Reference creator option implemented
- [ ] Saves to localStorage

---

#### 2.4 Voice Profile List & Edit
```typescript
// Cursor Prompt for app/voice-profile/page.tsx:
"Create voice profile list page:

Layout:
- Grid of profile cards (3 cols desktop, 2 tablet, 1 mobile)
- Each card shows:
  - Profile name
  - Platform badges (LinkedIn/Twitter icons)
  - Stats: X posts, last used X days ago
  - Active indicator if currently selected
  - Actions menu (⋮):
    - Set as active
    - Edit
    - Duplicate
    - Delete (with confirmation dialog)
- Empty state: 'Create your first voice profile' CTA
- + New Profile button (top right)

Use PostContext to get post counts.
Use VoiceProfileContext for active profile.
Framer Motion for card hover effects."

// Cursor Prompt for app/voice-profile/[id]/page.tsx:
"Create voice profile edit page:
- Load profile by ID from context
- Same 5-step form as /new but pre-populated
- Save updates to localStorage
- Show 'Updated successfully' toast on save"
```

**Deliverables:**
- [ ] app/voice-profile/page.tsx (list view)
- [ ] app/voice-profile/[id]/page.tsx (edit view)
- [ ] Delete confirmation dialog
- [ ] Duplicate profile feature

---

#### 2.5 Voice Profile Context
```typescript
// Cursor Prompt for lib/context/VoiceProfileContext.tsx:
"Create React Context for voice profiles as specified in PRD Phase 2:

State:
- profiles: VoiceProfile[]
- activeProfile: VoiceProfile | null

Functions:
- createProfile(profile: Omit<VoiceProfile, 'id' | 'createdAt' | 'updatedAt'>)
  - Generate UUID for id
  - Add timestamps
  - Save to localStorage
  - Add to state
- updateProfile(id: string, updates: Partial<VoiceProfile>)
  - Update updatedAt timestamp
  - Save to localStorage
  - Update state
- deleteProfile(id: string)
  - Remove from localStorage
  - Remove from state
  - If was active, set activeProfile to null
- setActiveProfile(profile: VoiceProfile | null)
  - Save to localStorage as 'activeProfileId'
  - Update state

Load on mount:
- Load profiles from localStorage
- Load activeProfileId from localStorage
- Find and set active profile

Wrap entire app in layout.tsx"
```

**Deliverables:**
- [ ] lib/context/VoiceProfileContext.tsx
- [ ] All CRUD operations working
- [ ] Persists to localStorage
- [ ] Wrapped in app/layout.tsx

---

### SESSION 3: Interview Flows (4-5 hours)
**PRD Reference:** Phase 3

#### 3.1 Interview Components
```typescript
// Cursor Prompt for components/interview/:
"Create interview flow components as specified in PRD Phase 3:

1. QuestionCard.tsx
   - Props: questionNumber, questionText, value, onChange, error
   - Large textarea (min 200px, auto-expand)
   - Character count (bottom-right)
   - Question number badge (top-left, blue circle)
   - Error message if validation fails
   - Framer Motion fade-in animation (300ms)
   - Auto-focus textarea on mount
   - Auto-save to localStorage every 500ms (debounced)

2. ProgressBar.tsx
   - Shows: current question / total questions
   - Visual progress bar with percentage
   - Flow type badge (Experience / Pattern)
   - Selected voice mode (emoji + name)
   - Animated transitions between steps

3. VoiceModeSelector.tsx
   - 5 voice mode cards in grid
   - Each shows: emoji, name, description
   - Highlight selected mode
   - Click to select
   - Framer Motion selection animation
   - AI suggestion badge if applicable

4. NavigationButtons.tsx
   - Back button (disabled on first question)
   - Next button (validates before proceeding)
   - Submit button (only on last question)
   - Loading spinner on async actions

Use shadcn/ui components throughout."
```

**Deliverables:**
- [ ] 4 interview components created
- [ ] Auto-save working (debounced)
- [ ] Validation on Next button
- [ ] Animations smooth

---

#### 3.2 Personal Experience Flow
```typescript
// Cursor Prompt for app/create/experience/page.tsx:
"Create Personal Experience interview flow as specified in PRD Phase 3:

Flow (8 screens):
1. Select voice mode (VoiceModeSelector)
2. Q1: What happened? (Describe the factual events)
3. Q2: What were the results? (Specific numbers)
4. Q3: How did that make you feel? (Emotional element)
5. Q4: What did you try instead? (Contrast/alternative)
6. Q5: What happened from that? (Alternative results)
7. Q6: Why do you think it worked/failed? (Your theory)
8. Review screen with all answers + extracted insight

Features:
- One question per screen
- ProgressBar at top
- QuestionCard for each question
- NavigationButtons for Next/Back
- Validate answer not empty, min 10 chars
- Save draft to localStorage as 'experienceFlowDraft'
- After Q6: Call /api/extract-insight
- Show extracted insight in editable textarea
- Allow user to edit insight
- Submit button sends to generation

State management:
- Current step (0-7)
- Answers object
- Selected voice mode
- Extracted insight

Use QuestionCard, ProgressBar, NavigationButtons components."
```

**Deliverables:**
- [ ] app/create/experience/page.tsx
- [ ] 8-screen flow working
- [ ] Draft saving to localStorage
- [ ] Validation on each step
- [ ] Calls insight extraction after Q6

---

#### 3.3 Pattern Recognition Flow
```typescript
// Cursor Prompt for app/create/pattern/page.tsx:
"Create Pattern Recognition interview flow as specified in PRD Phase 3:

Flow (7 screens):
1. Select voice mode (VoiceModeSelector)
2. Q1: How many times have you seen this? (Sample size)
3. Q2: Give me 2-3 specific examples (With numbers/names)
4. Q3: What's ALWAYS true? (The pattern)
5. Q4: What do most people miss? (The insight)
6. Q5: What surprises you? (Contrarian element)
7. Review screen with all answers + extracted insight

Same features as Experience flow but different questions.
Save draft to 'patternFlowDraft'."
```

**Deliverables:**
- [ ] app/create/pattern/page.tsx
- [ ] 7-screen flow working
- [ ] Same auto-save and validation as Experience

---

#### 3.4 AI Insight Extraction
```typescript
// Cursor Prompt for app/api/extract-insight/route.ts:
"Create insight extraction API as specified in PRD Phase 3:

POST /api/extract-insight
Input: { answers: InterviewResponse['answers'], flowType: 'experience' | 'pattern' }

For Experience flow, extract:
{
  insight: string;        // The unique angle they don't see
  angle: string;          // How to frame the story
  hook: string;           // Emotional hook to use
  contrarian: string;     // What contradicts conventional wisdom
}

For Pattern flow, extract:
{
  pattern: string;        // The clear pattern claim
  blindSpot: string;      // What others miss
  urgency: string;        // Why it matters now
  proof: string;          // Data points to emphasize
}

Use Claude API with prompts from lib/prompts/interview.ts
Return JSON response
Handle errors gracefully"

// Cursor Prompt for lib/prompts/interview.ts:
"Create insight extraction prompts:

getExperienceInsightPrompt(answers): 
'You are analyzing a personal experience story to extract insights.

Answers:
Q1 (What happened): {answers.q1}
Q2 (Results): {answers.q2}
Q3 (Feeling): {answers.q3}
Q4 (Alternative): {answers.q4}
Q5 (Alternative results): {answers.q5}
Q6 (Theory): {answers.q6}

Extract:
1. UNIQUE ANGLE: What angle makes this story compelling? What do they not realize is interesting?
2. EMOTIONAL HOOK: What emotion drives this story? Fear, surprise, vindication, regret?
3. CONTRARIAN ELEMENT: What contradicts conventional wisdom?

Return JSON only:
{
  \"insight\": \"...\",
  \"angle\": \"...\",
  \"hook\": \"...\",
  \"contrarian\": \"...\"
}'

Similar for getPatternInsightPrompt(answers)"
```

**Deliverables:**
- [ ] app/api/extract-insight/route.ts working
- [ ] lib/prompts/interview.ts with extraction prompts
- [ ] Returns structured JSON
- [ ] Integrated into both interview flows

---

#### 3.5 Insight Display Component
```typescript
// Cursor Prompt for components/interview/InsightExtractor.tsx:
"Create insight display component:

Props:
- insight: ExtractedInsight (from API response)
- onEdit: (edited: string) => void
- loading: boolean

UI:
- Card with title 'AI-Extracted Insights'
- For Experience flow:
  - Unique Angle section (editable)
  - Emotional Hook section (editable)
  - Contrarian Element section (editable)
- For Pattern flow:
  - Pattern Claim section (editable)
  - Blind Spot section (editable)
  - Urgency/Timing section (editable)
- Edit mode: textarea for each section
- Save button to confirm edits
- Loading state: skeleton loaders
- Framer Motion fade-in animation

Let user refine the AI's extraction before proceeding."
```

**Deliverables:**
- [ ] components/interview/InsightExtractor.tsx
- [ ] Editable sections
- [ ] Saves edited insights
- [ ] Loading state

---

### SESSION 4: Multi-Stage Generation Pipeline (6-8 hours)
**PRD Reference:** Phase 4
**CRITICAL:** This is the core moat of william.ai

#### 4.1 Generation Prompts Library
```typescript
// Cursor Prompt for lib/prompts/generation.ts:
"Create ALL 6 generation stage prompts EXACTLY as specified in PRD Phase 4:

Stage 1: Initial Generation (5 versions)
getStage1Prompt(interview, voiceMode, voiceProfile):
'Context: You are generating LinkedIn/Twitter content that sounds human-written.

Input:
- Interview answers: {JSON.stringify(interview.answers)}
- Extracted insight: {interview.extractedInsight}
- Voice mode: {voiceMode.name} - {voiceMode.description}
- Voice profile rules: {JSON.stringify(voiceProfile.rules)}

Task: Generate 5 completely different versions of a post based on this input.

Requirements:
- Each version must include specific numbers/names/dates from the interview
- Match the {voiceMode.name} style exactly
- Follow all voice profile rules
- NO forbidden phrases (never use: leverage, ecosystem, synergy, ...)
- Each version should take a different angle on the same story

Output format:
VERSION 1:
[post content]

VERSION 2:
[post content]

VERSION 3:
[post content]

VERSION 4:
[post content]

VERSION 5:
[post content]'

Stage 2: Version Selection
getStage2Prompt(versions):
'Context: You are evaluating 5 versions of a post to select the best one.

Versions:
{versions.map((v, i) => `VERSION ${i+1}:\n${v}`).join('\n\n')}

Task: Score each version and select the best.

Scoring criteria (0-100):
- Specificity (30 points): Count of specific numbers/names/dates
- Voice match (25 points): How well it matches the voice mode
- Hook strength (25 points): Is the opening line compelling?
- No slop (20 points): Zero forbidden phrases, no AI tells

Output format:
SCORES:
Version 1: X/100 (specificity: X, voice: X, hook: X, no-slop: X)
Version 2: X/100 (specificity: X, voice: X, hook: X, no-slop: X)
Version 3: X/100 (specificity: X, voice: X, hook: X, no-slop: X)
Version 4: X/100 (specificity: X, voice: X, hook: X, no-slop: X)
Version 5: X/100 (specificity: X, voice: X, hook: X, no-slop: X)

SELECTED: Version X
REASONING: [why this version is best]'

Stage 3: Refinement
getStage3Prompt(selectedVersion):
'Context: You are refining a good post to make it great.

Current version:
{selectedVersion}

Task: Improve the post without losing its core.

Improvements to make:
- Remove any remaining AI tells (check for: delve, in today's world, etc.)
- Strengthen weak sentences (make them more punchy)
- Ensure smooth narrative flow between paragraphs
- Keep all specific details intact
- No em-dashes unless explicitly allowed

Output format:
REFINED VERSION:
[improved post]

CHANGES MADE:
- [list each change]'

Stage 4: Hook Optimization (10 hooks)
getStage4Prompt(refinedVersion):
'Context: You are optimizing the opening line (hook) of a post.

Current post:
{refinedVersion}

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
HOOK 3: [hook text]
HOOK 4: [hook text]
HOOK 5: [hook text]
HOOK 6: [hook text]
HOOK 7: [hook text]
HOOK 8: [hook text]
HOOK 9: [hook text]
HOOK 10: [hook text]

SELECTED HOOK: Hook X
REASONING: [why this hook is strongest]

POST WITH NEW HOOK:
[full post with new hook]'

Stage 5: Personality Injection
getStage5Prompt(hookOptimizedVersion, voiceProfile):
'Context: You are adding personality to make this post uniquely theirs.

Current post:
{hookOptimizedVersion}

Signature phrases to use (1-2 only):
{voiceProfile.rules.signaturePhrases.join(', ')}

Reference posts for rhythm:
{voiceProfile.topPosts.map(p => p.content).join('\n\n---\n\n')}

Task: Inject personality without making it obvious.

Personality elements to add:
- Use 1-2 signature phrases from the list
- Match sentence rhythm of their top posts
- Add subtle quirks that make it recognizable
- Don't overdo it - should feel natural

Output format:
PERSONALIZED VERSION:
[post with personality]

INJECTED ELEMENTS:
- [list what was added and where]'

Stage 6: Quality Check
getStage6Prompt(personalizedVersion, voiceProfile):
'Context: You are performing final quality validation.

Post to validate:
{personalizedVersion}

Voice profile:
- Forbidden words: {voiceProfile.rules.forbiddenWords.join(', ')}
- Formatting rules: {JSON.stringify(voiceProfile.rules.formattingRules)}

Task: Score the post and validate all quality gates.

Quality Gates:
1. Forbidden Phrases: Check against global list + profile words - must be 0
2. Specificity: Count numbers/names/dates - must be 3+
3. Voice Match: Compare to top posts - must feel similar
4. Hook Strength: Evaluate opening - must pass criteria
5. Formatting: Check for em-dashes, excessive lists - per profile rules

Output format:
QUALITY SCORE: X/100

GATE RESULTS:
✓/✗ Forbidden Phrases: [count found], [list if any]
✓/✗ Specificity: [count] specific details
✓/✗ Voice Match: [analysis]
✓/✗ Hook Strength: [analysis]
✓/✗ Formatting: [issues if any]

OVERALL: PASS/FAIL
ISSUES: [list if any]
FINAL POST: [if passed]'

Export all functions with proper TypeScript types."
```

**Deliverables:**
- [ ] lib/prompts/generation.ts with 6 stage prompts
- [ ] Each prompt follows PRD specification exactly
- [ ] Stage 4 generates 10 hooks (not 3)
- [ ] All prompts return parseable output

---

#### 4.2 Multi-Stage Pipeline Orchestrator
```typescript
// Cursor Prompt for lib/pipeline/multi-stage.ts:
"Create the 6-stage generation orchestrator as specified in PRD Phase 4:

async function generatePost(
  interview: InterviewResponse,
  voiceProfile: VoiceProfile,
  onProgress?: (update: { stage: string; progress: number; message: string }) => void
): Promise<GeneratedPost | { error: string; failureReason: string }>

Process:
1. Stage 1: Generate 5 versions (parallel)
   - Use generateMultipleVersions from anthropic.ts
   - onProgress?.({ stage: 'initial', progress: 20, message: 'Generating 5 unique versions...' })
   - Parse all 5 versions from response

2. Stage 2: Select best version
   - Call Claude with all 5 versions
   - Parse selected version + reasoning
   - onProgress?.({ stage: 'selected', progress: 35, message: 'Evaluating and selecting best version...' })

3. Stage 3: Refine version
   - Call Claude with selected version
   - Parse refined version + changes made
   - onProgress?.({ stage: 'refined', progress: 50, message: 'Removing AI tells and polishing...' })

4. Stage 4: Optimize hook (10 hooks)
   - Call Claude to generate 10 hooks
   - Parse all 10 hooks + selected hook + final post
   - onProgress?.({ stage: 'hook-optimized', progress: 65, message: 'Testing 10 different hooks...' })

5. Stage 5: Inject personality
   - Call Claude with voice profile data
   - Parse personalized version + injected elements
   - onProgress?.({ stage: 'personality', progress: 80, message: 'Injecting your unique voice...' })

6. Stage 6: Quality check
   - Call Claude for quality validation
   - Parse quality score + gate results
   - onProgress?.({ stage: 'final', progress: 95, message: 'Running quality checks...' })

7. Regeneration logic:
   - If quality score < 85:
     - Retry entire pipeline (max 3 attempts)
     - onProgress?.({ stage: 'regenerating', progress: 0, message: `Quality check failed (score: ${score}), regenerating... (Attempt ${attempt}/3)` })
   - If still failing after 3 attempts:
     - Return error with detailed failure reason
   
8. If quality score >= 85:
   - Generate Twitter version (convert LinkedIn → Twitter)
   - Create GeneratedPost object with ALL pipeline stages saved
   - Return success

Error handling:
- API failures: return error object
- Parsing failures: return error with details
- Rate limits: retry with backoff

Save all intermediate stages for debugging per PRD."
```

**Deliverables:**
- [ ] lib/pipeline/multi-stage.ts
- [ ] All 6 stages implemented
- [ ] Progress callbacks working
- [ ] Regeneration logic (max 3 attempts)
- [ ] All stages saved in GeneratedPost object

---

#### 4.3 Quality Gates
```typescript
// Cursor Prompt for lib/guardrails/quality-gates.ts:
"Create quality gate validation as specified in PRD Phase 4:

function validatePost(
  post: string,
  voiceProfile: VoiceProfile
): QualityReport

Quality Gates (from PRD):

1. Forbidden Phrases Gate
   - Check against global forbidden list (from forbidden-phrases.ts)
   - Check against profile's forbiddenWords
   - Must be 0 to pass
   - Return: { passed: boolean, issues: string[] }

2. Specificity Gate
   - Count specific numbers (regex: /\d+/)
   - Count dollar/rupee amounts (regex: /[$₹][\d,]+/)
   - Count names (regex: /[A-Z][a-z]+ [A-Z][a-z]+/)
   - Count dates (regex: /\d{4}|\d{1,2}\/\d{1,2}/)
   - Require at least 3 total
   - Return: { passed: boolean, count: number }

3. Voice Match Gate
   - Call Claude to compare post to profile's top posts
   - Score 0-100 similarity
   - Require 90%+ to pass
   - Return: { passed: boolean, score: number }

4. Hook Strength Gate
   - Evaluate first line of post
   - Check for: number, dollar amount, name, action verb, contrarian words
   - Must have at least one
   - Return: { passed: boolean, hookType: string }

5. Formatting Gate
   - Check for em-dashes if profile forbids them
   - Check for excessive bullet points
   - Check sentence length variation
   - Return: { passed: boolean, issues: string[] }

Calculate overall score (0-100):
- Start at 100
- Forbidden phrases: -5 per phrase (max -30)
- Specificity: +10 per detail (max +30), -10 per missing (if < 3)
- Voice match: convert to 0-25 scale
- Hook strength: 0-20 points
- Formatting: -5 per violation (max -15)

Return QualityReport with all gate results + overall score + pass/fail."
```

**Deliverables:**
- [ ] lib/guardrails/quality-gates.ts
- [ ] All 5 gates implemented
- [ ] Voice Match uses Claude API
- [ ] Overall score calculation matches PRD algorithm

---

#### 4.4 Generation UI Components
```typescript
// Cursor Prompt for components/generation/GenerationLoader.tsx:
"Create generation loader as specified in PRD Phase 4:

Props:
- stage: 'initial' | 'selected' | 'refined' | 'hook-optimized' | 'personality' | 'final' | 'regenerating'
- progress: number (0-100)
- attempt?: number
- totalAttempts?: number

UI:
- Centered modal overlay (backdrop blur)
- Large progress circle (200px diameter)
  - Animated fill based on progress
  - Percentage in center (48px, colored)
- Stage name above circle (bold, 20px)
- Stage description below circle (gray, 14px):
  - initial: 'Generating 5 unique versions...'
  - selected: 'Evaluating and selecting best version...'
  - refined: 'Removing AI tells and polishing...'
  - hook-optimized: 'Testing 10 different hooks...'
  - personality: 'Injecting your unique voice...'
  - final: 'Running quality checks...'
  - regenerating: 'Quality check failed, regenerating... (Attempt X/3)'
- Estimated time remaining (bottom)
- Fun facts carousel (bottom, rotates every 10 sec):
  - 'Ghostwriters charge $500-2000 per post'
  - 'Manual editing takes 15+ minutes per post'
  - 'AI slop is caused by generic prompts'
  - 'Quality gates catch 99% of slop'
  - 'Multi-stage generation prevents slop before it happens'
  - Add 5 more fun facts

Animations (Framer Motion):
- Progress circle fills smoothly
- Stage transitions fade (200ms)
- Success checkmark at 100%

If regenerating, show attempt number."
```

**Deliverables:**
- [ ] components/generation/GenerationLoader.tsx
- [ ] All stage descriptions
- [ ] Fun facts carousel
- [ ] Regeneration UI (attempt X/3)

---

#### 4.5 Post Preview Component
```typescript
// Cursor Prompt for components/generation/PostPreview.tsx:
"Create post preview as specified in PRD Phase 4:

Props:
- post: GeneratedPost
- onEdit: (editedContent: string, platform: 'linkedin' | 'twitter') => void

UI Layout:
- Large card (max-width 800px)
- Top row:
  - Quality score badge (left) - colored circle with score
    - 95-100: Gold (#F59E0B)
    - 90-94: Green (#10B981)
    - 85-89: Yellow (#FCD34D)
    - <85: Red (#EF4444) - shouldn't happen
  - Platform toggle (right) - pills: LinkedIn | Twitter
- Main content area:
  - If LinkedIn selected:
    - Single post textarea (editable)
    - Character count: X/3000
    - Specificity highlights: numbers/names/dates in blue
  - If Twitter selected:
    - Thread view: each tweet in separate box
    - Tweet numbers: 1/X, 2/X, etc.
    - Character count per tweet: X/280
    - Thread flow arrows between tweets
    - Individual tweet copy buttons
- Bottom stats row:
  - Voice similarity: X% (from quality report)
  - Specificity count: X details
  - Quality score breakdown (hover tooltip)

Collapsible Debug Section:
- Title: 'Pipeline Stages (Debug)'
- Collapsed by default
- Show all pipeline stages:
  - 5 initial versions
  - Selected version + reasoning
  - Refined version + changes
  - 10 hook options + selected
  - Personality version + injected elements
  - Final quality report

Export buttons (bottom):
- Copy LinkedIn
- Copy Twitter Thread
- Download as .txt
- Export to CSV (opens modal)

Use shadcn/ui components.
Framer Motion for platform toggle animation."
```

**Deliverables:**
- [ ] components/generation/PostPreview.tsx
- [ ] Platform toggle working
- [ ] Twitter thread view
- [ ] Specificity highlights
- [ ] Collapsible debug section
- [ ] All export options

---

### SESSION 5: Platform Conversion & Export (2-3 hours)
**PRD Reference:** Phase 5

#### 5.1 LinkedIn → Twitter Converter
```typescript
// Cursor Prompt for lib/utils/platform-converter.ts:
"Create LinkedIn to Twitter conversion as specified in PRD Phase 5:

function convertToTwitterThread(
  linkedinPost: string
): {
  thread: string[];
  specificityRetention: number;
  warning?: string;
}

Rules (CRITICAL):
1. Preserve ALL numbers, names, dates (80%+ retention REQUIRED)
2. Break into tweets (280 chars each)
3. Adapt sentence length only - NO genericizing
4. Keep the hook as first tweet
5. Number each tweet: 1/X, 2/X, etc.
6. Ensure thread flow is coherent

Algorithm:
- Extract all specific details from LinkedIn post
- Split LinkedIn post into paragraphs
- Convert paragraphs to tweets (max 280 chars each)
- Ensure each tweet is self-contained but flows
- Maintain voice and tone
- Keep specificity intact

Validation:
- Extract specifics from LinkedIn: numbers, names, dates
- Extract specifics from Twitter thread
- Calculate retention percentage
- Warn if < 80%
- Count total characters
- Suggest optimizations if needed

Return: { thread, specificityRetention, warning? }

If retention < 80%, include warning message."
```

**Deliverables:**
- [ ] lib/utils/platform-converter.ts
- [ ] Specificity retention validation
- [ ] Warning if < 80% retention
- [ ] Thread numbering (1/X, 2/X)

---

#### 5.2 CSV Exporter
```typescript
// Cursor Prompt for lib/utils/csv-exporter.ts:
"Create CSV export as specified in PRD Phase 5:

function exportPostsToCSV(posts: GeneratedPost[]): void

CSV Format:
- Column 1: Date (empty for manual scheduling)
- Column 2: Time (empty)
- Column 3: Platform (LinkedIn/Twitter)
- Column 4: Post Content
- Column 5: Quality Score
- Column 6: Voice Profile Name

Features:
- Properly escape special characters
- Handle multi-line content (quotes)
- Include BOM for Excel compatibility
- Trigger browser download

File naming: william_ai_posts_[date].csv

For Twitter posts, include entire thread in one cell (newline separated)."
```

**Deliverables:**
- [ ] lib/utils/csv-exporter.ts
- [ ] CSV download working
- [ ] Excel compatible

---

#### 5.3 Export Options Component
```typescript
// Cursor Prompt for components/generation/ExportOptions.tsx:
"Create export options as specified in PRD Phase 5:

Props:
- post: GeneratedPost

Options:
1. Copy LinkedIn to Clipboard
   - Copy button with icon
   - Show 'Copied!' toast (2 sec timeout)
   - Copy post.outputs.linkedin.post

2. Copy Twitter Thread to Clipboard
   - Copy entire thread formatted with numbers
   - Show 'Copied!' toast
   - Format: '1/X\n[tweet1]\n\n2/X\n[tweet2]...'

3. Download as Text
   - Download .txt file
   - Filename: 'post_[profile]_[date]_[score].txt'
   - Include both LinkedIn and Twitter versions

4. Export to CSV
   - Opens modal with multi-post selector
   - Checkbox list of all posts
   - Select multiple posts to include
   - Download CSV button
   - Uses csv-exporter.ts

Use shadcn/ui Dialog for CSV modal.
Use toast notifications (shadcn/ui Sonner)."
```

**Deliverables:**
- [ ] components/generation/ExportOptions.tsx
- [ ] All 4 export options working
- [ ] CSV modal with multi-select
- [ ] Toast notifications

---

### SESSION 6: Dashboard & Post Management (3-4 hours)
**PRD Reference:** Phase 6

#### 6.1 Dashboard Layout
```typescript
// Cursor Prompt for app/dashboard/page.tsx:
"Create main dashboard as specified in PRD Phase 6:

Layout:
- Header row:
  - Voice profile selector (dropdown)
  - Stats overview (4 stat cards)
- Main content:
  - Recent posts section (last 10)
  - Grid layout (3 cols desktop, 2 tablet, 1 mobile)
- Sidebar (desktop only):
  - Active voice profile card
  - Quick create buttons:
    - Personal Experience
    - Pattern Recognition
  - Manage voice profiles link

Stats cards (from PostContext):
1. Total Posts Created
   - Count of all posts
   - Document icon
2. Average Quality Score
   - Calculate avg from all posts
   - Star icon
   - Trending indicator (vs last month)
3. Posts This Month
   - Count posts created this month
   - Calendar icon
4. Time Saved
   - Calculate: (posts * 15 min) - (posts * 2 min) = posts * 13 min
   - Show in hours
   - Clock icon
   - Subtext: 'vs manual editing'

Empty state:
- Illustration or icon
- 'Create your first post' heading
- Description text
- CTA button to /create

Use shadcn/ui components.
Responsive layout (mobile, tablet, desktop)."
```

**Deliverables:**
- [ ] app/dashboard/page.tsx
- [ ] 4 stat cards with calculations
- [ ] Recent posts grid
- [ ] Empty state
- [ ] Responsive layout

---

#### 6.2 Post Card Component
```typescript
// Cursor Prompt for components/dashboard/PostCard.tsx:
"Create post card as specified in PRD Phase 6:

Props:
- post: GeneratedPost
- onClick: () => void
- onDelete: () => void

UI:
- Card with shadow and hover effect
- Content preview (first 150 chars + '...')
- Quality score badge (top-right, colored)
- Platform badge (LinkedIn/Twitter icon)
- Created date (relative time: '2 days ago')
- Actions dropdown (⋮ menu):
  - View full post
  - Edit post
  - Export options submenu
  - Delete (red text)

Styling:
- Clean card design
- Quality score color-coded:
  - 95-100: Gold
  - 90-94: Green
  - 85-89: Yellow
- Framer Motion hover effects:
  - Subtle scale up (1.02)
  - Shadow increase
- Click anywhere on card to view full post

Use shadcn/ui Card, Badge, DropdownMenu."
```

**Deliverables:**
- [ ] components/dashboard/PostCard.tsx
- [ ] Actions dropdown menu
- [ ] Hover animations
- [ ] Color-coded quality scores

---

#### 6.3 Post View/Edit Modal
```typescript
// Cursor Prompt for components/dashboard/PostModal.tsx:
"Create post view/edit modal:

Props:
- post: GeneratedPost
- isOpen: boolean
- onClose: () => void
- onSave: (edited: GeneratedPost) => void
- onDelete: () => void

UI:
- Full-screen modal (shadcn/ui Dialog)
- Header:
  - Post created date
  - Quality score badge
  - Edit/View mode toggle
  - Close button
- Content:
  - Platform tabs (LinkedIn | Twitter)
  - If view mode: formatted post display
  - If edit mode: editable textarea
  - Character count
  - Quality metrics sidebar:
    - Overall score
    - Voice similarity
    - Specificity count
    - Forbidden phrases: 0
- Footer:
  - Export buttons
  - Save button (if edited)
  - Delete button (with confirmation)

Features:
- Edit mode: allow content editing
- Save updates to PostContext
- Delete with confirmation dialog
- Export from modal

Use shadcn/ui Dialog, Tabs."
```

**Deliverables:**
- [ ] components/dashboard/PostModal.tsx
- [ ] View/Edit modes
- [ ] Save functionality
- [ ] Delete confirmation
- [ ] Export options

---

#### 6.4 Stats Overview Component
```typescript
// Cursor Prompt for components/dashboard/StatsOverview.tsx:
"Create stats overview as specified in PRD Phase 6:

Props:
- posts: GeneratedPost[]

Stats to calculate:
1. Total Posts: posts.length
2. Avg Quality Score: 
   - Sum all post.quality.score / posts.length
   - Show trending: compare to last 30 days avg
3. Posts This Month:
   - Filter posts where createdAt is this month
4. Time Saved:
   - Calculate: posts.length * 13 minutes
   - Convert to hours if >= 60 min
   - Show: 'X hours saved vs manual editing'

Layout:
- 4 cards in responsive grid
- Each card:
  - Icon (top-left)
  - Large number (center)
  - Label (bottom)
  - Subtext if applicable
  - Trending indicator if applicable (↑ ↓)

Framer Motion:
- Stagger animation on mount (each card 100ms delay)
- Number count-up animation

Use shadcn/ui Card component."
```

**Deliverables:**
- [ ] components/dashboard/StatsOverview.tsx
- [ ] All 4 stats calculated correctly
- [ ] Trending indicator
- [ ] Animations

---

#### 6.5 Post Context
```typescript
// Cursor Prompt for lib/context/PostContext.tsx:
"Create React Context for posts:

State:
- posts: GeneratedPost[]

Functions:
- addPost(post: GeneratedPost)
  - Add to beginning of array
  - Save to localStorage
  - Update state
- updatePost(id: string, updates: Partial<GeneratedPost>)
  - Update updatedAt timestamp
  - Save to localStorage
  - Update state
- deletePost(id: string)
  - Remove from localStorage
  - Remove from state
- getPostsByProfile(profileId: string): GeneratedPost[]
  - Filter posts by voiceProfileId

Load on mount:
- Load all posts from localStorage
- Sort by createdAt (newest first)

Wrap in app/layout.tsx (after VoiceProfileContext)"
```

**Deliverables:**
- [ ] lib/context/PostContext.tsx
- [ ] All CRUD operations
- [ ] Persists to localStorage
- [ ] Wrapped in layout.tsx

---

### SESSION 7: Template-Based Carousels (4-5 hours)
**PRD Reference:** Phase 7
**NOTE:** Start with 8 templates, not 20-30 (MVP scope)

#### 7.1 Carousel Templates (8 Core Templates)
```typescript
// Cursor Prompt for data/carousel-templates.ts:
"Create 8 core carousel templates as specified in PRD Phase 7:

Categories (8 total):

List Style (3 templates):
1. 5 Tips Template
   - Title slide
   - 5 tip slides (1 per page)
   - Conclusion slide
   - 7 pages total
2. 7 Mistakes Template
   - Title slide
   - 7 mistake slides
   - Conclusion slide
   - 9 pages total
3. Framework Template
   - Title slide
   - Framework overview
   - 3-4 component slides
   - Conclusion slide
   - 6-7 pages total

Story Style (3 templates):
4. Before/After Template
   - Title slide
   - Before situation (2 slides)
   - The change (1 slide)
   - After situation (2 slides)
   - Conclusion slide
   - 7 pages total
5. Case Study Template
   - Title slide
   - Problem (1-2 slides)
   - Solution (2-3 slides)
   - Results (1 slide)
   - Conclusion slide
   - 7-8 pages total
6. Journey Timeline Template
   - Title slide
   - 5-7 timeline points
   - Conclusion slide
   - 8-10 pages total

Data Style (2 templates):
7. Statistics Showcase Template
   - Title slide
   - 5 stat slides (big number + context)
   - Conclusion slide
   - 7 pages total
8. Comparison Template
   - Title slide
   - 3-5 comparison slides (A vs B)
   - Conclusion slide
   - 6-8 pages total

For each template:
- Define page layouts (title/content/conclusion)
- Text area specs: max characters, position, size
- Background style (solid color, gradient, etc.)
- When to use this template (description)
- Thumbnail preview (placeholder for now)

Export as CarouselTemplate[] array.

Keep it simple for MVP - no complex designs."
```

**Deliverables:**
- [ ] data/carousel-templates.ts
- [ ] 8 core templates defined
- [ ] Page layouts specified
- [ ] Text area limits defined

---

#### 7.2 AI Template Selection
```typescript
// Cursor Prompt for lib/carousel/template-selector.ts:
"Create AI template selector:

function selectCarouselTemplate(
  postContent: string
): Promise<{ templateId: string; reasoning: string }>

Use Claude API to:
- Analyze post content
- Determine type: list, story, or data
- Count main points
- Select best matching template from templates array
- Return template ID + reasoning

Prompt:
'Analyze this post and select the best carousel template.

Post:
{postContent}

Available templates:
{templates.map(t => `${t.id}: ${t.name} - ${t.description}`).join('\n')}

Return JSON only:
{
  \"templateId\": \"...\",
  \"reasoning\": \"...\"
}'

Parse JSON response.
Fallback to 'tips-5' template if AI selection fails."
```

**Deliverables:**
- [ ] lib/carousel/template-selector.ts
- [ ] AI-powered selection
- [ ] Fallback logic

---

#### 7.3 Carousel Page Generator
```typescript
// Cursor Prompt for lib/carousel/generator.ts:
"Create carousel page generator:

function generateCarouselPages(
  post: string,
  template: CarouselTemplate,
  brandColors: VoiceProfile['brandColors']
): Promise<CarouselPage[]>

Use Claude API to:
- Break post into carousel pages matching template
- Extract heading for each page
- Extract content bullets/text for each page
- Ensure content fits template character limits
- Return structured page data

Prompt:
'Break this post into carousel pages using the template structure.

Post:
{post}

Template: {template.name}
Pages: {template.pageCount}
Structure: {template pages description}

For each page, provide:
- heading (max 60 chars)
- content (array of strings, max chars per template)

Return JSON only:
[
  { \"heading\": \"...\", \"content\": [...] },
  ...
]'

Validation:
- Check all pages have content
- Check no text overflow
- Check page count matches template

Return CarouselPage[] array."
```

**Deliverables:**
- [ ] lib/carousel/generator.ts
- [ ] AI-powered page generation
- [ ] Content validation

---

#### 7.4 Carousel Preview Component
```typescript
// Cursor Prompt for components/carousel/CarouselPreview.tsx:
"Create carousel preview as specified in PRD Phase 7:

Props:
- pages: CarouselPage[]
- template: CarouselTemplate
- brandColors: VoiceProfile['brandColors']
- onEdit: (pageIndex: number, updates: Partial<CarouselPage>) => void

UI:
- Swipeable carousel view (use Framer Motion)
- Page indicators/numbers: 1/7, 2/7, etc.
- Current page preview (1080x1080 aspect ratio)
- Navigation arrows (prev/next)
- Page thumbnails strip (bottom)
- Edit button per page
- Download options (sidebar):
  - Download all as ZIP
  - Download current page as PNG
  - Download as PDF

Edit Modal:
- Click page or edit button → open dialog
- Editable heading
- Editable content bullets
- Character count per field
- Save button
- Cancel button

Rendering:
- For MVP: Simple HTML/CSS rendering
- Apply brand colors
- Export as PNG using html-to-image library
- No complex design tools

Use Framer Motion for swipe gestures.
Use shadcn/ui Dialog for edit mode."
```

**Deliverables:**
- [ ] components/carousel/CarouselPreview.tsx
- [ ] Swipeable interface
- [ ] Edit modal
- [ ] PNG export (html-to-image)

---

#### 7.5 Carousel Creation Page
```typescript
// Cursor Prompt for app/create/carousel/page.tsx:
"Create carousel creation page:

Flow:
1. Select source:
   - Start from existing post (select from dropdown)
   - Create new carousel (enter content manually)
2. AI selects template (or user overrides)
3. Generate pages
4. Preview and edit
5. Export

UI:
- Step indicator at top
- Source selection step:
  - Dropdown of posts
  - OR textarea for manual content
- Template selection (AI suggested, can override)
- Loading state during generation
- Preview with edit capability
- Download options

Use components:
- CarouselPreview
- Template selector
- Page generator

Save carousel config to GeneratedPost.carousel field."
```

**Deliverables:**
- [ ] app/create/carousel/page.tsx
- [ ] Multi-step flow
- [ ] AI template selection
- [ ] Manual override option
- [ ] Saves to post object

---

#### 7.6 Dashboard Carousel Integration
```typescript
// Cursor Prompt:
"Update app/dashboard/page.tsx:
- Add 'Create Carousel' button to sidebar
- Link to /create/carousel

Update app/create/page.tsx:
- Add carousel option alongside Experience/Pattern
- Card UI with description
- Link to /create/carousel"
```

**Deliverables:**
- [ ] Carousel option in dashboard
- [ ] Carousel option in /create hub
- [ ] Links working

---

### SESSION 8: Quality & Polish (3-4 hours)
**PRD Reference:** Phase 8

#### 8.1 Comprehensive Error Handling
```typescript
// Cursor Prompt for lib/utils/error-handler.ts:
"Create centralized error handling as specified in PRD Phase 8:

Error types:
1. API Rate Limit (429)
   - Show friendly message
   - Countdown timer (retry in X seconds)
   - Auto-retry when timer expires
2. Network Error (offline, timeout)
   - Show retry button
   - Offline indicator
   - Save draft before retry
3. Invalid Input (validation errors)
   - Inline field errors
   - Highlight problematic fields
   - Helpful error messages
4. Generation Failure (3 attempts exhausted)
   - Show detailed failure reason
   - Offer to try different voice mode
   - Save failed attempt for debugging
5. localStorage Quota Exceeded
   - Show storage usage meter
   - Offer to delete old posts
   - Export before deleting
6. JSON Parse Errors
   - Graceful fallback to default values
   - Log error to console
   - Show user-friendly message

Functions:
- handleAPIError(error): ErrorDisplay
- handleNetworkError(): ErrorDisplay
- handleValidationError(field, message): ErrorDisplay
- handleStorageError(): ErrorDisplay

ErrorDisplay type:
{
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
  retry?: boolean;
}

Use shadcn/ui Toast for non-critical errors.
Use Dialog for critical errors requiring action."
```

**Deliverables:**
- [ ] lib/utils/error-handler.ts
- [ ] All error types handled
- [ ] User-friendly messages
- [ ] Action buttons (retry, delete, etc.)

---

#### 8.2 Loading States Everywhere
```typescript
// Cursor Prompt:
"Add loading states to all async operations:

1. Page transitions:
   - Top progress bar (NProgress or similar)
   - Or full-page spinner for slow pages

2. API calls:
   - Skeleton loaders (shadcn/ui Skeleton)
   - Match component structure
   - Fade in real content when loaded

3. Button actions:
   - Spinner in button
   - Disable button during action
   - Success/error state after completion

4. Image loading:
   - Placeholder blur
   - Progressive loading
   - Fade in when loaded

5. Form submissions:
   - Disable all inputs
   - Show progress indicator
   - Lock scroll during submission

Rules:
- No layout shifts (reserve space for content)
- Smooth transitions (Framer Motion)
- Minimum loading time: 300ms (avoid flicker)

Add loading states to:
- All interview flows
- Generation process (already has loader)
- Voice profile creation
- Dashboard data loading
- Carousel generation"
```

**Deliverables:**
- [ ] Loading states on all pages
- [ ] Skeleton loaders
- [ ] Button loading states
- [ ] No layout shifts

---

#### 8.3 Complete Responsive Design
```typescript
// Cursor Prompt:
"Make entire app responsive as specified in PRD Phase 8:

Breakpoints (Tailwind):
- sm: 640px (mobile)
- md: 768px (tablet)
- lg: 1024px (desktop)
- xl: 1280px (large desktop)

Mobile (< 768px):
- Single column layouts
- Hamburger navigation menu
- Full-width cards
- Stacked stats (1 col)
- Bottom navigation for key actions
- Touch-friendly (min 44px tap targets)
- Swipe gestures for carousels

Tablet (768-1024px):
- 2 column layouts
- Condensed navigation
- Grid cards (2 cols)
- Stacked stats (2x2)

Desktop (> 1024px):
- 3 column layouts where applicable
- Full navigation
- Grid cards (3 cols)
- Stats in single row (4 cols)
- Sidebar layouts

Test on:
- iPhone SE (375px)
- iPhone 14 Pro (393px)
- iPad (768px)
- iPad Pro (1024px)
- Desktop (1440px)

Update all pages:
- Dashboard
- Voice profile creation
- Interview flows
- Post preview
- Carousel preview

Use Tailwind responsive utilities (sm:, md:, lg:, xl:)."
```

**Deliverables:**
- [ ] All pages responsive
- [ ] Tested on 5 screen sizes
- [ ] No horizontal scroll
- [ ] Touch targets 44px minimum

---

#### 8.4 Performance Optimization
```typescript
// Cursor Prompt:
"Optimize app performance as specified in PRD Phase 8:

1. Code Splitting:
   - Lazy load routes:
     const CarouselPage = lazy(() => import('./create/carousel/page'))
   - Lazy load heavy components:
     - CarouselPreview
     - GenerationLoader
     - PostModal
   - Use Suspense with fallback

2. Bundle Size:
   - Analyze: npm run build
   - Remove unused dependencies
   - Tree-shake lodash (import specific functions)
   - Dynamic imports for heavy libs:
     - Framer Motion
     - html-to-image

3. Image Optimization:
   - Use Next.js Image component
   - Lazy load images
   - Blur placeholder

4. Caching:
   - Cache voice profiles in memory (React state)
   - Cache posts in memory
   - Don't reload from localStorage on every render
   - Use useMemo for expensive calculations
   - Use useCallback for stable function references

5. Debouncing:
   - Auto-save inputs (500ms debounce)
   - Search/filter (300ms debounce)

6. Minimize Re-renders:
   - React.memo for expensive components
   - Proper dependency arrays
   - Context splitting (don't put everything in one context)

Targets (Lighthouse):
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
- First Contentful Paint: < 2s
- Time to Interactive: < 3s"
```

**Deliverables:**
- [ ] Code splitting implemented
- [ ] Bundle size < 500KB (gzipped)
- [ ] Lighthouse score > 90
- [ ] Fast load times

---

### SESSION 9: Deployment (2-3 hours)
**PRD Reference:** Phase 8 (Deployment Strategy)

#### 9.1 Environment Configuration
```bash
# Cursor Prompt:
"Set up environment variables:

1. Create .env.example:
ANTHROPIC_API_KEY=your_anthropic_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

2. Add to .gitignore:
.env.local
.env*.local

3. Update README.md with setup instructions:
- How to get Anthropic API key
- How to copy .env.example to .env.local
- How to run dev server

4. Create next.config.js with proper configuration:
- Disable Vercel analytics in dev
- Enable in production"
```

**Deliverables:**
- [ ] .env.example created
- [ ] .gitignore updated
- [ ] README.md with setup instructions

---

#### 9.2 Vercel Analytics
```bash
# Cursor Prompt:
"Add Vercel Analytics as specified in PRD Phase 8:

1. Install:
npm install @vercel/analytics

2. Add to app/layout.tsx:
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

3. Track custom events:
- Profile created
- Post generated
- Post exported (by type)
- Carousel created
- Generation failed (with reason)

Use: track('event_name', { properties })

4. Only enable in production:
{process.env.NODE_ENV === 'production' && <Analytics />}"
```

**Deliverables:**
- [ ] Vercel Analytics installed
- [ ] Custom events tracked
- [ ] Only enabled in production

---

#### 9.3 Pre-Deployment Testing
```typescript
// Cursor Prompt:
"Create pre-deployment testing checklist:

Run through all user flows:
1. Voice Profile Creation
   - Create new profile
   - Verify 20+ rules required
   - Add reference posts
   - Add reference creator
   - Edit profile
   - Delete profile

2. Personal Experience Flow
   - Complete all 6 questions
   - Verify auto-save
   - Verify insight extraction
   - Edit extracted insight
   - Submit for generation

3. Pattern Recognition Flow
   - Complete all 5 questions
   - Same verification as Experience

4. Post Generation
   - Verify all 6 stages run
   - Verify quality gates
   - Verify regeneration if score < 85
   - Verify Twitter conversion
   - Verify specificity retention

5. Post Management
   - View post in modal
   - Edit post content
   - Export (all 4 options)
   - Delete post

6. Carousel Creation
   - Select template
   - Generate pages
   - Edit pages
   - Export PNG/ZIP

7. Dashboard
   - Verify stats calculations
   - Verify post grid
   - Verify empty states

Edge cases:
- Test with empty inputs
- Test with 1000+ word inputs
- Test with emoji inputs
- Test with localStorage full
- Test on slow network (throttle to 3G)
- Test on mobile devices

Verify no console errors.
Verify no TypeScript errors.
Verify npm run build succeeds.
Verify npm run lint passes."
```

**Deliverables:**
- [ ] All user flows tested
- [ ] Edge cases tested
- [ ] No console errors
- [ ] Build succeeds
- [ ] Lint passes

---

#### 9.4 Vercel Deployment
```bash
# Cursor Prompt:
"Deploy to Vercel as specified in PRD Phase 8:

1. Connect GitHub repo to Vercel:
   - Sign in to Vercel
   - Import project
   - Connect GitHub

2. Configure environment variables in Vercel:
   - ANTHROPIC_API_KEY (secret)
   - NEXT_PUBLIC_APP_URL (https://william-ai.vercel.app)

3. Configure build settings:
   - Framework: Next.js
   - Build command: next build
   - Output directory: .next
   - Install command: npm install

4. Set region:
   - sin1 (Singapore - closest to India)

5. Enable auto-deploy:
   - Push to main → auto deploy to production
   - PRs → preview deployments

6. Deploy:
   - Click Deploy
   - Wait for build
   - Verify deployment URL

7. Post-deploy verification:
   - Test all features on production URL
   - Verify analytics working
   - Check Lighthouse scores
   - Test on mobile devices

8. Set up custom domain (optional):
   - Add domain in Vercel
   - Update DNS records
   - Enable SSL"
```

**Deliverables:**
- [ ] Deployed to Vercel
- [ ] Environment variables set
- [ ] Auto-deploy enabled
- [ ] Production URL working
- [ ] Analytics enabled

---

## 📊 IMPLEMENTATION SUMMARY

### Total Estimated Time
- Session 1: Foundation (2-3 hours)
- Session 2: Voice Profiles (3-4 hours)
- Session 3: Interview Flows (4-5 hours)
- Session 4: Generation Pipeline (6-8 hours)
- Session 5: Platform Conversion (2-3 hours)
- Session 6: Dashboard (3-4 hours)
- Session 7: Carousels (4-5 hours)
- Session 8: Quality & Polish (3-4 hours)
- Session 9: Deployment (2-3 hours)

**Total: 29-39 hours (4-5 full dev days)**

### What's Built (Feature Completeness)
- ✅ Voice Profile System (create, edit, delete, reference creator)
- ✅ 5 Voice Modes (fully defined)
- ✅ 2 Interview Flows (Experience + Pattern)
- ✅ AI Insight Extraction (integrated)
- ✅ 6-Stage Generation Pipeline (all stages)
- ✅ Quality Gates (5 gates, 85+ score required)
- ✅ LinkedIn → Twitter Conversion (80%+ specificity)
- ✅ Post Management (view, edit, delete)
- ✅ Export System (4 options: copy, download, CSV, thread)
- ✅ Dashboard (stats, posts, profiles)
- ✅ Template-Based Carousels (8 templates)
- ✅ Responsive Design (mobile, tablet, desktop)
- ✅ Error Handling (comprehensive)
- ✅ Loading States (everywhere)
- ✅ Performance Optimization (Lighthouse > 90)
- ✅ Vercel Deployment (production-ready)

### What's NOT Built (Explicitly Excluded)
- ❌ Server-side API (client-side for MVP)
- ❌ Database/backend (localStorage per PRD)
- ❌ Dark mode (post-MVP)
- ❌ Advanced analytics/monitoring (Vercel Analytics only)
- ❌ 20-30 carousel templates (8 for MVP)
- ❌ Dynamic carousel design tools (template-based only)
- ❌ Auto-scheduling (manual export to CSV)
- ❌ Team collaboration features (post-MVP)
- ❌ A/B testing (post-MVP)
- ❌ Multi-language support (post-MVP)

---

## ✅ SUCCESS CRITERIA (From PRD)

### Technical
- [x] All 2 interview flows working end-to-end
- [x] Multi-stage generation producing quality posts
- [x] Quality gates catching slop (< 1% through)
- [x] Voice profiles persisting correctly
- [x] Platform conversion working (LinkedIn → Twitter)
- [x] Export features functional
- [x] Carousel generation working (8 templates)
- [x] Mobile responsive
- [x] Deployed to production

### Quality
- [x] Generated posts score 85+ consistently
- [x] Human reviewers can't identify AI-generated posts
- [x] Voice similarity to reference posts 90%+
- [x] Zero forbidden phrases in output
- [x] Editing time < 2 minutes per post

### User Experience
- [x] Interview flows feel natural and guided
- [x] Generation completes in < 60 seconds
- [x] Loading states are smooth and informative
- [x] Error messages are helpful
- [x] UI is intuitive (no explanation needed)

---

## 🎯 FINAL NOTES FOR CURSOR VIBE CODING

### Best Practices
1. **Follow PRD exactly** - Don't add features not in PRD
2. **Use provided prompts** - Copy/paste into Cursor for each task
3. **Test incrementally** - Test each session before moving forward
4. **Keep it simple** - No over-engineering (localStorage, client-side, templates)
5. **Focus on quality gates** - This is the moat, make it bulletproof
6. **Save all pipeline stages** - Essential for debugging
7. **Validate inputs** - 20+ rules, not empty answers, etc.

### Cursor Tips
- Start each session with "I'm building [feature] from william.ai PRD Phase X"
- Reference specific PRD sections for context
- Ask Claude to explain complex logic before implementing
- Request TypeScript types for all new code
- Ask for inline comments for tricky logic
- Generate tests for critical functions (quality gates, generation pipeline)

### Common Pitfalls to Avoid (From PRD)
1. ❌ One-shot generation (multi-stage is mandatory)
2. ❌ Skipping refinement stages (each catches different slop)
3. ❌ Not saving all pipeline stages (needed for debugging)
4. ❌ Forgetting mobile responsive (test on phones)
5. ❌ Not handling API errors (Claude API can fail)
6. ❌ Skipping loading states (30-45 sec feels long without feedback)
7. ❌ Not validating inputs (voice profiles need 20+ rules)

---

**Ready to build? Copy this entire plan into your project, open Cursor, and start with Session 1!**

**Good luck building! 🚀**
