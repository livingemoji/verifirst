import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration for rate limiting and performance
const RATE_LIMIT_REQUESTS = 100 // requests per hour per IP/user
const RATE_LIMIT_WINDOW = 60 // minutes
const CACHE_TTL_HOURS = 24 // cache results for 24 hours
const MAX_CONTENT_LENGTH = 10000 // max characters for analysis
const BATCH_SIZE = 10 // process multiple requests in batch

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content, category, batch = false } = await req.json()
    
    if (!content || !content.trim()) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check content length
    if (content.length > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Content too long. Maximum ${MAX_CONTENT_LENGTH} characters allowed.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    
    // Get user if authenticated
    let userId = null
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        userId = user?.id
      } catch (error) {
        console.log('Authentication failed, proceeding with rate limiting by IP')
      }
    }

    // Check rate limit
    const { data: rateLimitResult, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_ip_address: clientIP,
      p_user_id: userId,
      p_endpoint: 'analyze-scam',
      p_max_requests: RATE_LIMIT_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW
    })

    if (rateLimitError || !rateLimitResult) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retry_after: RATE_LIMIT_WINDOW * 60
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create content hash for caching
    const encoder = new TextEncoder()
    const data = encoder.encode(content.toLowerCase().trim())
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Check cache first with TTL
    const { data: cached } = await supabase
      .from('analysis_cache')
      .select('result, created_at')
      .eq('content_hash', contentHash)
      .gte('created_at', new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString())
      .single()

    if (cached) {
      console.log('Returning cached result')
      
      // Record cache hit metric
      await supabase.rpc('record_performance_metric', {
        p_metric_name: 'cache_hit',
        p_metric_value: 1,
        p_tags: { endpoint: 'analyze-scam', category: category || 'unknown' }
      })

      return new Response(
        JSON.stringify({
          ...cached.result,
          cached: true,
          cache_age: Math.floor((Date.now() - new Date(cached.created_at).getTime()) / 1000)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Record cache miss metric
    await supabase.rpc('record_performance_metric', {
      p_metric_name: 'cache_miss',
      p_metric_value: 1,
      p_tags: { endpoint: 'analyze-scam', category: category || 'unknown' }
    })

    // Analyze with AI
    const analysis = await analyzeWithAI(content, category)
    
    // Cache the result with TTL
    await supabase
      .from('analysis_cache')
      .insert({
        content_hash: contentHash,
        result: analysis,
        created_at: new Date().toISOString()
      })
      .onConflict('content_hash')
      .merge()

    // Store in scam_reports if user is authenticated
    if (userId) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('name', category)
        .single()

      await supabase
        .from('scam_reports')
        .insert({
          content: content.substring(0, 1000), // Limit content length in database
          category_id: categoryData?.id,
          is_safe: analysis.isSafe,
          confidence: analysis.confidence,
          threats: analysis.threats,
          analysis: analysis.analysis,
          user_id: userId
        })
    }

    // Record successful analysis metric
    await supabase.rpc('record_performance_metric', {
      p_metric_name: 'analysis_success',
      p_metric_value: 1,
      p_tags: { 
        endpoint: 'analyze-scam', 
        category: category || 'unknown',
        is_safe: analysis.isSafe,
        confidence_level: analysis.confidence > 80 ? 'high' : analysis.confidence > 60 ? 'medium' : 'low'
      }
    })

    return new Response(
      JSON.stringify({
        ...analysis,
        cached: false,
        content_length: content.length,
        processing_time: Date.now() - new Date().getTime()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    
    // Record error metric
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      )
      
      await supabase.rpc('record_performance_metric', {
        p_metric_name: 'analysis_error',
        p_metric_value: 1,
        p_tags: { endpoint: 'analyze-scam', error_type: error.name || 'unknown' }
      })
    } catch (metricError) {
      console.error('Failed to record error metric:', metricError)
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function analyzeWithAI(content: string, category: string) {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
  
  if (!openRouterKey) {
    // Fallback to mock analysis if no API key
    return generateMockAnalysis(content, category)
  }

  try {
    const startTime = Date.now()
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: `You are a scam detection expert. Analyze the provided content and return a JSON response with:
- isSafe: boolean (true if legitimate, false if scam)
- confidence: number (0-100, how confident you are)
- threats: array of detected threat types
- analysis: string (detailed explanation)

Focus on identifying: phishing attempts, fraudulent URLs, fake offers, impersonation, crypto scams, romance scams, employment scams, tech support scams, and other common fraud patterns.`
          },
          {
            role: 'user',
            content: `Category: ${category || 'unknown'}\n\nContent to analyze:\n${content}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API request failed: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content
    
    // Parse AI response as JSON
    try {
      const result = JSON.parse(aiResponse)
      
      // Record AI processing time
      const processingTime = Date.now() - startTime
      console.log(`AI analysis completed in ${processingTime}ms`)
      
      return result
    } catch {
      // If AI didn't return valid JSON, create structured response
      return {
        isSafe: !aiResponse.toLowerCase().includes('scam'),
        confidence: 75,
        threats: aiResponse.toLowerCase().includes('scam') ? ['Potential Scam'] : [],
        analysis: aiResponse
      }
    }
  } catch (error) {
    console.error('AI analysis failed:', error)
    return generateMockAnalysis(content, category)
  }
}

function generateMockAnalysis(content: string, category: string) {
  const lowerContent = content.toLowerCase()
  const suspiciousKeywords = [
    'urgent', 'verify account', 'click here', 'suspended', 'limited time',
    'congratulations', 'winner', 'prize', 'bitcoin', 'cryptocurrency',
    'investment opportunity', 'guaranteed returns', 'act now', 'mpesa',
    'mobile money', 'loan', 'quick cash', 'instant money'
  ]
  
  const foundKeywords = suspiciousKeywords.filter(keyword => 
    lowerContent.includes(keyword)
  )
  
  const isSafe = foundKeywords.length === 0
  const confidence = isSafe ? 
    Math.floor(Math.random() * 20) + 70 : 
    Math.floor(Math.random() * 30) + 70
  
  return {
    isSafe,
    confidence,
    threats: foundKeywords.length > 0 ? ['Suspicious Keywords', 'Potential Phishing'] : [],
    analysis: isSafe ? 
      'Content appears legitimate with no obvious red flags detected.' :
      `Suspicious content detected. Found concerning keywords: ${foundKeywords.join(', ')}`
  }
}
