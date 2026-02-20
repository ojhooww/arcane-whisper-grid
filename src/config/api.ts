const API_URL = import.meta.env.VITE_API_URL || '/api/v1/message';
const API_TOKEN = import.meta.env.VITE_API_TOKEN as string | undefined;
const API_SESSION = import.meta.env.VITE_API_SESSION || 'main';
const API_MODEL = import.meta.env.VITE_API_MODEL || 'Gemini 2.5 Flash';
const API_MAX_TOKENS = Number(import.meta.env.VITE_API_MAX_TOKENS || 100);

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export async function sendTranscription(text: string, history: ChatMessage[] = []): Promise<string> {
  try {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    if (API_TOKEN) {
      headers.Authorization = `Bearer ${API_TOKEN}`;
    }

    const messages = [...history, { role: 'user', content: text }].filter(message => message.content);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages,
        model: API_MODEL,
        max_tokens: API_MAX_TOKENS,
        session: API_SESSION,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const message =
      data?.choices?.[0]?.message?.content ||
      data?.response ||
      data?.message ||
      data?.text;
    return message || 'Sem resposta do servidor.';
  } catch (error) {
    console.error('Erro ao contactar Clawbot:', error);
    return 'Desculpe, não consegui contactar o servidor. Verifique a conexão.';
  }
}
