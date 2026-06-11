import { supabase } from './_supabase.js'

export async function getResultExamples(disc, limit = 5) {
  // Try discipline-matched examples first, fall back to all
  const { data: matched } = await supabase
    .from('icp_results')
    .select('discipline, profile')
    .ilike('discipline', disc || '')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (matched && matched.length >= 3) return matched

  const { data: all } = await supabase
    .from('icp_results')
    .select('discipline, profile')
    .order('created_at', { ascending: false })
    .limit(limit)

  return all || []
}

export async function getChallengeExamples(stage, disc, limit = 6) {
  const { data } = await supabase
    .from('icp_answers')
    .select('answer, is_advance, discipline')
    .eq('stage', stage)
    .not('is_advance', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}

export function buildResultContext(examples) {
  if (!examples || examples.length < 3) return ''

  const formatted = examples.map((e, i) =>
    `Example ${i + 1} (${e.discipline || 'performance coaching'}):\n${JSON.stringify(e.profile, null, 2)}`
  ).join('\n\n')

  return `\nThe following are real ICP profiles this tool has generated for performance coaches. Use them to calibrate the specificity and directness of your output. Do not copy them. Use them as a benchmark for the level of detail required.\n\n${formatted}\n`
}

export function buildChallengeContext(examples) {
  if (!examples || examples.length < 4) return ''

  const passing = examples.filter(e => e.is_advance).slice(0, 3)
  const failing = examples.filter(e => !e.is_advance).slice(0, 3)

  if (passing.length < 2 || failing.length < 2) return ''

  const passingText = passing.map(e => `- "${e.answer}"`).join('\n')
  const failingText = failing.map(e => `- "${e.answer}"`).join('\n')

  return `\nReal examples from performance coaches at this stage:\n\nAnswers that passed:\n${passingText}\n\nAnswers that needed more depth:\n${failingText}\n`
}
