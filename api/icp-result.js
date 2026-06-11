import Anthropic from '@anthropic-ai/sdk'
import { RESULT_PROMPT } from '../src/data/icp-prompts.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { disc, answers } = req.body

  if (!answers || answers.length < 4) {
    return res.status(400).json({ error: 'answers array with 4 entries required' })
  }

  const userContent = [
    `Discipline: ${disc || 'performance coaching'}`,
    '',
    ...answers.map((a, i) => `Stage ${i + 1} answer: ${a.text}`)
  ].join('\n')

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: RESULT_PROMPT,
      messages: [{ role: 'user', content: userContent }]
    })

    const raw = message.content[0].text.trim()

    // Strip any markdown code fences the model might add
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let profile
    try {
      profile = JSON.parse(jsonText)
    } catch {
      return res.status(500).json({ error: 'Failed to parse JSON from model', raw })
    }

    return res.status(200).json(profile)
  } catch (err) {
    console.error('icp-result error:', err)
    return res.status(500).json({ error: 'API call failed', detail: err.message })
  }
}
