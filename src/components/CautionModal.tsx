import { X, AlertTriangle, ShieldAlert, HeartPulse, Stethoscope } from "lucide-react";
import { UserProfile } from "@/lib/profile";

export const CautionModal = ({ profile, onClose }: { profile: UserProfile | null; onClose: () => void }) => {
  const sens = (profile?.sensitivities || []).filter((s) => s !== "None" && s !== "Unsure");
  const allergies = profile?.allergies || [];
  const pregnant = profile?.lifeStage === "Pregnant" || profile?.lifeStage === "Breastfeeding";

  return (
    <div className="fixed inset-0 z-[100] flex items-end animate-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl p-5 max-h-[80%] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-yellow-700" />
            <h3 className="font-heading text-navy text-lg">Safety & Cautions</h3>
          </div>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <Section icon={AlertTriangle} title="Ingredient warnings">
          {sens.length ? (
            <ul className="list-disc pl-5 text-sm space-y-1">
              {sens.map((s) => <li key={s}>Avoid <b>{s}</b> in routine.</li>)}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No flagged ingredients.</p>}
        </Section>

        <Section icon={HeartPulse} title="Allergies">
          {allergies.length ? (
            <ul className="list-disc pl-5 text-sm space-y-1">
              {allergies.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          ) : <p className="text-sm text-muted-foreground">None reported.</p>}
        </Section>

        <Section icon={ShieldAlert} title="Pregnancy / Breastfeeding">
          {pregnant ? (
            <p className="text-sm">You indicated <b>{profile?.lifeStage}</b>. Avoid retinoids, tretinoin, adapalene, high-dose salicylic acid, and hydroquinone.</p>
          ) : <p className="text-sm text-muted-foreground">Not applicable.</p>}
        </Section>

        <Section icon={Stethoscope} title="Dermatologist disclaimer">
          <p className="text-sm">Dermo AI provides educational, AI-generated guidance. It does <b>not diagnose conditions</b> or replace care from a board-certified dermatologist. For persistent or severe symptoms, consult a professional.</p>
        </Section>

        <button onClick={onClose} className="w-full mt-4 rounded-full bg-baby-blue py-3 font-heading text-white shadow-soft active:scale-95">
          Got it
        </button>
      </div>
    </div>
  );
};

const Section = ({ icon: Icon, title, children }: any) => (
  <div className="border-t border-border py-3">
    <div className="flex items-center gap-2 mb-1.5">
      <Icon className="h-4 w-4 text-navy" />
      <p className="font-heading text-navy text-sm">{title}</p>
    </div>
    {children}
  </div>
);
