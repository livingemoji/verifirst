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
    const { cache_key = 'weekly_trends' } = await req.json().catch(() => ({ cache_key: 'weekly_trends' }))
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Check cache first (15 minutes TTL)
    const { data: cachedData } = await supabase.rpc('get_trending_cache', {
      cache_key: cache_key,
      ttl_minutes: 15
    })

    if (cachedData) {
      console.log('Returning cached trending data for:', cache_key)
      return new Response(
        JSON.stringify({
          ...cachedData,
          cached: true,
          cache_key: cache_key
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Cache miss, generating fresh trending data for:', cache_key)
    
    let result = {}

    switch (cache_key) {
      case 'weekly_trends':
        result = await getWeeklyTrends(supabase)
        break
      case 'daily_stats':
        result = await getDailyStats(supabase)
        break
      case 'category_breakdown':
        result = await getCategoryBreakdown(supabase)
        break
      case 'recent_activity':
        result = await getRecentActivity(supabase)
        break
      default:
        result = await getWeeklyTrends(supabase)
    }

    // Cache the result
    await supabase.rpc('set_trending_cache', {
      cache_key: cache_key,
      data: result,
      ttl_minutes: 15
    })

    return new Response(
      JSON.stringify({
        ...result,
        cached: false,
        cache_key: cache_key
      }),
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

async function getWeeklyTrends(supabase: any) {
  const { data: weeklyScams } = await supabase
      .from('scam_reports')
      .select(`
        id,
        content,
        is_safe,
        confidence,
        threats,
        created_at,
      categories(name, icon)
      `)
      .eq('is_safe', false)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

  const { data: userSubmissions } = await supabase
      .from('user_submitted_scams')
      .select(`
        id,
        title,
        description,
        location,
      status,
        created_at,
      categories(name, icon)
      `)
      .eq('status', 'approved')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

  return {
    weekly_scams: weeklyScams || [],
    user_submissions: userSubmissions || [],
    period: '7 days'
  }
}

async function getDailyStats(supabase: any) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: dailyScams } = await supabase
    .from('scam_reports')
    .select('id, is_safe, confidence, created_at')
    .gte('created_at', today.toISOString())

  const { data: dailySubmissions } = await supabase
    .from('user_submitted_scams')
    .select('id, status, created_at')
    .gte('created_at', today.toISOString())

  const totalScams = dailyScams?.length || 0
  const unsafeScams = dailyScams?.filter(s => !s.is_safe).length || 0
  const avgConfidence = dailyScams?.length > 0 
    ? dailyScams.reduce((sum, s) => sum + s.confidence, 0) / dailyScams.length 
    : 0
  const newSubmissions = dailySubmissions?.length || 0

  return {
    total_scams: totalScams,
    unsafe_scams: unsafeScams,
    safe_scams: totalScams - unsafeScams,
    avg_confidence: Math.round(avgConfidence),
    new_submissions: newSubmissions,
    date: today.toISOString().split('T')[0]
  }
}

async function getCategoryBreakdown(supabase: any) {
  const { data: categoryStats } = await supabase
    .from('scam_reports')
    .select(`
      categories(name, icon),
      is_safe
    `)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const categoryMap = new Map()
  
  categoryStats?.forEach(stat => {
    const categoryName = stat.categories?.name || 'unknown'
    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, {
        name: categoryName,
        icon: stat.categories?.icon || '❓',
        total: 0,
        unsafe: 0,
        safe: 0
      })
    }
    
    const category = categoryMap.get(categoryName)
    category.total++
    if (stat.is_safe) {
      category.safe++
    } else {
      category.unsafe++
    }
  })

  return {
    categories: Array.from(categoryMap.values()).sort((a, b) => b.total - a.total),
    period: '30 days'
  }
}

async function getRecentActivity(supabase: any) {
  const { data: recentScams } = await supabase
    .from('scam_reports')
    .select(`
      id,
      content,
      is_safe,
      confidence,
      created_at,
      categories(name, icon)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentSubmissions } = await supabase
    .from('user_submitted_scams')
    .select(`
      id,
      title,
      status,
      created_at,
      categories(name, icon)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    recent_scams: recentScams || [],
    recent_submissions: recentSubmissions || [],
    last_updated: new Date().toISOString()
  }
}
