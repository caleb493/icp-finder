import { supabase } from './_supabase.js'

export default async function handler(req, res) {
  const { data, error } = await supabase.from('icp_results').insert({
    session_id: 'vercel-test-' + Date.now(),
    discipline: 'Test',
    profile: { test: true }
  }).select()

  if (error) {
    return res.status(500).json({ error })
  }

  return res.status(200).json({ success: true, data })
}
