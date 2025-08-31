-- Fix security issues by adding missing RLS policies for organizations and reports tables

-- Organizations table policies
CREATE POLICY "Organizations viewable by authenticated users" ON public.organizations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Ally HQ can manage organizations" ON public.organizations
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE access_level = 'ally_hq'
    )
  );

-- Reports table policies  
CREATE POLICY "Users can view reports for their submissions" ON public.reports
  FOR SELECT USING (
    partner_id IN (
      SELECT p.id FROM public.partners p 
      WHERE p.user_id = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE access_level = 'ally_hq'
    )
  );

CREATE POLICY "Ally HQ can manage all reports" ON public.reports
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE access_level = 'ally_hq'
    )
  );

CREATE POLICY "Partners can create reports for their submissions" ON public.reports
  FOR INSERT WITH CHECK (
    partner_id IN (
      SELECT p.id FROM public.partners p 
      WHERE p.user_id = auth.uid()
    )
  );

-- Add policies for crisis alerts INSERT/UPDATE operations
CREATE POLICY "Users can create crisis alerts for their submissions" ON public.crisis_alerts
  FOR INSERT WITH CHECK (
    partner_id IN (
      SELECT p.id FROM public.partners p 
      WHERE p.user_id = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE access_level = 'ally_hq'
    )
  );

-- Add policies for survivor stories INSERT/UPDATE operations  
CREATE POLICY "Users can create survivor stories for their submissions" ON public.survivor_stories
  FOR INSERT WITH CHECK (
    partner_id IN (
      SELECT p.id FROM public.partners p 
      WHERE p.user_id = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE access_level = 'ally_hq'
    )
  );

CREATE POLICY "Ally HQ can manage all survivor stories" ON public.survivor_stories
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE access_level = 'ally_hq'
    )
  );