import { useEffect, useState } from "react";
import { Survey } from "@/components/Survey";
import { AllDone } from "@/components/AllDone";
import { DermaIntro } from "@/components/DermaIntro";
import { Analyzing } from "@/components/Analyzing";
import { Home } from "@/pages/Home";
import { saveProfile, markOnboardingComplete, pushProfileToDB } from "@/lib/profile";
import { useAuth } from "@/lib/auth";

type Stage = "intro" | "survey" | "analyzing" | "done" | "home";
const INTRO_SEEN_KEY = "dermo.introSeen.v1";

const Index = () => {
  const { user, onboardingCompleted, refreshProfile } = useAuth();
  const [stage, setStage] = useState<Stage>(() => {
    if (onboardingCompleted) return "home";
    return localStorage.getItem(INTRO_SEEN_KEY) ? "survey" : "intro";
  });

  useEffect(() => { if (onboardingCompleted) setStage("home"); }, [onboardingCompleted]);

  return (
    <main>
      {stage === "intro" && (
        <DermaIntro onNext={() => { localStorage.setItem(INTRO_SEEN_KEY, "1"); setStage("survey"); }} />
      )}
      {stage === "survey" && (
        <Survey onComplete={async (a) => { saveProfile(a); setStage("analyzing"); }} />
      )}
      {stage === "analyzing" && (
        <Analyzing onDone={async () => {
          markOnboardingComplete();
          if (user) await pushProfileToDB(user.id);
          await refreshProfile();
          setStage("done");
        }} />
      )}
      {stage === "done" && <AllDone onNext={() => setStage("home")} />}
      {stage === "home" && <Home />}
    </main>
  );
};

export default Index;
