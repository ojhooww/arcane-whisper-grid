import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { LogEntry } from '@/hooks/useVoiceRecognition';
import { sendTranscription } from '@/config/api';

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
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || isSending) return;

    setIsSending(true);
    try {
      const responseText = await sendTranscription(value);
      const utterance = new SpeechSynthesisUtterance(responseText);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      speechSynthesis.speak(utterance);
    } finally {
      setIsSending(false);
      setText('');
    }
  };

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

      <div className="flex flex-col h-[calc(100%-36px)]">
        <ScrollArea className="flex-1">
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

        <form onSubmit={handleSubmit} className="border-t border-border/40 px-3 py-2 flex items-center gap-2">
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Digite uma mensagem para o J.A.R.V.I.S."
            disabled={isSending}
            className="h-8 text-[11px] font-mono-terminal"
          />
          <Button type="submit" size="sm" disabled={isSending || !text.trim()}>
            {isSending ? 'Enviando...' : 'Enviar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
