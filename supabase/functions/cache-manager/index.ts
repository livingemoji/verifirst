import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...params } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    switch (action) {
      case 'get_stats':
        const { data: stats } = await supabase.rpc('get_cache_stats')
        return new Response(
          JSON.stringify(stats),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'cleanup':
        await supabase.rpc('cleanup_all_caches')
        return new Response(
          JSON.stringify({ success: true, message: 'Cache cleanup completed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'get_trending':
        const { data: trendingData } = await supabase.rpc('get_trending_cache', {
          cache_key: params.cache_key || 'weekly_trends',
          ttl_minutes: params.ttl_minutes || 15
        })
        return new Response(
          JSON.stringify(trendingData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'set_trending':
        await supabase.rpc('set_trending_cache', {
          cache_key: params.cache_key,
          data: params.data,
          ttl_minutes: params.ttl_minutes || 15
        })
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'get_domain':
        const { data: domainData } = await supabase.rpc('get_domain_cache', {
          domain: params.domain,
          ttl_hours: params.ttl_hours || 168
        })
        return new Response(
          JSON.stringify(domainData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'set_domain':
        await supabase.rpc('set_domain_cache', {
          domain: params.domain,
          trust_score: params.trust_score,
          risk_factors: params.risk_factors || [],
          analysis_data: params.analysis_data,
          ttl_hours: params.ttl_hours || 168
        })
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Cache manager error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 