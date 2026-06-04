const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

console.log("Gemini Proxy Function Started");

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  if (!GEMINI_API_KEY) {
    console.error("FATAL: GEMINI_API_KEY environment variable is not set.");
    return new Response(JSON.stringify({ error: "Server Configuration Error: API Key Missing" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body = await req.json().catch(e => {
        console.error("Failed to parse request JSON:", e.message);
        return null;
    });

    if (!body || !body.action || !body.payload) {
        return new Response(JSON.stringify({ error: "Invalid request: missing action or payload" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    const { action, payload } = body;
    
    let model = "gemini-3.1-flash-lite-preview"
    let endpoint = "generateContent"
    
    if (action === 'generateAudio') {
        model = "gemini-2.5-flash-preview-tts"
    }

    const url = `${GEMINI_API_URL}/${model}:${endpoint}?key=${GEMINI_API_KEY}`

    console.log(`Forwarding ${action} to Gemini: ${model}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        
        if (!response.ok) {
            console.error(`Gemini API Error (${response.status}):`, JSON.stringify(data));
            return new Response(JSON.stringify({ 
                error: data.error?.message || "Gemini API Error",
                status: response.status,
                details: data.error
            }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                status: response.status
            })
        }

        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          status: 200
        })
    } catch (e) {
        if (e.name === 'AbortError') {
            console.error("Gemini API Request Timed Out (25s)");
            return new Response(JSON.stringify({ error: "Upstream Timeout: Gemini took too long to respond." }), {
                status: 504,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
        throw e;
    }

  } catch (error) {
    console.error("Proxy Function Exception:", error.message);
    if (error.stack) console.error(error.stack);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500
    })
  }
})
