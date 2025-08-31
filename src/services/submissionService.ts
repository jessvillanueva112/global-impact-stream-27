import { supabase } from '@/integrations/supabase/client';

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

export interface SubmissionAnalytics {
  totalSubmissions: number;
  successRate: number;
  averageProcessingTime: number;
  submissionsByType: { [key: string]: number };
  submissionsByStatus: { [key: string]: number };
  recentTrends: Array<{ date: string; count: number }>;
}

export interface ValidationRule {
  field: string;
  rule: string;
  value?: any;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  confidence: number;
}

export interface FormDraft {
  id: string;
  user_id: string;
  submission_type_id: string;
  draft_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Validation engine with configurable rules
 */
class ValidationEngine {
  private rules: Map<string, ValidationRule[]> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Survivor count validation rules
    this.addRule('survivor_count', {
      field: 'survivor_count',
      rule: 'survivor_count_logic',
      message: 'New survivors + existing survivors must equal total survivors'
    });

    // Date validation rules
    this.addRule('date_occurred', {
      field: 'date_occurred',
      rule: 'not_future',
      message: 'Date cannot be in the future'
    });

    this.addRule('intake_date', {
      field: 'intake_date',
      rule: 'not_future',
      message: 'Intake date cannot be in the future'
    });

    // Text length validation
    this.addRule('title', {
      field: 'title',
      rule: 'min_length',
      value: 5,
      message: 'Title must be at least 5 characters'
    });

    this.addRule('description', {
      field: 'description',
      rule: 'min_length',
      value: 10,
      message: 'Description must be at least 10 characters'
    });
  }

  addRule(field: string, rule: ValidationRule) {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
  }

  /**
   * Validates form data against defined rules
   */
  validate(data: Record<string, any>, submissionType?: SubmissionType): ValidationResult {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
    let totalChecks = 0;
    let passedChecks = 0;

    // Validate required fields
    if (submissionType) {
      submissionType.required_fields.forEach(field => {
        totalChecks++;
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
          errors.push({
            field,
            message: `${field.replace('_', ' ')} is required`,
            severity: 'error'
          });
        } else {
          passedChecks++;
        }
      });

      // Apply submission type specific validation rules
      if (submissionType.validation_rules) {
        Object.entries(submissionType.validation_rules).forEach(([field, rules]: [string, any]) => {
          if (data[field] !== undefined && data[field] !== null) {
            totalChecks++;
            const fieldValue = data[field];
            
            if (rules.min_length && fieldValue.length < rules.min_length) {
              errors.push({
                field,
                message: `${field.replace('_', ' ')} must be at least ${rules.min_length} characters`,
                severity: 'error'
              });
            } else if (rules.max_length && fieldValue.length > rules.max_length) {
              errors.push({
                field,
                message: `${field.replace('_', ' ')} must not exceed ${rules.max_length} characters`,
                severity: 'error'
              });
            } else if (rules.not_future && new Date(fieldValue) > new Date()) {
              errors.push({
                field,
                message: `${field.replace('_', ' ')} cannot be in the future`,
                severity: 'error'
              });
            } else if (rules.values && !rules.values.includes(fieldValue)) {
              errors.push({
                field,
                message: `${field.replace('_', ' ')} must be one of: ${rules.values.join(', ')}`,
                severity: 'error'
              });
            } else {
              passedChecks++;
            }
          }
        });
      }
    }

    // Apply custom validation rules
    Object.entries(data).forEach(([field, value]) => {
      const fieldRules = this.rules.get(field);
      if (fieldRules && value !== undefined && value !== null) {
        fieldRules.forEach(rule => {
          totalChecks++;
          const isValid = this.validateField(field, value, rule);
          if (isValid) {
            passedChecks++;
          } else {
            errors.push({
              field,
              message: rule.message,
              severity: 'error'
            });
          }
        });
      }
    });

    // Special validation: survivor count logic
    if (data.new_survivors !== undefined && data.existing_survivors !== undefined && data.total_survivors !== undefined) {
      totalChecks++;
      const newCount = parseInt(data.new_survivors) || 0;
      const existingCount = parseInt(data.existing_survivors) || 0;
      const totalCount = parseInt(data.total_survivors) || 0;
      
      if (newCount + existingCount !== totalCount) {
        errors.push({
          field: 'total_survivors',
          message: 'New survivors + existing survivors must equal total survivors',
          severity: 'error'
        });
      } else {
        passedChecks++;
      }
    }

    const confidence = totalChecks > 0 ? passedChecks / totalChecks : 1;

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      confidence
    };
  }

  private validateField(field: string, value: any, rule: ValidationRule): boolean {
    switch (rule.rule) {
      case 'min_length':
        return typeof value === 'string' && value.length >= (rule.value || 0);
      
      case 'max_length':
        return typeof value === 'string' && value.length <= (rule.value || Infinity);
      
      case 'not_future':
        return new Date(value) <= new Date();
      
      case 'required':
        return value !== undefined && value !== null && value !== '';
      
      case 'numeric':
        return !isNaN(Number(value));
      
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      
      case 'phone':
        return /^\+?[\d\s\-\(\)]+$/.test(value);
      
      default:
        return true;
    }
  }

  /**
   * Get multilingual error message
   */
  getLocalizedMessage(rule: ValidationRule, language: string = 'en'): string {
    const messages: Record<string, Record<string, string>> = {
      en: {
        required: 'This field is required',
        min_length: `Must be at least ${rule.value} characters`,
        max_length: `Must not exceed ${rule.value} characters`,
        not_future: 'Date cannot be in the future',
        survivor_count_logic: 'New + existing survivors must equal total'
      },
      ne: {
        required: 'यो फिल्ड आवश्यक छ',
        min_length: `कम्तिमा ${rule.value} अक्षर हुनुपर्छ`,
        max_length: `${rule.value} अक्षर भन्दा बढी हुनुहुँदैन`,
        not_future: 'मिति भविष्यमा हुन सक्दैन',
        survivor_count_logic: 'नयाँ + अवस्थित बाँचेकाहरू कुल बराबर हुनुपर्छ'
      },
      km: {
        required: 'វាលនេះត្រូវការបំពេញ',
        min_length: `ត្រូវមានយ៉ាងតិច ${rule.value} តួអក្សរ`,
        max_length: `មិនត្រូវលើស ${rule.value} តួអក្សរ`,
        not_future: 'កាលបរិច្ছេទមិនអាចនៅអនាគត',
        survivor_count_logic: 'អ្នករួចភ័យថ្មី + បច្ចុប្បន្នត្រូវស្មើនឹងសរុប'
      }
    };

    return messages[language]?.[rule.rule] || rule.message;
  }
}

// Singleton instance
export const validationEngine = new ValidationEngine();

/**
 * Service functions for submission management
 */
export const submissionService = {
  /**
   * Get all active submission types
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
  },

  /**
   * Save form draft
   */
  async saveDraft(submissionTypeId: string, draftData: Record<string, any>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('form_drafts')
      .upsert({
        user_id: user.id,
        submission_type_id: submissionTypeId,
        draft_data: draftData
      });

    if (error) throw error;
  },

  /**
   * Load form draft
   */
  async loadDraft(submissionTypeId: string): Promise<FormDraft | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('form_drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('submission_type_id', submissionTypeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? {
      ...data,
      draft_data: typeof data.draft_data === 'object' ? data.draft_data as Record<string, any> : {}
    } as FormDraft : null;
  },

  /**
   * Delete form draft
   */
  async deleteDraft(submissionTypeId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('form_drafts')
      .delete()
      .eq('user_id', user.id)
      .eq('submission_type_id', submissionTypeId);

    if (error) throw error;
  },

  /**
   * Create submission with validation
   */
  async createSubmission(
    submissionData: Record<string, any>,
    submissionType: SubmissionType
  ): Promise<{ success: boolean; submissionId?: string; errors?: any[] }> {
    try {
      // Get user's partner info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: partner } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partner) throw new Error('Partner profile not found');

      // Validate submission
      const validation = validationEngine.validate(submissionData, submissionType);
      
      // Create submission record
      const { data: submission, error } = await supabase
        .from('submissions')
        .insert({
          partner_id: partner.id,
          submission_type_id: submissionType.id,
          content: submissionData.content || submissionData.description || '',
          media_files: submissionData.media_files || {},
          privacy_level: submissionData.privacy_level || 'internal',
          validation_errors: validation.errors,
          processing_status: validation.isValid ? 'pending' : 'failed',
          character_count: (submissionData.content || '').length,
          processed: false
        })
        .select()
        .single();

      if (error) throw error;

      // Log analytics
      await supabase
        .from('submission_analytics')
        .insert({
          submission_id: submission.id,
          event_type: 'created',
          event_data: {
            validation_confidence: validation.confidence,
            has_errors: !validation.isValid,
            submission_type: submissionType.name
          }
        });

      // Clean up draft if successful
      if (validation.isValid) {
        await this.deleteDraft(submissionType.id);
      }

      return {
        success: validation.isValid,
        submissionId: submission.id,
        errors: validation.errors
      };

    } catch (error) {
      console.error('Error creating submission:', error);
      return {
        success: false,
        errors: [{ field: 'general', message: 'Failed to create submission', severity: 'error' }]
      };
    }
  },

  /**
   * Get submission history for current user
   */
  async getSubmissionHistory(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ submissions: any[]; total: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!partner) throw new Error('Partner profile not found');

    // Get submissions with submission type info
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        submission_types(name, description)
      `)
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get total count
    const { count } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partner.id);

    return {
      submissions: submissions || [],
      total: count || 0
    };
  },

  /**
   * Search submissions
   */
  async searchSubmissions(
    query: string,
    filters: {
      submission_type?: string;
      privacy_level?: string;
      processing_status?: string;
      date_from?: string;
      date_to?: string;
    } = {}
  ): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!partner) throw new Error('Partner profile not found');

    let queryBuilder = supabase
      .from('submissions')
      .select(`
        *,
        submission_types(name, description)
      `)
      .eq('partner_id', partner.id);

    // Apply text search
    if (query) {
      queryBuilder = queryBuilder.or(`content.ilike.%${query}%,translated_content.ilike.%${query}%`);
    }

    // Apply filters
    if (filters.submission_type) {
      queryBuilder = queryBuilder.eq('submission_type_id', filters.submission_type);
    }
    if (filters.privacy_level) {
      queryBuilder = queryBuilder.eq('privacy_level', filters.privacy_level);
    }
    if (filters.processing_status) {
      queryBuilder = queryBuilder.eq('processing_status', filters.processing_status);
    }
    if (filters.date_from) {
      queryBuilder = queryBuilder.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      queryBuilder = queryBuilder.lte('created_at', filters.date_to);
    }

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }
};