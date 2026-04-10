import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const payload = await req.json()
  
  // payload.record is the new row from your 'schedules' table
  const { doctor_id, patient_name, id } = payload.record

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Get the Doctor's Expo Push Token from your 'profiles' table
  const { data: profile } = await supabase
    .from('profiles')
    .select('expo_push_token')
    .eq('id', doctor_id)
    .single()

  if (!profile?.expo_push_token) {
    return new Response(JSON.stringify({ error: 'No token found' }), { status: 400 })
  }

  // 2. Send the High-Priority Data Push to Expo
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`,
    },
    body: JSON.stringify({
      to: profile.expo_push_token,
      priority: 'high',
      // We leave 'title' and 'body' empty so it's a "silent" data push
      // This allows our app code to handle the Ringing UI manually
      data: {
        type: 'VIDEO_CALL',
        id: id, 
        patient_name: patient_name,
      },
      _contentAvailable: true, // Critical for waking up iOS apps
    }),
  })

  const result = await res.json()
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })
})