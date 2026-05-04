const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { productOrIngredients, profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const system = `You are DermaSense AI's Ingredient Intelligence Engine.
Given a product name OR raw ingredient list, output STRICT JSON:
{
  "product": string,
  "verdict": "SAFE" | "CAUTION" | "UNSAFE",
  "summary": string,
  "ingredients": [
    { "name": string, "purpose": string, "flag": "green"|"yellow"|"red", "note": string }
  ],
  "alternatives": [string]
}
Rules:
- "red" if user is allergic/sensitive to it OR it's unsafe given pregnancy/breastfeeding.
- "yellow" for caution (potential irritation, sun sensitivity).
- "green" for safe and beneficial for this user.
- Verdict = UNSAFE if ANY red. CAUTION if any yellow but no red. SAFE otherwise.
Never give medical diagnosis. Always end summary noting "DermaSense AI does not replace professional medical care."`;

    const userMsg = `User profile:\n${JSON.stringify(profile, null, 2)}\n\nAnalyze this:\n${productOrIngredients}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: userMsg }],
        response_format: { type: "json_object" },
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit, try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) throw new Error(`AI error ${r.status}`);

    const data = await r.json();
    const analysis = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return new Response(JSON.stringify({ analysis }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
