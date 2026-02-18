import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LogEntry } from '@/hooks/useVoiceRecognition';

interface TerminalPanelProps {
  logs: LogEntry[];
}

const typeColors: Record<string, string> = {
  system: 'text-muted-foreground',
  user: 'text-accent',
  jarvis: 'text-primary',
};

const typeLabels: Record<string, string> = {
  system: 'SYS',
  user: 'USR',
  jarvis: 'JAR',
};

export function TerminalPanel({ logs }: TerminalPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="absolute right-4 top-20 bottom-20 w-80 z-20 glass-panel rounded-sm hud-glow">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between">
        <span className="font-orbitron text-[10px] text-primary tracking-widest">
          TERMINAL LOG
        </span>
        <span className="text-[9px] text-muted-foreground font-mono-terminal">
          {logs.length} entries
        </span>
      </div>

      {/* Logs */}
      <ScrollArea className="h-[calc(100%-36px)]">
        <div className="p-3 space-y-1.5">
          {logs.map((log) => (
            <div key={log.id} className="font-mono-terminal text-[11px] leading-relaxed">
              <span className="text-muted-foreground opacity-50">
                [{log.timestamp.toLocaleTimeString('pt-BR', { hour12: false })}]
              </span>{' '}
              <span className={`font-bold ${typeColors[log.type]}`}>
                [{typeLabels[log.type]}]
              </span>{' '}
              <span className={typeColors[log.type]}>
                {log.text}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
