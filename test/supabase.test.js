import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://lkdmeqaofhoechlfufpy.supabase.co',
  'sb_publishable_r4UEJj8308w34y3Sck_4jA_4N3T2_SV'
)

const testProfile = {
  positioning_statement: 'Test positioning statement',
  ideal_client: 'Test ideal client',
  real_problem: 'Test real problem',
  your_edge: 'Test edge',
  tension: '',
  next_actions: ['7 day action', '30 day action', '90 day action']
}

console.log('Testing icp_results insert...')

const { data, error } = await supabase.from('icp_results').insert({
  session_id: 'test-' + Date.now(),
  discipline: 'Test',
  profile: testProfile
}).select()

if (error) {
  console.error('FAIL — Supabase error:', error)
} else {
  console.log('PASS — Row inserted:', data)
}
