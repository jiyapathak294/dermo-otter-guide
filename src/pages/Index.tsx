import { useState } from "react";
import { BrandSplash } from "@/components/BrandSplash";
import { DermaIntro } from "@/components/DermaIntro";
import { Survey } from "@/components/Survey";
import { AllDone } from "@/components/AllDone";
import { Home } from "@/pages/Home";
import { saveProfile, loadProfile } from "@/lib/profile";

type Stage = "splash" | "derma" | "survey" | "done" | "home";

const Index = () => {
  // Always start on the survey page for preview/demo purposes
  const [stage, setStage] = useState<Stage>("survey");

  return (
    <main>
      {stage === "splash" && <BrandSplash onNext={() => setStage("derma")} />}
      {stage === "derma" && <DermaIntro onNext={() => setStage("survey")} />}
      {stage === "survey" && (
        <Survey
          onComplete={(a) => {
            saveProfile(a);
            setStage("done");
          }}
        />
      )}
      {stage === "done" && <AllDone onNext={() => setStage("home")} />}
      {stage === "home" && <Home />}
    </main>
  );
};

export default Index;
