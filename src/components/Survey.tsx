import { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { questions, Question } from "@/data/surveyQuestions";
import { OptionIcon } from "@/components/OptionIcon";
import otter from "@/assets/derma-otter.png";

export const Survey = ({ onComplete }: { onComplete: (answers: Record<string, any>) => void }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [idx, setIdx] = useState(0);

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

  return (
    <div className="app-frame flex flex-col">
      {/* Progress */}
      <div className="px-5 pt-6">
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "var(--gradient-progress)" }}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground text-right">
          {idx + 1} / {visible.length}
        </p>
      </div>

      {/* Question with Derma */}
      <div className="px-5 pt-6 pb-2 text-center">
        <div className="flex items-end justify-center gap-3 mb-3">
          <img
            src={otter}
            alt="Derma"
            className="w-16 h-16 object-contain animate-otter-bob drop-shadow-md"
          />
          <div className="relative bg-white border-2 border-baby-blue rounded-2xl px-3 py-2 mb-2 shadow-soft">
            <div className="absolute left-[-7px] bottom-3 h-3 w-3 bg-white border-l-2 border-b-2 border-baby-blue rotate-45" />
            <p className="text-[11px] text-navy font-heading">Derma asks</p>
          </div>
        </div>
        <h2 key={current.id} className="font-heading text-2xl text-navy animate-fade-in">
          {current.question}
        </h2>
        {current.type === "multi" && (
          <p className="mt-1.5 text-xs text-muted-foreground">Select all that apply</p>
        )}
      </div>

      {/* Options */}
      <div className="flex-1 px-5 pb-28 overflow-y-auto">
        {current.type === "text" && (
          <input
            autoFocus
            type="text"
            value={value ?? ""}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your answer..."
            className="w-full rounded-2xl bg-white border-2 border-border px-5 py-4 text-base text-foreground outline-none focus:border-baby-blue-deep shadow-soft"
          />
        )}

        {current.type === "date" && (
          <input
            type="date"
            value={value ?? ""}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-2xl bg-white border-2 border-border px-5 py-4 text-base text-foreground outline-none focus:border-baby-blue-deep shadow-soft"
          />
        )}

        {(current.type === "single" || current.type === "multi") && (
          <div className="grid grid-cols-2 gap-2.5">
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
                    "relative flex flex-col items-center justify-center text-center gap-2 rounded-2xl px-3 py-4 border-2 transition-all shadow-soft min-h-[110px]",
                    selected
                      ? "bg-baby-blue border-baby-blue-deep"
                      : "bg-white border-border hover:border-baby-blue active:bg-baby-blue",
                  ].join(" ")}
                >
                  <OptionIcon label={opt.label} className="h-8 w-8" />
                  <span className="text-xs font-semibold text-foreground leading-tight">
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

      {/* Sticky Nav */}
      <div className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-white border-t border-border flex items-center justify-between gap-3">
        <button
          onClick={back}
          disabled={idx === 0}
          className="inline-flex items-center gap-1.5 rounded-full bg-white border-2 border-border text-foreground font-heading px-5 py-2.5 disabled:opacity-40 active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={next}
          disabled={!canNext}
          className="inline-flex items-center gap-2 rounded-full bg-white border-2 border-baby-blue text-navy font-heading px-7 py-2.5 disabled:opacity-50 active:bg-baby-blue active:scale-95 transition-all"
        >
          {idx + 1 >= visible.length ? "Finish" : "Next"}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
