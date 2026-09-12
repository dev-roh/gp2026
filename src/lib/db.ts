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
  isManual?: boolean;
  linkedMemberIds?: string[];
  createdAt: string;
}

export interface UserRoleAssignment {
  email: string;
  role: 'SUPER_ADMIN' | 'TREASURER' | 'COLLECTOR' | 'MEMBER' | 'VIEW_ONLY';
  assignedBy: string;
  updatedAt: string;
}

export interface SponsorTier {
  id: string;
  name: string;
  minAmount: number;
  badge: string;
  color: string;
  benefits: string[];
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
  isPrivate?: boolean;
  isSponsorship?: boolean;
  sponsorCategory?: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  sponsorLogoUrl?: string;
  sponsorWebsiteUrl?: string;
  sponsorMapUrl?: string;
  sponsorPhone?: string;
}

export interface CollectorTransfer {
  id: string;
  contributionId?: string;
  contributionIds?: string[];
  amount: number;
  fromCollectorEmail: string;
  fromCollectorName: string;
  toCollectorEmail: string;
  toCollectorName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface NotificationItem {
  id: string;
  recipientEmail: string;
  title: string;
  message: string;
  type: 'CONTRIBUTION_APPROVAL_REQUIRED' | 'CONTRIBUTION_APPROVED' | 'HANDOVER_APPROVAL_REQUIRED' | 'MEMBERSHIP_REQUEST' | 'MEMBERSHIP_APPROVED' | 'COLLECTOR_TRANSFER_REQUEST' | 'COLLECTOR_TRANSFER_APPROVED';
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

export interface UserActivity {
  id: string;
  userEmail: string;
  userName: string;
  userRole: string;
  action: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
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
  collectorTransfers: CollectorTransfer[];
  userActivities?: UserActivity[];
}

import { createClient } from '@supabase/supabase-js';

declare global {
  var _cachedDb: DatabaseSchema | undefined;
}

const primaryDbPath = path.join(process.cwd(), 'data', 'db.json');
const tmpDbPath = path.join('/tmp', 'db.json');

const SUPER_ADMIN_EMAILS = ['luhurenbaiclub@gmail.com', 'luhurenbai@gmail.com'];
const SUPER_ADMIN_EMAIL = 'luhurenbaiclub@gmail.com';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient = null;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('[SENSITIVE]') && !supabaseKey.includes('[SENSITIVE]')) {
  try {
    const validUrl = new URL(supabaseUrl);
    if (validUrl.protocol === 'http:' || validUrl.protocol === 'https:') {
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            apikey: supabaseKey,
          },
        },
      });
    }
  } catch (e) {
    console.error('Invalid Supabase URL provided:', supabaseUrl);
  }
}

export const supabase = supabaseClient;

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
    { id: 'usr-0', name: 'Super Admin', email: SUPER_ADMIN_EMAIL, role: 'SUPER_ADMIN', area: 'Admin Central', phone: '+919999999999', createdAt: new Date().toISOString() },
    { id: 'usr-0b', name: 'Super Admin', email: 'luhurenbai@gmail.com', role: 'SUPER_ADMIN', area: 'Admin Central', phone: '+919999999999', createdAt: new Date().toISOString() }
  ],
  roleAssignments: {
    [SUPER_ADMIN_EMAIL]: { email: SUPER_ADMIN_EMAIL, role: 'SUPER_ADMIN', assignedBy: 'SYSTEM', updatedAt: new Date().toISOString() },
    'luhurenbai@gmail.com': { email: 'luhurenbai@gmail.com', role: 'SUPER_ADMIN', assignedBy: 'SYSTEM', updatedAt: new Date().toISOString() }
  },
  contributions: [],
  notifications: [],
  handovers: [],
  expenses: [],
  programmes: [],
  membershipRequests: [],
  collectorTransfers: []
};

const dbRecordId = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production' 
  ? 'main_production' 
  : 'main_development';

export async function getDbAsync(): Promise<DatabaseSchema> {
  if (supabase) {
    try {
        const [
        settingsRes,
        usersRes,
        rolesRes,
        contribsRes,
        expensesRes,
        handoversRes,
        transfersRes,
        programmesRes,
        mreqRes,
        notifRes,
        activityRes
      ] = await Promise.all([
        supabase.from('app_settings').select('*').single(),
        supabase.from('users').select('*'),
        supabase.from('role_assignments').select('*'),
        supabase.from('contributions').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('handovers').select('*').order('created_at', { ascending: false }),
        supabase.from('collector_transfers').select('*').order('created_at', { ascending: false }),
        supabase.from('programmes').select('*').order('date_time', { ascending: true }),
        supabase.from('membership_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('date', { ascending: false }),
        supabase.from('user_activities').select('*').order('timestamp', { ascending: false }).limit(100)
      ]);

      if (!usersRes.error && usersRes.data) {
        const settings = settingsRes.data ? {
          appTitle: settingsRes.data.app_title,
          subTitle: settingsRes.data.sub_title,
          logoUrl: settingsRes.data.logo_url,
          themeColor: settingsRes.data.theme_color,
          targetGoalAmount: Number(settingsRes.data.target_goal_amount),
          targetGoalLabel: settingsRes.data.target_goal_label,
          collectionButtonLabel: settingsRes.data.collection_button_label,
          spendButtonLabel: settingsRes.data.spend_button_label,
          handoverButtonLabel: settingsRes.data.handover_button_label,
          areaOptions: settingsRes.data.area_options || defaultSettings.areaOptions
        } as AppSettings : defaultSettings;

        const users: User[] = (usersRes.data || []).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          area: u.area || undefined,
          phone: u.phone || undefined,
          image: u.image || undefined,
          isManual: u.is_manual,
          createdAt: u.created_at
        }));

        const roleAssignments: Record<string, UserRoleAssignment> = {};
        (rolesRes.data || []).forEach(r => {
          roleAssignments[r.email.toLowerCase()] = {
            email: r.email,
            role: r.role,
            assignedBy: r.assigned_by,
            updatedAt: r.updated_at
          };
        });

        const contributions: Contribution[] = (contribsRes.data || []).map(c => ({
          id: c.id,
          receiptNo: c.receipt_no,
          amount: Number(c.amount),
          paymentMode: c.payment_mode,
          date: c.date,
          memberId: c.member_id || '',
          memberName: c.member_name,
          memberArea: c.member_area,
          collectorId: c.collector_id,
          collectorName: c.collector_name,
          status: c.status,
          approverEmail: c.approver_email || undefined,
          isSelfContribution: c.is_self_contribution,
          isPrivate: c.is_private,
          note: c.note || undefined,
          isSponsorship: c.is_sponsorship || false,
          sponsorCategory: c.sponsor_category || undefined,
          sponsorLogoUrl: c.sponsor_logo_url || undefined,
          sponsorWebsiteUrl: c.sponsor_website_url || undefined,
          sponsorMapUrl: c.sponsor_map_url || undefined,
          sponsorPhone: c.sponsor_phone || undefined
        }));

        const expenses: Expense[] = (expensesRes.data || []).map(e => ({
          id: e.id,
          title: e.title,
          category: e.category,
          amount: Number(e.amount),
          isOutofPocket: e.is_out_of_pocket,
          isReimbursed: e.is_reimbursed,
          paidById: e.paid_by_email,
          paidByName: e.paid_by_name,
          receiptUrl: e.receipt_url || undefined,
          date: e.date,
          createdAt: e.created_at
        }));

        const handovers: Handover[] = (handoversRes.data || []).map(h => ({
          id: h.id,
          amount: Number(h.amount),
          collectorId: h.collector_id,
          collectorName: h.collector_name,
          treasurerId: h.treasurer_id || undefined,
          treasurerName: h.treasurer_name || undefined,
          status: h.status,
          notes: h.notes || undefined,
          date: h.date,
          createdAt: h.created_at
        }));

        const collectorTransfers: CollectorTransfer[] = (transfersRes.data || []).map(t => ({
          id: t.id,
          contributionId: t.contribution_id || undefined,
          contributionIds: t.contribution_ids || undefined,
          amount: Number(t.amount),
          fromCollectorEmail: t.from_collector_email,
          fromCollectorName: t.from_collector_name,
          toCollectorEmail: t.to_collector_email,
          toCollectorName: t.to_collector_name,
          status: t.status,
          notes: t.notes || undefined,
          createdAt: t.created_at,
          decidedAt: t.decided_at || undefined
        }));

        const programmes: ProgrammeItem[] = (programmesRes.data || []).map(p => {
          const embedUrl = p.embed_url || (Array.isArray(p.video_urls) && p.video_urls.length > 0 ? p.video_urls[0] : undefined);
          const photoUrl = p.photo_url || (Array.isArray(p.photo_urls) && p.photo_urls.length > 0 ? p.photo_urls[0] : undefined);
          const mediaType = p.media_type || (embedUrl ? 'YOUTUBE' : (photoUrl ? 'IMAGE' : undefined));
          return {
            id: p.id,
            title: p.title,
            description: p.description || undefined,
            dateTime: p.date_time,
            location: p.location || undefined,
            photoUrl,
            mediaType,
            embedUrl,
            videoOrientation: p.video_orientation || 'PORTRAIT',
            createdAt: p.created_at
          };
        });

        const membershipRequests: MembershipRequest[] = (mreqRes.data || []).map(m => ({
          id: m.id,
          userName: m.user_name,
          userEmail: m.user_email,
          userArea: m.user_area || undefined,
          requestedRole: m.requested_role,
          status: m.status,
          createdAt: m.created_at,
          decidedBy: m.decided_by || undefined,
          decidedAt: m.decided_at || undefined
        }));

        const notifications: NotificationItem[] = (notifRes.data || []).map(n => ({
          id: n.id,
          recipientEmail: n.recipient_email,
          title: n.title,
          message: n.message,
          type: n.type,
          targetId: n.target_id || '',
          isRead: n.is_read,
          date: n.date
        }));

        const userActivities: UserActivity[] = (activityRes.data || []).map(a => ({
          id: a.id,
          userEmail: a.user_email,
          userName: a.user_name,
          userRole: a.user_role,
          action: a.action,
          details: a.details || undefined,
          ipAddress: a.ip_address || undefined,
          timestamp: a.timestamp
        }));

        const dbSchema: DatabaseSchema = {
          settings,
          users,
          roleAssignments,
          contributions,
          expenses,
          handovers,
          collectorTransfers,
          programmes,
          membershipRequests,
          notifications,
          userActivities
        };

        global._cachedDb = dbSchema;
        return dbSchema;
      }
    } catch (err) {
      console.error('Supabase relational fetch error:', err);
    }
  }

  return getDb();
}

export async function saveDbAsync(data: DatabaseSchema): Promise<void> {
  global._cachedDb = data;
  saveDb(data);

  if (supabase) {
    try {
      // 1. Sync Settings
      if (data.settings) {
        await supabase.from('app_settings').upsert({
          id: 'default',
          app_title: data.settings.appTitle,
          sub_title: data.settings.subTitle,
          logo_url: data.settings.logoUrl || null,
          theme_color: data.settings.themeColor,
          target_goal_amount: data.settings.targetGoalAmount,
          target_goal_label: data.settings.targetGoalLabel,
          collection_button_label: data.settings.collectionButtonLabel,
          spend_button_label: data.settings.spendButtonLabel,
          handover_button_label: data.settings.handoverButtonLabel,
          area_options: data.settings.areaOptions,
          updated_at: new Date().toISOString()
        });
      }

      // 2. Sync Users
      if (Array.isArray(data.users) && data.users.length > 0) {
        const usersPayload = data.users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email.toLowerCase(),
          role: u.role,
          area: u.area || null,
          phone: u.phone || null,
          image: u.image || null,
          is_manual: Boolean(u.isManual),
          created_at: u.createdAt || new Date().toISOString()
        }));
        await supabase.from('users').upsert(usersPayload);
      }

      // 3. Sync Role Assignments
      if (data.roleAssignments) {
        const rolesPayload = Object.values(data.roleAssignments).map(r => ({
          email: r.email.toLowerCase(),
          role: r.role,
          assigned_by: r.assignedBy,
          updated_at: r.updatedAt || new Date().toISOString()
        }));
        if (rolesPayload.length > 0) {
          await supabase.from('role_assignments').upsert(rolesPayload);
        }
      }

      // 4. Sync Contributions
      if (Array.isArray(data.contributions) && data.contributions.length > 0) {
        const contribsPayload = data.contributions.map(c => ({
          id: c.id,
          receipt_no: c.receiptNo,
          amount: c.amount,
          payment_mode: c.paymentMode,
          date: c.date || new Date().toISOString(),
          member_id: c.memberId || null,
          member_name: c.memberName,
          member_area: c.memberArea || 'General Area',
          collector_id: c.collectorId,
          collector_name: c.collectorName,
          status: c.status,
          approver_email: c.approverEmail || null,
          is_self_contribution: Boolean(c.isSelfContribution),
          is_private: Boolean(c.isPrivate),
          note: c.note || null,
          is_sponsorship: Boolean(c.isSponsorship),
          sponsor_category: c.sponsorCategory || null,
          sponsor_logo_url: c.sponsorLogoUrl || null,
          sponsor_website_url: c.sponsorWebsiteUrl || null,
          sponsor_map_url: c.sponsorMapUrl || null,
          sponsor_phone: c.sponsorPhone || null,
          created_at: c.date || new Date().toISOString()
        }));
        await supabase.from('contributions').upsert(contribsPayload);
      }

      // 5. Sync Expenses
      if (Array.isArray(data.expenses) && data.expenses.length > 0) {
        const expPayload = data.expenses.map(e => ({
          id: e.id,
          title: e.title,
          category: e.category,
          amount: e.amount,
          is_out_of_pocket: Boolean(e.isOutofPocket),
          is_reimbursed: Boolean(e.isReimbursed),
          paid_by_email: e.paidById,
          paid_by_name: e.paidByName,
          receipt_url: e.receiptUrl || null,
          date: e.date || new Date().toISOString(),
          created_at: e.date || new Date().toISOString()
        }));
        await supabase.from('expenses').upsert(expPayload);
      }

      // 6. Sync Handovers
      if (Array.isArray(data.handovers) && data.handovers.length > 0) {
        const handPayload = data.handovers.map(h => ({
          id: h.id,
          amount: h.amount,
          collector_id: h.collectorId,
          collector_name: h.collectorName,
          treasurer_id: h.treasurerId || null,
          treasurer_name: h.treasurerName || null,
          status: h.status,
          notes: h.notes || null,
          date: h.date || new Date().toISOString(),
          created_at: h.date || new Date().toISOString()
        }));
        await supabase.from('handovers').upsert(handPayload);
      }

      // 7. Sync Collector Transfers
      if (Array.isArray(data.collectorTransfers) && data.collectorTransfers.length > 0) {
        const transferPayload = data.collectorTransfers.map(t => ({
          id: t.id,
          contribution_id: t.contributionId || null,
          contribution_ids: t.contributionIds || [],
          amount: t.amount,
          from_collector_email: t.fromCollectorEmail,
          from_collector_name: t.fromCollectorName,
          to_collector_email: t.toCollectorEmail,
          to_collector_name: t.toCollectorName,
          status: t.status,
          notes: t.notes || null,
          created_at: t.createdAt || new Date().toISOString(),
          decided_at: t.decidedAt || null
        }));
        await supabase.from('collector_transfers').upsert(transferPayload);
      }

      // 8. Sync Programmes
      if (Array.isArray(data.programmes) && data.programmes.length > 0) {
        const progPayload = data.programmes.map(p => {
          const photoUrls = p.photoUrl ? [p.photoUrl] : [];
          const videoUrls = (p.embedUrl || (p.mediaType === 'YOUTUBE' && p.embedUrl)) ? [p.embedUrl] : [];
          return {
            id: p.id,
            title: p.title,
            description: p.description || null,
            date_time: p.dateTime || new Date().toISOString(),
            location: p.location || null,
            photo_urls: photoUrls,
            video_urls: videoUrls,
            photo_url: p.photoUrl || null,
            media_type: p.mediaType || (p.embedUrl ? 'YOUTUBE' : 'IMAGE'),
            embed_url: p.embedUrl || null,
            video_orientation: p.videoOrientation || 'PORTRAIT',
            created_by: 'Super Admin',
            created_at: p.createdAt || new Date().toISOString()
          };
        });
        await supabase.from('programmes').upsert(progPayload);
      }

      // 9. Sync Membership Requests
      if (Array.isArray(data.membershipRequests) && data.membershipRequests.length > 0) {
        const mreqPayload = data.membershipRequests.map(r => ({
          id: r.id,
          user_name: r.userName,
          user_email: r.userEmail,
          user_area: r.userArea || null,
          requested_role: r.requestedRole,
          status: r.status,
          decided_by: r.decidedBy || null,
          created_at: r.createdAt || new Date().toISOString(),
          decided_at: r.decidedAt || null
        }));
        await supabase.from('membership_requests').upsert(mreqPayload);
      }

      // 10. Sync Notifications
      if (Array.isArray(data.notifications) && data.notifications.length > 0) {
        const notifPayload = data.notifications.map(n => ({
          id: n.id,
          recipient_email: n.recipientEmail,
          title: n.title,
          message: n.message,
          type: n.type,
          target_id: n.targetId || null,
          is_read: Boolean(n.isRead),
          date: n.date || new Date().toISOString()
        }));
        await supabase.from('notifications').upsert(notifPayload);
      }

      // 11. Sync User Activities
      if (Array.isArray(data.userActivities) && data.userActivities.length > 0) {
        try {
          const activityPayload = data.userActivities.map(a => ({
            id: a.id,
            user_email: a.userEmail.toLowerCase(),
            user_name: a.userName,
            user_role: a.userRole,
            action: a.action,
            details: a.details || null,
            ip_address: a.ipAddress || null,
            timestamp: a.timestamp || new Date().toISOString()
          }));
          await supabase.from('user_activities').upsert(activityPayload);
        } catch (e) {
          // Gracefully handle if user_activities table is pending DDL creation
        }
      }
    } catch (err) {
      console.error('Supabase relational save error:', err);
    }
  }
}

export async function logUserActivity(
  userEmail: string,
  userName: string,
  userRole: string,
  action: string,
  details?: string,
  ipAddress?: string
): Promise<void> {
  try {
    const activityItem: UserActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userEmail: userEmail.toLowerCase(),
      userName,
      userRole,
      action,
      details,
      ipAddress,
      timestamp: new Date().toISOString()
    };

    if (supabase) {
      await supabase.from('user_activities').insert({
        id: activityItem.id,
        user_email: activityItem.userEmail,
        user_name: activityItem.userName,
        user_role: activityItem.userRole,
        action: activityItem.action,
        details: activityItem.details || null,
        ip_address: activityItem.ipAddress || null,
        timestamp: activityItem.timestamp
      });
    }

    const db = getDb();
    if (!db.userActivities) db.userActivities = [];
    db.userActivities.unshift(activityItem);
    if (db.userActivities.length > 500) db.userActivities = db.userActivities.slice(0, 500);
    saveDb(db);
  } catch (err) {
    console.error('Failed to log user activity:', err);
  }
}

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
  if (!dbData.collectorTransfers) dbData.collectorTransfers = [];

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
  if (SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase())) return 'SUPER_ADMIN';

  const db = getDb();
  const assignment = db.roleAssignments[email.toLowerCase()];
  if (assignment) {
    return assignment.role;
  }

  return 'VIEW_ONLY';
}

export async function registerOrUpdateUserAsync(name: string, email: string, image?: string): Promise<User> {
  const db = await getDbAsync();
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
    let matchedContributionsCount = 0;
    let matchedArea = 'General Area';
    db.contributions.forEach(c => {
      if (c.memberName && c.memberName.trim().toLowerCase() === name.trim().toLowerCase()) {
        c.memberId = user!.id;
        matchedContributionsCount++;
        if (c.memberArea && c.memberArea !== 'General Area') {
          matchedArea = c.memberArea;
        }
      }
    });

    if (matchedArea !== 'General Area') {
      user.area = matchedArea;
    }

    // If user is new with VIEW_ONLY role and has existing collections or matching name, auto request MEMBER role
    if (role === 'VIEW_ONLY' && matchedContributionsCount > 0) {
      const existingReq = db.membershipRequests.find(r => r.userEmail.toLowerCase() === normalizedEmail && r.status === 'PENDING');
      if (!existingReq) {
        db.membershipRequests.push({
          id: `req-${Date.now()}`,
          userName: name,
          userEmail: normalizedEmail,
          userArea: user.area,
          requestedRole: 'MEMBER',
          status: 'PENDING',
          createdAt: new Date().toISOString()
        });

        // Notify Super Admin
        db.notifications.push({
          id: `notif-${Date.now()}`,
          recipientEmail: SUPER_ADMIN_EMAIL,
          title: 'Membership Auto-Request',
          message: `${name} (${normalizedEmail}) matched ${matchedContributionsCount} collection record(s). MEMBER approval requested.`,
          type: 'MEMBERSHIP_REQUEST',
          targetId: normalizedEmail,
          isRead: false,
          date: new Date().toISOString()
        });
      }
    }

    await saveDbAsync(db);
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

    if (updated) await saveDbAsync(db);
  }

  return user;
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
    let matchedContributionsCount = 0;
    let matchedArea = 'General Area';
    db.contributions.forEach(c => {
      if (c.memberName && c.memberName.trim().toLowerCase() === name.trim().toLowerCase()) {
        c.memberId = user!.id;
        matchedContributionsCount++;
        if (c.memberArea && c.memberArea !== 'General Area') {
          matchedArea = c.memberArea;
        }
      }
    });

    if (matchedArea !== 'General Area') {
      user.area = matchedArea;
    }

    // If user is new with VIEW_ONLY role and has existing collections, auto request MEMBER role
    if (role === 'VIEW_ONLY' && matchedContributionsCount > 0) {
      const existingReq = db.membershipRequests.find(r => r.userEmail.toLowerCase() === normalizedEmail && r.status === 'PENDING');
      if (!existingReq) {
        db.membershipRequests.push({
          id: `req-${Date.now()}`,
          userName: name,
          userEmail: normalizedEmail,
          userArea: user.area,
          requestedRole: 'MEMBER',
          status: 'PENDING',
          createdAt: new Date().toISOString()
        });

        db.notifications.push({
          id: `notif-${Date.now()}`,
          recipientEmail: SUPER_ADMIN_EMAIL,
          title: 'Membership Auto-Request',
          message: `${name} (${normalizedEmail}) matched ${matchedContributionsCount} collection record(s). MEMBER approval requested.`,
          type: 'MEMBERSHIP_REQUEST',
          targetId: normalizedEmail,
          isRead: false,
          date: new Date().toISOString()
        });
      }
    }

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
