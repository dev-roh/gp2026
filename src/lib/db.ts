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
  areaOptions: string[];
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
  type: 'CONTRIBUTION_APPROVAL_REQUIRED' | 'CONTRIBUTION_APPROVED' | 'HANDOVER_APPROVAL_REQUIRED' | 'MEMBERSHIP_REQUEST' | 'MEMBERSHIP_APPROVED';
  targetId: string;
  isRead: boolean;
  date: string;
}

export interface MembershipRequest {
  id: string;
  userName: string;
  userEmail: string;
  userArea?: string;
  requestedRole: 'MEMBER' | 'COLLECTOR';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
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
  settledBy?: string;
  settlementMode?: 'CASH' | 'UPI';
  settlementDate?: string;
  settlementNote?: string;
}

export interface ProgrammeItem {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  location?: string;
  photoUrl?: string;
  mediaType?: 'IMAGE' | 'YOUTUBE' | 'INSTAGRAM';
  embedUrl?: string;
  videoOrientation?: 'LANDSCAPE' | 'PORTRAIT';
  createdAt: string;
}

export interface DatabaseSchema {
  settings: AppSettings;
  users: User[];
  roleAssignments: Record<string, UserRoleAssignment>;
  contributions: Contribution[];
  notifications: NotificationItem[];
  handovers: Handover[];
  expenses: Expense[];
  programmes: ProgrammeItem[];
  membershipRequests: MembershipRequest[];
}

const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const dbPath = isVercel ? path.join('/tmp', 'db.json') : path.join(process.cwd(), 'data', 'db.json');

const SUPER_ADMIN_EMAIL = 'luhurenbaiclub@gmail.com';

const defaultSettings: AppSettings = {
  appTitle: 'Ganesh Puja - LBC',
  subTitle: 'Luhurachati Club',
  logoUrl: '/icon-192.png',
  themeColor: 'AMBER_ORANGE',
  targetGoalAmount: 200000,
  targetGoalLabel: 'Target Fund Goal',
  collectionButtonLabel: '+ Collection',
  spendButtonLabel: '+ Spend / Bill',
  handoverButtonLabel: 'Handover Cash',
  areaOptions: ['Sector 1 / Wing A', 'Sector 2 / Wing B', 'Sector 3 / Wing C', 'General Area']
};

const initialData: DatabaseSchema = {
  settings: defaultSettings,
  users: [
    { id: 'usr-0', name: 'Super Admin', email: SUPER_ADMIN_EMAIL, role: 'SUPER_ADMIN', area: 'Admin Central', phone: '+919999999999', createdAt: new Date().toISOString() }
  ],
  roleAssignments: {
    [SUPER_ADMIN_EMAIL]: { email: SUPER_ADMIN_EMAIL, role: 'SUPER_ADMIN', assignedBy: 'SYSTEM', updatedAt: new Date().toISOString() }
  },
  contributions: [],
  notifications: [],
  handovers: [],
  expenses: [],
  programmes: [],
  membershipRequests: []
};

export function getDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(path.dirname(dbPath))) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const raw = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.settings) parsed.settings = defaultSettings;
    if (!parsed.settings.areaOptions || !Array.isArray(parsed.settings.areaOptions)) {
      parsed.settings.areaOptions = defaultSettings.areaOptions;
    }
    if (!parsed.roleAssignments) parsed.roleAssignments = initialData.roleAssignments;
    if (!parsed.notifications) parsed.notifications = [];
    if (!parsed.programmes) parsed.programmes = [];
    if (!parsed.membershipRequests) parsed.membershipRequests = [];
    return parsed;
  } catch (err) {
    console.error('getDb filesystem error:', err);
    return initialData;
  }
}

export function saveDb(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(path.dirname(dbPath))) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('saveDb filesystem error:', err);
  }
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

    // Auto-link any historical contributions where memberName matches exact registered name
    let updatedContributions = false;
    db.contributions.forEach(c => {
      if (c.memberName && c.memberName.trim().toLowerCase() === name.trim().toLowerCase()) {
        c.memberId = user!.id;
        updatedContributions = true;
      }
    });

    saveDb(db);
  } else {
    let updated = false;
    if (name && user.name !== name) { user.name = name; updated = true; }
    if (image && user.image !== image) { user.image = image; updated = true; }
    
    // Check if there are any unlinked contributions matching memberName
    db.contributions.forEach(c => {
      if (c.memberName && c.memberName.trim().toLowerCase() === name.trim().toLowerCase() && c.memberId !== user!.id) {
        c.memberId = user!.id;
        updated = true;
      }
    });

    if (updated) saveDb(db);
  }

  return user;
}
