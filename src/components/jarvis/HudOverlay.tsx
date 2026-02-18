import { useState, useEffect } from 'react';
import type { JarvisState } from '@/hooks/useVoiceRecognition';

interface HudOverlayProps {
  state: JarvisState;
}

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

const stateLabels: Record<JarvisState, string> = {
  idle: 'STANDBY',
  listening: 'LISTENING',
  processing: 'PROCESSING',
  responding: 'RESPONDING',
};

const stateColors: Record<JarvisState, string> = {
  idle: 'text-primary',
  listening: 'text-accent',
  processing: 'text-yellow-400',
  responding: 'text-accent',
};

export function HudOverlay({ state }: HudOverlayProps) {
  const time = useCurrentTime();

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 scanline opacity-30" />

      {/* Scanning line */}
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-20 animate-scan" />

      {/* Top left corner */}
      <div className="absolute top-4 left-4 font-orbitron text-xs">
        <div className="text-primary text-glow text-sm font-bold tracking-[0.3em]">
          J.A.R.V.I.S.
        </div>
        <div className="text-muted-foreground mt-1 text-[10px]">
          v4.2.1 // STARK INDUSTRIES
        </div>
      </div>

      {/* Top right - time & coordinates */}
      <div className="absolute top-4 right-4 font-mono-terminal text-[10px] text-muted-foreground text-right">
        <div>{time.toLocaleTimeString('pt-BR', { hour12: false })}</div>
        <div className="mt-0.5">LAT -23.5505 // LON -46.6333</div>
        <div className="mt-0.5">SYS.LOAD: 0.{Math.floor(Math.random() * 9)}2%</div>
      </div>

      {/* Bottom left - status */}
      <div className="absolute bottom-4 left-4 font-mono-terminal text-[10px]">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse-glow ${state === 'idle' ? 'bg-primary' : 'bg-accent'}`} />
          <span className="text-muted-foreground">STATUS:</span>
          <span className={`font-bold ${stateColors[state]}`}>
            {stateLabels[state]}
          </span>
        </div>
        <div className="text-muted-foreground mt-1">
          NEURAL.NET: ONLINE // VOICE.API: ACTIVE
        </div>
      </div>

      {/* Bottom right corner decoration */}
      <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground font-mono-terminal">
        <div>FRAME: {Math.floor(Math.random() * 60)}fps</div>
        <div className="mt-0.5">MEM: 128.4 MB</div>
      </div>

      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-12 h-12 border-l border-t border-primary/20" />
      <div className="absolute top-0 right-0 w-12 h-12 border-r border-t border-primary/20" />
      <div className="absolute bottom-0 left-0 w-12 h-12 border-l border-b border-primary/20" />
      <div className="absolute bottom-0 right-0 w-12 h-12 border-r border-b border-primary/20" />

      {/* Center label */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-32 font-orbitron text-[10px] text-muted-foreground tracking-[0.5em] text-center">
        <div className={`transition-all duration-500 ${state !== 'idle' ? 'text-primary text-glow' : ''}`}>
          {state === 'idle' ? 'WAKE WORD: "JARVIS"' : stateLabels[state] + '...'}
        </div>
      </div>
    </div>
  );
}
