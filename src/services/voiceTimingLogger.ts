// Precise turn-by-turn timing logger for MoMo Accessible Voice Assistant

export interface TurnTimingRecord {
  turnId: number;
  utterance: string;
  source: 'local_rules' | 'llm_fallback';
  speechEndMs: number;
  transcriptReceivedMs: number;
  intentResultMs: number;
  replyReadyMs: number;
  ttsStartedMs: number;
  sttDelayMs: number;
  intentParseMs: number;
  replyReadyDelayMs: number;
  ttsBufferMs: number;
  totalTurnDelayMs: number;
  timestamp: string;
}

class VoiceTimingLogger {
  private records: TurnTimingRecord[] = [];
  private listeners: Array<(record: TurnTimingRecord) => void> = [];

  public logTurn(timing: {
    turnId: number;
    utterance: string;
    source: 'local_rules' | 'llm_fallback';
    tSpeechEnd: number;
    tTranscript: number;
    tIntent: number;
    tReplyReady: number;
    tTtsStart: number;
  }): TurnTimingRecord {
    const speechToTranscript = Math.max(0, timing.tTranscript - timing.tSpeechEnd);
    const transcriptToIntent = Math.max(0, timing.tIntent - timing.tTranscript);
    const intentToReply = Math.max(0, timing.tReplyReady - timing.tIntent);
    const replyToTts = Math.max(0, timing.tTtsStart - timing.tReplyReady);
    const totalDelay = Math.max(0, timing.tTtsStart - timing.tSpeechEnd);

    const record: TurnTimingRecord = {
      turnId: timing.turnId,
      utterance: timing.utterance,
      source: timing.source,
      speechEndMs: timing.tSpeechEnd,
      transcriptReceivedMs: timing.tTranscript,
      intentResultMs: timing.tIntent,
      replyReadyMs: timing.tReplyReady,
      ttsStartedMs: timing.tTtsStart,
      sttDelayMs: speechToTranscript,
      intentParseMs: transcriptToIntent,
      replyReadyDelayMs: intentToReply,
      ttsBufferMs: replyToTts,
      totalTurnDelayMs: totalDelay,
      timestamp: new Date().toLocaleTimeString(),
    };

    this.records.unshift(record);
    if (this.records.length > 50) this.records.pop();

    // Pretty console output with clear breakdown
    console.log(
      `%c[MoMo Voice Turn #${record.turnId} Timing Breakdown]`,
      'color: #f59e0b; font-weight: bold; font-size: 12px;'
    );
    console.log(
      `  • 1. End of user speech:    0 ms (reference t₀)` +
      `\n  • 2. Transcript received:   +${speechToTranscript} ms (speech-to-text / silence capture)` +
      `\n  • 3. Intent result:         +${transcriptToIntent} ms [${record.source === 'local_rules' ? '⚡ Instant Local Rules (<3ms)' : 'LLM Fallback'}]` +
      `\n  • 4. Reply text ready:      +${intentToReply} ms` +
      `\n  • 5. TTS started:           +${replyToTts} ms (audio output buffer)` +
      `\n  ──────────────────────────────────────────────────` +
      `\n  TOTAL TURN LATENCY:         ${totalDelay} ms (speech-end -> audio-start)`
    );

    this.listeners.forEach((fn) => fn(record));
    return record;
  }

  public getRecords(): TurnTimingRecord[] {
    return this.records;
  }

  public getLatest(): TurnTimingRecord | null {
    return this.records[0] || null;
  }

  public onNewTiming(listener: (record: TurnTimingRecord) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const voiceTimingLogger = new VoiceTimingLogger();
