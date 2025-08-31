import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, targetLanguage = 'en', sourceLanguage } = await req.json();

    if (!text) {
      throw new Error('Text is required for translation');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Use OpenAI for translation with language detection
    const systemPrompt = sourceLanguage 
      ? `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Return only the translated text without any explanation.`
      : `Detect the language of the following text and translate it to ${targetLanguage}. Return the translation in this JSON format: {"detectedLanguage": "language_code", "translatedText": "translation", "confidence": 0.95}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    let translationResult;
    if (sourceLanguage) {
      // Direct translation
      translationResult = {
        translatedText: result,
        originalText: text,
        sourceLanguage,
        targetLanguage,
        confidence: 0.90,
        timestamp: new Date().toISOString()
      };
    } else {
      // Parse JSON response with language detection
      try {
        const parsed = JSON.parse(result);
        translationResult = {
          translatedText: parsed.translatedText,
          originalText: text,
          sourceLanguage: parsed.detectedLanguage,
          targetLanguage,
          confidence: parsed.confidence || 0.85,
          timestamp: new Date().toISOString()
        };
      } catch {
        // Fallback if JSON parsing fails
        translationResult = {
          translatedText: result,
          originalText: text,
          sourceLanguage: 'unknown',
          targetLanguage,
          confidence: 0.75,
          timestamp: new Date().toISOString()
        };
      }
    }

    console.log('Translation completed:', translationResult);

    return new Response(
      JSON.stringify(translationResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});