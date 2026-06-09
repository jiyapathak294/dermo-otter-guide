import { useEffect, useState } from "react";
import { Survey } from "@/components/Survey";
import { AllDone } from "@/components/AllDone";
import { Home } from "@/pages/Home";
import { saveProfile, markOnboardingComplete, pushProfileToDB } from "@/lib/profile";
import { useAuth } from "@/lib/auth";

type Stage = "survey" | "done" | "home";

const Index = () => {
  const { user, onboardingCompleted, refreshProfile } = useAuth();
  const [stage, setStage] = useState<Stage>(onboardingCompleted ? "home" : "survey");

  useEffect(() => {
    // When auth/profile resolves, jump straight to home for returning users
    if (onboardingCompleted) setStage("home");
  }, [onboardingCompleted]);

  return (
    <main>
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
