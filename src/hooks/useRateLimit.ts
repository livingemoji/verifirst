import { useState, useCallback, useRef } from 'react';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAttempts: number;
  baseDelay: number;
}

export interface RateLimitState {
  isLimited: boolean;
  remainingRequests: number;
  resetTime: number;
  retryAfter: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  retryAttempts: 3,
  baseDelay: 1000 // 1 second
};

export const useRateLimit = (config: Partial<RateLimitConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isLimited: false,
    remainingRequests: finalConfig.maxRequests,
    resetTime: Date.now() + finalConfig.windowMs,
    retryAfter: 0
  });
  
  const requestCount = useRef(0);
  const lastRequestTime = useRef(0);
  const retryCount = useRef(0);

  const calculateDelay = useCallback((attempt: number): number => {
    return finalConfig.baseDelay * Math.pow(2, attempt); // Exponential backoff
  }, [finalConfig.baseDelay]);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    // Reset window if expired
    if (now > rateLimitState.resetTime) {
      setRateLimitState({
        isLimited: false,
        remainingRequests: finalConfig.maxRequests,
        resetTime: now + finalConfig.windowMs,
        retryAfter: 0
      });
      requestCount.current = 0;
      retryCount.current = 0;
      return true;
    }

    // Check if we're within rate limits
    if (requestCount.current >= finalConfig.maxRequests) {
      setRateLimitState(prev => ({
        ...prev,
        isLimited: true,
        remainingRequests: 0,
        retryAfter: rateLimitState.resetTime - now
      }));
      return false;
    }

    return true;
  }, [finalConfig.maxRequests, rateLimitState.resetTime]);

  const makeRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    options?: {
      onRateLimit?: (retryAfter: number) => void;
      onRetry?: (attempt: number, delay: number) => void;
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= finalConfig.retryAttempts; attempt++) {
      try {
        // Check rate limit before making request
        if (!checkRateLimit()) {
          const retryAfter = rateLimitState.retryAfter;
          options?.onRateLimit?.(retryAfter);
          throw new Error(`Rate limit exceeded. Retry after ${Math.ceil(retryAfter / 1000)} seconds.`);
        }

        // Add delay between requests to prevent overwhelming the server
        const timeSinceLastRequest = Date.now() - lastRequestTime.current;
        const minDelay = 100; // 100ms minimum delay between requests
        if (timeSinceLastRequest < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
        }

        // Make the request
        const result = await requestFn();
        
        // Update rate limit state on success
        requestCount.current++;
        lastRequestTime.current = Date.now();
        
        setRateLimitState(prev => ({
          ...prev,
          remainingRequests: Math.max(0, finalConfig.maxRequests - requestCount.current)
        }));

        retryCount.current = 0;
        options?.onSuccess?.(result);
        return result;

      } catch (error) {
        lastError = error as Error;
        
        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes('Rate limit')) {
          const retryAfter = rateLimitState.retryAfter;
          options?.onRateLimit?.(retryAfter);
          
          // Wait for the rate limit window to reset
          if (retryAfter > 0) {
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            continue;
          }
        }

        // If we have retries left, wait and try again
        if (attempt < finalConfig.retryAttempts) {
          const delay = calculateDelay(attempt);
          retryCount.current = attempt + 1;
          
          options?.onRetry?.(attempt + 1, delay);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // No more retries, throw the error
        options?.onError?.(lastError);
        throw lastError;
      }
    }

    throw lastError!;
  }, [finalConfig, checkRateLimit, rateLimitState.retryAfter, calculateDelay]);

  const resetRateLimit = useCallback(() => {
    setRateLimitState({
      isLimited: false,
      remainingRequests: finalConfig.maxRequests,
      resetTime: Date.now() + finalConfig.windowMs,
      retryAfter: 0
    });
    requestCount.current = 0;
    retryCount.current = 0;
  }, [finalConfig.maxRequests, finalConfig.windowMs]);

  const getRateLimitInfo = useCallback(() => ({
    ...rateLimitState,
    currentRequests: requestCount.current,
    retryCount: retryCount.current,
    timeUntilReset: Math.max(0, rateLimitState.resetTime - Date.now())
  }), [rateLimitState]);

  return {
    makeRequest,
    checkRateLimit,
    resetRateLimit,
    getRateLimitInfo,
    rateLimitState
  };
}; 