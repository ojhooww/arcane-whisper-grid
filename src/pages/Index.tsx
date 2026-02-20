import { HolographicScene } from '@/components/jarvis/HolographicScene';
import { HudOverlay } from '@/components/jarvis/HudOverlay';
import { TerminalPanel } from '@/components/jarvis/TerminalPanel';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

const Index = () => {
  const { state, logs, voiceLevel, sendMessage } = useVoiceRecognition();
  const isActive = state !== 'idle';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* 3D Holographic Sphere */}
      <HolographicScene voiceLevel={voiceLevel} isActive={isActive} />

      {/* HUD decorative overlay */}
      <HudOverlay state={state} />

      {/* Terminal log panel */}
      <TerminalPanel logs={logs} onSend={sendMessage} />
    </div>
  );
};

export default Index;
