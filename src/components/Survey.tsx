import { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { questions, Question } from "@/data/surveyQuestions";

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
    <div className="min-h-screen w-full bg-spa flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-8">
        <div className="max-w-2xl mx-auto">
          <div className="h-3 w-full rounded-full bg-baby-blue/40 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--gradient-progress)" }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground text-right">
            {idx + 1} / {visible.length}
          </p>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div key={current.id} className="w-full max-w-2xl text-center animate-fade-in">
          <h2 className="font-bubble text-3xl sm:text-4xl text-navy">{current.question}</h2>
          {current.type === "multi" && (
            <p className="mt-2 text-sm text-muted-foreground">Select all that apply</p>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="px-6 pb-10">
        <div className="max-w-2xl mx-auto">
          {current.type === "text" && (
            <input
              autoFocus
              type="text"
              value={value ?? ""}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type your answer..."
              className="w-full rounded-2xl bg-white border border-border px-5 py-4 text-lg text-navy outline-none focus:ring-2 focus:ring-jazz-blue/40 shadow-soft"
            />
          )}

          {current.type === "date" && (
            <input
              type="date"
              value={value ?? ""}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-2xl bg-white border border-border px-5 py-4 text-lg text-navy outline-none focus:ring-2 focus:ring-jazz-blue/40 shadow-soft"
            />
          )}

          {(current.type === "single" || current.type === "multi") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      "group flex items-center justify-between text-left rounded-2xl px-5 py-4 border transition-all shadow-soft",
                      selected
                        ? "bg-baby-blue border-baby-blue-deep ring-2 ring-jazz-blue/30"
                        : "bg-white border-border hover:bg-spa-mist",
                    ].join(" ")}
                  >
                    <span className="font-medium text-navy">{opt.label}</span>
                    {selected && <Check className="h-5 w-5 text-navy" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={back}
              disabled={idx === 0}
              className="inline-flex items-center gap-2 rounded-full bg-white text-navy font-bubble px-5 py-2.5 shadow-soft disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={next}
              disabled={!canNext}
              className="inline-flex items-center gap-2 rounded-full bg-baby-blue text-navy font-bubble text-lg px-7 py-3 shadow-soft disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform"
            >
              {idx + 1 >= visible.length ? "Finish" : "Next"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
