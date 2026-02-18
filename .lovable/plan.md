

# 🤖 J.A.R.V.I.S. HUD — Assistente de Voz Futurista

Uma interface holográfica inspirada no JARVIS do Iron Man, construída com React, Three.js e Web Speech API.

---

## Fase 1: Visual 3D — Esfera de Partículas Holográfica

- Esfera orgânica com milhares de partículas 3D cyan/neon usando React Three Fiber
- Efeito de Bloom/Glow para aparência de holograma
- Animação idle com flutuação suave e pulsação contínua
- Fundo preto/azul escuro com gradiente profundo

## Fase 2: Estética HUD

- Elementos decorativos: bordas finas, coordenadas de tela, indicador "Status: Online"
- Painel lateral com efeito Glassmorphism (vidro fosco) para logs do terminal
- Fonte mono estilo terminal para transcrições
- Animações sutis nos elementos de HUD (scanning lines, pulsações)

## Fase 3: Sistema de Voz

- Escuta contínua com wake-word "Jarvis" usando Web Speech API
- Som de ativação tecnológico (ping) ao detectar "Jarvis"
- Mudança visual das partículas (cor mais intensa/branca) ao ativar
- Captura do comando de voz e exibição no painel de log/terminal
- Partículas reagem (pulsam/aceleram) quando detectam voz

## Fase 4: Resposta por Voz e API

- Serviço com URL placeholder configurável para envio de transcrições via POST
- Resposta em voz usando speechSynthesis (voz masculina e calma)
- Esfera 3D vibra em sincronia com a frequência da fala
- Indicadores visuais de estado: "Ouvindo...", "Processando...", "Respondendo..."

