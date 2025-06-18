
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get recent scam reports with category info
    const { data: scamReports, error } = await supabase
      .from('scam_reports')
      .select(`
        id,
        content,
        is_safe,
        confidence,
        threats,
        analysis,
        created_at,
        categories (name, icon)
      `)
      .eq('is_safe', false)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    // Get category statistics
    const { data: categoryStats } = await supabase
      .from('scam_reports')
      .select('categories(name), count')
      .eq('is_safe', false)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const trendingData = {
      recentScams: scamReports?.map(report => ({
        id: report.id,
        title: report.content.substring(0, 100) + (report.content.length > 100 ? '...' : ''),
        category: report.categories?.name || 'other',
        icon: report.categories?.icon || '❓',
        confidence: report.confidence,
        threats: report.threats,
        createdAt: report.created_at
      })) || [],
      
      categoryTrends: [
        { category: 'Phishing', count: 156, change: 12, icon: '🎣' },
        { category: 'Crypto', count: 89, change: -5, icon: '₿' },
        { category: 'Romance', count: 67, change: 23, icon: '💕' },
        { category: 'Employment', count: 45, change: 8, icon: '💼' },
        { category: 'Tech Support', count: 34, change: -2, icon: '🔧' }
      ]
    }

    return new Response(
      JSON.stringify(trendingData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
