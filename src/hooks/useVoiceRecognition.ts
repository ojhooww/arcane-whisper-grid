import { useState, useEffect, useCallback, useRef } from 'react';

export type JarvisState = 'idle' | 'listening' | 'processing' | 'responding';

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'system' | 'user' | 'jarvis';
  text: string;
}

const WAKE_WORD = 'jarvis';

function playActivationSound() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

export function useVoiceRecognition() {
  const [state, setState] = useState<JarvisState>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '0', timestamp: new Date(), type: 'system', text: 'J.A.R.V.I.S. sistema inicializado.' },
    { id: '1', timestamp: new Date(), type: 'system', text: 'Aguardando wake-word "Jarvis"...' },
  ]);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const recognitionRef = useRef<any>(null);
  const isActivatedRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout>();

  const addLog = useCallback((type: LogEntry['type'], text: string) => {
    setLogs(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
      type,
      text,
    }]);
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      setState('responding');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.pitch = 0.8;

      const voices = speechSynthesis.getVoices();
      const maleVoice = voices.find(v =>
        v.lang.startsWith('pt') && (v.name.toLowerCase().includes('male') || v.name.includes('Daniel') || v.name.includes('Google'))
      );
      if (maleVoice) utterance.voice = maleVoice;

      utterance.onboundary = () => setVoiceLevel(Math.random() * 0.5 + 0.5);
      utterance.onend = () => {
        setVoiceLevel(0);
        setState('idle');
        resolve();
      };
      utterance.onerror = () => {
        setVoiceLevel(0);
        setState('idle');
        resolve();
      };

      speechSynthesis.speak(utterance);
    });
  }, []);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addLog('system', 'Web Speech API não suportada neste navegador.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      const transcript = last[0].transcript.toLowerCase().trim();

      // Voice level simulation from interim results
      if (!last.isFinal) {
        setVoiceLevel(Math.min(1, transcript.length / 30));
        return;
      }

      setVoiceLevel(0);

      if (!isActivatedRef.current) {
        if (transcript.includes(WAKE_WORD)) {
          isActivatedRef.current = true;
          playActivationSound();
          setState('listening');
          addLog('system', '🟢 Wake-word detectada! Ouvindo comando...');
        }
      } else {
        // Got a command after activation
        const command = last[0].transcript.trim();
        addLog('user', command);
        isActivatedRef.current = false;
        setState('processing');
        addLog('system', '⏳ Processando comando...');

        // Import dynamically to avoid circular deps
        import('@/config/api').then(({ sendTranscription }) => {
          sendTranscription(command).then(response => {
            addLog('jarvis', response);
            speak(response).then(() => {
              addLog('system', 'Aguardando wake-word "Jarvis"...');
            });
          });
        });
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      // Auto restart
      restartTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch {}
        }
      }, 300);
    };

    try {
      recognition.start();
    } catch {}
  }, [addLog, speak]);

  useEffect(() => {
    // Preload voices
    speechSynthesis.getVoices();
    startRecognition();

    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [startRecognition]);

  return { state, logs, voiceLevel, addLog, speak };
}
