import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile } from "@/lib/profile";
import { Search, Loader2, ExternalLink, AlertTriangle } from "lucide-react";

type Product = {
  name: string; brand: string; retailer: string; key_ingredients: string[];
  price_range: string; why_recommended: string; warning: string | null; search_url: string;
};

export const ProductsTab = () => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("product-search", { body: { query: q, profile: loadProfile() } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data.results || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="px-5 pt-6 pb-6 space-y-4">
      <h2 className="font-heading text-2xl text-navy">Find Products</h2>
      <div className="flex gap-2">
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="e.g. salicylic acid cleanser for acne"
          className="flex-1 rounded-2xl border-2 border-navy px-4 py-3 text-sm outline-none focus:border-jazz-blue"
        />
        <button onClick={search} className="h-12 w-12 rounded-2xl bg-baby-blue flex items-center justify-center text-navy"><Search className="h-5 w-5" /></button>
      </div>

      {loading && <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-navy" /></div>}
      {error && <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="space-y-3">
        {results.map((p, i) => (
          <a key={i} href={p.search_url} target="_blank" rel="noreferrer" className="block rounded-2xl bg-white border border-border p-4 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-heading text-navy">{p.brand}</p>
                <p className="text-sm text-foreground">{p.name}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-baby-blue text-navy">{p.retailer}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground">{p.price_range}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Key: {p.key_ingredients.join(", ")}</p>
            <p className="text-sm mt-2">{p.why_recommended}</p>
            {p.warning && (
              <div className="mt-2 flex gap-1 text-xs text-yellow-800 bg-yellow-50 p-2 rounded-lg">
                <AlertTriangle className="h-4 w-4 flex-none" /><span>{p.warning}</span>
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
};
