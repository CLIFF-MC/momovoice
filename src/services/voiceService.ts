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

  /**
   * Speaks text using Natural Human Gemini TTS first, falling back to tuned client synthesis
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

    if (options?.interrupt !== false) {
      this.stopSpeaking();
    }

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
              this.currentAudio = null;
              options?.onEnd?.();
              resolve();
            };
            audio.onerror = () => {
              this.currentAudio = null;
              // Fall back to client synthesis
              this.speakWithClientSynth(text, options).then(resolve);
            };
            audio.play().catch(() => {
              this.speakWithClientSynth(text, options).then(resolve);
            });
          });
        }
      }
    } catch {
      // Server not reachable or error, fall through to client synthesis
    }

    // Attempt 2: Fallback to tuned client-side speech synthesis
    return this.speakWithClientSynth(text, options);
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

  public startListening(
    onResult: (transcript: string) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.playTone('listen_start');
    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      this.playTone('listen_stop');
      onError(event.error || 'Speech error occurred');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.playTone('listen_stop');
      onEnd();
    };

    try {
      this.recognition.start();
    } catch {
      this.isListening = false;
      onError('Microphone access was blocked or busy.');
    }
  }

  public stopListening() {
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
