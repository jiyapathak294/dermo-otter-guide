import { useState } from "react";
import { Play, FlaskConical, ChevronDown } from "lucide-react";
import { DermoLogo } from "@/components/DermoLogo";

const VIDEOS = [
  { title: "How to build a skincare routine", id: "r0wIWBSfgXM", source: "Dr Dray (board-certified dermatologist)" },
  { title: "How to treat acne safely", id: "WUEDDJfTHA8", source: "Dr Sam Bunting" },
  { title: "Hair care basics", id: "DnoS4-AT_w0", source: "Dr Dray" },
  { title: "Nail health guide", id: "Ux3pxMIvnHU", source: "Dermatology Education" },
  { title: "Ingredient breakdowns", id: "5d9Mn-AnNlI", source: "Lab Muffin Beauty Science" },
];

const INGREDIENTS = [
  { name: "Retinol", category: "Anti-aging", what: "A vitamin A derivative that speeds up cell turnover.", good: "Fine lines, acne, uneven texture, dark spots.", caution: "Avoid in pregnancy. Start 2x/week, always pair with SPF." },
  { name: "Niacinamide", category: "Barrier support", what: "Vitamin B3 that calms redness and balances oil.", good: "Sensitive skin, redness, large pores, oiliness.", caution: "Generally very well tolerated up to 10%." },
  { name: "Salicylic Acid (BHA)", category: "Exfoliant", what: "Oil-soluble acid that unclogs pores from inside.", good: "Acne, blackheads, oily and combo skin.", caution: "Avoid stacking with strong retinoids same night." },
  { name: "Hyaluronic Acid", category: "Hydration", what: "Humectant that pulls water into the skin.", good: "Dehydration, dryness, plumping fine lines.", caution: "Apply on damp skin, then seal with moisturizer." },
  { name: "Vitamin C", category: "Brightening", what: "Antioxidant that fades dark spots and boosts SPF.", good: "Dullness, dark spots, sun-damaged skin.", caution: "Use AM. Store in dark/cool spot to avoid oxidation." },
  { name: "Azelaic Acid", category: "Calming", what: "Gentle acid that fights acne, redness, melasma.", good: "Rosacea, post-acne marks, sensitive acne.", caution: "Pregnancy-safe. Mild tingling first weeks is normal." },
  { name: "Peptides", category: "Anti-aging", what: "Short amino acid chains that signal collagen.", good: "Firmness, fine lines, post-procedure recovery.", caution: "Layer under moisturizer. Pair well with retinol." },
  { name: "Ceramides", category: "Barrier", what: "Lipids that rebuild the skin barrier.", good: "Dry, eczema-prone, compromised barrier.", caution: "No real downsides. Great for daily use." },
  { name: "Minoxidil", category: "Hair growth", what: "Topical that extends the hair growth phase.", good: "Hair thinning, androgenic hair loss.", caution: "Consistency matters; results take 3-6 months." },
  { name: "Biotin", category: "Hair & nails", what: "B-vitamin involved in keratin production.", good: "Brittle nails, hair strength (if deficient).", caution: "Can interfere with thyroid lab tests." },
];

export const LearnTab = () => {
  const [openIng, setOpenIng] = useState<string | null>(null);

  return (
    <div className="pb-6">
      <div className="px-5 pt-7 pb-4 flex items-center gap-3 bg-white">
        <DermoLogo color="hsl(var(--jazz-blue))" size={42} />
        <h1 className="font-heading text-[34px] text-foreground">Learn</h1>
      </div>
      <div className="px-5 space-y-5">
      <p className="text-sm text-muted-foreground">Curated dermatology education from board-certified experts.</p>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-navy" />
          <h3 className="font-heading text-navy text-lg">Ingredient Education</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {INGREDIENTS.map((ing) => {
            const open = openIng === ing.name;
            return (
              <button
                key={ing.name}
                onClick={() => setOpenIng(open ? null : ing.name)}
                className={`text-left rounded-2xl border bg-white p-3 shadow-soft transition-all ${open ? "border-navy" : "border-border"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading text-navy text-sm">{ing.name}</p>
                    <p className="text-[10px] uppercase tracking-wide text-baby-blue-deep font-semibold">{ing.category}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-navy transition-transform ${open ? "rotate-180" : ""}`} />
                </div>
                {open && (
                  <div className="mt-2 space-y-1.5 text-xs animate-fade-in">
                    <p><span className="font-semibold text-navy">What it is: </span>{ing.what}</p>
                    <p><span className="font-semibold text-navy">Good for: </span>{ing.good}</p>
                    <p className="text-yellow-800 bg-yellow-50 rounded-lg p-2"><span className="font-semibold">Caution: </span>{ing.caution}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Play className="h-5 w-5 text-navy" />
          <h3 className="font-heading text-navy text-lg">Videos</h3>
        </div>
        <div className="space-y-4">
          {VIDEOS.map((v) => (
            <div key={v.id} className="rounded-2xl bg-white border border-border overflow-hidden shadow-soft">
              <div className="aspect-video bg-black">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${v.id}`}
                  title={v.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2"><Play className="h-4 w-4 text-navy" /><p className="font-heading text-navy text-sm">{v.title}</p></div>
                <p className="text-xs text-muted-foreground mt-1">{v.source}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
};
