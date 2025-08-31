-- Update database schema to align with Ally Impact Hub specifications

-- Create partners table for organizations
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('english', 'nepali', 'khmer')),
  access_level TEXT NOT NULL CHECK (access_level IN ('partner', 'ally_hq', 'donor')),
  contact_email TEXT,
  phone TEXT,
  address TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update submissions table with enhanced privacy and survivor protections
DROP TABLE IF EXISTS public.submissions CASCADE;

CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  
  -- Content fields
  content TEXT,
  translated_content TEXT,
  original_language TEXT,
  translation_confidence NUMERIC DEFAULT 0,
  
  -- Media files
  media_files JSONB DEFAULT '[]',
  audio_transcription TEXT,
  transcription_confidence NUMERIC DEFAULT 0,
  
  -- Privacy and anonymity levels
  privacy_level TEXT NOT NULL CHECK (privacy_level IN ('internal', 'ally', 'donor', 'public')),
  survivor_anonymity_level TEXT DEFAULT 'full' CHECK (survivor_anonymity_level IN (
    'none', 'partial_name', 'partial_location', 'partial_exploitation', 'full'
  )),
  
  -- Content classification
  submission_type TEXT NOT NULL CHECK (submission_type IN (
    'voice', 'text', 'photo', 'mixed', 'crisis_report', 'survivor_report', 
    'monthly_summary', 'financial_report', 'story_submission', 'general_report'
  )),
  
  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN (
    'pending', 'valid', 'needs_review', 'invalid'
  )),
  
  -- Crisis management
  crisis_flag BOOLEAN DEFAULT FALSE,
  urgency_level TEXT DEFAULT 'low' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  
  -- AI analysis results
  ai_analysis JSONB DEFAULT '{}',
  sentiment_score NUMERIC,
  story_extraction JSONB DEFAULT '{}',
  pii_detected BOOLEAN DEFAULT FALSE,
  content_approved BOOLEAN DEFAULT FALSE,
  
  -- Survivor data
  survivor_count INTEGER DEFAULT 0,
  new_survivors INTEGER DEFAULT 0,
  existing_survivors INTEGER DEFAULT 0,
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table for automated report generation
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_ids UUID[] NOT NULL,
  partner_id UUID REFERENCES public.partners(id),
  
  -- Report configuration
  format_type TEXT NOT NULL CHECK (format_type IN (
    'cra_compliance', 'donor_stewardship', 'monthly_summary', 'crisis_report', 'impact_story'
  )),
  report_period_start DATE,
  report_period_end DATE,
  
  -- Generated content
  generated_content JSONB,
  summary TEXT,
  key_insights TEXT[],
  survivor_stories JSONB DEFAULT '[]',
  
  -- Export data
  export_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exported_by UUID,
  download_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dashboard metrics table for real-time analytics
CREATE TABLE IF NOT EXISTS public.dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id),
  
  -- Metric details
  metric_type TEXT NOT NULL,
  metric_category TEXT NOT NULL CHECK (metric_category IN (
    'survivors', 'submissions', 'stories', 'crisis', 'validation', 'translation'
  )),
  value NUMERIC NOT NULL,
  
  -- Time tracking
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crisis alerts table
CREATE TABLE IF NOT EXISTS public.crisis_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id),
  
  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('automatic', 'manual', 'escalated')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_positive')),
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  -- Response tracking
  response_time_minutes INTEGER,
  escalated BOOLEAN DEFAULT FALSE,
  escalated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create survivor stories table for impact tracking
CREATE TABLE IF NOT EXISTS public.survivor_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id),
  
  -- Story content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  impact_outcome TEXT,
  
  -- Privacy controls
  anonymity_level TEXT NOT NULL CHECK (anonymity_level IN (
    'none', 'partial_name', 'partial_location', 'partial_exploitation', 'full'
  )),
  approved_for_advocacy BOOLEAN DEFAULT FALSE,
  approved_for_donors BOOLEAN DEFAULT FALSE,
  approved_for_public BOOLEAN DEFAULT FALSE,
  
  -- Content metadata
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  confidence_score NUMERIC DEFAULT 0,
  word_count INTEGER,
  estimated_read_time INTEGER,
  
  -- Approval workflow
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survivor_stories ENABLE ROW LEVEL SECURITY;

-- Partners table policies
CREATE POLICY "Partners can view their own data" ON public.partners
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE partner_id = partners.id
    )
  );

CREATE POLICY "HQ staff can view all partners" ON public.partners
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE access_level = 'ally_hq'
    )
  );

-- Submissions table policies
CREATE POLICY "Partners can manage their submissions" ON public.submissions
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE partner_id = submissions.partner_id
    )
  );

CREATE POLICY "HQ staff can access all submissions" ON public.submissions
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE access_level = 'ally_hq'
    )
  );

CREATE POLICY "Donors can view approved content" ON public.submissions
  FOR SELECT USING (
    privacy_level IN ('donor', 'public') AND 
    content_approved = TRUE AND 
    processed = TRUE AND
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE access_level = 'donor'
    )
  );

-- Survivor stories policies
CREATE POLICY "Stories follow privacy levels" ON public.survivor_stories
  FOR SELECT USING (
    CASE 
      WHEN auth.uid() IN (SELECT user_id FROM public.profiles WHERE access_level = 'ally_hq') THEN TRUE
      WHEN auth.uid() IN (SELECT user_id FROM public.profiles WHERE access_level = 'donor') THEN approved_for_donors = TRUE
      WHEN auth.uid() IN (SELECT user_id FROM public.profiles WHERE access_level = 'partner') THEN 
        partner_id IN (SELECT partner_id FROM public.profiles WHERE user_id = auth.uid())
      ELSE approved_for_public = TRUE
    END
  );

-- Crisis alerts policies
CREATE POLICY "Crisis alerts by role" ON public.crisis_alerts
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE access_level = 'ally_hq' OR partner_id = crisis_alerts.partner_id
    )
  );

-- Create indexes for performance
CREATE INDEX idx_submissions_partner_id ON public.submissions(partner_id);
CREATE INDEX idx_submissions_privacy_level ON public.submissions(privacy_level);
CREATE INDEX idx_submissions_crisis_flag ON public.submissions(crisis_flag);
CREATE INDEX idx_submissions_submitted_at ON public.submissions(submitted_at);
CREATE INDEX idx_dashboard_metrics_date ON public.dashboard_metrics(date);
CREATE INDEX idx_crisis_alerts_status ON public.crisis_alerts(status);
CREATE INDEX idx_survivor_stories_anonymity ON public.survivor_stories(anonymity_level);

-- Create triggers for updated_at
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_survivor_stories_updated_at
  BEFORE UPDATE ON public.survivor_stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial partner data (example)
INSERT INTO public.partners (name, country, language, access_level, contact_email) VALUES
  ('Ally Global Foundation HQ', 'Canada', 'english', 'ally_hq', 'hq@allyglobal.org'),
  ('Nepal Safe Home Network', 'Nepal', 'nepali', 'partner', 'maria@nepal.org'),
  ('Cambodia Protection Center', 'Cambodia', 'khmer', 'partner', 'support@cambodia.org')
ON CONFLICT DO NOTHING;