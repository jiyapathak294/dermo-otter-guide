import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { questions, Question } from "@/data/surveyQuestions";
import { OptionIcon } from "@/components/OptionIcon";

const NO_ICON_QUESTIONS = new Set(["skinTried", "nailConcerns"]);

// "None"-style options that are mutually exclusive with every other option
const NONE_VALUES = new Set(["None", "Neither", "No preference", "Prefer not to say", "Unsure", "Unknown"]);

export const Survey = ({ onComplete }: { onComplete: (answers: Record<string, any>) => void }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [idx, setIdx] = useState(0);
  const [whiteFade, setWhiteFade] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setWhiteFade(false), 50);
    return () => clearTimeout(t);
  }, []);

  const visible = useMemo(
    () => questions.filter((q) => !q.showIf || q.showIf(answers)),
    [answers]
  );
  const current: Question | undefined = visible[idx];
  const progress = ((idx + 1) / visible.length) * 100;

  if (!current) return null;

  const value = answers[current.id];
  const todayStr = new Date().toISOString().slice(0, 10);
  const isValidDob = (v: any) => {
    if (typeof v !== "string" || !v) return false;
    const d = new Date(v);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const min = new Date("1900-01-01");
    return d <= now && d >= min;
  };
  const canNext = (() => {
    if (current.type === "multi") return Array.isArray(value) && value.length > 0;
    if (current.type === "text") return typeof value === "string" && value.trim().length > 0;
    if (current.type === "date") return isValidDob(value);
    return value !== undefined && value !== "";
  })();

  const setValue = (v: any) => setAnswers((a) => ({ ...a, [current.id]: v }));

  const toggleMulti = (v: string) => {
    const cur = Array.isArray(value) ? [...value] : [];
    // Picking a "None" option clears everything else and selects only it (unless toggling off)
    if (NONE_VALUES.has(v)) {
      if (cur.includes(v)) return setValue([]);
      return setValue([v]);
    }
    // Picking anything else clears any "None" that was selected
    const withoutNone = cur.filter((x) => !NONE_VALUES.has(x));
    const i = withoutNone.indexOf(v);
    if (i >= 0) withoutNone.splice(i, 1); else withoutNone.push(v);
    setValue(withoutNone);
  };

  const goForward = (nextAnswers: Record<string, any>) => {
    const nextVisible = questions.filter((q) => !q.showIf || q.showIf(nextAnswers));
    if (idx + 1 >= nextVisible.length) onComplete(nextAnswers);
    else setIdx(idx + 1);
  };

  const next = () => goForward(answers);
  const skip = () => {
    // remove any partial answer for this question, then advance
    const cleaned = { ...answers };
    delete cleaned[current.id];
    setAnswers(cleaned);
    goForward(cleaned);
  };
  const back = () => setIdx(Math.max(0, idx - 1));

  const pickSingle = (v: string) => {
    const nextAnswers = { ...answers, [current.id]: v };
    setAnswers(nextAnswers);
    // Auto-advance after single-select
    setTimeout(() => goForward(nextAnswers), 180);
  };

  const showIcons = !NO_ICON_QUESTIONS.has(current.id);
  const showSkip = !current.required;

  const PURPLE = "#8d77ab";

  return (
    <div className="app-frame flex flex-col bg-white">
      {/* Progress */}
      <div className="px-6 pt-12 flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "hsl(var(--jazz-blue))" }}
          />
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
          {idx + 1}/{visible.length}
        </span>
      </div>

      {/* Question — clean, medical */}
      <div className="px-8 pt-10">
        <h2
          key={current.id}
          className="font-heading text-[26px] leading-[1.2] text-foreground text-center animate-fade-in"
        >
          {current.question}
        </h2>
        {current.type === "multi" && (
          <p className="mt-2 text-xs text-muted-foreground text-center">Select all that apply</p>
        )}
      </div>

      {/* Options */}
      <div className="flex-1 px-6 pt-8 pb-32 overflow-y-auto">
        {current.type === "text" && (
          <input
            autoFocus
            type="text"
            value={value ?? ""}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your answer..."
            className="w-full rounded-2xl bg-white border-2 px-5 py-4 text-base text-foreground outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[hsl(var(--jazz-blue))]"
            style={{ borderColor: PURPLE }}
          />
        )}

        {current.type === "date" && (
          <>
            <input
              type="date"
              value={value ?? ""}
              max={todayStr}
              min="1900-01-01"
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-2xl bg-white border-2 px-5 py-4 text-base text-foreground outline-none"
              style={{ borderColor: PURPLE }}
            />
            {value && !isValidDob(value) && (
              <p className="mt-2 text-sm text-destructive">Please enter a valid past date.</p>
            )}
          </>
        )}

        {(current.type === "single" || current.type === "multi") && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            {current.options!.map((opt) => {
              const selected =
                current.type === "multi"
                  ? Array.isArray(value) && value.includes(opt.value)
                  : value === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() =>
                    current.type === "multi" ? toggleMulti(opt.value) : pickSingle(opt.value)
                  }
                  className="relative flex flex-col items-center justify-center text-center gap-2 rounded-[18px] px-3 py-4 border-2 transition-all min-h-[74px]"
                  style={{
                    borderColor: selected ? PURPLE : "hsl(var(--border))",
                    backgroundColor: selected ? "#ece6f5" : "white",
                  }}
                >
                  {showIcons && <OptionIcon label={opt.label} className="h-5 w-5" />}
                  <span className="text-sm font-semibold text-foreground leading-tight">
                    {opt.label}
                  </span>
                  {selected && (
                    <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full flex items-center justify-center" style={{ background: PURPLE }}>
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-5 bg-white border-t border-border/60 flex items-center justify-between gap-3">
        <button
          onClick={back}
          disabled={idx === 0}
          aria-label="Back"
          className="h-12 w-12 rounded-full bg-muted flex items-center justify-center disabled:opacity-30 active:scale-95 transition"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.4} />
        </button>

        {showSkip && (
          <button
            onClick={skip}
            className="flex-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-3"
          >
            Skip
          </button>
        )}

        <button
          onClick={next}
          disabled={!canNext}
          aria-label={idx + 1 >= visible.length ? "Finish" : "Next"}
          className="h-12 min-w-[112px] px-5 rounded-full text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition shadow-soft"
          style={{ background: "hsl(var(--jazz-blue))" }}
        >
          {idx + 1 >= visible.length ? "Finish" : "Next"}
          <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
        </button>
      </div>

      <div
        className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-500 ${
          whiteFade ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};
