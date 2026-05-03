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
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-soft bg-spa-mist">
        <video
          ref={ref}
          src="/DermaAI_Intro.mp4"
          autoPlay
          playsInline
          controls={false}
          onEnded={() => setEnded(true)}
          className="w-full h-auto block bg-white"
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <button
          onClick={replay}
          className="inline-flex items-center gap-2 rounded-full bg-baby-blue text-navy font-bubble text-lg px-6 py-3 shadow-soft hover:scale-105 active:scale-95 transition-transform"
        >
          {ended ? <RotateCcw className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          Replay
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-full bg-baby-blue text-navy font-bubble text-lg px-7 py-3 shadow-soft hover:scale-105 active:scale-95 transition-transform"
        >
          Next
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
