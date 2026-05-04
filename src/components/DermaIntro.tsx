import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import otter from "@/assets/derma-otter.svg";

type Step =
  | { kind: "msg"; text: string }
  | { kind: "typing" };

const sequence: Step[] = [
  { kind: "msg", text: "I'm Dermo, the Otter!" },
  { kind: "typing" },
  { kind: "msg", text: "I'm here to help you navigate this app and provide the best help possible." },
  { kind: "typing" },
  { kind: "msg", text: "Let's start with a quick survey." },
];

const TYPING_MS = 1100;
const READ_MS = 2400;

export const DermaIntro = ({ onNext }: { onNext: () => void }) => {
  const [appeared, setAppeared] = useState(false);
  const [whiteFade, setWhiteFade] = useState(true);
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);

  // White fade-in
  useEffect(() => {
    const t1 = setTimeout(() => setWhiteFade(false), 50);
    const t2 = setTimeout(() => setAppeared(true), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Auto-advance through sequence (stop at last msg, wait for user)
  useEffect(() => {
    if (!appeared) return;
    if (step >= sequence.length - 1) return;
    const cur = sequence[step];
    const delay = cur.kind === "typing" ? TYPING_MS : READ_MS;
    const t = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [appeared, step]);

  const current = sequence[step];
  const isLast = step === sequence.length - 1;

  const handleNext = () => {
    setLeaving(true);
    setTimeout(onNext, 600);
  };

  return (
    <div className="app-frame bg-white overflow-hidden">
      {/* Top progress pill (decorative, like UX) */}
      <div className="absolute top-10 left-6 right-6 h-3 rounded-full bg-baby-blue" />

      {/* Otter bottom-left */}
      <img
        src={otter}
        alt="Dermo the otter"
        className={[
          "absolute bottom-0 left-0 w-40 h-40 object-contain object-bottom transition-all duration-500 ease-out",
          appeared && !leaving ? "translate-x-0 opacity-100" : "",
          !appeared ? "-translate-x-32 opacity-0" : "",
          leaving ? "-translate-x-48 opacity-0" : "",
          appeared && !leaving ? "animate-otter-bob" : "",
        ].join(" ")}
      />

      {/* Speech bubble */}
      {appeared && !leaving && (
        <div className="absolute bottom-16 left-36 right-6">
          {current.kind === "typing" ? (
            <div
              key={`t-${step}`}
              className="inline-flex items-center gap-1.5 bg-muted border border-border rounded-3xl px-5 py-4 animate-fade-in"
            >
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <div
              key={`m-${step}`}
              className="relative bg-white border border-foreground/80 rounded-3xl px-5 py-4 animate-fade-in shadow-soft"
            >
              <p className="text-base text-foreground text-center leading-snug">
                {current.text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Arrow button (only on last message) */}
      {isLast && !leaving && (
        <button
          onClick={handleNext}
          aria-label="Start survey"
          className="absolute bottom-8 right-6 h-14 w-14 rounded-full bg-baby-blue flex items-center justify-center shadow-soft active:scale-95 active:bg-baby-blue-deep transition-all animate-scale-in"
        >
          <ArrowRight className="h-6 w-6 text-white" strokeWidth={2.5} />
        </button>
      )}

      {/* White fade overlay (entry + exit) */}
      <div
        className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-500 ${
          whiteFade || leaving ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};
