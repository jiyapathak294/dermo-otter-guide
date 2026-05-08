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

  const PURPLE = "#8d77ab";

  return (
    <div className="app-frame flex flex-col bg-white">
      {/* Progress — baby-blue filled on grey track */}
      <div className="px-6 pt-12">
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-baby-blue transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="px-8 pt-10 text-center">
        <h2
          key={current.id}
          className="font-heading text-[28px] leading-[1.15] text-foreground animate-fade-in"
        >
          {current.question}
        </h2>
        {current.type === "multi" && (
          <p className="mt-3 text-base text-muted-foreground">Select all that apply</p>
        )}
      </div>

      {/* Options */}
      <div className="flex-1 px-6 pt-8 pb-28 overflow-y-auto">
        {current.type === "text" && (
          <input
            autoFocus
            type="text"
            value={value ?? ""}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your answer..."
            className="w-full rounded-2xl bg-white border-2 px-5 py-4 text-base text-foreground outline-none"
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
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
                  className="relative flex flex-col items-center justify-center text-center gap-2 rounded-[22px] px-3 py-4 border-2 transition-all min-h-[78px]"
                  style={{
                    borderColor: PURPLE,
                    backgroundColor: selected ? "#ece6f5" : "white",
                  }}
                >
                  {showIcons && <OptionIcon label={opt.label} className="h-6 w-6" />}
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

      {/* Bottom nav — back & next circles, centered */}
      <div className="absolute bottom-0 left-0 right-0 px-8 py-6 bg-white flex items-center justify-center gap-6">
        <button
          onClick={back}
          disabled={idx === 0}
          aria-label="Back"
          className="h-14 w-14 rounded-full bg-baby-blue flex items-center justify-center disabled:opacity-30 active:scale-95 transition shadow-soft"
        >
          <ArrowLeft className="h-6 w-6 text-white" strokeWidth={2.6} />
        </button>
        <button
          onClick={next}
          disabled={!canNext}
          aria-label={idx + 1 >= visible.length ? "Finish" : "Next"}
          className="h-14 w-14 rounded-full bg-baby-blue flex items-center justify-center disabled:opacity-40 active:scale-95 transition shadow-soft"
        >
          <ArrowRight className="h-6 w-6 text-white" strokeWidth={2.6} />
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
