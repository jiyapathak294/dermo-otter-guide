import { BookOpen, Play } from "lucide-react";

const VIDEOS = [
  { title: "How to build a skincare routine", id: "r0wIWBSfgXM", source: "Dr Dray (board-certified dermatologist)" },
  { title: "How to treat acne safely", id: "WUEDDJfTHA8", source: "Dr Sam Bunting" },
  { title: "Hair care basics", id: "DnoS4-AT_w0", source: "Dr Dray" },
  { title: "Nail health guide", id: "Ux3pxMIvnHU", source: "Dermatology Education" },
  { title: "Ingredient breakdowns", id: "5d9Mn-AnNlI", source: "Lab Muffin Beauty Science" },
];

export const LearnTab = () => (
  <div className="px-5 pt-6 pb-6 space-y-4">
    <div className="flex items-center gap-2"><BookOpen className="h-6 w-6 text-navy" /><h2 className="font-heading text-2xl text-navy">Learn</h2></div>
    <p className="text-sm text-muted-foreground">Curated dermatology education from board-certified experts.</p>
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
  </div>
);
