import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScamSubmission {
  content: string;
  category?: string;
  credibilityScore: number;
  isScam: boolean;
}

export const useScamSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitScam = async (submission: ScamSubmission) => {
    setIsSubmitting(true);

    try {
      // Submit to user_submitted_scams table
      const { error } = await supabase
        .from('user_submitted_scams')
        .insert({
          content: submission.content,
          category: submission.category || 'unknown',
          confidence: submission.credibilityScore,
          is_scam: submission.isScam,
          status: 'pending' // Requires moderation before being publicly visible
        });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thank you! Your report will help protect others from scams.",
      });

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your report. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitScam,
    isSubmitting
  };
};
