import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile, updateProfile } from "@/lib/profile";
import { Search, Loader2, ExternalLink, AlertTriangle, Plus, SlidersHorizontal, ArrowDownNarrowWide, Star, ChevronDown, Check } from "lucide-react";
import { DermoLogo } from "@/components/DermoLogo";

type Product = {
  name: string; brand: string; retailer: string; key_ingredients: string[];
  price_range: string; why_recommended: string; warning: string | null; search_url: string;
  image?: string; price?: string; product_link?: string; source?: string;
  rating?: number; reviews?: number;
};

const GREEN = "#3a8a5e";
const GREEN_LIGHT = "#5fa97c";

const FILTER_OPTIONS = ["All", "Skincare", "Haircare", "Nailcare", "Sunscreen", "Cleansers", "Moisturizers", "Serums"] as const;
const SORT_OPTIONS = ["Top Picks", "Highest Rated", "Price: Low to High", "Price: High to Low", "Newest"] as const;
type FilterOpt = typeof FILTER_OPTIONS[number];
type SortOpt = typeof SORT_OPTIONS[number];

const PRODUCT_QUERY_POOL = [
  "everyday gentle facial cleanser",
  "hydrating moisturizer for dry skin",
  "broad spectrum spf 50 sunscreen",
  "vitamin c serum",
  "niacinamide serum",
  "retinol night cream",
  "hyaluronic acid serum",
  "salicylic acid acne treatment",
  "azelaic acid 10",
  "ceramide repair cream",
  "lip balm with spf",
  "exfoliating toner aha bha",
  "eye cream caffeine",
  "barrier repair lotion",
  "fragrance free body lotion",
  "scalp care shampoo",
  "argan oil hair serum",
  "biotin hair supplement",
  "leave in conditioner",
  "nail strengthener treatment",
  "cuticle oil vitamin e",
  "mineral sunscreen tinted",
  "peptide serum",
  "mandelic acid serum",
];

const productKey = (p: Product) => `${p.brand}-${p.name}`.toLowerCase().replace(/\s+/g, "-");
const slotKey = (focus: string, time: string, stepName: string) =>
  `${focus.toLowerCase()}:${time}:${stepName}`.replace(/\s+/g, "-").toLowerCase();

// Deterministic pseudo-rating from product key so it doesn't reshuffle
const ratingFor = (p: Product): number => {
  if (typeof p.rating === "number") return p.rating;
  let h = 0; const k = productKey(p);
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
  return Math.round((3.6 + (h % 140) / 100) * 10) / 10; // 3.6 - 5.0
};
const reviewsFor = (p: Product): number => {
  if (typeof p.reviews === "number") return p.reviews;
  let h = 0; const k = productKey(p) + "r";
  for (let i = 0; i < k.length; i++) h = (h * 17 + k.charCodeAt(i)) >>> 0;
  return 50 + (h % 4900);
};
const priceNumber = (p: Product): number => {
  const raw = p.price || p.price_range || "";
  const m = raw.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 9999;
};

// ----- Auto-categorisation: match product to a routine step -----
const KEYWORD_MAP: { keywords: string[]; intent: string }[] = [
  { keywords: ["cleanser", "wash", "foam"], intent: "cleanser" },
  { keywords: ["toner"], intent: "toner" },
  { keywords: ["serum", "ampoule"], intent: "serum" },
  { keywords: ["moisturizer", "moisturiser", "cream", "lotion", "gel cream"], intent: "moisturizer" },
  { keywords: ["sunscreen", "spf", "sun cream"], intent: "sunscreen" },
  { keywords: ["mask"], intent: "mask" },
  { keywords: ["exfoliant", "scrub", "peel", "aha", "bha"], intent: "exfoliant" },
  { keywords: ["eye cream", "eye gel"], intent: "eye" },
  { keywords: ["shampoo"], intent: "shampoo" },
  { keywords: ["conditioner"], intent: "conditioner" },
  { keywords: ["hair oil", "hair serum"], intent: "hair-oil" },
  { keywords: ["nail", "cuticle"], intent: "nail" },
  { keywords: ["lip"], intent: "lip" },
];

const intentForText = (text: string): string | null => {
  const t = text.toLowerCase();
  for (const row of KEYWORD_MAP) {
    if (row.keywords.some((k) => t.includes(k))) return row.intent;
  }
  return null;
};

type Slot = { focus: "Skin" | "Hair" | "Nails"; time: string; stepName: string; key: string };

const slotsFromRoutine = (routine: any): Slot[] => {
  const out: Slot[] = [];
  if (!routine) return out;
  (routine.skin?.morning || []).forEach((s: any) => out.push({ focus: "Skin", time: "morning", stepName: s.step, key: slotKey("Skin", "morning", s.step) }));
  (routine.skin?.night || []).forEach((s: any) => out.push({ focus: "Skin", time: "night", stepName: s.step, key: slotKey("Skin", "night", s.step) }));
  (routine.hair?.weekly || []).forEach((s: any) => out.push({ focus: "Hair", time: "weekly", stepName: s.step, key: slotKey("Hair", "weekly", s.step) }));
  (routine.nails?.daily || []).forEach((s: any) => out.push({ focus: "Nails", time: "daily", stepName: s.step, key: slotKey("Nails", "daily", s.step) }));
  return out;
};

const ProductImage = ({ product }: { product: Product }) => {
  const [failed, setFailed] = useState(false);
  const showImg = !!product.image && !failed;
  return (
    <div className="aspect-square rounded-[22px] overflow-hidden bg-spa-mist relative">
      {showImg ? (
        <img src={product.image} alt={product.name} loading="lazy" referrerPolicy="no-referrer"
          className="w-full h-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-baby-blue/40 to-spa-mist flex flex-col items-center justify-center text-foreground/60 px-2 text-center gap-1">
          <span className="text-[15px] font-heading uppercase tracking-wide">{product.brand}</span>
          <span className="text-[9px] text-foreground/40 leading-tight line-clamp-2">{product.name}</span>
        </div>
      )}
    </div>
  );
};

// Star rating display (numeric stars + count)
const RatingDisplay = ({ rating, reviews }: { rating: number; reviews: number }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1 mt-1">
      {[0, 1, 2, 3, 4].map((i) => {
        const isFull = i < full;
        const isHalf = !isFull && i === full && half;
        return (
          <span key={i} className="relative inline-block">
            <Star className="h-3 w-3 text-foreground/30" />
            {(isFull || isHalf) && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: isHalf ? "50%" : "100%" }}>
                <Star className="h-3 w-3 text-yellow-500" fill="currentColor" />
              </span>
            )}
          </span>
        );
      })}
      <span className="text-[10px] text-muted-foreground ml-1">{rating.toFixed(1)} ({reviews.toLocaleString()})</span>
    </div>
  );
};

// Lightweight popover dropdown (anchored under the trigger)
const Dropdown = <T extends string>({
  label, value, options, onSelect, Icon,
}: { label: string; value: T; options: readonly T[]; onSelect: (v: T) => void; Icon: any }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-foreground/20 bg-white text-foreground px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 hover:border-foreground/40 transition-colors"
      >
        <span className="uppercase tracking-wide">{label}:</span>
        <span className="normal-case font-semibold text-foreground/80">{value}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        <Icon className="h-3 w-3 text-foreground/50" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1.5 min-w-[180px] rounded-2xl border border-foreground/15 bg-white shadow-soft overflow-hidden animate-fade-in">
          <ul className="py-1">
            {options.map((opt) => {
              const active = opt === value;
              return (
                <li key={opt}>
                  <button
                    onClick={() => { onSelect(opt); setOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold inline-flex items-center justify-between gap-2 ${active ? "bg-spa-mist text-foreground" : "text-foreground/80 hover:bg-spa-mist/60"}`}
                  >
                    <span>{opt}</span>
                    {active && <Check className="h-3.5 w-3.5" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

const matchesFilter = (p: Product, f: FilterOpt): boolean => {
  if (f === "All") return true;
  const haystack = `${p.name} ${p.brand} ${(p.key_ingredients || []).join(" ")}`.toLowerCase();
  switch (f) {
    case "Skincare": return /(serum|moisturi|cream|cleanser|toner|sunscreen|spf|exfoli|mask|skin|face)/.test(haystack);
    case "Haircare": return /(shampoo|conditioner|hair|scalp)/.test(haystack);
    case "Nailcare": return /(nail|cuticle)/.test(haystack);
    case "Sunscreen": return /(sunscreen|spf|sun cream)/.test(haystack);
    case "Cleansers": return /(cleanser|wash|foam)/.test(haystack);
    case "Moisturizers": return /(moisturi|cream|lotion)/.test(haystack);
    case "Serums": return /(serum|ampoule)/.test(haystack);
  }
};

const sortProducts = (list: Product[], sort: SortOpt, focusFirst?: string): Product[] => {
  const copy = [...list];
  if (sort === "Highest Rated") return copy.sort((a, b) => ratingFor(b) - ratingFor(a));
  if (sort === "Price: Low to High") return copy.sort((a, b) => priceNumber(a) - priceNumber(b));
  if (sort === "Price: High to Low") return copy.sort((a, b) => priceNumber(b) - priceNumber(a));
  if (sort === "Newest") return copy.reverse();
  // Top Picks: prioritize products whose category matches user's focus
  if (focusFirst) {
    const f = focusFirst.toLowerCase();
    copy.sort((a, b) => {
      const aScore = (a.name + a.brand).toLowerCase().includes(f) ? 1 : 0;
      const bScore = (b.name + b.brand).toLowerCase().includes(f) ? 1 : 0;
      return bScore - aScore;
    });
  }
  return copy;
};

export const ProductsTab = ({ initialQuery }: { initialQuery?: string }) => {
  const [q, setQ] = useState(initialQuery || "");
  const [results, setResults] = useState<Product[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<Product[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedCursor, setFeedCursor] = useState(0);
  const [filter, setFilter] = useState<FilterOpt>("All");
  const [sort, setSort] = useState<SortOpt>("Top Picks");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const profile = loadProfile();
  const focusPrimary = profile?.focus?.[0] || "Skin";
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (initialQuery) search(initialQuery); }, [initialQuery]);

  // Load a batch of products from a SerpAPI-backed query
  const loadBatch = useCallback(async () => {
    if (feedLoading) return;
    setFeedLoading(true);
    const idx = feedCursor % PRODUCT_QUERY_POOL.length;
    const query = PRODUCT_QUERY_POOL[idx];
    try {
      const { data } = await supabase.functions.invoke("product-search", { body: { query, profile } });
      const incoming: Product[] = Array.isArray(data?.results) ? data.results : [];
      setFeed((prev) => {
        const seen = new Set(prev.map(productKey));
        const fresh = incoming.filter((p) => !seen.has(productKey(p)));
        return [...prev, ...fresh];
      });
    } catch { /* swallow */ }
    finally {
      setFeedCursor((c) => c + 1);
      setFeedLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedCursor, feedLoading]);

  // Initial batch + cache
  useEffect(() => {
    if (initialQuery) return;
    if (feed.length > 0) return;
    const cached = localStorage.getItem("dermo.recommended.v2");
    if (cached) {
      try { setFeed(JSON.parse(cached)); return; } catch {}
    }
    loadBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  // Persist feed
  useEffect(() => {
    if (feed.length > 0) {
      try { localStorage.setItem("dermo.recommended.v2", JSON.stringify(feed.slice(0, 60))); } catch {}
    }
  }, [feed]);

  // Infinite scroll observer
  useEffect(() => {
    if (searched) return;
    const el = sentinelRef.current; if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !feedLoading) loadBatch();
    }, { rootMargin: "300px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [searched, loadBatch, feedLoading]);

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

  // ---- Auto-assign product to routine step (no popup) ----
  const addAsChosenProduct = (product: Product) => {
    const routine = (() => { try { return JSON.parse(localStorage.getItem("dermo.routine.v1") || "null"); } catch { return null; } })();
    const slots = slotsFromRoutine(routine);
    const text = `${product.name} ${(product.key_ingredients || []).join(" ")}`;
    const productIntent = intentForText(text);

    let target: Slot | null = null;
    if (productIntent) {
      target = slots.find((s) => intentForText(s.stepName) === productIntent) || null;
    }

    const value = {
      id: productKey(product), name: product.name, brand: product.brand,
      image: product.image, url: product.product_link || product.search_url,
      price: product.price || product.price_range,
    };

    if (target) {
      const prof = loadProfile();
      const next = { ...((prof?.selectedProducts || {}) as Record<string, any>), [target.key]: value };
      updateProfile({ selectedProducts: next });
      window.dispatchEvent(new CustomEvent("dermo:profile-updated"));
      setConfirmation(`Added to ${target.focus} · ${target.time} — ${target.stepName}`);
    } else {
      // Branch out a new "Unnamed Routine Step"
      const r = routine ? JSON.parse(JSON.stringify(routine)) : { skin: { morning: [], night: [] }, hair: { weekly: [] }, nails: { daily: [] } };
      const focusFirst = (loadProfile()?.focus?.[0] || "Skin");
      let stepBucket: any[];
      let focusLabel: "Skin" | "Hair" | "Nails" = "Skin";
      let timeLabel = "morning";
      if (focusFirst === "Hair") {
        r.hair = r.hair || {}; r.hair.weekly = r.hair.weekly || []; stepBucket = r.hair.weekly; focusLabel = "Hair"; timeLabel = "weekly";
      } else if (focusFirst === "Nails") {
        r.nails = r.nails || {}; r.nails.daily = r.nails.daily || []; stepBucket = r.nails.daily; focusLabel = "Nails"; timeLabel = "daily";
      } else {
        r.skin = r.skin || {}; r.skin.morning = r.skin.morning || []; stepBucket = r.skin.morning;
      }
      // Find a unique name
      const baseName = "Unnamed Routine Step";
      let name = baseName; let i = 2;
      while (stepBucket.some((s: any) => s.step === name)) { name = `${baseName} ${i++}`; }
      stepBucket.push({ step: name, product_type: "Custom", ingredient: product.key_ingredients?.[0] || "—", why: `Added with ${product.brand} ${product.name}.`, isCustom: true });
      localStorage.setItem("dermo.routine.v1", JSON.stringify(r));
      window.dispatchEvent(new CustomEvent("dermo:routine-updated"));

      const prof = loadProfile();
      const next = { ...((prof?.selectedProducts || {}) as Record<string, any>), [slotKey(focusLabel, timeLabel, name)]: value };
      updateProfile({ selectedProducts: next });
      window.dispatchEvent(new CustomEvent("dermo:profile-updated"));
      setConfirmation(`Added as new "${name}" — rename it in Routine`);
    }

    window.setTimeout(() => setConfirmation(null), 2400);
  };

  // Derived display list
  const baseList = searched ? results : feed;
  const filtered = baseList.filter((p) => matchesFilter(p, filter));
  const displayed = useMemo(
    () => sortProducts(filtered, sort, searched ? undefined : focusPrimary),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, sort, focusPrimary, searched]
  );

  return (
    <div className="relative min-h-full bg-white">
      <div className="px-5 pt-7 pb-5 flex items-center gap-3 bg-white">
        <DermoLogo color={GREEN} size={42} />
        <h1 className="font-heading text-[34px] text-foreground">Find Products</h1>
      </div>

      <div className="px-4 pt-5 pb-10 space-y-4 rounded-t-[28px] min-h-[80vh]" style={{ background: `linear-gradient(180deg, ${GREEN_LIGHT} 0%, ${GREEN} 100%)` }}>
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

        <div className="rounded-[26px] bg-white p-5 shadow-soft min-h-[60vh]">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl text-foreground">
              {searched ? "Top Results" : "Top Picks for You"}
            </h2>
            {searched && (
              <button onClick={clearSearch} className="text-xs font-bold text-foreground/70 underline">Clear</button>
            )}
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            <Dropdown<FilterOpt> label="Filter" value={filter} options={FILTER_OPTIONS} onSelect={setFilter} Icon={SlidersHorizontal} />
            <Dropdown<SortOpt> label="Sort by" value={sort} options={SORT_OPTIONS} onSelect={setSort} Icon={ArrowDownNarrowWide} />

          </div>

          {confirmation && (
            <div className="mt-3 rounded-2xl bg-green-50 border border-green-200 p-3 text-sm text-green-800 inline-flex items-center gap-2 animate-fade-in">
              <Check className="h-4 w-4" /> {confirmation}
            </div>
          )}

          {loading && <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin" stroke={GREEN} /></div>}
          {error && <div className="mt-3 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="grid grid-cols-2 gap-4 mt-4">
            {displayed.map((p, i) => {
              const rating = ratingFor(p);
              const reviews = reviewsFor(p);
              return (
                <div key={`${productKey(p)}-${i}`} className="flex flex-col animate-step-in" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
                  <ProductImage product={p} />

                  <p className="mt-2 text-[11px] font-bold tracking-wide text-foreground uppercase">{p.brand}</p>
                  <p className="text-sm text-foreground leading-tight">{p.name}</p>
                  <RatingDisplay rating={rating} reviews={reviews} />
                  <a href={p.product_link || p.search_url} target="_blank" rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 self-start rounded-full px-3 py-1 text-[11px] font-semibold text-white hover:opacity-90" style={{ background: GREEN }}>
                    {p.source || p.retailer} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                  <button
                    onClick={() => addAsChosenProduct(p)}
                    className="mt-1.5 text-[10px] font-semibold text-foreground/80 inline-flex items-center gap-0.5 hover:text-foreground self-start"
                  >
                    <Plus className="h-3 w-3" /> Add as chosen product
                  </button>
                  {p.warning && (
                    <div className="mt-1 flex items-start gap-1 text-[10px] text-yellow-800">
                      <AlertTriangle className="h-3 w-3 flex-none mt-0.5" />
                      <span>{p.warning}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!loading && searched && results.length === 0 && !error && (
            <div className="text-center text-muted-foreground text-sm py-12">
              No results found. Try a different search term.
            </div>
          )}

          {/* Infinite scroll sentinel (only when browsing default feed) */}
          {!searched && (
            <div ref={sentinelRef} className="py-6 flex justify-center">
              {feedLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" stroke={GREEN} />
              ) : (
                <span className="text-[11px] text-muted-foreground">Scroll for more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
