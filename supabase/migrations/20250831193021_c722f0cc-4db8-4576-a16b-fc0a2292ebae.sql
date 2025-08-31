-- Create partners table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  language TEXT NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'basic',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_files JSONB DEFAULT '{}',
  privacy_level TEXT NOT NULL DEFAULT 'private',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for partners
CREATE POLICY "Users can view their own partner profile" 
ON public.partners 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own partner profile" 
ON public.partners 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partner profile" 
ON public.partners 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for submissions
CREATE POLICY "Partners can view their own submissions" 
ON public.submissions 
FOR SELECT 
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Partners can create submissions" 
ON public.submissions 
FOR INSERT 
WITH CHECK (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Partners can update their own submissions" 
ON public.submissions 
FOR UPDATE 
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();