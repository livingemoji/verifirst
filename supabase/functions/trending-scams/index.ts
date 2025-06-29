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
      console.error('Database error:', error)
    }

    // Get user submitted scams for additional data
    const { data: userSubmittedScams } = await supabase
      .from('user_submitted_scams')
      .select(`
        id,
        title,
        description,
        location,
        created_at,
        categories (name, icon)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get real category trends from database
    const { data: categoryStats } = await supabase
      .from('scam_reports')
      .select(`
        categories (name, icon),
        created_at
      `)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

    // Calculate category trends
    const categoryCounts = {}
    const categoryIcons = {}
    
    if (categoryStats) {
      categoryStats.forEach(stat => {
        const categoryName = stat.categories?.name || 'other'
        const categoryIcon = stat.categories?.icon || '❓'
        
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1
        categoryIcons[categoryName] = categoryIcon
      })
    }

    // Get previous week for comparison
    const { data: previousWeekStats } = await supabase
      .from('scam_reports')
      .select(`
        categories (name),
        created_at
      `)
      .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()) // 14 days ago
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 days ago

    const previousWeekCounts = {}
    if (previousWeekStats) {
      previousWeekStats.forEach(stat => {
        const categoryName = stat.categories?.name || 'other'
        previousWeekCounts[categoryName] = (previousWeekCounts[categoryName] || 0) + 1
      })
    }

    // Calculate changes and format category trends
    const categoryTrends = Object.keys(categoryCounts).map(category => {
      const currentCount = categoryCounts[category]
      const previousCount = previousWeekCounts[category] || 0
      const change = previousCount > 0 ? Math.round(((currentCount - previousCount) / previousCount) * 100) : 100
      
      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        count: currentCount,
        change: change,
        icon: categoryIcons[category] || '❓'
      }
    }).sort((a, b) => b.count - a.count).slice(0, 6)

    // Get content statistics
    const { data: contentStats } = await supabase.rpc('get_content_statistics')

    const trendingData = {
      recentScams: [
        // Map actual scam reports
        ...(scamReports?.map(report => ({
          id: report.id,
          title: report.content.substring(0, 100) + (report.content.length > 100 ? '...' : ''),
          category: report.categories?.name || 'other',
          icon: report.categories?.icon || '❓',
          confidence: report.confidence,
          threats: report.threats || [],
          createdAt: report.created_at
        })) || []),
        
        // Add user submitted scams
        ...(userSubmittedScams?.map(scam => ({
          id: scam.id,
          title: scam.title,
          category: scam.categories?.name || 'other',
          icon: scam.categories?.icon || '❓',
          confidence: 85, // Default confidence for user submissions
          threats: ['User Reported'],
          createdAt: scam.created_at
        })) || [])
      ].slice(0, 10),
      
      categoryTrends: categoryTrends,
      
      statistics: {
        totalReports: contentStats?.[0]?.total_entries || 0,
        safeCount: contentStats?.[0]?.safe_count || 0,
        scamCount: contentStats?.[0]?.scam_count || 0,
        highConfidence: contentStats?.[0]?.high_confidence_count || 0,
        mediumConfidence: contentStats?.[0]?.medium_confidence_count || 0,
        lowConfidence: contentStats?.[0]?.low_confidence_count || 0
      }
    }

    return new Response(
      JSON.stringify(trendingData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        recentScams: [],
        categoryTrends: [],
        statistics: {
          totalReports: 0,
          safeCount: 0,
          scamCount: 0,
          highConfidence: 0,
          mediumConfidence: 0,
          lowConfidence: 0
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
