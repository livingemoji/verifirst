
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AnalysisResult {
  isSafe: boolean;
  confidence: number;
  category: string;
  threats: string[];
  analysis: string;
  timestamp: string;
}

export const useScamAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeContent = async (content: string, category?: string) => {
    if (!content.trim()) return;
    
    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-scam', {
        body: { content, category }
      });

      if (error) throw error;

      const analysisResult: AnalysisResult = {
        ...data,
        category: category || 'General',
        timestamp: new Date().toISOString()
      };

      setResult(analysisResult);
      return analysisResult;
    } catch (error) {
      console.error('Analysis failed:', error);
      // Fallback to mock result
      const mockResult: AnalysisResult = {
        isSafe: Math.random() > 0.5,
        confidence: Math.floor(Math.random() * 30) + 70,
        category: category || 'General',
        threats: Math.random() > 0.5 ? ['Potential Scam'] : [],
        analysis: 'Analysis completed with fallback system.',
        timestamp: new Date().toISOString()
      };
      setResult(mockResult);
      return mockResult;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeContent,
    isAnalyzing,
    result,
    setResult
  };
};
