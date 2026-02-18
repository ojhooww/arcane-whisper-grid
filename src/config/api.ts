// Configuração da API do Clawbot
// Altere esta URL para apontar para seu backend
export const API_CONFIG = {
  baseUrl: 'https://your-vps-url.com/api',
  endpoint: '/chat',
  get fullUrl() {
    return `${this.baseUrl}${this.endpoint}`;
  },
};

export async function sendTranscription(text: string): Promise<string> {
  try {
    const response = await fetch(API_CONFIG.fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
