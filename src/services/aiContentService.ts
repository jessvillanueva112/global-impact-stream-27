import { supabase } from '@/integrations/supabase/client';

export interface AIProcessingResult {
  processingType: string;
  submissionType: string;
  analysis: any;
  processingTime: number;
  confidence: number;
  timestamp: string;
  model: string;
}

export interface ContentAnalysis {
  summary?: string;
  keyInsights?: string[];
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  survivorCount?: number;
  categories?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
  actionItems?: string[];
  riskFactors?: string[];
  recommendations?: string[];
  confidence?: number;
}

export interface StoryExtraction {
  stories: Array<{
    title: string;
    content: string;
    impact: string;
    usableForAdvocacy: boolean;
    sensitivityLevel: 'low' | 'medium' | 'high';
  }>;
  testimonials: string[];
  impactMetrics: string[];
}

export interface PIIDetection {
  piiDetected: boolean;
  piiTypes: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  sanitizedContent: string;
}

export interface ContentModeration {
  approved: boolean;
  issues: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  childProtectionConcerns: boolean;
}

class AIContentProcessingService {
  /**
   * Analyze content comprehensively
   */
  async analyzeContent(content: string, submissionType: string = 'general_report'): Promise<ContentAnalysis> {
    try {
      const { data, error } = await supabase.functions.invoke('process-content', {
        body: {
          content,
          processingType: 'analyze',
          submissionType
        }
      });

      if (error) throw error;
      return data.analysis;
    } catch (error) {
      console.error('Content analysis failed:', error);
      return this.getFallbackAnalysis(content);
    }
  }

  /**
   * Summarize content
   */
  async summarizeContent(content: string, submissionType: string = 'general_report'): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('process-content', {
        body: {
          content,
          processingType: 'summarize',
          submissionType
        }
      });

      if (error) throw error;
      return data.analysis;
    } catch (error) {
      console.error('Content summarization failed:', error);
      return {
        summary: content.substring(0, 200) + '...',
        keyPoints: ['Unable to process with AI'],
        urgencyLevel: 'medium',
        actionItems: []
      };
    }
  }

  /**
   * Categorize and tag content
   */
  async categorizeContent(content: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('process-content', {
        body: {
          content,
          processingType: 'categorize'
        }
      });

      if (error) throw error;
      return data.analysis;
    } catch (error) {
      console.error('Content categorization failed:', error);
      return {
        primaryCategory: 'other',
        tags: ['uncategorized'],
        sentiment: 'neutral',
        confidence: 0.5,
        submissionType: 'general_report'
      };
    }
  }

  /**
   * Extract stories for advocacy
   */
  async extractStories(content: string): Promise<StoryExtraction> {
    try {
      const { data, error } = await supabase.functions.invoke('process-content', {
        body: {
          content,
          processingType: 'extract_story'
        }
      });

      if (error) throw error;
      return data.analysis;
    } catch (error) {
      console.error('Story extraction failed:', error);
      return {
        stories: [],
        testimonials: [],
        impactMetrics: []
      };
    }
  }

  /**
   * Detect and flag PII
   */
  async detectPII(content: string): Promise<PIIDetection> {
    try {
      const { data, error } = await supabase.functions.invoke('process-content', {
        body: {
          content,
          processingType: 'detect_pii'
        }
      });

      if (error) throw error;
      return data.analysis;
    } catch (error) {
      console.error('PII detection failed:', error);
      return {
        piiDetected: false,
        piiTypes: [],
        riskLevel: 'low',
        recommendations: [],
        sanitizedContent: content
      };
    }
  }

  /**
   * Moderate content
   */
  async moderateContent(content: string): Promise<ContentModeration> {
    try {
      const { data, error } = await supabase.functions.invoke('process-content', {
        body: {
          content,
          processingType: 'moderate'
        }
      });

      if (error) throw error;
      return data.analysis;
    } catch (error) {
      console.error('Content moderation failed:', error);
      return {
        approved: true,
        issues: [],
        severity: 'low',
        recommendations: [],
        childProtectionConcerns: false
      };
    }
  }

  /**
   * Perform sentiment analysis
   */
  async analyzeSentiment(content: string): Promise<{ sentiment: string; confidence: number; details: any }> {
    try {
      const analysis = await this.analyzeContent(content);
      return {
        sentiment: analysis.sentiment || 'neutral',
        confidence: analysis.confidence || 0.75,
        details: {
          keyWords: this.extractKeyWords(content),
          emotionalIndicators: this.detectEmotionalIndicators(content)
        }
      };
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        details: {}
      };
    }
  }

  /**
   * Generate content recommendations
   */
  async generateRecommendations(content: string, submissionType: string): Promise<string[]> {
    try {
      const analysis = await this.analyzeContent(content, submissionType);
      return analysis.recommendations || [];
    } catch (error) {
      console.error('Recommendation generation failed:', error);
      return ['Consider providing more detail', 'Add specific dates and locations if applicable'];
    }
  }

  /**
   * Identify trends in content
   */
  async identifyTrends(contents: string[]): Promise<any> {
    try {
      // Analyze multiple contents to identify patterns
      const analyses = await Promise.all(
        contents.map(content => this.analyzeContent(content))
      );

      const trends = {
        commonThemes: this.extractCommonThemes(analyses),
        sentimentTrend: this.calculateSentimentTrend(analyses),
        urgencyPatterns: this.analyzeUrgencyPatterns(analyses),
        categoryDistribution: this.calculateCategoryDistribution(analyses)
      };

      return trends;
    } catch (error) {
      console.error('Trend identification failed:', error);
      return {
        commonThemes: [],
        sentimentTrend: 'stable',
        urgencyPatterns: {},
        categoryDistribution: {}
      };
    }
  }

  /**
   * Comprehensive content processing
   */
  async processSubmissionContent(
    content: string, 
    submissionType: string,
    includeAll: boolean = false
  ): Promise<{
    analysis: ContentAnalysis;
    summary: any;
    categorization: any;
    piiDetection: PIIDetection;
    moderation: ContentModeration;
    recommendations: string[];
  }> {
    try {
      const [analysis, summary, categorization, piiDetection, moderation, recommendations] = await Promise.all([
        this.analyzeContent(content, submissionType),
        this.summarizeContent(content, submissionType),
        this.categorizeContent(content),
        includeAll ? this.detectPII(content) : Promise.resolve({} as PIIDetection),
        includeAll ? this.moderateContent(content) : Promise.resolve({} as ContentModeration),
        this.generateRecommendations(content, submissionType)
      ]);

      return {
        analysis,
        summary,
        categorization,
        piiDetection,
        moderation,
        recommendations
      };
    } catch (error) {
      console.error('Comprehensive content processing failed:', error);
      throw error;
    }
  }

  /**
   * Fallback analysis when AI fails
   */
  private getFallbackAnalysis(content: string): ContentAnalysis {
    const wordCount = content.split(' ').length;
    const hasUrgentWords = /urgent|emergency|crisis|immediate|critical/i.test(content);
    
    return {
      summary: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      keyInsights: ['Analysis not available - please review manually'],
      urgencyLevel: hasUrgentWords ? 'high' : 'medium',
      categories: ['general'],
      sentiment: 'neutral',
      actionItems: ['Manual review required'],
      confidence: 0.1
    };
  }

  /**
   * Extract key words from content
   */
  private extractKeyWords(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Detect emotional indicators
   */
  private detectEmotionalIndicators(content: string): string[] {
    const positiveWords = ['success', 'progress', 'improved', 'helped', 'better', 'achievement'];
    const negativeWords = ['crisis', 'problem', 'difficult', 'emergency', 'urgent', 'failed'];
    
    const indicators: string[] = [];
    const lowerContent = content.toLowerCase();
    
    positiveWords.forEach(word => {
      if (lowerContent.includes(word)) indicators.push(`positive: ${word}`);
    });
    
    negativeWords.forEach(word => {
      if (lowerContent.includes(word)) indicators.push(`negative: ${word}`);
    });

    return indicators;
  }

  /**
   * Extract common themes from multiple analyses
   */
  private extractCommonThemes(analyses: ContentAnalysis[]): string[] {
    const allCategories = analyses.flatMap(a => a.categories || []);
    const frequency: { [key: string]: number } = {};
    
    allCategories.forEach(category => {
      frequency[category] = (frequency[category] || 0) + 1;
    });

    return Object.entries(frequency)
      .filter(([, count]) => count > 1)
      .sort(([,a], [,b]) => b - a)
      .map(([theme]) => theme);
  }

  /**
   * Calculate sentiment trend
   */
  private calculateSentimentTrend(analyses: ContentAnalysis[]): string {
    const sentiments = analyses.map(a => a.sentiment);
    const positive = sentiments.filter(s => s === 'positive').length;
    const negative = sentiments.filter(s => s === 'negative').length;
    
    if (positive > negative) return 'improving';
    if (negative > positive) return 'declining';
    return 'stable';
  }

  /**
   * Analyze urgency patterns
   */
  private analyzeUrgencyPatterns(analyses: ContentAnalysis[]): { [key: string]: number } {
    const urgencyLevels = analyses.map(a => a.urgencyLevel || 'medium');
    const distribution: { [key: string]: number } = {};
    
    urgencyLevels.forEach(level => {
      distribution[level] = (distribution[level] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Calculate category distribution
   */
  private calculateCategoryDistribution(analyses: ContentAnalysis[]): { [key: string]: number } {
    const allCategories = analyses.flatMap(a => a.categories || []);
    const distribution: { [key: string]: number } = {};
    
    allCategories.forEach(category => {
      distribution[category] = (distribution[category] || 0) + 1;
    });

    return distribution;
  }
}

// Export singleton instance
export const aiContentService = new AIContentProcessingService();

// Export service class and types
export default aiContentService;