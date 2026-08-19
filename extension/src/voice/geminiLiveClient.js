/**
 * extension/src/voice/geminiLiveClient.js
 * Gemini Live WebSocket Client with Zero-Hallucination Telemetry Grounding
 *
 * Pipeline:
 *  - Connects to Gemini Live BidiGenerateContent WebSocket
 *  - Sends setup frame with strict system directives and injected telemetry JSON
 *  - Streams 16kHz PCM audio chunks from microphone
 *  - Receives 24kHz PCM audio chunks & handles real-time barge-in events
 */

import { formatGroundedTelemetryPayload } from '../lib/telemetryEngine.js';

export const GEMINI_LIVE_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export class GeminiLiveClient {
  constructor({
    apiKey,
    onAudioResponse,
    onTranscriptPart,
    onInterrupted,
    onTurnComplete,
    onStatusChange,
    onError
  }) {
    this.apiKey = apiKey || null;
    this.onAudioResponse = onAudioResponse || (() => {});
    this.onTranscriptPart = onTranscriptPart || (() => {});
    this.onInterrupted = onInterrupted || (() => {});
    this.onTurnComplete = onTurnComplete || (() => {});
    this.onStatusChange = onStatusChange || (() => {});
    this.onError = onError || console.error;

    this.socket = null;
    this.isConnected = false;
  }

  /**
   * Connects to Gemini Live WebSocket and sends setup frame.
   * @param {Object} telemetryState Snapshot of current telemetry
   * @param {string} userName Display name of member
   */
  async connect(telemetryState = {}, userName = 'Member', apiKey = null) {
    if (this.isConnected) return;

    const key = apiKey || this.apiKey;
    if (!key) {
      const err = new Error('Gemini API key is required to initiate live voice session.');
      this.onError(err);
      throw err;
    }

    this.onStatusChange('Connecting to live neural audio pipeline…');

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${GEMINI_LIVE_WS_URL}?key=${encodeURIComponent(key)}`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          this.isConnected = true;
          this.onStatusChange('Handshake established. Initializing grounding directives…');
          this.sendSetupPayload(telemetryState, userName);
          resolve();
        };

        this.socket.onmessage = async (event) => {
          this.handleIncomingMessage(event);
        };

        this.socket.onerror = (err) => {
          console.error('[Aqla Voice] WebSocket error:', err);
          this.onError(err);
          reject(err);
        };

        this.socket.onclose = (event) => {
          this.isConnected = false;
          this.onStatusChange('Voice session ended.');
          if (!event.wasClean) {
            console.warn('[Aqla Voice] Disconnected uncleanly code:', event.code, event.reason);
          }
        };
      } catch (err) {
        this.onError(err);
        reject(err);
      }
    });
  }

  /**
   * Sends the initial configuration frame with strict anti-hallucination guardrails.
   */
  sendSetupPayload(telemetryState, userName) {
    const telemetryPayload = formatGroundedTelemetryPayload(telemetryState);

    const systemPrompt = `You are the Aqla Neurological Companion, a warm, concise, and scientifically grounded voice coach for ${userName}.
You are speaking out loud directly to the user in a low-latency real-time voice call.

GROUNDING & ZERO-HALLUCINATION RULES:
1. You have been provided with real-time telemetry JSON:
${JSON.stringify(telemetryPayload, null, 2)}
2. NEVER invent, estimate, or modify the Focus Index (${telemetryPayload.computed_focus_index}) or context switch numbers. Reference these exact numbers if discussing focus stamina.
3. If telemetry is synchronizing or null, state clearly: "Telemetry is currently synchronizing" rather than guessing.
4. Keep every spoken response under 2 sentences unless the user explicitly requests a breakdown.
5. Inquire gently about their current cognitive state (clarity, energy, stress, or task blocks) and provide one practical, evidence-based neuro-reset cue.`;

    const setupMessage = {
      setup: {
        model: 'models/gemini-2.0-flash-exp',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Puck' // Warm, calm voice
              }
            }
          },
          temperature: 0.1 // Strictly deterministic
        },
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        }
      }
    };

    this.sendMessage(setupMessage);
  }

  /**
   * Streams 16kHz PCM audio chunk to Gemini Live.
   * @param {string} base64Chunk
   */
  sendAudioChunk(base64Chunk) {
    if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const audioMessage = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Chunk
          }
        ]
      }
    };

    this.sendMessage(audioMessage);
  }

  /**
   * Handles incoming server messages.
   */
  async handleIncomingMessage(event) {
    try {
      let data = event.data;
      if (data instanceof Blob) {
        data = await data.text();
      }

      const msg = JSON.parse(data);

      // Server content parts
      if (msg.serverContent) {
        const { modelTurn, interrupted, turnComplete } = msg.serverContent;

        if (interrupted) {
          this.onInterrupted();
          this.onStatusChange('Listening…');
          return;
        }

        if (modelTurn?.parts) {
          for (const part of modelTurn.parts) {
            // Audio response
            if (part.inlineData?.data) {
              this.onAudioResponse(part.inlineData.data);
              this.onStatusChange('Speaking…');
            }
            // Text transcript if available
            if (part.text) {
              this.onTranscriptPart(part.text);
            }
          }
        }

        if (turnComplete) {
          this.onTurnComplete();
          this.onStatusChange('Listening…');
        }
      }
    } catch (err) {
      console.warn('[Aqla Voice] Error parsing incoming WS frame:', err);
    }
  }

  sendMessage(obj) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(obj));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }
}
