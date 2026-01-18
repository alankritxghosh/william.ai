import { 
  InterviewResponse, 
  VoiceProfile, 
  GeneratedPost, 
  VoiceModeId 
} from "@/lib/types";
import { generate, generateMultiple } from "@/lib/gemini";
import { VOICE_MODES } from "@/data/voice-modes";
import { 
  getStage1Prompt,
  getStage2Prompt,
  getStage3Prompt,
  getStage4Prompt,
  getStage5Prompt,
  getStage6Prompt,
  parseStage2Output,
  parseStage3Output,
  parseStage4Output,
  parseStage5Output,
  parseStage6Output,
} from "@/lib/prompts/generation";
import { checkForForbiddenPhrases } from "@/lib/guardrails/forbidden-phrases";
import { generateId } from "@/lib/utils/storage";
import { convertToTwitterThread } from "@/lib/utils/platform-converter";

export interface PipelineProgress {
  stage: string;
  percent: number;
  message: string;
}

export type ProgressCallback = (progress: PipelineProgress) => void;

const MAX_RETRIES = 3;

/**
 * Main pipeline orchestrator - runs all 6 stages
 */
export async function generatePost(
  interview: InterviewResponse,
  voiceProfile: VoiceProfile,
  onProgress?: ProgressCallback,
  attempt: number = 1
): Promise<GeneratedPost> {
  const voiceMode = VOICE_MODES[interview.voiceModeId];
  
  if (!voiceMode) {
    throw new Error(`Invalid voice mode: ${interview.voiceModeId}`);
  }

  const pipeline: Partial<GeneratedPost["pipeline"]> = {};
  
  try {
    // Stage 1: Generate 5 versions
    onProgress?.({
      stage: "initial",
      percent: 10,
      message: "Generating 5 unique versions...",
    });
    
    const stage1Prompt = getStage1Prompt(interview, voiceMode, voiceProfile);
    const versions = await generateMultiple(stage1Prompt, 5);
    pipeline.initialVersions = versions;

    // Stage 2: Select best version
    onProgress?.({
      stage: "selecting",
      percent: 25,
      message: "Evaluating and selecting best version...",
    });
    
    const stage2Prompt = getStage2Prompt(versions);
    const stage2Output = await generate(stage2Prompt);
    const { selectedVersion, reasoning } = parseStage2Output(stage2Output);
    pipeline.selectedVersion = selectedVersion;
    pipeline.selectionReasoning = reasoning;

    // Stage 3: Refine
    onProgress?.({
      stage: "refining",
      percent: 40,
      message: "Removing AI tells and polishing...",
    });
    
    const stage3Prompt = getStage3Prompt(selectedVersion);
    const stage3Output = await generate(stage3Prompt);
    const { refinedVersion, changes } = parseStage3Output(stage3Output);
    pipeline.refinedVersion = refinedVersion;
    pipeline.refinementChanges = changes;

    // Stage 4: Hook optimization
    onProgress?.({
      stage: "hooks",
      percent: 55,
      message: "Testing different hooks...",
    });
    
    const stage4Prompt = getStage4Prompt(refinedVersion);
    const stage4Output = await generate(stage4Prompt);
    const { hooks, selectedHook, hookOptimizedVersion } = parseStage4Output(stage4Output);
    pipeline.hookOptions = hooks;
    pipeline.selectedHook = selectedHook;
    pipeline.hookOptimizedVersion = hookOptimizedVersion;

    // Stage 5: Personality injection
    onProgress?.({
      stage: "personality",
      percent: 70,
      message: "Injecting your unique voice...",
    });
    
    const stage5Prompt = getStage5Prompt(hookOptimizedVersion, voiceProfile);
    const stage5Output = await generate(stage5Prompt);
    const { personalityVersion, injectedElements } = parseStage5Output(stage5Output);
    pipeline.personalityVersion = personalityVersion;
    pipeline.injectedElements = injectedElements;

    // Stage 6: Quality check
    onProgress?.({
      stage: "quality",
      percent: 85,
      message: "Running quality checks...",
    });
    
    const stage6Prompt = getStage6Prompt(personalityVersion, voiceProfile);
    const stage6Output = await generate(stage6Prompt);
    const { score, passed, issues, finalVersion } = parseStage6Output(stage6Output);
    pipeline.finalVersion = finalVersion;

    // Check if quality score meets threshold
    const forbiddenMatches = checkForForbiddenPhrases(finalVersion);
    const actualScore = forbiddenMatches.length > 0 ? Math.min(score, 70) : score;

    // If quality failed and we have retries left
    if ((actualScore < 85 || !passed) && attempt < MAX_RETRIES) {
      onProgress?.({
        stage: "retry",
        percent: 90,
        message: `Quality check failed (${actualScore}/100). Regenerating (attempt ${attempt + 1}/${MAX_RETRIES})...`,
      });
      
      return generatePost(interview, voiceProfile, onProgress, attempt + 1);
    }

    // Generate Twitter version
    onProgress?.({
      stage: "converting",
      percent: 95,
      message: "Creating Twitter thread version...",
    });
    
    const twitterThread = convertToTwitterThread(finalVersion);

    // Build final post object
    onProgress?.({
      stage: "complete",
      percent: 100,
      message: "Generation complete!",
    });

    const post: GeneratedPost = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      interviewData: interview,
      voiceProfileId: voiceProfile.id,
      voiceProfile: voiceProfile,
      pipeline: pipeline as GeneratedPost["pipeline"],
      quality: {
        score: actualScore,
        similarityScore: 90, // Simplified for MVP
        specificityCount: countSpecificDetails(finalVersion),
        slopDetected: forbiddenMatches.map(m => m.phrase),
        passedGates: passed && forbiddenMatches.length === 0,
      },
      outputs: {
        linkedin: {
          post: finalVersion,
          characterCount: finalVersion.length,
          hashtagCount: (finalVersion.match(/#\w+/g) || []).length,
        },
        twitter: {
          thread: twitterThread,
          characterCounts: twitterThread.map(t => t.length),
        },
      },
      status: actualScore >= 85 ? "passed" : "failed",
      failureReason: actualScore < 85 ? `Quality score ${actualScore} below threshold` : undefined,
    };

    return post;
  } catch (error) {
    console.error("Pipeline error:", error);
    throw error;
  }
}

/**
 * Count specific details (numbers, names, dates) in text
 */
function countSpecificDetails(text: string): number {
  let count = 0;
  
  // Count numbers (including currency)
  const numbers = text.match(/[$₹€£]?[\d,]+\.?\d*[%kKmMbB]?/g) || [];
  count += numbers.length;
  
  // Count potential names (capitalized words not at start of sentence)
  const names = text.match(/(?<=[.!?]\s+|^)[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
  count += Math.min(names.length, 3); // Cap at 3 to avoid overcounting
  
  // Count dates and time references
  const dates = text.match(/\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b|\b\d+\s*(?:years?|months?|weeks?|days?|hours?)\b/gi) || [];
  count += dates.length;
  
  return count;
}
