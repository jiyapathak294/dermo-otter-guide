import { useRef, useState } from "react";
import { Play, ArrowRight, RotateCcw } from "lucide-react";

export const IntroVideo = ({ onNext }: { onNext: () => void }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);

  const replay = () => {
    if (!ref.current) return;
    ref.current.currentTime = 0;
    ref.current.play();
    setEnded(false);
  };

  return (
    <div className="app-frame bg-black">
      {/* Fullscreen video */}
      <video
        ref={ref}
        src="/DermaAI_Intro.mp4"
        autoPlay
        playsInline
        controls={false}
        onEnded={() => setEnded(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Floating buttons */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 px-6 z-10">
        <button
          onClick={replay}
          className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur text-navy font-heading text-sm px-5 py-3 shadow-soft active:bg-baby-blue active:scale-95 transition-all"
        >
          {ended ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          Replay
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-full bg-white text-navy font-heading text-sm px-6 py-3 shadow-soft border-2 border-baby-blue active:bg-baby-blue active:scale-95 transition-all"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
