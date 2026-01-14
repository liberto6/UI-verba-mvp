// API Configuration and Client for Verba Backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export interface VoiceOption {
  id: string;
  name: string;
}

class VerbaAPIClient {
  private baseUrl: string;
  private wsBaseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL.replace(/\/+$/, '');     // quita / finales
    this.wsBaseUrl = WS_BASE_URL.replace(/\/+$/, '');    // quita / finales

  }

  /**
   * Set the TTS voice on the backend
   */
  async setVoice(voiceId: string): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/set_voice`, {
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
