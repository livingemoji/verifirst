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

    // Get recent scam reports
    const { data: scamReports, error: scamError } = await supabase
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
      .order('created_at', { ascending: false })
      .limit(10)

    if (scamError) {
      console.error('Scam reports error:', scamError)
    }

    // Get recent user submitted scams
    const { data: userSubmittedScams, error: userError } = await supabase
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

    if (userError) {
      console.error('User submitted scams error:', userError)
    }

    // Combine and format the data
    const recentActivity = [
      // Format scam reports
      ...(scamReports?.map(report => ({
        id: report.id,
        title: report.content.substring(0, 100) + (report.content.length > 100 ? '...' : ''),
        description: report.analysis.substring(0, 150) + (report.analysis.length > 150 ? '...' : ''),
        category: report.categories?.name || 'other',
        confidence: report.confidence,
        is_safe: report.is_safe,
        created_at: report.created_at,
        location: 'Kenya'
      })) || []),
      
      // Format user submitted scams
      ...(userSubmittedScams?.map(scam => ({
        id: scam.id,
        title: scam.title,
        description: scam.description.substring(0, 150) + (scam.description.length > 150 ? '...' : ''),
        category: scam.categories?.name || 'other',
        confidence: 75, // Default confidence for user submissions
        is_safe: false, // User submissions are typically scams
        created_at: scam.created_at,
        location: scam.location || 'Kenya'
      })) || [])
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return new Response(
      JSON.stringify(recentActivity),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        recentActivity: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 