-- Create submission types table for dynamic configuration
CREATE TABLE public.submission_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  required_fields JSONB NOT NULL DEFAULT '[]',
  optional_fields JSONB NOT NULL DEFAULT '[]',
  validation_rules JSONB NOT NULL DEFAULT '{}',
  max_character_limit INTEGER DEFAULT 10000,
  supports_media BOOLEAN DEFAULT true,
  supports_voice BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form drafts table for auto-save functionality
CREATE TABLE public.form_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  submission_type_id UUID REFERENCES public.submission_types(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, submission_type_id)
);

-- Update submissions table with new fields
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS submission_type_id UUID REFERENCES public.submission_types(id);
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS validation_errors JSONB DEFAULT '[]';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS validation_overrides JSONB DEFAULT '{}';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'retry'));
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS processing_log JSONB DEFAULT '[]';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS character_count INTEGER DEFAULT 0;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS progress_step INTEGER DEFAULT 1;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS total_steps INTEGER DEFAULT 1;

-- Create submission analytics table
CREATE TABLE public.submission_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'processed', 'failed', 'retry', etc.
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.submission_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for submission_types (readable by all authenticated users)
CREATE POLICY "All authenticated users can view submission types" 
ON public.submission_types 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create RLS policies for form_drafts
CREATE POLICY "Users can manage their own drafts" 
ON public.form_drafts 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for submission_analytics
CREATE POLICY "Users can view analytics for their submissions" 
ON public.submission_analytics 
FOR SELECT 
USING (
  submission_id IN (
    SELECT id FROM public.submissions 
    WHERE partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  )
);

-- Insert default submission types
INSERT INTO public.submission_types (name, description, required_fields, optional_fields, validation_rules, supports_media, supports_voice) VALUES
('incident_report', 'General incident or case report', 
 '["title", "description", "date_occurred", "location"]', 
 '["photos", "voice_notes", "survivor_count", "follow_up_needed"]',
 '{"title": {"min_length": 5, "max_length": 200}, "description": {"min_length": 50}, "date_occurred": {"not_future": true}}',
 true, true),
('survivor_intake', 'New survivor intake form',
 '["survivor_age_range", "intake_date", "services_needed", "case_worker"]',
 '["photos", "voice_notes", "family_size", "special_needs"]',
 '{"survivor_age_range": {"required": true}, "intake_date": {"not_future": true}}',
 true, true),
('program_update', 'Regular program status update',
 '["program_name", "update_period", "activities_completed"]',
 '["photos", "voice_notes", "challenges", "next_steps"]',
 '{"update_period": {"valid_period": true}}',
 true, true),
('crisis_alert', 'Emergency crisis situation report',
 '["crisis_type", "urgency_level", "immediate_needs", "contact_person"]',
 '["photos", "voice_notes", "affected_count"]',
 '{"urgency_level": {"values": ["low", "medium", "high", "critical"]}}',
 true, true);

-- Create triggers for timestamps
CREATE TRIGGER update_submission_types_updated_at
  BEFORE UPDATE ON public.submission_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_drafts_updated_at
  BEFORE UPDATE ON public.form_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();