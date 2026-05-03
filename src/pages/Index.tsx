import { useState } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { IntroVideo } from "@/components/IntroVideo";
import { SurveyIntro } from "@/components/SurveyIntro";
import { Survey } from "@/components/Survey";

type Stage = "loading" | "intro" | "surveyIntro" | "survey" | "done";

const Index = () => {
  const [stage, setStage] = useState<Stage>("loading");
  const [answers, setAnswers] = useState<Record<string, any> | null>(null);

  return (
    <main>
      {stage === "loading" && <LoadingScreen onDone={() => setStage("intro")} />}
      {stage === "intro" && <IntroVideo onNext={() => setStage("surveyIntro")} />}
      {stage === "surveyIntro" && <SurveyIntro onBegin={() => setStage("survey")} />}
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
