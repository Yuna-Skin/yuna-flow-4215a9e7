import { useEffect, useRef, useState } from "react";
import { Play, Pause, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

const BAR_COUNT = 56;
const SPEEDS = [1, 1.5, 2] as const;

type Props = {
  audioUrl: string | null;
  ambientVideoUrl?: string;
  poster?: string;
};

export function AudioModulePlayer({ audioUrl, ambientVideoUrl = "/ambient-loop.mp4", poster }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(0.12));

  const ensureAnalyser = async () => {
    if (!audioRef.current || ctxRef.current) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const source = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    ctxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;
    dataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
    if (ctx.state === "suspended") await ctx.resume();
  };

  useEffect(() => {
    const tick = () => {
      const analyser = analyserRef.current;
      const data = dataRef.current;
      if (playing && analyser && data) {
        analyser.getByteFrequencyData(data as Uint8Array<ArrayBuffer>);
        // Use lower frequency bins (more visible activity) and add subtle taper at edges
        const next = Array.from({ length: BAR_COUNT }, (_, i) => {
          const bin = data[i % Math.min(48, data.length)] / 255;
          // edge taper for elegance
          const edge = Math.sin((i / (BAR_COUNT - 1)) * Math.PI);
          return Math.max(0.06, bin * (0.5 + edge * 0.5));
        });
        setBars(next);
      } else {
        phaseRef.current += 0.035;
        const next = Array.from({ length: BAR_COUNT }, (_, i) => {
          const wave = Math.sin(phaseRef.current + i * 0.28) * 0.5 + 0.5;
          const edge = Math.sin((i / (BAR_COUNT - 1)) * Math.PI);
          return 0.08 + wave * 0.14 * edge;
        });
        setBars(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  useEffect(() => {
    return () => {
      try {
        sourceRef.current?.disconnect();
        analyserRef.current?.disconnect();
        ctxRef.current?.close();
      } catch {
        /* noop */
      }
    };
  }, []);

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a || !audioUrl) return;
    if (a.paused) {
      await ensureAnalyser();
      a.playbackRate = SPEEDS[speedIdx];
      await a.play();
    } else {
      a.pause();
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  };

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    setProgress(a.currentTime / a.duration);
  };

  const disabled = !audioUrl;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
      {/* Ambient background loop */}
      <video
        ref={videoRef}
        src={ambientVideoUrl}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full scale-105 object-cover"
      />
      {/* Vignette + bottom darken for waveform legibility */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          crossOrigin="anonymous"
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={onTimeUpdate}
        />
      )}

      {/* Speed pill — top right */}
      <button
        type="button"
        onClick={cycleSpeed}
        disabled={disabled}
        className={cn(
          "absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5",
          "bg-white/10 text-[11px] font-semibold text-white/90 backdrop-blur-md ring-1 ring-white/20",
          "transition-all hover:bg-white/20 hover:text-white disabled:opacity-40",
        )}
        aria-label="Velocidade de reprodução"
      >
        <Gauge className="h-3 w-3" strokeWidth={2.5} />
        {SPEEDS[speedIdx]}x
      </button>

      {/* Center play button */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <button
          type="button"
          onClick={togglePlay}
          disabled={disabled}
          aria-label={playing ? "Pausar áudio" : "Reproduzir áudio"}
          className={cn(
            "group relative flex h-[88px] w-[88px] items-center justify-center rounded-full",
            "bg-white/95 text-zinc-900 shadow-[0_10px_40px_-8px_rgba(0,0,0,0.7)] ring-1 ring-white/40",
            "transition-all duration-300 hover:scale-[1.06] active:scale-95",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
          )}
        >
          {/* Outer glow rings when playing */}
          {playing && (
            <>
              <span className="pointer-events-none absolute inset-[-12px] rounded-full ring-1 ring-white/30 animate-ping" />
              <span className="pointer-events-none absolute inset-[-22px] rounded-full ring-1 ring-white/15 animate-ping [animation-duration:2.4s]" />
            </>
          )}
          {playing ? (
            <Pause className="h-8 w-8 fill-current" strokeWidth={0} />
          ) : (
            <Play className="ml-1 h-8 w-8 fill-current" strokeWidth={0} />
          )}
        </button>
      </div>

      {/* Mirrored waveform — bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-6">
        <div className="flex h-16 items-center justify-center gap-[3px]" aria-hidden>
          {bars.map((h, i) => {
            const played = i / BAR_COUNT < progress;
            return (
              <span
                key={i}
                className={cn(
                  "relative w-[2.5px] rounded-full transition-[height,background-color] duration-100 ease-out",
                  played ? "bg-white" : "bg-white/55",
                )}
                style={{
                  height: `${Math.max(8, Math.round(h * 100))}%`,
                  boxShadow: playing ? "0 0 8px rgba(255,255,255,0.25)" : undefined,
                }}
              />
            );
          })}
        </div>
        {!audioUrl && (
          <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
            Áudio em breve
          </p>
        )}
      </div>
    </div>
  );
}
