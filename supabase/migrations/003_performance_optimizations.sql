-- Performance optimizations for high-volume uploads and requests
-- This migration adds indexes, partitioning, and optimizations for scalability

-- 1. Add file uploads table for handling large file uploads
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  analysis_id UUID REFERENCES scam_reports(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processing_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add request rate limiting table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  endpoint VARCHAR(100) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add batch processing queue for high-volume operations
CREATE TABLE processing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add materialized views for trending data (faster than real-time queries)
CREATE MATERIALIZED VIEW trending_scams_mv AS
SELECT 
  c.name as category_name,
  c.icon as category_icon,
  COUNT(*) as report_count,
  AVG(sr.confidence) as avg_confidence,
  COUNT(*) FILTER (WHERE sr.created_at >= NOW() - INTERVAL '7 days') as weekly_count,
  COUNT(*) FILTER (WHERE sr.created_at >= NOW() - INTERVAL '24 hours') as daily_count
FROM scam_reports sr
JOIN categories c ON sr.category_id = c.id
WHERE sr.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.id, c.name, c.icon
ORDER BY weekly_count DESC;

-- 5. Add indexes for better query performance
CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX idx_file_uploads_status ON file_uploads(status);
CREATE INDEX idx_file_uploads_content_hash ON file_uploads(content_hash);
CREATE INDEX idx_file_uploads_created_at ON file_uploads(created_at DESC);

CREATE INDEX idx_rate_limits_ip_endpoint ON rate_limits(ip_address, endpoint);
CREATE INDEX idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

CREATE INDEX idx_processing_queue_status_priority ON processing_queue(status, priority);
CREATE INDEX idx_processing_queue_scheduled_at ON processing_queue(scheduled_at);
CREATE INDEX idx_processing_queue_job_type ON processing_queue(job_type);

-- 6. Add partial indexes for common query patterns
CREATE INDEX idx_scam_reports_recent_unsafe ON scam_reports(created_at DESC)
WHERE is_safe = false;

CREATE INDEX idx_analysis_cache_created_at ON analysis_cache(created_at DESC);

-- 7. Add function for automatic cache cleanup
CREATE OR REPLACE FUNCTION cleanup_old_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM analysis_cache 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
  
  DELETE FROM processing_queue 
  WHERE status = 'completed' AND completed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 8. Add function for rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip_address INET,
  p_user_id UUID,
  p_endpoint VARCHAR(100),
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Clean old entries first
  DELETE FROM rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
  
  -- Get current count for this window
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM rate_limits
  WHERE (ip_address = p_ip_address OR (p_user_id IS NOT NULL AND user_id = p_user_id))
    AND endpoint = p_endpoint
    AND window_start >= NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- If under limit, increment counter
  IF current_count < p_max_requests THEN
    INSERT INTO rate_limits (ip_address, user_id, endpoint, request_count)
    VALUES (p_ip_address, p_user_id, p_endpoint, 1)
    ON CONFLICT (ip_address, user_id, endpoint, window_start)
    DO UPDATE SET request_count = rate_limits.request_count + 1;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Add function for batch processing
CREATE OR REPLACE FUNCTION add_to_processing_queue(
  p_job_type VARCHAR(50),
  p_payload JSONB,
  p_priority INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  job_id UUID;
BEGIN
  INSERT INTO processing_queue (job_type, payload, priority)
  VALUES (p_job_type, p_payload, p_priority)
  RETURNING id INTO job_id;
  
  RETURN job_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Enable Row Level Security on new tables
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_queue ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies for new tables
CREATE POLICY "Users can view their own file uploads" ON file_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create file uploads" ON file_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service can manage rate limits" ON rate_limits
  FOR ALL USING (true);

CREATE POLICY "Service can manage processing queue" ON processing_queue
  FOR ALL USING (true);

-- 12. Create scheduled job for cache cleanup (requires pg_cron extension)
-- Note: This requires the pg_cron extension to be enabled in Supabase
-- SELECT cron.schedule('cleanup-old-cache', '0 2 * * *', 'SELECT cleanup_old_cache();');

-- 13. Add refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_trending_scams()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_scams_mv;
END;
$$ LANGUAGE plpgsql;

-- 14. Add indexes for better join performance
CREATE INDEX idx_scam_reports_user_category ON scam_reports(user_id, category_id);
CREATE INDEX idx_user_submitted_scams_user_status ON user_submitted_scams(user_id, status);

-- 15. Add function for bulk operations
CREATE OR REPLACE FUNCTION bulk_insert_scam_reports(reports JSONB[])
RETURNS INTEGER AS $$
DECLARE
  report JSONB;
  inserted_count INTEGER := 0;
BEGIN
  FOREACH report IN ARRAY reports
  LOOP
    INSERT INTO scam_reports (
      content, category_id, is_safe, confidence, threats, analysis, user_id
    ) VALUES (
      report->>'content',
      (report->>'category_id')::UUID,
      (report->>'is_safe')::BOOLEAN,
      (report->>'confidence')::INTEGER,
      ARRAY(SELECT jsonb_array_elements_text(report->'threats')),
      report->>'analysis',
      (report->>'user_id')::UUID
    );
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- 16. Add monitoring table for performance metrics
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  tags JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_performance_metrics_name_time ON performance_metrics(metric_name, recorded_at DESC);

-- 17. Add function to record performance metrics
CREATE OR REPLACE FUNCTION record_performance_metric(
  p_metric_name VARCHAR(100),
  p_metric_value NUMERIC,
  p_tags JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO performance_metrics (metric_name, metric_value, tags)
  VALUES (p_metric_name, p_metric_value, p_tags);
END;
$$ LANGUAGE plpgsql; 