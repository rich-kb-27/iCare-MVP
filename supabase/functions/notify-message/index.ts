import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-client@2'

serve(async (req) => {
  const { record } = await req.json() // This is the new message row

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Fetch Receiver's Token & Sender's Name
  const { data: receiver } = await supabaseAdmin
    .from('profiles')
    .select('expo_push_token')
    .eq('id', record.receiver_id)
    .single()

  const { data: sender } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', record.sender_id)
    .single()

  if (!receiver?.expo_push_token) {
    return new Response(JSON.stringify({ error: "No token" }), { status: 200 })
  }

  // 2. Push to Expo API
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: receiver.expo_push_token,
      sound: 'default',
      title: sender?.full_name || "iCare Message",
      body: record.content,
      data: { screen: 'chat', senderId: record.sender_id },
      priority: 'high'
    }),
  })

  return new Response(await res.text(), { 
    headers: { "Content-Type": "application/json" } 
  })
})