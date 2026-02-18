const API_URL = import.meta.env.VITE_API_URL || 'http://167.88.33.83:8080/api/v1/message';
const API_TOKEN = import.meta.env.VITE_API_TOKEN as string | undefined;

export async function sendTranscription(text: string): Promise<string> {
  try {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    if (API_TOKEN) {
      headers.Authorization = `Bearer ${API_TOKEN}`;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || data.message || 'Sem resposta do servidor.';
  } catch (error) {
    console.error('Erro ao contactar Clawbot:', error);
    return 'Desculpe, não consegui contactar o servidor. Verifique a conexão.';
  }
}
