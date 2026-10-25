export type GhanaianLanguage = 'en' | 'twi' | 'fante' | 'ewe' | 'ga' | 'dagbani';

export interface LanguageOption {
  code: GhanaianLanguage;
  name: string;
  nativeName: string;
  region: string;
}

export type AssistantState =
  | 'IDLE'
  | 'LISTENING'
  | 'INTERPRETING'
  | 'COLLECTING_DETAILS'
  | 'REVIEWING'
  | 'AUTHENTICATING'
  | 'SUBMITTING'
  | 'CHECKING_STATUS'
  | 'RESULT_ANNOUNCED'
  | 'ERROR_RECOVERY';

export type IntentType =
  | 'BALANCE_CHECK'
  | 'PREPARE_TRANSFER'
  | 'CONFIRM_TRANSFER'
  | 'BUY_AIRTIME'
  | 'PAY_BILL'
  | 'CASH_OUT'
  | 'CANCEL'
  | 'TRANSACTION_STATUS'
  | 'REPEAT'
  | 'HELP'
  | 'CHANGE_AMOUNT'
  | 'CHANGE_RECIPIENT'
  | 'UNKNOWN';

export type MoMoServiceType = 'TRANSFER' | 'AIRTIME' | 'BILL_PAY' | 'CASH_OUT';

export interface TransferDraft {
  serviceType: MoMoServiceType;
  recipientName?: string;
  recipientNumber?: string;
  momoAccountName?: string;
  billerName?: string;
  agentCode?: string;
  amount?: number;
  currency: string;
  fee: number;
  total: number;
  missingField?: 'recipient' | 'recipientNumber' | 'amount' | 'biller' | 'agent' | null;
}

export type TransactionStatus =
  | 'SUCCESSFUL'
  | 'PENDING'
  | 'FAILED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'UNKNOWN';

export interface TransactionRecord {
  id: string;
  referenceId: string;
  type: 'TRANSFER' | 'AIRTIME' | 'BILL_PAY' | 'CASH_OUT' | 'BALANCE_INQUIRY';
  recipientName?: string;
  recipientNumber?: string;
  billerName?: string;
  agentCode?: string;
  amount: number;
  fee: number;
  currency: string;
  status: TransactionStatus;
  timestamp: string;
  failureReason?: string;
  idempotencyKey: string;
  isRealSandbox: boolean;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  verifiedName: string;
  relationship: string;
}

export interface MoMoAccount {
  msisdn: string;
  accountHolderName: string;
  currency: string;
  availableBalance: number;
  reservedBalance: number;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  requestPayload?: unknown;
  responsePayload?: unknown;
  durationMs: number;
  isMock: boolean;
}

export interface TalkBackAnnouncement {
  id: string;
  text: string;
  priority: 'assertive' | 'polite';
  timestamp: string;
  source: string;
}

export interface AutomatedTestCase {
  id: string;
  name: string;
  category: 'Speech' | 'Accessibility' | 'Review' | 'API' | 'Security' | 'Network' | 'Privacy';
  description: string;
  expectedResult: string;
  status: 'IDLE' | 'RUNNING' | 'PASS' | 'FAIL';
  details?: string;
  durationMs?: number;
}

export interface AndroidIpcEvent {
  id: string;
  timestamp: string;
  type: 'INTENT_DEEPLINK' | 'ACCESSIBILITY_ACTION' | 'API_GATEWAY' | 'BIOMETRIC_AUTH';
  source: 'com.momo.voice.accessibility' | 'com.mtn.momo';
  target: 'com.mtn.momo' | 'com.momo.voice.accessibility' | 'api.mtn.com';
  action: string;
  payload: Record<string, any>;
  status: 'DISPATCHED' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FAILED';
}

export interface AccessibilityNode {
  id: string;
  className: string;
  text?: string;
  contentDescription?: string;
  viewIdResourceName: string;
  isClickable: boolean;
  isFocusable: boolean;
  isFocused: boolean;
  children?: AccessibilityNode[];
}
