import { supabase } from '@/integrations/supabase/client';

// Real Translation Service with OpenAI Integration
export interface TranslationResult {
  translatedText: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  timestamp: string;
}

export interface BatchTranslationResult {
  translations: TranslationResult[];
  totalCost: number;
  processingTime: number;
}

export interface CachedTranslation {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  createdAt: string;
  lastUsed: string;
}

class TranslationServiceMock {
  private cache = new Map<string, CachedTranslation>();
  
  // Mock translation data for common phrases
  private mockTranslations: Record<string, Record<string, Record<string, string>>> = {
    en: {
      ne: {
        'hello': 'नमस्ते',
        'thank you': 'धन्यवाद',
        'emergency': 'आपातकाल',
        'help': 'मद्दत',
        'urgent': 'जरुरी',
        'new survivor': 'नयाँ बाँचेका',
        'crisis alert': 'संकट चेतावनी'
      },
      km: {
        'hello': 'ជំរាបសួរ',
        'thank you': 'អរគុណ',
        'emergency': 'អាសន្ន',
        'help': 'ជំនួយ',
        'urgent': 'បន្ទាន់',
        'new survivor': 'អ្នករស់រានមាណជីវិតថ្មី',
        'crisis alert': 'ការជូនដំណឹងវិបត្តិ'
      }
    },
    ne: {
      en: {
        'नमस्ते': 'hello',
        'धन्यवाద': 'thank you',
        'आपातकाল': 'emergency',
        'मद्दत': 'help',
        'जरुरी': 'urgent'
      }
    },
    km: {
      en: {
        'ជំរាបសួរ': 'hello',
        'អរគុណ': 'thank you',
        'អាសន្ន': 'emergency',
        'ជំនួយ': 'help',
        'បន្ទាន់': 'urgent'
      }
    }
  };

  /**
   * Detect the language of the given text
   */
  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text, targetLanguage: 'en' }
      });

      if (error) throw error;

      return {
        language: data.sourceLanguage || 'en',
        confidence: data.confidence || 0.85
      };
    } catch (error) {
      console.error('Language detection failed:', error);
      // Fallback to simple detection
      if (/[\u0900-\u097F]/.test(text)) {
        return { language: 'ne', confidence: 0.70 };
      }
      if (/[\u1780-\u17FF]/.test(text)) {
        return { language: 'km', confidence: 0.70 };
      }
      return { language: 'en', confidence: 0.60 };
    }
  }

  /**
   * Translate text from source language to target language
   */
  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult> {
    // Check cache first
    const cacheKey = `${sourceLanguage}-${targetLanguage}-${text}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      cached.lastUsed = new Date().toISOString();
      return {
        translatedText: cached.targetText,
        originalText: text,
        sourceLanguage,
        targetLanguage,
        confidence: cached.confidence,
        timestamp: new Date().toISOString()
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text, sourceLanguage, targetLanguage }
      });

      if (error) throw error;

      // Cache the result
      this.cache.set(cacheKey, {
        id: crypto.randomUUID(),
        sourceText: text,
        targetText: data.translatedText,
        sourceLanguage,
        targetLanguage,
        confidence: data.confidence,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error('Translation failed:', error);
      // Fallback to original text
      return {
        translatedText: text,
        originalText: text,
        sourceLanguage,
        targetLanguage,
        confidence: 0.0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Translate multiple texts in batch
   */
  async batchTranslate(
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<BatchTranslationResult> {
    const startTime = Date.now();
    
    const translations = await Promise.all(
      texts.map(text => this.translateText(text, sourceLanguage, targetLanguage))
    );

    const processingTime = Date.now() - startTime;
    
    return {
      translations,
      totalCost: texts.length * 0.02, // Mock cost calculation
      processingTime
    };
  }

  /**
   * Auto-detect and translate text
   */
  async autoTranslate(text: string, targetLanguage: string = 'en'): Promise<TranslationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text, targetLanguage }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Auto-translation failed:', error);
      // Fallback
      return {
        translatedText: text,
        originalText: text,
        sourceLanguage: 'unknown',
        targetLanguage,
        confidence: 0.0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get cached translations for reporting
   */
  getCachedTranslations(): CachedTranslation[] {
    return Array.from(this.cache.values()).sort((a, b) => 
      new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    );
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      totalEntries: this.cache.size,
      totalCost: Array.from(this.cache.values()).length * 0.02,
      lastClearDate: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const translationService = new TranslationServiceMock();

// Export types and service
export default translationService;