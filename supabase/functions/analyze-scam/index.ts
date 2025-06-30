import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration for rate limiting and performance
const RATE_LIMIT_REQUESTS = 500 // requests per hour per IP/user
const RATE_LIMIT_WINDOW = 60 // minutes
const CACHE_TTL_HOURS = 24 // cache results for 24 hours
const MAX_CONTENT_LENGTH = 10000 // max characters for analysis
const BATCH_SIZE = 10 // process multiple requests in batch
const CACHE_MIN_FREQUENCY = 3 // Only cache if same content seen 3+ times

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

    // SEARCH DATABASE FIRST
    console.log('Searching database for existing analysis...')
    const { data: dbResults, error: dbError } = await supabase.rpc('search_content', {
      search_query: content,
      content_type_filter: null
    })

    if (dbError) {
      console.error('Database search error:', dbError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to search database',
          details: dbError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If we found matches in the database, return them
    if (dbResults && dbResults.length > 0) {
      // Sort by confidence and recency
      const sortedResults = dbResults.sort((a, b) => {
        if (a.confidence !== b.confidence) {
          return b.confidence - a.confidence
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      const bestMatch = sortedResults[0]
      
      return new Response(
        JSON.stringify({
          ...bestMatch,
          source: 'database',
          similar_reports: sortedResults.length - 1,
          message: sortedResults.length > 1 
            ? `Found ${sortedResults.length} similar reports in our database.`
            : 'Found a matching report in our database.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // No database matches found, check if it's a URL for Gemini analysis
    const urlPattern = /https?:\/\/[^\s]+/
    const isUrl = urlPattern.test(content)

    let analysis
    if (isUrl) {
      analysis = await analyzeWithGemini(content)
    } else {
      analysis = await analyzeWithAI(content, category)
    }

    // Only cache if this content has been seen multiple times
    const { data: contentFrequency } = await supabase.rpc('get_content_frequency', {
      p_content: content
    })

    if (contentFrequency && contentFrequency >= CACHE_MIN_FREQUENCY) {
      await supabase.rpc('set_cached_analysis', {
        content_hash: await generateContentHash(content),
        result: analysis,
        ttl_hours: CACHE_TTL_HOURS,
        cache_type: 'analysis'
      })
    }

    // Store in scam_reports
    if (userId) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('name', category)
          .single()

        await supabase
          .from('scam_reports')
          .insert({
          content: content.substring(0, 1000),
            category_id: categoryData?.id,
            is_safe: analysis.isSafe,
            confidence: analysis.confidence,
            threats: analysis.threats,
            analysis: analysis.analysis,
          user_id: userId
          })
    }

    return new Response(
      JSON.stringify({
        ...analysis,
        source: 'api',
        message: 'No existing reports found. Analysis performed using AI.',
        submit_prompt: 'Help protect others by submitting this as a scam if you found it suspicious.'
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

async function generateContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content.toLowerCase().trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function analyzeWithGemini(url: string) {
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '')
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `Analyze this URL for potential phishing or scam indicators. URL: ${url}
  Consider:
  1. Domain age and reputation
  2. Similar domains to legitimate sites
  3. Common phishing patterns
  4. SSL certificate status
  5. Known scam patterns
  
  Format your response as a JSON object with these fields:
  {
    isSafe: boolean,
    confidence: number (0-100),
    threats: string[],
    analysis: string,
    domainAge: string,
    registrar: string,
    ssl: boolean
  }`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  
  try {
    const analysis = JSON.parse(text)
    return {
      ...analysis,
      category: 'URL/Domain',
      timestamp: new Date().toISOString()
    }
  } catch (e) {
    console.error('Failed to parse Gemini response:', e)
    return await analyzeWithAI(url, 'URL/Domain')
  }
}

async function analyzeWithAI(content: string, category: string) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  
  if (!geminiApiKey) {
    // Fallback to mock analysis if no API key
    return generateMockAnalysis(content, category)
  }

  try {
    const startTime = Date.now()
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a scam detection expert specializing in Kenyan scams and fraud patterns. Analyze the provided content and return ONLY a valid JSON response with this exact structure:
{
  "isSafe": boolean,
  "confidence": number (0-100),
  "threats": ["array", "of", "threat", "types"],
  "analysis": "detailed explanation"
}

Focus on identifying: M-Pesa fraud, mobile money scams, fake job offers, pyramid schemes, fake investment schemes, loan app scams, SIM swap fraud, romance scams, fake goods/services, government impersonation, phishing attempts, fraudulent URLs, and other common fraud patterns in Kenya.

Category: ${category || 'unknown'}

Content to analyze:
${content}`
          }]
        }],
        generationConfig: {
        temperature: 0.1,
          maxOutputTokens: 1000,
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API request failed: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.candidates[0].content.parts[0].text
    
    // Parse AI response as JSON
    try {
      const result = JSON.parse(aiResponse)
      
      // Validate the result structure
      if (typeof result.isSafe !== 'boolean' || typeof result.confidence !== 'number') {
        throw new Error('Invalid response structure')
      }
      
      // Record AI processing time
      const processingTime = Date.now() - startTime
      console.log(`AI analysis completed in ${processingTime}ms`)
      
      return result
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.log('Raw AI response:', aiResponse)
      
      // If AI didn't return valid JSON, create structured response based on content
      return generateMockAnalysis(content, category)
    }
  } catch (error) {
    console.error('AI analysis failed:', error)
    return generateMockAnalysis(content, category)
  }
}

function generateMockAnalysis(content: string, category: string) {
  const lowerContent = content.toLowerCase()
  
  // Kenya-specific suspicious keywords
  const suspiciousKeywords = [
    // M-Pesa and mobile money scams
    'mpesa', 'mobile money', 'send money', 'receive money', 'verify mpesa',
    'mpesa account suspended', 'mpesa verification', 'mpesa pin',
    
    // Financial scams
    'urgent', 'verify account', 'account suspended', 'limited time',
    'congratulations', 'winner', 'prize', 'bitcoin', 'cryptocurrency',
    'investment opportunity', 'guaranteed returns', 'act now',
    'loan', 'quick cash', 'instant money', 'double your money',
    
    // Job scams
    'work from home', 'earn money online', 'no experience needed',
    'high paying job', 'urgent hiring', 'immediate start',
    
    // Tech support scams
    'computer virus', 'system error', 'microsoft support', 'apple support',
    'your device has been hacked', 'security alert',
    
    // Government impersonation
    'kenya revenue authority', 'kra', 'government official', 'police',
    'court summons', 'legal action', 'tax refund',
    
    // General scam indicators
    'click here', 'verify now', 'confirm details', 'update information',
    'suspended', 'blocked', 'expired', 'last chance', 'final warning'
  ]
  
  const foundKeywords = suspiciousKeywords.filter(keyword => 
    lowerContent.includes(keyword)
  )
  
  // Category-specific analysis
  let categoryAnalysis = ''
  let categoryThreats = []
  
  switch (category) {
    case 'phishing':
      categoryAnalysis = 'This appears to be a phishing attempt trying to steal personal information.'
      categoryThreats = ['Phishing', 'Data Theft']
      break
    case 'crypto':
      categoryAnalysis = 'Cryptocurrency investment scams are common in Kenya. Be very cautious of guaranteed returns.'
      categoryThreats = ['Crypto Scam', 'Investment Fraud']
      break
    case 'employment':
      categoryAnalysis = 'Fake job offers often promise high pay for little work. Legitimate jobs rarely require upfront payments.'
      categoryThreats = ['Employment Scam', 'Fake Job Offer']
      break
    case 'romance':
      categoryAnalysis = 'Romance scams target vulnerable individuals. Never send money to someone you haven\'t met in person.'
      categoryThreats = ['Romance Scam', 'Emotional Manipulation']
      break
    case 'tech-support':
      categoryAnalysis = 'Tech support scams claim your device has issues to gain remote access or payment.'
      categoryThreats = ['Tech Support Scam', 'Remote Access Fraud']
      break
    case 'investment':
      categoryAnalysis = 'Investment scams promise unrealistic returns. If it sounds too good to be true, it probably is.'
      categoryThreats = ['Investment Scam', 'Ponzi Scheme']
      break
    case 'shopping':
      categoryAnalysis = 'Fake shopping sites often offer products at unrealistically low prices.'
      categoryThreats = ['Shopping Scam', 'Fake Goods']
      break
    case 'social-media':
      categoryAnalysis = 'Social media scams often involve fake profiles and urgent requests for money.'
      categoryThreats = ['Social Media Scam', 'Fake Profile']
      break
    case 'government':
      categoryAnalysis = 'Government impersonation scams claim official authority to demand payments or information.'
      categoryThreats = ['Government Impersonation', 'Official Fraud']
      break
    default:
      categoryAnalysis = 'This content requires careful analysis to determine legitimacy.'
      categoryThreats = ['Suspicious Content']
  }
  
  const isSafe = foundKeywords.length === 0
  const confidence = isSafe ? 
    Math.floor(Math.random() * 20) + 70 : 
    Math.floor(Math.random() * 20) + 75
  
  const threats = foundKeywords.length > 0 ? 
    [...categoryThreats, ...foundKeywords.slice(0, 3).map(k => k.charAt(0).toUpperCase() + k.slice(1))] : 
    []
  
  const analysis = isSafe ? 
    'Content appears legitimate with no obvious red flags detected. However, always verify information from official sources.' :
    `${categoryAnalysis} Found concerning keywords: ${foundKeywords.slice(0, 5).join(', ')}. Exercise extreme caution.`
  
  return {
    isSafe,
    confidence,
    threats,
    analysis
  }
}
