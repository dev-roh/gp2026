'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { 
  Wallet, 
  TrendingDown, 
  Clock, 
  PlusCircle, 
  Share2, 
  Download, 
  Printer, 
  LogOut,
  Lock,
  ShieldCheck,
  Palette,
  Image as ImageIcon,
  Sliders,
  CheckCircle2,
  Bell,
  UserCheck,
  Users
} from 'lucide-react';
import { AppSettings, User as DbUser } from '@/lib/db';

interface FinanceSummary {
  totalCollected: number;
  totalSpent: number;
  netTreasuryBalance: number;
  pendingHandovers: number;
  pendingReimbursements: number;
  targetGoal: number;
}

interface CollectorBalance {
  collectorId: string;
  collectorName: string;
  collectorArea: string;
  cashInHand: number;
  pendingHandoverAmount: number;
}

interface Contribution {
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
}

interface Handover {
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

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  isOutofPocket: boolean;
  isReimbursed: boolean;
  date: string;
  paidById: string;
  paidByName: string;
  settledBy?: string;
  settlementMode?: 'CASH' | 'UPI';
  settlementDate?: string;
  settlementNote?: string;
}

interface RoleAssignment {
  email: string;
  role: string;
  assignedBy: string;
  updatedAt: string;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'collectors' | 'contributions' | 'expenses' | 'reimbursements' | 'approvals' | 'admin' | 'branding'>('overview');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [collectorBalances, setCollectorBalances] = useState<CollectorBalance[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [pendingApprovalsForMe, setPendingApprovalsForMe] = useState<Contribution[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);

  // Collectors and Treasurers List for tagging
  const [collectorsList, setCollectorsList] = useState<DbUser[]>([]);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    appTitle: 'GP 2026 Finance',
    subTitle: 'gp2026.luhurachati.com',
    logoUrl: '/icon-192.png',
    themeColor: 'AMBER_ORANGE',
    targetGoalAmount: 200000,
    targetGoalLabel: 'Target Fund Goal',
    collectionButtonLabel: '+ Collection',
    spendButtonLabel: '+ Spend / Bill',
    handoverButtonLabel: 'Handover Cash',
    areaOptions: ['Sector 1 / Wing A', 'Sector 2 / Wing B', 'Sector 3 / Wing C', 'General Area']
  });

  const [settingsMsg, setSettingsMsg] = useState('');

  // Super Admin Role State
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [targetEmail, setTargetEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'SUPER_ADMIN' | 'TREASURER' | 'COLLECTOR' | 'MEMBER' | 'VIEW_ONLY'>('COLLECTOR');
  const [roleMsg, setRoleMsg] = useState('');

  // Modals & Receipts
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showSelfContribution, setShowSelfContribution] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddHandover, setShowAddHandover] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Contribution | null>(null);
  const [selectedHandover, setSelectedHandover] = useState<Handover | null>(null);

  // Form states
  const [contribForm, setContribForm] = useState({
    memberName: '',
    memberArea: '',
    amount: '',
    paymentMode: 'CASH' as 'CASH' | 'UPI' | 'BANK_TRANSFER',
    note: ''
  });

  const [selfContribForm, setSelfContribForm] = useState({
    amount: '',
    paymentMode: 'UPI' as 'CASH' | 'UPI' | 'BANK_TRANSFER',
    memberArea: '',
    taggedCollectorEmail: '',
    note: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'General',
    amount: '',
    isOutofPocket: true
  });

  const [handoverForm, setHandoverForm] = useState({
    amount: '',
    collectorArea: 'Sector 1 / Wing A',
    notes: ''
  });

  const fetchUsersDirectory = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setCollectorsList(data.collectorsAndTreasurers || []);
        if (data.collectorsAndTreasurers?.length > 0) {
          setSelfContribForm(prev => ({ ...prev, taggedCollectorEmail: data.collectorsAndTreasurers[0].email }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      setSummary(data.summary);
      setCollectorBalances(data.collectorBalances);
      setContributions(data.latestContributions);
      setPendingApprovalsForMe(data.pendingApprovalsForMe || []);
      setExpenses(data.latestExpenses);
      setHandovers(data.handovers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleAssignments = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setRoleAssignments(data.roleAssignments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchFinanceData();
      fetchUsersDirectory();
      if ((session.user as any)?.role === 'SUPER_ADMIN') {
        fetchRoleAssignments();
      }
    }
  }, [session]);

  const handleSelfContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfContribForm.amount) return;

    const selectedCollector = collectorsList.find(c => c.email.toLowerCase() === selfContribForm.taggedCollectorEmail.toLowerCase());

    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ADD_SELF_CONTRIBUTION',
        data: {
          memberName: session?.user?.name || 'Member',
          memberArea: selfContribForm.memberArea || 'General Area',
          amount: parseFloat(selfContribForm.amount),
          paymentMode: selfContribForm.paymentMode,
          collectorId: selectedCollector?.email || 'luhurenbaiclub@gmail.com',
          collectorName: selectedCollector?.name || 'Super Admin',
          note: selfContribForm.note,
          memberId: session?.user?.email
        }
      })
    });

    const result = await res.json();
    if (res.ok) {
      setShowSelfContribution(false);
      setSelfContribForm({ amount: '', paymentMode: 'UPI', memberArea: '', taggedCollectorEmail: '', note: '' });
      fetchFinanceData();
      alert(result.status === 'APPROVED' 
        ? 'Contribution recorded and approved!' 
        : 'Contribution submitted! Sent for verification approval.');
    } else {
      alert(result.error || 'Failed to submit contribution');
    }
  };

  const handleDecideContribution = async (contributionId: string, decision: 'APPROVE' | 'REJECT') => {
    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'DECIDE_CONTRIBUTION_APPROVAL',
        data: { contributionId, decision }
      })
    });
    const result = await res.json();
    if (res.ok) {
      fetchFinanceData();
    } else {
      alert(result.error || 'Failed to decide approval');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsMsg('Branding & Customization saved successfully!');
        fetchFinanceData();
      } else {
        setSettingsMsg(`Error: ${data.error || 'Failed to save settings'}`);
      }
    } catch (err: any) {
      setSettingsMsg(`Error: ${err.message}`);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail) return;

    setRoleMsg('');
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetEmail,
        newRole: selectedRole
      })
    });

    const data = await res.json();
    if (res.ok) {
      setRoleMsg(`Successfully updated role for ${targetEmail} to ${selectedRole}`);
      setTargetEmail('');
      fetchRoleAssignments();
    } else {
      setRoleMsg(`Error: ${data.error || 'Failed to update role'}`);
    }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribForm.memberName || !contribForm.amount) return;

    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ADD_CONTRIBUTION',
        data: {
          memberName: contribForm.memberName,
          memberArea: contribForm.memberArea || 'General Area',
          amount: parseFloat(contribForm.amount),
          paymentMode: contribForm.paymentMode,
          collectorId: session?.user?.email || 'usr-2',
          collectorName: session?.user?.name || 'Collector',
          note: contribForm.note
        }
      })
    });

    const result = await res.json();
    if (res.ok) {
      setShowAddContribution(false);
      setContribForm({ memberName: '', memberArea: '', amount: '', paymentMode: 'CASH', note: '' });
      fetchFinanceData();
      if (result?.item) {
        setSelectedReceipt(result.item);
      }
    } else {
      alert(result.error || 'Operation failed');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) return;

    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ADD_EXPENSE',
        data: {
          title: expenseForm.title,
          category: expenseForm.category,
          amount: parseFloat(expenseForm.amount),
          isOutofPocket: expenseForm.isOutofPocket,
          paidById: session?.user?.email || 'usr-2',
          paidByName: session?.user?.name || 'Member'
        }
      })
    });

    const result = await res.json();
    if (res.ok) {
      setShowAddExpense(false);
      setExpenseForm({ title: '', category: 'General', amount: '', isOutofPocket: true });
      fetchFinanceData();
    } else {
      alert(result.error || 'Operation failed');
    }
  };

  const handleAddHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverForm.amount) return;

    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'REQUEST_HANDOVER',
        data: {
          collectorId: session?.user?.email || 'usr-2',
          collectorName: session?.user?.name || 'Collector',
          collectorArea: handoverForm.collectorArea || 'General Area',
          amount: parseFloat(handoverForm.amount),
          notes: handoverForm.notes
        }
      })
    });

    const result = await res.json();
    if (res.ok) {
      setShowAddHandover(false);
      setHandoverForm({ amount: '', collectorArea: 'Sector 1 / Wing A', notes: '' });
      fetchFinanceData();
      if (result?.item) {
        setSelectedHandover(result.item);
      }
    } else {
      alert(result.error || 'Operation failed');
    }
  };

  const handleApproveHandover = async (handoverId: string) => {
    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'APPROVE_HANDOVER',
        data: { handoverId, treasurerId: session?.user?.email || 'usr-1' }
      })
    });
    const result = await res.json();
    if (res.ok) fetchFinanceData();
    else alert(result.error);
  };

  const handleSettleReimbursement = async (expenseId: string) => {
    const mode = prompt('Enter payment settlement mode (CASH or UPI):', 'UPI')?.toUpperCase();
    if (!mode || (mode !== 'CASH' && mode !== 'UPI')) return;

    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SETTLE_REIMBURSEMENT',
        data: { expenseId, settlementMode: mode }
      })
    });
    const result = await res.json();
    if (res.ok) fetchFinanceData();
    else alert(result.error);
  };

  const handleResetDatabase = async () => {
    if (!confirm('Are you sure you want to delete ALL test contributions, expenses, handovers, and reset the application for a fresh start? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/roles', { method: 'DELETE' });
      const result = await res.json();
      if (res.ok) {
        alert('Database successfully reset for a fresh start!');
        fetchFinanceData();
      } else {
        alert(result.error || 'Failed to reset database.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while resetting database.');
    }
  };

  const generateWhatsAppShare = (c: Contribution) => {
    const text = `*${settings.appTitle} Payment Receipt* 🐘\n\n` +
      `Receipt No: *${c.receiptNo}*\n` +
      `Received From: *${c.memberName} (Area: ${c.memberArea})*\n` +
      `Amount Received: *₹${c.amount.toLocaleString()}*\n` +
      `Payment Mode: *${c.paymentMode}*\n` +
      `Collector: *${c.collectorName}*\n` +
      `Date: *${new Date(c.date).toLocaleDateString()}*\n\n` +
      `Thank you for your generous contribution!\n` +
      `View portal: https://gp2026.luhurachati.com`;
    
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const generateHandoverWhatsAppShare = (h: Handover) => {
    const text = `*${settings.appTitle} - Cash Handover Voucher* 💸\n\n` +
      `Voucher ID: *${h.id}*\n` +
      `Collector: *${h.collectorName} (Area: ${h.collectorArea || 'General Area'})*\n` +
      `Handover Amount: *₹${h.amount.toLocaleString()}*\n` +
      `Status: *${h.status}*\n` +
      `Approved By: *${h.treasurerName || 'Treasurer'}*\n` +
      `Date: *${new Date(h.date).toLocaleDateString()}*\n\n` +
      `View portal: https://gp2026.luhurachati.com`;
    
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // Dynamic Theme Colors
  const getThemeClasses = () => {
    switch (settings.themeColor) {
      case 'EMERALD_GREEN':
        return { primary: 'from-emerald-500 to-teal-600', text: 'text-emerald-400', bg: 'bg-emerald-600', border: 'border-emerald-500/30' };
      case 'SLATE_BLUE':
        return { primary: 'from-blue-500 to-indigo-600', text: 'text-blue-400', bg: 'bg-blue-600', border: 'border-blue-500/30' };
      case 'PURPLE_GOLD':
        return { primary: 'from-purple-500 to-amber-500', text: 'text-purple-400', bg: 'bg-purple-600', border: 'border-purple-500/30' };
      case 'AMBER_ORANGE':
      default:
        return { primary: 'from-orange-500 to-amber-400', text: 'text-orange-400', bg: 'bg-orange-600', border: 'border-orange-500/30' };
    }
  };

  const theme = getThemeClasses();

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Verifying security credentials...</p>
      </div>
    );
  }

  // Mandatory Google OAuth Login Screen
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-5">
        {settings.logoUrl ? (
          <img src={settings.logoUrl} alt="Logo" className="w-20 h-20 rounded-2xl border border-amber-500/30 object-cover shadow-2xl animate-bounce" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-3xl text-slate-950 shadow-2xl animate-bounce">
            🐘
          </div>
        )}

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-100">{settings.appTitle}</h2>
          <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider">Financial Transparency Portal</p>
          <p className="text-[11px] text-slate-400 max-w-xs pt-1">
            Access to collection records, treasury vaults, and reimbursement ledgers is restricted to verified members.
          </p>
        </div>

        <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-center space-x-2 text-emerald-400 text-xs font-medium">
            <Lock className="w-4 h-4" />
            <span>Google OAuth 2.0 Protection</span>
          </div>

          <button
            onClick={() => signIn('google')}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-extrabold text-xs shadow-lg flex items-center justify-center space-x-2 transition transform active:scale-95"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V13.4h6.887c-.58 3.424-3.57 5.767-6.887 5.767-4.12 0-7.464-3.344-7.464-7.464S8.12 4.238 12.24 4.238c1.86 0 3.55.674 4.86 1.785l2.454-2.453C17.754 1.83 15.16.8 12.24.8 6.03.8 1 5.83 1 12.04s5.03 11.24 11.24 11.24c6.49 0 10.8-4.56 10.8-10.98 0-.74-.08-1.46-.2-2.015H12.24z"/>
            </svg>
            <span>Sign in with Google Account</span>
          </button>

          <p className="text-[10px] text-slate-500">Authorized redirect: {settings.subTitle}</p>
        </div>
      </div>
    );
  }

  const userRole = (session?.user as any)?.role || 'VIEW_ONLY';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isTreasurer = userRole === 'TREASURER' || isSuperAdmin;
  const isCollector = userRole === 'COLLECTOR' || isTreasurer;
  const isMember = userRole === 'MEMBER' || isCollector;
  const isViewOnly = userRole === 'VIEW_ONLY';

  const targetProgress = summary ? Math.min(100, Math.round((summary.totalCollected / (summary.targetGoal || 200000)) * 100)) : 0;

  return (
    <div className="space-y-4">
      {/* Authenticated User Header Banner with Notification Center */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
        <div className="flex items-center space-x-2">
          {session.user?.image ? (
            <img src={session.user.image} alt="User avatar" className="w-7 h-7 rounded-full border border-orange-500/50" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center font-bold text-slate-950 text-xs">
              {session.user?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <p className="font-bold text-slate-200 leading-none">{session.user?.name}</p>
            <span className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${isViewOnly ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
              Role: {userRole}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Pending Approvals Bell Icon */}
          {pendingApprovalsForMe.length > 0 && (
            <button 
              onClick={() => setActiveTab('approvals')}
              className="relative p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 animate-pulse"
              title="Pending Verification Approvals"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold flex items-center justify-center">
                {pendingApprovalsForMe.length}
              </span>
            </button>
          )}

          <button 
            onClick={() => signOut()}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Self-Contribution Quick Action Banner for ALL Users */}
      <div className="bg-gradient-to-r from-orange-950/60 to-amber-950/60 border border-orange-500/30 p-3 rounded-2xl flex items-center justify-between shadow-lg">
        <div>
          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1">
            <PlusCircle className="w-4 h-4 text-orange-400" /> Pay / Record My Chanda
          </h3>
          <p className="text-[10px] text-slate-400">Contribute directly and tag a collector for instant verification</p>
        </div>
        <button 
          onClick={() => setShowSelfContribution(true)}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-extrabold text-xs shadow hover:from-orange-600 hover:to-amber-500 transition"
        >
          + Record My Contribution
        </button>
      </div>

      {/* Target Goal & Quick Actions Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-xs font-semibold ${theme.text} uppercase tracking-wider`}>{settings.targetGoalLabel}</span>
          <span className="text-xs font-bold text-slate-300">₹{summary?.totalCollected.toLocaleString()} / ₹{(summary?.targetGoal || 200000).toLocaleString()}</span>
        </div>
        
        <div className="w-full bg-slate-800 rounded-full h-3 mb-3 overflow-hidden p-0.5 border border-slate-700">
          <div className={`bg-gradient-to-r ${theme.primary} h-2 rounded-full transition-all duration-500 shadow-sm`} style={{ width: `${targetProgress}%` }}></div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-slate-850 border border-slate-800 p-2.5 rounded-xl">
            <p className="text-slate-400 text-[11px]">Net Treasury Vault</p>
            <p className="text-base font-extrabold text-emerald-400 mt-0.5">₹{summary?.netTreasuryBalance.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-slate-850 border border-slate-800 p-2.5 rounded-xl">
            <p className="text-slate-400 text-[11px]">Total Expenses</p>
            <p className="text-base font-extrabold text-rose-400 mt-0.5">₹{summary?.totalSpent.toLocaleString() || '0'}</p>
          </div>
        </div>

        {/* Action Buttons - Role Scoped */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80">
          {isCollector ? (
            <button 
              onClick={() => setShowAddContribution(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 text-[11px] font-medium transition"
            >
              <PlusCircle className="w-4 h-4 mb-1 text-orange-400" />
              {settings.collectionButtonLabel}
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-600 text-[11px] font-medium cursor-not-allowed">
              <Lock className="w-4 h-4 mb-1 text-slate-600" />
              {settings.collectionButtonLabel}
            </div>
          )}

          {isMember ? (
            <button 
              onClick={() => setShowAddExpense(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-[11px] font-medium transition"
            >
              <TrendingDown className="w-4 h-4 mb-1 text-rose-400" />
              {settings.spendButtonLabel}
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-600 text-[11px] font-medium cursor-not-allowed">
              <Lock className="w-4 h-4 mb-1 text-slate-600" />
              {settings.spendButtonLabel}
            </div>
          )}

          <a 
            href="/api/finance?format=csv"
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium transition"
          >
            <Download className="w-4 h-4 mb-1 text-emerald-400" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Mobile Tab Segmented Controls */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner text-xs font-medium overflow-x-auto">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`flex-1 py-2 px-3 rounded-lg text-center whitespace-nowrap transition ${activeTab === 'overview' ? `${theme.bg} text-white font-bold shadow` : 'text-slate-400 hover:text-slate-200'}`}
        >
          Overview
        </button>

        {pendingApprovalsForMe.length > 0 && (
          <button 
            onClick={() => setActiveTab('approvals')} 
            className={`flex-1 py-2 px-3 rounded-lg text-center whitespace-nowrap transition flex items-center justify-center gap-1 ${activeTab === 'approvals' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-amber-400 hover:text-amber-200'}`}
          >
            <span>Approvals</span>
            <span className="bg-amber-950 text-amber-200 text-[9px] px-1.5 py-0.2 rounded-full font-extrabold">{pendingApprovalsForMe.length}</span>
          </button>
        )}

        <button 
          onClick={() => setActiveTab('collectors')} 
          className={`flex-1 py-2 px-3 rounded-lg text-center whitespace-nowrap transition ${activeTab === 'collectors' ? `${theme.bg} text-white font-bold shadow` : 'text-slate-400 hover:text-slate-200'}`}
        >
          Collectors
        </button>
        <button 
          onClick={() => setActiveTab('contributions')} 
          className={`flex-1 py-2 px-3 rounded-lg text-center whitespace-nowrap transition ${activeTab === 'contributions' ? `${theme.bg} text-white font-bold shadow` : 'text-slate-400 hover:text-slate-200'}`}
        >
          Collections
        </button>
        <button 
          onClick={() => setActiveTab('expenses')} 
          className={`flex-1 py-2 px-3 rounded-lg text-center whitespace-nowrap transition ${activeTab === 'expenses' ? `${theme.bg} text-white font-bold shadow` : 'text-slate-400 hover:text-slate-200'}`}
        >
          Expenses
        </button>
        <button 
          onClick={() => setActiveTab('reimbursements')} 
          className={`flex-1 py-2 px-3 rounded-lg text-center whitespace-nowrap transition flex items-center justify-center space-x-1 ${activeTab === 'reimbursements' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-emerald-400 hover:text-emerald-200'}`}
        >
          <span>Reimbursements</span>
          {expenses.filter(e => e.isOutofPocket && !e.isReimbursed).length > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-emerald-500 text-slate-950 font-extrabold">
              {expenses.filter(e => e.isOutofPocket && !e.isReimbursed).length}
            </span>
          )}
        </button>

        {isSuperAdmin && (
          <>
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`flex-1 py-2 px-3 rounded-lg text-center whitespace-nowrap transition ${activeTab === 'admin' ? 'bg-purple-600 text-white font-bold shadow' : 'text-purple-400 hover:text-purple-200'}`}
            >
              Roles
            </button>
            <button 
              onClick={() => setActiveTab('branding')} 
              className={`flex-1 py-2 px-3 rounded-lg text-center whitespace-nowrap transition ${activeTab === 'branding' ? 'bg-amber-600 text-white font-bold shadow' : 'text-amber-400 hover:text-amber-200'}`}
            >
              Branding
            </button>
          </>
        )}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl">
              <div className="flex items-center text-amber-400 text-xs font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Pending Handovers
              </div>
              <p className="text-xl font-bold text-slate-100">₹{summary?.pendingHandovers.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Cash waiting approval</p>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 p-3.5 rounded-xl">
              <div className="flex items-center text-purple-400 text-xs font-semibold mb-1">
                <Wallet className="w-3.5 h-3.5 mr-1" />
                Owed Out-of-Pocket
              </div>
              <p className="text-xl font-bold text-slate-100">₹{summary?.pendingReimbursements.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Spent by members to reimburse</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Recent Approved Contributions</span>
                <button onClick={() => setActiveTab('contributions')} className="text-orange-400 text-[11px] normal-case hover:underline">View All →</button>
              </h3>
              <div className="divide-y divide-slate-800">
                {contributions.filter(c => c.status === 'APPROVED').slice(0, 5).map((c) => (
                  <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{c.memberName} <span className="text-slate-400 font-normal">({c.memberArea})</span></p>
                      <p className="text-[10px] text-slate-400">Collected by: {c.collectorName}</p>
                    </div>
                    <div className="text-right flex items-center space-x-2">
                      <div>
                        <p className="font-bold text-emerald-400">+₹{c.amount.toLocaleString()}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{c.paymentMode}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedReceipt(c)}
                        className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
                        title="View Digital Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Recent Expenses Log</span>
                <button onClick={() => setActiveTab('expenses')} className="text-rose-400 text-[11px] normal-case hover:underline">View All →</button>
              </h3>
              <div className="divide-y divide-slate-800">
                {expenses.slice(0, 5).map((exp) => (
                  <div key={exp.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{exp.title}</p>
                      <p className="text-[10px] text-slate-400">Paid by: {exp.paidByName} ({exp.category})</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rose-400">₹{exp.amount.toLocaleString()}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${exp.isOutofPocket ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'}`}>
                        {exp.isOutofPocket ? 'Out of pocket' : 'Direct'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Pending Approvals Queue */}
      {activeTab === 'approvals' && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-3 shadow-md space-y-3 text-xs">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">Pending Verification Approvals</h3>
          </div>

          {pendingApprovalsForMe.length === 0 ? (
            <p className="text-slate-500 text-xs py-2">No pending approvals waiting your verification.</p>
          ) : (
            <div className="space-y-2.5">
              {pendingApprovalsForMe.map((item) => (
                <div key={item.id} className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-200">{item.memberName}</p>
                      <p className="text-[10px] text-slate-400">Area: {item.memberArea}</p>
                      <p className="text-[10px] text-slate-400">Note: {item.note || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-amber-400 text-sm">₹{item.amount.toLocaleString()}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{item.paymentMode}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => handleDecideContribution(item.id, 'APPROVE')}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow text-xs flex items-center justify-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify & Approve</span>
                    </button>
                    <button 
                      onClick={() => handleDecideContribution(item.id, 'REJECT')}
                      className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Collectors */}
      {activeTab === 'collectors' && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Collector Cash Balances</h3>
              {isCollector && (
                <button 
                  onClick={() => setShowAddHandover(true)}
                  className="text-xs px-2.5 py-1 rounded bg-cyan-600 text-white font-medium shadow"
                >
                  + {settings.handoverButtonLabel}
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-800">
              {collectorBalances.map((col) => (
                <div key={col.collectorId} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{col.collectorName}</p>
                    <p className="text-[10px] text-slate-400">Area: {col.collectorArea}</p>
                    <p className="text-[10px] text-amber-400">Pending Handover: ₹{col.pendingHandoverAmount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Cash in hand</span>
                    <p className="font-bold text-base text-amber-300">₹{col.cashInHand.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Handover Approval Requests & Vouchers</h3>
            {handovers.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No handover requests logged.</p>
            ) : (
              <div className="space-y-2">
                {handovers.map((h) => (
                  <div key={h.id} className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-200">{h.collectorName}</p>
                      <p className="text-[10px] text-slate-400">Area: {h.collectorArea || 'General Area'}</p>
                      <p className="text-[10px] text-slate-400">Notes: {h.notes || 'N/A'}</p>
                      <span className={`inline-block text-[9px] px-1.5 py-0.5 mt-1 rounded font-medium ${h.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {h.status}
                      </span>
                    </div>
                    <div className="text-right flex items-center space-x-2">
                      <div>
                        <p className="font-bold text-amber-400 mb-1">₹{h.amount.toLocaleString()}</p>
                        {h.status === 'PENDING' && isTreasurer && (
                          <button 
                            onClick={() => handleApproveHandover(h.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                      <button 
                        onClick={() => setSelectedHandover(h)}
                        className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"
                        title="View Handover Voucher"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Collections */}
      {activeTab === 'contributions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">All Collections Logged</h3>
            {isCollector && (
              <button 
                onClick={() => setShowAddContribution(true)}
                className="text-xs px-2.5 py-1 rounded bg-orange-600 text-white font-medium shadow"
              >
                {settings.collectionButtonLabel}
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-800">
            {contributions.map((c) => (
              <div key={c.id} className="py-2.5 text-xs flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-200">{c.memberName}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">{c.memberArea}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Receipt: <span className="text-slate-300 font-mono">{c.receiptNo}</span></p>
                  <div className="flex gap-1.5 mt-1">
                    <span className="text-[9px] text-slate-500">Collector: {c.collectorName}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${c.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
                <div className="text-right flex items-center space-x-2">
                  <div>
                    <p className="font-bold text-emerald-400 text-sm">₹{c.amount.toLocaleString()}</p>
                    <span className="text-[9px] text-slate-400">{c.paymentMode}</span>
                  </div>
                  {c.status === 'APPROVED' && (
                    <button 
                      onClick={() => setSelectedReceipt(c)}
                      className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
                      title="View Digital Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Expenses */}
      {activeTab === 'expenses' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Puja Expenses & Out-of-Pocket</h3>
            {isMember && (
              <button 
                onClick={() => setShowAddExpense(true)}
                className="text-xs px-2.5 py-1 rounded bg-rose-600 text-white font-medium shadow"
              >
                {settings.spendButtonLabel}
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-800">
            {expenses.map((exp) => (
              <div key={exp.id} className="py-2.5 text-xs flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-200">{exp.title}</p>
                  <p className="text-[10px] text-slate-400">Paid by: {exp.paidByName}</p>
                  <div className="flex gap-1 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{exp.category}</span>
                    {exp.isOutofPocket && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${exp.isReimbursed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'}`}>
                        {exp.isReimbursed ? 'Reimbursed' : 'Owed Out-of-pocket'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-rose-400 text-sm">₹{exp.amount.toLocaleString()}</p>
                  {exp.isOutofPocket && !exp.isReimbursed && isTreasurer && (
                    <button 
                      onClick={() => handleSettleReimbursement(exp.id)}
                      className="mt-1 px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-bold"
                    >
                      Settle Balance
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Reimbursements */}
      {activeTab === 'reimbursements' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Unsettled OOP Claims</p>
              <p className="text-xl font-extrabold text-purple-300 mt-1">
                ₹{expenses.filter(e => e.isOutofPocket && !e.isReimbursed).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </p>
              <p className="text-[9px] text-slate-500">{expenses.filter(e => e.isOutofPocket && !e.isReimbursed).length} claims pending</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Total Reimbursed</p>
              <p className="text-xl font-extrabold text-emerald-300 mt-1">
                ₹{expenses.filter(e => e.isOutofPocket && e.isReimbursed).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </p>
              <p className="text-[9px] text-slate-500">{expenses.filter(e => e.isOutofPocket && e.isReimbursed).length} claims settled</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <h3 className="font-bold text-slate-200 text-xs mb-3">Out-Of-Pocket Expense Claims Ledger</h3>
            {expenses.filter(e => e.isOutofPocket).length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No out-of-pocket expenses logged yet.</p>
            ) : (
              <div className="space-y-3 divide-y divide-slate-800/60">
                {expenses.filter(e => e.isOutofPocket).map((exp) => (
                  <div key={exp.id} className="pt-3 first:pt-0 flex justify-between items-start">
                    <div className="space-y-1 max-w-[65%]">
                      <p className="font-bold text-slate-200 text-xs">{exp.title}</p>
                      <p className="text-[10px] text-slate-400">Claimant: <span className="text-orange-400 font-medium">{exp.paidByName}</span></p>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{exp.category}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${exp.isReimbursed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                          {exp.isReimbursed ? '✅ Reimbursed' : '⏳ Pending Payment'}
                        </span>
                      </div>
                      {exp.isReimbursed && exp.settlementDate && (
                        <p className="text-[9px] text-slate-500 italic">
                          Settled via {exp.settlementMode || 'CASH'} on {new Date(exp.settlementDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <p className="font-extrabold text-amber-400 text-sm">₹{exp.amount.toLocaleString()}</p>
                      {!exp.isReimbursed && isTreasurer ? (
                        <button
                          onClick={() => handleSettleReimbursement(exp.id)}
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 text-[10px] font-extrabold shadow flex items-center space-x-1 ml-auto"
                        >
                          <span>Settle & Pay</span>
                        </button>
                      ) : !exp.isReimbursed ? (
                        <span className="text-[9px] text-slate-500">Requires Treasurer approval</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Super Admin Roles */}
      {activeTab === 'admin' && isSuperAdmin && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-3 shadow-md space-y-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">Super Admin User Role Console</h3>
              <p className="text-[10px] text-slate-400">Promote members or assign custom permissions securely</p>
            </div>
          </div>

          <form onSubmit={handleAssignRole} className="space-y-2.5 text-xs bg-slate-850 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1">User Email Address</label>
              <input 
                type="email" 
                placeholder="e.g. member@gmail.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Assign Target Role</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500 font-bold"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
              >
                <option value="COLLECTOR">COLLECTOR (Collect Cash & UPI)</option>
                <option value="TREASURER">TREASURER (Approve Handovers & Reimbursements)</option>
                <option value="MEMBER">MEMBER (Submit Expenses & View Receipts)</option>
                <option value="VIEW_ONLY">VIEW_ONLY (Read-Only Access)</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN (Full Control)</option>
              </select>
            </div>

            <button type="submit" className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition">
              Save Role Assignment
            </button>

            {roleMsg && (
              <p className={`text-[11px] p-2 rounded text-center ${roleMsg.startsWith('Error') ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {roleMsg}
              </p>
            )}
          </form>

          {/* Super Admin Fresh Start Reset Button */}
          <div className="bg-rose-950/40 border border-rose-800/40 rounded-xl p-3 space-y-2">
            <h4 className="font-extrabold text-rose-400 text-xs">⚠️ Fresh Start Data Reset</h4>
            <p className="text-[10px] text-slate-400">
              Clear all test contributions, expenses, handovers, and non-admin accounts to prepare the application for official production launch.
            </p>
            <button
              type="button"
              onClick={handleResetDatabase}
              className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition"
            >
              Reset Application Database (Fresh Start)
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Super Admin Branding Console */}
      {activeTab === 'branding' && isSuperAdmin && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-3 shadow-md space-y-4 text-xs">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">App Branding & Custom Labels</h3>
              <p className="text-[10px] text-slate-400">Customize logos, color themes, and form button labels</p>
            </div>
          </div>

          <form onSubmit={handleUpdateSettings} className="space-y-3 bg-slate-850 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" /> App Logo Image
              </label>
              <div className="flex items-center space-x-3">
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo Preview" className="w-10 h-10 rounded-lg object-cover border border-amber-500/30" />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-amber-400" /> Visual Color Theme
              </label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                value={settings.themeColor}
                onChange={(e) => setSettings({ ...settings, themeColor: e.target.value as any })}
              >
                <option value="AMBER_ORANGE">Amber Orange (Puja Warm Gold - Default)</option>
                <option value="EMERALD_GREEN">Emerald Green (Royal Prosperity)</option>
                <option value="SLATE_BLUE">Slate Blue (Modern Minimalist)</option>
                <option value="PURPLE_GOLD">Purple Gold (Festive Premium)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">App Title</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  value={settings.appTitle}
                  onChange={(e) => setSettings({ ...settings, appTitle: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Target Amount (₹)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-bold text-emerald-400"
                  value={settings.targetGoalAmount}
                  onChange={(e) => setSettings({ ...settings, targetGoalAmount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Configured Area / Wing Options (Comma-separated)</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
                placeholder="Sector 1 / Wing A, Sector 2 / Wing B, General Area"
                value={(settings.areaOptions || []).join(', ')}
                onChange={(e) => {
                  const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  setSettings({ ...settings, areaOptions: opts });
                }}
              />
              <p className="text-[9px] text-slate-500 mt-1">These options will populate dropdown selections in collection forms.</p>
            </div>

            <button type="submit" className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-lg">
              Save Branding & Label Customizations
            </button>

            {settingsMsg && (
              <p className={`text-[11px] p-2 rounded text-center ${settingsMsg.startsWith('Error') ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {settingsMsg}
              </p>
            )}
          </form>
        </div>
      )}

      {/* MODAL: RECORD MY OWN CONTRIBUTION */}
      {showSelfContribution && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex justify-between items-center">
              <span>+ Record My Contribution</span>
              <button onClick={() => setShowSelfContribution(false)} className="text-slate-400 text-xs">✕</button>
            </h3>
            <form onSubmit={handleSelfContributionSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Contribution Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="5000"
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-orange-500 font-bold text-orange-400"
                  value={selfContribForm.amount}
                  onChange={(e) => setSelfContribForm({ ...selfContribForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Area / Wing</label>
                  <select 
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-orange-500 font-medium"
                    value={selfContribForm.memberArea}
                    onChange={(e) => setSelfContribForm({ ...selfContribForm, memberArea: e.target.value })}
                  >
                    <option value="">Select Area / Wing</option>
                    {(settings.areaOptions || []).map((area, idx) => (
                      <option key={idx} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Payment Mode</label>
                  <select 
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-orange-500"
                    value={selfContribForm.paymentMode}
                    onChange={(e) => setSelfContribForm({ ...selfContribForm, paymentMode: e.target.value as any })}
                  >
                    <option value="UPI">UPI / QR Scan</option>
                    <option value="CASH">Cash in hand</option>
                    <option value="BANK_TRANSFER">Bank NetBanking</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tag Collector / Treasurer to Verify</label>
                <select 
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-orange-500 font-bold"
                  value={selfContribForm.taggedCollectorEmail}
                  onChange={(e) => setSelfContribForm({ ...selfContribForm, taggedCollectorEmail: e.target.value })}
                  required
                >
                  {collectorsList.map((c) => (
                    <option key={c.email} value={c.email}>
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Ref / Transaction ID / Note</label>
                <input 
                  type="text" 
                  placeholder="e.g. UPI Ref: 42398... or Cash handed to Amit"
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-orange-500"
                  value={selfContribForm.note}
                  onChange={(e) => setSelfContribForm({ ...selfContribForm, note: e.target.value })}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowSelfContribution(false)} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-bold">Submit Contribution</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HANDOVER CASH VOUCHER MODAL */}
      {selectedHandover && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-xs rounded-2xl p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 mx-auto flex items-center justify-center font-bold text-xl text-slate-950 shadow-lg">
              💸
            </div>
            
            <div>
              <h3 className="text-base font-bold text-slate-100">{settings.appTitle}</h3>
              <p className="text-xs text-cyan-400 font-medium">Cash Handover Voucher</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedHandover.id}</p>
            </div>

            <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Collector:</span>
                <span className="font-bold text-slate-200">{selectedHandover.collectorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Area / Wing:</span>
                <span className="font-semibold text-slate-200">{selectedHandover.collectorArea || 'General Area'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Transferred:</span>
                <span className="font-extrabold text-amber-400 text-sm">₹{selectedHandover.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`font-bold ${selectedHandover.status === 'APPROVED' ? 'text-emerald-400' : 'text-amber-400'}`}>{selectedHandover.status}</span>
              </div>
              {selectedHandover.treasurerName && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Approved By:</span>
                  <span className="font-medium text-slate-300">{selectedHandover.treasurerName}</span>
                </div>
              )}

              {/* Digital Signature Stamp */}
              <div className="pt-2 border-t border-slate-800 text-[10px] space-y-1 text-center">
                <p className="text-cyan-400 font-extrabold">
                  {selectedHandover.status === 'APPROVED' ? '✓ Digitally Signed & Approved Vault Transfer' : '⏳ Pending Treasury Approval Signature'}
                </p>
                <p className="text-slate-500 font-mono text-[9px]">
                  Voucher Audit Signature: {selectedHandover.treasurerId || selectedHandover.collectorId}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button 
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span>Export / Print Voucher PDF</span>
              </button>
              <a 
                href={generateHandoverWhatsAppShare(selectedHandover)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Voucher via WhatsApp</span>
              </a>
              <button 
                onClick={() => setSelectedHandover(null)} 
                className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-xs rounded-2xl p-5 shadow-2xl space-y-4 text-center">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 rounded-full mx-auto border border-amber-500/30 object-cover shadow-lg" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 mx-auto flex items-center justify-center font-bold text-xl text-slate-950 shadow-lg">
                🐘
              </div>
            )}
            
            <div>
              <h3 className="text-base font-bold text-slate-100">{settings.appTitle}</h3>
              <p className="text-xs text-orange-400 font-medium">Official Digital Receipt</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedReceipt.receiptNo}</p>
            </div>

            <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Member:</span>
                <span className="font-bold text-slate-200">{selectedReceipt.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Area / Wing:</span>
                <span className="font-semibold text-slate-200">{selectedReceipt.memberArea}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-extrabold text-emerald-400 text-sm">₹{selectedReceipt.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mode:</span>
                <span className="font-medium text-slate-300">{selectedReceipt.paymentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Collector:</span>
                <span className="font-medium text-slate-300">{selectedReceipt.collectorName}</span>
              </div>

              {/* Digital Signature & Stamp */}
              <div className="pt-2 border-t border-slate-800 text-[10px] space-y-1 text-center">
                <p className="text-emerald-400 font-extrabold flex items-center justify-center gap-1">
                  <span>✓ Digitally Signed & Verified</span>
                </p>
                <p className="text-slate-500 font-mono text-[9px]">
                  Collector Verification ID: {selectedReceipt.collectorId || 'AUTOSIGN-GP2026'}
                </p>
              </div>
            </div>

            {/* Custom Thank You Note */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-center">
              <p className="text-[11px] font-semibold text-amber-300 leading-snug">
                "Thank you for your generous contribution towards Ganesh Puja 2026! Your support makes our festival grand & joyful. 🙏🐘"
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button 
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span>Export / Print Receipt PDF</span>
              </button>
              <a 
                href={generateWhatsAppShare(selectedReceipt)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </a>
              <button 
                onClick={() => setSelectedReceipt(null)} 
                className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Contribution */}
      {showAddContribution && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex justify-between items-center">
              <span>{settings.collectionButtonLabel}</span>
              <button onClick={() => setShowAddContribution(false)} className="text-slate-400 text-xs">✕</button>
            </h3>
            <form onSubmit={handleAddContribution} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Member Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-orange-500"
                  value={contribForm.memberName}
                  onChange={(e) => setContribForm({ ...contribForm, memberName: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Area / Wing</label>
                  <select 
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-orange-500 font-medium"
                    value={contribForm.memberArea}
                    onChange={(e) => setContribForm({ ...contribForm, memberArea: e.target.value })}
                  >
                    <option value="">Select Area / Wing</option>
                    {(settings.areaOptions || []).map((area, idx) => (
                      <option key={idx} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="5000"
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-orange-500 font-bold text-orange-400"
                    value={contribForm.amount}
                    onChange={(e) => setContribForm({ ...contribForm, amount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Payment Mode</label>
                <select 
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-orange-500"
                  value={contribForm.paymentMode}
                  onChange={(e) => setContribForm({ ...contribForm, paymentMode: e.target.value as any })}
                >
                  <option value="CASH">Cash (Collected in person)</option>
                  <option value="UPI">UPI / QR Scan</option>
                  <option value="BANK_TRANSFER">Bank NetBanking</option>
                </select>
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowAddContribution(false)} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-orange-600 text-white font-bold">Save Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Expense */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex justify-between items-center">
              <span>{settings.spendButtonLabel}</span>
              <button onClick={() => setShowAddExpense(false)} className="text-slate-400 text-xs">✕</button>
            </h3>
            <form onSubmit={handleAddExpense} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Title / Item Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Flower decorations & Mandap light"
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select 
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500"
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  >
                    <option value="Decoration">Decoration</option>
                    <option value="Puja Rituals">Puja Rituals</option>
                    <option value="Food & Prasad">Food & Prasad</option>
                    <option value="Sound & Light">Sound & Light</option>
                    <option value="Misc">Misc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="2500"
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500 font-bold text-rose-400"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="bg-slate-850 p-2 rounded-lg border border-slate-800 flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="outOfPocket"
                  checked={expenseForm.isOutofPocket}
                  onChange={(e) => setExpenseForm({ ...expenseForm, isOutofPocket: e.target.checked })}
                  className="rounded border-slate-700 text-rose-500 focus:ring-0"
                />
                <label htmlFor="outOfPocket" className="text-slate-300 text-[11px]">
                  Paid from personal pocket (needs reimbursement)
                </label>
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowAddExpense(false)} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-rose-600 text-white font-bold">Log Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Handover */}
      {showAddHandover && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex justify-between items-center">
              <span>{settings.handoverButtonLabel}</span>
              <button onClick={() => setShowAddHandover(false)} className="text-slate-400 text-xs">✕</button>
            </h3>
            <form onSubmit={handleAddHandover} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Handover Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="5000"
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-bold text-cyan-400"
                  value={handoverForm.amount}
                  onChange={(e) => setHandoverForm({ ...handoverForm, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Collector Area / Wing</label>
                <select 
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                  value={handoverForm.collectorArea}
                  onChange={(e) => setHandoverForm({ ...handoverForm, collectorArea: e.target.value })}
                >
                  <option value="">Select Collector Area</option>
                  {(settings.areaOptions || []).map((area, idx) => (
                    <option key={idx} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Notes / Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Cash collected from Sector 1"
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  value={handoverForm.notes}
                  onChange={(e) => setHandoverForm({ ...handoverForm, notes: e.target.value })}
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowAddHandover(false)} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-cyan-600 text-white font-bold">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
