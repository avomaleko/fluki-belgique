import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  src: string;
  title?: string;
  onPlay?: () => void;
  className?: string;
};

/**
 * Leitor de áudio próprio da aplicação: play/pause, barra de progresso
 * arrastável, tempo, volume — pensado para telemóvel.
 */
export function AudioPlayer({ src, title, onPlay, className }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
  }, [volume]);

  useEffect(() => {
    // reset when src changes
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => {});
      if (!playedRef.current) {
        playedRef.current = true;
        onPlay?.();
      }
    } else {
      a.pause();
    }
  };

  const seekTo = (clientX: number, el: HTMLElement) => {
    const a = audioRef.current;
    if (!a || !isFinite(a.duration)) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    a.currentTime = ratio * a.duration;
    setCurrent(a.currentTime);
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const skip = (secs: number) => {
    const a = audioRef.current;
    if (!a || !isFinite(a.duration)) return;
    a.currentTime = Math.min(a.duration, Math.max(0, a.currentTime + secs));
  };

  return (
    <div className={cn("rounded-xl border border-border bg-muted/30 p-3 sm:p-4", className)}>
      {title && <p className="mb-2 truncate text-sm font-medium">{title}</p>}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          onClick={toggle}
          aria-label={playing ? "Pausar" : "Reproduzir"}
          className="h-11 w-11 shrink-0 rounded-full"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>

        <div className="flex-1 min-w-0">
          <div
            role="slider"
            tabIndex={0}
            aria-label="Progresso"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") skip(5);
              if (e.key === "ArrowLeft") skip(-5);
            }}
            onClick={(e) => !scrubbing && seekTo(e.clientX, e.currentTarget)}
            onMouseDown={(e) => { setScrubbing(true); seekTo(e.clientX, e.currentTarget); }}
            onMouseMove={(e) => { if (scrubbing) seekTo(e.clientX, e.currentTarget); }}
            onMouseUp={() => setScrubbing(false)}
            onMouseLeave={() => setScrubbing(false)}
            onTouchStart={(e) => { setScrubbing(true); seekTo(e.touches[0].clientX, e.currentTarget); }}
            onTouchMove={(e) => seekTo(e.touches[0].clientX, e.currentTarget)}
            onTouchEnd={() => setScrubbing(false)}
            className="group relative h-6 w-full cursor-pointer touch-none"
          >
            <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-[width] duration-100" style={{ width: `${progress}%` }} />
            </div>
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow ring-2 ring-background transition-transform group-hover:scale-110"
              style={{ left: `${progress}%` }}
            />
          </div>
          <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={muted ? "Ativar som" : "Silenciar"}
            onClick={() => {
              const a = audioRef.current;
              if (!a) return;
              a.muted = !a.muted;
              setMuted(a.muted);
            }}
          >
            {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              setMuted(v === 0);
              const a = audioRef.current;
              if (a) { a.volume = v; a.muted = v === 0; }
            }}
            aria-label="Volume"
            className="h-1.5 w-20 cursor-pointer"
            style={{ accentColor: "var(--primary)" }}
          />
        </div>

        <div className="flex sm:hidden flex-col gap-1 shrink-0">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Recuar 10 segundos" onClick={() => skip(-10)}>
            <SkipBack className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex sm:hidden flex-col gap-1 shrink-0">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Avançar 10 segundos" onClick={() => skip(10)}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => !scrubbing && setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
      />
    </div>
  );
}
