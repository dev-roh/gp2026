import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: 'ADMIN' | 'TREASURER' | 'COLLECTOR' | 'MEMBER';
  flatNo?: string;
  phone?: string;
  createdAt: string;
}

export interface Contribution {
  id: string;
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER';
  receiptNo: string;
  note?: string;
  date: string;
  memberId: string;
  memberName: string;
  memberFlat: string;
  collectorId: string;
  collectorName: string;
}

export interface Handover {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  date: string;
  collectorId: string;
  collectorName: string;
  treasurerId?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  isOutofPocket: boolean;
  isReimbursed: boolean;
  receiptUrl?: string;
  date: string;
  paidById: string;
  paidByName: string;
}

export interface DatabaseSchema {
  users: User[];
  contributions: Contribution[];
  handovers: Handover[];
  expenses: Expense[];
}

const dbPath = path.join(process.cwd(), 'data', 'db.json');

const initialData: DatabaseSchema = {
  users: [
    { id: 'usr-1', name: 'Rajesh Sharma (Treasurer)', email: 'treasurer@gp2026.com', role: 'TREASURER', flatNo: 'A-401', phone: '+919876543210', createdAt: new Date().toISOString() },
    { id: 'usr-2', name: 'Amit Patel (Collector)', email: 'collector1@gp2026.com', role: 'COLLECTOR', flatNo: 'B-102', phone: '+919876543211', createdAt: new Date().toISOString() },
    { id: 'usr-3', name: 'Suresh Verma (Collector)', email: 'collector2@gp2026.com', role: 'COLLECTOR', flatNo: 'C-304', phone: '+919876543212', createdAt: new Date().toISOString() },
    { id: 'usr-4', name: 'Priya Joshi (Member)', email: 'priya@gp2026.com', role: 'MEMBER', flatNo: 'A-101', phone: '+919876543213', createdAt: new Date().toISOString() },
    { id: 'usr-5', name: 'Vikram Singh (Member)', email: 'vikram@gp2026.com', role: 'MEMBER', flatNo: 'B-205', phone: '+919876543214', createdAt: new Date().toISOString() }
  ],
  contributions: [
    { id: 'cnt-1', amount: 5000, paymentMode: 'CASH', receiptNo: 'REC-2026-001', note: 'Full annual chanda', date: new Date().toISOString(), memberId: 'usr-4', memberName: 'Priya Joshi', memberFlat: 'A-101', collectorId: 'usr-2', collectorName: 'Amit Patel' },
    { id: 'cnt-2', amount: 3500, paymentMode: 'UPI', receiptNo: 'REC-2026-002', note: 'Partial payment', date: new Date().toISOString(), memberId: 'usr-5', memberName: 'Vikram Singh', memberFlat: 'B-205', collectorId: 'usr-1', collectorName: 'Rajesh Sharma' }
  ],
  handovers: [
    { id: 'hnd-1', amount: 5000, status: 'PENDING', notes: 'Cash collected from Wing A on Sept 3', date: new Date().toISOString(), collectorId: 'usr-2', collectorName: 'Amit Patel' }
  ],
  expenses: [
    { id: 'exp-1', title: 'Pandal Advance Payment', category: 'Decoration', amount: 12000, isOutofPocket: false, isReimbursed: false, date: new Date().toISOString(), paidById: 'usr-1', paidByName: 'Rajesh Sharma' },
    { id: 'exp-2', title: 'Flower Garland & Puja Items', category: 'Puja Rituals', amount: 2400, isOutofPocket: true, isReimbursed: false, date: new Date().toISOString(), paidById: 'usr-2', paidByName: 'Amit Patel' }
  ]
};

export function getDb(): DatabaseSchema {
  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return initialData;
  }
}

export function saveDb(data: DatabaseSchema) {
  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}
