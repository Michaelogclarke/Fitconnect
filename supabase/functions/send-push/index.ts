import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { recipientId, title, body } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('expo_push_token')
      .eq('id', recipientId)
      .single();

    if (!profile?.expo_push_token) {
      return new Response(JSON.stringify({ sent: false, reason: 'no token' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to:    profile.expo_push_token,
        title,
        body,
        sound: 'default',
        data:  {},
      }),
    });

    const result = await res.json();
    return new Response(JSON.stringify({ sent: true, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status:  500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
