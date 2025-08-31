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
    const { 
      content, 
      processingType = 'analyze',
      submissionType = 'general_report'
    } = await req.json();

    if (!content) {
      throw new Error('Content is required for AI processing');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = '';
    let requestedAnalysis = [];

    // Configure prompts based on processing type
    switch (processingType) {
      case 'summarize':
        systemPrompt = `You are an expert at analyzing humanitarian and child protection reports. 
        Summarize the following content concisely, highlighting key information, survivor counts, 
        incidents, and action items. Return your response as a JSON object with this structure:
        {
          "summary": "brief summary",
          "keyPoints": ["point1", "point2"],
          "survivorCount": number or null,
          "urgencyLevel": "low|medium|high|critical",
          "actionItems": ["action1", "action2"]
        }`;
        break;

      case 'categorize':
        systemPrompt = `Analyze and categorize this humanitarian report content. 
        Return a JSON object with:
        {
          "primaryCategory": "crisis_response|survivor_care|prevention|training|financial|other",
          "tags": ["tag1", "tag2", "tag3"],
          "sentiment": "positive|neutral|negative|mixed",
          "confidence": 0.95,
          "submissionType": "crisis_report|survivor_report|monthly_summary|financial_report|story_submission|general_report"
        }`;
        break;

      case 'extract_story':
        systemPrompt = `Extract compelling human stories and testimonials from this content for advocacy use.
        Return a JSON object with:
        {
          "stories": [
            {
              "title": "story title",
              "content": "story content",
              "impact": "positive outcome or change",
              "usableForAdvocacy": true/false,
              "sensitivityLevel": "low|medium|high"
            }
          ],
          "testimonials": ["quote1", "quote2"],
          "impactMetrics": ["metric1", "metric2"]
        }`;
        break;

      case 'detect_pii':
        systemPrompt = `Scan this content for Personally Identifiable Information (PII) that should be protected.
        Return a JSON object with:
        {
          "piiDetected": true/false,
          "piiTypes": ["names", "addresses", "phone_numbers", "email_addresses", "dates_of_birth"],
          "riskLevel": "low|medium|high",
          "recommendations": ["anonymize names", "remove specific locations"],
          "sanitizedContent": "content with PII marked as [REDACTED]"
        }`;
        break;

      case 'moderate':
        systemPrompt = `Review this content for appropriateness in a humanitarian context.
        Check for inappropriate content, misinformation, or content that violates child protection protocols.
        Return a JSON object with:
        {
          "approved": true/false,
          "issues": ["issue1", "issue2"],
          "severity": "low|medium|high|critical",
          "recommendations": ["recommendation1", "recommendation2"],
          "childProtectionConcerns": true/false
        }`;
        break;

      default: // 'analyze'
        systemPrompt = `Perform comprehensive analysis of this humanitarian/child protection content.
        Return a detailed JSON object with:
        {
          "summary": "brief summary",
          "keyInsights": ["insight1", "insight2"],
          "urgencyLevel": "low|medium|high|critical",
          "survivorCount": number or null,
          "categories": ["category1", "category2"],
          "sentiment": "positive|neutral|negative|mixed",
          "actionItems": ["action1", "action2"],
          "riskFactors": ["risk1", "risk2"],
          "confidence": 0.95,
          "recommendations": ["rec1", "rec2"]
        }`;
    }

    const startTime = Date.now();

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
          { role: 'user', content: content }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    try {
      // Parse the JSON response
      const aiAnalysis = JSON.parse(data.choices[0].message.content);
      
      const result = {
        processingType,
        submissionType,
        analysis: aiAnalysis,
        processingTime,
        confidence: aiAnalysis.confidence || 0.85,
        timestamp: new Date().toISOString(),
        model: 'gpt-4o-mini'
      };

      console.log('AI processing completed:', result);

      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (parseError) {
      // If JSON parsing fails, return raw response
      const result = {
        processingType,
        submissionType,
        analysis: {
          rawResponse: data.choices[0].message.content,
          parseError: parseError.message
        },
        processingTime,
        confidence: 0.70,
        timestamp: new Date().toISOString(),
        model: 'gpt-4o-mini'
      };

      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('AI content processing error:', error);
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