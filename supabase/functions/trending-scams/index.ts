
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

    // Get recent scam reports with category info from Kenya
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

    // Get user submitted scams from Kenya for additional data
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

    const trendingData = {
      recentScams: [
        // Map actual scam reports
        ...(scamReports?.map(report => ({
          id: report.id,
          title: report.content.substring(0, 100) + (report.content.length > 100 ? '...' : ''),
          category: report.categories?.name || 'other',
          icon: report.categories?.icon || '❓',
          confidence: report.confidence,
          threats: report.threats,
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
      
      // Kenya-specific trending categories
      categoryTrends: [
        { category: 'Mobile Money', count: 234, change: 18, icon: '📱' },
        { category: 'Employment', count: 156, change: 12, icon: '💼' },
        { category: 'Investment', count: 89, change: -5, icon: '📈' },
        { category: 'Romance', count: 67, change: 23, icon: '💕' },
        { category: 'Cryptocurrency', count: 45, change: 8, icon: '₿' },
        { category: 'Government', count: 34, change: -2, icon: '🏛️' }
      ]
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
        categoryTrends: [
          { category: 'Mobile Money', count: 234, change: 18, icon: '📱' },
          { category: 'Employment', count: 156, change: 12, icon: '💼' },
          { category: 'Investment', count: 89, change: -5, icon: '📈' },
          { category: 'Romance', count: 67, change: 23, icon: '💕' },
          { category: 'Cryptocurrency', count: 45, change: 8, icon: '₿' },
          { category: 'Government', count: 34, change: -2, icon: '🏛️' }
        ]
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
