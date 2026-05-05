const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { productOrIngredients, image, profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const system = `You are Dermo AI's Ingredient Intelligence Engine.
You receive either a product name, an ingredient list, OR a photo of a skincare/hair/nail product (label, ingredients panel, or barcode).
First, identify the product (brand + name) and read the ingredients via vision/OCR.
Then output STRICT JSON:
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
- "red" if user is allergic/sensitive OR unsafe given pregnancy/breastfeeding.
- "yellow" for caution (irritation, photosensitivity).
- "green" for safe and beneficial for this user.
- Verdict = UNSAFE if ANY red. CAUTION if any yellow but no red. SAFE otherwise.
- If goals don't match (e.g. user wants brightening, product is for acne), call it out in summary.
- Never diagnose. End summary with "Dermo AI does not replace professional medical care."`;

    const userContent: any[] = [];
    if (productOrIngredients) userContent.push({ type: "text", text: `Analyze:\n${productOrIngredients}` });
    if (image) userContent.push({ type: "image_url", image_url: { url: image } });
    if (userContent.length === 0) throw new Error("Provide text or image");

    userContent.unshift({ type: "text", text: `User profile:\n${JSON.stringify(profile, null, 2)}` });

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: userContent }],
        response_format: { type: "json_object" },
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit, try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) throw new Error(`AI error ${r.status}: ${await r.text()}`);

    const data = await r.json();
    const analysis = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return new Response(JSON.stringify({ analysis }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
