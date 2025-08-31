import { supabase } from '@/integrations/supabase/client';
import { translationService } from './translationService';
import { speechService } from './speechService';
import { defaultValidationEngine } from '@/utils/validation';

export interface SubmissionData {
  content: string;
  privacyLevel: 'internal' | 'ally' | 'donor' | 'public';
  submissionType: string;
  partnerId?: string;
  title?: string;
  audioBlob?: Blob;
  images?: File[];
  mediaFiles?: { [key: string]: any };
  newSurvivors?: number;
  existingSurvivors?: number;
  totalSurvivors?: number;
  reportDate?: string;
  incidentDate?: string;
  location?: string;
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
}

export interface ProcessedSubmission {
  id: string;
  originalData: SubmissionData;
  processedContent: string;
  translatedContent?: string;
  transcribedContent?: string;
  mediaUrls: string[];
  validationResult: any;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt: string;
  retryCount: number;
}

export interface SubmissionDraft {
  id: string;
  user_id: string;
  submission_type_id?: string;
  draft_data: any;
  created_at: string;
  updated_at: string;
}

export interface SubmissionFilter {
  status?: string[];
  submissionType?: string[];
  privacyLevel?: string[];
  dateRange?: { start: string; end: string };
  partnerId?: string;
  search?: string;
  urgencyLevel?: string[];
}

export interface SubmissionAnalytics {
  totalSubmissions: number;
  successRate: number;
  averageProcessingTime: number;
  submissionsByType: { [key: string]: number };
  submissionsByStatus: { [key: string]: number };
  recentTrends: Array<{ date: string; count: number }>;
}

export interface SubmissionType {
  id: string;
  name: string;
  description: string;
  required_fields: string[];
  optional_fields: string[];
  validation_rules: Record<string, any>;
  max_character_limit: number;
  supports_media: boolean;
  supports_voice: boolean;
  active: boolean;
}

class SubmissionService {
  private processingQueue: Map<string, ProcessedSubmission> = new Map();
  private retryDelays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

  /**
   * Create a new submission
   */
  async createSubmission(data: SubmissionData): Promise<ProcessedSubmission> {
    try {
      // Get current user and partner info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: partner } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partner) throw new Error('Partner profile not found');

      // Process media files first
      const mediaUrls = await this.processMediaFiles(data);

      // Prepare submission data
      const submissionData = {
        partner_id: partner.id,
        content: data.content,
        privacy_level: data.privacyLevel,
        submission_type_id: await this.getSubmissionTypeId(data.submissionType),
        media_files: { urls: mediaUrls },
        processing_status: 'pending',
        retry_count: 0,
        character_count: data.content?.length || 0,
        // urgency_level: data.urgencyLevel || 'medium', // Skip if not in schema
        additional_data: {
          title: data.title,
          location: data.location,
          newSurvivors: data.newSurvivors,
          existingSurvivors: data.existingSurvivors,
          totalSurvivors: data.totalSurvivors,
          reportDate: data.reportDate,
          tags: data.tags
        }
      };

      // Insert submission into database
      const { data: submission, error } = await supabase
        .from('submissions')
        .insert([submissionData])
        .select()
        .single();

      if (error) throw error;

      // Start background processing
      const processedSubmission = await this.processSubmission(submission);

      // Log analytics
      await this.logSubmissionAnalytics(submission.id, 'submission_created', {
        submissionType: data.submissionType,
        privacyLevel: data.privacyLevel,
        hasAudio: !!data.audioBlob,
        hasImages: !!(data.images?.length),
        urgencyLevel: data.urgencyLevel
      });

      return processedSubmission;

    } catch (error) {
      console.error('Submission creation failed:', error);
      throw new Error(`Failed to create submission: ${error.message}`);
    }
  }

  /**
   * Process submission with AI services
   */
  async processSubmission(submission: any): Promise<ProcessedSubmission> {
    const startTime = Date.now();
    
    try {
      // Update status to processing
      await this.updateSubmissionStatus(submission.id, 'processing');

      // Validate submission data
      const validationResult = await defaultValidationEngine.validateSubmission(submission);
      
      // Process audio if present
      let transcribedContent = '';
      if (submission.media_files?.audio) {
        const audioBlob = await this.downloadMediaFile(submission.media_files.audio);
        const transcription = await speechService.transcribeAudio(audioBlob, {
          language: 'en', // Could be detected or set based on partner language
          enableAutomaticPunctuation: true
        });
        transcribedContent = transcription.transcript;

        // Log transcription analytics
        await this.logSubmissionAnalytics(submission.id, 'audio_transcribed', {
          confidence: transcription.confidence,
          duration: transcription.duration,
          processingTime: transcription.processingTime
        });
      }

      // Combine all text content
      const combinedContent = [
        submission.content,
        transcribedContent
      ].filter(Boolean).join('\n\n');

      // Translate content if needed
      let translatedContent = '';
      if (combinedContent) {
        const translation = await translationService.autoTranslate(combinedContent, 'en');
        translatedContent = translation.translatedText;

        // Log translation analytics
        await this.logSubmissionAnalytics(submission.id, 'content_translated', {
          sourceLanguage: translation.sourceLanguage,
          confidence: translation.confidence,
          originalLength: combinedContent.length,
          translatedLength: translatedContent.length
        });
      }

      // Check for crisis indicators
      const isCrisisSubmission = this.detectCrisisIndicators(combinedContent);
      if (isCrisisSubmission) {
        await this.handleCrisisSubmission(submission.id);
      }

      // Update submission with processed data
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          processed: true,
          processing_status: 'completed',
          translated_content: translatedContent,
          processing_log: [
            ...(submission.processing_log || []),
            {
              timestamp: new Date().toISOString(),
              stage: 'ai_processing',
              status: 'completed',
              processingTime: Date.now() - startTime,
              validationScore: validationResult.confidence
            }
          ]
        })
        .eq('id', submission.id);

      if (updateError) throw updateError;

      const processedSubmission: ProcessedSubmission = {
        id: submission.id,
        originalData: submission,
        processedContent: combinedContent,
        translatedContent,
        transcribedContent,
        mediaUrls: submission.media_files?.urls || [],
        validationResult,
        processingStatus: 'completed',
        processedAt: new Date().toISOString(),
        retryCount: submission.retry_count || 0
      };

      // Cache in processing queue
      this.processingQueue.set(submission.id, processedSubmission);

      // Log completion analytics
      await this.logSubmissionAnalytics(submission.id, 'processing_completed', {
        totalProcessingTime: Date.now() - startTime,
        validationScore: validationResult.confidence,
        hasTranslation: !!translatedContent,
        hasTranscription: !!transcribedContent,
        isCrisis: isCrisisSubmission
      });

      return processedSubmission;

    } catch (error) {
      console.error('Submission processing failed:', error);
      
      // Handle retry logic
      const retryCount = (submission.retry_count || 0) + 1;
      const maxRetries = 3;

      if (retryCount <= maxRetries) {
        // Schedule retry with exponential backoff
        const delay = this.retryDelays[Math.min(retryCount - 1, this.retryDelays.length - 1)];
        
        await supabase
          .from('submissions')
          .update({
            processing_status: 'pending',
            retry_count: retryCount,
            next_retry_at: new Date(Date.now() + delay).toISOString(),
            processing_log: [
              ...(submission.processing_log || []),
              {
                timestamp: new Date().toISOString(),
                stage: 'ai_processing',
                status: 'failed',
                error: error.message,
                retryCount,
                nextRetryIn: delay
              }
            ]
          })
          .eq('id', submission.id);

        // Log retry analytics
        await this.logSubmissionAnalytics(submission.id, 'processing_retry', {
          retryCount,
          error: error.message,
          nextRetryDelay: delay
        });

        // Schedule retry (in a real app, this would use a job queue)
        setTimeout(() => this.processSubmission(submission), delay);
      } else {
        // Mark as failed after max retries
        await this.updateSubmissionStatus(submission.id, 'failed');
        
        await this.logSubmissionAnalytics(submission.id, 'processing_failed', {
          finalError: error.message,
          totalRetries: retryCount,
          totalProcessingTime: Date.now() - startTime
        });
      }

      throw error;
    }
  }

  /**
   * Get submission by ID
   */
  async getSubmission(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        partner:partners(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get submissions with filtering and pagination
   */
  async getSubmissions(
    filter: SubmissionFilter = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ submissions: any[]; total: number; page: number; pageSize: number }> {
    let query = supabase
      .from('submissions')
      .select(`
        *,
        partner:partners(name, country)
      `, { count: 'exact' });

    // Apply filters
    if (filter.status?.length) {
      query = query.in('processing_status', filter.status);
    }

    if (filter.privacyLevel?.length) {
      query = query.in('privacy_level', filter.privacyLevel);
    }

    // Note: urgency_level might not exist in current schema, skip for now
    // if (filter.urgencyLevel?.length) {
    //   query = query.in('urgency_level', filter.urgencyLevel);
    // }

    if (filter.dateRange) {
      query = query
        .gte('created_at', filter.dateRange.start)
        .lte('created_at', filter.dateRange.end);
    }

    if (filter.search) {
      query = query.or(`content.ilike.%${filter.search}%,translated_content.ilike.%${filter.search}%`);
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      submissions: data || [],
      total: count || 0,
      page,
      pageSize
    };
  }

  /**
   * Save draft submission
   */
  async saveDraft(draftData: any, existingDraftId?: string): Promise<SubmissionDraft> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const draftPayload = {
      user_id: user.id,
      draft_data: draftData,
      updated_at: new Date().toISOString()
    };

    if (existingDraftId) {
      const { data, error } = await supabase
        .from('form_drafts')
        .update(draftPayload)
        .eq('id', existingDraftId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('form_drafts')
        .insert([draftPayload])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  /**
   * Get user's drafts
   */
  async getDrafts(): Promise<SubmissionDraft[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('form_drafts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete draft
   */
  async deleteDraft(draftId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('form_drafts')
      .delete()
      .eq('id', draftId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Get submission analytics
   */
  async getSubmissionAnalytics(dateRange?: { start: string; end: string }): Promise<SubmissionAnalytics> {
    let query = supabase
      .from('submission_analytics')
      .select('*');

    if (dateRange) {
      query = query
        .gte('timestamp', dateRange.start)
        .lte('timestamp', dateRange.end);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Process analytics data
    const analytics: SubmissionAnalytics = {
      totalSubmissions: 0,
      successRate: 0,
      averageProcessingTime: 0,
      submissionsByType: {},
      submissionsByStatus: {},
      recentTrends: []
    };

    // Calculate metrics from raw analytics data
    // This is a simplified version - in practice, you'd aggregate the data
    const events = data || [];
    
    analytics.totalSubmissions = events.filter(e => e.event_type === 'submission_created').length;
    
    const completedEvents = events.filter(e => e.event_type === 'processing_completed');
    const failedEvents = events.filter(e => e.event_type === 'processing_failed');
    
    analytics.successRate = analytics.totalSubmissions > 0 ? 
      (completedEvents.length / analytics.totalSubmissions) * 100 : 0;

    const processingTimes = completedEvents
      .map(e => {
        const eventData = e.event_data as any;
        return eventData?.totalProcessingTime;
      })
      .filter(Boolean);
    
    analytics.averageProcessingTime = processingTimes.length > 0 ?
      processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length : 0;

    return analytics;
  }

  /**
   * Bulk operations on submissions
   */
  async bulkUpdateSubmissions(
    submissionIds: string[], 
    updates: Partial<any>
  ): Promise<void> {
    const { error } = await supabase
      .from('submissions')
      .update(updates)
      .in('id', submissionIds);

    if (error) throw error;

    // Log bulk operation
    await this.logSubmissionAnalytics('bulk_operation', 'bulk_update', {
      submissionCount: submissionIds.length,
      updates: Object.keys(updates)
    });
  }

  /**
   * Get submission types
   */
  async getSubmissionTypes(): Promise<SubmissionType[]> {
    const { data, error } = await supabase
      .from('submission_types')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      required_fields: Array.isArray(item.required_fields) ? item.required_fields : [],
      optional_fields: Array.isArray(item.optional_fields) ? item.optional_fields : [],
      validation_rules: typeof item.validation_rules === 'object' ? item.validation_rules : {}
    })) as SubmissionType[];
  }

  /**
   * Process media files (upload to storage)
   */
  private async processMediaFiles(data: SubmissionData): Promise<string[]> {
    const mediaUrls: string[] = [];

    // Process images
    if (data.images?.length) {
      for (const image of data.images) {
        const fileName = `${Date.now()}-${image.name}`;
        const filePath = `submissions/${fileName}`;

        const { data: uploadData, error } = await supabase.storage
          .from('photos')
          .upload(filePath, image);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);

        mediaUrls.push(publicUrl);
      }
    }

    // Process audio
    if (data.audioBlob) {
      const fileName = `${Date.now()}-audio.webm`;
      const filePath = `submissions/${fileName}`;

      const { data: uploadData, error } = await supabase.storage
        .from('audio')
        .upload(filePath, data.audioBlob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(filePath);

      mediaUrls.push(publicUrl);
    }

    return mediaUrls;
  }

  /**
   * Get submission type ID by name
   */
  private async getSubmissionTypeId(typeName: string): Promise<string> {
    const { data, error } = await supabase
      .from('submission_types')
      .select('id')
      .eq('name', typeName)
      .single();

    if (error || !data) {
      // Return default submission type or create one
      return '00000000-0000-0000-0000-000000000001'; // Default UUID
    }

    return data.id;
  }

  /**
   * Update submission status
   */
  private async updateSubmissionStatus(submissionId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('submissions')
      .update({ processing_status: status })
      .eq('id', submissionId);

    if (error) throw error;
  }

  /**
   * Detect crisis indicators in content
   */
  private detectCrisisIndicators(content: string): boolean {
    const crisisKeywords = [
      'emergency', 'urgent', 'crisis', 'help', 'danger', 'immediate',
      'critical', 'serious', 'threat', 'violence', 'abuse', 'attack'
    ];

    const lowercaseContent = content.toLowerCase();
    return crisisKeywords.some(keyword => lowercaseContent.includes(keyword));
  }

  /**
   * Handle crisis submission
   */
  private async handleCrisisSubmission(submissionId: string): Promise<void> {
    // Log crisis alert (skip crisis_flag update since it might not be in schema)
    await this.logSubmissionAnalytics(submissionId, 'crisis_detected', {
      detectedAt: new Date().toISOString(),
      autoDetected: true
    });

    // In a real implementation, this would trigger alerts to HQ staff
    console.log('Crisis submission detected:', submissionId);
  }

  /**
   * Download media file from storage
   */
  private async downloadMediaFile(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to download media file');
    return response.blob();
  }

  /**
   * Log submission analytics event
   */
  private async logSubmissionAnalytics(
    submissionId: string, 
    eventType: string, 
    eventData: any
  ): Promise<void> {
    try {
      await supabase
        .from('submission_analytics')
        .insert([{
          submission_id: submissionId,
          event_type: eventType,
          event_data: eventData,
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      // Don't throw on analytics errors - just log them
      console.error('Failed to log analytics:', error);
    }
  }
}

// Export singleton instance
export const submissionService = new SubmissionService();

// Export service class and types
export default submissionService;