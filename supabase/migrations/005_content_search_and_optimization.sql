-- Content Search and Optimization Migration
-- This migration adds content search capabilities and optimizes the database for better performance

-- 1. Add content search table for fast lookups
CREATE TABLE content_search (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_hash VARCHAR(64) NOT NULL UNIQUE,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('email', 'url', 'phone', 'text')),
  content TEXT NOT NULL,
  normalized_content TEXT NOT NULL,
  scam_report_id UUID REFERENCES scam_reports(id) ON DELETE CASCADE,
  user_submitted_scam_id UUID REFERENCES user_submitted_scams(id) ON DELETE CASCADE,
  is_safe BOOLEAN NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  threat_level VARCHAR(20) CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure either scam_report_id or user_submitted_scam_id is provided, but not both
  CONSTRAINT check_content_source CHECK (
    (scam_report_id IS NOT NULL AND user_submitted_scam_id IS NULL) OR 
    (scam_report_id IS NULL AND user_submitted_scam_id IS NOT NULL)
  )
);

-- 2. Add function to normalize content for search
CREATE OR REPLACE FUNCTION normalize_content_for_search(content TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase
  content := lower(content);
  -- Remove extra whitespace
  content := regexp_replace(content, '\s+', ' ', 'g');
  -- Remove special characters but keep alphanumeric and basic punctuation
  content := regexp_replace(content, '[^a-z0-9\s@.-]', '', 'g');
  -- Trim whitespace
  content := trim(content);
  RETURN content;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Add function to extract email from text
CREATE OR REPLACE FUNCTION extract_email_from_text(text_content TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Extract email using regex
  RETURN (regexp_match(text_content, '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', 'g'))[1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Add function to extract phone numbers from text
CREATE OR REPLACE FUNCTION extract_phone_from_text(text_content TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Extract phone numbers (various formats)
  RETURN (regexp_match(text_content, '(\+?254|0)?[17]\d{8}', 'g'))[1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Add function to extract URLs from text
CREATE OR REPLACE FUNCTION extract_url_from_text(text_content TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Extract URLs
  RETURN (regexp_match(text_content, 'https?://[^\s]+', 'g'))[1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Add function to search content efficiently
CREATE OR REPLACE FUNCTION search_content(
  search_query TEXT,
  content_type_filter VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content_type VARCHAR(20),
  content TEXT,
  is_safe BOOLEAN,
  confidence INTEGER,
  threat_level VARCHAR(20),
  source_type VARCHAR(20),
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.content_type,
    cs.content,
    cs.is_safe,
    cs.confidence,
    cs.threat_level,
    CASE 
      WHEN cs.scam_report_id IS NOT NULL THEN 'scam_report'
      ELSE 'user_submitted'
    END as source_type,
    COALESCE(cs.scam_report_id, cs.user_submitted_scam_id) as source_id,
    cs.created_at
  FROM content_search cs
  WHERE 
    (content_type_filter IS NULL OR cs.content_type = content_type_filter)
    AND (
      cs.normalized_content ILIKE '%' || normalize_content_for_search(search_query) || '%'
      OR cs.content ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    cs.confidence DESC,
    cs.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Add function to get content statistics
CREATE OR REPLACE FUNCTION get_content_statistics()
RETURNS TABLE (
  total_entries BIGINT,
  safe_count BIGINT,
  scam_count BIGINT,
  email_count BIGINT,
  url_count BIGINT,
  phone_count BIGINT,
  text_count BIGINT,
  high_confidence_count BIGINT,
  medium_confidence_count BIGINT,
  low_confidence_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE is_safe = true) as safe_count,
    COUNT(*) FILTER (WHERE is_safe = false) as scam_count,
    COUNT(*) FILTER (WHERE content_type = 'email') as email_count,
    COUNT(*) FILTER (WHERE content_type = 'url') as url_count,
    COUNT(*) FILTER (WHERE content_type = 'phone') as phone_count,
    COUNT(*) FILTER (WHERE content_type = 'text') as text_count,
    COUNT(*) FILTER (WHERE confidence >= 80) as high_confidence_count,
    COUNT(*) FILTER (WHERE confidence >= 50 AND confidence < 80) as medium_confidence_count,
    COUNT(*) FILTER (WHERE confidence < 50) as low_confidence_count
  FROM content_search;
END;
$$ LANGUAGE plpgsql;

-- 8. Add function to get trending threats
CREATE OR REPLACE FUNCTION get_trending_threats(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  threat_pattern TEXT,
  occurrence_count BIGINT,
  avg_confidence NUMERIC,
  latest_occurrence TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.threats[1] as threat_pattern,
    COUNT(*) as occurrence_count,
    AVG(sr.confidence) as avg_confidence,
    MAX(sr.created_at) as latest_occurrence
  FROM scam_reports sr
  WHERE 
    sr.created_at >= NOW() - INTERVAL '1 day' * days_back
    AND array_length(sr.threats, 1) > 0
  GROUP BY sr.threats[1]
  ORDER BY occurrence_count DESC, latest_occurrence DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 9. Add function to get recent activity
CREATE OR REPLACE FUNCTION get_recent_activity(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  activity_type VARCHAR(20),
  content_preview TEXT,
  is_safe BOOLEAN,
  confidence INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'scam_report' as activity_type,
    LEFT(sr.content, 100) as content_preview,
    sr.is_safe,
    sr.confidence,
    sr.created_at
  FROM scam_reports sr
  WHERE sr.created_at >= NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  SELECT 
    'user_submitted' as activity_type,
    LEFT(uss.title, 100) as content_preview,
    false as is_safe, -- User submissions are typically scams
    75 as confidence, -- Default confidence for user submissions
    uss.created_at
  FROM user_submitted_scams uss
  WHERE uss.created_at >= NOW() - INTERVAL '24 hours'
    AND uss.status = 'approved'
  
  ORDER BY created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Add indexes for better performance
CREATE INDEX idx_content_search_content_type ON content_search(content_type);
CREATE INDEX idx_content_search_is_safe ON content_search(is_safe);
CREATE INDEX idx_content_search_confidence ON content_search(confidence DESC);
CREATE INDEX idx_content_search_created_at ON content_search(created_at DESC);
CREATE INDEX idx_content_search_normalized_content ON content_search USING gin(to_tsvector('english', normalized_content));
CREATE INDEX idx_content_search_content_hash ON content_search(content_hash);

-- 11. Add full-text search index
CREATE INDEX idx_content_search_fulltext ON content_search USING gin(to_tsvector('english', content));

-- 12. Enable Row Level Security
ALTER TABLE content_search ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies
CREATE POLICY "Anyone can read content search" ON content_search FOR SELECT USING (true);
CREATE POLICY "Service can manage content search" ON content_search FOR ALL USING (true);

-- 14. Add trigger to automatically update content_search when scam_reports are inserted/updated
CREATE OR REPLACE FUNCTION sync_content_search_from_scam_reports()
RETURNS TRIGGER AS $$
DECLARE
  content_hash_val VARCHAR(64);
  normalized_content_val TEXT;
  content_type_val VARCHAR(20);
  extracted_content TEXT;
BEGIN
  -- Generate content hash
  content_hash_val := encode(sha256(NEW.content::bytea), 'hex');
  
  -- Normalize content
  normalized_content_val := normalize_content_for_search(NEW.content);
  
  -- Determine content type and extract specific content
  IF NEW.content ~* '^https?://' THEN
    content_type_val := 'url';
    extracted_content := extract_url_from_text(NEW.content);
  ELSIF NEW.content ~* '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' THEN
    content_type_val := 'email';
    extracted_content := extract_email_from_text(NEW.content);
  ELSIF NEW.content ~* '(\+?254|0)?[17]\d{8}' THEN
    content_type_val := 'phone';
    extracted_content := extract_phone_from_text(NEW.content);
  ELSE
    content_type_val := 'text';
    extracted_content := NEW.content;
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    -- Insert into content_search
    INSERT INTO content_search (
      content_hash, content_type, content, normalized_content, 
      scam_report_id, is_safe, confidence, threat_level
    ) VALUES (
      content_hash_val, content_type_val, extracted_content, normalized_content_val,
      NEW.id, NEW.is_safe, NEW.confidence, 
      CASE 
        WHEN NEW.confidence >= 80 THEN 'high'
        WHEN NEW.confidence >= 50 THEN 'medium'
        ELSE 'low'
      END
    )
    ON CONFLICT (content_hash) DO UPDATE SET
      updated_at = NOW(),
      is_safe = NEW.is_safe,
      confidence = NEW.confidence,
      threat_level = CASE 
        WHEN NEW.confidence >= 80 THEN 'high'
        WHEN NEW.confidence >= 50 THEN 'medium'
        ELSE 'low'
      END;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update content_search
    UPDATE content_search 
    SET 
      content = extracted_content,
      normalized_content = normalized_content_val,
      is_safe = NEW.is_safe,
      confidence = NEW.confidence,
      threat_level = CASE 
        WHEN NEW.confidence >= 80 THEN 'high'
        WHEN NEW.confidence >= 50 THEN 'medium'
        ELSE 'low'
      END,
      updated_at = NOW()
    WHERE scam_report_id = NEW.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 15. Create trigger for content_search sync
CREATE TRIGGER trigger_sync_content_search_from_scam_reports
  AFTER INSERT OR UPDATE ON scam_reports
  FOR EACH ROW
  EXECUTE FUNCTION sync_content_search_from_scam_reports();

-- 16. Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_search_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 17. Create trigger for updated_at
CREATE TRIGGER update_content_search_updated_at 
  BEFORE UPDATE ON content_search 
  FOR EACH ROW EXECUTE FUNCTION update_content_search_updated_at(); 