// Voice and Audio Synthesis Service for Accessible MTN MoMo Assistant

type AudioTone = 'listen_start' | 'listen_stop' | 'confirm' | 'success' | 'error';

class VoiceService {
  private synth: SpeechSynthesis | null = null;
  private recognition: any = null;
  private isListening = false;
  private audioCtx: AudioContext | null = null;
  private speechRate = 1.0;
  private isMuted = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private currentLanguage = 'twi';
  private currentAudio: HTMLAudioElement | null = null;
  private onAnnouncementListeners: Array<(text: string, priority: 'assertive' | 'polite') => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.initVoice();
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-GH'; // Ghanaian English priority, falls back automatically
      }
    }
  }

  private initVoice() {
    if (!this.synth) return;
    const updateVoices = () => {
      const voices = this.synth?.getVoices() || [];
      // Prefer clear, warm, natural voices (e.g. Google UK Female, Natural, Neural)
      const preferred = voices.find(
        (v) =>
          (v.name.includes('Natural') ||
            v.name.includes('Neural') ||
            v.name.includes('Google UK English Female') ||
            v.name.includes('Serena') ||
            v.name.includes('Moira') ||
            v.name.includes('Google')) &&
          (v.lang.startsWith('en') || v.lang.startsWith('ak'))
      );
      this.selectedVoice = preferred || voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
    };

    updateVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = updateVoices;
    }
  }

  public setLanguage(lang: string) {
    this.currentLanguage = lang;
  }

  public getLanguage(): string {
    return this.currentLanguage;
  }

  public registerAnnouncementListener(listener: (text: string, priority: 'assertive' | 'polite') => void) {
    this.onAnnouncementListeners.push(listener);
    return () => {
      this.onAnnouncementListeners = this.onAnnouncementListeners.filter((l) => l !== listener);
    };
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public setRate(rate: number) {
    this.speechRate = Math.max(0.5, Math.min(2.0, rate));
  }

  public getRate() {
    return this.speechRate;
  }

  public playTone(tone: AudioTone) {
    if (this.isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      if (tone === 'listen_start') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (tone === 'listen_stop') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (tone === 'success') {
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          if (!this.audioCtx) return;
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          const startTime = now + idx * 0.08;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.18, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);
          osc.start(startTime);
          osc.stop(startTime + 0.22);
        });
      } else if (tone === 'confirm') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (tone === 'error') {
        [220, 196].forEach((freq, idx) => {
          if (!this.audioCtx) return;
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          const startTime = now + idx * 0.12;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.15, startTime);
          gain.gain.linearRampToValueAtTime(0.01, startTime + 0.1);
          osc.start(startTime);
          osc.stop(startTime + 0.1);
        });
      }
    } catch {
      // AudioContext could fail on some restricted autoplay policies
    }
  }

  private isSpeakingState = false;
  private audioMeterStream: MediaStream | null = null;
  private audioMeterInterval: any = null;
  private audioLevelListeners: Array<(level: number) => void> = [];

  public getIsSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public onAudioLevel(listener: (level: number) => void) {
    this.audioLevelListeners.push(listener);
    return () => {
      this.audioLevelListeners = this.audioLevelListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Speaks text using Natural Human Gemini TTS first, falling back to tuned client synthesis.
   * Ensures microphone is stopped before speaking and releases lock when done.
   */
  public async speak(
    text: string,
    options?: {
      priority?: 'assertive' | 'polite';
      onEnd?: () => void;
      interrupt?: boolean;
    }
  ): Promise<void> {
    const priority = options?.priority || 'polite';

    // Broadcast to TalkBack simulator & aria-live listeners
    this.onAnnouncementListeners.forEach((fn) => fn(text, priority));

    if (this.isMuted) {
      if (options?.onEnd) setTimeout(options.onEnd, 300);
      return;
    }

    // Never allow microphone to listen while speaking (prevents acoustic feedback)
    this.stopListening();
    this.stopSpeaking();
    this.isSpeakingState = true;

    const wrappedOnEnd = () => {
      this.isSpeakingState = false;
      this.currentAudio = null;
      options?.onEnd?.();
    };

    // Attempt 1: Call server Gemini TTS for rich natural West African human voice
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: this.currentLanguage,
          voiceName: 'Kore',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
          this.currentAudio = audio;

          return new Promise((resolve) => {
            audio.onended = () => {
              wrappedOnEnd();
              resolve();
            };
            audio.onerror = () => {
              this.currentAudio = null;
              // Fall back to client synthesis
              this.speakWithClientSynth(text, { priority, onEnd: wrappedOnEnd }).then(resolve);
            };
            audio.play().catch(() => {
              this.speakWithClientSynth(text, { priority, onEnd: wrappedOnEnd }).then(resolve);
            });
          });
        }
      }
    } catch {
      // Server not reachable or error, fall through to client synthesis
    }

    // Attempt 2: Fallback to tuned client-side speech synthesis
    return this.speakWithClientSynth(text, { priority, onEnd: wrappedOnEnd });
  }

  private speakWithClientSynth(
    text: string,
    options?: {
      priority?: 'assertive' | 'polite';
      onEnd?: () => void;
    }
  ): Promise<void> {
    if (!this.synth) {
      if (options?.onEnd) setTimeout(options.onEnd, 400);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      // Natural phonetic smoothing for tonal Ghanaian languages
      const smoothedText = this.smoothGhanaianPhonetics(text, this.currentLanguage);
      const utterance = new SpeechSynthesisUtterance(smoothedText);

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      // Slightly lower rate and natural pitch prevents robotic rattle
      utterance.rate = this.currentLanguage !== 'en' ? 0.9 : this.speechRate;
      utterance.pitch = this.currentLanguage !== 'en' ? 1.08 : 1.0;

      utterance.onend = () => {
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = () => {
        options?.onEnd?.();
        resolve();
      };

      this.synth?.speak(utterance);
    });
  }

  /**
   * Phonetic smoothing to help client speech synthesis pronounce Akan/Ewe/Ga vowels naturally
   */
  private smoothGhanaianPhonetics(text: string, lang: string): string {
    if (lang === 'en') return text;
    // Replace hard ASCII substitutions for smoother tonal flow
    return text
      .replace(/ɛ/g, 'eh')
      .replace(/ɔ/g, 'or')
      .replace(/ɖ/g, 'd')
      .replace(/ʋ/g, 'v')
      .replace(/ŋ/g, 'ng')
      .replace(/nyɛla/g, 'nyehla')
      .replace(/pɛpɛɛpɛ/g, 'peh-peh-eh-peh')
      .replace(/Akwaaba/g, 'Ahk-waa-bah');
  }

  public stopSpeaking() {
    this.isSpeakingState = false;
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // Ignore
      }
      this.currentAudio = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    return Boolean(this.recognition);
  }

  /**
   * Hands-free listening with Voice Activity Detection (VAD) / ~1s silence detection.
   * Auto-stops ~1000ms after speech ends and emits speechEndMs timestamp for timing logs.
   */
  public startHandsFreeListening(callbacks: {
    onResult: (transcript: string, timings: { speechEndMs: number; transcriptReceivedMs: number }) => void;
    onSilence: () => void;
    onError: (error: string) => void;
    onEnd: () => void;
    turnId: number;
  }) {
    // Strict mutual exclusion: never listen while speaking
    if (this.isSpeakingState) {
      console.log(`[VoiceService] Cannot listen while TTS is speaking. Turn #${callbacks.turnId} skipped.`);
      return;
    }

    if (!this.recognition) {
      callbacks.onError('Speech recognition is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.playTone('listen_start');
    this.isListening = true;

    let speechDetected = false;
    let accumulatedTranscript = '';
    let speechEndTimestamp = 0;
    let silenceTimer: any = null;
    let noSpeechTimeout: any = null;

    // Start audio metering for hands-free visualizer and silence metering
    this.startAudioMeter();

    // Overall turn timeout if user says nothing at all (4.5s)
    noSpeechTimeout = setTimeout(() => {
      if (!speechDetected && this.isListening) {
        console.log(`[VoiceService] Silence detected (no speech input in Turn #${callbacks.turnId})`);
        this.stopListening();
        callbacks.onSilence();
      }
    }, 4500);

    const finishTurn = (transcript: string) => {
      clearTimeout(silenceTimer);
      clearTimeout(noSpeechTimeout);
      this.stopAudioMeter();
      if (!this.isListening) return;
      this.isListening = false;
      this.playTone('listen_stop');

      const transcriptReceivedMs = Date.now();
      const finalSpeechEnd = speechEndTimestamp || (transcriptReceivedMs - 400);

      callbacks.onResult(transcript, {
        speechEndMs: finalSpeechEnd,
        transcriptReceivedMs,
      });
    };

    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      // recognition active
    };

    this.recognition.onspeechstart = () => {
      speechDetected = true;
      clearTimeout(noSpeechTimeout);
    };

    this.recognition.onspeechend = () => {
      speechEndTimestamp = Date.now();
      // Auto-end turn ~1s after speech ends
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        if (accumulatedTranscript.trim()) {
          this.recognition?.stop();
          finishTurn(accumulatedTranscript);
        }
      }, 1000);
    };

    this.recognition.onresult = (event: any) => {
      speechDetected = true;
      clearTimeout(noSpeechTimeout);

      let currentInterim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          accumulatedTranscript += ' ' + item[0].transcript;
        } else {
          currentInterim += item[0].transcript;
        }
      }

      const activeText = (accumulatedTranscript + ' ' + currentInterim).trim();

      // Reset ~1000ms silence detection after each spoken phrase
      speechEndTimestamp = Date.now();
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        if (activeText) {
          this.recognition?.stop();
          finishTurn(activeText);
        }
      }, 1100);
    };

    this.recognition.onerror = (event: any) => {
      clearTimeout(silenceTimer);
      clearTimeout(noSpeechTimeout);
      this.stopAudioMeter();
      this.isListening = false;
      this.playTone('listen_stop');

      if (event.error === 'no-speech') {
        callbacks.onSilence();
      } else {
        callbacks.onError(event.error || 'Speech recognition error');
      }
    };

    this.recognition.onend = () => {
      clearTimeout(silenceTimer);
      clearTimeout(noSpeechTimeout);
      this.stopAudioMeter();
      if (this.isListening) {
        this.isListening = false;
        this.playTone('listen_stop');
        if (accumulatedTranscript.trim()) {
          finishTurn(accumulatedTranscript);
        } else {
          callbacks.onEnd();
        }
      }
    };

    try {
      this.recognition.start();
    } catch {
      this.isListening = false;
      this.stopAudioMeter();
      callbacks.onError('Microphone access was blocked or busy.');
    }
  }

  private startAudioMeter() {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            this.audioMeterStream = stream;
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            this.audioMeterInterval = setInterval(() => {
              if (!this.isListening) {
                this.stopAudioMeter();
                return;
              }
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              const normalized = Math.min(1, avg / 128);
              this.audioLevelListeners.forEach((fn) => fn(normalized));
            }, 60);
          })
          .catch(() => {
            // Audio metering optional fallback
          });
      }
    } catch {
      // Audio meter not supported or blocked
    }
  }

  private stopAudioMeter() {
    if (this.audioMeterInterval) {
      clearInterval(this.audioMeterInterval);
      this.audioMeterInterval = null;
    }
    if (this.audioMeterStream) {
      this.audioMeterStream.getTracks().forEach((t) => t.stop());
      this.audioMeterStream = null;
    }
    this.audioLevelListeners.forEach((fn) => fn(0));
  }

  public stopListening() {
    this.stopAudioMeter();
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.isListening = false;
    }
  }
}

export const voiceService = new VoiceService();
