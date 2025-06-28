import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_REQUESTS = 200; // requests per hour per IP/user
const RATE_LIMIT_WINDOW = 60; // minutes
const CACHE_TTL_HOURS = 24;
const MAX_CONTENT_LENGTH = 10000;
const MAX_BATCH_SIZE = 20;
const CONCURRENCY_LIMIT = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { batch } = await req.json();
    if (!Array.isArray(batch) || batch.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Batch array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (batch.length > MAX_BATCH_SIZE) {
      return new Response(
        JSON.stringify({ error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    let userId = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      } catch (error) {
        console.log('Authentication failed, proceeding with rate limiting by IP');
      }
    }

    // Check rate limit for the whole batch
    const { data: rateLimitResult, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_ip_address: clientIP,
      p_user_id: userId,
      p_endpoint: 'batch-analyze',
      p_max_requests: RATE_LIMIT_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW
    });
    if (rateLimitError || !rateLimitResult) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper: Analyze a single item (with cache)
    async function analyzeItem(item) {
      const { content, category } = item;
      if (!content || typeof content !== 'string' || content.length > MAX_CONTENT_LENGTH) {
        return { error: 'Invalid or too long content' };
      }
      // Hash for cache
      const encoder = new TextEncoder();
      const data = encoder.encode(content.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      // Check cache
      const { data: cached } = await supabase
        .from('analysis_cache')
        .select('result, created_at')
        .eq('content_hash', contentHash)
        .gte('created_at', new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString())
        .single();
      if (cached) {
        await supabase.rpc('record_performance_metric', {
          p_metric_name: 'batch_cache_hit',
          p_metric_value: 1,
          p_tags: { endpoint: 'batch-analyze', category: category || 'unknown' }
        });
        return { ...cached.result, cached: true };
      }
      await supabase.rpc('record_performance_metric', {
        p_metric_name: 'batch_cache_miss',
        p_metric_value: 1,
        p_tags: { endpoint: 'batch-analyze', category: category || 'unknown' }
      });
      // Analyze with AI
      const analysis = await analyzeWithAI(content, category);
      // Cache result
      await supabase
        .from('analysis_cache')
        .insert({
          content_hash: contentHash,
          result: analysis,
          created_at: new Date().toISOString()
        })
        .onConflict('content_hash')
        .merge();
      return { ...analysis, cached: false };
    }

    // Helper: Run with concurrency limit
    async function runBatchWithLimit(items, fn, limit) {
      const results = [];
      let i = 0;
      async function next() {
        if (i >= items.length) return;
        const idx = i++;
        results[idx] = await fn(items[idx]);
        await next();
      }
      const runners = [];
      for (let j = 0; j < Math.min(limit, items.length); j++) {
        runners.push(next());
      }
      await Promise.all(runners);
      return results;
    }

    // Analyze all items in batch
    const results = await runBatchWithLimit(batch, analyzeItem, CONCURRENCY_LIMIT);

    // Record batch metric
    await supabase.rpc('record_performance_metric', {
      p_metric_name: 'batch_analysis',
      p_metric_value: batch.length,
      p_tags: { endpoint: 'batch-analyze', user_id: userId || 'anon' }
    });

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Batch analyze error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: AI analysis (same as analyze-scam)
async function analyzeWithAI(content, category) {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) {
    return generateMockAnalysis(content, category);
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
    });
    if (!response.ok) {
      throw new Error('OpenRouter API request failed');
    }
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    try {
      return JSON.parse(aiResponse);
    } catch {
      return {
        isSafe: !aiResponse.toLowerCase().includes('scam'),
        confidence: 75,
        threats: aiResponse.toLowerCase().includes('scam') ? ['Potential Scam'] : [],
        analysis: aiResponse
      };
    }
  } catch (error) {
    console.error('AI analysis failed:', error);
    return generateMockAnalysis(content, category);
  }
}

function generateMockAnalysis(content, category) {
  const lowerContent = content.toLowerCase();
  const suspiciousKeywords = [
    'urgent', 'verify account', 'click here', 'suspended', 'limited time',
    'congratulations', 'winner', 'prize', 'bitcoin', 'cryptocurrency',
    'investment opportunity', 'guaranteed returns', 'act now', 'mpesa',
    'mobile money', 'loan', 'quick cash', 'instant money'
  ];
  const foundKeywords = suspiciousKeywords.filter(keyword => lowerContent.includes(keyword));
  const isSafe = foundKeywords.length === 0;
  const confidence = isSafe ? Math.floor(Math.random() * 20) + 70 : Math.floor(Math.random() * 30) + 70;
  return {
    isSafe,
    confidence,
    threats: foundKeywords.length > 0 ? ['Suspicious Keywords', 'Potential Phishing'] : [],
    analysis: isSafe ? 'Content appears legitimate with no obvious red flags detected.' : `Suspicious content detected. Found concerning keywords: ${foundKeywords.join(', ')}`
  };
} 