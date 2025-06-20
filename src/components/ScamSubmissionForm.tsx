
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

interface ScamSubmissionFormProps {
  onSubmissionSuccess?: () => void;
}

const ScamSubmissionForm: React.FC<ScamSubmissionFormProps> = ({ onSubmissionSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    contact: ''
  });
  
  const { toast } = useToast();
  const { submitScamReport, isSubmitting } = useScamSubmission();

  const categories = [
    { value: 'phishing', label: 'Phishing' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'employment', label: 'Employment' },
    { value: 'romance', label: 'Romance' },
    { value: 'tech-support', label: 'Tech Support' },
    { value: 'investment', label: 'Investment' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'social-media', label: 'Social Media' },
    { value: 'government', label: 'Government' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      await submitScamReport(formData);
      
      toast({
        title: "Report Submitted",
        description: "Thank you for reporting this scam. It will help protect others.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        location: '',
        contact: ''
      });

      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your report. Please try again.",
        variant: "destructive"
      });
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
            Report a New Scam
          </CardTitle>
          <p className="text-slate-300">
            Help protect others by reporting scams that aren't in our database yet.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-300">
                Scam Title *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Brief title describing the scam"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the scam, including how it works and any warning signs..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="min-h-32 bg-slate-900/50 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-slate-300">
                Category *
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white focus:border-purple-500">
                  <SelectValue placeholder="Select scam category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value} className="text-white hover:bg-slate-700">
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-slate-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location (Optional)
              </Label>
              <Input
                id="location"
                type="text"
                placeholder="City, State, Country where this scam was encountered"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact" className="text-slate-300">
                Contact Information (Optional)
              </Label>
              <Input
                id="contact"
                type="text"
                placeholder="Phone number, email, or website used by scammers"
                value={formData.contact}
                onChange={(e) => handleInputChange('contact', e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500"
              />
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 text-lg font-medium transition-all duration-200"
              >
                {isSubmitting ? (
                  <motion.div
                    className="flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </motion.div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="h-5 w-5" />
                    <span>Submit Report</span>
                  </div>
                )}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScamSubmissionForm;
