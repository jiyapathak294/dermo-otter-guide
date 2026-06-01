import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile, addToBuyList, removeFromBuyList, Product as ProfileProduct } from "@/lib/profile";
import { Search, Loader2, ExternalLink, AlertTriangle, Plus, Trash2, SlidersHorizontal, ArrowDownNarrowWide, Star } from "lucide-react";
import { DermoLogo } from "@/components/DermoLogo";

type Product = {
  name: string; brand: string; retailer: string; key_ingredients: string[];
  price_range: string; why_recommended: string; warning: string | null; search_url: string;
  image?: string; price?: string; product_link?: string; source?: string;
};

const GREEN = "#3a8a5e";
const GREEN_LIGHT = "#5fa97c";

const RECOMMENDED: Product[] = [
  { name: "Hydrating Facial Cleanser", brand: "CeraVe", retailer: "Amazon", key_ingredients: ["Ceramides","Hyaluronic Acid"], price_range: "$15", why_recommended: "Gentle daily cleanser for most skin types.", warning: null, search_url: "https://www.amazon.com/s?k=cerave+hydrating+facial+cleanser", image: "https://m.media-amazon.com/images/I/61IjzpvE7DL._SL1500_.jpg" },
  { name: "Daily Moisturizing Lotion", brand: "CeraVe", retailer: "Amazon", key_ingredients: ["Ceramides","Hyaluronic Acid"], price_range: "$17", why_recommended: "Lightweight all-day hydration.", warning: null, search_url: "https://www.amazon.com/s?k=cerave+daily+moisturizing+lotion", image: "https://m.media-amazon.com/images/I/71uG7zlMRzL._SL1500_.jpg" },
  { name: "Mineral Sunscreen SPF 50", brand: "EltaMD", retailer: "Amazon", key_ingredients: ["Zinc Oxide","Niacinamide"], price_range: "$41", why_recommended: "Derm-favorite, lightweight, tinted.", warning: null, search_url: "https://www.amazon.com/s?k=eltamd+uv+clear+spf+46", image: "https://m.media-amazon.com/images/I/61tx2DyMlSL._SL1500_.jpg" },
  { name: "Niacinamide 10% + Zinc 1%", brand: "The Ordinary", retailer: "Sephora", key_ingredients: ["Niacinamide","Zinc"], price_range: "$8", why_recommended: "Targets pores, oiliness, blemishes.", warning: null, search_url: "https://www.sephora.com/search?keyword=ordinary+niacinamide", image: "https://www.sephora.com/productimages/sku/s2118695-main-zoom.jpg" },
];

export const ProductsTab = ({ initialQuery }: { initialQuery?: string }) => {
  const [q, setQ] = useState(initialQuery || "");
  const [results, setResults] = useState<Product[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyList, setBuyList] = useState<ProfileProduct[]>(loadProfile()?.buyList || []);

  useEffect(() => { if (initialQuery) search(initialQuery); }, [initialQuery]);

  const search = async (query?: string) => {
    const text = (query ?? q).trim();
    if (!text) return;
    setLoading(true); setError(null); setResults([]); setSearched(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const { data, error } = await supabase.functions.invoke("product-search", { body: { query: text, profile: loadProfile() } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data.results || []);
    } catch (e: any) {
      if (e.name === "AbortError") setError("Search timed out. Try again.");
      else setError(e.message);
    } finally { clearTimeout(timeout); setLoading(false); }
  };

  const clearSearch = () => { setQ(""); setResults([]); setSearched(false); setError(null); };

  const productKey = (p: Product) => `${p.brand}-${p.name}`.toLowerCase().replace(/\s+/g, "-");
  const handleAddBuy = (p: Product) => {
    const next = addToBuyList({ id: productKey(p), name: p.name, brand: p.brand, retailer: p.source || p.retailer, url: p.product_link || p.search_url, image: p.image, price: p.price || p.price_range });
    setBuyList(next.buyList || []);
  };

  return (
    <div className="relative min-h-full bg-white">
      <div className="px-5 pt-7 pb-5 flex items-center gap-3 bg-white">
        <DermoLogo color={GREEN} size={42} />
        <h1 className="font-heading text-[34px] text-foreground">Find Products</h1>
      </div>

      <div
        className="px-4 pt-5 pb-10 space-y-4 rounded-t-[28px] min-h-[80vh]"
        style={{ background: `linear-gradient(180deg, ${GREEN_LIGHT} 0%, ${GREEN} 100%)` }}
      >
        {/* Search bar */}
        <div className="flex items-center gap-2 rounded-full bg-white pl-5 pr-2 py-2 shadow-soft">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="e.g. salicylic acid cleanser for acne"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button onClick={() => search()} className="h-10 w-10 rounded-full flex items-center justify-center text-white" style={{ background: GREEN }}>
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Results card */}
        <div className="rounded-[26px] bg-white p-5 shadow-soft min-h-[60vh]">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl text-foreground">
              {searched ? "Top Results" : "Recommended"}
            </h2>
            {searched && (
              <button onClick={clearSearch} className="text-xs font-bold text-foreground/70 underline">Clear</button>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button className="rounded-full border border-foreground/80 px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5">
              FILTER <SlidersHorizontal className="h-3 w-3" />
            </button>
            <button className="rounded-full border border-foreground/80 px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5">
              SORT BY <ArrowDownNarrowWide className="h-3 w-3" />
            </button>
          </div>

          {loading && <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin" stroke={GREEN} /></div>}
          {error && <div className="mt-3 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          {(() => {
            const display = searched ? results : RECOMMENDED;
            return (
              <>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {display.map((p, i) => (
                    <div key={i} className="flex flex-col">
                      <div className="aspect-square rounded-[22px] overflow-hidden bg-spa-mist">
                        {p.image ? (
                          <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-b from-baby-blue/40 to-spa-mist" />
                        )}
                      </div>
                      <p className="mt-2 text-[11px] font-bold tracking-wide text-foreground uppercase">{p.brand}</p>
                      <p className="text-sm text-foreground leading-tight">{p.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map((s) => <Star key={s} className="h-3 w-3" fill="#000" stroke="#000" />)}
                        <span className="text-[10px] text-muted-foreground ml-1">(rating)</span>
                      </div>
                      <a
                        href={p.product_link || p.search_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 self-start rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                        style={{ background: GREEN }}
                      >
                        {p.source || p.retailer} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                      <div className="flex gap-2 mt-1.5">
                        <button onClick={() => handleAddBuy(p)} className="text-[10px] font-semibold text-foreground/80 inline-flex items-center gap-0.5">
                          <Plus className="h-3 w-3" /> Buy list
                        </button>
                      </div>
                      {p.warning && (
                        <div className="mt-1 flex items-start gap-1 text-[10px] text-yellow-800">
                          <AlertTriangle className="h-3 w-3 flex-none mt-0.5" />
                          <span>{p.warning}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!loading && searched && results.length === 0 && !error && (
                  <div className="text-center text-muted-foreground text-sm py-12">
                    No results found. Try a different search term.
                  </div>
                )}
              </>
            );
          })()}

          {buyList.length > 0 && (
            <div className="mt-6 space-y-2 border-t border-border pt-4">
              <h3 className="font-heading text-foreground text-lg">Buy List</h3>
              {buyList.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                  {b.image ? (
                    <img src={b.image} alt={b.name} loading="lazy" className="w-12 h-12 rounded-lg object-cover bg-spa-mist flex-none" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-spa-mist flex-none" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-foreground text-sm truncate">{b.brand}</p>
                    <p className="text-xs text-muted-foreground truncate">{b.name}</p>
                  </div>
                  {b.url && <a href={b.url} target="_blank" rel="noreferrer" className="text-xs text-foreground underline">Open</a>}
                  <button onClick={() => { const n = removeFromBuyList(b.id); setBuyList(n.buyList || []); }} aria-label="Remove">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
