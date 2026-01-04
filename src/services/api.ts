// API Configuration and Client for Verba Backend

const API_BASE_URL = https://j33itoywcyver3-8000.proxy.runpod.net;
const WS_BASE_URL = wss://j33itoywcyver3-8000.proxy.runpod.net;

export interface VoiceOption {
  id: string;
  name: string;
}

class VerbaAPIClient {
  private baseUrl: string;
  private wsBaseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.wsBaseUrl = WS_BASE_URL;
  }

  /**
   * Set the TTS voice on the backend
   */
  async setVoice(voiceId: string): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/set_voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voice_id: voiceId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to set voice: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting voice:', error);
      throw error;
    }
  }

  /**
   * Get WebSocket URL for audio streaming
   */
  getWebSocketUrl(): string {
    return `${this.wsBaseUrl}/ws`;
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const apiClient = new VerbaAPIClient();
