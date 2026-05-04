import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { questions, Question } from "@/data/surveyQuestions";
import { OptionIcon } from "@/components/OptionIcon";

const NO_ICON_QUESTIONS = new Set(["skinTried", "nailConcerns"]);

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
  const canNext = (() => {
    if (current.type === "multi") return Array.isArray(value) && value.length > 0;
    if (current.type === "text") return typeof value === "string" && value.trim().length > 0;
    return value !== undefined && value !== "";
  })();

  const setValue = (v: any) => setAnswers((a) => ({ ...a, [current.id]: v }));
  const toggleMulti = (v: string) => {
    const arr = Array.isArray(value) ? [...value] : [];
    const i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1); else arr.push(v);
    setValue(arr);
  };

  const next = () => {
    if (idx + 1 >= visible.length) onComplete(answers);
    else setIdx(idx + 1);
  };
  const back = () => setIdx(Math.max(0, idx - 1));

  const showIcons = !NO_ICON_QUESTIONS.has(current.id);

  return (
    <div className="app-frame flex flex-col bg-white">
      {/* Progress (jazz-blue on baby-blue track) */}
      <div className="px-6 pt-10">
        <div className="h-3 w-full rounded-full bg-baby-blue overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "hsl(var(--jazz-blue))",
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="px-6 pt-8 text-center">
        <h2
          key={current.id}
          className="font-heading text-[26px] leading-[1.15] text-foreground animate-fade-in"
        >
          {current.question}
        </h2>
        {current.type === "multi" && (
          <p className="mt-3 text-sm text-muted-foreground">Select all that apply</p>
        )}
      </div>

      {/* Options */}
      <div className="flex-1 px-5 pt-6 pb-28 overflow-y-auto">
        {current.type === "text" && (
          <input
            autoFocus
            type="text"
            value={value ?? ""}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your answer..."
            className="w-full rounded-2xl bg-white border-2 border-navy px-5 py-4 text-base text-foreground outline-none focus:border-jazz-blue"
          />
        )}

        {current.type === "date" && (
          <input
            type="date"
            value={value ?? ""}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-2xl bg-white border-2 border-navy px-5 py-4 text-base text-foreground outline-none focus:border-jazz-blue"
          />
        )}

        {(current.type === "single" || current.type === "multi") && (
          <div className="grid grid-cols-2 gap-3">
            {current.options!.map((opt) => {
              const selected =
                current.type === "multi"
                  ? Array.isArray(value) && value.includes(opt.value)
                  : value === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() =>
                    current.type === "multi" ? toggleMulti(opt.value) : setValue(opt.value)
                  }
                  className={[
                    "relative flex flex-col items-center justify-center text-center gap-2 rounded-2xl px-3 py-5 border-2 transition-all",
                    showIcons ? "min-h-[110px]" : "min-h-[90px]",
                    selected
                      ? "bg-baby-blue border-navy"
                      : "bg-white border-navy hover:bg-baby-blue/40 active:bg-baby-blue",
                  ].join(" ")}
                >
                  {showIcons && <OptionIcon label={opt.label} className="h-7 w-7" />}
                  <span className="text-sm font-semibold text-foreground leading-tight">
                    {opt.label}
                  </span>
                  {selected && (
                    <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-navy flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Nav: matching circular buttons on both sides */}
      <div className="absolute bottom-0 left-0 right-0 px-8 py-5 bg-white flex items-center justify-between">
        <button
          onClick={back}
          disabled={idx === 0}
          aria-label="Back"
          className="h-14 w-14 rounded-full bg-baby-blue flex items-center justify-center disabled:opacity-30 active:scale-95 active:bg-baby-blue-deep transition-all shadow-soft"
        >
          <ArrowLeft className="h-6 w-6 text-white" strokeWidth={2.5} />
        </button>
        <button
          onClick={next}
          disabled={!canNext}
          aria-label={idx + 1 >= visible.length ? "Finish" : "Next"}
          className="h-14 w-14 rounded-full bg-baby-blue flex items-center justify-center disabled:opacity-40 active:scale-95 active:bg-baby-blue-deep transition-all shadow-soft"
        >
          <ArrowRight className="h-6 w-6 text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* White fade-in overlay */}
      <div
        className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-500 ${
          whiteFade ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};
