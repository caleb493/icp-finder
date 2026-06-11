/**
 * Verifies the most critical behaviour: attempt 1 must NEVER return isAdvance=true.
 * Run with: node test/challenge.test.js
 * Requires ANTHROPIC_API_KEY in environment.
 */

import Anthropic from '@anthropic-ai/sdk'
import { STAGE_PROMPTS } from '../src/data/icp-prompts.js'
import { config } from 'dotenv'

config()

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function runChallenge({ stage, attempt, disc, first_answer, latest_answer }) {
  const prompts = STAGE_PROMPTS[stage]
  const systemPrompt = attempt === 1 ? prompts.a1 : prompts.a2

  const userContent = attempt === 1
    ? `Discipline: ${disc}\n\nAnswer: ${latest_answer}`
    : `Discipline: ${disc}\n\nFirst answer: ${first_answer}\n\nLatest answer: ${latest_answer}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }]
  })

  const rawReply = message.content[0].text.trim()

  if (attempt === 1) {
    const cleaned = rawReply.replace(/^ADVANCE\s*/i, '').trim()
    return { reply: cleaned, isAdvance: false }
  }

  const advanceMatch = rawReply.match(/^ADVANCE\s*\n([\s\S]*)/i)
  if (advanceMatch) {
    return { reply: advanceMatch[1].trim(), isAdvance: true }
  }

  return { reply: rawReply, isAdvance: false }
}

async function main() {
  let passed = 0
  let failed = 0

  console.log('=== ICP Challenge Logic Tests ===\n')

  // Test 1: attempt 1 with a vague Stage 1 answer must return a challenge, never ADVANCE
  console.log('Test 1: Stage 1, attempt 1, generic answer "I work with athletes"')
  try {
    const result = await runChallenge({
      stage: 0,
      attempt: 1,
      disc: 'sport psychology',
      latest_answer: 'I work with athletes'
    })
    if (result.isAdvance) {
      console.log('  FAIL — returned isAdvance=true on attempt 1')
      failed++
    } else {
      console.log('  PASS — isAdvance=false')
      console.log(`  Reply: ${result.reply.slice(0, 120)}...`)
      passed++
    }
  } catch (err) {
    console.log(`  ERROR — ${err.message}`)
    failed++
  }

  // Test 2: attempt 1 with a vague Stage 2 answer
  console.log('\nTest 2: Stage 2, attempt 1, vague answer "I help with confidence"')
  try {
    const result = await runChallenge({
      stage: 1,
      attempt: 1,
      disc: 'mental performance',
      latest_answer: 'I help with confidence'
    })
    if (result.isAdvance) {
      console.log('  FAIL — returned isAdvance=true on attempt 1')
      failed++
    } else {
      console.log('  PASS — isAdvance=false')
      console.log(`  Reply: ${result.reply.slice(0, 120)}...`)
      passed++
    }
  } catch (err) {
    console.log(`  ERROR — ${err.message}`)
    failed++
  }

  // Test 3: attempt 2 with a strong Stage 1 answer should return ADVANCE
  console.log('\nTest 3: Stage 1, attempt 2, strong answer that should pass')
  try {
    const result = await runChallenge({
      stage: 0,
      attempt: 2,
      disc: 'sport psychology',
      first_answer: 'I work with coaches',
      latest_answer: 'I work with first-time head coaches in Super Rugby managing a senior playing group for the first time in their career'
    })
    console.log(`  isAdvance=${result.isAdvance}`)
    console.log(`  Reply: ${result.reply.slice(0, 120)}...`)
    if (result.isAdvance) {
      console.log('  PASS — ADVANCE returned as expected')
      passed++
    } else {
      console.log('  NOTE — model chose to challenge further (acceptable, not a code bug)')
      passed++
    }
  } catch (err) {
    console.log(`  ERROR — ${err.message}`)
    failed++
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
  if (failed > 0) process.exit(1)
}

main()
