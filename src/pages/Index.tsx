import { useState } from "react";
import { IntroVideo } from "@/components/IntroVideo";
import { LoadingVideo } from "@/components/LoadingVideo";
import { DermaIntro } from "@/components/DermaIntro";
import { Survey } from "@/components/Survey";
import { Home } from "@/pages/Home";
import { saveProfile, loadProfile } from "@/lib/profile";

type Stage = "intro" | "loading" | "derma" | "survey" | "loading2" | "home";

const Index = () => {
  const [stage, setStage] = useState<Stage>(loadProfile() ? "home" : "intro");

  return (
    <main>
      {stage === "intro" && <IntroVideo onNext={() => setStage("loading")} />}
      {stage === "loading" && <LoadingVideo onNext={() => setStage("derma")} />}
      {stage === "derma" && <DermaIntro onNext={() => setStage("survey")} />}
      {stage === "survey" && (
        <Survey
          onComplete={(a) => {
            saveProfile(a);
            setStage("loading2");
          }}
        />
      )}
      {stage === "loading2" && <LoadingVideo onNext={() => setStage("home")} />}
      {stage === "home" && <Home />}
    </main>
  );
};

export default Index;
