'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { 
  Wallet, 
  TrendingDown, 
  ArrowUpRight, 
  Clock, 
  PlusCircle, 
  Share2, 
  Download, 
  Printer, 
  LogOut,
  ShieldCheck,
  Lock,
  UserCheck
} from 'lucide-react';

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
  memberFlat: string;
  collectorId: string;
  collectorName: string;
}

interface Handover {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  date: string;
  collectorId: string;
  collectorName: string;
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
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'collectors' | 'contributions' | 'expenses'>('overview');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [collectorBalances, setCollectorBalances] = useState<CollectorBalance[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);

  // Modals & Selected Receipt
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddHandover, setShowAddHandover] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Contribution | null>(null);

  // Form states
  const [contribForm, setContribForm] = useState({
    memberName: '',
    memberFlat: '',
    amount: '',
    paymentMode: 'CASH' as 'CASH' | 'UPI' | 'BANK_TRANSFER',
    collectorId: 'usr-2',
    collectorName: 'Amit Patel (Collector)',
    note: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'General',
    amount: '',
    isOutofPocket: true,
    paidById: 'usr-2',
    paidByName: 'Amit Patel'
  });

  const [handoverForm, setHandoverForm] = useState({
    collectorId: 'usr-2',
    collectorName: 'Amit Patel',
    amount: '',
    notes: ''
  });

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance');
      const data = await res.json();
      setSummary(data.summary);
      setCollectorBalances(data.collectorBalances);
      setContributions(data.latestContributions);
      setExpenses(data.latestExpenses);
      setHandovers(data.handovers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchFinanceData();
    }
  }, [session]);

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
          memberFlat: contribForm.memberFlat || 'N/A',
          amount: parseFloat(contribForm.amount),
          paymentMode: contribForm.paymentMode,
          collectorId: session?.user?.email || 'usr-2',
          collectorName: session?.user?.name || 'Authorized Collector',
          note: contribForm.note
        }
      })
    });

    const result = await res.json();
    setShowAddContribution(false);
    setContribForm({ memberName: '', memberFlat: '', amount: '', paymentMode: 'CASH', collectorId: 'usr-2', collectorName: 'Amit Patel (Collector)', note: '' });
    fetchFinanceData();
    if (result?.item) {
      setSelectedReceipt(result.item);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) return;

    await fetch('/api/finance', {
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

    setShowAddExpense(false);
    setExpenseForm({ title: '', category: 'General', amount: '', isOutofPocket: true, paidById: 'usr-2', paidByName: 'Amit Patel' });
    fetchFinanceData();
  };

  const handleAddHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverForm.amount) return;

    await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'REQUEST_HANDOVER',
        data: {
          collectorId: session?.user?.email || 'usr-2',
          collectorName: session?.user?.name || 'Collector',
          amount: parseFloat(handoverForm.amount),
          notes: handoverForm.notes
        }
      })
    });

    setShowAddHandover(false);
    setHandoverForm({ collectorId: 'usr-2', collectorName: 'Amit Patel', amount: '', notes: '' });
    fetchFinanceData();
  };

  const handleApproveHandover = async (handoverId: string) => {
    await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'APPROVE_HANDOVER',
        data: { handoverId, treasurerId: session?.user?.email || 'usr-1' }
      })
    });
    fetchFinanceData();
  };

  const handleSettleReimbursement = async (expenseId: string) => {
    await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SETTLE_REIMBURSEMENT',
        data: { expenseId }
      })
    });
    fetchFinanceData();
  };

  const generateWhatsAppShare = (c: Contribution) => {
    const text = `*Ganesh Puja 2026 Payment Receipt* 🐘\n\n` +
      `Receipt No: *${c.receiptNo}*\n` +
      `Received From: *${c.memberName} (${c.memberFlat})*\n` +
      `Amount Received: *₹${c.amount.toLocaleString()}*\n` +
      `Payment Mode: *${c.paymentMode}*\n` +
      `Collector: *${c.collectorName}*\n` +
      `Date: *${new Date(c.date).toLocaleDateString()}*\n\n` +
      `Thank you for your generous contribution to Ganesh Puja 2026!\n` +
      `View portal: https://gp2026.luhurachati.com`;
    
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // User session checking loading state
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Verifying security credentials...</p>
      </div>
    );
  }

  // Mandatory Google OAuth Login Screen for Unauthenticated Users
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-3xl text-slate-950 shadow-2xl animate-bounce">
          🐘
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-100">Ganesh Puja 2026</h2>
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

          <p className="text-[10px] text-slate-500">Authorized redirect: gp2026.luhurachati.com</p>
        </div>
      </div>
    );
  }

  const userRole = (session?.user as any)?.role || 'MEMBER';
  const targetProgress = summary ? Math.min(100, Math.round((summary.totalCollected / summary.targetGoal) * 100)) : 0;

  return (
    <div className="space-y-4">
      {/* Authenticated User Header Banner */}
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
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium">
              Role: {userRole}
            </span>
          </div>
        </div>
        <button 
          onClick={() => signOut()}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Target Goal & Quick Actions Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Target Fund Goal</span>
          <span className="text-xs font-bold text-slate-300">₹{summary?.totalCollected.toLocaleString()} / ₹{summary?.targetGoal.toLocaleString()}</span>
        </div>
        
        <div className="w-full bg-slate-800 rounded-full h-3 mb-3 overflow-hidden p-0.5 border border-slate-700">
          <div className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${targetProgress}%` }}></div>
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

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80">
          <button 
            onClick={() => setShowAddContribution(true)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 text-[11px] font-medium transition"
          >
            <PlusCircle className="w-4 h-4 mb-1 text-orange-400" />
            + Collection
          </button>
          <button 
            onClick={() => setShowAddExpense(true)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-[11px] font-medium transition"
          >
            <TrendingDown className="w-4 h-4 mb-1 text-rose-400" />
            + Spend / Bill
          </button>
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
          className={`flex-1 py-2 px-3 rounded-lg text-center whitespace-nowrap transition ${activeTab === 'overview' ? 'bg-orange-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('collectors')} 
          className={`flex-1 py-2 px-3 rounded-lg text-center whitespace-nowrap transition ${activeTab === 'collectors' ? 'bg-orange-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Collectors
        </button>
        <button 
          onClick={() => setActiveTab('contributions')} 
          className={`flex-1 py-2 px-3 rounded-lg text-center whitespace-nowrap transition ${activeTab === 'contributions' ? 'bg-orange-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Collections
        </button>
        <button 
          onClick={() => setActiveTab('expenses')} 
          className={`flex-1 py-2 px-3 rounded-lg text-center whitespace-nowrap transition ${activeTab === 'expenses' ? 'bg-orange-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Expenses
        </button>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
              <div className="flex items-center text-amber-400 text-xs font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Pending Handovers
              </div>
              <p className="text-lg font-bold text-slate-100">₹{summary?.pendingHandovers.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Cash waiting approval</p>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
              <div className="flex items-center text-purple-400 text-xs font-semibold mb-1">
                <Wallet className="w-3.5 h-3.5 mr-1" />
                Owed Out-of-Pocket
              </div>
              <p className="text-lg font-bold text-slate-100">₹{summary?.pendingReimbursements.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Spent by members to reimburse</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Recent Contributions</span>
              <button onClick={() => setActiveTab('contributions')} className="text-orange-400 text-[11px] normal-case hover:underline">View All →</button>
            </h3>
            <div className="divide-y divide-slate-800">
              {contributions.slice(0, 5).map((c) => (
                <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{c.memberName} <span className="text-slate-400 font-normal">({c.memberFlat})</span></p>
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
        </div>
      )}

      {/* TAB CONTENT: Collectors */}
      {activeTab === 'collectors' && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Collector Cash Balances</h3>
              <button 
                onClick={() => setShowAddHandover(true)}
                className="text-xs px-2.5 py-1 rounded bg-cyan-600 text-white font-medium shadow"
              >
                + Handover Cash
              </button>
            </div>
            <div className="divide-y divide-slate-800">
              {collectorBalances.map((col) => (
                <div key={col.collectorId} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{col.collectorName}</p>
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Handover Approval Requests</h3>
            {handovers.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No handover requests logged.</p>
            ) : (
              <div className="space-y-2">
                {handovers.map((h) => (
                  <div key={h.id} className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-200">{h.collectorName}</p>
                      <p className="text-[10px] text-slate-400">Notes: {h.notes || 'N/A'}</p>
                      <span className={`inline-block text-[9px] px-1.5 py-0.5 mt-1 rounded font-medium ${h.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {h.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-400 mb-1.5">₹{h.amount.toLocaleString()}</p>
                      {h.status === 'PENDING' && (userRole === 'ADMIN' || userRole === 'TREASURER') && (
                        <button 
                          onClick={() => handleApproveHandover(h.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow"
                        >
                          Approve
                        </button>
                      )}
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
            <button 
              onClick={() => setShowAddContribution(true)}
              className="text-xs px-2.5 py-1 rounded bg-orange-600 text-white font-medium shadow"
            >
              + Record
            </button>
          </div>
          <div className="divide-y divide-slate-800">
            {contributions.map((c) => (
              <div key={c.id} className="py-2.5 text-xs flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-200">{c.memberName}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">{c.memberFlat}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Receipt: <span className="text-slate-300 font-mono">{c.receiptNo}</span></p>
                  <p className="text-[10px] text-slate-500">Collected by {c.collectorName}</p>
                </div>
                <div className="text-right flex items-center space-x-2">
                  <div>
                    <p className="font-bold text-emerald-400 text-sm">₹{c.amount.toLocaleString()}</p>
                    <span className="text-[9px] text-slate-400">{c.paymentMode}</span>
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
      )}

      {/* TAB CONTENT: Expenses */}
      {activeTab === 'expenses' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Puja Expenses & Out-of-Pocket</h3>
            <button 
              onClick={() => setShowAddExpense(true)}
              className="text-xs px-2.5 py-1 rounded bg-rose-600 text-white font-medium shadow"
            >
              + Record Spend
            </button>
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
                  {exp.isOutofPocket && !exp.isReimbursed && (userRole === 'ADMIN' || userRole === 'TREASURER') && (
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

      {/* DIGITAL RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-xs rounded-2xl p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 mx-auto flex items-center justify-center font-bold text-xl text-slate-950 shadow-lg">
              🐘
            </div>
            
            <div>
              <h3 className="text-base font-bold text-slate-100">Ganesh Puja 2026</h3>
              <p className="text-xs text-orange-400 font-medium">Official Digital Receipt</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedReceipt.receiptNo}</p>
            </div>

            <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Member:</span>
                <span className="font-bold text-slate-200">{selectedReceipt.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Flat No:</span>
                <span className="font-semibold text-slate-200">{selectedReceipt.memberFlat}</span>
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
            </div>

            <div className="space-y-2 pt-1">
              <a 
                href={generateWhatsAppShare(selectedReceipt)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-lg"
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
              <span>+ Record Contribution</span>
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
                  <label className="block text-slate-400 mb-1">Flat No.</label>
                  <input 
                    type="text" 
                    placeholder="e.g. A-302"
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-orange-500"
                    value={contribForm.memberFlat}
                    onChange={(e) => setContribForm({ ...contribForm, memberFlat: e.target.value })}
                  />
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
              <span>+ Record Spend / Expense</span>
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
              <span>Handover Cash to Treasurer</span>
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
                <label className="block text-slate-400 mb-1">Notes / Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Collected cash from Wing A"
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
