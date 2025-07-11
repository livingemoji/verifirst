import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Send, AlertTriangle, UploadCloud, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useScamSubmission } from '@/hooks/useScamSubmission';
import { useScamAnalysis } from '@/hooks/useScamAnalysis';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CredibilityScore from '@/components/ui/credibility-score';
import CategorySelector from './CategorySelector';
import KenyaAuthorities from './KenyaAuthorities';

const ScamSubmissionForm = ({ onSubmissionSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [scammerContact, setScammerContact] = useState('');
  const [files, setFiles] = useState([]);
  const [credibilityScore, setCredibilityScore] = useState(50);
  const { toast } = useToast();
  const { submitScam, isSubmitting } = useScamSubmission();
  const { analyzeContent, result, isAnalyzing } = useScamAnalysis();

  // Drag-and-drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };
  const handleDragOver = (e) => e.preventDefault();

  const handleFileChange = (e) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  };
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !category.trim()) return;
    const submission = {
      title,
      content,
      category,
      location,
      scammerContact,
      credibilityScore,
      isScam: credibilityScore > 50,
      files
    };
    await submitScam(submission);
    setTitle('');
    setContent('');
    setCategory('');
    setLocation('');
    setScammerContact('');
    setFiles([]);
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
              <Label htmlFor="scam-title" className="text-white">Scam Title</Label>
              <Input
                id="scam-title"
                placeholder="e.g. Fake KPLC Customer Care"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white"
                required
              />
              <Label htmlFor="scam-content" className="text-white">Scam Description</Label>
              <Textarea
                id="scam-content"
                placeholder="Paste the suspicious content, URL, or message here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] bg-slate-900/50 border-slate-600 text-white"
                required
              />
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="category" className="text-white">Category</Label>
                  <CategorySelector value={category} onChange={setCategory} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="location" className="text-white">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Nairobi, Mombasa, Online"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="scammer-contact" className="text-white">Scammer Contact/Identifier</Label>
                  <Input
                    id="scammer-contact"
                    placeholder="e.g. 0712xxxxxx, scammer@gmail.com, scamwebsite.com"
                    value={scammerContact}
                    onChange={(e) => setScammerContact(e.target.value)}
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                </div>
              </div>
              {/* Drag-and-drop file uploader */}
              <div
                className="border-2 border-dashed border-slate-600 rounded-lg p-4 bg-slate-900/40 text-white text-center cursor-pointer hover:bg-slate-800/60 transition-all"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <UploadCloud className="mx-auto mb-2 h-8 w-8 text-blue-400" />
                <p className="mb-2">Drag & drop images/screenshots here, or click to select files</p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white cursor-pointer mt-2">Select Files</label>
                {files.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`upload-preview-${idx}`}
                          className="w-full h-24 object-cover rounded border border-slate-700"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs opacity-80 group-hover:opacity-100"
                          onClick={() => removeFile(idx)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-4 items-center">
                <CredibilityScore value={credibilityScore} onChange={setCredibilityScore} />
                <Button 
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!content.trim() || isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                </Button>
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={!title.trim() || !content.trim() || !category.trim() || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
          <KenyaAuthorities />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScamSubmissionForm;
