import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration
const CACHE_TTL_HOURS = 24 // cache results for 24 hours
const RATE_LIMIT_REQUESTS = 50 // requests per hour per IP/user
const RATE_LIMIT_WINDOW = 60 // minutes

// Free APIs for domain analysis (you can replace with paid services)
const GOOGLE_SAFE_BROWSING_API_KEY = Deno.env.get('GOOGLE_SAFE_BROWSING_API_KEY')
const VIRUSTOTAL_API_KEY = Deno.env.get('VIRUSTOTAL_API_KEY')
const PHISHTANK_API_URL = 'https://checkurl.phishtank.com/checkurl/'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { domain, url } = await req.json()
    
    if (!domain && !url) {
      return new Response(
        JSON.stringify({ error: 'Domain or URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const targetDomain = domain || extractDomainFromUrl(url)
    
    if (!targetDomain) {
      return new Response(
        JSON.stringify({ error: 'Invalid domain or URL' }),
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
      p_endpoint: 'domain-analysis',
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

    // Check cache first
    const { data: cached } = await supabase
      .from('domain_analysis')
      .select('*')
      .eq('domain', targetDomain)
      .gte('last_analyzed', new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString())
      .single()

    if (cached) {
      console.log('Returning cached domain analysis')
      return new Response(
        JSON.stringify({
          ...cached,
          cached: true,
          cache_age: Math.floor((Date.now() - new Date(cached.last_analyzed).getTime()) / 1000)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Perform domain analysis
    const analysis = await analyzeDomain(targetDomain)
    
    // Store or update analysis
    const { data: analysisData, error: analysisError } = await supabase
      .from('domain_analysis')
      .upsert({
        domain: targetDomain,
        trust_score: analysis.trustScore,
        is_blacklisted: analysis.isBlacklisted,
        blacklist_sources: analysis.blacklistSources,
        domain_age_days: analysis.domainAgeDays,
        ssl_valid: analysis.sslValid,
        registrar: analysis.registrar,
        country_code: analysis.countryCode,
        server_location: analysis.serverLocation,
        response_time_ms: analysis.responseTimeMs,
        threat_level: analysis.threatLevel,
        risk_factors: analysis.riskFactors,
        last_analyzed: new Date().toISOString()
      }, {
        onConflict: 'domain'
      })
      .select()
      .single()

    if (analysisError) {
      console.error('Error storing domain analysis:', analysisError)
    }

    // Store in history
    await supabase
      .from('domain_analysis_history')
      .insert({
        domain: targetDomain,
        trust_score: analysis.trustScore,
        is_blacklisted: analysis.isBlacklisted,
        threat_level: analysis.threatLevel,
        analysis_metadata: analysis
      })

    // Record performance metric
    await supabase.rpc('record_performance_metric', {
      p_metric_name: 'domain_analysis_success',
      p_metric_value: 1,
      p_tags: { 
        endpoint: 'domain-analysis',
        domain: targetDomain,
        threat_level: analysis.threatLevel,
        blacklisted: analysis.isBlacklisted
      }
    })

    return new Response(
      JSON.stringify({
        ...analysis,
        cached: false,
        domain: targetDomain
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
        p_metric_name: 'domain_analysis_error',
        p_metric_value: 1,
        p_tags: { endpoint: 'domain-analysis', error_type: error.name || 'unknown' }
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

async function analyzeDomain(domain: string) {
  const startTime = Date.now()
  
  // Initialize analysis result
  const analysis = {
    trustScore: 50, // Base score
    isBlacklisted: false,
    blacklistSources: [] as string[],
    domainAgeDays: 0,
    sslValid: false,
    registrar: '',
    countryCode: '',
    serverLocation: '',
    responseTimeMs: 0,
    threatLevel: 'low' as 'low' | 'medium' | 'high' | 'critical',
    riskFactors: {} as Record<string, any>
  }

  try {
    // 1. Check SSL certificate
    const sslCheck = await checkSSL(domain)
    analysis.sslValid = sslCheck.valid
    if (sslCheck.valid) {
      analysis.trustScore += 10
    } else {
      analysis.riskFactors.ssl = 'Invalid or missing SSL certificate'
    }

    // 2. Check response time and basic connectivity
    const responseCheck = await checkResponseTime(domain)
    analysis.responseTimeMs = responseCheck.responseTime
    analysis.serverLocation = responseCheck.location || ''
    
    if (responseCheck.responseTime < 1000) {
      analysis.trustScore += 5
    } else if (responseCheck.responseTime > 5000) {
      analysis.trustScore -= 10
      analysis.riskFactors.slow = 'Slow response time'
    }

    // 3. Check Google Safe Browsing (if API key available)
    if (GOOGLE_SAFE_BROWSING_API_KEY) {
      const safeBrowsingCheck = await checkGoogleSafeBrowsing(domain)
      if (safeBrowsingCheck.malicious) {
        analysis.isBlacklisted = true
        analysis.blacklistSources.push('Google Safe Browsing')
        analysis.trustScore -= 50
        analysis.threatLevel = 'high'
        analysis.riskFactors.safeBrowsing = safeBrowsingCheck.threats
      }
    }

    // 4. Check VirusTotal (if API key available)
    if (VIRUSTOTAL_API_KEY) {
      const virusTotalCheck = await checkVirusTotal(domain)
      if (virusTotalCheck.malicious) {
        analysis.isBlacklisted = true
        analysis.blacklistSources.push('VirusTotal')
        analysis.trustScore -= 30
        if (analysis.threatLevel === 'low') analysis.threatLevel = 'medium'
        analysis.riskFactors.virusTotal = virusTotalCheck.threats
      }
    }

    // 5. Check PhishTank (free API)
    const phishTankCheck = await checkPhishTank(domain)
    if (phishTankCheck.phishing) {
      analysis.isBlacklisted = true
      analysis.blacklistSources.push('PhishTank')
      analysis.trustScore -= 40
      analysis.threatLevel = 'high'
      analysis.riskFactors.phishTank = 'Phishing site detected'
    }

    // 6. Basic domain age estimation (simplified)
    const domainAgeCheck = await estimateDomainAge(domain)
    analysis.domainAgeDays = domainAgeCheck.ageDays
    if (domainAgeCheck.ageDays > 365) {
      analysis.trustScore += 15
    } else if (domainAgeCheck.ageDays < 30) {
      analysis.trustScore -= 10
      analysis.riskFactors.newDomain = 'Domain is very new'
    }

    // 7. Check for suspicious patterns
    const suspiciousPatterns = checkSuspiciousPatterns(domain)
    if (suspiciousPatterns.length > 0) {
      analysis.trustScore -= suspiciousPatterns.length * 5
      analysis.riskFactors.patterns = suspiciousPatterns
    }

    // Ensure trust score is between 0 and 100
    analysis.trustScore = Math.max(0, Math.min(100, analysis.trustScore))

    // Update threat level based on final score
    if (analysis.trustScore < 20) {
      analysis.threatLevel = 'critical'
    } else if (analysis.trustScore < 40) {
      analysis.threatLevel = 'high'
    } else if (analysis.trustScore < 60) {
      analysis.threatLevel = 'medium'
    } else {
      analysis.threatLevel = 'low'
    }

    analysis.responseTimeMs = Date.now() - startTime

  } catch (error) {
    console.error('Error during domain analysis:', error)
    analysis.riskFactors.error = 'Analysis failed'
  }

  return analysis
}

async function checkSSL(domain: string) {
  try {
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    return { valid: response.ok }
  } catch {
    return { valid: false }
  }
}

async function checkResponseTime(domain: string) {
  const startTime = Date.now()
  try {
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000)
    })
    const responseTime = Date.now() - startTime
    
    // Try to get location from headers
    const location = response.headers.get('cf-ray') ? 'Cloudflare' : 
                    response.headers.get('server') || 'Unknown'
    
    return { responseTime, location }
  } catch {
    return { responseTime: 10000, location: 'Unknown' }
  }
}

async function checkGoogleSafeBrowsing(domain: string) {
  if (!GOOGLE_SAFE_BROWSING_API_KEY) {
    return { malicious: false, threats: [] }
  }

  try {
    const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'verifyfirst-scam-shield', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: `https://${domain}` }]
        }
      })
    })

    const data = await response.json()
    return {
      malicious: data.matches && data.matches.length > 0,
      threats: data.matches || []
    }
  } catch (error) {
    console.error('Google Safe Browsing check failed:', error)
    return { malicious: false, threats: [] }
  }
}

async function checkVirusTotal(domain: string) {
  if (!VIRUSTOTAL_API_KEY) {
    return { malicious: false, threats: [] }
  }

  try {
    const response = await fetch(`https://www.virustotal.com/vtapi/v2/url/report?apikey=${VIRUSTOTAL_API_KEY}&resource=${domain}`)
    const data = await response.json()
    
    return {
      malicious: data.positives > 0,
      threats: data.scans || {}
    }
  } catch (error) {
    console.error('VirusTotal check failed:', error)
    return { malicious: false, threats: [] }
  }
}

async function checkPhishTank(domain: string) {
  try {
    const response = await fetch(`${PHISHTANK_API_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `url=https://${domain}&format=json`
    })
    
    const data = await response.json()
    return {
      phishing: data.in_database === true,
      verified: data.verified === true
    }
  } catch (error) {
    console.error('PhishTank check failed:', error)
    return { phishing: false, verified: false }
  }
}

async function estimateDomainAge(domain: string) {
  // Use a free WHOIS API for a more accurate estimation.
  try {
    const response = await fetch(`https://whois.toolforge.org/${domain}?format=json`);
    if (!response.ok) {
        console.error(`WHOIS lookup failed with status: ${response.status}`);
        // Fallback for failed lookups: assume neutral age.
        return { ageDays: 365 }; 
    }
    const data = await response.json();
    const creationDateStr = data?.whois?.['created']?.[0];

    if (creationDateStr) {
      const creationDate = new Date(creationDateStr);
      const ageMillis = Date.now() - creationDate.getTime();
      const ageDays = Math.floor(ageMillis / (1000 * 60 * 60 * 24));
      return { ageDays };
    }
  } catch (error) {
    console.error('WHOIS lookup failed:', error);
  }
  // Fallback if API fails or data is missing
  return { ageDays: 365 }; // Return a neutral age to avoid penalizing unfairly
}

function checkSuspiciousPatterns(domain: string) {
  const patterns = []
  
  // Check for suspicious keywords
  const suspiciousKeywords = ['secure', 'login', 'bank', 'paypal', 'amazon', 'google', 'facebook']
  const domainLower = domain.toLowerCase()
  
  for (const keyword of suspiciousKeywords) {
    if (domainLower.includes(keyword) && !domainLower.includes(`.${keyword}.`)) {
      patterns.push(`Contains suspicious keyword: ${keyword}`)
    }
  }
  
  // Check for numbers in domain (often suspicious)
  if (/\d{3,}/.test(domain)) {
    patterns.push('Contains many numbers')
  }
  
  // Check for very long domain names
  if (domain.length > 30) {
    patterns.push('Very long domain name')
  }
  
  return patterns
}

function extractDomainFromUrl(url: string): string | null {
  try {
    // Remove protocol
    url = url.replace(/^https?:\/\//, '')
    // Remove path, query, and fragment
    url = url.split('/')[0]
    // Remove port if present
    url = url.split(':')[0]
    // Convert to lowercase
    return url.toLowerCase()
  } catch {
    return null
  }
} 