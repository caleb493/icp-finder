import Anthropic from '@anthropic-ai/sdk'
import { STAGE_PROMPTS } from '../src/data/icp-prompts.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { stage, attempt, disc, first_answer, latest_answer } = req.body

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
  const systemPrompt = attempt === 1 ? prompts.a1 : prompts.a2

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

    // ADVANCE is only a valid signal on attempt 2.
    // On attempt 1, ignore any ADVANCE and treat the full response as a challenge.
    if (attempt === 1) {
      const cleaned = rawReply.replace(/^ADVANCE\s*/i, '').trim()
      return res.status(200).json({ reply: cleaned, isAdvance: false })
    }

    // Attempt 2: check for ADVANCE on its own line at the start
    const advanceMatch = rawReply.match(/^ADVANCE\s*\n([\s\S]*)/i)
    if (advanceMatch) {
      const acknowledgement = advanceMatch[1].trim()
      return res.status(200).json({ reply: acknowledgement, isAdvance: true })
    }

    return res.status(200).json({ reply: rawReply, isAdvance: false })
  } catch (err) {
    console.error('icp-challenge error:', err)
    return res.status(500).json({ error: 'API call failed', detail: err.message })
  }
}
