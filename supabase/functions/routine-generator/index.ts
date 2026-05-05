const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UNSAFE_PREGNANCY = ["retinol", "retinoid", "retinoids", "tretinoin", "adapalene", "tazarotene", "high-dose salicylic acid", "hydroquinone"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const safetyNotes: string[] = [];
    if (profile?.lifeStage === "Pregnant" || profile?.lifeStage === "Breastfeeding") {
      safetyNotes.push(`User is ${profile.lifeStage}. NEVER suggest: ${UNSAFE_PREGNANCY.join(", ")}.`);
    }
    const sens = (profile?.sensitivities || []).filter((s: string) => s !== "None" && s !== "Unsure");
    if (sens.length) safetyNotes.push(`Hard-block these ingredients: ${sens.join(", ")}.`);

    const system = `You are a board-certified dermatology AI for Dermo AI.
Generate safe, personalized skin/hair/nail routines as STRICT JSON only.
Rules:
- Never give medical diagnosis.
- Adapt complexity: minimal=1-3 steps, moderate=4-5, detailed=6+.
- For moderate/detailed routines, include toners where appropriate (don't avoid them by default).
- Explain WHY each step is included plainly.
- Use the user's skinGoals/hairGoals/nailGoals to drive ingredient choice.
${safetyNotes.join("\n")}
Output JSON shape:
{
  "skin": { "morning": [{"step":string,"product_type":string,"ingredient":string,"why":string}], "night": [...] },
  "hair":  { "weekly": [...] },
  "nails": { "daily":  [...] },
  "warnings": [string]
}
Only include sections matching profile.focus. Omit others.`;

    const userMsg = `User profile:\n${JSON.stringify(profile, null, 2)}\nGenerate the routine JSON now.`;

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
    if (!r.ok) throw new Error(`AI error ${r.status}: ${await r.text()}`);

    const data = await r.json();
    const routine = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return new Response(JSON.stringify({ routine }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
