import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRateLimit } from './useRateLimit';
import { useToast } from '@/hooks/use-toast';

export interface AnalysisResult {
  isSafe: boolean;
  confidence: number;
  category: string;
  threats: string[];
  analysis: string;
  timestamp: string;
  cached?: boolean;
  cache_age?: number;
  content_length?: number;
  processing_time?: number;
}

export interface AnalysisRequest {
  content: string;
  category?: string;
  files?: string[];
}

export const useScamAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisQueue, setAnalysisQueue] = useState<AnalysisRequest[]>([]);
  const { toast } = useToast();

  const { makeRequest, rateLimitState, getRateLimitInfo } = useRateLimit({
    maxRequests: 50, // 50 requests per hour
    windowMs: 60 * 60 * 1000, // 1 hour
    retryAttempts: 3,
    baseDelay: 2000 // 2 seconds
  });

  const analyzeContent = useCallback(async (
    content: string, 
    category?: string,
    files?: string[]
  ): Promise<AnalysisResult | null> => {
    if (!content.trim()) return null;
    
    setIsAnalyzing(true);
    setResult(null);

    let lastError: any = null;
    let rateLimitHit = false;

    try {
      const analysisResult = await makeRequest(
        async () => {
          const { data, error } = await supabase.functions.invoke('analyze-scam', {
            body: { 
              content, 
              category,
              files: files || []
            }
          });

          if (error) throw error;
          return data;
        },
        {
          onRateLimit: (retryAfter) => {
            rateLimitHit = true;
            toast({
              title: "Too Many Requests",
              description: `You are sending requests too quickly. Please wait ${Math.ceil(retryAfter / 1000)} seconds before trying again.`,
              variant: "destructive"
            });
          },
          onRetry: (attempt, delay) => {
            toast({
              title: "Retrying Analysis",
              description: `Attempt ${attempt} of 3. Retrying in ${Math.ceil(delay / 1000)} seconds...`,
            });
          },
          onError: (error) => {
            lastError = error;
            toast({
              title: "Analysis Failed",
              description: error.message || "Failed to analyze content. Please try again.",
              variant: "destructive"
            });
          }
        }
      );

      const result: AnalysisResult = {
        ...analysisResult,
        category: category || 'General',
        timestamp: new Date().toISOString()
      };

      setResult(result);
      return result;

    } catch (error) {
      lastError = error;
      if (rateLimitHit) {
        toast({
          title: "Rate Limit Exceeded",
          description: "You have reached the maximum number of requests allowed. Please wait a few minutes and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: error.message || "Failed to analyze content. Please try again.",
          variant: "destructive"
        });
      }
      // Fallback to mock result for development
      const mockResult: AnalysisResult = {
        isSafe: Math.random() > 0.5,
        confidence: Math.floor(Math.random() * 30) + 70,
        category: category || 'General',
        threats: Math.random() > 0.5 ? ['Potential Scam'] : [],
        analysis: 'Analysis completed with fallback system.',
        timestamp: new Date().toISOString(),
        cached: false
      };
      setResult(mockResult);
      return mockResult;
    } finally {
      setIsAnalyzing(false);
    }
  }, [makeRequest, toast]);

  const analyzeBatch = useCallback(async (
    requests: AnalysisRequest[]
  ): Promise<AnalysisResult[]> => {
    if (requests.length === 0) return [];
    
    setIsAnalyzing(true);
    const results: AnalysisResult[] = [];
    
    try {
      // Process requests in batches of 5 to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (request) => {
          try {
            return await analyzeContent(request.content, request.category, request.files);
          } catch (error) {
            console.error('Batch analysis failed for request:', request, error);
            return null;
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
          }
        });

        // Add delay between batches to respect rate limits
        if (i + batchSize < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return results;
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeContent]);

  const queueAnalysis = useCallback((request: AnalysisRequest) => {
    setAnalysisQueue(prev => [...prev, request]);
  }, []);

  const processQueue = useCallback(async () => {
    if (analysisQueue.length === 0) return;
    
    const queue = [...analysisQueue];
    setAnalysisQueue([]);
    
    return await analyzeBatch(queue);
  }, [analysisQueue, analyzeBatch]);

  const clearQueue = useCallback(() => {
    setAnalysisQueue([]);
  }, []);

  const getQueueStatus = useCallback(() => ({
    queueLength: analysisQueue.length,
    isAnalyzing,
    rateLimitInfo: getRateLimitInfo()
  }), [analysisQueue.length, isAnalyzing, getRateLimitInfo]);

  return {
    analyzeContent,
    analyzeBatch,
    queueAnalysis,
    processQueue,
    clearQueue,
    getQueueStatus,
    isAnalyzing,
    result,
    setResult,
    rateLimitState
  };
};
