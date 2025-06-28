-- Domain Analysis and Trust Score Features
-- This migration adds domain reputation, trust scores, blacklist checks, and user reviews

-- 1. Add domain analysis table
CREATE TABLE domain_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain VARCHAR(255) NOT NULL,
  trust_score INTEGER CHECK (trust_score >= 0 AND trust_score <= 100),
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_sources TEXT[],
  domain_age_days INTEGER,
  ssl_valid BOOLEAN,
  registrar VARCHAR(255),
  country_code VARCHAR(10),
  server_location VARCHAR(255),
  response_time_ms INTEGER,
  threat_level VARCHAR(20) CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors JSONB DEFAULT '{}',
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add domain analysis history for trends
CREATE TABLE domain_analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain VARCHAR(255) NOT NULL,
  trust_score INTEGER CHECK (trust_score >= 0 AND trust_score <= 100),
  is_blacklisted BOOLEAN DEFAULT false,
  threat_level VARCHAR(20) CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  analysis_metadata JSONB DEFAULT '{}',
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add user reviews table
CREATE TABLE user_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain VARCHAR(255),
  scam_report_id UUID REFERENCES scam_reports(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_type VARCHAR(20) CHECK (review_type IN ('domain', 'scam_report')),
  is_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure either domain or scam_report_id is provided, but not both
  CONSTRAINT check_review_target CHECK (
    (domain IS NOT NULL AND scam_report_id IS NULL) OR 
    (domain IS NULL AND scam_report_id IS NOT NULL)
  )
);

-- 4. Add helpful votes for reviews
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES user_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- 5. Add indexes for performance
CREATE INDEX idx_domain_analysis_domain ON domain_analysis(domain);
CREATE INDEX idx_domain_analysis_trust_score ON domain_analysis(trust_score DESC);
CREATE INDEX idx_domain_analysis_blacklisted ON domain_analysis(is_blacklisted);
CREATE INDEX idx_domain_analysis_last_analyzed ON domain_analysis(last_analyzed DESC);

CREATE INDEX idx_domain_analysis_history_domain ON domain_analysis_history(domain);
CREATE INDEX idx_domain_analysis_history_analyzed_at ON domain_analysis_history(analyzed_at DESC);
CREATE INDEX idx_domain_analysis_history_domain_time ON domain_analysis_history(domain, analyzed_at DESC);

CREATE INDEX idx_user_reviews_domain ON user_reviews(domain);
CREATE INDEX idx_user_reviews_scam_report ON user_reviews(scam_report_id);
CREATE INDEX idx_user_reviews_user_id ON user_reviews(user_id);
CREATE INDEX idx_user_reviews_rating ON user_reviews(rating DESC);
CREATE INDEX idx_user_reviews_created_at ON user_reviews(created_at DESC);

CREATE INDEX idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX idx_review_votes_user_id ON review_votes(user_id);

-- 6. Add function to extract domain from URL
CREATE OR REPLACE FUNCTION extract_domain_from_url(url TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove protocol
  url := regexp_replace(url, '^https?://', '', 'i');
  -- Remove path, query, and fragment
  url := split_part(url, '/', 1);
  -- Remove port if present
  url := split_part(url, ':', 1);
  -- Convert to lowercase
  RETURN lower(url);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Add function to calculate domain trust score
CREATE OR REPLACE FUNCTION calculate_domain_trust_score(
  p_domain VARCHAR(255)
)
RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER := 50;
  age_bonus INTEGER := 0;
  ssl_bonus INTEGER := 0;
  blacklist_penalty INTEGER := 0;
  review_bonus INTEGER := 0;
  final_score INTEGER;
BEGIN
  -- Get domain analysis data
  SELECT 
    COALESCE(domain_age_days, 0),
    COALESCE(ssl_valid, false),
    COALESCE(is_blacklisted, false)
  INTO age_bonus, ssl_bonus, blacklist_penalty
  FROM domain_analysis 
  WHERE domain = p_domain;
  
  -- Calculate age bonus (max 20 points)
  IF age_bonus > 365 THEN
    age_bonus := 20;
  ELSIF age_bonus > 30 THEN
    age_bonus := 10;
  ELSE
    age_bonus := 0;
  END IF;
  
  -- SSL bonus (10 points)
  IF ssl_bonus THEN
    ssl_bonus := 10;
  END IF;
  
  -- Blacklist penalty (50 points)
  IF blacklist_penalty THEN
    blacklist_penalty := 50;
  END IF;
  
  -- Review bonus (max 10 points)
  SELECT COALESCE(AVG(rating) * 2, 0) INTO review_bonus
  FROM user_reviews 
  WHERE domain = p_domain AND review_type = 'domain';
  
  -- Calculate final score
  final_score := base_score + age_bonus + ssl_bonus - blacklist_penalty + review_bonus;
  
  -- Ensure score is between 0 and 100
  RETURN GREATEST(0, LEAST(100, final_score));
END;
$$ LANGUAGE plpgsql;

-- 8. Add function to update helpful count for reviews
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_reviews 
    SET is_helpful_count = (
      SELECT COUNT(*) 
      FROM review_votes 
      WHERE review_id = NEW.review_id AND is_helpful = true
    )
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_reviews 
    SET is_helpful_count = (
      SELECT COUNT(*) 
      FROM review_votes 
      WHERE review_id = OLD.review_id AND is_helpful = true
    )
    WHERE id = OLD.review_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for helpful count updates
CREATE TRIGGER trigger_update_review_helpful_count
  AFTER INSERT OR DELETE ON review_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- 10. Add function to get domain analysis with history
CREATE OR REPLACE FUNCTION get_domain_analysis_with_history(
  p_domain VARCHAR(255),
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  domain VARCHAR(255),
  current_trust_score INTEGER,
  current_blacklisted BOOLEAN,
  current_threat_level VARCHAR(20),
  historical_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.domain,
    da.trust_score,
    da.is_blacklisted,
    da.threat_level,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'date', dah.analyzed_at,
          'trust_score', dah.trust_score,
          'blacklisted', dah.is_blacklisted,
          'threat_level', dah.threat_level
        ) ORDER BY dah.analyzed_at DESC
      ) FILTER (WHERE dah.analyzed_at >= NOW() - (p_days_back || ' days')::INTERVAL),
      '[]'::jsonb
    ) as historical_data
  FROM domain_analysis da
  LEFT JOIN domain_analysis_history dah ON da.domain = dah.domain
  WHERE da.domain = p_domain
  GROUP BY da.domain, da.trust_score, da.is_blacklisted, da.threat_level;
END;
$$ LANGUAGE plpgsql;

-- 11. Enable Row Level Security
ALTER TABLE domain_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies
CREATE POLICY "Anyone can view domain analysis" ON domain_analysis
  FOR SELECT USING (true);

CREATE POLICY "Service can manage domain analysis" ON domain_analysis
  FOR ALL USING (true);

CREATE POLICY "Anyone can view domain analysis history" ON domain_analysis_history
  FOR SELECT USING (true);

CREATE POLICY "Service can manage domain analysis history" ON domain_analysis_history
  FOR ALL USING (true);

CREATE POLICY "Anyone can view user reviews" ON user_reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON user_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON user_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON user_reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view review votes" ON review_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on reviews" ON review_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON review_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- 13. Add materialized view for domain trust rankings
CREATE MATERIALIZED VIEW domain_trust_rankings AS
SELECT 
  da.domain,
  da.trust_score,
  da.is_blacklisted,
  da.threat_level,
  da.last_analyzed,
  COUNT(ur.id) as review_count,
  COALESCE(AVG(ur.rating), 0) as avg_rating,
  COUNT(sr.id) as scam_report_count
FROM domain_analysis da
LEFT JOIN user_reviews ur ON da.domain = ur.domain AND ur.review_type = 'domain'
LEFT JOIN scam_reports sr ON sr.content LIKE '%' || da.domain || '%'
GROUP BY da.id, da.domain, da.trust_score, da.is_blacklisted, da.threat_level, da.last_analyzed
ORDER BY da.trust_score DESC, da.last_analyzed DESC;

-- 14. Add function to refresh domain rankings
CREATE OR REPLACE FUNCTION refresh_domain_rankings()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY domain_trust_rankings;
END;
$$ LANGUAGE plpgsql;

-- 15. Add indexes for the materialized view
CREATE INDEX idx_domain_trust_rankings_trust_score ON domain_trust_rankings(trust_score DESC);
CREATE INDEX idx_domain_trust_rankings_blacklisted ON domain_trust_rankings(is_blacklisted);
CREATE INDEX idx_domain_trust_rankings_threat_level ON domain_trust_rankings(threat_level); 