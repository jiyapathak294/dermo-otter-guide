import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile, addToBuyList, removeFromBuyList, Product as ProfileProduct } from "@/lib/profile";
import { Search, Loader2, ExternalLink, AlertTriangle, Check, Plus, MoreHorizontal, Trash2 } from "lucide-react";

type Product = {
  name: string; brand: string; retailer: string; key_ingredients: string[];
  price_range: string; why_recommended: string; warning: string | null; search_url: string;
};

export const ProductsTab = ({ initialQuery }: { initialQuery?: string }) => {
  const [q, setQ] = useState(initialQuery || "");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [actionsFor, setActionsFor] = useState<number | null>(null);
  const [buyList, setBuyList] = useState<ProfileProduct[]>(loadProfile()?.buyList || []);

  useEffect(() => { if (initialQuery) search(initialQuery); }, [initialQuery]);

  const search = async (query?: string) => {
    const text = (query ?? q).trim();
    if (!text) return;
    setLoading(true); setError(null); setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("product-search", { body: { query: text, profile: loadProfile() } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data.results || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const productKey = (p: Product) => `${p.brand}-${p.name}`.toLowerCase().replace(/\s+/g, "-");

  const handleAddBuy = (p: Product) => {
    const next = addToBuyList({ id: productKey(p), name: p.name, brand: p.brand, retailer: p.retailer, url: p.search_url });
    setBuyList(next.buyList || []);
    setActionsFor(null);
  };
  const handleRemoveBuy = (id: string) => {
    const next = removeFromBuyList(id);
    setBuyList(next.buyList || []);
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
        <button onClick={() => search()} className="h-12 w-12 rounded-2xl bg-baby-blue flex items-center justify-center text-white"><Search className="h-5 w-5" /></button>
      </div>

      {loading && <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-navy" /></div>}
      {error && <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="space-y-3">
        {results.map((p, i) => {
          const isSel = selected === i;
          return (
            <div key={i} className={`relative rounded-2xl bg-white border p-4 shadow-soft transition-all ${isSel ? "border-navy ring-2 ring-baby-blue" : "border-border"}`}>
              <button onClick={() => setSelected(isSel ? null : i)} className="absolute top-3 left-3 h-6 w-6 rounded-full border-2 border-navy bg-white flex items-center justify-center transition-all">
                {isSel && <Check className="h-4 w-4 text-navy animate-scale-in" strokeWidth={3} />}
              </button>
              <div className="pl-9">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-heading text-navy truncate">{p.brand}</p>
                    <p className="text-sm text-foreground">{p.name}</p>
                  </div>
                  <a href={p.search_url} target="_blank" rel="noreferrer" aria-label="Open"><ExternalLink className="h-4 w-4 text-muted-foreground" /></a>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-baby-blue text-white">{p.retailer}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground">{p.price_range}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Key: {p.key_ingredients.join(", ")}</p>
                <p className="text-sm mt-2">{p.why_recommended}</p>
                {p.warning && (
                  <div className="mt-2 flex gap-1 text-xs text-yellow-800 bg-yellow-50 p-2 rounded-lg">
                    <AlertTriangle className="h-4 w-4 flex-none" /><span>{p.warning}</span>
                  </div>
                )}
                {isSel && (
                  <div className="mt-3 flex items-center gap-2 animate-fade-in">
                    <a href={p.search_url} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-navy text-white text-xs font-semibold py-2 text-center">
                      Find Online
                    </a>
                    <button onClick={() => setActionsFor(actionsFor === i ? null : i)} className="rounded-full bg-baby-blue h-9 w-9 flex items-center justify-center">
                      <MoreHorizontal className="h-4 w-4 text-white" />
                    </button>
                  </div>
                )}
                {actionsFor === i && (
                  <div className="mt-2 rounded-2xl border border-border bg-white p-2 shadow-soft animate-fade-in space-y-1">
                    <button className="w-full text-left text-sm py-2 px-3 rounded-lg hover:bg-spa-mist">Move/replace routine step</button>
                    <button className="w-full text-left text-sm py-2 px-3 rounded-lg hover:bg-spa-mist">Analyze ingredients</button>
                    <button onClick={() => handleAddBuy(p)} className="w-full text-left text-sm py-2 px-3 rounded-lg hover:bg-spa-mist flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add to Buy List
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {buyList.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-heading text-navy text-lg">Buy List</h3>
          {buyList.map((b) => (
            <div key={b.id} className="flex items-center gap-3 bg-white rounded-2xl border border-border p-3">
              <div className="flex-1 min-w-0">
                <p className="font-heading text-navy text-sm truncate">{b.brand}</p>
                <p className="text-xs text-muted-foreground truncate">{b.name}</p>
              </div>
              {b.url && <a href={b.url} target="_blank" rel="noreferrer" className="text-xs text-navy underline">Open</a>}
              <button onClick={() => handleRemoveBuy(b.id)} aria-label="Remove"><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
