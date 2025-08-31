-- Create storage buckets for photos and audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('photos', 'photos', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('audio', 'audio', false, 10485760, ARRAY['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/webm']);

-- Create file metadata tracking table
CREATE TABLE public.file_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on file metadata
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file metadata
CREATE POLICY "Users can view their own file metadata" 
ON public.file_metadata 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own file metadata" 
ON public.file_metadata 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own file metadata" 
ON public.file_metadata 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own file metadata" 
ON public.file_metadata 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage policies for photos bucket
CREATE POLICY "Public can view photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can upload photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'photos' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for audio bucket  
CREATE POLICY "Users can view their own audio files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can upload audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'audio' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own audio files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own audio files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger for file metadata timestamps
CREATE TRIGGER update_file_metadata_updated_at
  BEFORE UPDATE ON public.file_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();