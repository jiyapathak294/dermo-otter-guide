// Public helper: reports whether an auth user with this email exists.
// Used by the sign-in page to distinguish "no account" from "wrong password".
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ exists: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);
    // Page through users, filtered by email server-side.
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      // @ts-ignore filter is supported by the admin API
      filter: `email.eq.${email.toLowerCase()}`,
    });
    if (error) throw error;
    const exists = (data?.users?.length ?? 0) > 0;
    return new Response(JSON.stringify({ exists }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ exists: false, error: e instanceof Error ? e.message : "unknown" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
