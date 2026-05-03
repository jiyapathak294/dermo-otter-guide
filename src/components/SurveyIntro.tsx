import { ArrowRight, Sparkles } from "lucide-react";

export const SurveyIntro = ({ onBegin }: { onBegin: () => void }) => (
  <div className="min-h-screen w-full bg-spa flex flex-col items-center justify-center px-6 text-center">
    <div className="animate-scale-in">
      <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-baby-blue/60 flex items-center justify-center shadow-glow">
        <Sparkles className="h-8 w-8 text-navy" />
      </div>
      <h1 className="font-bubble text-4xl sm:text-5xl text-navy max-w-xl">
        Let's begin with a quick survey
      </h1>
      <p className="mt-4 text-muted-foreground max-w-md mx-auto">
        Just a few questions so Dermo can craft a routine made just for you.
      </p>
      <button
        onClick={onBegin}
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-baby-blue text-navy font-bubble text-lg px-8 py-3.5 shadow-soft hover:scale-105 active:scale-95 transition-transform"
      >
        Begin
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  </div>
);
