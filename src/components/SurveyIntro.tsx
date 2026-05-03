import { ArrowRight, Sparkles } from "lucide-react";

export const SurveyIntro = ({ onBegin }: { onBegin: () => void }) => (
  <div className="app-frame flex flex-col items-center justify-center px-6 text-center">
    <div className="animate-scale-in">
      <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-baby-blue/60 flex items-center justify-center shadow-glow">
        <Sparkles className="h-8 w-8 text-navy" />
      </div>
      <h1 className="font-heading text-3xl text-navy max-w-xs">
        Let's begin with a quick survey
      </h1>
      <p className="mt-4 text-sm text-muted-foreground max-w-xs mx-auto">
        Just a few questions so Dermo can craft a routine made just for you.
      </p>
      <button
        onClick={onBegin}
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-white border-2 border-baby-blue text-navy font-heading text-base px-7 py-3 shadow-soft hover:bg-baby-blue active:bg-baby-blue active:scale-95 transition-all"
      >
        Begin
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  </div>
);
