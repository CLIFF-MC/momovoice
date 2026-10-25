import { GhanaianLanguage, LanguageOption } from '../types/momo';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English (Ghana)', nativeName: 'Ghanaian English', region: 'National' },
  { code: 'twi', name: 'Asante Twi', nativeName: 'Twi (Akan)', region: 'Ashanti / Eastern' },
  { code: 'fante', name: 'Fante', nativeName: 'Mfantse', region: 'Central / Western' },
  { code: 'ewe', name: 'Ewe', nativeName: 'Eʋegbe', region: 'Volta Region' },
  { code: 'ga', name: 'Ga', nativeName: 'Gã', region: 'Greater Accra' },
  { code: 'dagbani', name: 'Dagbani', nativeName: 'Dagbanli', region: 'Northern Region' },
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
    quickPrompts: [
      { label: 'Daɣim Airtime 10', text: 'Daɣim airtime cedi pia' },
      { label: 'Timi 20 Ama', text: 'Timi Ama Ghana cedi pishi' },
      { label: 'Yo ECG 50', text: 'Yo ECG samli cedi pihinu' },
      { label: 'Nyama n laɣifu', text: 'Nyama n laɣifu' },
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
};
