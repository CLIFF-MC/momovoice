import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  RotateCcw,
  Volume2,
  VolumeX,
  Fingerprint,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Send,
  X,
  Phone,
  ArrowUpRight,
  Receipt,
  QrCode,
  Smartphone,
  Accessibility,
  History,
  User,
  Wifi,
  Battery,
  Settings,
  Check,
  CreditCard,
  Building,
  Sparkles,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { AssistantState, Contact, GhanaianLanguage, MoMoAccount, TransactionRecord, TransferDraft } from '../types/momo';
import { parseUserSpeech } from '../services/intentParser';
import { momoService } from '../services/momoService';
import { voiceService } from '../services/voiceService';
import { FREQUENT_CONTACTS } from '../data/mockData';
import { GHANAIAN_LOCALIZATIONS, SUPPORTED_LANGUAGES } from '../data/ghanaianLanguages';

interface PhoneSimulatorProps {
  account: MoMoAccount;
  onAccountUpdate: (acc: MoMoAccount) => void;
  onNewTransaction: (tx: TransactionRecord) => void;
  screenCurtainActive: boolean;
  highContrastActive: boolean;
  fontScale: number;
  onOpenAccessDrawer?: () => void;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  account,
  onAccountUpdate,
  onNewTransaction,
  screenCurtainActive,
  highContrastActive,
  fontScale,
  onOpenAccessDrawer,
}) => {
  // One-time language setting persisted in localStorage
  const [language, setLanguage] = useState<GhanaianLanguage>(() => {
    const saved = localStorage.getItem('momo_preferred_language');
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved as GhanaianLanguage;
    }
    return 'twi';
  });

  const [state, setState] = useState<AssistantState>('IDLE');
  const [spokenGuidance, setSpokenGuidance] = useState<string>('');
  const [draft, setDraft] = useState<TransferDraft | null>(null);
  const [lastResult, setLastResult] = useState<TransactionRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'HOME' | 'SERVICES' | 'ACTIVITY'>('HOME');
  const [statusProgress, setStatusProgress] = useState<string>('');

  const currentPhrases = GHANAIAN_LOCALIZATIONS[language];

  // Initialize voice on load
  useEffect(() => {
    voiceService.setLanguage(language);
    const welcome = GHANAIAN_LOCALIZATIONS[language].welcome;
    setSpokenGuidance(welcome);
    voiceService.speak(welcome, { priority: 'polite' });
  }, []);

  const handleLanguageChange = (newLang: GhanaianLanguage) => {
    setLanguage(newLang);
    localStorage.setItem('momo_preferred_language', newLang);
    voiceService.setLanguage(newLang);
    const welcome = GHANAIAN_LOCALIZATIONS[newLang].welcome;
    setSpokenGuidance(welcome);
    voiceService.playTone('confirm');
    voiceService.speak(welcome, { priority: 'assertive' });
  };

  const speakAndAnnounce = (text: string, priority: 'polite' | 'assertive' = 'polite', onEnd?: () => void) => {
    setSpokenGuidance(text);
    voiceService.speak(text, { priority, onEnd });
  };

  const formatPhoneNumberSpoken = (phone: string) => {
    return phone.split('').join(' ');
  };

  const handleStartListening = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      setState('IDLE');
      return;
    }

    setErrorMessage(null);
    setIsListening(true);
    setState('LISTENING');

    const listeningText =
      language === 'twi'
        ? 'Mewɔ aso retie wo...'
        : language === 'fante'
        ? 'Morotsie wo...'
        : language === 'ewe'
        ? 'Mele to ɖom na wò...'
        : language === 'ga'
        ? 'Miibo to...'
        : language === 'dagbani'
        ? 'N wumda...'
        : 'Listening...';

    voiceService.speak(listeningText, { priority: 'assertive' });

    voiceService.startListening(
      (transcript) => {
        setIsListening(false);
        processSpokenText(transcript);
      },
      (error) => {
        setIsListening(false);
        if (state === 'LISTENING') {
          setState('IDLE');
          setErrorMessage('Could not hear clearly. Please tap the mic and speak again.');
          voiceService.speak(currentPhrases.help, { priority: 'polite' });
        }
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const processSpokenText = async (text: string) => {
    setState('INTERPRETING');
    const result = parseUserSpeech(text, draft || undefined, language);
    const phrases = GHANAIAN_LOCALIZATIONS[language];

    if (result.intent === 'REPEAT') {
      voiceService.playTone('confirm');
      speakAndAnnounce(spokenGuidance, 'assertive');
      setState(draft ? 'REVIEWING' : 'IDLE');
      return;
    }

    if (result.intent === 'CANCEL') {
      voiceService.playTone('error');
      setDraft(null);
      setState('IDLE');
      speakAndAnnounce(phrases.cancel, 'assertive');
      return;
    }

    if (result.intent === 'HELP') {
      voiceService.playTone('confirm');
      setState('IDLE');
      speakAndAnnounce(phrases.help, 'polite');
      return;
    }

    if (result.intent === 'BALANCE_CHECK') {
      voiceService.playTone('confirm');
      setState('CHECKING_STATUS');
      try {
        const res = await momoService.getBalance();
        setState('IDLE');
        voiceService.playTone('success');
        const balanceAnnouncement = phrases.balance(res.balance);
        speakAndAnnounce(balanceAnnouncement, 'assertive');
      } catch (err: any) {
        setState('ERROR_RECOVERY');
        voiceService.playTone('error');
        speakAndAnnounce(phrases.error('Network Error'), 'assertive');
      }
      return;
    }

    // AIRTIME PURCHASE FLOW
    if (result.intent === 'BUY_AIRTIME') {
      voiceService.playTone('confirm');
      const current = result.extractedDraft;
      if (!current) return;

      setDraft(current);
      setState('REVIEWING');
      const targetPhone = current.recipientNumber || '0244890123';
      const prompt = phrases.airtimeReview(targetPhone, current.amount || 10);
      speakAndAnnounce(prompt, 'assertive');
      return;
    }

    // BILL / MERCHANT PAYMENT FLOW
    if (result.intent === 'PAY_BILL') {
      voiceService.playTone('confirm');
      const current = result.extractedDraft;
      if (!current) return;

      setDraft(current);
      setState('REVIEWING');
      const biller = current.billerName || 'ECG (Electricity)';
      const prompt = phrases.billReview(biller, current.amount || 50);
      speakAndAnnounce(prompt, 'assertive');
      return;
    }

    // CASH OUT / WITHDRAWAL FLOW
    if (result.intent === 'CASH_OUT') {
      voiceService.playTone('confirm');
      const current = result.extractedDraft;
      if (!current) return;

      setDraft(current);
      setState('REVIEWING');
      const prompt = phrases.cashOutReview(current.agentCode || '284910', current.amount || 50, current.fee, current.total);
      speakAndAnnounce(prompt, 'assertive');
      return;
    }

    // CHANGE AMOUNT FLOW
    if (result.intent === 'CHANGE_AMOUNT' && result.extractedDraft) {
      voiceService.playTone('confirm');
      setDraft(result.extractedDraft);
      setState('REVIEWING');

      if (result.extractedDraft.serviceType === 'AIRTIME') {
        const prompt = phrases.airtimeReview(result.extractedDraft.recipientNumber || '0244890123', result.extractedDraft.amount || 10);
        speakAndAnnounce(prompt, 'assertive');
      } else if (result.extractedDraft.serviceType === 'BILL_PAY') {
        const prompt = phrases.billReview(result.extractedDraft.billerName || 'Biller', result.extractedDraft.amount || 50);
        speakAndAnnounce(prompt, 'assertive');
      } else if (result.extractedDraft.serviceType === 'CASH_OUT') {
        const prompt = phrases.cashOutReview(result.extractedDraft.agentCode || '284910', result.extractedDraft.amount || 50, result.extractedDraft.fee, result.extractedDraft.total);
        speakAndAnnounce(prompt, 'assertive');
      } else {
        const momoName = result.extractedDraft.momoAccountName || result.extractedDraft.recipientName || 'Subscriber';
        const updatedPrompt = phrases.review(
          momoName,
          formatPhoneNumberSpoken(result.extractedDraft.recipientNumber || ''),
          result.extractedDraft.amount || 0,
          result.extractedDraft.fee,
          result.extractedDraft.total
        );
        speakAndAnnounce(updatedPrompt, 'assertive');
      }
      return;
    }

    // TRANSFER FLOW
    if (result.intent === 'PREPARE_TRANSFER') {
      voiceService.playTone('confirm');
      const current = result.extractedDraft;
      if (!current) return;

      setDraft(current);

      if (current.missingField === 'recipient') {
        setState('COLLECTING_DETAILS');
        const prompt = phrases.askRecipient(current.amount);
        speakAndAnnounce(prompt, 'assertive');
        return;
      }

      if (current.missingField === 'recipientNumber') {
        setState('COLLECTING_DETAILS');
        const prompt = phrases.askPhoneNumber(current.recipientName);
        speakAndAnnounce(prompt, 'assertive');
        return;
      }

      if (current.missingField === 'amount') {
        setState('COLLECTING_DETAILS');
        const prompt = phrases.askAmount(current.momoAccountName || current.recipientName);
        speakAndAnnounce(prompt, 'assertive');
        return;
      }

      // Both recipient/phone and amount exist! Enter REVIEWING state with mandatory spoken read-back!
      setState('REVIEWING');
      const momoName = current.momoAccountName || current.recipientName || 'Subscriber';
      const reviewText = phrases.review(
        momoName,
        formatPhoneNumberSpoken(current.recipientNumber || ''),
        current.amount || 0,
        current.fee,
        current.total
      );
      speakAndAnnounce(reviewText, 'assertive');
      return;
    }

    // CONFIRM INTENT (Triggers on-device Biometrics for Airtime, Bill Pay, Cash Out, or Transfer)
    if (result.intent === 'CONFIRM_TRANSFER') {
      if (!draft || !draft.amount) {
        voiceService.playTone('error');
        setState('IDLE');
        speakAndAnnounce(phrases.help, 'polite');
        return;
      }

      // Step into AUTHENTICATING state (Android BiometricPrompt)
      setState('AUTHENTICATING');
      setShowBiometricModal(true);
      const recipientLabel = draft.serviceType === 'AIRTIME'
        ? `Airtime for ${draft.recipientNumber}`
        : draft.serviceType === 'BILL_PAY'
        ? draft.billerName || 'Utility'
        : draft.serviceType === 'CASH_OUT'
        ? `Agent ${draft.agentCode}`
        : draft.momoAccountName || draft.recipientName || 'Subscriber';

      const authSpeech = phrases.biometricPrompt(recipientLabel, draft.total);
      speakAndAnnounce(authSpeech, 'assertive');
      return;
    }

    // Unknown intent
    voiceService.playTone('error');
    setState('IDLE');
    speakAndAnnounce(phrases.help, 'polite');
  };

  const handleAuthorizeBiometric = async () => {
    setShowBiometricModal(false);
    if (!draft || !draft.amount) return;

    setState('SUBMITTING');
    setStatusProgress('Connecting securely to MTN MoMo Gateway...');
    voiceService.playTone('confirm');

    const idempKey = `idemp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const phrases = GHANAIAN_LOCALIZATIONS[language];

    try {
      let record: TransactionRecord;

      if (draft.serviceType === 'AIRTIME') {
        record = await momoService.executeAirtime(
          {
            recipientNumber: draft.recipientNumber || '0244890123',
            recipientName: draft.recipientName,
            amount: draft.amount,
            idempotencyKey: idempKey,
          },
          (status, details) => setStatusProgress(details)
        );

        setLastResult(record);
        onAccountUpdate(momoService.getAccount());
        onNewTransaction(record);
        setDraft(null);
        setState('RESULT_ANNOUNCED');
        voiceService.playTone('success');

        const successAnnouncement = phrases.airtimeSuccess(
          record.recipientNumber || 'Phone',
          record.amount,
          record.referenceId,
          momoService.getAccount().availableBalance
        );
        speakAndAnnounce(successAnnouncement, 'assertive');
      } else if (draft.serviceType === 'BILL_PAY') {
        record = await momoService.executeBillPay(
          {
            billerName: draft.billerName || 'Utility',
            amount: draft.amount,
            idempotencyKey: idempKey,
          },
          (status, details) => setStatusProgress(details)
        );

        setLastResult(record);
        onAccountUpdate(momoService.getAccount());
        onNewTransaction(record);
        setDraft(null);
        setState('RESULT_ANNOUNCED');
        voiceService.playTone('success');

        const successAnnouncement = phrases.billSuccess(
          record.billerName || 'Biller',
          record.amount,
          record.referenceId,
          momoService.getAccount().availableBalance
        );
        speakAndAnnounce(successAnnouncement, 'assertive');
      } else if (draft.serviceType === 'CASH_OUT') {
        record = await momoService.executeCashOut(
          {
            agentCode: draft.agentCode || '284910',
            agentName: draft.recipientName,
            amount: draft.amount,
            fee: draft.fee,
            idempotencyKey: idempKey,
          },
          (status, details) => setStatusProgress(details)
        );

        setLastResult(record);
        onAccountUpdate(momoService.getAccount());
        onNewTransaction(record);
        setDraft(null);
        setState('RESULT_ANNOUNCED');
        voiceService.playTone('success');

        const successAnnouncement = phrases.cashOutSuccess(
          draft.agentCode || 'Agent',
          record.amount,
          record.referenceId,
          momoService.getAccount().availableBalance
        );
        speakAndAnnounce(successAnnouncement, 'assertive');
      } else {
        // Standard Transfer
        record = await momoService.executeTransfer(
          {
            recipientName: draft.momoAccountName || draft.recipientName || 'Recipient',
            recipientNumber: draft.recipientNumber || '',
            amount: draft.amount,
            fee: draft.fee,
            currency: draft.currency,
            idempotencyKey: idempKey,
          },
          (status, details) => setStatusProgress(details)
        );

        setLastResult(record);
        onAccountUpdate(momoService.getAccount());
        onNewTransaction(record);
        setDraft(null);
        setState('RESULT_ANNOUNCED');
        voiceService.playTone('success');

        const successAnnouncement = phrases.success(
          record.recipientName || 'Recipient',
          record.amount,
          record.referenceId,
          momoService.getAccount().availableBalance
        );
        speakAndAnnounce(successAnnouncement, 'assertive');
      }
    } catch (err: any) {
      setState('ERROR_RECOVERY');
      voiceService.playTone('error');
      setErrorMessage(err.message || 'Transaction failed.');
      speakAndAnnounce(phrases.error(err.message || ''), 'assertive');
    }
  };

  const handleCancelBiometric = () => {
    setShowBiometricModal(false);
    setState('REVIEWING');
    voiceService.playTone('error');
    speakAndAnnounce(currentPhrases.cancel, 'polite');
  };

  const handleQuickTransferContact = (contact: Contact) => {
    processSpokenText(`Send 20 cedis to ${contact.name}`);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    voiceService.setMuted(nextMuted);
  };

  const replayLastGuidance = () => {
    voiceService.playTone('confirm');
    voiceService.speak(spokenGuidance, { priority: 'assertive' });
  };

  const transactions = momoService.getTransactions();

  return (
    <div
      className={`relative w-full max-w-[420px] mx-auto rounded-[40px] shadow-2xl overflow-hidden border transition-all flex flex-col justify-between select-none ${
        highContrastActive
          ? 'bg-black text-amber-300 border-amber-400'
          : 'bg-slate-900 text-slate-100 border-slate-800'
      }`}
      style={{
        fontSize: `${fontScale}rem`,
        minHeight: '740px',
        maxHeight: '880px',
      }}
      aria-label="MTN MoMo Accessible Mobile Application"
    >
      {/* Screen Curtain Mode (Blind User Simulation) */}
      {screenCurtainActive && (
        <div
          className="absolute inset-0 z-50 bg-black/95 p-6 flex flex-col items-center justify-between text-center select-none"
          role="region"
          aria-label="Screen Curtain Active. Pure audio interface."
        >
          <div className="flex items-center gap-2 text-amber-400 text-xs mt-4">
            <EyeOff className="w-4 h-4" />
            <span className="font-semibold uppercase tracking-wider">Screen Curtain Mode Active</span>
          </div>

          <div className="space-y-4 my-auto px-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              Display is darkened to simulate non-visual TalkBack navigation. All guidance is spoken.
            </p>
            <p className="text-amber-300 text-xs font-mono bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              "{spokenGuidance}"
            </p>
          </div>

          <div className="w-full space-y-3 pb-6">
            <button
              onClick={handleStartListening}
              className="w-full h-16 rounded-2xl bg-amber-400 text-slate-950 font-bold text-lg flex items-center justify-center gap-3 shadow-lg active:scale-98 transition-transform"
              aria-label="Screen Curtain Push to Speak"
            >
              <Mic className="w-6 h-6" />
              <span>{isListening ? 'Listening (Tap to Stop)' : 'Tap & Speak Command'}</span>
            </button>
            <button
              onClick={replayLastGuidance}
              className="w-full h-12 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-sm font-medium flex items-center justify-center gap-2"
              aria-label="Repeat last voice message"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Repeat Voice Message</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. Authentic Mobile Status Bar */}
      <div className="px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold bg-[#FFCC00] text-slate-950 border-b border-amber-300/40">
        <span className="font-mono font-bold">9:41</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-tight font-bold">MTN-GH 4G</span>
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-4 h-4" />
        </div>
      </div>

      {/* 2. Official MTN MoMo Yellow App Header (No inline language pills clutter!) */}
      <div className="bg-[#FFCC00] text-slate-950 px-4 pt-2.5 pb-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Brand & User Greeting */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-950 text-[#FFCC00] flex items-center justify-center font-extrabold text-sm shadow">
              MoMo
            </div>
            <div>
              <div className="font-extrabold text-sm leading-tight text-slate-950">
                Hi, {account.accountHolderName.split(' ')[0]}
              </div>
              <div className="text-[11px] font-mono font-semibold text-slate-800">
                024 489 0123
              </div>
            </div>
          </div>

          {/* Clean Header Action Buttons: Settings Gear + Voice Replay + Mute */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={replayLastGuidance}
              title="Replay Voice Guidance"
              className="p-2 rounded-xl bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 transition-colors"
              aria-label="Replay last spoken guidance"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute Voice' : 'Mute Voice'}
              className="p-2 rounded-xl bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 transition-colors"
              aria-label={isMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-700" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {/* One-Time Settings Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              title="Settings & Language Preferences"
              className="p-2 rounded-xl bg-slate-950 text-[#FFCC00] hover:bg-slate-900 transition-colors shadow-sm ml-0.5"
              aria-label="Open MoMo Settings and Language Preferences"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main App Body (Scrollable Screen) */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
        {/* TAB 1: HOME */}
        {activeTab === 'HOME' && (
          <>
            {/* MoMo Balance Card */}
            <div
              className={`p-4 rounded-3xl border shadow-lg transition-all ${
                highContrastActive
                  ? 'bg-black border-amber-400 text-amber-300'
                  : 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-slate-100'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="uppercase font-semibold tracking-wider text-[10px]">MTN MoMo Available Balance</span>
                <button
                  onClick={() => setHideBalance((prev) => !prev)}
                  className="p-1 rounded text-slate-400 hover:text-amber-400 transition-colors"
                  aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
                >
                  {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold font-mono text-amber-400 tracking-tight">
                  {hideBalance ? 'GHS ••••••' : `GHS ${account.availableBalance.toFixed(2)}`}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active · Tier 2
                </span>
              </div>
            </div>

            {/* Accessible Spoken Voice Banner (Ambient Voice Layer) */}
            <div
              onClick={replayLastGuidance}
              className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-start gap-2.5 cursor-pointer hover:bg-amber-400/15 transition-colors"
              role="region"
              aria-live="polite"
              aria-label="Current Voice Guidance"
            >
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                    Voice ({SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName})
                  </span>
                  <span className="text-[9px] text-slate-400">Tap to replay</span>
                </div>
                <p className="text-slate-200 mt-0.5 leading-relaxed font-medium">
                  {spokenGuidance}
                </p>
              </div>
            </div>

            {/* Core 4 MoMo Services Grid */}
            <div className="grid grid-cols-4 gap-2 pt-0.5">
              {/* 1. Transfer */}
              <button
                onClick={() => processSpokenText('Send 20 cedis to Ama')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-750 transition-all text-center group"
                aria-label="Transfer Money"
              >
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Send className="w-5 h-5 -rotate-12" />
                </div>
                <span className="text-[10px] font-bold text-slate-200">Transfer</span>
              </button>

              {/* 2. Buy Airtime */}
              <button
                onClick={() => processSpokenText('Buy 10 cedis airtime')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-750 transition-all text-center group"
                aria-label="Buy Airtime"
              >
                <div className="w-11 h-11 rounded-2xl bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-200">Airtime</span>
              </button>

              {/* 3. Pay Bill */}
              <button
                onClick={() => processSpokenText('Pay ECG 50 cedis')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-750 transition-all text-center group"
                aria-label="Pay Bill"
              >
                <div className="w-11 h-11 rounded-2xl bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-200">Pay Bill</span>
              </button>

              {/* 4. Cash Out */}
              <button
                onClick={() => processSpokenText('Cash out 50 cedis')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-750 transition-all text-center group"
                aria-label="Cash Out from Agent"
              >
                <div className="w-11 h-11 rounded-2xl bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-200">Cash Out</span>
              </button>
            </div>

            {/* Quick Beneficiaries (Recent MoMo Contacts) */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">Quick Beneficiaries</span>
                <span className="text-[10px] text-slate-500">Tap to send GHS 20</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {FREQUENT_CONTACTS.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleQuickTransferContact(c)}
                    className="p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 flex items-center gap-2.5 text-left transition-colors"
                    aria-label={`Send MoMo to ${c.name}, ${c.number}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {c.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-200 truncate">{c.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">{c.number}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent MoMo Activity Snippet */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">Recent Activity</span>
                <button
                  onClick={() => setActiveTab('ACTIVITY')}
                  className="text-[10px] text-amber-400 font-semibold hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-1.5">
                {transactions.slice(0, 3).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-2xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center shrink-0">
                        {tx.type === 'AIRTIME' ? (
                          <Smartphone className="w-3.5 h-3.5" />
                        ) : tx.type === 'BILL_PAY' ? (
                          <QrCode className="w-3.5 h-3.5" />
                        ) : tx.type === 'CASH_OUT' ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 truncate max-w-[170px]">
                          {tx.recipientName || tx.billerName || 'MoMo Transfer'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {tx.timestamp} · {tx.type}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-100">
                        -GHS {tx.amount.toFixed(2)}
                      </div>
                      <div className="text-[9px] text-emerald-400 font-semibold">
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: SERVICES LAUNCHPAD */}
        {activeTab === 'SERVICES' && (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">MoMo Voice Services</div>
            <div className="space-y-2">
              <button
                onClick={() => processSpokenText('Buy 10 cedis airtime')}
                className="w-full p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100">Buy Airtime & Data</div>
                    <div className="text-[11px] text-slate-400">Say: "Buy 10 cedis airtime" or "Tɔ airtime"</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => processSpokenText('Pay ECG 50 cedis')}
                className="w-full p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100">Pay ECG & Utility Bills</div>
                    <div className="text-[11px] text-slate-400">Say: "Pay ECG 50 cedis" or "Tua bill"</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => processSpokenText('Cash out 50 cedis')}
                className="w-full p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center font-bold">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100">Cash Out at Agent</div>
                    <div className="text-[11px] text-slate-400">Say: "Cash out 50 cedis" or "Gye sika"</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => processSpokenText('Send 20 cedis to Ama')}
                className="w-full p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center font-bold">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100">Transfer Money</div>
                    <div className="text-[11px] text-slate-400">Say: "Send 20 cedis to 0244123456"</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVITY HISTORY */}
        {activeTab === 'ACTIVITY' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-400">Transaction History</span>
              <span className="text-[10px] font-mono text-slate-500">{transactions.length} Records</span>
            </div>

            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">
                      {tx.recipientName || tx.billerName || 'MoMo Transaction'}
                    </span>
                    <span className="font-mono font-bold text-sm text-amber-400">
                      -GHS {tx.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{tx.timestamp} · {tx.type}</span>
                    <span className="text-emerald-400 font-semibold">{tx.status}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono truncate pt-1 border-t border-slate-800/60">
                    Ref: {tx.referenceId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Verification Sheet for In-Progress Financial Actions */}
        {state === 'REVIEWING' && draft && (
          <div
            className="p-4 rounded-3xl bg-amber-400/10 border-2 border-amber-400 text-xs space-y-3 animate-fadeIn"
            role="alertdialog"
            aria-label="Verify MoMo Transaction Details"
          >
            <div className="flex items-center justify-between text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>
                  {draft.serviceType === 'AIRTIME'
                    ? 'Verify Airtime Purchase'
                    : draft.serviceType === 'BILL_PAY'
                    ? 'Verify Bill Payment'
                    : draft.serviceType === 'CASH_OUT'
                    ? 'Verify Cash Out'
                    : 'Verify MoMo Transfer'}
                </span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-semibold">
                MTN MoMo Sandbox
              </span>
            </div>

            <div className="space-y-2 text-slate-200">
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-700/80 space-y-1.5">
                {draft.serviceType === 'AIRTIME' ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Recipient Number:</span>
                      <span className="font-mono text-sm font-bold text-amber-300 tracking-wider">
                        {draft.recipientNumber}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-800">
                      <span className="text-slate-400 text-[11px]">Service:</span>
                      <span className="font-bold text-emerald-400 text-xs">MTN Prepaid Airtime Top-Up</span>
                    </div>
                  </>
                ) : draft.serviceType === 'BILL_PAY' ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Biller / Merchant:</span>
                      <span className="font-bold text-amber-300 text-sm">
                        {draft.billerName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-800">
                      <span className="text-slate-400 text-[11px]">Service:</span>
                      <span className="font-bold text-emerald-400 text-xs">Utility / Merchant Payment</span>
                    </div>
                  </>
                ) : draft.serviceType === 'CASH_OUT' ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">MoMo Agent Code:</span>
                      <span className="font-mono text-sm font-bold text-amber-300 tracking-wider">
                        {draft.agentCode}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-800">
                      <span className="text-slate-400 text-[11px]">Agent Point:</span>
                      <span className="font-bold text-emerald-400 text-xs">Kwame Agent Point (Tier 1)</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Phone Number:</span>
                      <span className="font-mono text-sm font-bold text-amber-300 tracking-wider">
                        {draft.recipientNumber ? draft.recipientNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3') : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-800">
                      <span className="text-slate-400 text-[11px]">Registered MoMo Name:</span>
                      <div className="flex items-center gap-1 text-right">
                        <span className="font-bold text-emerald-400 text-sm">
                          {draft.momoAccountName || draft.recipientName || 'Verified MoMo Subscriber'}
                        </span>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-amber-400 font-mono text-sm">GHS {draft.amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Network Fee:</span>
                <span className="font-mono text-slate-300">GHS {draft.fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 font-bold text-slate-100 text-sm">
                <span>Total Debit:</span>
                <span className="font-mono text-amber-400 text-base">GHS {draft.total.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
              🔒 Details read aloud in {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.name}. Say "Confirm" or tap below to authorize with device biometrics.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => processSpokenText('cancel')}
                className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                aria-label="Cancel this request"
              >
                <X className="w-4 h-4" />
                <span>{language === 'twi' ? 'Gyae' : language === 'fante' ? 'Gyaa' : language === 'ewe' ? 'Tɔe' : language === 'ga' ? 'Kpa' : language === 'dagbani' ? 'Chɛli' : 'Cancel'}</span>
              </button>
              <button
                onClick={() => processSpokenText('confirm')}
                className="h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                aria-label="Confirm with Biometrics"
              >
                <Fingerprint className="w-4 h-4" />
                <span>{language === 'twi' ? 'Aane (Nsateaa)' : language === 'fante' ? 'Nyew' : language === 'ewe' ? 'Eẽ (Asibidɛ)' : language === 'ga' ? 'Hɛɛ' : language === 'dagbani' ? 'Iyi' : 'Confirm'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Verified Success Receipt */}
        {state === 'RESULT_ANNOUNCED' && lastResult && (
          <div
            className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/40 text-xs space-y-2.5 animate-fadeIn"
            role="region"
            aria-label="Verified Transaction Receipt"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle className="w-5 h-5" />
              <span>{lastResult.type} Successful</span>
            </div>
            <p className="text-slate-200">
              GHS {lastResult.amount.toFixed(2)} {lastResult.type.toLowerCase()} processed for{' '}
              {lastResult.recipientName || lastResult.billerName || 'Subscriber'}.
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800 font-mono">
              <span>Ref: {lastResult.referenceId.slice(0, 14)}...</span>
              <button
                onClick={() => setState('IDLE')}
                className="text-amber-400 font-bold hover:underline font-sans"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {state === 'ERROR_RECOVERY' && errorMessage && (
          <div
            className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/40 text-xs space-y-2 animate-fadeIn"
            role="alert"
          >
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Request Could Not Be Completed</span>
            </div>
            <p className="text-slate-200">{errorMessage}</p>
            <button
              onClick={() => setState('IDLE')}
              className="text-xs text-amber-400 font-semibold hover:underline"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>

      {/* 4. Natural Voice Action Button (Thumb Zone) with Quick Prompts */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
        {/* Quick Voice Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          {currentPhrases.quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => processSpokenText(p.text)}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700/60 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Main Microphone Button */}
        <button
          onClick={handleStartListening}
          className={`w-full h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xl ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse'
              : highContrastActive
              ? 'bg-amber-400 text-black hover:bg-amber-300'
              : 'bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-[0.98]'
          }`}
          aria-label={isListening ? 'Listening. Tap to stop speaking.' : 'Start Voice Request. Tap and speak.'}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5 animate-spin" />
              <span>{language === 'twi' ? 'Mewɔ aso retie wo... (Mia so)' : 'Listening... (Tap to Send)'}</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 text-slate-950" />
              <span>
                {language === 'twi'
                  ? 'Kasa Kyerɛ Me (Tap to Speak)'
                  : language === 'fante'
                  ? 'Kasa Kyerɛ Me (Tap to Speak)'
                  : language === 'ewe'
                  ? 'Gblɔ nya (Tap to Speak)'
                  : language === 'ga'
                  ? 'Wiemɔ (Tap to Speak)'
                  : language === 'dagbani'
                  ? 'Yelim (Tap to Speak)'
                  : 'Tap & Speak MoMo Command'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* 5. Authentic Mobile Bottom Navigation Bar with MTN Access Button */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-850 flex items-center justify-around text-[10px] font-semibold text-slate-400">
        <button
          onClick={() => setActiveTab('HOME')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'HOME' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('SERVICES')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'SERVICES' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Services</span>
        </button>

        <button
          onClick={() => setActiveTab('ACTIVITY')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'ACTIVITY' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Activity</span>
        </button>

        {/* Real MTN MoMo Access Button */}
        <button
          onClick={() => onOpenAccessDrawer?.()}
          className="flex flex-col items-center gap-1 text-amber-400 hover:text-amber-300 font-bold transition-transform active:scale-95"
          aria-label="Open MTN MoMo Accessibility and TalkBack Inspector"
          title="MTN MoMo Access & TalkBack"
        >
          <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
            <Accessibility className="w-3.5 h-3.5" />
          </div>
          <span className="text-amber-400">Access</span>
        </button>
      </div>

      {/* 6. Settings & Language Preferences Modal (The Dedicated One-Time Setting) */}
      {showSettingsModal && (
        <div
          className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 sm:p-5 flex flex-col justify-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <div className="bg-slate-900 border border-slate-750 rounded-3xl p-5 space-y-4 shadow-2xl max-h-[85%] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="settings-title" className="text-sm font-bold text-slate-100">
                    MoMo Settings & Language
                  </h3>
                  <span className="text-[10px] text-slate-400">Configured once, remembered permanently</span>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                aria-label="Close Settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Setting List */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Preferred Spoken Language
              </div>
              <div className="space-y-1.5">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                        isSelected
                          ? 'bg-amber-400/15 border-amber-400 text-amber-300'
                          : 'bg-slate-800/60 border-slate-750 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs flex items-center gap-2">
                          <span>{lang.nativeName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({lang.name})</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{lang.region}</div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile & Security Card */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400">MoMo Verified Account</div>
              <div className="flex justify-between items-center text-slate-200">
                <span className="text-slate-400">Subscriber:</span>
                <span className="font-bold">{account.accountHolderName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-200">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono">024 489 0123</span>
              </div>
              <div className="flex justify-between items-center text-slate-200">
                <span className="text-slate-400">KYC Status:</span>
                <span className="text-emerald-400 font-semibold">Tier 2 Verified (Ghana Card)</span>
              </div>
              <div className="flex justify-between items-center text-slate-200 pt-1 border-t border-slate-800">
                <span className="text-slate-400">Biometric Protection:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Zero-PIN Security</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              Save & Return to Home
            </button>
          </div>
        </div>
      )}

      {/* 7. Android BiometricPrompt Modal Simulation */}
      {showBiometricModal && (
        <div
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm p-6 flex flex-col justify-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="biometric-title"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-400/10 border-2 border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto">
              <Fingerprint className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h3 id="biometric-title" className="text-base font-bold text-slate-100">
                {language === 'twi'
                  ? 'Fa Wo Nsateaa Si So'
                  : language === 'fante'
                  ? 'Dze Wo Nsateaa Si Do'
                  : language === 'ewe'
                  ? 'Lɔ̃ Ɖe Edzi kple Asibidɛ'
                  : language === 'ga'
                  ? 'Kɛ Oninɛbii Tswa Nɔ'
                  : language === 'dagbani'
                  ? 'Zaŋ A Nuu Kpɛhi'
                  : 'Confirm with Biometrics'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {draft?.serviceType === 'AIRTIME'
                  ? `Touch fingerprint sensor to authorize GHS ${draft.amount?.toFixed(2)} airtime top-up for ${draft.recipientNumber}.`
                  : draft?.serviceType === 'BILL_PAY'
                  ? `Touch fingerprint sensor to authorize payment of GHS ${draft.amount?.toFixed(2)} to ${draft.billerName}.`
                  : draft?.serviceType === 'CASH_OUT'
                  ? `Touch fingerprint sensor to authorize withdrawal of GHS ${draft.amount?.toFixed(2)} from agent ${draft.agentCode}.`
                  : currentPhrases.biometricPrompt(draft?.momoAccountName || draft?.recipientName || 'Subscriber', draft?.total || 0)}
              </p>
              <div className="mt-2 text-[11px] text-emerald-400 flex items-center justify-center gap-1 font-mono">
                <Shield className="w-3.5 h-3.5" />
                <span>Zero-PIN Rule: MoMo PIN is never spoken aloud</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleAuthorizeBiometric}
                className="w-full h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                aria-label="Confirm device biometric authentication"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Touch Fingerprint Sensor</span>
              </button>
              <button
                onClick={handleCancelBiometric}
                className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                aria-label="Cancel biometric verification"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
