
import React from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categories = [
  { value: 'phishing', label: 'Phishing', icon: '🎣' },
  { value: 'crypto', label: 'Cryptocurrency', icon: '₿' },
  { value: 'employment', label: 'Employment', icon: '💼' },
  { value: 'romance', label: 'Romance', icon: '💕' },
  { value: 'tech-support', label: 'Tech Support', icon: '🔧' },
  { value: 'investment', label: 'Investment', icon: '📈' },
  { value: 'shopping', label: 'Shopping', icon: '🛒' },
  { value: 'social-media', label: 'Social Media', icon: '📱' },
  { value: 'government', label: 'Government', icon: '🏛️' },
  { value: 'other', label: 'Other', icon: '❓' }
];

const CategorySelector = ({ value, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Scam Category (Optional)
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white focus:border-purple-500 focus:ring-purple-500/20">
          <SelectValue placeholder="Select category for better analysis" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {categories.map((category) => (
            <SelectItem
              key={category.value}
              value={category.value}
              className="text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              <div className="flex items-center space-x-2">
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategorySelector;
