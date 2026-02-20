import { useState, useEffect, useCallback, useRef } from 'react';
import { sendTranscription, type ChatMessage } from '@/config/api';

export type JarvisState = 'idle' | 'listening' | 'processing' | 'responding';

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'system' | 'user' | 'jarvis';
  text: string;
}

type StoredLog = {
  id?: string;
  timestamp?: string | number | Date;
  type?: LogEntry['type'];
  text?: string;
};

type StoredMessage = {
  role?: ChatMessage['role'];
  content?: string;
};

const WAKE_WORD = 'jarvis';
const STORAGE_LOGS_KEY = 'jarvis.logs';
const STORAGE_MESSAGES_KEY = 'jarvis.messages';
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID as string | undefined;
const ELEVENLABS_MODEL_ID = import.meta.env.VITE_ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

const defaultLogs: LogEntry[] = [
  { id: '0', timestamp: new Date(), type: 'system', text: 'J.A.R.V.I.S. sistema inicializado.' },
  { id: '1', timestamp: new Date(), type: 'system', text: 'Aguardando wake-word "Jarvis"...' },
];

const loadStoredLogs = (): LogEntry[] => {
  if (typeof window === 'undefined') {
    return defaultLogs;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_LOGS_KEY);
    if (!raw) return defaultLogs;
    const parsed = JSON.parse(raw) as StoredLog[];
    if (!Array.isArray(parsed)) return defaultLogs;

    return parsed.map((entry) => ({
      id: String(entry.id ?? Date.now().toString() + Math.random()),
      timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
      type: entry.type === 'user' || entry.type === 'jarvis' || entry.type === 'system' ? entry.type : 'system',
      text: String(entry.text ?? ''),
    }));
  } catch {
    return defaultLogs;
  }
};

const loadStoredMessages = (): ChatMessage[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => ({
        role: entry.role === 'system' || entry.role === 'assistant' || entry.role === 'user' ? entry.role : 'user',
        content: String(entry.content ?? ''),
      }))
      .filter((entry: ChatMessage) => entry.content);
  } catch {
    return [];
  }
};

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
  const [logs, setLogs] = useState<LogEntry[]>(() => loadStoredLogs());
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadStoredMessages());
  const [voiceLevel, setVoiceLevel] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isActivatedRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesRef = useRef<ChatMessage[]>(messages);

  const addLog = useCallback((type: LogEntry['type'], text: string) => {
    setLogs(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
      type,
      text,
    }]);
  }, []);

  const addMessage = useCallback((role: ChatMessage['role'], content: string) => {
    setMessages(prev => [...prev, { role, content }]);
  }, []);

  const speakWithWebSpeech = useCallback((text: string): Promise<void> => {
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

  const speakWithElevenLabs = useCallback(async (text: string): Promise<void> => {
    setState('responding');
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY as string,
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.7,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    await new Promise<void>((resolve) => {
      const audio = new Audio(audioUrl);
      const levelInterval = window.setInterval(() => setVoiceLevel(Math.random() * 0.5 + 0.5), 120);

      const finalize = () => {
        window.clearInterval(levelInterval);
        URL.revokeObjectURL(audioUrl);
        setVoiceLevel(0);
        setState('idle');
        resolve();
      };

      audio.onended = finalize;
      audio.onerror = finalize;
      audio.play().catch(finalize);
    });
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID) {
      try {
        await speakWithElevenLabs(text);
        return;
      } catch (error) {
        console.error('Erro no ElevenLabs:', error);
      }
    }

    await speakWithWebSpeech(text);
  }, [speakWithElevenLabs, speakWithWebSpeech]);

  const sendMessage = useCallback(async (command: string) => {
    addLog('user', command);
    addMessage('user', command);
    setState('processing');
    addLog('system', '⏳ Processando comando...');

    const response = await sendTranscription(command, messagesRef.current);
    addLog('jarvis', response);
    addMessage('assistant', response);
    await speak(response);
    addLog('system', 'Aguardando wake-word "Jarvis"...');
  }, [addLog, addMessage, speak]);

  const startRecognition = useCallback(() => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      addLog('system', 'Web Speech API não suportada neste navegador.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (error) {
        console.error('Erro ao parar reconhecimento:', error);
      }
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
        isActivatedRef.current = false;
        sendMessage(command);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      // Auto restart
      restartTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (error) {
            console.error('Erro ao reiniciar reconhecimento:', error);
          }
        }
      }, 300);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento:', error);
    }
  }, [addLog, sendMessage]);

  useEffect(() => {
    speechSynthesis.getVoices();
    startRecognition();

    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (error) {
          console.error('Erro ao parar reconhecimento:', error);
        }
      }
    };
  }, [startRecognition]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  return { state, logs, voiceLevel, addLog, speak, sendMessage };
}
