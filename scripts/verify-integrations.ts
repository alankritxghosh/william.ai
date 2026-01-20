/**
 * Integration Verification Script
 * 
 * Run with: npx tsx scripts/verify-integrations.ts
 * 
 * This script tests whether Supabase and Gemini are actually working,
 * not just whether the code files exist.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const geminiKey = process.env.GEMINI_API_KEY

interface TestResult {
  name: string
  passed: boolean
  message: string
}

const results: TestResult[] = []

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`)
}

function addResult(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message })
  log(passed ? '✅' : '❌', `${name}: ${message}`)
}

async function verifyEnvironment() {
  console.log('\n' + '='.repeat(50))
  console.log('STEP 1: ENVIRONMENT VARIABLES')
  console.log('='.repeat(50) + '\n')

  addResult(
    'NEXT_PUBLIC_SUPABASE_URL',
    !!supabaseUrl,
    supabaseUrl ? `Set (${supabaseUrl.substring(0, 30)}...)` : 'MISSING'
  )

  addResult(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    !!supabaseKey,
    supabaseKey ? `Set (${supabaseKey.substring(0, 20)}...)` : 'MISSING'
  )

  addResult(
    'GEMINI_API_KEY',
    !!geminiKey,
    geminiKey ? `Set (${geminiKey.substring(0, 10)}...)` : 'MISSING'
  )
}

async function verifySupabaseConnection() {
  console.log('\n' + '='.repeat(50))
  console.log('STEP 2: SUPABASE CONNECTION')
  console.log('='.repeat(50) + '\n')

  if (!supabaseUrl || !supabaseKey) {
    addResult('Supabase Connection', false, 'Cannot test - missing credentials')
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic connection by checking if we can reach Supabase
    const { error } = await supabase.auth.getSession()
    
    if (error) {
      addResult('Supabase Connection', false, `Connection error: ${error.message}`)
      return false
    }

    addResult('Supabase Connection', true, 'Successfully connected')
    return true
  } catch (e) {
    addResult('Supabase Connection', false, `Exception: ${e}`)
    return false
  }
}

async function verifySupabaseTables() {
  console.log('\n' + '='.repeat(50))
  console.log('STEP 3: DATABASE TABLES (Migrations)')
  console.log('='.repeat(50) + '\n')

  if (!supabaseUrl || !supabaseKey) {
    addResult('Database Tables', false, 'Cannot test - missing credentials')
    return false
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const tables = ['profiles', 'voice_profiles', 'generated_posts']
  let allExist = true

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1)
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          addResult(`Table: ${table}`, false, 'TABLE DOES NOT EXIST - Run migrations!')
          allExist = false
        } else if (error.message.includes('permission denied') || error.code === '42501') {
          // RLS is blocking us, but the table exists
          addResult(`Table: ${table}`, true, 'Exists (RLS active - expected)')
        } else {
          addResult(`Table: ${table}`, false, `Error: ${error.message}`)
          allExist = false
        }
      } else {
        addResult(`Table: ${table}`, true, 'Exists and accessible')
      }
    } catch (e) {
      addResult(`Table: ${table}`, false, `Exception: ${e}`)
      allExist = false
    }
  }

  return allExist
}

async function verifySupabaseAuth() {
  console.log('\n' + '='.repeat(50))
  console.log('STEP 4: SUPABASE AUTH')
  console.log('='.repeat(50) + '\n')

  if (!supabaseUrl || !supabaseKey) {
    addResult('Supabase Auth', false, 'Cannot test - missing credentials')
    return false
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const testEmail = `test-verify-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'

  try {
    // Try to sign up a test user
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (error) {
      // Some errors are expected (e.g., email confirmation required)
      if (error.message.includes('email')) {
        addResult('Auth Signup', true, 'Works (email confirmation may be required)')
        return true
      }
      addResult('Auth Signup', false, `Error: ${error.message}`)
      return false
    }

    if (data.user) {
      addResult('Auth Signup', true, `Works! Test user created: ${data.user.id.substring(0, 8)}...`)
      
      // Clean up: try to delete the test user (might fail due to permissions, that's ok)
      log('🧹', 'Note: Test user created. Clean up manually if needed.')
      return true
    }

    addResult('Auth Signup', true, 'Signup initiated (check email for confirmation)')
    return true
  } catch (e) {
    addResult('Auth Signup', false, `Exception: ${e}`)
    return false
  }
}

async function verifyGeminiAPI() {
  console.log('\n' + '='.repeat(50))
  console.log('STEP 5: GEMINI API')
  console.log('='.repeat(50) + '\n')

  if (!geminiKey) {
    addResult('Gemini API', false, 'Cannot test - missing API key')
    return false
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Respond with exactly: "API_WORKS" and nothing else.'
            }]
          }]
        })
      }
    )

    const data = await response.json()

    if (data.error) {
      addResult('Gemini API', false, `API Error: ${data.error.message || JSON.stringify(data.error)}`)
      return false
    }

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const responseText = data.candidates[0].content.parts[0].text.trim()
      addResult('Gemini API', true, `Works! Response: "${responseText.substring(0, 50)}"`)
      return true
    }

    addResult('Gemini API', false, `Unexpected response format: ${JSON.stringify(data).substring(0, 100)}`)
    return false
  } catch (e) {
    addResult('Gemini API', false, `Exception: ${e}`)
    return false
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(50))
  console.log('SUMMARY')
  console.log('='.repeat(50) + '\n')

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`Passed: ${passed}/${total}`)
  console.log(`Failed: ${failed}/${total}`)

  if (failed > 0) {
    console.log('\n🚨 FAILED TESTS:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`)
    })
  }

  console.log('\n' + '='.repeat(50))
  console.log('DIAGNOSIS')
  console.log('='.repeat(50) + '\n')

  const envOk = results.filter(r => r.name.includes('SUPABASE') || r.name.includes('GEMINI'))
    .filter(r => r.name.includes('URL') || r.name.includes('KEY'))
    .every(r => r.passed)

  const tablesOk = results.filter(r => r.name.startsWith('Table:')).every(r => r.passed)
  const authOk = results.find(r => r.name === 'Auth Signup')?.passed ?? false
  const geminiOk = results.find(r => r.name === 'Gemini API')?.passed ?? false

  if (!envOk) {
    console.log('❌ ENVIRONMENT: Missing required environment variables')
    console.log('   → Check your .env.local file')
    console.log('   → Get credentials from Supabase dashboard and Google AI Studio')
  } else if (!tablesOk) {
    console.log('❌ DATABASE: Tables do not exist')
    console.log('   → Run the SQL migrations in Supabase SQL Editor:')
    console.log('   → supabase/migrations/001_initial_schema.sql')
    console.log('   → supabase/migrations/002_rls_policies.sql')
  } else if (!authOk) {
    console.log('❌ AUTH: Supabase Auth is not working')
    console.log('   → Check Supabase Auth settings in dashboard')
    console.log('   → Verify email provider is configured')
  } else if (!geminiOk) {
    console.log('❌ AI: Gemini API is not working')
    console.log('   → Check your GEMINI_API_KEY')
    console.log('   → Verify API is enabled in Google Cloud Console')
  } else {
    console.log('✅ ALL SYSTEMS OPERATIONAL')
    console.log('   → Supabase is connected and tables exist')
    console.log('   → Authentication is working')
    console.log('   → Gemini API is responding')
    console.log('\n   You can proceed with the GTM fixes!')
  }

  console.log('')
}

async function main() {
  console.log('\n🔍 WILLIAM.AI INTEGRATION VERIFICATION\n')
  console.log('This script tests whether your integrations actually work.')
  console.log('It does NOT just check if code files exist.\n')

  await verifyEnvironment()
  const connected = await verifySupabaseConnection()
  
  if (connected) {
    await verifySupabaseTables()
    await verifySupabaseAuth()
  }
  
  await verifyGeminiAPI()
  await printSummary()
}

main().catch(console.error)
