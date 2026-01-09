// Audio utilities for WebRTC and audio processing

const SAMPLE_RATE = 16000; // 16kHz to match backend
const BUFFER_SIZE = 4096;

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private audioQueue: Int16Array[] = [];
  private isPlaying = false;

  /**
   * Initialize audio capture from microphone
   */
  async initializeMicrophone(): Promise<void> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: SAMPLE_RATE,
        },
      });

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      console.log('✅ Microphone initialized');
    } catch (error) {
      console.error('Error initializing microphone:', error);
      throw new Error('Failed to access microphone. Please grant permission.');
    }
  }

  /**
   * Start capturing audio and send via callback
   */
  startCapture(onAudioData: (data: Int16Array) => void): void {
    if (!this.audioContext || !this.sourceNode) {
      throw new Error('Microphone not initialized');
    }

    // Create processor node
    this.processorNode = this.audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    this.processorNode.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);

      // Convert Float32Array to Int16Array
      const int16Data = this.floatTo16BitPCM(inputData);

      // Send to callback
      onAudioData(int16Data);
    };

    // Connect nodes
    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);

    console.log('🎤 Audio capture started');
  }

  /**
   * Stop capturing audio
   */
  stopCapture(): void {
    if (this.processorNode && this.sourceNode) {
      this.sourceNode.disconnect(this.processorNode);
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    console.log('🛑 Audio capture stopped');
  }

  /**
   * Play audio data received from backend
   */
  async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    }

    try {
      // Convert Int16 to Float32
      const int16Array = new Int16Array(audioData);
      const float32Array = this.int16ToFloat32(int16Array);

      // Create audio buffer
      const audioBuffer = this.audioContext.createBuffer(
        1,
        float32Array.length,
        SAMPLE_RATE
      );
      audioBuffer.getChannelData(0).set(float32Array);

      // Create source and play
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  /**
   * Clear audio playback buffer
   */
  clearPlaybackBuffer(): void {
    // Stop all scheduled audio
    if (this.audioContext) {
      // Close and recreate audio context to stop all playing audio
      const oldContext = this.audioContext;
      oldContext.close().catch(err => console.warn('Error closing audio context:', err));
      this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    }
    this.audioQueue = [];
    console.log('🗑️ Playback buffer cleared');
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopCapture();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log('🧹 Audio processor cleaned up');
  }

  // Helper: Convert Float32Array to Int16Array
  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  // Helper: Convert Int16Array to Float32Array
  private int16ToFloat32(int16Array: Int16Array): Float32Array {
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7fff);
    }
    return float32Array;
  }

  /**
   * Check if microphone permission is granted
   */
  static async checkMicrophonePermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state === 'granted';
    } catch {
      // Fallback: try to access microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  }
}
