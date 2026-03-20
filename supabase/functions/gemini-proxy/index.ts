import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    const { action, payload } = await req.json()
    
    let model = "gemini-3.1-flash-lite-preview"
    let endpoint = "generateContent"
    
    if (action === 'generateAudio') {
        model = "gemini-2.5-flash-preview-tts"
    }

    const url = `${GEMINI_API_URL}/${model}:${endpoint}?key=${GEMINI_API_KEY}`

    // Send ONLY the payload to Gemini, not the {action, payload} wrapper
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    
    if (!response.ok) {
        console.error(`Gemini API Error (${response.status}):`, JSON.stringify(data));
        return new Response(JSON.stringify({ error: data.error?.message || "Gemini API Error" }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            status: response.status
        })
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200
    })

  } catch (error) {
    console.error("Proxy Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 400
    })
  }
})
