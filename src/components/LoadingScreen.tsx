import { useEffect } from "react";

export const LoadingScreen = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full border-4 border-jazz-blue/20" />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent animate-spin-slow"
          style={{ borderTopColor: "hsl(var(--jazz-blue))" }}
        />
      </div>
      <p className="mt-6 font-bubble text-2xl tracking-wide" style={{ color: "hsl(var(--jazz-blue))" }}>
        loading
        <span className="animate-pulse-soft">…</span>
      </p>
    </div>
  );
};
