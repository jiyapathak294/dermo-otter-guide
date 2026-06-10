import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile, updateProfile } from "@/lib/profile";
import { Search, Loader2, ExternalLink, AlertTriangle, Plus, SlidersHorizontal, ArrowDownNarrowWide, Star, X, CheckCircle2 } from "lucide-react";
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

const productKey = (p: Product) => `${p.brand}-${p.name}`.toLowerCase().replace(/\s+/g, "-");
const slotKey = (focus: string, time: string, stepName: string) =>
  `${focus.toLowerCase()}:${time}:${stepName}`.replace(/\s+/g, "-").toLowerCase();

// Product image with graceful fallback to a branded tile if the URL fails
const ProductImage = ({ product }: { product: Product }) => {
  const [failed, setFailed] = useState(false);
  const showImg = !!product.image && !failed;
  return (
    <div className="aspect-square rounded-[22px] overflow-hidden bg-spa-mist relative">
      {showImg ? (
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-baby-blue/40 to-spa-mist flex flex-col items-center justify-center text-foreground/60 px-2 text-center gap-1">
          <span className="text-[15px] font-heading uppercase tracking-wide">{product.brand}</span>
          <span className="text-[9px] text-foreground/40 leading-tight line-clamp-2">{product.name}</span>
        </div>
      )}
    </div>
  );
};

type Slot = { focus: "Skin" | "Hair" | "Nails"; time: string; stepName: string; key: string };

// ---- Assign product to routine dialog ----
const AssignDialog = ({ product, onClose }: { product: Product; onClose: () => void }) => {
  const [confirmReplace, setConfirmReplace] = useState<Slot | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const profile = loadProfile();
  const routine = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("dermo.routine.v1") || "null"); }
    catch { return null; }
  }, []);
  const selected: Record<string, any> = profile?.selectedProducts || {};

  const slots: Slot[] = useMemo(() => {
    const out: Slot[] = [];
    if (!routine) return out;
    (routine.skin?.morning || []).forEach((s: any) => out.push({ focus: "Skin", time: "morning", stepName: s.step, key: slotKey("Skin", "morning", s.step) }));
    (routine.skin?.night || []).forEach((s: any) => out.push({ focus: "Skin", time: "night", stepName: s.step, key: slotKey("Skin", "night", s.step) }));
    (routine.hair?.weekly || []).forEach((s: any) => out.push({ focus: "Hair", time: "weekly", stepName: s.step, key: slotKey("Hair", "weekly", s.step) }));
    (routine.nails?.daily || []).forEach((s: any) => out.push({ focus: "Nails", time: "daily", stepName: s.step, key: slotKey("Nails", "daily", s.step) }));
    return out;
  }, [routine]);

  const assignTo = (s: Slot) => {
    const existing = selected[s.key];
    if (existing) {
      setConfirmReplace(s);
      return;
    }
    doAssign(s);
  };

  const doAssign = (s: Slot) => {
    const next = {
      ...(selected || {}),
      [s.key]: {
        id: productKey(product),
        name: product.name,
        brand: product.brand,
        image: product.image,
        url: product.product_link || product.search_url,
        price: product.price || product.price_range,
      },
    };
    updateProfile({ selectedProducts: next });
    window.dispatchEvent(new CustomEvent("dermo:profile-updated"));
    setSuccess(`Added to ${s.focus} · ${s.time} — ${s.stepName}`);
    setConfirmReplace(null);
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[400px] bg-white rounded-t-3xl sm:rounded-3xl p-5 max-h-[80vh] overflow-y-auto animate-[slideUp_0.25s_ease-out] sm:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-xl text-foreground">Add as chosen product</h3>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-full bg-spa-mist flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-spa-mist">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-14 w-14 rounded-xl object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-white" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase font-bold text-muted-foreground">{product.brand}</p>
            <p className="text-sm font-heading truncate">{product.name}</p>
          </div>
        </div>

        {success && (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-3 text-sm text-green-800 inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {success}
          </div>
        )}

        {confirmReplace && (
          <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4 mb-3">
            <div className="flex items-center gap-2 text-yellow-900 font-bold mb-1">
              <AlertTriangle className="h-4 w-4" /> Replace existing product?
            </div>
            <p className="text-xs text-yellow-900 mb-3">
              <span className="font-semibold">{confirmReplace.focus} · {confirmReplace.time} — {confirmReplace.stepName}</span> already has{" "}
              <span className="font-semibold">{selected[confirmReplace.key]?.brand} {selected[confirmReplace.key]?.name}</span>.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmReplace(null)} className="flex-1 rounded-xl bg-white border border-border py-2 text-xs font-bold">
                Cancel
              </button>
              <button onClick={() => doAssign(confirmReplace)} className="flex-1 rounded-xl bg-yellow-600 text-white py-2 text-xs font-bold">
                Replace
              </button>
            </div>
          </div>
        )}

        {!success && !confirmReplace && (
          <>
            <p className="text-xs text-muted-foreground mb-2">Pick a routine step to assign this product to:</p>
            {slots.length === 0 ? (
              <div className="rounded-2xl bg-spa-mist p-4 text-sm text-foreground/80">
                No routine yet. Generate a routine first, or add a custom step from the Routine page (+ button).
              </div>
            ) : (
              <ul className="space-y-2">
                {slots.map((s) => {
                  const existing = selected[s.key];
                  return (
                    <li key={s.key}>
                      <button
                        onClick={() => assignTo(s)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border hover:bg-spa-mist text-left transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                            {s.focus} · {s.time}
                          </p>
                          <p className="text-sm font-heading text-foreground truncate">{s.stepName}</p>
                          {existing && (
                            <p className="text-[11px] text-yellow-700 mt-0.5">Currently: {existing.brand} {existing.name}</p>
                          )}
                        </div>
                        <Plus className="h-4 w-4 text-foreground/60" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-4 rounded-2xl bg-baby-blue/30 p-3 text-xs text-foreground/80">
              Doesn't fit your routine? Open the <span className="font-bold">Routine</span> page and tap the <span className="font-bold">+</span> button to add a new step for it.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const ProductsTab = ({ initialQuery }: { initialQuery?: string }) => {
  const [q, setQ] = useState(initialQuery || "");
  const [results, setResults] = useState<Product[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<Product | null>(null);
  const [recommended, setRecommended] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem("dermo.recommended.v1");
      if (cached) return JSON.parse(cached);
    } catch {}
    return RECOMMENDED;
  });

  useEffect(() => { if (initialQuery) search(initialQuery); }, [initialQuery]);

  // Populate recommended with real product images via SerpAPI if we haven't cached yet
  useEffect(() => {
    if (initialQuery) return;
    if (localStorage.getItem("dermo.recommended.v1")) return;
    (async () => {
      try {
        const profile = loadProfile();
        const focus = profile?.focus?.[0] || "Skin";
        const query = focus === "Hair" ? "haircare essentials"
          : focus === "Nails" ? "nailcare essentials"
          : "everyday skincare essentials";
        const { data } = await supabase.functions.invoke("product-search", { body: { query, profile } });
        if (Array.isArray(data?.results) && data.results.length) {
          localStorage.setItem("dermo.recommended.v1", JSON.stringify(data.results));
          setRecommended(data.results);
        }
      } catch {}
    })();
  }, [initialQuery]);

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
          <button onClick={() => search()} className="h-10 w-10 rounded-full flex items-center justify-center text-white hover:opacity-90" style={{ background: GREEN }}>
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
            <button className="rounded-full border border-foreground/80 px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-foreground hover:text-white transition-colors">
              FILTER <SlidersHorizontal className="h-3 w-3" />
            </button>
            <button className="rounded-full border border-foreground/80 px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-foreground hover:text-white transition-colors">
              SORT BY <ArrowDownNarrowWide className="h-3 w-3" />
            </button>
          </div>

          {loading && <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin" stroke={GREEN} /></div>}
          {error && <div className="mt-3 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          {(() => {
            const display = searched ? results : recommended;
            return (
              <>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {display.map((p, i) => (
                    <div key={i} className="flex flex-col animate-step-in" style={{ animationDelay: `${i * 80}ms` }}>
                      <ProductImage product={p} />

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
                        className="mt-1 inline-flex items-center gap-1 self-start rounded-full px-3 py-1 text-[11px] font-semibold text-white hover:opacity-90"
                        style={{ background: GREEN }}
                      >
                        {p.source || p.retailer} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                      <div className="flex gap-2 mt-1.5">
                        <button
                          onClick={() => setAssignTarget(p)}
                          className="text-[10px] font-semibold text-foreground/80 inline-flex items-center gap-0.5 hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" /> Add as chosen product
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
        </div>
      </div>

      {assignTarget && <AssignDialog product={assignTarget} onClose={() => setAssignTarget(null)} />}
    </div>
  );
};
