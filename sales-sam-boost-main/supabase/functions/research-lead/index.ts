import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call Lovable AI to research the company
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an AI research agent for a sales team. Research companies and provide actionable insights for outreach.`
          },
          {
            role: 'user',
            content: `Research ${companyName} and provide: 
            1. Company overview and industry
            2. Potential pain points this company might have
            3. Key decision makers (if public info)
            4. Recent news or developments
            5. Suggested outreach angle
            
            Format as JSON with keys: overview, painPoints, decisionMakers, recentNews, outreachAngle`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const researchContent = data.choices[0].message.content;

    // Parse the AI response
    let research;
    try {
      research = JSON.parse(researchContent);
    } catch {
      // If not valid JSON, store as raw text
      research = {
        overview: researchContent,
        painPoints: [],
        decisionMakers: [],
        recentNews: '',
        outreachAngle: ''
      };
    }

    console.log('Research completed for:', companyName);

    return new Response(
      JSON.stringify({ success: true, research }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in research-lead:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});