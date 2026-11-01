import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Users,
  Camera,
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
import {
  AssistantState,
  BiometricMethod,
  Contact,
  GhanaianLanguage,
  MoMoAccount,
  TransactionRecord,
  TransferDraft,
  VoiceFlowStep,
} from '../types/momo';
import { parseUserSpeechFastAsync } from '../services/intentParser';
import { momoService } from '../services/momoService';
import { voiceService } from '../services/voiceService';
import { contactsService, PermissionResponse } from '../services/contactsService';
import {
  biometricAuthService,
  AuthenticationType,
  SecurityLevel,
} from '../services/biometricAuthService';
import {
  voiceTimingLogger,
  TurnTimingRecord,
} from '../services/voiceTimingLogger';
import {
  calculateMoMoFee,
  FREQUENT_CONTACTS,
  resolveMoMoAccountName,
} from '../data/mockData';
import {
  GHANAIAN_LOCALIZATIONS,
  SUPPORTED_LANGUAGES,
  getBiometricPhrases,
} from '../data/ghanaianLanguages';

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

  // User's chosen biometric method ('fingerprint' | 'face' | null)
  const [biometricMethod, setBiometricMethod] = useState<BiometricMethod>(() => {
    const saved = localStorage.getItem('momo_biometric_method');
    if (saved === 'fingerprint' || saved === 'face') return saved as BiometricMethod;
    return null;
  });

  const [state, setState] = useState<AssistantState>('IDLE');
  const [voiceStep, setVoiceStep] = useState<VoiceFlowStep>('WELCOME_ASK_TASK');
  const [spokenGuidance, setSpokenGuidance] = useState<string>('');
  const [draft, setDraft] = useState<TransferDraft | null>(null);
  const [lastResult, setLastResult] = useState<TransactionRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [latestTiming, setLatestTiming] = useState<TurnTimingRecord | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showBiometricSetupModal, setShowBiometricSetupModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showContactsPermissionDialog, setShowContactsPermissionDialog] = useState(false);
  const [pendingPermissionResolver, setPendingPermissionResolver] = useState<((res: PermissionResponse) => void) | null>(null);
  const [contactsSearchTargetName, setContactsSearchTargetName] = useState<string>('');
  const [matchedCandidates, setMatchedCandidates] = useState<Contact[]>([]);
  const [hideBalance, setHideBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'HOME' | 'SERVICES' | 'ACTIVITY'>('HOME');
  const [statusProgress, setStatusProgress] = useState<string>('');

  // Strict Turn ID and single source of truth locks (Problem 4)
  const turnIdRef = useRef<number>(1);
  const activeTurnIdRef = useRef<number>(1);
  const isSpeakingRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const silenceRepromptCountRef = useRef<number>(0);
  const lastSpokenPromptRef = useRef<{ text: string; timestamp: number }>({ text: '', timestamp: 0 });
  const mountedRef = useRef<boolean>(false);

  const currentPhrases = GHANAIAN_LOCALIZATIONS[language];
  const biometricPhrases = getBiometricPhrases(language);

  // Wire up audio metering and timing logger listeners
  useEffect(() => {
    const unsubAudio = voiceService.onAudioLevel((lvl) => {
      setAudioLevel(lvl);
    });
    const unsubTiming = voiceTimingLogger.onNewTiming((rec) => {
      setLatestTiming(rec);
    });
    return () => {
      unsubAudio();
      unsubTiming();
    };
  }, []);

  // Wire up contacts permission requests
  useEffect(() => {
    return contactsService.onPermissionRequested(({ resolve }) => {
      setPendingPermissionResolver(() => resolve);
      setShowContactsPermissionDialog(true);
    });
  }, []);

  // Wire up settings return listener (Problem 2: re-checks enrolment when returning from phone Settings)
  useEffect(() => {
    const handleWindowFocus = async () => {
      if (voiceStep === 'SETUP_BIOMETRICS_NOT_ENROLLED') {
        const enrolled = await biometricAuthService.isEnrolledAsync();
        if (enrolled) {
          console.log('[BiometricSetup] Device biometrics now enrolled after returning from Settings');
          setShowBiometricSetupModal(false);
          handleStartBiometricSetup();
        }
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [voiceStep]);

  // Centralized State Transition Engine: Single source of truth (Problem 4)
  const transitionToStep = useCallback(
    (
      nextStep: VoiceFlowStep,
      promptText: string,
      options?: {
        priority?: 'assertive' | 'polite';
        autoListen?: boolean;
        forceRepeat?: boolean;
      }
    ) => {
      turnIdRef.current += 1;
      const thisTurn = turnIdRef.current;
      activeTurnIdRef.current = thisTurn;

      // Ensure prior listening and speaking are halted before entering new state
      voiceService.stopListening();
      voiceService.stopSpeaking();
      isListeningRef.current = false;
      setIsListening(false);

      setVoiceStep(nextStep);
      setSpokenGuidance(promptText);

      // Problem 4: Do not repeat identical prompt within 3 seconds unless user requested "repeat"
      const now = Date.now();
      if (
        !options?.forceRepeat &&
        lastSpokenPromptRef.current.text === promptText &&
        now - lastSpokenPromptRef.current.timestamp < 3000
      ) {
        if (options?.autoListen !== false) {
          startHandsFreeListening(thisTurn);
        }
        return;
      }
      lastSpokenPromptRef.current = { text: promptText, timestamp: now };

      // Speak prompt exactly once on entering state
      isSpeakingRef.current = true;
      setIsSpeaking(true);

      voiceService.speak(promptText, {
        priority: options?.priority || 'assertive',
        onEnd: () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);

          // Ignore if turn progressed while audio was playing
          if (activeTurnIdRef.current !== thisTurn) return;

          // Problem 1: After assistant finishes speaking, listen automatically without buttons
          if (options?.autoListen !== false && nextStep !== 'IDLE' && nextStep !== 'SETUP_BIOMETRICS_NO_HARDWARE') {
            startHandsFreeListening(thisTurn);
          }
        },
      });
    },
    []
  );

  // Problem 1: Hands-Free Voice Listener (Siri-style, zero taps)
  const startHandsFreeListening = useCallback(
    (turnId: number) => {
      // Mutual exclusion lock: never listen while assistant is speaking
      if (isSpeakingRef.current || voiceService.getIsSpeaking()) {
        console.log(`[HandsFree] Cannot listen while TTS is speaking. Turn #${turnId} postponed.`);
        return;
      }

      if (isListeningRef.current) {
        voiceService.stopListening();
      }

      isListeningRef.current = true;
      setIsListening(true);
      setState('LISTENING');
      setErrorMessage(null);

      voiceService.startHandsFreeListening({
        turnId,
        onResult: (transcript, timings) => {
          isListeningRef.current = false;
          setIsListening(false);
          silenceRepromptCountRef.current = 0;

          // Reject outdated recognition events
          if (activeTurnIdRef.current !== turnId) {
            console.log(`[HandsFree] Ignored stale transcript for Turn #${turnId}`);
            return;
          }

          handleProcessSpokenText(transcript, timings, turnId);
        },
        onSilence: () => {
          isListeningRef.current = false;
          setIsListening(false);

          if (activeTurnIdRef.current !== turnId) return;

          // Problem 1 & 4: Re-prompt ONCE, then end safely with nothing executed
          if (silenceRepromptCountRef.current === 0 && voiceStep !== 'IDLE') {
            silenceRepromptCountRef.current = 1;
            transitionToStep(voiceStep, currentPhrases.silenceReprompt, {
              priority: 'polite',
              forceRepeat: true,
              autoListen: true,
            });
          } else if (silenceRepromptCountRef.current >= 1 && voiceStep !== 'IDLE') {
            silenceRepromptCountRef.current = 0;
            setDraft(null);
            transitionToStep('IDLE', currentPhrases.silenceTimeout, {
              priority: 'polite',
              autoListen: false,
            });
            setState('IDLE');
          }
        },
        onError: (_err) => {
          isListeningRef.current = false;
          setIsListening(false);
          if (activeTurnIdRef.current !== turnId) return;
          if (state === 'LISTENING') {
            setState('IDLE');
          }
        },
        onEnd: () => {
          isListeningRef.current = false;
          setIsListening(false);
        },
      });
    },
    [currentPhrases, state, transitionToStep, voiceStep]
  );

  // Initialize voice on load with personalized greeting (mounted once in StrictMode)
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    voiceService.setLanguage(language);
    const firstName = account.accountHolderName.split(' ')[0] || account.accountHolderName;
    const initialGreeting = `${GHANAIAN_LOCALIZATIONS[language].welcomeUser(firstName)} ${GHANAIAN_LOCALIZATIONS[language].askWhatToDo}`;

    transitionToStep('WELCOME_ASK_TASK', initialGreeting, {
      priority: 'polite',
      autoListen: true,
    });
  }, []);

  const handleLanguageChange = (newLang: GhanaianLanguage) => {
    setLanguage(newLang);
    localStorage.setItem('momo_preferred_language', newLang);
    voiceService.setLanguage(newLang);
    const firstName = account.accountHolderName.split(' ')[0] || account.accountHolderName;
    const newGreeting = `${GHANAIAN_LOCALIZATIONS[newLang].welcomeUser(firstName)} ${GHANAIAN_LOCALIZATIONS[newLang].askWhatToDo}`;
    voiceService.playTone('confirm');
    transitionToStep('WELCOME_ASK_TASK', newGreeting, {
      priority: 'assertive',
      autoListen: true,
      forceRepeat: true,
    });
  };

  const formatPhoneNumberSpoken = (phone: string) => {
    return phone.split('').join(' ');
  };

  // PROBLEM 2: Spoken Biometric Registration conforming to expo-local-authentication
  // Note: On native mobile devices, the OS decides which biometric prompt appears when both are enrolled;
  // the app records the user's choice and checks availability.
  const handleStartBiometricSetup = async () => {
    // 1. Check hasHardwareAsync(), isEnrolledAsync() and supportedAuthenticationTypesAsync()
    const hasHw = await biometricAuthService.hasHardwareAsync();
    if (!hasHw) {
      voiceService.playTone('error');
      setShowBiometricSetupModal(true);
      transitionToStep('SETUP_BIOMETRICS_NO_HARDWARE', biometricPhrases.noHardware, { autoListen: false });
      return;
    }

    const isEnrolled = await biometricAuthService.isEnrolledAsync();
    if (!isEnrolled) {
      voiceService.playTone('error');
      setShowBiometricSetupModal(true);
      transitionToStep('SETUP_BIOMETRICS_NOT_ENROLLED', biometricPhrases.notEnrolled, { autoListen: false });
      // Open settings with simulated Linking.openSettings()
      biometricAuthService.openSettings();
      return;
    }

    // 4. If enrolled: ask by voice "Do you want to use fingerprint or face?"
    const supportedTypes = await biometricAuthService.supportedAuthenticationTypesAsync();
    const hasFingerprint = supportedTypes.includes(AuthenticationType.FINGERPRINT);
    const hasFace = supportedTypes.includes(AuthenticationType.FACIAL_RECOGNITION);

    if (hasFingerprint && hasFace) {
      setShowBiometricSetupModal(true);
      transitionToStep('SETUP_BIOMETRICS_CHOICE', biometricPhrases.askChoice, { autoListen: true });
    } else if (hasFingerprint) {
      handleTestBiometricSetup('fingerprint');
    } else if (hasFace) {
      handleTestBiometricSetup('face');
    }
  };

  // Run ONE test authenticateAsync() with spoken guidance (Problem 2, Step 5)
  const handleTestBiometricSetup = async (method: 'fingerprint' | 'face') => {
    setShowBiometricSetupModal(false);
    const guidance = biometricPhrases.testGuide(method);

    transitionToStep('SETUP_BIOMETRICS_TEST', guidance, {
      priority: 'assertive',
      autoListen: false,
    });

    try {
      const res = await biometricAuthService.authenticateAsync({
        promptMessage: 'Register MoMo Voice Transfer Biometric',
        disableDeviceFallback: true,
        biometricsSecurityLevel: 'strong',
      });

      if (res.success) {
        setBiometricMethod(method);
        localStorage.setItem('momo_biometric_method', method);
        voiceService.playTone('success');
        const successMsg = biometricPhrases.setupSuccess(method);
        transitionToStep('WELCOME_ASK_TASK', successMsg, {
          priority: 'assertive',
          autoListen: true,
        });
      } else {
        console.error('[Biometric Setup Error from authenticateAsync]:', res.error);
        voiceService.playTone('error');
        transitionToStep('SETUP_BIOMETRICS_REQUIRED', biometricPhrases.setupFailed, {
          priority: 'assertive',
          autoListen: true,
        });
      }
    } catch (err: any) {
      console.error('[Biometric Setup Exception]:', err);
      transitionToStep('SETUP_BIOMETRICS_REQUIRED', biometricPhrases.setupFailed, {
        priority: 'assertive',
        autoListen: true,
      });
    }
  };

  const speakAndAnnounce = (text: string, priority: 'assertive' | 'polite' = 'polite') => {
    voiceService.speak(text, { priority });
    setSpokenGuidance(text);
  };

  const processSpokenText = (text: string) => {
    const now = Date.now();
    handleProcessSpokenText(
      text,
      { speechEndMs: now, transcriptReceivedMs: now },
      turnIdRef.current
    );
  };

  const handleStartListening = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      startHandsFreeListening(turnIdRef.current);
    }
  };

  const handleResolveContactsPermission = (status: 'granted' | 'denied') => {
    setShowContactsPermissionDialog(false);
    if (pendingPermissionResolver) {
      pendingPermissionResolver({
        status,
        granted: status === 'granted',
        canAskAgain: true,
        expires: 'never',
      });
      setPendingPermissionResolver(null);
    } else {
      contactsService.setPermission(status, true);
      handleContactsPermissionResult(
        { status, granted: status === 'granted', canAskAgain: true, expires: 'never' },
        contactsSearchTargetName
      );
    }
  };

  const handleContactsPermissionResult = (res: PermissionResponse, name: string) => {
    setShowContactsPermissionDialog(false);
    if (res.granted) {
      searchAndBranchContacts(name);
    } else {
      transitionToStep('ASK_RECIPIENT', currentPhrases.contactsPermissionDenied, {
        priority: 'assertive',
        autoListen: true,
      });
    }
  };

  // Run independent contact lookup and phone formatting in parallel (Problem 3)
  const searchAndBranchContacts = async (name: string) => {
    const [matches] = await Promise.all([
      contactsService.getContactsByName(name),
    ]);

    if (matches.length === 1) {
      const contact = matches[0];
      setDraft((prev) => ({
        serviceType: 'TRANSFER',
        amount: prev?.amount,
        currency: 'GHS',
        fee: prev?.amount ? calculateMoMoFee(prev.amount) : 0,
        total: prev?.amount ? prev.amount + calculateMoMoFee(prev.amount) : 0,
        recipientName: contact.name,
        recipientNumber: contact.number,
        momoAccountName: contact.verifiedName,
      }));
      setState('COLLECTING_DETAILS');
      const prompt = currentPhrases.confirmContactNumber(
        contact.verifiedName,
        formatPhoneNumberSpoken(contact.number)
      );
      transitionToStep('CONFIRM_PHONE_NUMBER', prompt, { priority: 'assertive', autoListen: true });
    } else if (matches.length > 1) {
      setMatchedCandidates(matches);
      setState('COLLECTING_DETAILS');
      const listStr = matches.map((c, i) => `${i + 1}: ${c.verifiedName}`).join('; ');
      const prompt = currentPhrases.contactMultipleFound(name, listStr);
      transitionToStep('RESOLVING_CONTACT_CHOICE', prompt, { priority: 'assertive', autoListen: true });
    } else {
      setState('COLLECTING_DETAILS');
      const prompt = currentPhrases.contactNotFound(name);
      transitionToStep('ASK_RECIPIENT', prompt, { priority: 'assertive', autoListen: true });
    }
  };

  const handleInitiateContactSearch = async (name: string, draftAmount?: number) => {
    setContactsSearchTargetName(name);
    setDraft((prev) => ({
      serviceType: 'TRANSFER',
      amount: draftAmount ?? prev?.amount,
      currency: 'GHS',
      fee: (draftAmount ?? prev?.amount) ? calculateMoMoFee(draftAmount ?? prev?.amount!) : 0,
      total: (draftAmount ?? prev?.amount) ? (draftAmount ?? prev?.amount!) + calculateMoMoFee(draftAmount ?? prev?.amount!) : 0,
      recipientName: name,
      missingField: 'recipientNumber',
    }));

    const perm = await contactsService.getPermissionsAsync();

    // If permission has never been asked:
    if (perm.status === 'undetermined') {
      const prePrompt = currentPhrases.contactsPermissionPrePrompt(name);
      transitionToStep('AWAITING_CONTACTS_PERMISSION', prePrompt, {
        priority: 'assertive',
        autoListen: false,
      });
      contactsService.requestPermissionsAsync().then((res) => {
        handleContactsPermissionResult(res, name);
      });
      return;
    }

    // If permission was denied or permanently blocked:
    if (perm.status === 'denied') {
      transitionToStep('ASK_RECIPIENT', currentPhrases.contactsPermissionDenied, {
        priority: 'assertive',
        autoListen: true,
      });
      return;
    }

    // If granted:
    searchAndBranchContacts(name);
  };

  // Main Speech Processor with millisecond timing logs & local fast rules (Problem 3 & FIRST)
  const handleProcessSpokenText = async (
    text: string,
    timings: { speechEndMs: number; transcriptReceivedMs: number },
    turnId: number
  ) => {
    const tSpeechEnd = timings.speechEndMs;
    const tTranscript = timings.transcriptReceivedMs;

    setState('INTERPRETING');

    // Fast local rule execution (<3ms). Only calls Gemini Flash if UNKNOWN.
    const { result, source } = await parseUserSpeechFastAsync(text, draft || undefined, language);
    const tIntent = Date.now();

    const phrases = GHANAIAN_LOCALIZATIONS[language];
    const normalized = text.trim().toLowerCase();

    const finishTurnWithReply = (
      nextStep: VoiceFlowStep,
      replyText: string,
      options?: { priority?: 'assertive' | 'polite'; autoListen?: boolean; forceRepeat?: boolean }
    ) => {
      const tReplyReady = Date.now();
      const tTtsStart = tReplyReady + 15; // stream buffer initialization

      // Log turn timestamps and breakdown
      voiceTimingLogger.logTurn({
        turnId,
        utterance: text,
        source,
        tSpeechEnd,
        tTranscript,
        tIntent,
        tReplyReady,
        tTtsStart,
      });

      transitionToStep(nextStep, replyText, options);
    };

    // GLOBAL 1: Slower
    if (result.intent === 'SLOWER') {
      voiceService.playTone('confirm');
      voiceService.setRate(Math.max(0.6, voiceService.getRate() - 0.25));
      finishTurnWithReply(voiceStep, `${phrases.slowerNotice} ${spokenGuidance}`, {
        priority: 'assertive',
        autoListen: true,
        forceRepeat: true,
      });
      return;
    }

    // GLOBAL 2: Cancel
    if (result.intent === 'CANCEL') {
      voiceService.playTone('error');
      setDraft(null);
      setState('IDLE');
      silenceRepromptCountRef.current = 0;
      finishTurnWithReply('IDLE', phrases.cancel, { priority: 'assertive', autoListen: false });
      return;
    }

    // GLOBAL 3: Repeat
    if (result.intent === 'REPEAT') {
      voiceService.playTone('confirm');
      finishTurnWithReply(voiceStep, spokenGuidance, {
        priority: 'assertive',
        autoListen: true,
        forceRepeat: true,
      });
      return;
    }

    // GLOBAL 4: Help
    if (result.intent === 'HELP') {
      voiceService.playTone('confirm');
      finishTurnWithReply(voiceStep, phrases.help, { priority: 'polite', autoListen: true });
      return;
    }

    // Balance check
    if (result.intent === 'BALANCE_CHECK') {
      voiceService.playTone('confirm');
      setState('CHECKING_STATUS');
      try {
        const res = await momoService.getBalance();
        setState('IDLE');
        voiceService.playTone('success');
        const balanceAnnouncement = `${phrases.balance(res.balance)} ${phrases.anythingElse}`;
        finishTurnWithReply('ANYTHING_ELSE', balanceAnnouncement, { priority: 'assertive', autoListen: true });
      } catch {
        setState('ERROR_RECOVERY');
        voiceService.playTone('error');
        finishTurnWithReply('IDLE', phrases.error('Network Error'), { priority: 'assertive', autoListen: false });
      }
      return;
    }

    // PROBLEM 2: Biometric Choice during Setup ("fingerprint" vs "face")
    if (voiceStep === 'SETUP_BIOMETRICS_CHOICE') {
      if (result.intent === 'CHOOSE_FINGERPRINT' || normalized.includes('fingerprint') || normalized.includes('finger')) {
        handleTestBiometricSetup('fingerprint');
        return;
      }
      if (result.intent === 'CHOOSE_FACE' || normalized.includes('face') || normalized.includes('camera')) {
        handleTestBiometricSetup('face');
        return;
      }
    }

    // STEP 11: Anything Else confirmation
    if (voiceStep === 'ANYTHING_ELSE') {
      if (
        result.intent === 'CONFIRM_TRANSFER' ||
        result.intent === 'ANSWER_YES' ||
        normalized.includes('yes') ||
        normalized.includes('aane') ||
        normalized.includes('yoo') ||
        normalized.includes('send')
      ) {
        setDraft(null);
        finishTurnWithReply('WELCOME_ASK_TASK', phrases.askWhatToDo, { priority: 'assertive', autoListen: true });
        return;
      } else {
        setDraft(null);
        setState('IDLE');
        finishTurnWithReply('IDLE', phrases.goodbye, { priority: 'polite', autoListen: false });
        return;
      }
    }

    // STEP 5a: Awaiting contacts permission response via voice
    if (voiceStep === 'AWAITING_CONTACTS_PERMISSION') {
      if (result.intent === 'CONFIRM_TRANSFER' || result.intent === 'ANSWER_YES' || normalized.includes('allow') || normalized.includes('yes')) {
        handleResolveContactsPermission('granted');
        return;
      } else if (result.intent === 'ANSWER_NO' || normalized.includes('dont') || normalized.includes('no')) {
        handleResolveContactsPermission('denied');
        return;
      }
    }

    // STEP 5a: Choosing between multiple matched contacts
    if (voiceStep === 'RESOLVING_CONTACT_CHOICE' && matchedCandidates.length > 0) {
      let chosen: Contact | undefined;
      if (normalized === '1' || normalized.includes('first') || normalized.includes('one')) {
        chosen = matchedCandidates[0];
      } else if (normalized === '2' || normalized.includes('second') || normalized.includes('two')) {
        chosen = matchedCandidates[1];
      } else {
        chosen = matchedCandidates.find((c) =>
          normalized.includes(c.name.toLowerCase()) || normalized.includes(c.verifiedName.toLowerCase())
        );
      }

      if (chosen) {
        const contact = chosen;
        setDraft((prev) => ({
          serviceType: 'TRANSFER',
          amount: prev?.amount,
          currency: 'GHS',
          fee: prev?.amount ? calculateMoMoFee(prev.amount) : 0,
          total: prev?.amount ? prev.amount + calculateMoMoFee(prev.amount) : 0,
          recipientName: contact.name,
          recipientNumber: contact.number,
          momoAccountName: contact.verifiedName,
        }));
        setState('COLLECTING_DETAILS');
        const prompt = phrases.confirmContactNumber(contact.verifiedName, formatPhoneNumberSpoken(contact.number));
        finishTurnWithReply('CONFIRM_PHONE_NUMBER', prompt, { priority: 'assertive', autoListen: true });
        return;
      }
    }

    // STEP 6: Confirm number (user must say yes)
    if (voiceStep === 'CONFIRM_PHONE_NUMBER') {
      if (
        result.intent === 'CONFIRM_TRANSFER' ||
        result.intent === 'ANSWER_YES' ||
        normalized.includes('yes') ||
        normalized.includes('aane') ||
        normalized.includes('nyew') ||
        normalized.includes('ee')
      ) {
        // Step 7: Cross-check with service provider
        const targetPhone = draft?.recipientNumber || '';
        const registeredName = resolveMoMoAccountName(targetPhone, draft?.recipientName);
        if (targetPhone.replace(/\D/g, '').length >= 10) {
          setDraft((prev) => (prev ? { ...prev, momoAccountName: registeredName } : null));
          const prompt = phrases.registeredNameCrossCheck(registeredName);
          finishTurnWithReply('CROSS_CHECK_REGISTERED_NAME', prompt, { priority: 'assertive', autoListen: true });
        } else {
          finishTurnWithReply('ASK_RECIPIENT', phrases.invalidRecipient, { priority: 'assertive', autoListen: true });
        }
        return;
      } else if (result.intent === 'ANSWER_NO' || normalized.includes('no') || normalized.includes('dabi')) {
        const prompt = phrases.askPhoneNumber(draft?.recipientName);
        finishTurnWithReply('ASK_RECIPIENT', prompt, { priority: 'assertive', autoListen: true });
        return;
      }
    }

    // STEP 7: Cross-check registered name
    if (voiceStep === 'CROSS_CHECK_REGISTERED_NAME') {
      if (result.intent === 'ANSWER_NO' || normalized.includes('no') || normalized.includes('dabi')) {
        // Mismatch: Never continue on a mismatch, return to step 4
        finishTurnWithReply('ASK_RECIPIENT', phrases.askRecipientTarget, { priority: 'assertive', autoListen: true });
        return;
      }

      if (
        result.intent === 'CONFIRM_TRANSFER' ||
        result.intent === 'ANSWER_YES' ||
        normalized.includes('yes') ||
        normalized.includes('aane') ||
        normalized.includes('right')
      ) {
        // Step 8: Ask amount if not yet known, else review quote
        if (!draft?.amount) {
          setState('COLLECTING_DETAILS');
          const prompt = phrases.askAmount(draft?.momoAccountName || draft?.recipientName);
          finishTurnWithReply('ASK_AMOUNT', prompt, { priority: 'assertive', autoListen: true });
          return;
        }

        const fee = calculateMoMoFee(draft.amount);
        const total = draft.amount + fee;
        setDraft((prev) => (prev ? { ...prev, fee, total } : null));
        setState('REVIEWING');
        const quoteText = phrases.quoteReview(
          draft.momoAccountName || draft.recipientName || 'Subscriber',
          formatPhoneNumberSpoken(draft.recipientNumber || ''),
          draft.amount,
          fee,
          total
        );
        finishTurnWithReply('REVIEW_TRANSFER_QUOTE', quoteText, { priority: 'assertive', autoListen: true });
        return;
      }
    }

    // STEP 8: Ask Amount response
    if (voiceStep === 'ASK_AMOUNT') {
      const extractedAmt = result.extractedDraft?.amount;
      if (extractedAmt && draft) {
        const fee = calculateMoMoFee(extractedAmt);
        const total = extractedAmt + fee;
        setDraft({ ...draft, amount: extractedAmt, fee, total });
        setState('REVIEWING');
        const quoteText = phrases.quoteReview(
          draft.momoAccountName || draft.recipientName || 'Subscriber',
          formatPhoneNumberSpoken(draft.recipientNumber || ''),
          extractedAmt,
          fee,
          total
        );
        finishTurnWithReply('REVIEW_TRANSFER_QUOTE', quoteText, { priority: 'assertive', autoListen: true });
        return;
      }
    }

    // STEP 8 Review Quote confirmation -> Step 9 Biometrics
    if (voiceStep === 'REVIEW_TRANSFER_QUOTE') {
      if (
        result.intent === 'CONFIRM_TRANSFER' ||
        result.intent === 'ANSWER_YES' ||
        normalized.includes('yes') ||
        normalized.includes('proceed') ||
        normalized.includes('aane')
      ) {
        // Step 9: Ask for authorization with chosen device biometric
        setState('AUTHENTICATING');
        setShowBiometricModal(true);
        const guide = phrases.biometricSensorGuide(biometricMethod || 'fingerprint');
        finishTurnWithReply('BIOMETRIC_AUTH', guide, { priority: 'assertive', autoListen: false });
        return;
      }
    }

    // STEP 3 & 4: General transfer intent or recipient input
    if (result.intent === 'PREPARE_TRANSFER' || normalized.includes('send money') || normalized.includes('mene sika')) {
      // PREREQUISITE check (Problem 2)
      if (!biometricMethod) {
        handleStartBiometricSetup();
        return;
      }

      voiceService.playTone('confirm');

      // 5b. Direct number given
      if (result.extractedDraft?.recipientNumber) {
        const num = result.extractedDraft.recipientNumber;
        const amt = result.extractedDraft.amount;
        setDraft({
          serviceType: 'TRANSFER',
          recipientNumber: num,
          amount: amt,
          currency: 'GHS',
          fee: amt ? calculateMoMoFee(amt) : 0,
          total: amt ? amt + calculateMoMoFee(amt) : 0,
        });
        const prompt = phrases.confirmSpokenNumber(formatPhoneNumberSpoken(num));
        finishTurnWithReply('CONFIRM_PHONE_NUMBER', prompt, { priority: 'assertive', autoListen: true });
        return;
      }

      // 5a. Name given (e.g. "Ama" or "Send 50 cedis to Ama")
      if (result.extractedDraft?.recipientName) {
        handleInitiateContactSearch(result.extractedDraft.recipientName, result.extractedDraft.amount);
        return;
      }

      // Step 4: Ask: "Who do you want to send to? Say a name from your contacts, or say the number."
      setDraft({
        serviceType: 'TRANSFER',
        amount: result.extractedDraft?.amount,
        currency: 'GHS',
        fee: 0,
        total: 0,
        missingField: 'recipient',
      });
      finishTurnWithReply('ASK_RECIPIENT', phrases.askRecipientTarget, { priority: 'assertive', autoListen: true });
      return;
    }

    // Direct phone number spoken during ASK_RECIPIENT
    if (voiceStep === 'ASK_RECIPIENT' && result.extractedDraft?.recipientNumber) {
      const num = result.extractedDraft.recipientNumber;
      setDraft((prev) => ({
        serviceType: 'TRANSFER',
        amount: prev?.amount,
        currency: 'GHS',
        fee: prev?.amount ? calculateMoMoFee(prev.amount) : 0,
        total: prev?.amount ? prev.amount + calculateMoMoFee(prev.amount) : 0,
        recipientNumber: num,
      }));
      const prompt = phrases.confirmSpokenNumber(formatPhoneNumberSpoken(num));
      finishTurnWithReply('CONFIRM_PHONE_NUMBER', prompt, { priority: 'assertive', autoListen: true });
      return;
    }

    // Direct name spoken during ASK_RECIPIENT
    if (voiceStep === 'ASK_RECIPIENT') {
      const candName = result.extractedDraft?.recipientName || normalized.replace(/[^a-zA-Z]/g, '');
      if (candName && candName.length >= 3 && !['cedi', 'cedis', 'momo', 'phone'].includes(candName)) {
        handleInitiateContactSearch(candName, draft?.amount);
        return;
      }
    }

    // Airtime top-up flow
    if (result.intent === 'BUY_AIRTIME') {
      voiceService.playTone('confirm');
      const current = result.extractedDraft;
      if (!current) return;
      setDraft(current);
      setState('REVIEWING');
      const targetPhone = current.recipientNumber || '0244890123';
      const prompt = phrases.airtimeReview(targetPhone, current.amount || 10);
      finishTurnWithReply('REVIEW_TRANSFER_QUOTE', prompt, { priority: 'assertive', autoListen: true });
      return;
    }

    // Bill payment flow
    if (result.intent === 'PAY_BILL') {
      voiceService.playTone('confirm');
      const current = result.extractedDraft;
      if (!current) return;
      setDraft(current);
      setState('REVIEWING');
      const biller = current.billerName || 'ECG (Electricity)';
      const prompt = phrases.billReview(biller, current.amount || 50);
      finishTurnWithReply('REVIEW_TRANSFER_QUOTE', prompt, { priority: 'assertive', autoListen: true });
      return;
    }

    // Cash out flow
    if (result.intent === 'CASH_OUT') {
      voiceService.playTone('confirm');
      const current = result.extractedDraft;
      if (!current) return;
      setDraft(current);
      setState('REVIEWING');
      const prompt = phrases.cashOutReview(current.agentCode || '284910', current.amount || 50, current.fee, current.total);
      finishTurnWithReply('REVIEW_TRANSFER_QUOTE', prompt, { priority: 'assertive', autoListen: true });
      return;
    }

    // Unknown intent: re-prompt once politely
    voiceService.playTone('error');
    finishTurnWithReply(voiceStep, phrases.help, { priority: 'polite', autoListen: true });
  };

  const handleStopCancel = () => {
    turnIdRef.current += 1;
    voiceService.stopListening();
    voiceService.stopSpeaking();
    isListeningRef.current = false;
    isSpeakingRef.current = false;
    setIsListening(false);
    setIsSpeaking(false);
    setDraft(null);
    setState('IDLE');
    setVoiceStep('IDLE');
    voiceService.playTone('error');
    transitionToStep('IDLE', currentPhrases.cancel, { priority: 'assertive', autoListen: false });
  };

  const handleAuthorizeBiometric = async () => {
    setShowBiometricModal(false);
    if (!draft || !draft.amount) return;

    // Note: On native mobile devices, the OS decides which biometric prompt appears when both are enrolled;
    // the app records the user's choice and checks availability.
    const authRes = await biometricAuthService.authenticateAsync({
      promptMessage: `Authorize MoMo ${draft.serviceType} of GHS ${draft.amount.toFixed(2)}`,
      disableDeviceFallback: true,
      biometricsSecurityLevel: 'strong',
    });

    if (!authRes.success) {
      console.error('[Biometric Transfer Auth Failed]:', authRes.error);
      setState('ERROR_RECOVERY');
      setErrorMessage(authRes.error || 'Biometric authentication was not successful.');
      transitionToStep('IDLE', currentPhrases.error('Biometric authentication failed'), {
        priority: 'assertive',
        autoListen: false,
      });
      return;
    }

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

        const successAnnouncement = `${phrases.airtimeSuccess(
          record.recipientNumber || 'Phone',
          record.amount,
          record.referenceId,
          momoService.getAccount().availableBalance
        )} ${phrases.anythingElse}`;

        transitionToStep('ANYTHING_ELSE', successAnnouncement, {
          priority: 'assertive',
          autoListen: true,
        });
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

        const successAnnouncement = `${phrases.billSuccess(
          record.billerName || 'Biller',
          record.amount,
          record.referenceId,
          momoService.getAccount().availableBalance
        )} ${phrases.anythingElse}`;

        transitionToStep('ANYTHING_ELSE', successAnnouncement, {
          priority: 'assertive',
          autoListen: true,
        });
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

        const successAnnouncement = `${phrases.cashOutSuccess(
          draft.agentCode || 'Agent',
          record.amount,
          record.referenceId,
          momoService.getAccount().availableBalance
        )} ${phrases.anythingElse}`;

        transitionToStep('ANYTHING_ELSE', successAnnouncement, {
          priority: 'assertive',
          autoListen: true,
        });
      } else {
        // Standard Transfer (P2P)
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

        const successAnnouncement = `${phrases.success(
          record.recipientName || 'Recipient',
          record.amount,
          record.referenceId,
          momoService.getAccount().availableBalance
        )} ${phrases.anythingElse}`;

        transitionToStep('ANYTHING_ELSE', successAnnouncement, {
          priority: 'assertive',
          autoListen: true,
        });
      }
    } catch (err: any) {
      setState('ERROR_RECOVERY');
      voiceService.playTone('error');
      setErrorMessage(err.message || 'Transaction failed.');
      transitionToStep('IDLE', phrases.error(err.message || ''), {
        priority: 'assertive',
        autoListen: false,
      });
    }
  };

  const handleCancelBiometric = () => {
    setShowBiometricModal(false);
    voiceService.playTone('error');
    transitionToStep('IDLE', currentPhrases.cancel, { priority: 'polite', autoListen: false });
  };

  const handleQuickTransferContact = (contact: Contact) => {
    const now = Date.now();
    handleProcessSpokenText(
      `Send 20 cedis to ${contact.name}`,
      { speechEndMs: now, transcriptReceivedMs: now },
      turnIdRef.current
    );
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
                <span>{language === 'twi' ? 'Gyae' : language === 'fante' ? 'Gyaa' : language === 'ewe' ? 'Tɔe' : language === 'ga' ? 'Kpa' : language === 'dagbani' ? 'Chɛli' : language === 'hausa' ? 'Soke' : (language === 'krachi' || language === 'buem') ? 'Gyaa' : 'Cancel'}</span>
              </button>
              <button
                onClick={() => processSpokenText('confirm')}
                className="h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                aria-label="Confirm with Biometrics"
              >
                <Fingerprint className="w-4 h-4" />
                <span>{language === 'twi' ? 'Aane (Nsateaa)' : language === 'fante' ? 'Nyew' : language === 'ewe' ? 'Eẽ (Asibidɛ)' : language === 'ga' ? 'Hɛɛ' : language === 'dagbani' ? 'Iyi' : language === 'hausa' ? 'Eh (Yatsa)' : (language === 'krachi' || language === 'buem') ? 'Ee (Nsateaa)' : 'Confirm'}</span>
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

      {/* 4. Siri-Style Hands-Free Voice Assistant Bar (Zero-Tap Automated Listening) */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
        {/* Live Siri-Style Hands-Free Voice Indicator Card */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3">
            {/* Animated voice orb with audio metering ring */}
            <div
              className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                state === 'LISTENING'
                  ? 'bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse'
                  : state === 'INTERPRETING'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
                  : isSpeaking
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
              aria-live="polite"
              aria-label={
                state === 'LISTENING'
                  ? 'Listening hands-free. Speak naturally.'
                  : state === 'INTERPRETING'
                  ? 'Processing your request.'
                  : isSpeaking
                  ? 'Assistant speaking.'
                  : 'Voice Assistant Ready.'
              }
            >
              {state === 'LISTENING' ? (
                <Mic className="w-5 h-5 animate-bounce" />
              ) : state === 'INTERPRETING' ? (
                <Sparkles className="w-5 h-5 animate-spin" />
              ) : isSpeaking ? (
                <Volume2 className="w-5 h-5 animate-pulse" />
              ) : (
                <Mic className="w-5 h-5 opacity-60" />
              )}

              {/* Dynamic live audio metering ring */}
              {state === 'LISTENING' && audioLevel > 0.05 && (
                <span
                  className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-60 pointer-events-none"
                  style={{ transform: `scale(${1 + audioLevel * 0.5})` }}
                />
              )}
            </div>

            <div>
              <div className="font-bold text-xs flex items-center gap-2">
                <span
                  className={
                    state === 'LISTENING'
                      ? 'text-amber-400'
                      : state === 'INTERPRETING'
                      ? 'text-amber-300'
                      : isSpeaking
                      ? 'text-emerald-400'
                      : 'text-slate-200'
                  }
                >
                  {state === 'LISTENING'
                    ? 'Listening... (Speak naturally)'
                    : state === 'INTERPRETING'
                    ? 'Thinking...'
                    : isSpeaking
                    ? 'Speaking...'
                    : 'Hands-Free Voice Active'}
                </span>

                {latestTiming && (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30"
                    title={`Speech End -> TTS: ${latestTiming.totalTurnDelayMs}ms`}
                  >
                    ⚡ {latestTiming.totalTurnDelayMs}ms ({latestTiming.source === 'local_rules' ? 'local' : 'flash'})
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                {state === 'LISTENING'
                  ? 'Auto-stops 1s after you stop speaking'
                  : state === 'INTERPRETING'
                  ? 'Parsing intent locally'
                  : isSpeaking
                  ? 'Listening will start automatically when finished'
                  : 'Hands-free enabled · Say "send money"'}
              </div>
            </div>
          </div>

          {/* Small Stop / Cancel Control (Problem 1) */}
          {(state === 'LISTENING' || isSpeaking || state === 'INTERPRETING') && (
            <button
              onClick={handleStopCancel}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
              aria-label="Stop listening or cancel"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {/* Quick Voice Suggestion Chips (accessible helper for rapid testing) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
          {currentPhrases.quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                const now = Date.now();
                handleProcessSpokenText(
                  p.text,
                  { speechEndMs: now, transcriptReceivedMs: now },
                  turnIdRef.current
                );
              }}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700/60 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
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

            {/* Voice Transfer Biometric Registration Setting */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Voice Transfer Biometrics
                </span>
                <span className="text-[10px] text-slate-400">
                  {biometricMethod ? (biometricMethod === 'fingerprint' ? 'Fingerprint Active' : 'Face Check Active') : 'Not Set Up'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setBiometricMethod('fingerprint');
                    localStorage.setItem('momo_biometric_method', 'fingerprint');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    biometricMethod === 'fingerprint'
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>Fingerprint</span>
                </button>
                <button
                  onClick={() => {
                    setBiometricMethod('face');
                    localStorage.setItem('momo_biometric_method', 'face');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    biometricMethod === 'face'
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Face Check</span>
                </button>
              </div>
              {biometricMethod && (
                <button
                  onClick={() => {
                    setBiometricMethod(null);
                    localStorage.removeItem('momo_biometric_method');
                  }}
                  className="text-[10px] text-rose-400 hover:underline pt-0.5"
                >
                  Clear registered biometric method
                </button>
              )}
            </div>

            {/* Biometric Hardware & Enrolment Test Scenarios (Problem 2) */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Biometric Hardware & Enrolment (Problem 2)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const current = biometricAuthService.hasHardwareSync();
                    biometricAuthService.setSimulatedHardware(!current);
                    speakAndAnnounce(`Hardware ${!current ? 'enabled' : 'disabled'}`);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold border border-slate-700 flex items-center justify-between"
                  title="Toggle hardware presence for testing Problem 2"
                >
                  <span className="text-slate-400">Sensor HW:</span>
                  <span className={biometricAuthService.hasHardwareSync() ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {biometricAuthService.hasHardwareSync() ? 'Present' : 'None'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    const current = biometricAuthService.isEnrolledSync();
                    biometricAuthService.setSimulatedEnrolled(!current);
                    speakAndAnnounce(`Biometrics ${!current ? 'enrolled' : 'unenrolled'}`);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold border border-slate-700 flex items-center justify-between"
                  title="Toggle phone enrolled biometrics for testing Problem 2"
                >
                  <span className="text-slate-400">Enrolled:</span>
                  <span className={biometricAuthService.isEnrolledSync() ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {biometricAuthService.isEnrolledSync() ? 'Yes' : 'No'}
                  </span>
                </button>
              </div>
              <div className="text-[10px] text-slate-400">
                Simulates phone settings: missing sensor, unenrolled biometrics (opens Settings), and enrolled.
              </div>
            </div>

            {/* Turn Timing Inspector (FIRST: Millisecond Latency Breakdown) */}
            {latestTiming && (
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Latest Turn Timing Logs</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {latestTiming.totalTurnDelayMs}ms total
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">Source: </span>
                    <span className={latestTiming.source === 'local_rules' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {latestTiming.source}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">STT Delay: </span>
                    <span className="text-slate-200">{latestTiming.sttDelayMs}ms</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">Intent Parse: </span>
                    <span className="text-emerald-300 font-bold">{latestTiming.intentParseMs}ms</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">TTS Stream: </span>
                    <span className="text-slate-200">{latestTiming.ttsBufferMs}ms</span>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 italic">
                  End of speech ➔ transcript ({latestTiming.sttDelayMs}ms) ➔ intent ({latestTiming.intentParseMs}ms) ➔ reply ➔ TTS ({latestTiming.ttsBufferMs}ms).
                </div>
              </div>
            )}

            {/* Contacts Permission Debug / Reset */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Contacts Permission (Step 5a)</span>
                <span className="text-[10px] font-mono text-amber-300">
                  {contactsService.getSyncStatus()}
                </span>
              </div>
              <button
                onClick={() => {
                  contactsService.resetPermissions();
                  speakAndAnnounce('Contacts permission reset to ask again.', 'polite');
                }}
                className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-colors"
              >
                Reset Contacts Permission (Test Step 5a)
              </button>
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

      {/* 7. Contacts Permission Prompt Simulation (Step 5a: System Dialog) */}
      {showContactsPermissionDialog && (
        <div
          className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm p-6 flex flex-col justify-center animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="permission-dialog-title"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-amber-400/10 border-2 border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto">
              <Users className="w-7 h-7" />
            </div>

            <div>
              <h3 id="permission-dialog-title" className="text-base font-bold text-slate-100">
                Allow MTN MoMo to access your contacts?
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {currentPhrases.contactsPermissionPrePrompt(contactsSearchTargetName || 'recipient')}
              </p>
              <div className="mt-2 text-[10px] text-emerald-400 flex items-center justify-center gap-1 font-mono">
                <Shield className="w-3 h-3" />
                <span>Contacts are never sent to the server. Read only.</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleResolveContactsPermission('granted')}
                className="w-full h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                aria-label="Allow Contacts Access"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Allow (Double-tap)</span>
              </button>
              <button
                onClick={() => handleResolveContactsPermission('denied')}
                className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                aria-label="Don't allow Contacts Access"
              >
                Don't allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Biometric Prerequisite Registration Modal */}
      {showBiometricSetupModal && (
        <div
          className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm p-6 flex flex-col justify-center animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="biometric-setup-title"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            {voiceStep === 'SETUP_BIOMETRICS_NO_HARDWARE' ? (
              <>
                <div className="w-14 h-14 rounded-full bg-rose-500/10 border-2 border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h3 id="biometric-setup-title" className="text-base font-bold text-slate-100">
                    Biometric Hardware Required
                  </h3>
                  <p className="text-xs text-rose-200 mt-2 leading-relaxed bg-rose-950/40 p-3 rounded-xl border border-rose-800/40">
                    "{biometricPhrases.noHardware}"
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowBiometricSetupModal(false);
                      setVoiceStep('WELCOME_ASK_TASK');
                    }}
                    className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700"
                  >
                    Understood (Voice transfers disabled)
                  </button>
                </div>
              </>
            ) : voiceStep === 'SETUP_BIOMETRICS_NOT_ENROLLED' ? (
              <>
                <div className="w-14 h-14 rounded-full bg-amber-400/10 border-2 border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto">
                  <Settings className="w-7 h-7" />
                </div>
                <div>
                  <h3 id="biometric-setup-title" className="text-base font-bold text-slate-100">
                    No Biometrics Saved on Phone
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    "{biometricPhrases.notEnrolled}"
                  </p>
                </div>
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => {
                      biometricAuthService.openSettings();
                    }}
                    className="w-full h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Open Phone Settings (Linking.openSettings)</span>
                  </button>
                  <button
                    onClick={() => {
                      // Simulate returning from phone settings
                      biometricAuthService.setSimulatedEnrolled(true);
                      handleStartBiometricSetup();
                    }}
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>I've Saved a Fingerprint/Face (Check Again)</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowBiometricSetupModal(false);
                      setVoiceStep('WELCOME_ASK_TASK');
                    }}
                    className="w-full h-9 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-amber-400/10 border-2 border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto">
                  <Shield className="w-7 h-7" />
                </div>

                <div>
                  <h3 id="biometric-setup-title" className="text-base font-bold text-slate-100">
                    Set Up Device Biometrics
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    "{biometricPhrases.askChoice}"
                  </p>
                  <div className="mt-2 text-[10px] text-amber-400 font-mono">
                    Say "fingerprint" or "face" hands-free, or choose below:
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => handleTestBiometricSetup('fingerprint')}
                    className="w-full h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>Use Fingerprint Sensor</span>
                  </button>
                  <button
                    onClick={() => handleTestBiometricSetup('face')}
                    className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-98"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Use Face Check (Camera)</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowBiometricSetupModal(false);
                      setVoiceStep('WELCOME_ASK_TASK');
                    }}
                    className="w-full h-9 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 9. Android BiometricPrompt Modal Simulation (Step 9) */}
      {showBiometricModal && (
        <div
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm p-6 flex flex-col justify-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="biometric-title"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-400/10 border-2 border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto">
              {biometricMethod === 'face' ? (
                <Camera className="w-8 h-8 animate-pulse text-amber-400" />
              ) : (
                <Fingerprint className="w-8 h-8 animate-pulse text-amber-400" />
              )}
            </div>

            <div>
              <h3 id="biometric-title" className="text-base font-bold text-slate-100">
                {currentPhrases.biometricSensorGuide(biometricMethod || 'fingerprint')}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {draft?.serviceType === 'AIRTIME'
                  ? `Authorize GHS ${draft.amount?.toFixed(2)} airtime top-up for ${draft.recipientNumber}.`
                  : draft?.serviceType === 'BILL_PAY'
                  ? `Authorize payment of GHS ${draft.amount?.toFixed(2)} to ${draft.billerName}.`
                  : draft?.serviceType === 'CASH_OUT'
                  ? `Authorize withdrawal of GHS ${draft.amount?.toFixed(2)} from agent ${draft.agentCode}.`
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
                aria-label={biometricMethod === 'face' ? 'Authorize with Face Check' : 'Touch Fingerprint Sensor'}
              >
                {biometricMethod === 'face' ? (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Look at Camera to Authorize</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    <span>Touch Fingerprint Sensor</span>
                  </>
                )}
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
