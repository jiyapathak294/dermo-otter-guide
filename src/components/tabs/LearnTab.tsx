import { useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { DermoLogo } from "@/components/DermoLogo";

const GREEN = "#3a8a5e";
const GREEN_LIGHT = "#5fa97c";

const VIDEOS = [
  { title: "How to build a skincare routine", id: "8eRSwMVhUNM", source: "Dr Dray" },
  { title: "How to treat acne safely", id: "5YsUSvAIsEQ", source: "Dr Sam Bunting" },
  { title: "Hair care basics", id: "kT3JMo3BTmA", source: "Dr Dray" },
  { title: "Nail health guide", id: "khCcYSErKfs", source: "Dermatology Education" },
  { title: "Ingredient breakdowns", id: "sShqBTZEEXw", source: "Lab Muffin Beauty Science" },
];

const INGREDIENTS = [
  { name: "Retinol", category: "Anti-aging", what: "A vitamin A derivative that speeds up cell turnover.", good: "Fine lines, acne, uneven texture, dark spots.", caution: "Avoid in pregnancy. Start 2x/week, always pair with SPF." },
  { name: "Niacinamide", category: "Barrier support", what: "Vitamin B3 that calms redness and balances oil.", good: "Sensitive skin, redness, large pores, oiliness.", caution: "Generally very well tolerated up to 10%." },
  { name: "Salicylic Acid (BHA)", category: "Exfoliant", what: "Oil-soluble acid that unclogs pores from inside.", good: "Acne, blackheads, oily and combo skin.", caution: "Avoid stacking with strong retinoids same night." },
  { name: "Hyaluronic Acid", category: "Hydration", what: "Humectant that pulls water into the skin.", good: "Dehydration, dryness, plumping fine lines.", caution: "Apply on damp skin, then seal with moisturizer." },
  { name: "Vitamin C", category: "Brightening", what: "Antioxidant that fades dark spots and boosts SPF.", good: "Dullness, dark spots, sun-damaged skin.", caution: "Use AM. Store in dark/cool spot to avoid oxidation." },
];

export const LearnTab = () => {
  const [q, setQ] = useState("");
  const [openIng, setOpenIng] = useState<string | null>(null);

  const filteredVideos = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return VIDEOS;
    return VIDEOS.filter((v) => v.title.toLowerCase().includes(s) || v.source.toLowerCase().includes(s));
  }, [q]);

  const filteredIngredients = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return INGREDIENTS;
    return INGREDIENTS.filter((i) =>
      i.name.toLowerCase().includes(s) || i.category.toLowerCase().includes(s) || i.what.toLowerCase().includes(s)
    );
  }, [q]);

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="px-5 pt-7 pb-4 flex items-center gap-3 bg-white">
        <DermoLogo color={GREEN} size={42} />
        <h1 className="font-heading text-[34px] text-foreground">Learn</h1>
      </div>

      <div
        className="flex-1 px-4 pt-5 pb-10 space-y-4 rounded-t-[28px]"
        style={{ background: `linear-gradient(180deg, ${GREEN_LIGHT} 0%, ${GREEN} 100%)` }}
      >
        {/* Search bar */}
        <div className="flex items-center gap-2 rounded-full bg-white pl-5 pr-2 py-2 shadow-soft">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. skincare steps routine"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button className="h-10 w-10 rounded-full flex items-center justify-center text-white" style={{ background: GREEN }} aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Video cards */}
        <div className="space-y-3">
          {filteredVideos.map((v) => (
            <div key={v.id} className="rounded-[22px] bg-white overflow-hidden shadow-soft">
              <div className="flex items-stretch">
                <div className="flex-1 p-4">
                  <p className="font-heading text-foreground text-base leading-tight">{v.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{v.source}</p>
                </div>
                <div className="w-[55%] aspect-video bg-black m-3 rounded-2xl overflow-hidden">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${v.id}?rel=0&playsinline=1`}
                    title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          ))}
          {filteredVideos.length === 0 && (
            <div className="rounded-[22px] bg-white/90 p-5 text-sm text-center text-muted-foreground">No videos match your search.</div>
          )}
        </div>

        {/* Ingredient education */}
        {filteredIngredients.length > 0 && (
          <div className="rounded-[26px] bg-white p-4 shadow-soft space-y-2">
            <h3 className="font-heading text-foreground text-lg px-1">Ingredient Education</h3>
            {filteredIngredients.map((ing) => {
              const open = openIng === ing.name;
              return (
                <button
                  key={ing.name}
                  onClick={() => setOpenIng(open ? null : ing.name)}
                  className={`w-full text-left rounded-2xl border p-3 transition-all ${open ? "border-foreground/40" : "border-border"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading text-foreground text-sm">{ing.name}</p>
                      <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: GREEN }}>{ing.category}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                  </div>
                  {open && (
                    <div className="mt-2 space-y-1.5 text-xs animate-fade-in">
                      <p><span className="font-bold">What it is: </span>{ing.what}</p>
                      <p><span className="font-bold">Good for: </span>{ing.good}</p>
                      <p className="text-yellow-900 bg-yellow-50 rounded-lg p-2"><span className="font-bold">Caution: </span>{ing.caution}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
