// Comprehensive Data Validation Engine
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  active: boolean;
  submissionTypes: string[];
  validator: (data: any) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  confidence: number;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestion?: string;
  canOverride: boolean;
  locale?: string;
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
  locale?: string;
}

export interface ValidationOverride {
  errorCode: string;
  reason: string;
  authorizedBy: string;
  timestamp: string;
  expiresAt?: string;
}

export interface ValidationConfig {
  rules: ValidationRule[];
  locale: string;
  strictMode: boolean;
  allowOverrides: boolean;
  partnerId?: string;
}

// Multilingual validation messages
const validationMessages = {
  en: {
    required_field: 'This field is required',
    invalid_email: 'Please enter a valid email address',
    invalid_date: 'Please enter a valid date',
    future_date: 'Date cannot be in the future',
    invalid_number: 'Please enter a valid number',
    survivor_count_mismatch: 'New survivors + existing survivors must equal total survivors',
    date_sequence_error: 'End date must be after start date',
    character_limit_exceeded: 'Text exceeds maximum character limit',
    invalid_phone: 'Please enter a valid phone number',
    suspicious_data: 'Data appears suspicious, please review',
    duplicate_submission: 'Similar submission already exists'
  },
  ne: {
    required_field: 'यो फिल्ड आवश्यक छ',
    invalid_email: 'कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्',
    invalid_date: 'कृपया मान्य मिति प्रविष्ट गर्नुहोस्',
    future_date: 'मिति भविष्यमा हुन सक्दैन',
    invalid_number: 'कृपया मान्य संख्या प्रविष्ट गर्नुहोस्',
    survivor_count_mismatch: 'नयाँ बाँचेका + अवस्थित बाँचेका = कुल बाँचेका हुनुपर्छ',
    date_sequence_error: 'अन्त्य मिति सुरु मिति पछि हुनुपर्छ',
    character_limit_exceeded: 'पाठले अधिकतम वर्ण सीमा नाघेको छ',
    invalid_phone: 'कृपया मान्य फोन नम्बर प्रविष्ट गर्नुहोस्',
    suspicious_data: 'डाटा संदिग्ध देखिन्छ, कृपया समीक्षा गर्नुहोस्',
    duplicate_submission: 'समान पेशकश पहिले नै अवस्थित छ'
  },
  km: {
    required_field: 'វាលនេះត្រូវបានទាមទារ',
    invalid_email: 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលដែលត្រឹមត្រូវ',
    invalid_date: 'សូមបញ្ចូលកាលបរិច្ឆេទដែលត្រឹមត្រូវ',
    future_date: 'កាលបរិច្ឆេទមិនអាចនៅអនាគតបានទេ',
    invalid_number: 'សូមបញ្ចូលលេខដែលត្រឹមត្រូវ',
    survivor_count_mismatch: 'អ្នករស់រានមាណជីវិតថ្មី + អ្នករស់រានមាណជីវិតដែលមានស្រាប់ ត្រូវតែស្មើនឹងអ្នករស់រានមាណជីវិតសរុប',
    date_sequence_error: 'កាលបរិច្ឆេទបញ្ចប់ត្រូវតែនៅក្រោយកាលបរិច្ឆេទចាប់ផ្តើម',
    character_limit_exceeded: 'អត្ថបទលើសពីដែនកំណត់តួអក្សរអតិបរមា',
    invalid_phone: 'សូមបញ្ចូលលេខទូរស័ព្ទដែលត្រឹមត្រូវ',
    suspicious_data: 'ទិន្នន័យហាក់បីដូចជាគួរឱ្យសង្ស័យ សូមពិនិត្យឡើងវិញ',
    duplicate_submission: 'ការដាក់ស្នើស្រដៀងគ្នាមានរួចហើយ'
  }
};

class ValidationEngine {
  private rules: Map<string, ValidationRule> = new Map();
  private config: ValidationConfig;
  private overrides: Map<string, ValidationOverride> = new Map();

  constructor(config: ValidationConfig) {
    this.config = config;
    this.initializeDefaultRules();
  }

  /**
   * Validate submission data against all applicable rules
   */
  async validateSubmission(data: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let totalConfidence = 0;
    let applicableRules = 0;

    for (const rule of this.rules.values()) {
      if (!rule.active) continue;
      
      // Check if rule applies to this submission type
      if (rule.submissionTypes.length > 0 && 
          !rule.submissionTypes.includes(data.submission_type)) {
        continue;
      }

      try {
        const result = rule.validator(data);
        
        if (!result.isValid) {
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        }
        
        totalConfidence += result.confidence;
        applicableRules++;
      } catch (error) {
        console.error(`Validation rule ${rule.id} failed:`, error);
        warnings.push({
          field: 'system',
          code: 'validation_rule_error',
          message: `Validation rule ${rule.name} encountered an error`,
          locale: this.config.locale
        });
      }
    }

    // Filter out overridden errors
    const filteredErrors = errors.filter(error => {
      const override = this.overrides.get(error.code);
      return !override || (override.expiresAt && new Date(override.expiresAt) < new Date());
    });

    const confidence = applicableRules > 0 ? totalConfidence / applicableRules : 1.0;

    return {
      isValid: filteredErrors.length === 0,
      errors: filteredErrors,
      warnings,
      confidence: Math.max(0, Math.min(1, confidence)),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Add validation override for specific error
   */
  addOverride(override: ValidationOverride): void {
    this.overrides.set(override.errorCode, override);
  }

  /**
   * Remove validation override
   */
  removeOverride(errorCode: string): void {
    this.overrides.delete(errorCode);
  }

  /**
   * Add custom validation rule
   */
  addRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove validation rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    return {
      totalRules: this.rules.size,
      activeRules: Array.from(this.rules.values()).filter(r => r.active).length,
      totalOverrides: this.overrides.size,
      rulesByType: this.getRulesByType()
    };
  }

  /**
   * Initialize default validation rules
   */
  private initializeDefaultRules(): void {
    // Required fields validation
    this.addRule({
      id: 'required_fields',
      name: 'Required Fields',
      description: 'Validates that all required fields are present',
      severity: 'error',
      active: true,
      submissionTypes: [],
      validator: (data) => this.validateRequiredFields(data)
    });

    // Survivor count logic validation
    this.addRule({
      id: 'survivor_count_logic',
      name: 'Survivor Count Logic',
      description: 'Validates survivor count mathematics',
      severity: 'error',
      active: true,
      submissionTypes: ['survivor_report', 'monthly_report'],
      validator: (data) => this.validateSurvivorCounts(data)
    });

    // Date range validation
    this.addRule({
      id: 'date_range',
      name: 'Date Range Validation',
      description: 'Validates date ranges and sequences',
      severity: 'error',
      active: true,
      submissionTypes: [],
      validator: (data) => this.validateDateRanges(data)
    });

    // Character limits
    this.addRule({
      id: 'character_limits',
      name: 'Character Limits',
      description: 'Validates text field character limits',
      severity: 'warning',
      active: true,
      submissionTypes: [],
      validator: (data) => this.validateCharacterLimits(data)
    });

    // Data consistency
    this.addRule({
      id: 'data_consistency',
      name: 'Data Consistency',
      description: 'Checks for data consistency and suspicious patterns',
      severity: 'warning',
      active: true,
      submissionTypes: [],
      validator: (data) => this.validateDataConsistency(data)
    });

    // Duplicate detection
    this.addRule({
      id: 'duplicate_detection',
      name: 'Duplicate Detection',
      description: 'Detects potential duplicate submissions',
      severity: 'warning',
      active: true,
      submissionTypes: [],
      validator: (data) => this.validateDuplicates(data)
    });
  }

  /**
   * Validate required fields
   */
  private validateRequiredFields(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const requiredFields = ['content', 'privacy_level', 'partner_id'];

    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
        errors.push({
          field,
          code: 'required_field',
          message: this.getMessage('required_field'),
          severity: 'high',
          canOverride: false
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      confidence: 1.0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate survivor count logic
   */
  private validateSurvivorCounts(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (data.new_survivors !== undefined && 
        data.existing_survivors !== undefined && 
        data.total_survivors !== undefined) {
      
      const calculatedTotal = (data.new_survivors || 0) + (data.existing_survivors || 0);
      
      if (calculatedTotal !== data.total_survivors) {
        errors.push({
          field: 'total_survivors',
          code: 'survivor_count_mismatch',
          message: this.getMessage('survivor_count_mismatch'),
          severity: 'high',
          suggestion: `Expected total: ${calculatedTotal}`,
          canOverride: true
        });
      }

      // Warning for unusually large numbers
      if (data.new_survivors > 100) {
        warnings.push({
          field: 'new_survivors',
          code: 'large_survivor_count',
          message: 'Large number of new survivors detected - please verify',
          suggestion: 'Double-check the count for accuracy'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence: 0.95,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate date ranges and sequences
   */
  private validateDateRanges(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const now = new Date();

    // Check for future dates
    const dateFields = ['report_date', 'incident_date', 'created_at'];
    for (const field of dateFields) {
      if (data[field]) {
        const date = new Date(data[field]);
        if (date > now) {
          errors.push({
            field,
            code: 'future_date',
            message: this.getMessage('future_date'),
            severity: 'medium',
            canOverride: true
          });
        }
      }
    }

    // Check date sequences
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      
      if (endDate <= startDate) {
        errors.push({
          field: 'end_date',
          code: 'date_sequence_error',
          message: this.getMessage('date_sequence_error'),
          severity: 'high',
          canOverride: false
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence: 0.98,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate character limits
   */
  private validateCharacterLimits(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const limits = {
      content: 10000,
      title: 200,
      description: 1000,
      notes: 5000
    };

    for (const [field, limit] of Object.entries(limits)) {
      if (data[field] && typeof data[field] === 'string') {
        if (data[field].length > limit) {
          errors.push({
            field,
            code: 'character_limit_exceeded',
            message: this.getMessage('character_limit_exceeded'),
            severity: 'medium',
            suggestion: `Current: ${data[field].length}, Max: ${limit}`,
            canOverride: true
          });
        } else if (data[field].length > limit * 0.9) {
          warnings.push({
            field,
            code: 'approaching_character_limit',
            message: `Approaching character limit (${data[field].length}/${limit})`,
            suggestion: 'Consider shortening the text'
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence: 1.0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate data consistency
   */
  private validateDataConsistency(data: any): ValidationResult {
    const warnings: ValidationWarning[] = [];

    // Check for suspicious patterns
    if (data.content && typeof data.content === 'string') {
      const content = data.content.toLowerCase();
      
      // Repeated characters
      if (/(.)\1{10,}/.test(content)) {
        warnings.push({
          field: 'content',
          code: 'suspicious_data',
          message: this.getMessage('suspicious_data'),
          suggestion: 'Check for repeated characters or test data'
        });
      }

      // Very short content for important submission types
      if (content.length < 10 && data.submission_type === 'crisis_report') {
        warnings.push({
          field: 'content',
          code: 'insufficient_detail',
          message: 'Crisis reports should contain more detail',
          suggestion: 'Please provide more comprehensive information'
        });
      }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      confidence: 0.85,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate for duplicates (mock implementation)
   */
  private validateDuplicates(data: any): ValidationResult {
    const warnings: ValidationWarning[] = [];

    // Mock duplicate detection - in real implementation, this would check database
    if (data.content && data.content.includes('test')) {
      warnings.push({
        field: 'content',
        code: 'potential_duplicate',
        message: 'Similar submission may already exist',
        suggestion: 'Check recent submissions for duplicates'
      });
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      confidence: 0.80,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get localized validation message
   */
  private getMessage(key: string): string {
    const messages = validationMessages[this.config.locale] || validationMessages.en;
    return messages[key] || key;
  }

  /**
   * Get rules grouped by type
   */
  private getRulesByType() {
    const byType: Record<string, number> = {};
    
    for (const rule of this.rules.values()) {
      byType[rule.severity] = (byType[rule.severity] || 0) + 1;
    }

    return byType;
  }
}

// Factory function to create validation engine with default config
export function createValidationEngine(config?: Partial<ValidationConfig>): ValidationEngine {
  const defaultConfig: ValidationConfig = {
    rules: [],
    locale: 'en',
    strictMode: false,
    allowOverrides: true
  };

  return new ValidationEngine({ ...defaultConfig, ...config });
}

// Export validation engine class
export { ValidationEngine };

// Export default instance
export const defaultValidationEngine = createValidationEngine();