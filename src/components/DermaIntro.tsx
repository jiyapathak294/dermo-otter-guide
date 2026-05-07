import { useEffect, useState } from "react";
import otter from "@/assets/dermo-otter.png";

type Step = { kind: "msg"; text: string } | { kind: "typing" };

const sequence: Step[] = [
  { kind: "msg", text: "I'm Dermo, the Otter!" },
  { kind: "typing" },
  { kind: "msg", text: "I'm here to help you navigate this app and provide the best help possible." },
  { kind: "typing" },
  { kind: "msg", text: "Let's start with a quick survey." },
];

const TYPING_MS = 1000;
const READ_MS = 2200;

export const DermaIntro = ({ onNext }: { onNext: () => void }) => {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (step >= sequence.length - 1) return;
    const cur = sequence[step];
    const delay = cur.kind === "typing" ? TYPING_MS : READ_MS;
    const t = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [step]);

  const current = sequence[step];
  const isLast = step === sequence.length - 1;

  const handleNext = () => {
    setLeaving(true);
    setTimeout(onNext, 400);
  };

  return (
    <div className={`app-frame bg-white overflow-hidden transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}>
      {/* Top progress pill (empty grey) */}
      <div className="absolute top-12 left-6 right-6 h-3 rounded-full bg-muted" />

      {/* Otter at bottom-left */}
      <img
        src={otter}
        alt="Dermo the Otter"
        className="absolute -bottom-2 -left-4 w-44 object-contain animate-otter-bob"
      />

      {/* Speech bubble — right side, with thin black border + tail */}
      <div className="absolute bottom-32 left-32 right-6">
        {current.kind === "typing" ? (
          <div key={`t-${step}`} className="relative inline-flex items-center gap-2 bg-muted rounded-3xl px-6 py-5 animate-fade-in">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/60 animate-bounce" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            <span className="absolute -left-2 bottom-3 h-3 w-3 rotate-45 bg-muted" />
          </div>
        ) : (
          <div key={`m-${step}`} className="relative bg-white border-2 border-foreground rounded-[28px] px-6 py-5 animate-fade-in">
            <p className="text-lg text-foreground text-center leading-snug">{current.text}</p>
            {/* tail */}
            <span className="absolute -left-[7px] bottom-5 h-3.5 w-3.5 rotate-45 bg-white border-l-2 border-b-2 border-foreground" />
          </div>
        )}
      </div>

      {/* Continue arrow — only on last message */}
      {isLast && (
        <button
          onClick={handleNext}
          aria-label="Start survey"
          className="absolute bottom-10 right-6 h-16 w-16 rounded-full bg-baby-blue flex items-center justify-center shadow-soft active:scale-95 transition animate-scale-in"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="white" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};
