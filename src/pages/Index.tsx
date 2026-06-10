import { useEffect, useState } from "react";
import { Survey } from "@/components/Survey";
import { AllDone } from "@/components/AllDone";
import { DermaIntro } from "@/components/DermaIntro";
import { Home } from "@/pages/Home";
import { saveProfile, markOnboardingComplete, pushProfileToDB } from "@/lib/profile";
import { useAuth } from "@/lib/auth";

type Stage = "intro" | "survey" | "done" | "home";

const Index = () => {
  const { user, onboardingCompleted, refreshProfile } = useAuth();
  const [stage, setStage] = useState<Stage>(onboardingCompleted ? "home" : "intro");

  useEffect(() => {
    if (onboardingCompleted) setStage("home");
  }, [onboardingCompleted]);

  return (
    <main>
      {stage === "intro" && <DermaIntro onNext={() => setStage("survey")} />}
      {stage === "survey" && (
        <Survey
          onComplete={async (a) => {
            saveProfile(a);
            markOnboardingComplete();
            if (user) await pushProfileToDB(user.id);
            await refreshProfile();
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
