import { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient } from '../services/api';
import { AudioProcessor } from '../utils/audioHelpers';

export type ConversationState = 'disconnected' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'error';

export interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
}

interface UseVoiceConversationReturn {
  state: ConversationState;
  messages: Message[];
  error: string | null;
  isConnected: boolean;
  startConversation: () => Promise<void>;
  stopConversation: () => void;
  setVoice: (voiceId: string) => Promise<void>;
}

export function useVoiceConversation(): UseVoiceConversationReturn {
  const [state, setState] = useState<ConversationState>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const currentTranscriptRef = useRef<string>('');

  /**
   * Initialize WebSocket connection
   */
  const connectWebSocket = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = apiClient.getWebSocketUrl();
        console.log('🔌 Connecting to WebSocket:', wsUrl);

        const ws = new WebSocket('wss://j33itoywcyver3-8000.proxy.runpod.net/ws');
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          setIsConnected(true);
          setState('listening');
          setError(null);
          wsRef.current = ws;
          resolve();
        };

        ws.onmessage = async (event) => {
          if (typeof event.data === 'string') {
            // JSON message (control messages)
            try {
              const message = JSON.parse(event.data);
              handleControlMessage(message);
            } catch (e) {
              console.error('Error parsing JSON message:', e);
            }
          } else {
            // Binary data (audio from backend)
            setState('speaking');
            await audioProcessorRef.current?.playAudio(event.data);
          }
        };

        ws.onerror = (event) => {
          console.error('❌ WebSocket error:', event);
          setError('Connection error. Please check if the backend is running.');
          setState('error');
          reject(new Error('WebSocket connection failed'));
        };

        ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          setIsConnected(false);

          if (state !== 'disconnected') {
            // Unexpected disconnect, attempt reconnect
            setState('error');
            setError('Connection lost. Attempting to reconnect...');
            scheduleReconnect();
          }
        };
      } catch (err) {
        console.error('Error creating WebSocket:', err);
        reject(err);
      }
    });
  }, [state]);

  /**
   * Handle control messages from backend
   */
  const handleControlMessage = (message: any) => {
    console.log('📨 Control message:', message);

    switch (message.type) {
      case 'CLEAR_BUFFER':
        // Backend requests to clear audio buffer (interruption)
        audioProcessorRef.current?.clearPlaybackBuffer();
        setState('listening');
        break;

      case 'TRANSCRIPT':
        // User speech transcript
        if (message.text && message.text.trim()) {
          currentTranscriptRef.current = message.text;
          addMessage('user', message.text);
        }
        break;

      case 'AI_RESPONSE':
        // AI text response
        if (message.text && message.text.trim()) {
          addMessage('ai', message.text);
        }
        break;

      case 'STATE_CHANGE':
        // Backend state notification
        if (message.state === 'PROCESSING') {
          setState('processing');
        } else if (message.state === 'SPEAKING') {
          setState('speaking');
        } else if (message.state === 'LISTENING') {
          setState('listening');
        }
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  };

  /**
   * Add message to conversation
   */
  const addMessage = (sender: 'ai' | 'user', text: string) => {
    const newMessage: Message = {
      id: `${sender}-${Date.now()}-${Math.random()}`,
      sender,
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  /**
   * Schedule reconnection attempt
   */
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = window.setTimeout(() => {
      console.log('🔄 Attempting to reconnect...');
      startConversation();
    }, 3000);
  };

  /**
   * Start conversation
   */
  const startConversation = useCallback(async (): Promise<void> => {
    try {
      setState('connecting');
      setError(null);

      // Initialize audio processor
      if (!audioProcessorRef.current) {
        audioProcessorRef.current = new AudioProcessor();
      }

      // Request microphone access
      await audioProcessorRef.current.initializeMicrophone();

      // Connect WebSocket
      await connectWebSocket();

      // Start capturing audio
      audioProcessorRef.current.startCapture((audioData) => {
        // Send audio to backend via WebSocket
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(audioData.buffer);
        }
      });

      console.log('✅ Conversation started');

      // Add initial message
      addMessage('ai', "¡Hola! Estoy lista para ayudarte a practicar inglés. ¿De qué te gustaría hablar?");

    } catch (err) {
      console.error('Error starting conversation:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to start conversation. Please check microphone permissions.'
      );
      setState('error');
    }
  }, [connectWebSocket]);

  /**
   * Stop conversation
   */
  const stopConversation = useCallback(() => {
    console.log('🛑 Stopping conversation');

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Stop audio capture
    audioProcessorRef.current?.stopCapture();

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Cleanup audio
    audioProcessorRef.current?.cleanup();
    audioProcessorRef.current = null;

    setState('disconnected');
    setIsConnected(false);
  }, []);

  /**
   * Set TTS voice
   */
  const setVoice = useCallback(async (voiceId: string): Promise<void> => {
    try {
      await apiClient.setVoice(voiceId);
      console.log('✅ Voice set to:', voiceId);
    } catch (err) {
      console.error('Error setting voice:', err);
      setError('Failed to change voice');
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);

  return {
    state,
    messages,
    error,
    isConnected,
    startConversation,
    stopConversation,
    setVoice,
  };
}
