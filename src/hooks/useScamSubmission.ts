
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ScamSubmissionData {
  title: string;
  description: string;
  category: string;
  location?: string;
  contact?: string;
}

export const useScamSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitScamReport = async (data: ScamSubmissionData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('submit-scam-report', {
        body: data
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Scam submission failed:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitScamReport,
    isSubmitting
  };
};
