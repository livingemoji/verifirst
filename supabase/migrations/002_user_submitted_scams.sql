
-- Create user_submitted_scams table for community scam reports
CREATE TABLE user_submitted_scams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  location VARCHAR(255),
  contact_info VARCHAR(255),
  user_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_submitted_scams_status ON user_submitted_scams(status);
CREATE INDEX idx_user_submitted_scams_category ON user_submitted_scams(category_id);
CREATE INDEX idx_user_submitted_scams_created_at ON user_submitted_scams(created_at DESC);
CREATE INDEX idx_user_submitted_scams_location ON user_submitted_scams(location);

-- Enable Row Level Security
ALTER TABLE user_submitted_scams ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read approved scam reports" ON user_submitted_scams 
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can submit scam reports" ON user_submitted_scams 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own submissions" ON user_submitted_scams 
  FOR SELECT USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_submitted_scams_updated_at 
  BEFORE UPDATE ON user_submitted_scams 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
