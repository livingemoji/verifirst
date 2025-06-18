
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, icon) VALUES
  ('phishing', '🎣'),
  ('crypto', '₿'),
  ('employment', '💼'),
  ('romance', '💕'),
  ('tech-support', '🔧'),
  ('investment', '📈'),
  ('shopping', '🛒'),
  ('social-media', '📱'),
  ('government', '🏛️'),
  ('other', '❓');

-- Create scam_reports table
CREATE TABLE scam_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  is_safe BOOLEAN NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  threats TEXT[] DEFAULT '{}',
  analysis TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table for user feedback
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES scam_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

-- Create analysis_cache table to avoid duplicate API calls
CREATE TABLE analysis_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_hash VARCHAR(64) NOT NULL UNIQUE,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_scam_reports_created_at ON scam_reports(created_at DESC);
CREATE INDEX idx_scam_reports_category ON scam_reports(category_id);
CREATE INDEX idx_analysis_cache_hash ON analysis_cache(content_hash);
CREATE INDEX idx_votes_report_id ON votes(report_id);

-- Enable Row Level Security
ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read scam reports" ON scam_reports FOR SELECT USING (true);
CREATE POLICY "Users can create scam reports" ON scam_reports FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can vote" ON votes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read analysis cache" ON analysis_cache FOR SELECT USING (true);
CREATE POLICY "Service can manage analysis cache" ON analysis_cache FOR ALL USING (true);
