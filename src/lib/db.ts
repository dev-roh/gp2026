import fs from 'fs';
import path from 'path';

export interface AppSettings {
  appTitle: string;
  subTitle: string;
  logoUrl?: string;
  themeColor: 'AMBER_ORANGE' | 'EMERALD_GREEN' | 'SLATE_BLUE' | 'PURPLE_GOLD';
  targetGoalAmount: number;
  targetGoalLabel: string;
  collectionButtonLabel: string;
  spendButtonLabel: string;
  handoverButtonLabel: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: 'SUPER_ADMIN' | 'TREASURER' | 'COLLECTOR' | 'MEMBER' | 'VIEW_ONLY';
  area?: string;
  phone?: string;
  createdAt: string;
}

export interface UserRoleAssignment {
  email: string;
  role: 'SUPER_ADMIN' | 'TREASURER' | 'COLLECTOR' | 'MEMBER' | 'VIEW_ONLY';
  assignedBy: string;
  updatedAt: string;
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
  memberArea: string;
  collectorId: string;
  collectorName: string;
  status: 'APPROVED' | 'PENDING_COLLECTOR_APPROVAL' | 'PENDING_SUPER_ADMIN_APPROVAL' | 'REJECTED';
  approverEmail?: string;
  isSelfContribution?: boolean;
}

export interface NotificationItem {
  id: string;
  recipientEmail: string;
  title: string;
  message: string;
  type: 'CONTRIBUTION_APPROVAL_REQUIRED' | 'CONTRIBUTION_APPROVED' | 'HANDOVER_APPROVAL_REQUIRED';
  targetId: string;
  isRead: boolean;
  date: string;
}

export interface Handover {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  date: string;
  collectorId: string;
  collectorName: string;
  collectorArea?: string;
  treasurerId?: string;
  treasurerName?: string;
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
  settings: AppSettings;
  users: User[];
  roleAssignments: Record<string, UserRoleAssignment>;
  contributions: Contribution[];
  notifications: NotificationItem[];
  handovers: Handover[];
  expenses: Expense[];
}

const dbPath = path.join(process.cwd(), 'data', 'db.json');

const SUPER_ADMIN_EMAIL = 'luhurenbaiclub@gmail.com';

const defaultSettings: AppSettings = {
  appTitle: 'GP 2026 Finance',
  subTitle: 'gp2026.luhurachati.com',
  logoUrl: '/icon-192.png',
  themeColor: 'AMBER_ORANGE',
  targetGoalAmount: 200000,
  targetGoalLabel: 'Target Fund Goal',
  collectionButtonLabel: '+ Collection',
  spendButtonLabel: '+ Spend / Bill',
  handoverButtonLabel: 'Handover Cash'
};

const initialData: DatabaseSchema = {
  settings: defaultSettings,
  users: [
    { id: 'usr-0', name: 'Super Admin', email: SUPER_ADMIN_EMAIL, role: 'SUPER_ADMIN', area: 'Admin Central', phone: '+919999999999', createdAt: new Date().toISOString() },
    { id: 'usr-1', name: 'Rajesh Sharma (Treasurer)', email: 'treasurer@gp2026.com', role: 'TREASURER', area: 'Wing A', phone: '+919876543210', createdAt: new Date().toISOString() },
    { id: 'usr-2', name: 'Amit Patel (Collector)', email: 'collector1@gp2026.com', role: 'COLLECTOR', area: 'Wing B', phone: '+919876543211', createdAt: new Date().toISOString() },
  ],
  roleAssignments: {
    [SUPER_ADMIN_EMAIL]: { email: SUPER_ADMIN_EMAIL, role: 'SUPER_ADMIN', assignedBy: 'SYSTEM', updatedAt: new Date().toISOString() },
    'treasurer@gp2026.com': { email: 'treasurer@gp2026.com', role: 'TREASURER', assignedBy: SUPER_ADMIN_EMAIL, updatedAt: new Date().toISOString() },
    'collector1@gp2026.com': { email: 'collector1@gp2026.com', role: 'COLLECTOR', assignedBy: SUPER_ADMIN_EMAIL, updatedAt: new Date().toISOString() }
  },
  contributions: [
    { id: 'cnt-1', amount: 5000, paymentMode: 'CASH', receiptNo: 'REC-2026-001', note: 'Full annual chanda', date: new Date().toISOString(), memberId: 'usr-4', memberName: 'Priya Joshi', memberArea: 'Sector 1 / Wing A', collectorId: 'usr-2', collectorName: 'Amit Patel', status: 'APPROVED' },
    { id: 'cnt-2', amount: 3500, paymentMode: 'UPI', receiptNo: 'REC-2026-002', note: 'Partial payment', date: new Date().toISOString(), memberId: 'usr-5', memberName: 'Vikram Singh', memberArea: 'Sector 2 / Wing B', collectorId: 'usr-1', collectorName: 'Rajesh Sharma', status: 'APPROVED' }
  ],
  notifications: [],
  handovers: [
    { id: 'hnd-1', amount: 5000, status: 'PENDING', notes: 'Cash collected from Sector 1 / Wing A', date: new Date().toISOString(), collectorId: 'usr-2', collectorName: 'Amit Patel', collectorArea: 'Sector 1 / Wing A' }
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
    const parsed = JSON.parse(raw);
    if (!parsed.settings) parsed.settings = defaultSettings;
    if (!parsed.roleAssignments) parsed.roleAssignments = initialData.roleAssignments;
    if (!parsed.notifications) parsed.notifications = [];
    return parsed;
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

export function getUserRole(email: string | null | undefined): 'SUPER_ADMIN' | 'TREASURER' | 'COLLECTOR' | 'MEMBER' | 'VIEW_ONLY' {
  if (!email) return 'VIEW_ONLY';
  if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return 'SUPER_ADMIN';

  const db = getDb();
  const assignment = db.roleAssignments[email.toLowerCase()];
  if (assignment) {
    return assignment.role;
  }

  return 'VIEW_ONLY';
}

export function registerOrUpdateUser(name: string, email: string, image?: string): User {
  const db = getDb();
  const normalizedEmail = email.toLowerCase();
  let user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    const role = getUserRole(normalizedEmail);
    user = {
      id: `usr-${Date.now()}`,
      name,
      email: normalizedEmail,
      image,
      role,
      area: 'General Area',
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    saveDb(db);
  } else {
    let updated = false;
    if (name && user.name !== name) { user.name = name; updated = true; }
    if (image && user.image !== image) { user.image = image; updated = true; }
    if (updated) saveDb(db);
  }

  return user;
}
