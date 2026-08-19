/**
 * extension/src/voice/audioStreamer.js
 * Web Audio API PCM Audio Capture (16kHz), Playback (24kHz), and Visualizer Analyzer
 * 
 * Features:
 * - 16kHz PCM 16-bit Mono capture for Gemini Live WebSocket
 * - 24kHz PCM 16-bit playback queue with instant barge-in cancellation
 * - Real-time RMS audio level analyzer for visualizer orb animation
 */

export class AudioStreamer {
  constructor({ onAudioChunk, onVolumeChange, onError }) {
    this.onAudioChunk = onAudioChunk || (() => {});
    this.onVolumeChange = onVolumeChange || (() => {});
    this.onError = onError || console.error;

    this.inputAudioContext = null;
    this.outputAudioContext = null;
    this.mediaStream = null;
    this.processorNode = null;
    this.sourceNode = null;
    this.isRecording = false;

    // Playback state
    this.isPlaying = false;
    this.audioQueue = [];
    this.scheduledTime = 0;
    this.activeSourceNodes = [];
  }

  /**
   * Initializes microphone capture at 16,000 Hz.
   */
  async startRecording() {
    if (this.isRecording) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      
      // Buffer size 2048 at 16kHz = ~128ms chunks
      this.processorNode = this.inputAudioContext.createScriptProcessor(2048, 1, 1);

      this.processorNode.onaudioprocess = (event) => {
        if (!this.isRecording) return;
        const inputData = event.inputBuffer.getChannelData(0);

        // Calculate RMS for visualizer
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sumSquares / inputData.length);
        this.onVolumeChange(rms);

        // Convert Float32 to 16-bit PCM Linear
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to Base64
        const base64Chunk = this.arrayBufferToBase64(pcm16.buffer);
        this.onAudioChunk(base64Chunk);
      };

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.inputAudioContext.destination);
      this.isRecording = true;

      // Initialize output AudioContext for model speech playback
      if (!this.outputAudioContext) {
        this.outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 24000
        });
      }
    } catch (err) {
      this.isRecording = false;
      this.onError(err);
    }
  }

  /**
   * Stops recording and releases microphone track.
   */
  stopRecording() {
    this.isRecording = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.sourceNode && this.processorNode) {
      this.sourceNode.disconnect();
      this.processorNode.disconnect();
    }
    if (this.inputAudioContext && this.inputAudioContext.state !== 'closed') {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    this.onVolumeChange(0);
  }

  /**
   * Plays a 24kHz PCM 16-bit audio chunk received from Gemini Live.
   * @param {string} base64Audio Base64-encoded PCM 16-bit little-endian audio
   */
  playPcmChunk(base64Audio) {
    if (!this.outputAudioContext) {
      this.outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000
      });
    }

    if (this.outputAudioContext.state === 'suspended') {
      this.outputAudioContext.resume();
    }

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);

    // Convert Int16 PCM to Float32 for Web Audio
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768;
    }

    const audioBuffer = this.outputAudioContext.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioContext.destination);

    const currentTime = this.outputAudioContext.currentTime;
    if (this.scheduledTime < currentTime) {
      this.scheduledTime = currentTime;
    }

    source.start(this.scheduledTime);
    this.scheduledTime += audioBuffer.duration;
    this.activeSourceNodes.push(source);

    source.onended = () => {
      const idx = this.activeSourceNodes.indexOf(source);
      if (idx > -1) this.activeSourceNodes.splice(idx, 1);
    };
  }

  /**
   * Barge-in support: immediately stops any playing AI voice.
   */
  interruptPlayback() {
    for (const source of this.activeSourceNodes) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }
    this.activeSourceNodes = [];
    if (this.outputAudioContext) {
      this.scheduledTime = this.outputAudioContext.currentTime;
    }
  }

  /**
   * Cleanup everything.
   */
  teardown() {
    this.stopRecording();
    this.interruptPlayback();
    if (this.outputAudioContext && this.outputAudioContext.state !== 'closed') {
      this.outputAudioContext.close();
      this.outputAudioContext = null;
    }
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
