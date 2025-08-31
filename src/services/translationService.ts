// Mock Translation Service (will be replaced with Google Translate API later)
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
    // Mock language detection
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simple mock detection based on character patterns
    if (/[\u0900-\u097F]/.test(text)) {
      return { language: 'ne', confidence: 0.95 };
    }
    
    if (/[\u1780-\u17FF]/.test(text)) {
      return { language: 'km', confidence: 0.95 };
    }
    
    return { language: 'en', confidence: 0.90 };
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

    // Mock translation delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    let translatedText = text;
    let confidence = 0.75;

    // Try to find translation in mock data
    const sourceMock = this.mockTranslations[sourceLanguage];
    if (sourceMock && sourceMock[targetLanguage]) {
      const lowerText = text.toLowerCase();
      if (sourceMock[targetLanguage][lowerText]) {
        translatedText = sourceMock[targetLanguage][lowerText];
        confidence = 0.95;
      } else {
        // Mock translation by adding prefix
        translatedText = `[${targetLanguage.toUpperCase()}] ${text}`;
        confidence = 0.70;
      }
    } else {
      // Fallback mock translation
      translatedText = `[TRANSLATED to ${targetLanguage.toUpperCase()}] ${text}`;
      confidence = 0.65;
    }

    const result: TranslationResult = {
      translatedText,
      originalText: text,
      sourceLanguage,
      targetLanguage,
      confidence,
      timestamp: new Date().toISOString()
    };

    // Cache the result
    this.cache.set(cacheKey, {
      id: crypto.randomUUID(),
      sourceText: text,
      targetText: translatedText,
      sourceLanguage,
      targetLanguage,
      confidence,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    });

    return result;
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
    const detection = await this.detectLanguage(text);
    
    if (detection.language === targetLanguage) {
      return {
        translatedText: text,
        originalText: text,
        sourceLanguage: detection.language,
        targetLanguage,
        confidence: 1.0,
        timestamp: new Date().toISOString()
      };
    }

    return this.translateText(text, detection.language, targetLanguage);
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