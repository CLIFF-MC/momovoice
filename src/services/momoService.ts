import { INITIAL_ACCOUNT, INITIAL_TRANSACTIONS } from '../data/mockData';
import { AndroidIpcEvent, ApiLogEntry, MoMoAccount, TransactionRecord, TransactionStatus } from '../types/momo';

export interface MoMoTransferRequest {
  recipientNumber: string;
  recipientName: string;
  amount: number;
  fee: number;
  currency: string;
  idempotencyKey: string;
}

export type SimulatedFailureMode = 'NONE' | 'INSUFFICIENT_FUNDS' | 'ASYNC_DELAY' | 'TIMEOUT_RECOVERY' | 'DUPLICATE_KEY';

class MoMoService {
  private account: MoMoAccount = { ...INITIAL_ACCOUNT };
  private transactions: TransactionRecord[] = [...INITIAL_TRANSACTIONS];
  private apiLogs: ApiLogEntry[] = [];
  private ipcEvents: AndroidIpcEvent[] = [];
  private onIpcListeners: Array<(event: AndroidIpcEvent) => void> = [];
  private processedIdempotencyKeys = new Set<string>();
  private failureMode: SimulatedFailureMode = 'NONE';
  private isRealSandboxMode = true; // Toggle between MTN MoMo Developer Sandbox Simulation and Custom Mock

  constructor() {
    this.addInitialLog();
    this.addInitialIpcEvents();
  }

  private addInitialIpcEvents() {
    this.ipcEvents.push({
      id: 'ipc-init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'ACCESSIBILITY_ACTION',
      source: 'com.momo.voice.accessibility',
      target: 'com.mtn.momo',
      action: 'BIND_ACCESSIBILITY_SERVICE',
      payload: {
        package: 'com.mtn.momo',
        flags: ['FLAG_REQUEST_FILTER_KEY_EVENTS', 'FLAG_RETRIEVE_INTERACTIVE_WINDOWS'],
        capabilities: ['CAN_RETRIEVE_WINDOW_CONTENT', 'CAN_PERFORM_GESTURES'],
      },
      status: 'RESOLVED',
    });
    this.ipcEvents.push({
      id: 'ipc-init-2',
      timestamp: new Date().toLocaleTimeString(),
      type: 'API_GATEWAY',
      source: 'com.momo.voice.accessibility',
      target: 'api.mtn.com',
      action: 'OAUTH_TOKEN_EXCHANGE',
      payload: {
        grant_type: 'client_credentials',
        target_env: 'sandbox',
        scope: 'collection disbursement',
      },
      status: 'RESOLVED',
    });
  }

  public registerIpcListener(listener: (event: AndroidIpcEvent) => void) {
    this.onIpcListeners.push(listener);
    return () => {
      this.onIpcListeners = this.onIpcListeners.filter((l) => l !== listener);
    };
  }

  public dispatchIpc(event: Omit<AndroidIpcEvent, 'id' | 'timestamp'>): AndroidIpcEvent {
    const fullEvent: AndroidIpcEvent = {
      ...event,
      id: `ipc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    this.ipcEvents.unshift(fullEvent);
    this.onIpcListeners.forEach((fn) => fn(fullEvent));
    return fullEvent;
  }

  public getIpcEvents(): AndroidIpcEvent[] {
    return [...this.ipcEvents];
  }

  private addInitialLog() {
    this.apiLogs.push({
      id: 'log-init',
      timestamp: new Date().toLocaleTimeString(),
      method: 'GET',
      endpoint: '/collection/v1_0/account/balance',
      status: 200,
      statusText: 'OK',
      headers: {
        'Ocp-Apim-Subscription-Key': 'd8f9••••••••••••3a1c',
        'X-Target-Environment': 'sandbox',
        'Content-Type': 'application/json',
      },
      responsePayload: {
        availableBalance: '1250.00',
        currency: 'GHS',
      },
      durationMs: 82,
      isMock: !this.isRealSandboxMode,
    });
  }

  public getAccount(): MoMoAccount {
    return { ...this.account };
  }

  public getTransactions(): TransactionRecord[] {
    return [...this.transactions];
  }

  public getApiLogs(): ApiLogEntry[] {
    return [...this.apiLogs];
  }

  public setFailureMode(mode: SimulatedFailureMode) {
    this.failureMode = mode;
  }

  public getFailureMode(): SimulatedFailureMode {
    return this.failureMode;
  }

  public setRealSandboxMode(val: boolean) {
    this.isRealSandboxMode = val;
  }

  public getRealSandboxMode(): boolean {
    return this.isRealSandboxMode;
  }

  // 1. Balance Inquiry API
  public async getBalance(): Promise<{ balance: number; currency: string; referenceId: string }> {
    const startTime = performance.now();
    const referenceId = crypto.randomUUID();

    this.dispatchIpc({
      type: 'API_GATEWAY',
      source: 'com.momo.voice.accessibility',
      target: 'api.mtn.com',
      action: 'GET /collection/v1_0/account/balance',
      payload: {
        referenceId,
        targetEnv: 'sandbox',
      },
      status: 'DISPATCHED',
    });

    // Simulating network roundtrip
    await new Promise((resolve) => setTimeout(resolve, 450));

    const durationMs = Math.round(performance.now() - startTime);

    this.apiLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      method: 'GET',
      endpoint: '/collection/v1_0/account/balance',
      status: 200,
      statusText: 'OK',
      headers: {
        'X-Reference-Id': referenceId,
        'Ocp-Apim-Subscription-Key': 'd8f9••••••••••••3a1c',
        'X-Target-Environment': 'sandbox',
        'Content-Type': 'application/json',
      },
      responsePayload: {
        availableBalance: this.account.availableBalance.toFixed(2),
        currency: this.account.currency,
      },
      durationMs,
      isMock: !this.isRealSandboxMode,
    });

    this.dispatchIpc({
      type: 'ACCESSIBILITY_ACTION',
      source: 'com.momo.voice.accessibility',
      target: 'com.mtn.momo',
      action: 'NODE_STATE_SYNCHRONIZED',
      payload: {
        viewId: 'com.mtn.momo:id/tv_balance_display',
        value: `GHS ${this.account.availableBalance.toFixed(2)}`,
      },
      status: 'RESOLVED',
    });

    return {
      balance: this.account.availableBalance,
      currency: this.account.currency,
      referenceId,
    };
  }

  // 2. Transfer / Request-To-Pay & Disbursement API with Idempotency
  public async executeTransfer(
    req: MoMoTransferRequest,
    onStatusUpdate?: (status: TransactionStatus, details: string) => void
  ): Promise<TransactionRecord> {
    const startTime = performance.now();
    const referenceId = crypto.randomUUID();

    this.dispatchIpc({
      type: 'INTENT_DEEPLINK',
      source: 'com.momo.voice.accessibility',
      target: 'com.mtn.momo',
      action: 'ACTION_VIEW (momo://transfer)',
      payload: {
        amount: req.amount,
        recipient: req.recipientNumber,
        recipientName: req.recipientName,
        fee: req.fee,
        idempotencyKey: req.idempotencyKey,
      },
      status: 'DISPATCHED',
    });

    // Check duplicate idempotency key
    if (this.processedIdempotencyKeys.has(req.idempotencyKey) || this.failureMode === 'DUPLICATE_KEY') {
      const durationMs = Math.round(performance.now() - startTime);
      this.apiLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        method: 'POST',
        endpoint: '/disbursement/v1_0/transfer',
        status: 409,
        statusText: 'Conflict (Duplicate Idempotency Key)',
        headers: {
          'X-Reference-Id': referenceId,
          'X-Idempotency-Key': req.idempotencyKey,
          'Ocp-Apim-Subscription-Key': 'd8f9••••••••••••3a1c',
          'X-Target-Environment': 'sandbox',
        },
        requestPayload: {
          amount: req.amount.toFixed(2),
          currency: req.currency,
          externalId: req.idempotencyKey,
          payee: { partyIdType: 'MSISDN', partyId: req.recipientNumber },
        },
        responsePayload: {
          code: 'DUPLICATE_REQUEST',
          message: 'A transaction with this idempotency key was already submitted. Transaction safely aborted to prevent double-charging.',
        },
        durationMs,
        isMock: !this.isRealSandboxMode,
      });

      throw new Error('Duplicate transaction detected. The system blocked this request to avoid charging you twice.');
    }

    // Check insufficient balance failure mode
    if (this.failureMode === 'INSUFFICIENT_FUNDS' || req.amount + req.fee > this.account.availableBalance) {
      const durationMs = Math.round(performance.now() - startTime);
      this.apiLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        method: 'POST',
        endpoint: '/disbursement/v1_0/transfer',
        status: 403,
        statusText: 'Forbidden - Insufficient Balance',
        headers: {
          'X-Reference-Id': referenceId,
          'Ocp-Apim-Subscription-Key': 'd8f9••••••••••••3a1c',
          'X-Target-Environment': 'sandbox',
        },
        requestPayload: {
          amount: req.amount.toFixed(2),
          currency: req.currency,
          payee: { partyIdType: 'MSISDN', partyId: req.recipientNumber },
        },
        responsePayload: {
          code: 'PAYER_LIMIT_REACHED',
          message: `Insufficient funds. Available balance is GHS ${this.account.availableBalance.toFixed(2)}.`,
        },
        durationMs,
        isMock: !this.isRealSandboxMode,
      });

      const failedRecord: TransactionRecord = {
        id: `tx-${Date.now()}`,
        referenceId,
        type: 'TRANSFER',
        recipientName: req.recipientName,
        recipientNumber: req.recipientNumber,
        amount: req.amount,
        fee: req.fee,
        currency: req.currency,
        status: 'FAILED',
        timestamp: 'Just now',
        failureReason: `Insufficient balance (GHS ${this.account.availableBalance.toFixed(2)} available)`,
        idempotencyKey: req.idempotencyKey,
        isRealSandbox: this.isRealSandboxMode,
      };
      this.transactions.unshift(failedRecord);
      throw new Error(`Insufficient MoMo balance. You requested GHS ${req.amount.toFixed(2)}, but your balance is GHS ${this.account.availableBalance.toFixed(2)}.`);
    }

    // Check timeout recovery mode
    if (this.failureMode === 'TIMEOUT_RECOVERY') {
      const durationMs = 1200;
      this.apiLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        method: 'POST',
        endpoint: '/disbursement/v1_0/transfer',
        status: 504,
        statusText: 'Gateway Timeout',
        headers: {
          'X-Reference-Id': referenceId,
          'Ocp-Apim-Subscription-Key': 'd8f9••••••••••••3a1c',
          'X-Target-Environment': 'sandbox',
        },
        responsePayload: {
          code: 'TIMEOUT',
          message: 'MTN MoMo Sandbox gateway did not respond within 1200ms. Safe recovery initiated.',
        },
        durationMs,
        isMock: !this.isRealSandboxMode,
      });

      // Instead of failing or blind retrying, the architecture verifies status
      onStatusUpdate?.('PENDING', 'Provider timeout. Querying transaction status before any action...');
      await new Promise((resolve) => setTimeout(resolve, 800));

      this.apiLogs.unshift({
        id: `log-status-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        method: 'GET',
        endpoint: `/disbursement/v1_0/transfer/${referenceId}`,
        status: 200,
        statusText: 'OK',
        headers: {
          'X-Reference-Id': referenceId,
          'Ocp-Apim-Subscription-Key': 'd8f9••••••••••••3a1c',
          'X-Target-Environment': 'sandbox',
        },
        responsePayload: {
          referenceId,
          status: 'SUCCESSFUL',
          amount: req.amount.toFixed(2),
          currency: req.currency,
          financialTransactionId: `MOMO-GH-${Math.floor(10000000 + Math.random() * 90000000)}`,
        },
        durationMs: 310,
        isMock: !this.isRealSandboxMode,
      });

      // Debit account
      this.account.availableBalance -= req.amount + req.fee;
      this.processedIdempotencyKeys.add(req.idempotencyKey);

      const recoveredRecord: TransactionRecord = {
        id: `tx-${Date.now()}`,
        referenceId,
        type: 'TRANSFER',
        recipientName: req.recipientName,
        recipientNumber: req.recipientNumber,
        amount: req.amount,
        fee: req.fee,
        currency: req.currency,
        status: 'SUCCESSFUL',
        timestamp: 'Just now',
        idempotencyKey: req.idempotencyKey,
        isRealSandbox: this.isRealSandboxMode,
      };
      this.transactions.unshift(recoveredRecord);
      return recoveredRecord;
    }

    // Normal or Async Delay Flow:
    // First step: 202 Accepted
    onStatusUpdate?.('PENDING', 'Request accepted by MTN MoMo Sandbox. Awaiting confirmation...');
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.apiLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      method: 'POST',
      endpoint: '/disbursement/v1_0/transfer',
      status: 202,
      statusText: 'Accepted',
      headers: {
        'X-Reference-Id': referenceId,
        'Ocp-Apim-Subscription-Key': 'd8f9••••••••••••3a1c',
        'X-Target-Environment': 'sandbox',
        'Content-Type': 'application/json',
      },
      requestPayload: {
        amount: req.amount.toFixed(2),
        currency: req.currency,
        externalId: req.idempotencyKey,
        payee: {
          partyIdType: 'MSISDN',
          partyId: req.recipientNumber,
        },
        payerMessage: 'Voice Assistant Transfer',
        payeeNote: `Payment to ${req.recipientName}`,
      },
      responsePayload: {
        status: 'PENDING',
        referenceId,
      },
      durationMs: 420,
      isMock: !this.isRealSandboxMode,
    });

    // Check async delay
    const delayTime = this.failureMode === 'ASYNC_DELAY' ? 2400 : 700;
    await new Promise((resolve) => setTimeout(resolve, delayTime));

    // Polling step: GET /transfer/{referenceId} -> 200 SUCCESSFUL
    const durationMs = Math.round(performance.now() - startTime);

    this.apiLogs.unshift({
      id: `log-poll-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      method: 'GET',
      endpoint: `/disbursement/v1_0/transfer/${referenceId}`,
      status: 200,
      statusText: 'OK',
      headers: {
        'X-Reference-Id': referenceId,
        'Ocp-Apim-Subscription-Key': 'd8f9••••••••••••3a1c',
        'X-Target-Environment': 'sandbox',
      },
      responsePayload: {
        amount: req.amount.toFixed(2),
        currency: req.currency,
        financialTransactionId: `MOMO-GH-${Math.floor(10000000 + Math.random() * 90000000)}`,
        externalId: req.idempotencyKey,
        payee: { partyIdType: 'MSISDN', partyId: req.recipientNumber },
        status: 'SUCCESSFUL',
      },
      durationMs,
      isMock: !this.isRealSandboxMode,
    });

    // Deduct balance
    this.account.availableBalance -= req.amount + req.fee;
    this.processedIdempotencyKeys.add(req.idempotencyKey);

    const successfulRecord: TransactionRecord = {
      id: `tx-${Date.now()}`,
      referenceId,
      type: 'TRANSFER',
      recipientName: req.recipientName,
      recipientNumber: req.recipientNumber,
      amount: req.amount,
      fee: req.fee,
      currency: req.currency,
      status: 'SUCCESSFUL',
      timestamp: 'Just now',
      idempotencyKey: req.idempotencyKey,
      isRealSandbox: this.isRealSandboxMode,
    };

    this.transactions.unshift(successfulRecord);
    return successfulRecord;
  }

  // 3. Airtime Top-Up API
  public async executeAirtime(
    req: { recipientNumber: string; recipientName?: string; amount: number; idempotencyKey: string },
    onStatusUpdate?: (status: TransactionStatus, details: string) => void
  ): Promise<TransactionRecord> {
    const startTime = performance.now();
    const referenceId = crypto.randomUUID();

    if (req.amount > this.account.availableBalance) {
      throw new Error(`Insufficient MoMo balance for airtime. Balance is GHS ${this.account.availableBalance.toFixed(2)}.`);
    }

    onStatusUpdate?.('PENDING', 'Connecting to MTN Airtime Top-up Gateway...');
    await new Promise((resolve) => setTimeout(resolve, 600));

    this.dispatchIpc({
      type: 'INTENT_DEEPLINK',
      source: 'com.momo.voice.accessibility',
      target: 'com.mtn.momo',
      action: 'ACTION_VIEW (momo://airtime)',
      payload: { amount: req.amount, recipient: req.recipientNumber },
      status: 'DISPATCHED',
    });

    const durationMs = Math.round(performance.now() - startTime);
    this.apiLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      method: 'POST',
      endpoint: '/collection/v1_0/airtime/topup',
      status: 200,
      statusText: 'OK',
      headers: {
        'X-Reference-Id': referenceId,
        'Ocp-Apim-Subscription-Key': 'd8f9••••••••••••3a1c',
        'X-Target-Environment': 'sandbox',
      },
      requestPayload: {
        amount: req.amount.toFixed(2),
        currency: 'GHS',
        payee: { partyIdType: 'MSISDN', partyId: req.recipientNumber },
      },
      responsePayload: { status: 'SUCCESSFUL', referenceId },
      durationMs,
      isMock: !this.isRealSandboxMode,
    });

    this.account.availableBalance -= req.amount;
    this.processedIdempotencyKeys.add(req.idempotencyKey);

    const record: TransactionRecord = {
      id: `tx-${Date.now()}`,
      referenceId,
      type: 'AIRTIME',
      recipientName: req.recipientName || 'Airtime Recharge',
      recipientNumber: req.recipientNumber,
      amount: req.amount,
      fee: 0,
      currency: 'GHS',
      status: 'SUCCESSFUL',
      timestamp: 'Just now',
      idempotencyKey: req.idempotencyKey,
      isRealSandbox: this.isRealSandboxMode,
    };
    this.transactions.unshift(record);
    return record;
  }

  // 4. Bill / Merchant Payment API
  public async executeBillPay(
    req: { billerName: string; amount: number; idempotencyKey: string },
    onStatusUpdate?: (status: TransactionStatus, details: string) => void
  ): Promise<TransactionRecord> {
    const startTime = performance.now();
    const referenceId = crypto.randomUUID();

    if (req.amount > this.account.availableBalance) {
      throw new Error(`Insufficient MoMo balance for bill payment. Balance is GHS ${this.account.availableBalance.toFixed(2)}.`);
    }

    onStatusUpdate?.('PENDING', `Authorizing payment to ${req.billerName}...`);
    await new Promise((resolve) => setTimeout(resolve, 600));

    this.dispatchIpc({
      type: 'INTENT_DEEPLINK',
      source: 'com.momo.voice.accessibility',
      target: 'com.mtn.momo',
      action: 'ACTION_VIEW (momo://paybill)',
      payload: { amount: req.amount, biller: req.billerName },
      status: 'DISPATCHED',
    });

    const durationMs = Math.round(performance.now() - startTime);
    this.apiLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      method: 'POST',
      endpoint: '/collection/v1_0/billpay',
      status: 200,
      statusText: 'OK',
      headers: {
        'X-Reference-Id': referenceId,
        'Ocp-Apim-Subscription-Key': 'd8f9••••••••••••3a1c',
        'X-Target-Environment': 'sandbox',
      },
      requestPayload: {
        amount: req.amount.toFixed(2),
        currency: 'GHS',
        biller: req.billerName,
      },
      responsePayload: { status: 'SUCCESSFUL', referenceId },
      durationMs,
      isMock: !this.isRealSandboxMode,
    });

    this.account.availableBalance -= req.amount;
    this.processedIdempotencyKeys.add(req.idempotencyKey);

    const record: TransactionRecord = {
      id: `tx-${Date.now()}`,
      referenceId,
      type: 'BILL_PAY',
      billerName: req.billerName,
      recipientName: req.billerName,
      amount: req.amount,
      fee: 0,
      currency: 'GHS',
      status: 'SUCCESSFUL',
      timestamp: 'Just now',
      idempotencyKey: req.idempotencyKey,
      isRealSandbox: this.isRealSandboxMode,
    };
    this.transactions.unshift(record);
    return record;
  }

  // 5. Cash Out / Agent Withdrawal API
  public async executeCashOut(
    req: { agentCode: string; agentName?: string; amount: number; fee: number; idempotencyKey: string },
    onStatusUpdate?: (status: TransactionStatus, details: string) => void
  ): Promise<TransactionRecord> {
    const startTime = performance.now();
    const referenceId = crypto.randomUUID();

    const total = req.amount + req.fee;
    if (total > this.account.availableBalance) {
      throw new Error(`Insufficient MoMo balance for cash out. Total required is GHS ${total.toFixed(2)}.`);
    }

    onStatusUpdate?.('PENDING', `Approving agent cash out for Agent ${req.agentCode}...`);
    await new Promise((resolve) => setTimeout(resolve, 600));

    this.dispatchIpc({
      type: 'INTENT_DEEPLINK',
      source: 'com.momo.voice.accessibility',
      target: 'com.mtn.momo',
      action: 'ACTION_VIEW (momo://cashout)',
      payload: { amount: req.amount, agent: req.agentCode, fee: req.fee },
      status: 'DISPATCHED',
    });

    const durationMs = Math.round(performance.now() - startTime);
    this.apiLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      method: 'POST',
      endpoint: '/disbursement/v1_0/cashout',
      status: 200,
      statusText: 'OK',
      headers: {
        'X-Reference-Id': referenceId,
        'Ocp-Apim-Subscription-Key': 'd8f9••••••••••••3a1c',
        'X-Target-Environment': 'sandbox',
      },
      requestPayload: {
        amount: req.amount.toFixed(2),
        fee: req.fee.toFixed(2),
        currency: 'GHS',
        agent: req.agentCode,
      },
      responsePayload: { status: 'SUCCESSFUL', referenceId },
      durationMs,
      isMock: !this.isRealSandboxMode,
    });

    this.account.availableBalance -= total;
    this.processedIdempotencyKeys.add(req.idempotencyKey);

    const record: TransactionRecord = {
      id: `tx-${Date.now()}`,
      referenceId,
      type: 'CASH_OUT',
      agentCode: req.agentCode,
      recipientName: req.agentName || `MoMo Agent ${req.agentCode}`,
      amount: req.amount,
      fee: req.fee,
      currency: 'GHS',
      status: 'SUCCESSFUL',
      timestamp: 'Just now',
      idempotencyKey: req.idempotencyKey,
      isRealSandbox: this.isRealSandboxMode,
    };
    this.transactions.unshift(record);
    return record;
  }

  public resetAccount(balance: number = 1250.0) {
    this.account.availableBalance = balance;
    this.transactions = [...INITIAL_TRANSACTIONS];
    this.processedIdempotencyKeys.clear();
    this.failureMode = 'NONE';
    this.addInitialLog();
  }
}

export const momoService = new MoMoService();
