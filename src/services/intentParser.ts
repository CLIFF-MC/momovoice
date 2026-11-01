import { FREQUENT_CONTACTS, calculateMoMoFee } from '../data/mockData';
import { GHANAIAN_NUMBER_WORDS } from '../data/ghanaianLanguages';
import { Contact, GhanaianLanguage, IntentType, TransferDraft } from '../types/momo';

export interface ParseResult {
  intent: IntentType;
  confidence: number;
  extractedDraft?: TransferDraft;
  rawText: string;
  matchedContact?: Contact;
  clarificationPrompt?: string;
}

// Spoken digit translation to digits
const SPOKEN_DIGIT_MAP: Record<string, string> = {
  // English
  zero: '0',
  oh: '0',
  o: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',

  // Twi & Akan
  hwee: '0',
  da: '0',
  baako: '1',
  mmienu: '2',
  ebien: '2',
  mmiensa: '3',
  ebiasa: '3',
  anan: '4',
  enan: '4',
  enum: '5',
  esia: '6',
  nsia: '6',
  nson: '7',
  nsoŋ: '7',
  nwɔtwe: '8',
  nkron: '9',

  // Ewe
  noti: '0',
  ɖeka: '1',
  eve: '2',
  etɔ̃: '3',
  ene: '4',
  atɔ̃: '5',
  adé: '6',
  adré: '7',
  enyi: '8',
  enyiɖe: '9',

  // Ga
  ekome: '1',
  enyɔ: '2',
  etɛ: '3',
  ejwɛ: '4',
  enumɔ: '5',
  ekpaa: '6',
  kpawo: '7',
  kpaanyɔ: '8',
  nɛɛhu: '9',

  // Dagbani
  zaa: '0',
  yini: '1',
  ayi: '2',
  ata: '3',
  anahi: '4',
  anu: '5',
  yobu: '6',
  yopɔin: '7',
  nii: '8',
  wai: '9',

  // Hausa
  sifili: '0',
  daya: '1',
  biyu: '2',
  uku: '3',
  hudu: '4',
  biyar: '5',
  shida: '6',
  bakwai: '7',
  takwas: '8',
  tara: '9',

  // Krachi (Kaakyi - Oti Region)
  koo: '1',
  anyɔ: '2',
  asa: '3',
  anaa: '4',
  anoo: '5',
  asiee: '6',
  asono: '7',
  akwee: '8',
  akpuno: '9',

  // Buem (Lɛlɛmi - Oti Region)
  kuko: '1',
  anɔ: '5',
  asie: '6',
  asunɔ: '7',
  anyani: '8',
  anyana: '9',
  lefu: '10',
};

// Ghanaian KYC MoMo Registered Directory simulation
const GHANAIAN_FIRST_NAMES = ['Kwabena', 'Kojo', 'Yaw', 'Abena', 'Afia', 'Kofi', 'Akosua', 'Esi', 'Fati', 'Ibrahim'];
const GHANAIAN_LAST_NAMES = ['Asante', 'Mensah', 'Owusu', 'Boateng', 'Appiah', 'Acheampong', 'Quaye', 'Frimpong', 'Osei', 'Alhassan'];

export function resolveMoMoAccountName(phone: string, preferredName?: string): string {
  const cleanPhone = phone.replace(/\D/g, '');

  // 1. Check frequent contacts first
  const existing = FREQUENT_CONTACTS.find(
    (c) => c.number.replace(/\D/g, '') === cleanPhone || (preferredName && c.name.toLowerCase() === preferredName.toLowerCase())
  );
  if (existing) return existing.verifiedName;

  // 2. Deterministic KYC lookup based on digits to simulate realistic telecom registry
  if (cleanPhone.length >= 7) {
    let sum = 0;
    for (let i = 0; i < cleanPhone.length; i++) {
      sum += parseInt(cleanPhone[i], 10) || 0;
    }
    const fIdx = sum % GHANAIAN_FIRST_NAMES.length;
    const lIdx = (sum * 3 + 1) % GHANAIAN_LAST_NAMES.length;
    return `${GHANAIAN_FIRST_NAMES[fIdx]} ${GHANAIAN_LAST_NAMES[lIdx]}`;
  }

  return preferredName || `Subscriber ${phone}`;
}

export function extractPhoneNumberFromText(text: string): string | null {
  // First convert spoken digit words to digits
  const words = text.toLowerCase().split(/[\s,.-]+/);
  let convertedDigits = '';

  for (const w of words) {
    if (SPOKEN_DIGIT_MAP[w]) {
      convertedDigits += SPOKEN_DIGIT_MAP[w];
    } else if (/^\d+$/.test(w)) {
      convertedDigits += w;
    }
  }

  // Check converted spoken digits for 10-digit Ghanaian pattern (024, 054, 055, 059, 020, 050, 027, 057)
  const convertedMatch = convertedDigits.match(/0(24|54|55|59|20|50|27|57)\d{7}/);
  if (convertedMatch) {
    return convertedMatch[0];
  }

  // Check raw string without spaces/dashes
  const rawDigits = text.replace(/[\s-]/g, '');
  const rawMatch = rawDigits.match(/(?:\+233|233|0)(24|54|55|59|20|50|27|57)\d{7}/);
  if (rawMatch) {
    let num = rawMatch[0];
    if (num.startsWith('+233')) num = '0' + num.slice(4);
    else if (num.startsWith('233')) num = '0' + num.slice(3);
    return num;
  }

  // Generic 10 digit fallback starting with 0
  const any10 = rawDigits.match(/0\d{9}/);
  if (any10) return any10[0];

  return null;
}

export function parseUserSpeech(
  text: string,
  currentDraft?: TransferDraft,
  language: GhanaianLanguage = 'en'
): ParseResult {
  const normalized = text.trim().toLowerCase();

  // 1. Check for Repeat in English, Twi, Fante, Ewe, Ga, Dagbani, Hausa, Krachi
  if (
    normalized.includes('repeat') ||
    normalized.includes('say again') ||
    normalized.includes('say that again') ||
    normalized.includes('what did you say') ||
    normalized.includes('read again') ||
    normalized.includes('ka bio') ||
    normalized.includes('san ka') ||
    normalized.includes('gblɔe ake') ||
    normalized.includes('gbugbɔ') ||
    normalized.includes('kɛɛ ekoŋŋ') ||
    normalized.includes('tsɔɔmɔ mi') ||
    normalized.includes('labi yeli') ||
    normalized.includes('sake fada') ||
    normalized.includes('maimaita') ||
    normalized.includes('mesan ka')
  ) {
    return { intent: 'REPEAT', confidence: 0.98, rawText: text };
  }

  // 1b. Check for Slower
  if (
    normalized.includes('slower') ||
    normalized.includes('speak slower') ||
    normalized.includes('speak slowly') ||
    normalized.includes('slow down') ||
    normalized.includes('brɛoo') ||
    normalized.includes('kasa brɛoo') ||
    normalized.includes('blewu') ||
    normalized.includes('bokɔɔ') ||
    normalized.includes('baŋkpoo') ||
    normalized.includes('a hankali')
  ) {
    return { intent: 'SLOWER', confidence: 0.98, rawText: text };
  }

  // 1c. Check for Option Selection (e.g. 1st contact vs 2nd contact)
  if (
    normalized === '1' ||
    normalized === 'one' ||
    normalized === 'first' ||
    normalized === 'first one' ||
    normalized === 'number one' ||
    normalized === '2' ||
    normalized === 'two' ||
    normalized === 'second' ||
    normalized === 'second one' ||
    normalized === 'number two'
  ) {
    return { intent: 'SELECT_OPTION', confidence: 0.95, rawText: text };
  }

  // 1d. Check for Biometric Choice: Fingerprint
  if (
    normalized.includes('fingerprint') ||
    normalized.includes('finger') ||
    normalized.includes('thumb') ||
    normalized.includes('nsateaa') ||
    normalized.includes('asibidɛ') ||
    normalized.includes('yatsa') ||
    normalized.includes('ninɛbii') ||
    normalized.includes('nuu') ||
    normalized.includes('yatsan hannu')
  ) {
    return { intent: 'CHOOSE_FINGERPRINT', confidence: 0.96, rawText: text };
  }

  // 1e. Check for Biometric Choice: Face
  if (
    normalized.includes('face') ||
    normalized.includes('face check') ||
    normalized.includes('face unlock') ||
    normalized.includes('camera') ||
    normalized.includes('anim') ||
    normalized.includes('fuska') ||
    normalized.includes('ŋku') ||
    normalized.includes('hie')
  ) {
    return { intent: 'CHOOSE_FACE', confidence: 0.96, rawText: text };
  }

  // 2. Check for Cancel
  if (
    normalized === 'cancel' ||
    normalized === 'stop' ||
    normalized.includes('cancel transfer') ||
    normalized.includes('stop transfer') ||
    normalized.includes("don't send") ||
    normalized.includes('dont send') ||
    normalized.includes('abort') ||
    normalized === 'no cancel' ||
    normalized.includes('gyae') ||
    normalized.includes('gyaa') ||
    normalized.includes('twa mu') ||
    normalized.includes('twe san') ||
    normalized.includes('dzudzɔ') ||
    normalized.includes('ɖee ɖa') ||
    normalized.includes('tsĩ nɔ') ||
    normalized.includes('zaɣisi') ||
    normalized.includes('soke') ||
    normalized.includes('ba na so')
  ) {
    return { intent: 'CANCEL', confidence: 0.95, rawText: text };
  }

  // 2b. Check for explicit No / Disagree / Deny
  if (
    normalized === 'no' ||
    normalized === 'dabi' ||
    normalized === "a'a" ||
    normalized === 'ao' ||
    normalized === 'wrong' ||
    normalized.includes('not right') ||
    normalized.includes("don't allow") ||
    normalized.includes('dont allow') ||
    normalized === 'deny' ||
    normalized.includes('chɛli') ||
    normalized.includes('kpa') ||
    normalized.includes('ba haka ba')
  ) {
    return { intent: 'ANSWER_NO', confidence: 0.95, rawText: text };
  }

  // 3. Check for Confirm / Yes / Allow
  if (
    normalized === 'yes' ||
    normalized === 'confirm' ||
    normalized === 'yes confirm' ||
    normalized === 'allow' ||
    normalized === 'double tap allow' ||
    normalized.includes('send it') ||
    normalized.includes('proceed') ||
    normalized.includes('authorize') ||
    normalized.includes('approve') ||
    normalized === 'okay send' ||
    normalized === 'ok send' ||
    normalized === 'aane' ||
    normalized.includes('pene so') ||
    normalized === 'nyew' ||
    normalized === 'eẽ' ||
    normalized === 'ẽ' ||
    normalized.includes('elɔ̃') ||
    normalized === 'hɛɛ' ||
    normalized.includes('yeda') ||
    normalized === 'iyi' ||
    normalized.includes('di saɣi') ||
    normalized === 'yoo' ||
    normalized === 'eh' ||
    normalized === 'to' ||
    normalized.includes('tabbatar') ||
    normalized === 'ee' ||
    normalized.includes('that is right') ||
    normalized === 'right' ||
    normalized === 'correct'
  ) {
    return { intent: 'CONFIRM_TRANSFER', confidence: 0.95, rawText: text };
  }

  // 4. Check for Help
  if (
    normalized === 'help' ||
    normalized.includes('what can i say') ||
    normalized.includes('what can i do') ||
    normalized.includes('options') ||
    normalized.includes('commands') ||
    normalized.includes('mmoa') ||
    normalized.includes('boa me') ||
    normalized.includes('mboa') ||
    normalized.includes('kpekpeɖeŋu') ||
    normalized.includes('yelikɛbua') ||
    normalized.includes('sɔŋsim') ||
    normalized.includes('taimako')
  ) {
    return { intent: 'HELP', confidence: 0.95, rawText: text };
  }

  // 5. Check for Balance Check
  if (
    normalized.includes('balance') ||
    normalized.includes('how much') ||
    normalized.includes('my money') ||
    normalized.includes('account status') ||
    normalized.includes('check momo') ||
    normalized.includes('hwɛ me sika') ||
    normalized.includes('hwɛ mo sika') ||
    normalized.includes('me sika') ||
    normalized.includes('sika a aka') ||
    normalized.includes('kpɔ nye ga') ||
    normalized.includes('nye ga') ||
    normalized.includes('kwɛmɔ mishika') ||
    normalized.includes('mishika') ||
    normalized.includes('nyama n laɣifu') ||
    normalized.includes('n laɣifu') ||
    normalized.includes('duba kudi') ||
    normalized.includes('kudi na') ||
    normalized.includes('kere me sika')
  ) {
    return { intent: 'BALANCE_CHECK', confidence: 0.95, rawText: text };
  }

  // 6. Check for Transaction Status inquiry
  if (
    normalized.includes('status') ||
    normalized.includes('did my money go') ||
    normalized.includes('is it sent') ||
    normalized.includes('check last transaction')
  ) {
    return { intent: 'TRANSACTION_STATUS', confidence: 0.92, rawText: text };
  }

  // 7. Check for Change Amount or Change Recipient (if user already in drafting state)
  if (currentDraft && (normalized.includes('change amount') || normalized.includes('make it') || normalized.includes('instead') || normalized.includes('sesa'))) {
    const extractedAmount = extractAmount(normalized);
    if (extractedAmount) {
      const fee = currentDraft.serviceType === 'TRANSFER' ? calculateMoMoFee(extractedAmount) : currentDraft.serviceType === 'CASH_OUT' ? 0.5 : 0;
      return {
        intent: 'CHANGE_AMOUNT',
        confidence: 0.9,
        rawText: text,
        extractedDraft: {
          ...currentDraft,
          amount: extractedAmount,
          fee,
          total: extractedAmount + fee,
          missingField: currentDraft.recipientNumber ? null : 'recipientNumber',
        },
      };
    }
  }

  // 8. If currently collecting missing phone number
  const detectedPhone = extractPhoneNumberFromText(text);
  if (currentDraft && currentDraft.missingField === 'recipientNumber' && detectedPhone) {
    const momoName = resolveMoMoAccountName(detectedPhone, currentDraft.recipientName);
    const fee = currentDraft.amount ? (currentDraft.serviceType === 'TRANSFER' ? calculateMoMoFee(currentDraft.amount) : 0) : 0;
    const total = currentDraft.amount ? currentDraft.amount + fee : 0;

    return {
      intent: currentDraft.serviceType === 'AIRTIME' ? 'BUY_AIRTIME' : 'PREPARE_TRANSFER',
      confidence: 0.94,
      rawText: text,
      extractedDraft: {
        ...currentDraft,
        recipientNumber: detectedPhone,
        momoAccountName: momoName,
        recipientName: currentDraft.recipientName || momoName,
        missingField: currentDraft.amount ? null : 'amount',
        fee,
        total,
      },
    };
  }

  // 9. If currently collecting missing amount
  const directAmount = extractAmount(normalized);
  if (currentDraft && currentDraft.missingField === 'amount' && directAmount) {
    const fee = currentDraft.serviceType === 'TRANSFER' ? calculateMoMoFee(directAmount) : currentDraft.serviceType === 'CASH_OUT' ? 0.5 : 0;
    return {
      intent: currentDraft.serviceType === 'AIRTIME' ? 'BUY_AIRTIME' : currentDraft.serviceType === 'BILL_PAY' ? 'PAY_BILL' : currentDraft.serviceType === 'CASH_OUT' ? 'CASH_OUT' : 'PREPARE_TRANSFER',
      confidence: 0.92,
      rawText: text,
      extractedDraft: {
        ...currentDraft,
        amount: directAmount,
        fee,
        total: directAmount + fee,
        missingField: null,
      },
    };
  }

  // 10. Check for Airtime Purchase across all languages
  if (
    normalized.includes('airtime') ||
    normalized.includes('kadodo') ||
    normalized.includes('credit') ||
    normalized.includes('top up') ||
    normalized.includes('topup') ||
    normalized.includes('tɔ airtime') ||
    normalized.includes('ƒle kadodo') ||
    normalized.includes('hé airtime') ||
    normalized.includes('daɣim airtime') ||
    normalized.includes('daɣim salima') ||
    normalized.includes('katin waya') ||
    normalized.includes('sayi katin') ||
    normalized.includes('katin')
  ) {
    const amt = extractAmount(normalized) || (currentDraft?.serviceType === 'AIRTIME' ? currentDraft.amount : undefined) || 10;
    let targetPhone = detectedPhone;
    let targetName = 'My Phone';

    const matchedContact = matchContact(normalized);
    if (matchedContact) {
      targetPhone = matchedContact.number;
      targetName = matchedContact.name;
    } else if (targetPhone) {
      targetName = resolveMoMoAccountName(targetPhone);
    } else {
      // Default to self number
      targetPhone = '0244890123';
      targetName = 'Abena Owusu (Self)';
    }

    return {
      intent: 'BUY_AIRTIME',
      confidence: 0.95,
      rawText: text,
      extractedDraft: {
        serviceType: 'AIRTIME',
        recipientName: targetName,
        recipientNumber: targetPhone,
        momoAccountName: targetName,
        amount: amt,
        fee: 0,
        total: amt,
        currency: 'GHS',
        missingField: null,
      },
    };
  }

  // 11. Check for Bill / Merchant Payment across all languages
  if (
    normalized.includes('ecg') ||
    normalized.includes('water') ||
    normalized.includes('gwcl') ||
    normalized.includes('dstv') ||
    normalized.includes('electricity') ||
    normalized.includes('light bill') ||
    (normalized.includes('bill') && !normalized.includes('balance')) ||
    normalized.includes('xe fe') ||
    normalized.includes('wo nyɛmɔ') ||
    normalized.includes('yo samli') ||
    normalized.includes('merchant') ||
    normalized.includes('biyan kudi') ||
    normalized.includes('biya kudi') ||
    normalized.includes('biya')
  ) {
    const amt = extractAmount(normalized) || (currentDraft?.serviceType === 'BILL_PAY' ? currentDraft.amount : undefined) || 50;
    let biller = 'ECG (Electricity)';
    if (normalized.includes('water') || normalized.includes('gwcl')) biller = 'Ghana Water (GWCL)';
    else if (normalized.includes('dstv')) biller = 'DSTV Ghana';
    else if (normalized.includes('merchant')) biller = 'MTN MoMo Merchant';

    return {
      intent: 'PAY_BILL',
      confidence: 0.95,
      rawText: text,
      extractedDraft: {
        serviceType: 'BILL_PAY',
        billerName: biller,
        recipientName: biller,
        amount: amt,
        fee: 0,
        total: amt,
        currency: 'GHS',
        missingField: null,
      },
    };
  }

  // 12. Check for Cash Out / Agent Withdrawal across all languages
  if (
    normalized.includes('cash out') ||
    normalized.includes('cashout') ||
    normalized.includes('withdraw') ||
    normalized.includes('gye sika') ||
    normalized.includes('yi sika') ||
    normalized.includes('ɖe ga') ||
    normalized.includes('tsi shika') ||
    normalized.includes('yi laɣifu') ||
    normalized.includes('cire kudi') ||
    normalized.includes('cire')
  ) {
    const amt = extractAmount(normalized) || (currentDraft?.serviceType === 'CASH_OUT' ? currentDraft.amount : undefined) || 50;
    const fee = 0.5;
    return {
      intent: 'CASH_OUT',
      confidence: 0.95,
      rawText: text,
      extractedDraft: {
        serviceType: 'CASH_OUT',
        agentCode: '284910',
        recipientName: 'Agent 284910 (Kwame Agent Point)',
        amount: amt,
        fee,
        total: amt + fee,
        currency: 'GHS',
        missingField: null,
      },
    };
  }

  // 13. Transfer intent parsing (e.g. "Send 20 cedis to Ama", "Mene 20 kɔma Ama", "Aika cedis ashirin zuwa Ama")
  if (
    normalized.includes('send') ||
    normalized.includes('transfer') ||
    normalized.includes('pay') ||
    normalized.includes('give') ||
    normalized.includes('mene') ||
    normalized.includes('kɔma') ||
    normalized.includes('fa ma') ||
    normalized.includes('tua') ||
    normalized.includes('ɖo') ||
    normalized.includes('maje') ||
    normalized.includes('timi') ||
    normalized.includes('aika') ||
    normalized.includes('tura') ||
    detectedPhone ||
    currentDraft?.missingField
  ) {
    // 10a. Check phone number directly
    let matchedPhone = detectedPhone;
    let matchedContact = matchContact(normalized);
    let extractedAmount = extractAmount(normalized);

    let finalRecipientName = currentDraft?.recipientName;
    let finalRecipientNumber = matchedPhone || currentDraft?.recipientNumber;
    let finalMomoName = currentDraft?.momoAccountName;

    if (matchedContact && !matchedPhone) {
      finalRecipientName = matchedContact.name;
      // Do not set recipientNumber here; step 5a will check contacts permission first
      finalRecipientNumber = undefined;
    } else if (matchedPhone) {
      finalRecipientNumber = matchedPhone;
      finalMomoName = resolveMoMoAccountName(matchedPhone, finalRecipientName);
      if (!finalRecipientName) finalRecipientName = finalMomoName;
    } else {
      // Check if user mentioned an unlisted person's name (e.g. "Send to Emmanuel", "Kɔma Kwame")
      const spokenName = extractUnlistedRecipientName(normalized);
      if (spokenName) {
        finalRecipientName = spokenName;
      }
    }

    const finalAmount = extractedAmount || currentDraft?.amount;
    let missingField: 'recipient' | 'recipientNumber' | 'amount' | null = null;
    let clarificationPrompt = '';

    if (!finalRecipientName && !finalRecipientNumber && !finalAmount) {
      missingField = 'recipient';
      clarificationPrompt = 'Who would you like to send money to? You can say a contact name or speak the phone number.';
    } else if (!finalRecipientNumber && !finalRecipientName) {
      missingField = 'recipient';
      clarificationPrompt = `Who would you like to send ${finalAmount} Ghana cedis to? You can say a contact name or speak the phone number.`;
    } else if (!finalRecipientNumber) {
      // User said "Send to Emmanuel", but we don't have Emmanuel's phone number!
      missingField = 'recipientNumber';
      clarificationPrompt = `What is ${finalRecipientName}'s phone number? You can speak the 10-digit number.`;
    } else if (!finalAmount) {
      missingField = 'amount';
      clarificationPrompt = `How many Ghana cedis would you like to transfer to ${finalMomoName || finalRecipientName}?`;
    }

    const fee = finalAmount ? calculateMoMoFee(finalAmount) : 0;
    const total = finalAmount ? finalAmount + fee : 0;

    return {
      intent: 'PREPARE_TRANSFER',
      confidence: 0.9,
      rawText: text,
      matchedContact: matchedContact || undefined,
      clarificationPrompt,
      extractedDraft: {
        serviceType: 'TRANSFER',
        recipientName: finalRecipientName,
        recipientNumber: finalRecipientNumber,
        momoAccountName: finalMomoName || (finalRecipientNumber ? resolveMoMoAccountName(finalRecipientNumber, finalRecipientName) : undefined),
        amount: finalAmount,
        currency: 'GHS',
        fee,
        total,
        missingField,
      },
    };
  }

  // 14. If user just spoke a contact name directly (e.g. "Ama" or "Kwame")
  const directContact = matchContact(normalized);
  if (directContact) {
    const fee = currentDraft?.amount ? calculateMoMoFee(currentDraft.amount) : 0;
    const total = currentDraft?.amount ? currentDraft.amount + fee : 0;
    return {
      intent: 'PREPARE_TRANSFER',
      confidence: 0.92,
      rawText: text,
      matchedContact: directContact,
      extractedDraft: {
        serviceType: 'TRANSFER',
        recipientName: directContact.name,
        recipientNumber: undefined,
        momoAccountName: undefined,
        amount: currentDraft?.amount,
        currency: 'GHS',
        fee,
        total,
        missingField: 'recipientNumber',
      },
    };
  }

  // 15. If user just spoke a phone number directly (e.g. "0244123456" or "zero two four...")
  if (detectedPhone) {
    const momoName = resolveMoMoAccountName(detectedPhone);
    const fee = currentDraft?.amount ? calculateMoMoFee(currentDraft.amount) : 0;
    const total = currentDraft?.amount ? currentDraft.amount + fee : 0;
    return {
      intent: 'PREPARE_TRANSFER',
      confidence: 0.92,
      rawText: text,
      extractedDraft: {
        serviceType: 'TRANSFER',
        recipientName: momoName,
        recipientNumber: detectedPhone,
        momoAccountName: momoName,
        amount: currentDraft?.amount,
        currency: 'GHS',
        fee,
        total,
        missingField: currentDraft?.amount ? null : 'amount',
      },
    };
  }

  // 16. If user just spoke an amount directly (e.g. "50", "twenty cedis", "cedis eduonu")
  if (directAmount) {
    const fee = calculateMoMoFee(directAmount);
    return {
      intent: 'PREPARE_TRANSFER',
      confidence: 0.88,
      rawText: text,
      extractedDraft: {
        ...currentDraft,
        serviceType: currentDraft?.serviceType || 'TRANSFER',
        amount: directAmount,
        fee,
        total: directAmount + fee,
        currency: 'GHS',
        missingField: currentDraft?.recipientNumber ? null : 'recipient',
      },
    };
  }

  // Unrecognized
  return {
    intent: 'UNKNOWN',
    confidence: 0.2,
    rawText: text,
    clarificationPrompt: "I didn't quite catch that. You can say 'Check balance', 'Send 20 cedis to Ama', speak a phone number, or say 'Help'.",
  };
}

function matchContact(text: string): Contact | null {
  for (const c of FREQUENT_CONTACTS) {
    const contactLower = c.name.toLowerCase();
    const verifiedLower = c.verifiedName.toLowerCase();
    if (text.includes(contactLower) || text.includes(verifiedLower)) {
      return c;
    }
  }

  // Check phone number match
  const phone = extractPhoneNumberFromText(text);
  if (phone) {
    const matched = FREQUENT_CONTACTS.find((c) => c.number.replace(/\D/g, '') === phone.replace(/\D/g, ''));
    if (matched) return matched;

    const momoName = resolveMoMoAccountName(phone);
    return {
      id: `custom-${phone}`,
      name: momoName,
      number: phone,
      verifiedName: momoName,
      relationship: 'Mobile Money Contact',
    };
  }

  return null;
}

function extractUnlistedRecipientName(text: string): string | null {
  // Check patterns like: "to [Name]", "kɔma [Name]", "na [Name]", "maje [Name]", "zuwa [Name]", "wa [Name]"
  const match = text.match(/(?:to|kɔma|na|maje|timi|zuwa|wa)\s+([a-zA-Z]{3,15})/i);
  if (match && match[1]) {
    const cand = match[1].toLowerCase();
    // Exclude common keywords
    if (!['cedi', 'cedis', 'momo', 'phone', 'money', 'ghana', 'sika', 'ga', 'kudi'].includes(cand)) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1);
    }
  }
  return null;
}

function extractAmount(text: string): number | null {
  // Regex for digits: "20", "20.50", "20 cedis", "ghs 20"
  const digitMatch = text.match(/(\d+(\.\d{1,2})?)/);
  if (digitMatch) {
    const val = parseFloat(digitMatch[1]);
    // Avoid mistaking phone numbers for amount
    if (!isNaN(val) && val > 0 && val < 50000 && !digitMatch[1].startsWith('02') && !digitMatch[1].startsWith('05')) {
      return val;
    }
  }

  // Check spoken words in English, Twi, Fante, Ewe, Ga, Dagbani
  for (const [word, num] of Object.entries(GHANAIAN_NUMBER_WORDS)) {
    const regex = new RegExp(`(^|\\s)${word}($|\\s)`, 'i');
    if (regex.test(text) || text.includes(word)) {
      return num;
    }
  }

  return null;
}

/**
 * Fast intent parser resolving simple answers locally in <3ms with no LLM call.
 * Only calls Gemini Flash fallback if local rules return UNKNOWN.
 */
export async function parseUserSpeechFastAsync(
  text: string,
  currentDraft?: TransferDraft,
  language: GhanaianLanguage = 'twi'
): Promise<{ result: ParseResult; source: 'local_rules' | 'llm_fallback' }> {
  // 1. Instant local rule resolution
  const localResult = parseUserSpeech(text, currentDraft, language);
  if (localResult.intent !== 'UNKNOWN') {
    return { result: localResult, source: 'local_rules' };
  }

  // 2. Complex or ambiguous utterance: call fast Gemini Flash fallback
  try {
    const res = await fetch('/api/fast-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        context: {
          draft: currentDraft,
          language,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.intent && data.intent !== 'UNKNOWN') {
        let mappedIntent: IntentType = 'UNKNOWN';
        if (data.intent === 'TRANSFER') mappedIntent = 'PREPARE_TRANSFER';
        else if (data.intent === 'AIRTIME') mappedIntent = 'BUY_AIRTIME';
        else if (data.intent === 'BILL') mappedIntent = 'PAY_BILL';
        else if (data.intent === 'CASHOUT') mappedIntent = 'CASH_OUT';
        else if (data.intent === 'BALANCE') mappedIntent = 'BALANCE_CHECK';
        else if (data.intent === 'YES') mappedIntent = 'CONFIRM_TRANSFER';
        else if (data.intent === 'NO') mappedIntent = 'ANSWER_NO';
        else if (data.intent === 'CANCEL') mappedIntent = 'CANCEL';
        else if (data.intent === 'REPEAT') mappedIntent = 'REPEAT';
        else if (data.intent === 'SLOWER') mappedIntent = 'SLOWER';
        else if (data.intent === 'FINGERPRINT') mappedIntent = 'CHOOSE_FINGERPRINT';
        else if (data.intent === 'FACE') mappedIntent = 'CHOOSE_FACE';

        if (mappedIntent !== 'UNKNOWN') {
          return {
            result: {
              intent: mappedIntent,
              confidence: 0.85,
              rawText: text,
              extractedDraft: data.amount
                ? {
                    serviceType: 'TRANSFER',
                    amount: data.amount,
                    currency: 'GHS',
                    fee: calculateMoMoFee(data.amount),
                    total: data.amount + calculateMoMoFee(data.amount),
                    recipientNumber: data.phone || undefined,
                    recipientName: data.recipient || undefined,
                  }
                : currentDraft,
            },
            source: 'llm_fallback',
          };
        }
      }
    }
  } catch {
    // LLM fallback failed, maintain local UNKNOWN
  }

  return { result: localResult, source: 'local_rules' };
}

