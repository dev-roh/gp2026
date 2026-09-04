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

declare global {
  var _cachedDb: DatabaseSchema | undefined;
}

const primaryDbPath = path.join(process.cwd(), 'data', 'db.json');
const tmpDbPath = path.join('/tmp', 'db.json');

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
  // 1. Return in-memory cached DB if already loaded in process
  if (global._cachedDb) {
    return global._cachedDb;
  }

  let dbData: DatabaseSchema | null = null;

  // 2. Try loading from /tmp/db.json (if written previously in this lambda environment)
  if (fs.existsSync(tmpDbPath)) {
    try {
      const raw = fs.readFileSync(tmpDbPath, 'utf8');
      dbData = JSON.parse(raw);
    } catch (err) {
      console.error('Error reading /tmp/db.json:', err);
    }
  }

  // 3. If not in /tmp, load from primary persistent seed file data/db.json
  if (!dbData && fs.existsSync(primaryDbPath)) {
    try {
      const raw = fs.readFileSync(primaryDbPath, 'utf8');
      dbData = JSON.parse(raw);
    } catch (err) {
      console.error('Error reading data/db.json:', err);
    }
  }

  // 4. Fallback to initialData if neither file exists
  if (!dbData) {
    dbData = initialData;
  }

  // Ensure default structures are populated
  if (!dbData.settings) dbData.settings = defaultSettings;
  if (!dbData.settings.areaOptions || !Array.isArray(dbData.settings.areaOptions)) {
    dbData.settings.areaOptions = defaultSettings.areaOptions;
  }
  if (!dbData.users) dbData.users = initialData.users;
  if (!dbData.roleAssignments) dbData.roleAssignments = initialData.roleAssignments;
  if (!dbData.contributions) dbData.contributions = [];
  if (!dbData.notifications) dbData.notifications = [];
  if (!dbData.handovers) dbData.handovers = [];
  if (!dbData.expenses) dbData.expenses = [];
  if (!dbData.programmes) dbData.programmes = [];
  if (!dbData.membershipRequests) dbData.membershipRequests = [];

  // Cache in process memory
  global._cachedDb = dbData;

  // Sync to /tmp for subsequent reads
  try {
    if (!fs.existsSync(path.dirname(tmpDbPath))) {
      fs.mkdirSync(path.dirname(tmpDbPath), { recursive: true });
    }
    fs.writeFileSync(tmpDbPath, JSON.stringify(dbData, null, 2));
  } catch (e) {
    // Ignore error
  }

  return dbData;
}

export function saveDb(data: DatabaseSchema) {
  // Update in-memory cache
  global._cachedDb = data;

  const jsonStr = JSON.stringify(data, null, 2);

  // Write to /tmp/db.json
  try {
    if (!fs.existsSync(path.dirname(tmpDbPath))) {
      fs.mkdirSync(path.dirname(tmpDbPath), { recursive: true });
    }
    fs.writeFileSync(tmpDbPath, jsonStr);
  } catch (err) {
    console.error('saveDb /tmp write error:', err);
  }

  // Also write to workspace data/db.json if writable
  try {
    if (!fs.existsSync(path.dirname(primaryDbPath))) {
      fs.mkdirSync(path.dirname(primaryDbPath), { recursive: true });
    }
    fs.writeFileSync(primaryDbPath, jsonStr);
  } catch (err) {
    // Silently catch on read-only serverless filesystem
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
