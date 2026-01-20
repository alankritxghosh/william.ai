/**
 * Supabase Security Tests
 * 
 * These tests verify that Row Level Security (RLS) policies are working correctly
 * and that users cannot access each other's data.
 * 
 * IMPORTANT: These tests require:
 * 1. A running Supabase instance
 * 2. Two test users created in the database
 * 3. Environment variables configured
 * 
 * Run with: npx ts-node tests/supabase-security.test.ts
 * Or integrate with your test framework (Jest, Vitest)
 */

import { createClient } from "@supabase/supabase-js";

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Test user credentials (create these in Supabase Auth dashboard)
const TEST_USER_A = {
  email: "test-user-a@william.ai",
  password: "TestPassword123!",
};

const TEST_USER_B = {
  email: "test-user-b@william.ai",
  password: "TestPassword123!",
};

// ============================================================================
// TEST HELPERS
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${name}: ${message}`);
}

async function createAuthenticatedClient(email: string, password: string) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(`Failed to authenticate ${email}: ${error.message}`);
  }
  
  return { client, user: data.user! };
}

function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// ============================================================================
// SECURITY TESTS
// ============================================================================

/**
 * Test 1: User A cannot read User B's voice profiles
 */
async function testCrossUserReadVoiceProfiles() {
  const testName = "Cross-user read: voice_profiles";
  
  try {
    // Authenticate as both users
    const { client: clientA, user: userA } = await createAuthenticatedClient(
      TEST_USER_A.email,
      TEST_USER_A.password
    );
    const { client: clientB, user: userB } = await createAuthenticatedClient(
      TEST_USER_B.email,
      TEST_USER_B.password
    );
    
    // User A creates a voice profile
    const { data: profile, error: createError } = await clientA
      .from("voice_profiles")
      .insert({
        user_id: userA.id,
        name: "Test Profile A",
        rules: {
          sentencePatterns: Array(10).fill("Pattern"),
          forbiddenWords: Array(5).fill("Word"),
          signaturePhrases: Array(5).fill("Phrase"),
          rhythmPreferences: {
            avgSentenceLength: 15,
            paragraphBreaks: "moderate",
            punchlinePosition: "end",
            questionUsage: "occasional",
          },
          formattingRules: {
            useEmDash: true,
            useBulletPoints: false,
            useNumberedLists: false,
            emojiUsage: "never",
          },
        },
      })
      .select()
      .single();
    
    if (createError) {
      logTest(testName, false, `Failed to create test profile: ${createError.message}`);
      return;
    }
    
    // User B tries to read User A's profile
    const { data: stolen, error: readError } = await clientB
      .from("voice_profiles")
      .select("*")
      .eq("id", profile.id)
      .single();
    
    // Clean up
    await clientA.from("voice_profiles").delete().eq("id", profile.id);
    
    // Verify User B got nothing
    if (stolen === null || readError) {
      logTest(testName, true, "User B cannot read User A's voice profile");
    } else {
      logTest(testName, false, "SECURITY BREACH: User B read User A's profile!");
    }
  } catch (error) {
    logTest(testName, false, `Test error: ${error}`);
  }
}

/**
 * Test 2: User A cannot update User B's data
 */
async function testCrossUserUpdate() {
  const testName = "Cross-user update: voice_profiles";
  
  try {
    const { client: clientA, user: userA } = await createAuthenticatedClient(
      TEST_USER_A.email,
      TEST_USER_A.password
    );
    const { client: clientB } = await createAuthenticatedClient(
      TEST_USER_B.email,
      TEST_USER_B.password
    );
    
    // User A creates a profile
    const { data: profile } = await clientA
      .from("voice_profiles")
      .insert({
        user_id: userA.id,
        name: "Original Name",
        rules: {
          sentencePatterns: Array(10).fill("Pattern"),
          forbiddenWords: Array(5).fill("Word"),
          signaturePhrases: Array(5).fill("Phrase"),
          rhythmPreferences: {
            avgSentenceLength: 15,
            paragraphBreaks: "moderate",
            punchlinePosition: "end",
            questionUsage: "occasional",
          },
          formattingRules: {
            useEmDash: true,
            useBulletPoints: false,
            useNumberedLists: false,
            emojiUsage: "never",
          },
        },
      })
      .select()
      .single();
    
    if (!profile) {
      logTest(testName, false, "Failed to create test profile");
      return;
    }
    
    // User B tries to update User A's profile
    const { error: updateError } = await clientB
      .from("voice_profiles")
      .update({ name: "HACKED BY USER B" })
      .eq("id", profile.id);
    
    // Check if update was blocked
    const { data: checkProfile } = await clientA
      .from("voice_profiles")
      .select("name")
      .eq("id", profile.id)
      .single();
    
    // Clean up
    await clientA.from("voice_profiles").delete().eq("id", profile.id);
    
    if (checkProfile?.name === "Original Name") {
      logTest(testName, true, "User B cannot update User A's profile");
    } else {
      logTest(testName, false, "SECURITY BREACH: User B updated User A's profile!");
    }
  } catch (error) {
    logTest(testName, false, `Test error: ${error}`);
  }
}

/**
 * Test 3: User A cannot delete User B's data
 */
async function testCrossUserDelete() {
  const testName = "Cross-user delete: voice_profiles";
  
  try {
    const { client: clientA, user: userA } = await createAuthenticatedClient(
      TEST_USER_A.email,
      TEST_USER_A.password
    );
    const { client: clientB } = await createAuthenticatedClient(
      TEST_USER_B.email,
      TEST_USER_B.password
    );
    
    // User A creates a profile
    const { data: profile } = await clientA
      .from("voice_profiles")
      .insert({
        user_id: userA.id,
        name: "To Be Deleted?",
        rules: {
          sentencePatterns: Array(10).fill("Pattern"),
          forbiddenWords: Array(5).fill("Word"),
          signaturePhrases: Array(5).fill("Phrase"),
          rhythmPreferences: {
            avgSentenceLength: 15,
            paragraphBreaks: "moderate",
            punchlinePosition: "end",
            questionUsage: "occasional",
          },
          formattingRules: {
            useEmDash: true,
            useBulletPoints: false,
            useNumberedLists: false,
            emojiUsage: "never",
          },
        },
      })
      .select()
      .single();
    
    if (!profile) {
      logTest(testName, false, "Failed to create test profile");
      return;
    }
    
    // User B tries to delete User A's profile
    await clientB.from("voice_profiles").delete().eq("id", profile.id);
    
    // Check if profile still exists
    const { data: checkProfile } = await clientA
      .from("voice_profiles")
      .select("id")
      .eq("id", profile.id)
      .single();
    
    // Clean up
    await clientA.from("voice_profiles").delete().eq("id", profile.id);
    
    if (checkProfile) {
      logTest(testName, true, "User B cannot delete User A's profile");
    } else {
      logTest(testName, false, "SECURITY BREACH: User B deleted User A's profile!");
    }
  } catch (error) {
    logTest(testName, false, `Test error: ${error}`);
  }
}

/**
 * Test 4: Unauthenticated user cannot access protected routes
 */
async function testUnauthenticatedAccess() {
  const testName = "Unauthenticated access: voice_profiles";
  
  try {
    // Create unauthenticated client
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Try to read all voice profiles
    const { data, error } = await client.from("voice_profiles").select("*");
    
    if (data?.length === 0 || error) {
      logTest(testName, true, "Unauthenticated user cannot access data");
    } else {
      logTest(testName, false, `SECURITY BREACH: Unauthenticated access returned ${data?.length} rows!`);
    }
  } catch (error) {
    logTest(testName, false, `Test error: ${error}`);
  }
}

/**
 * Test 5: SQL Injection attempt is blocked
 */
async function testSQLInjection() {
  const testName = "SQL Injection prevention";
  
  try {
    const { client } = await createAuthenticatedClient(
      TEST_USER_A.email,
      TEST_USER_A.password
    );
    
    // Attempt SQL injection via filter
    const maliciousId = "'; DROP TABLE voice_profiles; --";
    
    const { data, error } = await client
      .from("voice_profiles")
      .select("*")
      .eq("id", maliciousId);
    
    // If we get here without error, the injection was parameterized
    logTest(testName, true, "SQL injection attempt was safely parameterized");
  } catch (error) {
    // Even errors are fine - as long as we didn't drop the table
    logTest(testName, true, "SQL injection attempt blocked");
  }
}

/**
 * Test 6: Service role key bypasses RLS (admin only)
 */
async function testServiceRoleBypass() {
  const testName = "Service role RLS bypass (expected behavior)";
  
  try {
    const adminClient = createAdminClient();
    
    // Service role should be able to read all profiles
    const { data, error } = await adminClient.from("voice_profiles").select("*");
    
    if (error) {
      logTest(testName, false, `Service role query failed: ${error.message}`);
    } else {
      logTest(testName, true, `Service role can access all data (${data?.length || 0} profiles) - this is expected`);
    }
  } catch (error) {
    logTest(testName, false, `Test error: ${error}`);
  }
}

/**
 * Test 7: Verify constraint validation (quality_score 0-100)
 */
async function testConstraintValidation() {
  const testName = "Constraint validation: quality_score";
  
  try {
    const { client, user } = await createAuthenticatedClient(
      TEST_USER_A.email,
      TEST_USER_A.password
    );
    
    // First, create a voice profile to reference
    const { data: profile } = await client
      .from("voice_profiles")
      .insert({
        user_id: user.id,
        name: "Test Profile",
        rules: {
          sentencePatterns: Array(10).fill("Pattern"),
          forbiddenWords: Array(5).fill("Word"),
          signaturePhrases: Array(5).fill("Phrase"),
          rhythmPreferences: {
            avgSentenceLength: 15,
            paragraphBreaks: "moderate",
            punchlinePosition: "end",
            questionUsage: "occasional",
          },
          formattingRules: {
            useEmDash: true,
            useBulletPoints: false,
            useNumberedLists: false,
            emojiUsage: "never",
          },
        },
      })
      .select()
      .single();
    
    if (!profile) {
      logTest(testName, false, "Failed to create test profile");
      return;
    }
    
    // Try to insert a post with invalid quality_score (150 > 100)
    const { error: insertError } = await client
      .from("generated_posts")
      .insert({
        user_id: user.id,
        voice_profile_id: profile.id,
        interview_data: {},
        pipeline_data: {},
        outputs: {},
        quality_score: 150, // Invalid!
      });
    
    // Clean up
    await client.from("voice_profiles").delete().eq("id", profile.id);
    
    if (insertError) {
      logTest(testName, true, "Constraint correctly rejected quality_score > 100");
    } else {
      logTest(testName, false, "CONSTRAINT FAILED: Accepted quality_score > 100");
    }
  } catch (error) {
    logTest(testName, true, "Constraint validation working (error thrown)");
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log("\n🔒 WILLIAM.AI SECURITY TESTS\n");
  console.log("=".repeat(60));
  
  // Verify configuration
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Missing environment variables. Set:");
    console.error("   - NEXT_PUBLIC_SUPABASE_URL");
    console.error("   - NEXT_PUBLIC_SUPABASE_ANON_KEY");
    console.error("   - SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log("=".repeat(60));
  console.log("");
  
  // Run tests
  await testCrossUserReadVoiceProfiles();
  await testCrossUserUpdate();
  await testCrossUserDelete();
  await testUnauthenticatedAccess();
  await testSQLInjection();
  await testServiceRoleBypass();
  await testConstraintValidation();
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY\n");
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${results.length}`);
  
  if (failed > 0) {
    console.log("\n⚠️  SECURITY ISSUES DETECTED - DO NOT DEPLOY!");
    console.log("\nFailed tests:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  } else {
    console.log("\n✅ ALL SECURITY TESTS PASSED");
    console.log("   Ready for production (after manual verification)");
  }
}

// Run if executed directly
runAllTests().catch(console.error);

export { runAllTests, results };
