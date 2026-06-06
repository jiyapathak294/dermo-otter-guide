const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { image } = await req.json();
    if (!image) throw new Error("image required");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const system = `You are a visual product lens for SKINCARE, HAIRCARE, and NAILCARE products only.

FIRST decide if the image actually shows such a consumer product (a bottle, jar, tube, palette, tool, or its label/packaging). If the image instead shows a person, face, body part, animal, food, scenery, random object, screenshot, gibberish, or any non-product subject, return EXACTLY:
{ "is_product": false, "candidates": [] }
DO NOT invent products in that case.

If it IS a real skincare/hair/nail product, identify up to 5 most likely matching real, currently-sold consumer products, ordered by confidence (highest first). Return STRICT JSON:
{
  "is_product": true,
  "candidates": [
    {
      "brand": string,
      "name": string,
      "category": string,
      "size": string,
      "confidence": number,   // 0-1
      "summary": string       // 1 short sentence describing the product
    }
  ]
}
Never invent obviously fake brands. Only return is_product:true when you can clearly see product packaging.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: [
            { type: "text", text: "Identify candidate products in this image." },
            { type: "image_url", image_url: { url: image } },
          ] },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit, try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) throw new Error(`AI error ${r.status}: ${await r.text()}`);

    const data = await r.json();
    const out = JSON.parse(data.choices?.[0]?.message?.content || "{}");

    // Enrich with product image via SerpAPI if available
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    if (SERPAPI_KEY && Array.isArray(out.candidates)) {
      out.candidates = await Promise.all(out.candidates.map(async (c: any) => {
        try {
          const q = encodeURIComponent(`${c.brand} ${c.name}`);
          const url = `https://serpapi.com/search.json?engine=google_shopping&q=${q}&num=1&api_key=${SERPAPI_KEY}`;
          const sr = await fetch(url);
          if (!sr.ok) return c;
          const sd = await sr.json();
          const top = sd.shopping_results?.[0];
          if (top) return { ...c, image: top.thumbnail, price: top.price, product_link: top.product_link || top.link, source: top.source };
        } catch (_) { /* ignore */ }
        return c;
      }));
    }

    return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
