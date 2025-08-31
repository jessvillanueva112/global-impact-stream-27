-- Fix ambiguous column reference and complete Ally Impact Hub setup
-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'partner' CHECK (access_level IN ('partner', 'ally_hq', 'donor'));

-- Update submissions table with enhanced features
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS translated_content TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS original_language TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS translation_confidence NUMERIC DEFAULT 0;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS audio_transcription TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS transcription_confidence NUMERIC DEFAULT 0;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS survivor_anonymity_level TEXT DEFAULT 'full' CHECK (survivor_anonymity_level IN (
  'none', 'partial_name', 'partial_location', 'partial_exploitation', 'full'
));
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS crisis_flag BOOLEAN DEFAULT FALSE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS urgency_level TEXT DEFAULT 'low' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical'));
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS story_extraction JSONB DEFAULT '{}';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS pii_detected BOOLEAN DEFAULT FALSE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS content_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS survivor_count INTEGER DEFAULT 0;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS new_survivors INTEGER DEFAULT 0;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS existing_survivors INTEGER DEFAULT 0;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS submission_category TEXT CHECK (submission_category IN (
  'voice', 'text', 'photo', 'mixed', 'crisis_report', 'survivor_report', 
  'monthly_summary', 'financial_report', 'story_submission', 'general_report'
));

-- Create new organizational partners table (separate from user profiles)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('english', 'nepali', 'khmer')),
  org_type TEXT NOT NULL CHECK (org_type IN ('partner', 'ally_hq', 'donor')),
  contact_email TEXT,
  phone TEXT,
  address TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create survivor stories table
CREATE TABLE IF NOT EXISTS public.survivor_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID,
  partner_id UUID,
  
  -- Story content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  impact_outcome TEXT,
  
  -- Privacy controls matching survivor feedback
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

-- Create crisis alerts table
CREATE TABLE IF NOT EXISTS public.crisis_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID,
  partner_id UUID,
  
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

-- Create reports table for automated reporting
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_ids UUID[] NOT NULL,
  partner_id UUID,
  
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

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survivor_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Update submission policies for enhanced privacy
DROP POLICY IF EXISTS "Partners can view their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Partners can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Partners can update their own submissions" ON public.submissions;

CREATE POLICY "Users can manage their submissions" ON public.submissions
  FOR ALL USING (
    partner_id IN (
      SELECT p.id FROM public.partners p 
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Ally HQ can access all submissions" ON public.submissions
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE access_level = 'ally_hq'
    )
  );

CREATE POLICY "Donors see approved content only" ON public.submissions
  FOR SELECT USING (
    privacy_level IN ('donor', 'public') AND 
    content_approved = TRUE AND 
    processed = TRUE AND
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE access_level = 'donor'
    )
  );

-- Survivor stories policies with granular privacy controls
CREATE POLICY "Stories follow privacy and anonymity levels" ON public.survivor_stories
  FOR SELECT USING (
    CASE 
      WHEN auth.uid() IN (SELECT user_id FROM public.profiles WHERE access_level = 'ally_hq') THEN TRUE
      WHEN auth.uid() IN (SELECT user_id FROM public.profiles WHERE access_level = 'donor') THEN approved_for_donors = TRUE
      WHEN auth.uid() IN (SELECT user_id FROM public.profiles WHERE access_level = 'partner') THEN 
        partner_id IN (SELECT partner_id FROM public.profiles WHERE user_id = auth.uid())
      ELSE approved_for_public = TRUE
    END
  );

-- Crisis alerts with immediate visibility for HQ and partners
CREATE POLICY "Crisis alerts by access level" ON public.crisis_alerts
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE access_level IN ('ally_hq') OR partner_id = crisis_alerts.partner_id
    )
  );

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_submissions_partner_id ON public.submissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_submissions_privacy_level ON public.submissions(privacy_level);
CREATE INDEX IF NOT EXISTS idx_submissions_crisis_flag ON public.submissions(crisis_flag);
CREATE INDEX IF NOT EXISTS idx_submissions_category ON public.submissions(submission_category);
CREATE INDEX IF NOT EXISTS idx_survivor_stories_anonymity ON public.survivor_stories(anonymity_level);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_status ON public.crisis_alerts(status);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_severity ON public.crisis_alerts(severity);

-- Insert sample organizations
INSERT INTO public.organizations (name, country, language, org_type, contact_email) VALUES
  ('Ally Global Foundation HQ', 'Canada', 'english', 'ally_hq', 'hq@allyglobal.org'),
  ('Nepal Safe Home Network', 'Nepal', 'nepali', 'partner', 'maria@nepal.org'),
  ('Cambodia Protection Center', 'Cambodia', 'khmer', 'partner', 'support@cambodia.org')
ON CONFLICT DO NOTHING;