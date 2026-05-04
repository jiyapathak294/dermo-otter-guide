import { useRef, useState } from "react";

export const LoadingVideo = ({ onNext }: { onNext: () => void }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);

  const handleEnded = () => {
    setFading(true);
    setTimeout(onNext, 600);
  };

  return (
    <div className="app-frame bg-white">
      <video
        ref={ref}
        src="/Loading.mp4"
        autoPlay
        playsInline
        muted
        controls={false}
        onEnded={handleEnded}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-600 ${
          fading ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};
