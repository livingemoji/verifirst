
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
    const { content, category } = await req.json()
    
    if (!content || !content.trim()) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Create content hash for caching
    const encoder = new TextEncoder()
    const data = encoder.encode(content.toLowerCase().trim())
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Check cache first
    const { data: cached } = await supabase
      .from('analysis_cache')
      .select('result')
      .eq('content_hash', contentHash)
      .single()

    if (cached) {
      console.log('Returning cached result')
      return new Response(
        JSON.stringify(cached.result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Analyze with AI
    const analysis = await analyzeWithAI(content, category)
    
    // Cache the result
    await supabase
      .from('analysis_cache')
      .insert({
        content_hash: contentHash,
        result: analysis
      })

    // Store in scam_reports if user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (user) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('name', category)
          .single()

        await supabase
          .from('scam_reports')
          .insert({
            content,
            category_id: categoryData?.id,
            is_safe: analysis.isSafe,
            confidence: analysis.confidence,
            threats: analysis.threats,
            analysis: analysis.analysis,
            user_id: user.id
          })
      }
    }

    return new Response(
      JSON.stringify(analysis),
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

async function analyzeWithAI(content: string, category: string) {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
  
  if (!openRouterKey) {
    // Fallback to mock analysis if no API key
    return generateMockAnalysis(content, category)
  }

  try {
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
      throw new Error('OpenRouter API request failed')
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content
    
    // Parse AI response as JSON
    try {
      return JSON.parse(aiResponse)
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
    'investment opportunity', 'guaranteed returns', 'act now'
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
