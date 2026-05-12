import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const BAR_COUNT = 28;
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
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(0.15));

  // Initialize audio analyser lazily on first play
  const ensureAnalyser = async () => {
    if (!audioRef.current || ctxRef.current) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const source = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.78;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    ctxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;
    dataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
    if (ctx.state === "suspended") await ctx.resume();
  };

  // Animation loop
  useEffect(() => {
    const tick = () => {
      const analyser = analyserRef.current;
      const data = dataRef.current;
      if (playing && analyser && data) {
        analyser.getByteFrequencyData(data as Uint8Array<ArrayBuffer>);
        const next = Array.from({ length: BAR_COUNT }, (_, i) => {
          const bin = data[i % data.length] / 255;
          return Math.max(0.08, bin);
        });
        setBars(next);
      } else {
        // breathing animation when idle
        phaseRef.current += 0.04;
        const next = Array.from({ length: BAR_COUNT }, (_, i) => {
          const wave = Math.sin(phaseRef.current + i * 0.35) * 0.5 + 0.5;
          return 0.1 + wave * 0.12;
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

  // Cleanup audio context on unmount
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

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  };

  const disabled = !audioUrl;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Ambient background loop */}
      <video
        ref={videoRef}
        src={ambientVideoUrl}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />

      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          crossOrigin="anonymous"
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}

      {/* Foreground content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-6 px-6">
        <button
          type="button"
          onClick={togglePlay}
          disabled={disabled}
          aria-label={playing ? "Pausar áudio" : "Reproduzir áudio"}
          className={cn(
            "group relative flex h-20 w-20 items-center justify-center rounded-full backdrop-blur-md transition-all",
            "bg-white/15 ring-1 ring-white/30 hover:bg-white/25 hover:scale-105 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {playing ? (
            <Pause className="h-7 w-7 fill-white text-white" />
          ) : (
            <Play className="ml-1 h-7 w-7 fill-white text-white" />
          )}
          {/* Pulse ring while playing */}
          {playing && (
            <span className="absolute inset-0 rounded-full ring-2 ring-white/40 animate-ping" />
          )}
        </button>

        {/* Waveform */}
        <div className="flex h-14 items-center gap-[3px]" aria-hidden>
          {bars.map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-white/85 transition-[height] duration-75 ease-out"
              style={{ height: `${Math.round(h * 100)}%` }}
            />
          ))}
        </div>

        {/* Speed pill */}
        <button
          type="button"
          onClick={cycleSpeed}
          disabled={disabled}
          className="rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md ring-1 ring-white/30 transition-all hover:bg-white/25 disabled:opacity-50"
        >
          {SPEEDS[speedIdx]}x
        </button>

        {!audioUrl && (
          <p className="absolute bottom-5 text-xs uppercase tracking-widest text-white/70">
            Áudio em breve
          </p>
        )}
      </div>
    </div>
  );
}
