const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function enrichWithSerpapi(items: any[]) {
  const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
  if (!SERPAPI_KEY) return items;

  return await Promise.all(
    items.map(async (it) => {
      try {
        const q = encodeURIComponent(`${it.brand} ${it.name}`);
        const url = `https://serpapi.com/search.json?engine=google_shopping&q=${q}&num=3&api_key=${SERPAPI_KEY}`;
        const r = await fetch(url);
        if (!r.ok) return it;
        const data = await r.json();
        const top = data.shopping_results?.[0];
        if (top) {
          return {
            ...it,
            image: top.thumbnail || it.image,
            price: top.price || it.price_range,
            product_link: top.product_link || top.link || it.search_url,
            source: top.source || it.retailer,
          };
        }
      } catch (e) {
        console.error("serpapi error", e);
      }
      return it;
    })
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query, profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const system = `You are DermaSense AI's product recommender.
Given a user query, suggest 6 real, currently-available skincare/hair/nail products from trusted retailers (Sephora, Ulta, Amazon, dermatologist brands, K-beauty sites).
Filter out anything unsafe for this user (allergies, sensitivities, pregnancy).
Return STRICT JSON:
{
  "results": [
    {
      "name": string,
      "brand": string,
      "retailer": "Sephora"|"Ulta"|"Amazon"|"Brand Site"|"Other",
      "key_ingredients": [string],
      "price_range": string,
      "why_recommended": string,
      "warning": string | null,
      "search_url": string
    }
  ]
}`;
    const userMsg = `User profile:\n${JSON.stringify(profile, null, 2)}\n\nQuery: ${query}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: userMsg }],
        response_format: { type: "json_object" },
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) throw new Error(`AI error ${r.status}`);

    const data = await r.json();
    const out = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    out.results = await enrichWithSerpapi(out.results || []);
    return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
