import Anthropic from '@anthropic-ai/sdk'
import { RESULT_PROMPT } from '../src/data/icp-prompts.js'
import { supabase } from './_supabase.js'
import { getResultExamples, buildResultContext } from './_examples.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { disc, answers, session_id } = req.body

  if (!answers || answers.length < 4) {
    return res.status(400).json({ error: 'answers array with 4 entries required' })
  }

  const userContent = [
    `Discipline: ${disc || 'performance coaching'}`,
    '',
    ...answers.map((a, i) => `Stage ${i + 1} answer: ${a.text}`)
  ].join('\n')

  // Inject real examples if we have enough data
  const examples = await getResultExamples(disc)
  const exampleContext = buildResultContext(examples)
  const systemPrompt = exampleContext ? RESULT_PROMPT + exampleContext : RESULT_PROMPT

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }]
    })

    const raw = message.content[0].text.trim()
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let profile
    try {
      profile = JSON.parse(jsonText)
    } catch {
      return res.status(500).json({ error: 'Failed to parse JSON from model', raw })
    }

    // Log completed session
    const { error: dbError } = await supabase.from('icp_results').insert({
      session_id: session_id || 'unknown',
      discipline: disc || null,
      profile
    })

    if (dbError) console.error('Supabase icp_results insert error:', dbError)

    return res.status(200).json(profile)
  } catch (err) {
    console.error('icp-result error:', err)
    return res.status(500).json({ error: 'API call failed', detail: err.message })
  }
}
