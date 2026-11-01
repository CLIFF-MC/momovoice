import { GhanaianLanguage, LanguageOption } from '../types/momo';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English (Ghana)', nativeName: 'Ghanaian English', region: 'National' },
  { code: 'twi', name: 'Asante Twi', nativeName: 'Twi (Akan)', region: 'Ashanti / Eastern' },
  { code: 'fante', name: 'Fante', nativeName: 'Mfantse', region: 'Central / Western' },
  { code: 'ewe', name: 'Ewe', nativeName: 'Eʋegbe', region: 'Volta Region' },
  { code: 'ga', name: 'Ga', nativeName: 'Gã', region: 'Greater Accra' },
  { code: 'dagbani', name: 'Dagbani', nativeName: 'Dagbanli', region: 'Northern Region' },
  { code: 'hausa', name: 'Hausa (Ghana)', nativeName: 'Harshen Hausa', region: 'National / Zongo' },
  { code: 'krachi', name: 'Krachi (Kaakyi)', nativeName: 'Kaakyi', region: 'Oti Region (Dambai)' },
  { code: 'buem', name: 'Buem (Lelemi)', nativeName: 'Lɛlɛmi (Buem)', region: 'Oti Region (Jasikan)' },
];

export interface LanguagePhrases {
  welcome: string;
  balance: (amount: number) => string;
  askRecipient: (amount?: number) => string;
  askPhoneNumber: (recipientName?: string) => string;
  askAmount: (recipient?: string) => string;
  review: (momoName: string, phone: string, amount: number, fee: number, total: number) => string;
  airtimeReview: (phone: string, amount: number) => string;
  airtimeSuccess: (phone: string, amount: number, ref: string, balance: number) => string;
  billReview: (biller: string, amount: number) => string;
  billSuccess: (biller: string, amount: number, ref: string, balance: number) => string;
  cashOutReview: (agent: string, amount: number, fee: number, total: number) => string;
  cashOutSuccess: (agent: string, amount: number, ref: string, balance: number) => string;
  biometricPrompt: (momoName: string, total: number) => string;
  success: (recipient: string, amount: number, ref: string, balance: number) => string;
  cancel: string;
  error: (msg: string) => string;
  help: string;
  repeat: string;
  welcomeUser: (name: string) => string;
  askWhatToDo: string;
  biometricPrerequisite: string;
  askRecipientTarget: string;
  contactsPermissionPrePrompt: (name: string) => string;
  contactsPermissionDenied: string;
  contactNotFound: (name: string) => string;
  contactMultipleFound: (name: string, listStr: string) => string;
  confirmContactNumber: (name: string, phone: string) => string;
  confirmSpokenNumber: (phone: string) => string;
  registeredNameCrossCheck: (name: string) => string;
  invalidRecipient: string;
  quoteReview: (name: string, phone: string, amount: number, fee: number, total: number) => string;
  biometricSensorGuide: (method: 'fingerprint' | 'face') => string;
  anythingElse: string;
  goodbye: string;
  silenceReprompt: string;
  silenceTimeout: string;
  slowerNotice: string;
  biometricNoHardware?: string;
  biometricNotEnrolled?: string;
  biometricAskChoice?: string;
  biometricTestGuide?: (method: 'fingerprint' | 'face') => string;
  biometricSetupSuccess?: (method: 'fingerprint' | 'face') => string;
  biometricSetupFailed?: string;
  quickPrompts: { label: string; text: string }[];
}

export const GHANAIAN_LOCALIZATIONS: Record<GhanaianLanguage, LanguagePhrases> = {
  en: {
    welcome: 'Welcome to MTN MoMo. You can say: "Send 20 cedis to Ama", "Buy 10 cedis airtime", "Pay ECG 50 cedis", "Cash out 50 cedis", or "Check balance".',
    balance: (amt) => `Your MTN Mobile Money available balance is ${amt.toFixed(2)} Ghana cedis.`,
    askRecipient: (amt) =>
      amt
        ? `Who would you like to send ${amt} Ghana cedis to? You can say a contact name or speak the phone number.`
        : 'Who would you like to send money to? You can say a contact name or speak the phone number.',
    askPhoneNumber: (name) =>
      name
        ? `What is ${name}'s phone number? You can speak the 10-digit number like "0244123456".`
        : 'Please speak the 10-digit mobile money phone number.',
    askAmount: (rec) =>
      rec ? `How many Ghana cedis would you like to transfer to ${rec}?` : 'How much would you like to transfer?',
    review: (momoName, phone, amt, fee, total) =>
      `Please verify recipient details: You are sending ${amt.toFixed(2)} Ghana cedis to phone number ${phone}. The registered MTN MoMo account name is ${momoName}. Network fee is ${fee.toFixed(2)} cedis, total is ${total.toFixed(2)} cedis. Say "Confirm" to authorize with your biometrics, or say "Cancel".`,
    airtimeReview: (phone, amt) =>
      `Please verify airtime purchase: You are buying ${amt.toFixed(2)} Ghana cedis airtime for ${phone}. Fee is 0.00 cedis. Say "Confirm" to authorize with your biometrics, or say "Cancel".`,
    airtimeSuccess: (phone, amt, ref, bal) =>
      `Airtime top-up successful! GHS ${amt.toFixed(2)} airtime credited to ${phone}. Ref: ${ref.slice(0, 8)}. Remaining balance is GHS ${bal.toFixed(2)}.`,
    billReview: (biller, amt) =>
      `Please verify bill payment: You are paying ${amt.toFixed(2)} Ghana cedis to ${biller}. Fee is 0.00 cedis. Say "Confirm" to authorize with your biometrics, or say "Cancel".`,
    billSuccess: (biller, amt, ref, bal) =>
      `Bill payment successful! Paid GHS ${amt.toFixed(2)} to ${biller}. Receipt: ${ref.slice(0, 8)}. New balance is GHS ${bal.toFixed(2)}.`,
    cashOutReview: (agent, amt, fee, total) =>
      `Please verify cash out: You are withdrawing ${amt.toFixed(2)} Ghana cedis from agent ${agent}. Agent fee is ${fee.toFixed(2)} cedis, total is ${total.toFixed(2)} cedis. Say "Confirm" to authorize with biometrics, or say "Cancel".`,
    cashOutSuccess: (agent, amt, ref, bal) =>
      `Cash withdrawal approved! GHS ${amt.toFixed(2)} authorized for agent ${agent}. Ref: ${ref.slice(0, 8)}. Remaining balance is GHS ${bal.toFixed(2)}.`,
    biometricPrompt: (momoName, total) =>
      `Touch your device fingerprint sensor or enter device credential to authorize transfer of GHS ${total.toFixed(2)} to ${momoName}. Your MoMo PIN is never spoken aloud.`,
    success: (rec, amt, ref, bal) =>
      `Transfer successful! You sent ${amt.toFixed(2)} Ghana cedis to ${rec}. Reference code ${ref.slice(0, 8)}. Updated balance is ${bal.toFixed(2)} Ghana cedis.`,
    cancel: 'Transaction cancelled. No funds were debited.',
    error: (msg) => `Transaction could not be completed. ${msg}. Your balance remains unchanged.`,
    help: 'You can say: "Send 20 cedis to Ama", "Buy 10 cedis airtime", "Pay ECG 50 cedis", "Cash out 50 cedis", "Check balance", or "Cancel".',
    repeat: 'Repeating last spoken instructions.',
    welcomeUser: (name) => `Welcome, ${name}.`,
    askWhatToDo: 'What would you like to do?',
    biometricPrerequisite: "Before we send money, let's set up your fingerprint or face check.",
    askRecipientTarget: 'Who do you want to send to? Say a name from your contacts, or say the number.',
    contactsPermissionPrePrompt: (name) =>
      `To find ${name}, I need to read your contacts. I can only read them, I can't change them. Your phone will ask permission now. Double-tap Allow.`,
    contactsPermissionDenied: 'No problem. Please say the number instead.',
    contactNotFound: (name) => `I couldn't find ${name} in your contacts. Please say the number.`,
    contactMultipleFound: (name, listStr) => `I found multiple contacts for ${name}: ${listStr}. Which one do you want?`,
    confirmContactNumber: (name, phone) => `I found ${name} with number ${phone}. Is this the right number?`,
    confirmSpokenNumber: (phone) => `You said ${phone}. Is that right?`,
    registeredNameCrossCheck: (name) => `This number is registered to ${name}. Is that right?`,
    invalidRecipient: 'This number is not registered on MTN MoMo. Please say a valid recipient name or number.',
    quoteReview: (name, phone, amt, fee, total) =>
      `You are sending ${amt.toFixed(2)} Ghana cedis to ${name}, number ${phone}. Network fee is ${fee.toFixed(2)} cedis, total is ${total.toFixed(2)} cedis. Say yes to proceed, or say cancel.`,
    biometricSensorGuide: (method) =>
      method === 'face' ? 'Look at the camera to authorize.' : 'Place your finger on the sensor to authorize.',
    anythingElse: 'Do you want to do anything else?',
    goodbye: 'Goodbye. Thank you for using MTN MoMo.',
    silenceReprompt: 'Are you still there? Please say your command, or say cancel.',
    silenceTimeout: 'No response heard. Ending session safely to protect your account. Goodbye.',
    slowerNotice: 'Speaking slower now.',
    quickPrompts: [
      { label: 'Airtime 10', text: 'Buy 10 cedis airtime' },
      { label: 'Send 20 to Ama', text: 'Send 20 cedis to Ama' },
      { label: 'Pay ECG 50', text: 'Pay ECG 50 cedis' },
      { label: 'Cash Out 50', text: 'Cash out 50 cedis' },
    ],
  },
  twi: {
    welcome: 'Akwaaba ba MTN MoMo mu. Wobɛtumi aka: "Tɔ airtime cedis du", "Mene cedis aduonu kɔma Ama", "Tua ECG bill cedis aduonum", "Gye sika cedis aduonum", anaa "Hwɛ me sika".',
    balance: (amt) => `Wo MTN MoMo sika a aka wɔ kɔntaa mu yɛ Ghana cedis ${amt.toFixed(2)}.`,
    askRecipient: (amt) =>
      amt
        ? `Hwan na wopɛ sɛ womene Ghana cedis ${amt} kɔma no? Wobɛtumi aka ne din anaa ne fon nɔmba.`
        : 'Hwan na wopɛ sɛ womene sika kɔma no? Wobɛtumi aka ne din anaa ne fon nɔmba.',
    askPhoneNumber: (name) =>
      name
        ? `${name} fon nɔmba nye ahe? Wobɛtumi aka nɔmba du no.`
        : 'Yɛsrɛ wo ka MoMo fon nɔmba du no.',
    askAmount: (rec) =>
      rec ? `Sika ahe na wopɛ sɛ womene kɔma ${rec}?` : 'Ghana cedis ahe na wopɛ sɛ womene?',
    review: (momoName, phone, amt, fee, total) =>
      `Yɛsrɛ wo tie yie: Wode Ghana cedis ${amt.toFixed(2)} rekɔma fon nɔmba ${phone}. Ne MTN MoMo din a ɛda so pɛpɛɛpɛ yɛ ${momoName}. MoMo ntoboa yɛ ${fee.toFixed(2)} cedis, ne nyinaa yɛ ${total.toFixed(2)} cedis. Ka sɛ "Aane" na fa wo nsateaa to afidie no so, anaa ka sɛ "Gyae".`,
    airtimeReview: (phone, amt) =>
      `Yɛsrɛ wo tie yie: Woretɔ Ghana cedis ${amt.toFixed(2)} airtime ama fon nɔmba ${phone}. Ntoboa biara nni ho. Ka sɛ "Aane" na fa wo nsateaa to afidie no so, anaa ka sɛ "Gyae".`,
    airtimeSuccess: (phone, amt, ref, bal) =>
      `Woatɔ airtime no pɛpɛɛpɛ! Ghana cedis ${amt.toFixed(2)} airtime akɔ fon ${phone} so. Wo sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    billReview: (biller, amt) =>
      `Yɛsrɛ wo tie yie: Woretua Ghana cedis ${amt.toFixed(2)} de ama ${biller}. Ka sɛ "Aane" na fa wo nsateaa to afidie no so, anaa ka sɛ "Gyae".`,
    billSuccess: (biller, amt, ref, bal) =>
      `Woatua ${biller} bill no korɔgyen! Cedis ${amt.toFixed(2)} akɔ pɛpɛɛpɛ. Wo sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    cashOutReview: (agent, amt, fee, total) =>
      `Yɛsrɛ wo tie yie: Woregye Ghana cedis ${amt.toFixed(2)} afiri agent ${agent} nkyɛn. Ntoboa yɛ ${fee.toFixed(2)} cedis, ne nyinaa yɛ ${total.toFixed(2)} cedis. Ka sɛ "Aane" na fa nsateaa to afidie no so.`,
    cashOutSuccess: (agent, amt, ref, bal) =>
      `Woagye sika no pɛpɛɛpɛ! Cedis ${amt.toFixed(2)} firi agent ${agent}. Wo sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    biometricPrompt: (momoName, total) =>
      `Fa wo nsateaa to afidie no so de agye cedis ${total.toFixed(2)} a worekɔma ${momoName} no atom. MoMo PIN biara renka wɔ bagua mu.`,
    success: (rec, amt, ref, bal) =>
      `Wo sika no akɔ pɛpɛɛpɛ! Woamene Ghana cedis ${amt.toFixed(2)} akɔma ${rec}. Adansedi nɔmba yɛ ${ref.slice(0, 8)}. Wo sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    cancel: 'Yatwa dwumadie no mu. Sika biara mfiri wo kɔntaa mu.',
    error: (msg) => `Adwuma no antumi ankɔ. ${msg}. Wo sika gu so pɛpɛɛpɛ.`,
    help: 'Wobɛtumi aka: "Tɔ airtime cedis du", "Mene cedis aduonu kɔma Ama", "Tua ECG bill", "Gye sika", "Hwɛ me sika", anaa "Gyae".',
    repeat: 'Mesan ka asɛm no bio ma wo ate.',
    welcomeUser: (name) => `Akwaaba, ${name}.`,
    askWhatToDo: 'Dɛn na wopɛ sɛ woyɛ?',
    biometricPrerequisite: "Ansa na yɛbɛmene sika no, ma yɛnsiesie wo nsateaa anaa woanim hwɛ.",
    askRecipientTarget: 'Hwan na wopɛ sɛ womene sika kɔma no? Ka edin firi wo contacts mu, anaa ka nɔmba no.',
    contactsPermissionPrePrompt: (name) =>
      `Sɛ merekɔpɛ ${name} a, ehia sɛ mekenkan wo contacts. Metumi akenkan nko ara, mentumi nsesa hwee. Wo fon bɛbisa kwan seesei. Mia Allow so.`,
    contactsPermissionDenied: 'Ɛnyɛ hwee. Yɛsrɛ wo ka nɔmba no mmom.',
    contactNotFound: (name) => `Mannya ${name} wɔ wo contacts mu. Yɛsrɛ wo ka nɔmba no.`,
    contactMultipleFound: (name, listStr) => `Manya contacts pii ma ${name}: ${listStr}. Hwan na wopɛ?`,
    confirmContactNumber: (name, phone) => `Manya ${name} a ne nɔmba yɛ ${phone}. Saa nɔmba yi yɛ pɛ?`,
    confirmSpokenNumber: (phone) => `Wo kae dɛ ${phone}. Ɛyɛ nokware?`,
    registeredNameCrossCheck: (name) => `Saa nɔmba yi edin a ɛda so yɛ ${name}. Ɛyɛ nokware?`,
    invalidRecipient: 'Saa nɔmba yi nyɛ pɛ wɔ MTN MoMo so. Yɛsrɛ wo ka din anaa nɔmba foforɔ.',
    quoteReview: (name, phone, amt, fee, total) =>
      `Wode Ghana cedis ${amt.toFixed(2)} rekɔma ${name}, nɔmba ${phone}. MoMo ntoboa yɛ ${fee.toFixed(2)} cedis, ne nyinaa yɛ ${total.toFixed(2)} cedis. Ka aane sɛ wopene so, anaa gyae.`,
    biometricSensorGuide: (method) =>
      method === 'face' ? 'Hwɛ kamera no mu de agye atom.' : 'Fa wo nsateaa to sensor no so de agye atom.',
    anythingElse: 'Wopɛ sɛ woyɛ biribi foforɔ bio?',
    goodbye: 'Nante yie. Yɛda wo ase sɛ wowɔ MTN MoMo so.',
    silenceReprompt: 'Wowɔ hɔ? Yɛsrɛ wo kasa, anaa ka dɛ gyae.',
    silenceTimeout: 'Mante biribiara. Mereto adwuma no mu de abɔ wo kɔnta ho ban. Nante yie.',
    slowerNotice: 'Merekasa brɛoo seesei.',
    quickPrompts: [
      { label: 'Tɔ Airtime 10', text: 'Tɔ airtime cedis du' },
      { label: 'Mene 20 kɔma Ama', text: 'Mene cedis aduonu kɔma Ama' },
      { label: 'Tua ECG 50', text: 'Tua ECG bill cedis aduonum' },
      { label: 'Hwɛ me sika', text: 'Hwɛ me sika' },
    ],
  },
  fante: {
    welcome: 'Akwaaba kɔ MTN MoMo mu. Itum ka dɛ "Tɔ airtime cedis du", "Mene cedis eduonu kɔma Ama", "Tua bill", "Gye sika", anaa "Hwɛ mo sika".',
    balance: (amt) => `Wo MTN MoMo sika a aka wɔ kɔnta mu yɛ Ghana cedis ${amt.toFixed(2)}.`,
    askRecipient: (amt) =>
      amt
        ? `Woana na epɛ dɛ emene Ghana cedis ${amt} kɔma no? Itum ka ne dzin anaa ne fon nɔmba.`
        : 'Woana na epɛ dɛ emene sika kɔma no? Itum ka ne dzin anaa ne fon nɔmba.',
    askPhoneNumber: (name) =>
      name
        ? `${name} fon nɔmba nye ahen? Itum ka nɔmba du no.`
        : 'Yɛserɛ wo ka MoMo fon nɔmba du no.',
    askAmount: (rec) =>
      rec ? `Sika ahen na epɛ dɛ emene kɔma ${rec}?` : 'Ghana cedis ahen na epɛ dɛ emene?',
    review: (momoName, phone, amt, fee, total) =>
      `Yɛserɛ wo tsie yie: Erima Ghana cedis ${amt.toFixed(2)} akɔ fon nɔmba ${phone} do. Ne MTN MoMo dzin a ɔda do pɛpɛɛpɛ nye ${momoName}. MoMo akwantu kaw nye ${fee.toFixed(2)} cedis, ne nyinara nye ${total.toFixed(2)} cedis. Ka dɛ "Nyew" na dze wo nsateaa to do, anaa ka dɛ "Gyaa".`,
    airtimeReview: (phone, amt) =>
      `Yɛserɛ wo tsie yie: Eretɔ Ghana cedis ${amt.toFixed(2)} airtime ama fon ${phone}. Kaw biara nnyi ho. Ka dɛ "Nyew" na dze wo nsateaa to do.`,
    airtimeSuccess: (phone, amt, ref, bal) =>
      `Eretɔ airtime no akɔ pɛpɛɛpɛ! Cedis ${amt.toFixed(2)} airtime akɔ fon ${phone} do. Sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    billReview: (biller, amt) =>
      `Yɛserɛ wo tsie yie: Eretua Ghana cedis ${amt.toFixed(2)} ama ${biller}. Ka dɛ "Nyew" na dze wo nsateaa to do.`,
    billSuccess: (biller, amt, ref, bal) =>
      `Eretua ${biller} kaw no akɔ korɔgyen! Cedis ${amt.toFixed(2)} akɔ. Sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    cashOutReview: (agent, amt, fee, total) =>
      `Yɛserɛ wo tsie yie: Eregye Ghana cedis ${amt.toFixed(2)} efi agent ${agent} hɔ. MoMo kaw nye ${fee.toFixed(2)} cedis, ne nyinaa nye ${total.toFixed(2)} cedis.`,
    cashOutSuccess: (agent, amt, ref, bal) =>
      `Woagye sika no akɔ korɔgyen! Cedis ${amt.toFixed(2)} efi agent ${agent}. Sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    biometricPrompt: (momoName, total) =>
      `Dze wo nsateaa to do ma yɛmpene cedis ${total.toFixed(2)} a erima ${momoName} no do. Yɛnntwe MoMo PIN nnto abɔntsen.`,
    success: (rec, amt, ref, bal) =>
      `Wo sika no akɔ korɔgyen! Emene Ghana cedis ${amt.toFixed(2)} akɔma ${rec}. Nkyerɛwee nɔmba yɛ ${ref.slice(0, 8)}. Sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    cancel: 'Yatwe adze no asan. Sika biara emmfi wo kɔnta mu.',
    error: (msg) => `Adwuma no antum annkɔ. ${msg}. Wo sika da ho hyɛŋŋ.`,
    help: 'Itum ka: "Tɔ airtime", "Mene cedis eduonu kɔma Ama", "Tua bill", "Hwɛ mo sika", anaa "Gyaa".',
    repeat: 'Morosan aka asɛm no bio ama etsie.',
    welcomeUser: (name) => `Akwaaba, ${name}.`,
    askWhatToDo: 'Ebɛn adze na epɛ dɛ eyɛ?',
    biometricPrerequisite: "Ansaana yɛbɛmene sika no, ma yɛnsiesie wo nsateaa anaa w'enyiwa nhwɛmu.",
    askRecipientTarget: 'Woana na epɛ dɛ emene sika kɔma no? Ka dzin efi wo contacts mu, anaa ka nɔmba no.',
    contactsPermissionPrePrompt: (name) =>
      `Sɛ morokɔhwehwɛ ${name} a, ɔwɔ dɛ mekan wo contacts. Motum akenkan nko ara, minntum nnsesa hwee. Wo fon bɛbisa kwan sesei. Mia Allow do.`,
    contactsPermissionDenied: 'Hwee nnyi mu. Yɛserɛ wo ka nɔmba no mmom.',
    contactNotFound: (name) => `Mannya ${name} wɔ wo contacts mu. Yɛserɛ wo ka nɔmba no.`,
    contactMultipleFound: (name, listStr) => `Manya contacts pii ma ${name}: ${listStr}. Woana na epɛ?`,
    confirmContactNumber: (name, phone) => `Manya ${name} a ne nɔmba yɛ ${phone}. Saa nɔmba yi yɛ pɛ?`,
    confirmSpokenNumber: (phone) => `Ekaa dɛ ${phone}. Ɔyɛ nokwar?`,
    registeredNameCrossCheck: (name) => `Saa nɔmba yi dzin a ɔda do pɛpɛɛpɛ nye ${name}. Ɔyɛ nokwar?`,
    invalidRecipient: 'Saa nɔmba yi nnyɛ pɛ wɔ MTN MoMo do. Yɛserɛ wo ka dzin fofor anaa nɔmba fofor.',
    quoteReview: (name, phone, amt, fee, total) =>
      `Erima Ghana cedis ${amt.toFixed(2)} akɔ ${name}, nɔmba ${phone}. MoMo kaw nye ${fee.toFixed(2)} cedis, ne nyinara nye ${total.toFixed(2)} cedis. Ka dɛ nyew sɛ epene do, anaa gyaa.`,
    biometricSensorGuide: (method) =>
      method === 'face' ? 'Hwɛ kamera no mu de agye do.' : 'Dze wo nsateaa to sensor do de agye do.',
    anythingElse: 'Epɛ dɛ eyɛ biribi fofor bio?',
    goodbye: 'Nante yie. Yɛda wo ase wɔ MTN MoMo nka mu.',
    silenceReprompt: 'Ewɔ hɔ? Yɛserɛ wo kasa, anaa ka dɛ gyaa.',
    silenceTimeout: 'Minntsiee biribiara. Moroto dwuma no mu ama wo kɔnta abɔ ban. Nante yie.',
    slowerNotice: 'Morokasa brɛoo sesei.',
    quickPrompts: [
      { label: 'Tɔ Airtime 10', text: 'Tɔ airtime cedis du' },
      { label: 'Mene 20 kɔma Ama', text: 'Mene cedis eduonu kɔma Ama' },
      { label: 'Tua ECG 50', text: 'Tua ECG bill cedis eduanan' },
      { label: 'Hwɛ mo sika', text: 'Hwɛ mo sika' },
    ],
  },
  ewe: {
    welcome: 'Woezɔ va MTN MoMo me. Àte ŋu agblɔ: "Ƒle kadodo cedi ewo", "Ɖo cedi blaeve na Ama", "Xe ECG fe", "Ɖe ga le agent gbɔ", alo "Kpɔ nye ga me".',
    balance: (amt) => `Wò MTN MoMo ga si le asiwò nye Ghana cedi ${amt.toFixed(2)}.`,
    askRecipient: (amt) =>
      amt
        ? `Ame kae nèdi be yeaɖo Ghana cedi ${amt} na? Àte ŋu agblɔ ame la ƒe ŋkɔ alo eƒe fɔŋ nɔmba.`
        : 'Ame kae nèdi be yeaɖo ga na? Àte ŋu agblɔ ame la ƒe ŋkɔ alo eƒe fɔŋ nɔmba.',
    askPhoneNumber: (name) =>
      name
        ? `${name} ƒe fɔŋ nɔmba la nye ka? Àte ŋu agblɔ nɔmba ewó la.`
        : 'Taflatse gblɔ MoMo fɔŋ nɔmba ewó la.',
    askAmount: (rec) =>
      rec ? `Ga cedi nenie nèdi be yeaɖo na ${rec}?` : 'Ghana cedi nenie nèdi be yeaɖo?',
    review: (momoName, phone, amt, fee, total) =>
      `Taflatse se nya sia nyuie: Èle Ghana cedi ${amt.toFixed(2)} ɖom na fɔŋ nɔmba ${phone}. Efe MTN MoMo ŋkɔ si le edzi tututu nye ${momoName}. MoMo fe nye ${fee.toFixed(2)} cedis, katã nye ${total.toFixed(2)} cedis. Gblɔ be "Eẽ" ne nàtsɔ wò asibidɛ alɔ̃ ɖe edzi, alo gblɔ be "Tɔe".`,
    airtimeReview: (phone, amt) =>
      `Taflatse se nya sia nyuie: Èle cedi ${amt.toFixed(2)} kadodo ƒlem na fɔŋ ${phone}. Fe aɖeke mele edzi o. Gblɔ be "Eẽ" ne nàtsɔ wò asibidɛ alɔ̃ ɖe edzi.`,
    airtimeSuccess: (phone, amt, ref, bal) =>
      `Kadodo ƒleƒle dze edzi! Cedi ${amt.toFixed(2)} kadodo le fɔŋ ${phone} dzi azɔ. Wò ga susɔe nye cedi ${bal.toFixed(2)}.`,
    billReview: (biller, amt) =>
      `Taflatse se nya sia nyuie: Èle cedi ${amt.toFixed(2)} xem na ${biller}. Gblɔ be "Eẽ" ne nàtsɔ wò asibidɛ alɔ̃ ɖe edzi.`,
    billSuccess: (biller, amt, ref, bal) =>
      `Fexexe na ${biller} dze edzi nyuie! Cedi ${amt.toFixed(2)} dzo. Wò ga susɔe nye cedi ${bal.toFixed(2)}.`,
    cashOutReview: (agent, amt, fee, total) =>
      `Taflatse se nya sia nyuie: Èle cedi ${amt.toFixed(2)} ɖem le agent ${agent} gbɔ. Fe nye ${fee.toFixed(2)} cedis, katã nye ${total.toFixed(2)} cedis.`,
    cashOutSuccess: (agent, amt, ref, bal) =>
      `Gatsɔtsɔ dze edzi! Cedi ${amt.toFixed(2)} le agent ${agent} gbɔ. Wò ga susɔe nye cedi ${bal.toFixed(2)}.`,
    biometricPrompt: (momoName, total) =>
      `Tsɔ wò asibidɛ da ɖe mɔ̃a dzi be yealɔ̃ ɖe cedi ${total.toFixed(2)} nina ${momoName} dzi. MoMo PIN mele gbeɖiɖi me o.`,
    success: (rec, amt, ref, bal) =>
      `Wò MoMo ga la dze edzi nyuie! Èɖo Ghana cedi ${amt.toFixed(2)} na ${rec}. Reference nye ${ref.slice(0, 8)}. Wò ga susɔe nye cedi ${bal.toFixed(2)}.`,
    cancel: 'Wotɔ gadɔdɔ la. Ga aɖeke medzo le wò akɔnta me o.',
    error: (msg) => `Gadɔdɔ la mete ŋu dze edzi o. ${msg}. Wò ga le asiwò pɛpɛɛpɛ.`,
    help: 'Àte ŋu agblɔ: "Ƒle kadodo cedi ewo", "Ɖo cedi blaeve na Ama", "Xe ECG fe", "Kpɔ nye ga me", alo "Tɔe".',
    repeat: 'Megbugbɔ gbeɖiɖi la gblɔ na wò.',
    welcomeUser: (name) => `Woezɔ, ${name}.`,
    askWhatToDo: 'Nu kae nèdi be yeawo?',
    biometricPrerequisite: 'Hafi míaɖo ga la, na míasɔ wò asibidɛ alo wò ŋkumekpɔkpɔ ɖo.',
    askRecipientTarget: 'Ame kae nèdi be yeaɖo ga na? Gblɔ ŋkɔ le wò contacts me, alo gblɔ nɔmba la.',
    contactsPermissionPrePrompt: (name) =>
      `Be makpɔ ${name} la, ehiã be maxlẽ wò contacts. Mate ŋu axlẽe ko, nyemate ŋu atrɔ naneke o. Wò fɔŋ abia mɔ seesei. Mia Allow dzi zi eve.`,
    contactsPermissionDenied: 'Nya aɖeke mele eme o. Taflatse gblɔ nɔmba la teƒe.',
    contactNotFound: (name) => `Nyemekpɔ ${name} le wò contacts me o. Taflatse gblɔ nɔmba la.`,
    contactMultipleFound: (name, listStr) => `Mekpɔ contacts gbogbo na ${name}: ${listStr}. Ka nèdi?`,
    confirmContactNumber: (name, phone) => `Mekpɔ ${name} kple nɔmba ${phone}. Nɔmba sia sɔa?`,
    confirmSpokenNumber: (phone) => `Ègblɔ be ${phone}. Ɛnyo pɛpɛɛpɛa?`,
    registeredNameCrossCheck: (name) => `Nɔmba sia le ${name} ƒe ŋkɔ me. Ɛnyoa?`,
    invalidRecipient: 'Nɔmba sia mele MTN MoMo dzi o. Taflatse gblɔ ŋkɔ alo nɔmba bubu.',
    quoteReview: (name, phone, amt, fee, total) =>
      `Èle Ghana cedi ${amt.toFixed(2)} ɖom na ${name}, nɔmba ${phone}. MoMo fe nye ${fee.toFixed(2)} cedis, katã nye ${total.toFixed(2)} cedis. Gblɔ be Eẽ ne nèlɔ̃ ɖe edzi, alo gblɔ be Tɔe.`,
    biometricSensorGuide: (method) =>
      method === 'face' ? 'Kpɔ mɔ̃a ƒe kamera me be yealɔ̃ ɖe edzi.' : 'Tsɔ wò asibidɛ da ɖe mɔ̃a dzi be yealɔ̃ ɖe edzi.',
    anythingElse: 'Èdi be yeawɔ nu bubu aɖea?',
    goodbye: 'Hede nyuie. Míeda akpe na wò le MTN MoMo zaza ta.',
    silenceReprompt: 'Ègale afima? Taflatse gblɔ nya, alo gblɔ be tɔe.',
    silenceTimeout: 'Nyemese nya aɖeke o. Mele dɔa tɔm be mabɔ akɔnta ta. Hede nyuie.',
    slowerNotice: 'Mele nu ƒom blewu azɔ.',
    quickPrompts: [
      { label: 'Ƒle kadodo 10', text: 'Ƒle kadodo cedi ewo' },
      { label: 'Ɖo 20 na Ama', text: 'Ɖo cedi blaeve na Ama' },
      { label: 'Xe ECG 50', text: 'Xe ECG fe cedi blaatɔ̃' },
      { label: 'Kpɔ nye ga me', text: 'Kpɔ nye ga me' },
    ],
  },
  ga: {
    welcome: 'Atuu kɛba MTN MoMo gbee yelikɛbua lii amli. Oobaanyɛ okɛɛ: "Hé airtime cedi nyɔŋma", "Kɛ cedi nyɔŋmai enyɔ maje Ama", "Wo ECG nyɛmɔ", "Tsi shika", aloo "Kwɛmɔ mishika".',
    balance: (amt) => `Omishi MTN MoMo shika ji Ghana cedi ${amt.toFixed(2)}.`,
    askRecipient: (amt) =>
      amt
        ? `Namɔ oosumɔ ni okɛ Ghana cedi ${amt} amaje? Oobaanyɛ okɛɛ egbɛi aloo efon nɔmba.`
        : 'Namɔ oosumɔ ni okɛ shika amaje? Oobaanyɛ okɛɛ egbɛi aloo efon nɔmba.',
    askPhoneNumber: (name) =>
      name
        ? `${name} fon nɔmba ji enyiɛ? Oobaanyɛ okɛɛ nɔmba nyɔŋma lɛ.`
        : 'Ofainɛ ka MoMo fon nɔmba nyɔŋma lɛ.',
    askAmount: (rec) =>
      rec ? `Shika enyiɛ oosumɔ ni okɛ amaje ${rec}?` : 'Ghana cedi enyiɛ oosumɔ ni omaje?',
    review: (momoName, phone, amt, fee, total) =>
      `Ofainɛ bo toi jogbaŋŋ: Okɛ Ghana cedi ${amt.toFixed(2)} yaaha fon nɔmba ${phone}. E-MTN MoMo gbɛi diɛŋtsɛ ji ${momoName}. MoMo hetoo ji ${fee.toFixed(2)} cedis, fɛɛ feɔ ${total.toFixed(2)} cedis. Kɛɛ "Hɛɛ" ni okɛ oninɛbii atswa nɔ, aloo "Kpa".`,
    airtimeReview: (phone, amt) =>
      `Ofainɛ bo toi jogbaŋŋ: Ohé Ghana cedi ${amt.toFixed(2)} airtime kɛha fon ${phone}. Too eko bɛ. Kɛɛ "Hɛɛ" ni okɛ oninɛbii atswa nɔ.`,
    airtimeSuccess: (phone, amt, ref, bal) =>
      `Airtime hélɛ etee jogbaŋŋ! Cedi ${amt.toFixed(2)} eyashɛ fon ${phone} nɔ. Oshika ni eshwɛ ji cedi ${bal.toFixed(2)}.`,
    billReview: (biller, amt) =>
      `Ofainɛ bo toi jogbaŋŋ: Owo Ghana cedi ${amt.toFixed(2)} kɛha ${biller}. Kɛɛ "Hɛɛ" ni okɛ oninɛbii atswa nɔ.`,
    billSuccess: (biller, amt, ref, bal) =>
      `Owo ${biller} nyɛmɔ lɛ jogbaŋŋ! Cedi ${amt.toFixed(2)} etee. Oshika ni eshwɛ ji cedi ${bal.toFixed(2)}.`,
    cashOutReview: (agent, amt, fee, total) =>
      `Ofainɛ bo toi jogbaŋŋ: Otsi Ghana cedi ${amt.toFixed(2)} kɛjɛ agent ${agent} ŋɔɔ. Hetoo ji ${fee.toFixed(2)} cedis, fɛɛ ji ${total.toFixed(2)} cedis.`,
    cashOutSuccess: (agent, amt, ref, bal) =>
      `Shikatsiilɛ etee jogbaŋŋ! Cedi ${amt.toFixed(2)} kɛjɛ agent ${agent} ŋɔɔ. Oshika ni eshwɛ ji cedi ${bal.toFixed(2)}.`,
    biometricPrompt: (momoName, total) =>
      `Kɛ oninɛbii tswa nɔ koni okpɛlɛ cedi ${total.toFixed(2)} ni oyaha ${momoName} lɛ nɔ. MoMo PIN kɛ gbee eko bɛ.`,
    success: (rec, amt, ref, bal) =>
      `Oshika lɛ etee jogbaŋŋ! Okɛ Ghana cedi ${amt.toFixed(2)} emaje ${rec}. Nɔmba ji ${ref.slice(0, 8)}. Oshika ni eshwɛ ji cedi ${bal.toFixed(2)}.`,
    cancel: 'Watsĩ gbɛjianɔtoo lɛ nɔ. Shika ko bɛ ni eje o-akɔntaa lɛ mli.',
    error: (msg) => `Gbɛjianɔtoo lɛ nya etsɛɛ. ${msg}. Oshika yɛ he ko he ko.`,
    help: 'Oobaanyɛ okɛɛ: "Hé airtime", "Kɛ cedi nyɔŋmai enyɔ maje Ama", "Wo ECG nyɛmɔ", "Kwɛmɔ mishika", aloo "Kpa".',
    repeat: 'Mikɛɛ nɔ ni mikɛɛ tsutsu lɛ ekoŋŋ.',
    welcomeUser: (name) => `Atuu, ${name}.`,
    askWhatToDo: 'Mɛni oosumɔ ni ofee?',
    biometricPrerequisite: 'Dani wɔɔmaje shika lɛ, nyɛfea gbɛjianɔ kɛha oninɛbii aloo ohiɛ.',
    askRecipientTarget: 'Namɔ oosumɔ ni okɛ shika amaje? Tsɛɔ gbɛi yɛ o-contacts mli, aloo ka nɔmba lɛ.',
    contactsPermissionPrePrompt: (name) =>
      `Koni matao ${name} lɛ, ehe miihia ni makane o-contacts. Matumi makane pɛ, minyɛɛɛ matsake nɔ ko. O-fon lɛ baabi hegbɛ amrɔ nɛɛ. Tswa Allow nɔ enyɔ.`,
    contactsPermissionDenied: 'Nɔ ko bɛ mli. Ofainɛ ka nɔmba lɛ momo.',
    contactNotFound: (name) => `Minaaa ${name} yɛ o-contacts amli. Ofainɛ ka nɔmba lɛ.`,
    contactMultipleFound: (name, listStr) => `Mina contacts babaoo kɛha ${name}: ${listStr}. Te nɔ ni oosumɔ?`,
    confirmContactNumber: (name, phone) => `Mina ${name} kɛ nɔmba ${phone}. Nɔmba nɛɛ ja?`,
    confirmSpokenNumber: (phone) => `Okɛɛ akɛ ${phone}. Eja?`,
    registeredNameCrossCheck: (name) => `Nɔmba nɛɛ gbɛi ni yɔɔ nɔ ji ${name}. Eja?`,
    invalidRecipient: 'Nɔmba nɛɛ bɛ MTN MoMo nɔ. Ofainɛ ka gbɛi kroko aloo nɔmba kroko.',
    quoteReview: (name, phone, amt, fee, total) =>
      `Okɛ Ghana cedi ${amt.toFixed(2)} yaaha ${name}, nɔmba ${phone}. MoMo hetoo ji ${fee.toFixed(2)} cedis, fɛɛ ji ${total.toFixed(2)} cedis. Kɛɛ Hɛɛ kɛji okpɛlɛ nɔ, aloo Kpa.`,
    biometricSensorGuide: (method) =>
      method === 'face' ? 'Kwɛmɔ mɔ̃a kamera lɛ mli de okpɛlɛ nɔ.' : 'Kɛ oninɛbii tswa sensor lɛ nɔ de okpɛlɛ nɔ.',
    anythingElse: 'Oosumɔ ni ofee nɔ kroko bio?',
    goodbye: 'Yaa jogbaŋŋ. Oyiwaladɔŋŋ kɛha MTN MoMo.',
    silenceReprompt: 'Oyɛ jɛmɛ lolo? Ofainɛ wiemɔ, aloo kɛɛ kpa.',
    silenceTimeout: 'Minuuu nɔ ko nɔ ko. Miitsĩ kɔntaa lɛ nya amrɔ nɛɛ. Yaa jogbaŋŋ.',
    slowerNotice: 'Miibaanyɛ mawiemɔ bleoo amrɔ nɛɛ.',
    quickPrompts: [
      { label: 'Hé Airtime 10', text: 'Hé airtime cedi nyɔŋma' },
      { label: 'Maje 20 kɛha Ama', text: 'Kɛ cedi nyɔŋmai enyɔ maje Ama' },
      { label: 'Wo ECG 50', text: 'Wo ECG nyɛmɔ cedi nyɔŋmai enumɔ' },
      { label: 'Kwɛmɔ mishika', text: 'Kwɛmɔ mishika' },
    ],
  },
  dagbani: {
    welcome: 'Ansaraŋba kpa MTN MoMo kukoli sɔŋsim polo. A ni too yeli: "Daɣim airtime cedi pia", "Timi Ama Ghana cedi pishi", "Yo ECG samli", "Yi laɣifu", bee "Nyama n laɣifu".',
    balance: (amt) => `A MTN MoMo laɣifu din be dini nyɛla Ghana cedi ${amt.toFixed(2)}.`,
    askRecipient: (amt) =>
      amt
        ? `Ŋuni ka a bɔri ni a ti Ghana cedi ${amt}? A ni too yeli o yuli bee o salima nɔmba.`
        : 'Ŋuni ka a bɔri ni a ti laɣifu? A ni too yeli o yuli bee o salima nɔmba.',
    askPhoneNumber: (name) =>
      name
        ? `${name} salima nɔmba nyɛla dinli? A ni too bolim nɔmba pia maa.`
        : 'M-paɣa bolim MoMo salima nɔmba pia maa.',
    askAmount: (rec) =>
      rec ? `Laɣifu zilinli ka a bɔri ni a ti ${rec}?` : 'Ghana cedi zilinli ka a bɔri ni a ti?',
    review: (momoName, phone, amt, fee, total) =>
      `Wum maŋa viɛnyɛla: A ti Ghana cedi ${amt.toFixed(2)} n-chaŋ salima nɔmba ${phone} polo. O MTN MoMo yuli kpalinkpaa nyɛla ${momoName}. MoMo laɣidiri nyɛla ${fee.toFixed(2)} cedis, zaa laɣim nyɛla ${total.toFixed(2)} cedis. Yelim "Iyi" ka zaŋ a nuu kpɛhi bɔɣu, bee "Chɛli".`,
    airtimeReview: (phone, amt) =>
      `Wum maŋa viɛnyɛla: A daɣim Ghana cedi ${amt.toFixed(2)} airtime n-ti fon ${phone}. Laɣidiri bi yi shɛli. Yelim "Iyi" ka zaŋ nuu kpɛhi bɔɣu.`,
    airtimeSuccess: (phone, amt, ref, bal) =>
      `Airtime daaŋo chaŋ viɛnyɛla! Cedi ${amt.toFixed(2)} airtime kpe fon ${phone} puuni. A laɣifu din kpalim nyɛla cedi ${bal.toFixed(2)}.`,
    billReview: (biller, amt) =>
      `Wum maŋa viɛnyɛla: A yoli Ghana cedi ${amt.toFixed(2)} n-ti ${biller}. Yelim "Iyi" ka zaŋ a nuu kpɛhi bɔɣu.`,
    billSuccess: (biller, amt, ref, bal) =>
      `Sam yɔbu chaŋ viɛnyɛla! A yo ${biller} cedi ${amt.toFixed(2)}. A laɣifu din kpalim nyɛla cedi ${bal.toFixed(2)}.`,
    cashOutReview: (agent, amt, fee, total) =>
      `Wum maŋa viɛnyɛla: A yihi Ghana cedi ${amt.toFixed(2)} agent ${agent} sani. MoMo fee nyɛla ${fee.toFixed(2)} cedis, zaa nyɛla ${total.toFixed(2)} cedis.`,
    cashOutSuccess: (agent, amt, ref, bal) =>
      `Laɣifu yihibu chaŋ viɛnyɛla! Cedi ${amt.toFixed(2)} yi agent ${agent} sani. A laɣifu din kpalim nyɛla cedi ${bal.toFixed(2)}.`,
    biometricPrompt: (momoName, total) =>
      `Zaŋ a nuu kpɛhi bɔɣu ni a saɣi ti cedi ${total.toFixed(2)} n-ti ${momoName}. MoMo PIN ku yeli zaa polo.`,
    success: (rec, amt, ref, bal) =>
      `A laɣifu ti n-chaŋ viɛnyɛla! A ti ${rec} Ghana cedi ${amt.toFixed(2)}. Tɔɣisi nɔmba nyɛla ${ref.slice(0, 8)}. A laɣifu din kpalim nyɛla cedi ${bal.toFixed(2)}.`,
    cancel: 'Di bi lahi chaŋ. Laɣifu shɛli bi yi a laɣifu puuni.',
    error: (msg) => `Di bi too chaŋ. ${msg}. A laɣifu kpalim viɛnyɛla.`,
    help: 'A ni too yeli: "Daɣim airtime", "Timi Ama cedi pishi", "Yo ECG samli", "Nyama n laɣifu", bee "Chɛli".',
    repeat: 'N lahi labi yeli din gari maŋa.',
    welcomeUser: (name) => `Ansaraŋba, ${name}.`,
    askWhatToDo: 'Bo ka a bɔri ni a niŋ?',
    biometricPrerequisite: 'Pɔi ka ti zaŋ laɣifu n-ti, maali a nuu bee a nina kpalinkpaa.',
    askRecipientTarget: 'Ŋuni ka a bɔri ni a ti laɣifu? Bolim yuli din be a contacts puuni, bee bolim nɔmba maa.',
    contactsPermissionPrePrompt: (name) =>
      `Ni n-nya ${name}, di bɔrimi ni n-karim a contacts. N ni too karim pɛpɛɛpɛ, m ku too taɣi shɛli. A fon maa ni bɔhi soli pumpɔŋɔ. Kpɛhim Allow siɣim buyi.`,
    contactsPermissionDenied: 'Yɛla bi gbaai. M-paɣa bolim nɔmba maa.',
    contactNotFound: (name) => `M bi nya ${name} a contacts puuni. M-paɣa bolim nɔmba maa.`,
    contactMultipleFound: (name, listStr) => `M nya contacts pam zaŋ kpa ${name}: ${listStr}. Dinli ka a bɔra?`,
    confirmContactNumber: (name, phone) => `M nya ${name} ka o nɔmba nyɛ ${phone}. Nɔmba ŋɔ niŋ viɛnyɛla?`,
    confirmSpokenNumber: (phone) => `A yeliya ni ${phone}. Di niŋ tabata?`,
    registeredNameCrossCheck: (name) => `Salima nɔmba ŋɔ yuli kpalinkpaa nyɛla ${name}. Di niŋ tabata?`,
    invalidRecipient: 'Salima nɔmba ŋɔ kani MTN MoMo zuɣu. Bolim yuli bee nɔmba palli.',
    quoteReview: (name, phone, amt, fee, total) =>
      `A ti Ghana cedi ${amt.toFixed(2)} n-ti ${name}, nɔmba ${phone}. MoMo laɣidiri nyɛla ${fee.toFixed(2)} cedis, zaa nyɛla ${total.toFixed(2)} cedis. Yelim Iyi ni a saɣi, bee Chɛli.`,
    biometricSensorGuide: (method) =>
      method === 'face' ? 'Lihi kamera maa ni a saɣi.' : 'Zaŋ a nuu kpɛhi sensor maa ni a saɣi.',
    anythingElse: 'A bɔri ni a lahi niŋ shɛli?',
    goodbye: 'Nante yie. Ti paɣiya ni a zaŋ MTN MoMo tum tuma.',
    silenceReprompt: 'A na be nimaani? Yɛlima, bee yelim chɛli.',
    silenceTimeout: 'M bi wum shɛli. N kpaŋsi laɣifu gbubirili pumpɔŋɔ. Nante yie.',
    slowerNotice: 'N yɛri baŋkpoo pumpɔŋɔ.',
    quickPrompts: [
      { label: 'Daɣim Airtime 10', text: 'Daɣim airtime cedi pia' },
      { label: 'Timi 20 Ama', text: 'Timi Ama Ghana cedi pishi' },
      { label: 'Yo ECG 50', text: 'Yo ECG samli cedi pihinu' },
      { label: 'Nyama n laɣifu', text: 'Nyama n laɣifu' },
    ],
  },
  hausa: {
    welcome: 'Barka da zuwa MTN MoMo. Za ka iya cewa: "Sayi katin waya cedis goma", "Aika kudi cedis ashirin zuwa Ama", "Biya kudin ECG cedis hamsin", "Cire kudi cedis hamsin", ko "Duba kudi na".',
    balance: (amt) => `Kudin ka da ke cikin MTN MoMo asusun ka shine Ghana cedis ${amt.toFixed(2)}.`,
    askRecipient: (amt) =>
      amt
        ? `Wa kake so ka aika wa Ghana cedis ${amt}? Za ka iya fadi sunan mutum ko lambar wayarsa.`
        : 'Wa kake so ka aika wa kudi? Fadi sunan sa ko lambar wayarsa.',
    askPhoneNumber: (name) =>
      name
        ? `Menene lambar wayar ${name}? Fadi lambobi goman kamar "0244123456".`
        : 'Don Allah fadi lambar wayar MoMo goman.',
    askAmount: (rec) =>
      rec ? `Cedis nawa kake so ka tura wa ${rec}?` : 'Ghana cedis nawa kake so ka aika?',
    review: (momoName, phone, amt, fee, total) =>
      `Don Allah saurara da kyau: Kana tura Ghana cedis ${amt.toFixed(2)} zuwa lambar waya ${phone}. Sunan da ke rajista a MTN MoMo shine ${momoName}. Kudin aikawa shine cedis ${fee.toFixed(2)}, jimilla shine cedis ${total.toFixed(2)}. Ka ce "Eh" don amincewa da yatsanka, ko ka ce "A'a".`,
    airtimeReview: (phone, amt) =>
      `Don Allah tabbatar: Kana sayen katin waya na Ghana cedis ${amt.toFixed(2)} don lambar ${phone}. Babu kudin karba. Ka ce "Eh" don amincewa da yatsanka, ko "A'a".`,
    airtimeSuccess: (phone, amt, ref, bal) =>
      `Sayen katin waya ya yi nasara! An tura cedis ${amt.toFixed(2)} katin waya zuwa ${phone}. Ragowar kudin ka shine cedis ${bal.toFixed(2)}.`,
    billReview: (biller, amt) =>
      `Don Allah tabbatar: Kana biyan Ghana cedis ${amt.toFixed(2)} zuwa ${biller}. Ka ce "Eh" don amincewa da yatsanka, ko "A'a".`,
    billSuccess: (biller, amt, ref, bal) =>
      `Biyan kudin ${biller} ya yi nasara! Cedis ${amt.toFixed(2)} ya tafi. Ragowar kudin ka shine cedis ${bal.toFixed(2)}.`,
    cashOutReview: (agent, amt, fee, total) =>
      `Don Allah tabbatar: Kana cire Ghana cedis ${amt.toFixed(2)} a wajen wakili ${agent}. Kudin cirewa shine cedis ${fee.toFixed(2)}, jimilla shine cedis ${total.toFixed(2)}. Ka ce "Eh" don amincewa.`,
    cashOutSuccess: (agent, amt, ref, bal) =>
      `Cire kudi ya yi nasara! Cedis ${amt.toFixed(2)} daga wakili ${agent}. Ragowar kudin ka shine cedis ${bal.toFixed(2)}.`,
    biometricPrompt: (momoName, total) =>
      `Danna yatsanka a kan na'urar don tabbatar da tura cedis ${total.toFixed(2)} zuwa ${momoName}. Ba a fadin lambar PIN a fili.`,
    success: (rec, amt, ref, bal) =>
      `Kudin ka ya tafi lafiya! Ka aika Ghana cedis ${amt.toFixed(2)} zuwa ${rec}. Lambar shaida ${ref.slice(0, 8)}. Ragowar kudin ka shine cedis ${bal.toFixed(2)}.`,
    cancel: 'An soke aikin. Babu kudi da aka cire daga asusun ka.',
    error: (msg) => `Aikin bai samu nasara ba. ${msg}. Kudin ka yana nan lafiya.`,
    help: 'Za ka iya cewa: "Sayi katin waya cedis goma", "Aika kudi cedis ashirin zuwa Ama", "Biya kudin ECG", "Cire kudi", "Duba kudi na", ko "Soke".',
    repeat: 'Ina sake maimaita bayanin karshe.',
    welcomeUser: (name) => `Barka da zuwa, ${name}.`,
    askWhatToDo: 'Menene kake so ka yi?',
    biometricPrerequisite: 'Kafin mu aika kudi, bari mu saita yatsanka ko fuskarka.',
    askRecipientTarget: 'Wa kake so ka aika wa kudi? Fadi suna daga contacts dinka, ko ka fadi lambar waya.',
    contactsPermissionPrePrompt: (name) =>
      `Don nemo ${name}, ina bukatar duba contacts dinka. Zan iya karantawa kawai, ba zan iya canzawa ba. Wayarka za ta nemi izini yanzu. Danna Allow sau biyu.`,
    contactsPermissionDenied: 'Babu matsala. Don Allah fadi lambar wayar kawai.',
    contactNotFound: (name) => `Ban sami ${name} a cikin contacts dinka ba. Don Allah fadi lambar wayar.`,
    contactMultipleFound: (name, listStr) => `Na sami contacts da dama na ${name}: ${listStr}. Wanne kake so?`,
    confirmContactNumber: (name, phone) => `Na sami ${name} tare da lambar waya ${phone}. Wannan lambar daidai ce?`,
    confirmSpokenNumber: (phone) => `Ka ce ${phone}. Hakan daidai ne?`,
    registeredNameCrossCheck: (name) => `Wannan lambar tana da rijista da sunan ${name}. Hakan daidai ne?`,
    invalidRecipient: 'Wannan lambar ba ta da rijista a MTN MoMo. Don Allah fadi sabon suna ko lamba.',
    quoteReview: (name, phone, amt, fee, total) =>
      `Kana tura Ghana cedis ${amt.toFixed(2)} zuwa ${name}, lambar ${phone}. Kudin aikawa shine ${fee.toFixed(2)} cedis, jimilla ${total.toFixed(2)} cedis. Ka ce Eh idan ka amince, ko Soke.`,
    biometricSensorGuide: (method) =>
      method === 'face' ? 'Kalli kyamara don tabbatarwa.' : 'Sanya yatsanka a kan naurar don tabbatarwa.',
    anythingElse: 'Kana so ka yi wani abu kuma?',
    goodbye: 'Sai an jima. Mungode da amfani da MTN MoMo.',
    silenceReprompt: 'Kuna nan? Don Allah fadi magana, ko ka ce soke.',
    silenceTimeout: 'Ban ji komai ba. Ina rufe asusun don tsaro. Sai an jima.',
    slowerNotice: 'Ina magana a hankali yanzu.',
    quickPrompts: [
      { label: 'Sayi Katin 10', text: 'Sayi katin waya cedis goma' },
      { label: 'Tura 20 ga Ama', text: 'Aika kudi cedis ashirin zuwa Ama' },
      { label: 'Biya ECG 50', text: 'Biya kudin ECG cedis hamsin' },
      { label: 'Duba Kudi', text: 'Duba kudi na' },
    ],
  },
  krachi: {
    welcome: 'Mo ba MTN MoMo nka mu. Fɔ bɛtɔmi bɛka dɛ: "Tɔ airtime cedis idu", "Mene cedis aduɔnyɔ kɔma Ama", "Tua ECG bill cedis aduɔnoo", "Gye sika cedis aduɔnoo", anaa "Kere me sika".',
    balance: (amt) => `Wo MTN MoMo sika a wɔ kɔnta mu yɛ Ghana cedis ${amt.toFixed(2)}.`,
    askRecipient: (amt) =>
      amt
        ? `Wanyi na fɔ pɛ dɛ fɔ mene Ghana cedis ${amt} kɔma mɔ? Fɔ bɛtɔmi bɛka mɔ yin anaa mɔ fon nɔmba.`
        : 'Wanyi na fɔ pɛ dɛ fɔ mene sika kɔma mɔ? Ka mɔ yin anaa mɔ fon nɔmba.',
    askPhoneNumber: (name) =>
      name
        ? `${name} fon nɔmba yɛ ahe? Ka nɔmba idu no.`
        : 'Yɛsrɛ fɔ ka MoMo fon nɔmba idu no.',
    askAmount: (rec) =>
      rec ? `Sika ahe na fɔ pɛ dɛ fɔ mene kɔma ${rec}?` : 'Ghana cedis ahe na fɔ pɛ dɛ fɔ mene?',
    review: (momoName, phone, amt, fee, total) =>
      `Tsie yie: Fɔ de Ghana cedis ${amt.toFixed(2)} rekɔma fon nɔmba ${phone}. Ne MTN MoMo yin a ɛda do yɛ ${momoName}. MoMo ntoboa yɛ ${fee.toFixed(2)} cedis, ne pɛpɛɛpɛ yɛ ${total.toFixed(2)} cedis. Ka dɛ "Ee" na fa fɔ nsateaa to afidie no do, anaa ka dɛ "Gyaa".`,
    airtimeReview: (phone, amt) =>
      `Tsie yie: Fɔ retɔ Ghana cedis ${amt.toFixed(2)} airtime ama fon ${phone}. Ntoboa biara nni ho. Ka dɛ "Ee" na fa nsateaa to do.`,
    airtimeSuccess: (phone, amt, ref, bal) =>
      `Fɔ atɔ airtime no pɛpɛɛpɛ! Ghana cedis ${amt.toFixed(2)} airtime akɔ fon ${phone} do. Sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    billReview: (biller, amt) =>
      `Tsie yie: Fɔ retua Ghana cedis ${amt.toFixed(2)} ama ${biller}. Ka dɛ "Ee" na fa nsateaa to do.`,
    billSuccess: (biller, amt, ref, bal) =>
      `Fɔ atua ${biller} bill no pɛpɛɛpɛ! Cedis ${amt.toFixed(2)} akɔ. Sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    cashOutReview: (agent, amt, fee, total) =>
      `Tsie yie: Fɔ regye Ghana cedis ${amt.toFixed(2)} afiri agent ${agent} nkyɛn. Ntoboa yɛ ${fee.toFixed(2)} cedis, ne pɛpɛɛpɛ yɛ ${total.toFixed(2)} cedis.`,
    cashOutSuccess: (agent, amt, ref, bal) =>
      `Fɔ agye sika no pɛpɛɛpɛ! Cedis ${amt.toFixed(2)} afiri agent ${agent}. Sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    biometricPrompt: (momoName, total) =>
      `Fa fɔ nsateaa to afidie no do de agye cedis ${total.toFixed(2)} a fɔ rekɔma ${momoName} no atom. MoMo PIN biara renka bagua mu.`,
    success: (rec, amt, ref, bal) =>
      `Wo sika no akɔ pɛpɛɛpɛ! Fɔ amene Ghana cedis ${amt.toFixed(2)} akɔma ${rec}. Reference nɔmba yɛ ${ref.slice(0, 8)}. Sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    cancel: 'Yatwa adwuma no mu. Sika biara mfiri wo kɔnta mu.',
    error: (msg) => `Adwuma no antumi ankɔ. ${msg}. Wo sika wɔ kɔnta mu pɛpɛɛpɛ.`,
    help: 'Fɔ bɛtɔmi bɛka: "Tɔ airtime cedis idu", "Mene cedis aduɔnyɔ kɔma Ama", "Tua ECG bill", "Gye sika", "Kere me sika", anaa "Gyaa".',
    repeat: 'Mesan ka asɛm no bio ma fɔ ate.',
    welcomeUser: (name) => `Mo ba, ${name}.`,
    askWhatToDo: 'Kɛbɛ na fɔ pɛ dɛ fɔ yo?',
    biometricPrerequisite: 'Ansa na yɛbɛmene sika no, ma yɛnsiesie fɔ nsateaa anaa fɔ anim.',
    askRecipientTarget: 'Wanyi na fɔ pɛ dɛ fɔ mene sika kɔma mɔ? Ka yin firi fɔ contacts mu, anaa ka nɔmba no.',
    contactsPermissionPrePrompt: (name) =>
      `Sɛ merekɔpɛ ${name} a, ehia dɛ mekenkan fɔ contacts. Metɔmi akenkan pɛ, mentɔmi nsesa kɛkɛɛ. Fɔ fon bɛbisa kwan siesie. Mia Allow do siɔnyɔ.`,
    contactsPermissionDenied: 'Hwee nni ho. Yɛsrɛ fɔ ka nɔmba no kɛkɛ.',
    contactNotFound: (name) => `Mannya ${name} wɔ fɔ contacts mu. Yɛsrɛ fɔ ka nɔmba no.`,
    contactMultipleFound: (name, listStr) => `Manya contacts dodo ma ${name}: ${listStr}. Wanyi na fɔ pɛ?`,
    confirmContactNumber: (name, phone) => `Manya ${name} a ne nɔmba yɛ ${phone}. Saa nɔmba yi yɛ pɛ?`,
    confirmSpokenNumber: (phone) => `Fɔ kae dɛ ${phone}. Ɛyɛ nokware?`,
    registeredNameCrossCheck: (name) => `Saa nɔmba yi yin a ɛda do yɛ ${name}. Ɛyɛ nokware?`,
    invalidRecipient: 'Saa nɔmba yi nni MTN MoMo do. Yɛsrɛ fɔ ka yin anaa nɔmba foforɔ.',
    quoteReview: (name, phone, amt, fee, total) =>
      `Fɔ de Ghana cedis ${amt.toFixed(2)} rekɔma ${name}, nɔmba ${phone}. MoMo ntoboa yɛ ${fee.toFixed(2)} cedis, ne pɛpɛɛpɛ yɛ ${total.toFixed(2)} cedis. Ka dɛ Ee sɛ fɔ pene do, anaa Gyaa.`,
    biometricSensorGuide: (method) =>
      method === 'face' ? 'Hwɛ kamera no mu de agye atom.' : 'Fa fɔ nsateaa to sensor no do de agye atom.',
    anythingElse: 'Fɔ pɛ dɛ fɔ yo biribi foforɔ bio?',
    goodbye: 'Nante yie. Yɛda fɔ ase wɔ MTN MoMo nka mu.',
    silenceReprompt: 'Fɔ wɔ do? Yɛsrɛ fɔ kasa, anaa ka dɛ gyaa.',
    silenceTimeout: 'Mante biribiara. Mereto adwuma no mu de abɔ fɔ kɔnta ho ban. Nante yie.',
    slowerNotice: 'Merekasa brɛoo siesie.',
    quickPrompts: [
      { label: 'Tɔ Airtime 10', text: 'Tɔ airtime cedis idu' },
      { label: 'Mene 20 kɔma Ama', text: 'Mene cedis aduɔnyɔ kɔma Ama' },
      { label: 'Tua ECG 50', text: 'Tua ECG bill cedis aduɔnoo' },
      { label: 'Kere me sika', text: 'Kere me sika' },
    ],
  },
  buem: {
    welcome: 'Mo ba MTN MoMo nka mu. Fɔ bɛtɔmi bɛka dɛ: "Tɔ airtime cedis lefu", "Mene cedis aduɔnyɔ kɔma Ama", "Tua ECG bill cedis aduɔnɔ", "Gye sika cedis aduɔnɔ", anaa "Kere me sika".',
    balance: (amt) => `Wo MTN MoMo sika a ɛwɔ kɔnta mu yɛ Ghana cedis ${amt.toFixed(2)}.`,
    askRecipient: (amt) =>
      amt
        ? `Wanyi na fɔ pɛ dɛ fɔ mene Ghana cedis ${amt} kɔma mɔ? Fɔ bɛtɔmi bɛka mɔ yin anaa mɔ fon nɔmba.`
        : 'Wanyi na fɔ pɛ dɛ fɔ mene sika kɔma mɔ? Ka mɔ yin anaa mɔ fon nɔmba.',
    askPhoneNumber: (name) =>
      name
        ? `${name} fon nɔmba yɛ ahe? Ka nɔmba lefu no.`
        : 'Yɛsrɛ fɔ ka MoMo fon nɔmba lefu no.',
    askAmount: (rec) =>
      rec ? `Sika ahe na fɔ pɛ dɛ fɔ mene kɔma ${rec}?` : 'Ghana cedis ahe na fɔ pɛ dɛ fɔ mene?',
    review: (momoName, phone, amt, fee, total) =>
      `Tsie yie: Fɔ de Ghana cedis ${amt.toFixed(2)} rekɔma fon nɔmba ${phone}. Ne MTN MoMo yin a ɛda do yɛ ${momoName}. MoMo ntoboa yɛ ${fee.toFixed(2)} cedis, ne pɛpɛɛpɛ yɛ ${total.toFixed(2)} cedis. Ka dɛ "Ee" na fa fɔ nsateaa to afidie no do, anaa ka dɛ "Gyaa".`,
    airtimeReview: (phone, amt) =>
      `Tsie yie: Fɔ retɔ Ghana cedis ${amt.toFixed(2)} airtime ama fon ${phone}. Ntoboa biara nni ho. Ka dɛ "Ee" na fa nsateaa to do.`,
    airtimeSuccess: (phone, amt, ref, bal) =>
      `Fɔ atɔ airtime no pɛpɛɛpɛ! Ghana cedis ${amt.toFixed(2)} airtime akɔ fon ${phone} do. Sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    billReview: (biller, amt) =>
      `Tsie yie: Fɔ retua Ghana cedis ${amt.toFixed(2)} ama ${biller}. Ka dɛ "Ee" na fa nsateaa to do.`,
    billSuccess: (biller, amt, ref, bal) =>
      `Fɔ atua ${biller} bill no pɛpɛɛpɛ! Cedis ${amt.toFixed(2)} akɔ. Sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    cashOutReview: (agent, amt, fee, total) =>
      `Tsie yie: Fɔ regye Ghana cedis ${amt.toFixed(2)} afiri agent ${agent} nkyɛn. Ntoboa yɛ ${fee.toFixed(2)} cedis, ne pɛpɛɛpɛ yɛ ${total.toFixed(2)} cedis.`,
    cashOutSuccess: (agent, amt, ref, bal) =>
      `Fɔ agye sika no pɛpɛɛpɛ! Cedis ${amt.toFixed(2)} afiri agent ${agent}. Sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    biometricPrompt: (momoName, total) =>
      `Fa fɔ nsateaa to afidie no do de agye cedis ${total.toFixed(2)} a fɔ rekɔma ${momoName} no atom. MoMo PIN biara renka bagua mu.`,
    success: (rec, amt, ref, bal) =>
      `Wo sika no akɔ pɛpɛɛpɛ! Fɔ amene Ghana cedis ${amt.toFixed(2)} akɔma ${rec}. Reference nɔmba yɛ ${ref.slice(0, 8)}. Sika a aka yɛ cedis ${bal.toFixed(2)}.`,
    cancel: 'Yatwa adwuma no mu. Sika biara mfiri wo kɔnta mu.',
    error: (msg) => `Adwuma no antumi ankɔ. ${msg}. Wo sika wɔ kɔnta mu pɛpɛɛpɛ.`,
    help: 'Fɔ bɛtɔmi bɛka: "Tɔ airtime cedis lefu", "Mene cedis aduɔnyɔ kɔma Ama", "Tua ECG bill", "Gye sika", "Kere me sika", anaa "Gyaa".',
    repeat: 'Mesan ka asɛm no bio ma fɔ ate.',
    welcomeUser: (name) => `Mo ba, ${name}.`,
    askWhatToDo: 'Kɛbɛ na fɔ pɛ dɛ fɔ yo?',
    biometricPrerequisite: 'Ansa na yɛbɛmene sika no, ma yɛnsiesie fɔ nsateaa anaa fɔ anim.',
    askRecipientTarget: 'Wanyi na fɔ pɛ dɛ fɔ mene sika kɔma mɔ? Ka yin firi fɔ contacts mu, anaa ka nɔmba no.',
    contactsPermissionPrePrompt: (name) =>
      `Sɛ merekɔpɛ ${name} a, ehia dɛ mekenkan fɔ contacts. Metɔmi akenkan pɛ, mentɔmi nsesa kɛkɛɛ. Fɔ fon bɛbisa kwan siesie. Mia Allow do siɔnyɔ.`,
    contactsPermissionDenied: 'Hwee nni ho. Yɛsrɛ fɔ ka nɔmba no kɛkɛ.',
    contactNotFound: (name) => `Mannya ${name} wɔ fɔ contacts mu. Yɛsrɛ fɔ ka nɔmba no.`,
    contactMultipleFound: (name, listStr) => `Manya contacts dodo ma ${name}: ${listStr}. Wanyi na fɔ pɛ?`,
    confirmContactNumber: (name, phone) => `Manya ${name} a ne nɔmba yɛ ${phone}. Saa nɔmba yi yɛ pɛ?`,
    confirmSpokenNumber: (phone) => `Fɔ kae dɛ ${phone}. Ɛyɛ nokware?`,
    registeredNameCrossCheck: (name) => `Saa nɔmba yi yin a ɛda do yɛ ${name}. Ɛyɛ nokware?`,
    invalidRecipient: 'Saa nɔmba yi nni MTN MoMo do. Yɛsrɛ fɔ ka yin anaa nɔmba foforɔ.',
    quoteReview: (name, phone, amt, fee, total) =>
      `Fɔ de Ghana cedis ${amt.toFixed(2)} rekɔma ${name}, nɔmba ${phone}. MoMo ntoboa yɛ ${fee.toFixed(2)} cedis, ne pɛpɛɛpɛ yɛ ${total.toFixed(2)} cedis. Ka dɛ Ee sɛ fɔ pene do, anaa Gyaa.`,
    biometricSensorGuide: (method) =>
      method === 'face' ? 'Hwɛ kamera no mu de agye atom.' : 'Fa fɔ nsateaa to sensor no do de agye atom.',
    anythingElse: 'Fɔ pɛ dɛ fɔ yo biribi foforɔ bio?',
    goodbye: 'Nante yie. Yɛda fɔ ase wɔ MTN MoMo nka mu.',
    silenceReprompt: 'Fɔ wɔ do? Yɛsrɛ fɔ kasa, anaa ka dɛ gyaa.',
    silenceTimeout: 'Mante biribiara. Mereto adwuma no mu de abɔ fɔ kɔnta ho ban. Nante yie.',
    slowerNotice: 'Merekasa brɛoo siesie.',
    quickPrompts: [
      { label: 'Tɔ Airtime 10', text: 'Tɔ airtime cedis lefu' },
      { label: 'Mene 20 kɔma Ama', text: 'Mene cedis aduɔnyɔ kɔma Ama' },
      { label: 'Tua ECG 50', text: 'Tua ECG bill cedis aduɔnɔ' },
      { label: 'Kere me sika', text: 'Kere me sika' },
    ],
  },
};

// Numbers in local Ghanaian dialects
export const GHANAIAN_NUMBER_WORDS: Record<string, number> = {
  // English
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  hundred: 100,

  // Twi & Fante (Akan)
  baako: 1,
  mmienu: 2,
  ebien: 2,
  mmiensa: 3,
  ebiasa: 3,
  anan: 4,
  enan: 4,
  enum: 5,
  esia: 6,
  nson: 7,
  nwɔtwe: 8,
  nkron: 9,
  du: 10,
  dunum: 15,
  aduonu: 20,
  eduonu: 20,
  aduasa: 30,
  eduasa: 30,
  aduanan: 40,
  eduanan: 40,
  aduonum: 50,
  eduonum: 50,
  ɔha: 100,
  eha: 100,

  // Ewe
  ɖeka: 1,
  eve: 2,
  etɔ̃: 3,
  ene: 4,
  atɔ̃: 5,
  adé: 6,
  adré: 7,
  enyi: 8,
  enyiɖe: 9,
  ewo: 10,
  blaeve: 20,
  blaetɔ̃: 30,
  blaene: 40,
  blaatɔ̃: 50,
  alafa: 100,

  // Ga
  ekome: 1,
  enyɔ: 2,
  etɛ: 3,
  ejwɛ: 4,
  enumɔ: 5,
  ekpaa: 6,
  kpawo: 7,
  kpaanyɔ: 8,
  nɛɛhu: 9,
  nyɔŋma: 10,
  'nyɔŋmai enyɔ': 20,
  'nyɔŋmai etɛ': 30,
  'nyɔŋmai enumɔ': 50,
  oha: 100,

  // Dagbani
  yini: 1,
  ayi: 2,
  ata: 3,
  anahi: 4,
  anu: 5,
  yobu: 6,
  yopɔin: 7,
  nii: 8,
  wai: 9,
  pia: 10,
  pishi: 20,
  pihita: 30,
  pihinu: 50,
  kɔbiga: 100,

  // Hausa
  daya: 1,
  biyu: 2,
  uku: 3,
  hudu: 4,
  biyar: 5,
  shida: 6,
  bakwai: 7,
  takwas: 8,
  tara: 9,
  goma: 10,
  ashirin: 20,
  talatin: 30,
  arba_in: 40,
  hamsin: 50,
  dari: 100,

  // Krachi (Kaakyi - Oti Region)
  koo: 1,
  anyɔ: 2,
  asa: 3,
  anaa: 4,
  anoo: 5,
  asiee: 6,
  asono: 7,
  akwee: 8,
  akpuno: 9,
  idu: 10,
  kudo: 10,
  aduɔnyɔ: 20,
  aduɔsa: 30,
  aduɔnoo: 50,
  kɛlaŋ: 100,

  // Buem (Lɛlɛmi - Oti Region)
  kuko: 1,
  anɔ: 5,
  asie: 6,
  asunɔ: 7,
  anyani: 8,
  anyana: 9,
  lefu: 10,
  aduɔnɔ: 50,
  kuha: 100,
};

export function getBiometricPhrases(lang: GhanaianLanguage) {
  const p = GHANAIAN_LOCALIZATIONS[lang] || GHANAIAN_LOCALIZATIONS.en;
  return {
    noHardware:
      p.biometricNoHardware ||
      (lang === 'twi' || lang === 'fante'
        ? 'Wo fon no nni nsateaa anaa anim afidie. Sika amene hia nsateaa anaa anim check.'
        : lang === 'ewe'
        ? 'Wò ka mele asibidɛ alo mo mɔ̃ o. Ɖe ga bia asibidɛ alo mo dodokpɔ.'
        : lang === 'hausa'
        ? 'Wayarka ba ta da naurar yatsa ko fuska. Ana buƙatar yatsa ko fuska don tura kuɗi.'
        : 'Your phone does not have biometric hardware. This feature requires a fingerprint or face unlock.'),
    notEnrolled:
      p.biometricNotEnrolled ||
      (lang === 'twi' || lang === 'fante'
        ? "Wo fon nni nsateaa anaa anim biara a wɔakora so. Mɛbue wo fon settings ama woatumi de bi aka ho, na afei woasan aba."
        : lang === 'ewe'
        ? "Wò ka mekpɔ da asibidɛ alo mo aɖeke ɖi o. Maʋu wò ka ƒe settings be naɖoe, eyome nàtrɔ ava."
        : lang === 'hausa'
        ? "Wayarka ba ta da yatsa ko fuska da aka ajiye. Zan buɗe saitunan wayarka don ka saka, sannan ka dawo."
        : "Your phone has no fingerprint or face saved yet. I'll open your phone settings so you can add one, then come back."),
    askChoice:
      p.biometricAskChoice ||
      (lang === 'twi' || lang === 'fante'
        ? 'Wopɛ sɛ wode nsateaa anaa anim yɛ adwuma?'
        : lang === 'ewe'
        ? 'Èdi be yeawe dɔ kple asibidɛ alo mo?'
        : lang === 'hausa'
        ? 'Kuna son amfani da yatsa ko fuska?'
        : 'Do you want to use fingerprint or face?'),
    testGuide: (method: 'fingerprint' | 'face') =>
      p.biometricTestGuide
        ? p.biometricTestGuide(method)
        : method === 'face'
        ? (lang === 'twi' || lang === 'fante'
            ? 'Hwɛ kamera no mu.'
            : lang === 'ewe'
            ? 'Kpɔ kamera la me.'
            : lang === 'hausa'
            ? 'Kalli kyamarar.'
            : 'Look at the camera.')
        : (lang === 'twi' || lang === 'fante'
            ? 'Fa wo nsateaa si sensor no so.'
            : lang === 'ewe'
            ? 'Da wò asibidɛ ɖe sensor la dzi.'
            : lang === 'hausa'
            ? 'Sanya yatsanka a kan naurar.'
            : 'Place your finger on the sensor.'),
    setupSuccess: (method: 'fingerprint' | 'face') =>
      p.biometricSetupSuccess
        ? p.biometricSetupSuccess(method)
        : `${method === 'face' ? 'Face check' : 'Fingerprint'} is set up successfully. What would you like to do?`,
    setupFailed:
      p.biometricSetupFailed ||
      (lang === 'twi' || lang === 'fante'
        ? 'Biometric check no annyɛ yie. Wopɛ sɛ wosɔ hwɛ bio?'
        : lang === 'ewe'
        ? 'Biometric dodokpɔ medze edzi o. Èdi be yeagate kpɔa?'
        : lang === 'hausa'
        ? 'Tabbatar da yatsa ko fuska bai yi nasara ba. Kuna son sake gwadawa?'
        : 'Biometric verification was not recognized. Would you like to try again?'),
  };
}

