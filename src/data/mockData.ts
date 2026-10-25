import { Contact, MoMoAccount, TransactionRecord } from '../types/momo';

export const INITIAL_ACCOUNT: MoMoAccount = {
  msisdn: '233244890123',
  accountHolderName: 'Abena Owusu',
  currency: 'GHS',
  availableBalance: 1250.0,
  reservedBalance: 0.0,
  status: 'ACTIVE',
};

export const FREQUENT_CONTACTS: Contact[] = [
  {
    id: 'c1',
    name: 'Ama',
    number: '0244123456',
    verifiedName: 'Ama Mensah',
    relationship: 'Sister',
  },
  {
    id: 'c2',
    name: 'Kwame',
    number: '0244987654',
    verifiedName: 'Kwame Osei',
    relationship: 'Brother',
  },
  {
    id: 'c3',
    name: 'Kofi',
    number: '0244332211',
    verifiedName: 'Kofi Appiah',
    relationship: 'Landlord',
  },
  {
    id: 'c4',
    name: 'Akua',
    number: '0244556677',
    verifiedName: 'Akua Boateng',
    relationship: 'Colleague',
  },
];

export const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'tx-prev-1',
    referenceId: '8f7d9a12-4c21-4f10-9b43-98214a112001',
    type: 'TRANSFER',
    recipientName: 'Ama Mensah',
    recipientNumber: '0244123456',
    amount: 50.0,
    fee: 0.5,
    currency: 'GHS',
    status: 'SUCCESSFUL',
    timestamp: 'Today, 08:30 AM',
    idempotencyKey: 'idemp-8f7d9a12-1',
    isRealSandbox: true,
  },
  {
    id: 'tx-prev-2',
    referenceId: '9b1e2a33-6f14-4c89-9a22-12445c778901',
    type: 'AIRTIME',
    recipientName: 'Prepaid Airtime (Self)',
    recipientNumber: '0244890123',
    amount: 15.0,
    fee: 0.0,
    currency: 'GHS',
    status: 'SUCCESSFUL',
    timestamp: 'Yesterday, 07:15 PM',
    idempotencyKey: 'idemp-9b1e2a33-2',
    isRealSandbox: true,
  },
  {
    id: 'tx-prev-3',
    referenceId: '4a3c2d11-5e88-4f99-8d11-99887a223344',
    type: 'BILL_PAY',
    billerName: 'ECG (Electricity Company of Ghana)',
    recipientName: 'ECG Prepaid Meter',
    amount: 80.0,
    fee: 0.0,
    currency: 'GHS',
    status: 'SUCCESSFUL',
    timestamp: '2 days ago, 02:45 PM',
    idempotencyKey: 'idemp-4a3c2d11-3',
    isRealSandbox: true,
  },
  {
    id: 'tx-prev-4',
    referenceId: '7e2c1b44-9d11-4a22-8c12-33214b998122',
    type: 'BALANCE_INQUIRY',
    amount: 0,
    fee: 0,
    currency: 'GHS',
    status: 'SUCCESSFUL',
    timestamp: '3 days ago, 09:12 AM',
    idempotencyKey: 'idemp-7e2c1b44-4',
    isRealSandbox: true,
  },
];

export function calculateMoMoFee(amount: number): number {
  if (amount <= 50) return 0.5;
  if (amount <= 1000) return Number((amount * 0.0075).toFixed(2));
  return 7.5; // Capped at GHS 7.50
}
