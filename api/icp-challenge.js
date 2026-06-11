import Anthropic from '@anthropic-ai/sdk'
import { STAGE_PROMPTS } from '../src/data/icp-prompts.js'
import { supabase } from './_supabase.js'
import { getChallengeExamples, buildChallengeContext } from './_examples.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { stage, attempt, disc, first_answer, latest_answer, session_id } = req.body

  if (stage === undefined || attempt === undefined || !latest_answer) {
    return res.status(400).json({ error: 'Missing required fields: stage, attempt, latest_answer' })
  }

  if (stage < 0 || stage > 3) {
    return res.status(400).json({ error: 'stage must be 0-3' })
  }

  if (attempt !== 1 && attempt !== 2) {
    return res.status(400).json({ error: 'attempt must be 1 or 2' })
  }

  const prompts = STAGE_PROMPTS[stage]
  const basePrompt = attempt === 1 ? prompts.a1 : prompts.a2

  // Inject real examples if we have enough data
  const examples = await getChallengeExamples(stage, disc)
  const exampleContext = buildChallengeContext(examples)
  const systemPrompt = exampleContext ? basePrompt + exampleContext : basePrompt

  const userContent = attempt === 1
    ? `Discipline: ${disc || 'performance coaching'}\n\nAnswer: ${latest_answer}`
    : `Discipline: ${disc || 'performance coaching'}\n\nFirst answer: ${first_answer || ''}\n\nLatest answer: ${latest_answer}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }]
    })

    const rawReply = message.content[0].text.trim()

    let reply, isAdvance

    if (attempt === 1) {
      reply = rawReply.replace(/^ADVANCE\s*/i, '').trim()
      isAdvance = false
    } else {
      const advanceMatch = rawReply.match(/^ADVANCE\s*\n([\s\S]*)/i)
      if (advanceMatch) {
        reply = advanceMatch[1].trim()
        isAdvance = true
      } else {
        reply = rawReply
        isAdvance = false
      }
    }

    // Log answer with advance signal — fire and forget
    supabase.from('icp_answers').insert({
      session_id: session_id || 'unknown',
      discipline: disc || null,
      stage,
      attempt,
      answer: latest_answer,
      is_advance: isAdvance
    }).then(() => {}).catch(() => {})

    return res.status(200).json({ reply, isAdvance })
  } catch (err) {
    console.error('icp-challenge error:', err)
    return res.status(500).json({ error: 'API call failed', detail: err.message })
  }
}
