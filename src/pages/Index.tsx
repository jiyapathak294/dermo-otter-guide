import { useState } from "react";
import { IntroVideo } from "@/components/IntroVideo";
import { LoadingVideo } from "@/components/LoadingVideo";
import { DermaIntro } from "@/components/DermaIntro";
import { Survey } from "@/components/Survey";

type Stage = "intro" | "loading" | "derma" | "survey" | "done";

const Index = () => {
  const [stage, setStage] = useState<Stage>("intro");
  const [answers, setAnswers] = useState<Record<string, any> | null>(null);

  return (
    <main>
      {stage === "intro" && <IntroVideo onNext={() => setStage("loading")} />}
      {stage === "loading" && <LoadingVideo onNext={() => setStage("derma")} />}
      {stage === "derma" && <DermaIntro onNext={() => setStage("survey")} />}
      {stage === "survey" && (
        <Survey
          onComplete={(a) => {
            setAnswers(a);
            setStage("done");
          }}
        />
      )}
      {stage === "done" && (
        <div className="app-frame flex flex-col items-center justify-center px-6 text-center">
          <h1 className="font-heading text-3xl text-navy">All done, {answers?.firstName || "friend"}! 🦦</h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-xs">
            Dermo is preparing your personalized plan. Your routine, products and learn pages will appear here next.
          </p>
        </div>
      )}
    </main>
  );
};

export default Index;
