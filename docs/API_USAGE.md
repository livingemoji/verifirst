# API Usage Guide - High Volume Optimizations

This guide covers the new batch processing and high-volume optimization features for the VerifyFirst Scam Shield API.

## Table of Contents

1. [Batch Analysis API](#batch-analysis-api)
2. [File Upload API](#file-upload-api)
3. [Rate Limiting](#rate-limiting)
4. [Performance Monitoring](#performance-monitoring)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

## Batch Analysis API

### Endpoint
```
POST /functions/v1/batch-analyze
```

### Request Format
```json
{
  "batch": [
    {
      "content": "Suspicious email content here...",
      "category": "phishing"
    },
    {
      "content": "Another suspicious message...",
      "category": "crypto"
    }
  ]
}
```

### Response Format
```json
{
  "results": [
    {
      "isSafe": false,
      "confidence": 85,
      "threats": ["Phishing", "Suspicious Links"],
      "analysis": "This appears to be a phishing attempt...",
      "cached": false
    },
    {
      "isSafe": true,
      "confidence": 92,
      "threats": [],
      "analysis": "Content appears legitimate...",
      "cached": true,
      "cache_age": 3600
    }
  ]
}
```

### Limits
- **Maximum batch size**: 20 items
- **Maximum content length**: 10,000 characters per item
- **Rate limit**: 200 requests per hour per IP/user
- **Concurrency**: 5 parallel analyses

### Example Usage

#### JavaScript/TypeScript
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

async function analyzeBatch(contents: string[], categories?: string[]) {
  const batch = contents.map((content, index) => ({
    content,
    category: categories?.[index] || 'general'
  }));

  const { data, error } = await supabase.functions.invoke('batch-analyze', {
    body: { batch }
  });

  if (error) {
    console.error('Batch analysis failed:', error);
    return null;
  }

  return data.results;
}

// Usage
const contents = [
  "URGENT: Your account has been suspended. Click here to verify...",
  "Congratulations! You've won $1,000,000. Send your details...",
  "Investment opportunity: Guaranteed 500% returns in 24 hours..."
];

const results = await analyzeBatch(contents, ['phishing', 'scam', 'investment']);
```

#### Python
```python
import requests
import json

def analyze_batch(contents, categories=None):
    url = "https://your-project.supabase.co/functions/v1/batch-analyze"
    headers = {
        "Authorization": "Bearer YOUR_ANON_KEY",
        "Content-Type": "application/json"
    }
    
    batch = [
        {"content": content, "category": categories[i] if categories else "general"}
        for i, content in enumerate(contents)
    ]
    
    response = requests.post(url, headers=headers, json={"batch": batch})
    
    if response.status_code == 200:
        return response.json()["results"]
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

# Usage
contents = [
    "URGENT: Your account has been suspended. Click here to verify...",
    "Congratulations! You've won $1,000,000. Send your details..."
]

results = analyze_batch(contents, ["phishing", "scam"])
```

## File Upload API

### Chunked Upload Process

1. **Initialize Upload**
```typescript
const fileId = crypto.randomUUID();
const chunkSize = 5 * 1024 * 1024; // 5MB chunks
const chunks = Math.ceil(file.size / chunkSize);
```

2. **Upload Chunks**
```typescript
for (let i = 0; i < chunks; i++) {
  const start = i * chunkSize;
  const end = Math.min(start + chunkSize, file.size);
  const chunk = file.slice(start, end);
  
  const { error } = await supabase.storage
    .from('scam-shield-files')
    .upload(`${fileId}/chunk-${i}`, chunk);
    
  if (error) {
    // Handle retry logic
    await retryUpload(chunk, i, fileId);
  }
}
```

3. **Combine Chunks**
```typescript
const { data, error } = await supabase.storage
  .from('scam-shield-files')
  .upload(`${fileId}/${file.name}`, file, { upsert: true });
```

### File Upload Limits
- **Maximum file size**: 50MB per file
- **Supported formats**: Images, audio, video, PDF, DOC, DOCX, TXT
- **Concurrent uploads**: 3 files at once
- **Retry attempts**: 3 per chunk

## Rate Limiting

### Client-Side Rate Limiting
```typescript
import { useRateLimit } from '@/hooks/useRateLimit';

const { makeRequest, rateLimitState } = useRateLimit({
  maxRequests: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  retryAttempts: 3,
  baseDelay: 2000 // 2 seconds
});

const result = await makeRequest(
  async () => {
    return await supabase.functions.invoke('analyze-scam', {
      body: { content, category }
    });
  },
  {
    onRateLimit: (retryAfter) => {
      console.log(`Rate limited. Retry after ${retryAfter}ms`);
    },
    onRetry: (attempt, delay) => {
      console.log(`Retrying in ${delay}ms (attempt ${attempt})`);
    }
  }
);
```

### Server-Side Rate Limiting
The API automatically enforces rate limits:
- **Per IP**: 100 requests per hour
- **Per User**: 200 requests per hour (when authenticated)
- **Per Endpoint**: Separate limits for different endpoints

## Performance Monitoring

### Metrics Available
- **Cache hit rate**: Percentage of requests served from cache
- **Average response time**: Mean API response time
- **Error rate**: Percentage of failed requests
- **Requests per minute**: Current request volume
- **Active uploads**: Number of ongoing file uploads
- **Queue length**: Number of items in processing queue

### Accessing Metrics
```typescript
// Query performance metrics
const { data: metrics } = await supabase
  .from('performance_metrics')
  .select('*')
  .gte('recorded_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
  .order('recorded_at', { ascending: false });

// Record custom metrics
await supabase.rpc('record_performance_metric', {
  p_metric_name: 'custom_metric',
  p_metric_value: 42,
  p_tags: { endpoint: 'my-endpoint', user_id: 'user123' }
});
```

## Error Handling

### Common Error Responses

#### Rate Limit Exceeded (429)
```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "retry_after": 3600
}
```

#### Invalid Request (400)
```json
{
  "error": "Content is required"
}
```

#### Batch Size Exceeded (400)
```json
{
  "error": "Batch size exceeds maximum of 20"
}
```

#### Server Error (500)
```json
{
  "error": "Internal server error"
}
```

### Error Handling Example
```typescript
async function robustAnalysis(content: string) {
  try {
    const result = await makeRequest(
      async () => {
        const { data, error } = await supabase.functions.invoke('analyze-scam', {
          body: { content }
        });
        
        if (error) throw error;
        return data;
      },
      {
        onRateLimit: (retryAfter) => {
          // Show user-friendly message
          showNotification(`Please wait ${Math.ceil(retryAfter / 1000)} seconds before trying again.`);
        },
        onError: (error) => {
          // Log error and show fallback
          console.error('Analysis failed:', error);
          showFallbackAnalysis();
        }
      }
    );
    
    return result;
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
    return getDefaultResult();
  }
}
```

## Best Practices

### 1. Batch Processing
- **Group related requests**: Analyze similar content types together
- **Respect limits**: Don't exceed batch size or rate limits
- **Handle failures gracefully**: Some items in a batch may fail

### 2. File Uploads
- **Use chunked uploads**: For files larger than 5MB
- **Implement retry logic**: Network issues can cause chunk failures
- **Show progress**: Users appreciate upload progress indicators

### 3. Rate Limiting
- **Implement exponential backoff**: Increase delay between retries
- **Cache results**: Avoid re-analyzing the same content
- **Queue requests**: For high-volume scenarios

### 4. Performance
- **Monitor metrics**: Track API performance and usage
- **Optimize requests**: Minimize payload size and unnecessary calls
- **Use caching**: Leverage the built-in cache system

### 5. Error Handling
- **Graceful degradation**: Provide fallback options when API fails
- **User feedback**: Inform users about rate limits and retry times
- **Logging**: Track errors for debugging and monitoring

## Example Integration

### React Component with Batch Processing
```typescript
import React, { useState } from 'react';
import { useScamAnalysis } from '@/hooks/useScamAnalysis';
import { useFileUpload } from '@/hooks/useFileUpload';

const BatchAnalyzer: React.FC = () => {
  const [contents, setContents] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { analyzeBatch } = useScamAnalysis();
  const { uploadFiles } = useFileUpload();

  const handleBatchAnalysis = async () => {
    setIsProcessing(true);
    
    try {
      // Process in batches of 10
      const batchSize = 10;
      const allResults = [];
      
      for (let i = 0; i < contents.length; i += batchSize) {
        const batch = contents.slice(i, i + batchSize);
        const batchResults = await analyzeBatch(batch);
        allResults.push(...batchResults);
        
        // Add delay between batches
        if (i + batchSize < contents.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setResults(allResults);
    } catch (error) {
      console.error('Batch analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* UI for batch input and processing */}
    </div>
  );
};
```

This comprehensive API guide should help you implement high-volume processing in your applications while respecting rate limits and following best practices. 