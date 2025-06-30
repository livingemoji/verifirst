import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Send, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useScamSubmission } from '@/hooks/useScamSubmission';
import { useScamAnalysis } from '@/hooks/useScamAnalysis';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CredibilityScore } from '@/components/ui/credibility-score';
import { CategorySelector } from './CategorySelector';

interface ScamSubmissionFormProps {
  onSubmissionSuccess?: () => void;
}

const ScamSubmissionForm: React.FC<ScamSubmissionFormProps> = ({ onSubmissionSuccess }) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [credibilityScore, setCredibilityScore] = useState(50);
  const { toast } = useToast();
  const { submitScam, isSubmitting } = useScamSubmission();
  const { analyzeContent, result, isAnalyzing } = useScamAnalysis();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const submission = {
      content,
      category,
      credibilityScore,
      isScam: credibilityScore > 50
    };

    await submitScam(submission);
    setContent('');
    setCategory('');
    setCredibilityScore(50);
  };

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    const result = await analyzeContent(content, category);
    if (result) {
      setCredibilityScore(result.confidence);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            Report a New Scam in Kenya
          </CardTitle>
          <p className="text-slate-300">
            Help protect fellow Kenyans by reporting scams that aren't in our database yet.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Textarea
                placeholder="Paste the suspicious content, URL, or message here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px]"
              />
              
              <div className="flex gap-4">
                <CategorySelector
                  value={category}
                  onChange={setCategory}
                />
                <Button 
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!content.trim() || isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                </Button>
            </div>

              {result && (
                <Card className="p-4 space-y-4">
                  {result.source === 'database' ? (
                    <>
                      <Alert>
                        <AlertDescription>
                          {result.message}
                        </AlertDescription>
                      </Alert>
                      <CredibilityScore 
                        value={result.confidence} 
                        readonly 
                      />
                    </>
                  ) : (
                    <>
                      <Alert>
                        <AlertDescription>
                          {result.message}
                          {result.submit_prompt && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {result.submit_prompt}
                            </p>
                          )}
                        </AlertDescription>
                      </Alert>
                      <CredibilityScore 
                        value={credibilityScore}
                        onChange={setCredibilityScore}
                      />
              <Button
                type="submit"
                        className="w-full"
                disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                      </Button>
                    </>
                  )}
                </Card>
              )}

              {!result && (
                <CredibilityScore 
                  value={credibilityScore}
                  onChange={setCredibilityScore}
                />
              )}

              {!result && (
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={!content.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              )}
                  </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScamSubmissionForm;
