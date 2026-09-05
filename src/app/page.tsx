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
  Users,
  Calendar,
  Video,
  Camera,
  Play
} from 'lucide-react';
import { AppSettings, User as DbUser, ProgrammeItem } from '@/lib/db';

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

interface MembershipRequestItem {
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

interface CollectorTransfer {
  id: string;
  contributionId?: string;
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

function ProgrammeMediaCard({ prog }: { prog: ProgrammeItem }) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-detect orientation: portrait if URL contains shorts/reel/tiktok or explicitly marked PORTRAIT
  const isPortrait = 
    prog.videoOrientation === 'PORTRAIT' || 
    (prog.embedUrl && (
      prog.embedUrl.toLowerCase().includes('/shorts/') || 
      prog.embedUrl.toLowerCase().includes('/reel/') ||
      prog.embedUrl.toLowerCase().includes('instagram.com/p/')
    ));

  // Extract YouTube ID if applicable
  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('/shorts/')[1]?.split('?')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
  };

  const getYouTubeThumbnail = (url: string) => {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('/shorts/')[1]?.split('?')[0];
    }
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };

  if (prog.mediaType === 'IMAGE' && prog.photoUrl) {
    return (
      <div className="rounded-2xl overflow-hidden border border-amber-200/80 bg-slate-50 mt-2 shadow-xs">
        <img 
          src={prog.photoUrl} 
          alt={prog.title} 
          className="w-full h-auto max-h-96 object-contain mx-auto" 
        />
      </div>
    );
  }

  if (prog.mediaType === 'YOUTUBE' && prog.embedUrl) {
    const embedSrc = getYouTubeEmbedUrl(prog.embedUrl);
    const thumbnail = getYouTubeThumbnail(prog.embedUrl);

    return (
      <div className={`mt-3 rounded-2xl overflow-hidden border border-amber-200/80 bg-slate-950 shadow-md ${isPortrait ? 'max-w-xs mx-auto aspect-[9/16] w-full' : 'w-full aspect-video'}`}>
        {!isPlaying ? (
          <div className="relative w-full h-full group cursor-pointer flex items-center justify-center bg-slate-900 overflow-hidden" onClick={() => setIsPlaying(true)}>
            {thumbnail ? (
              <img src={thumbnail} alt={prog.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-80" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-900 via-orange-950 to-slate-950"></div>
            )}

            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-slate-950/40 flex flex-col items-center justify-center gap-2 group-hover:bg-slate-950/25 transition">
              <button 
                type="button" 
                className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition transform active:scale-95 border-2 border-white/90"
              >
                <Play className="w-6 h-6 text-white ml-1 fill-current" />
              </button>
              <span className="text-[10px] font-extrabold text-white bg-slate-900/90 px-3 py-1 rounded-full border border-white/20 backdrop-blur-xs shadow-xs">
                ▶ Click to Play ({isPortrait ? '9:16 Portrait Reel' : '16:9 HD Video'})
              </span>
            </div>
          </div>
        ) : (
          <iframe
            src={embedSrc}
            title={prog.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        )}
      </div>
    );
  }

  if (prog.mediaType === 'INSTAGRAM' && prog.embedUrl) {
    return (
      <div className={`mt-3 rounded-2xl border border-pink-200/80 bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 p-4 text-center shadow-xs ${isPortrait ? 'max-w-xs mx-auto' : 'w-full'}`}>
        {!isPlaying ? (
          <div className="space-y-3 py-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 text-xs">{prog.title}</p>
              <p className="text-[10px] text-pink-700 font-bold uppercase tracking-wider mt-0.5">
                Official Instagram {isPortrait ? 'Reel (9:16 Portrait)' : 'Post'}
              </p>
            </div>
            <button
              onClick={() => setIsPlaying(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-extrabold shadow-sm inline-flex items-center space-x-1.5 transition transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>▶ Click to Load Media</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <iframe
              src={`${prog.embedUrl.replace(/\/$/, '')}/embed`}
              className={`w-full border-0 rounded-xl bg-white shadow-xs ${isPortrait ? 'h-[420px]' : 'h-64'}`}
              allowTransparency
            ></iframe>
            <a
              href={prog.embedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-pink-700 hover:underline font-bold block pt-1"
            >
              Open in Instagram App &rarr;
            </a>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'programmes' | 'collectors' | 'contributions' | 'expenses' | 'reimbursements' | 'approvals' | 'admin' | 'branding'>('overview');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [collectorBalances, setCollectorBalances] = useState<CollectorBalance[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [pendingApprovalsForMe, setPendingApprovalsForMe] = useState<Contribution[]>([]);
  const [totalPendingActionCount, setTotalPendingActionCount] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [programmes, setProgrammes] = useState<ProgrammeItem[]>([]);

  // Programme Form State
  const [showAddProgramme, setShowAddProgramme] = useState(false);
  const [programmeForm, setProgrammeForm] = useState({
    title: '',
    description: '',
    dateTime: '',
    location: '',
    photoUrl: '',
    mediaType: 'IMAGE' as 'IMAGE' | 'YOUTUBE' | 'INSTAGRAM',
    embedUrl: '',
    videoOrientation: 'LANDSCAPE' as 'LANDSCAPE' | 'PORTRAIT'
  });

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
  const [showRemindCollector, setShowRemindCollector] = useState(false);
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

  const [membershipRequests, setMembershipRequests] = useState<MembershipRequestItem[]>([]);
  const [membershipArea, setMembershipArea] = useState('');
  const [membershipReqMsg, setMembershipReqMsg] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState<DbUser[]>([]);

  // Members Directory & Smart User Management States
  const [membersDirectory, setMembersDirectory] = useState<Array<{ id: string; name: string; area: string; role: string; email?: string; image?: string; isRegistered: boolean; totalContributed: number; countContributed: number }>>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<Array<{ collectionName: string; collectionArea: string; collectionCount: number; suggestedUserEmail: string; suggestedUserName: string; confidence: string }>>([]);
  const [addMemberForm, setAddMemberForm] = useState({ name: '', area: '', phone: '', email: '', role: 'MEMBER' as 'MEMBER' | 'COLLECTOR' | 'TREASURER' });
  const [addMemberMsg, setAddMemberMsg] = useState('');
  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  const fetchMembersDirectory = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setMembersDirectory(data.members || []);
        if (data.smartSuggestions) setSmartSuggestions(data.smartSuggestions);
      }
    } catch (err) {
      console.error('Error fetching members directory:', err);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberForm.name) return;

    setAddMemberMsg('Adding member...');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_MEMBER',
        ...addMemberForm
      })
    });

    const data = await res.json();
    if (res.ok) {
      setAddMemberMsg(`✅ ${data.message}`);
      setAddMemberForm({ name: '', area: '', phone: '', email: '', role: 'MEMBER' });
      fetchMembersDirectory();
      fetchFinanceData();
    } else {
      setAddMemberMsg(`Error: ${data.error || 'Failed to add member'}`);
    }
  };

  const handleMergeCollectionUser = async (collectionName: string, targetUserEmail: string) => {
    if (!confirm(`Merge all collection records of "${collectionName}" under user account ${targetUserEmail}?`)) return;

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'MERGE_COLLECTION_USER',
        collectionName,
        targetUserEmail
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert(`✅ ${data.message}`);
      fetchMembersDirectory();
      fetchFinanceData();
    } else {
      alert(`Error: ${data.error || 'Failed to merge user'}`);
    }
  };

  const [pendingCollectorTransfersForMe, setPendingCollectorTransfersForMe] = useState<CollectorTransfer[]>([]);
  const [collectorTransfers, setCollectorTransfers] = useState<CollectorTransfer[]>([]);
  const [selectedContributionForTransfer, setSelectedContributionForTransfer] = useState<Contribution | null>(null);
  const [targetTransferCollectorEmail, setTargetTransferCollectorEmail] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  const handleInitiateTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTransferCollectorEmail) return;

    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'INITIATE_COLLECTOR_TRANSFER',
        data: {
          contributionId: selectedContributionForTransfer?.id,
          toCollectorEmail: targetTransferCollectorEmail,
          notes: transferNotes
        }
      })
    });

    const result = await res.json();
    if (res.ok) {
      alert(`✅ ${result.message}`);
      setSelectedContributionForTransfer(null);
      setTargetTransferCollectorEmail('');
      setTransferNotes('');
      fetchFinanceData();
    } else {
      alert(`Error: ${result.error || 'Failed to initiate transfer'}`);
    }
  };

  const handleDecideCollectorTransfer = async (transferId: string, decision: 'APPROVE' | 'REJECT') => {
    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'DECIDE_COLLECTOR_TRANSFER',
        data: { transferId, decision }
      })
    });

    const result = await res.json();
    if (res.ok) {
      alert(`✅ ${result.message}`);
      fetchFinanceData();
    } else {
      alert(`Error: ${result.error || 'Failed to update transfer status'}`);
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
      setPendingCollectorTransfersForMe(data.pendingCollectorTransfersForMe || []);
      setCollectorTransfers(data.collectorTransfers || []);
      setTotalPendingActionCount(data.totalPendingActionCount || 0);
      setExpenses(data.latestExpenses);
      setHandovers(data.handovers);
      setProgrammes(data.programmes || []);
      setMembershipRequests(data.membershipRequests || []);
      setRegisteredUsers(data.users || []);
      fetchMembersDirectory();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMembershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMembershipReqMsg('Submitting request...');
    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'REQUEST_MEMBERSHIP',
        data: {
          userName: session?.user?.name,
          userArea: membershipArea || 'General Area'
        }
      })
    });
    const result = await res.json();
    if (res.ok) {
      setMembershipReqMsg('✅ Request submitted! Super Admin has been notified for approval.');
      fetchFinanceData();
    } else {
      setMembershipReqMsg(`Error: ${result.error || 'Failed to submit request'}`);
    }
  };

  const handleDecideMembershipRequest = async (requestId: string, decision: 'APPROVE' | 'REJECT', assignedRole: string = 'MEMBER') => {
    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'DECIDE_MEMBERSHIP_REQUEST',
        data: { requestId, decision, assignedRole }
      })
    });
    const result = await res.json();
    if (res.ok) {
      fetchFinanceData();
      fetchRoleAssignments();
      alert(`Membership request ${decision.toLowerCase()}d successfully! User added to database index.`);
    } else {
      alert(`Error: ${result.error || 'Failed to update request'}`);
    }
  };

  const handleAddProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programmeForm.title || !programmeForm.dateTime) return;

    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ADD_PROGRAMME',
        data: programmeForm
      })
    });

    const result = await res.json();
    if (res.ok) {
      setShowAddProgramme(false);
      setProgrammeForm({
        title: '',
        description: '',
        dateTime: '',
        location: '',
        photoUrl: '',
        mediaType: 'IMAGE',
        embedUrl: '',
        videoOrientation: 'LANDSCAPE'
      });
      fetchFinanceData();
    } else {
      alert(result.error || 'Failed to add programme');
    }
  };

  const handleDeleteProgramme = async (programmeId: string) => {
    if (!confirm('Are you sure you want to remove this festival programme?')) return;
    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'DELETE_PROGRAMME',
        data: { programmeId }
      })
    });
    const result = await res.json();
    if (res.ok) fetchFinanceData();
    else alert(result.error);
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
    if (!targetEmail.trim()) return;

    setRoleMsg('');
    const emailList = targetEmail
      .split(/[\n,;]+/)
      .map(email => email.trim())
      .filter(Boolean);

    if (emailList.length === 0) return;

    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetEmails: emailList,
        newRole: selectedRole
      })
    });

    const data = await res.json();
    if (res.ok) {
      setRoleMsg(data.message || `Successfully assigned ${selectedRole} to ${emailList.length} user email(s).`);
      setTargetEmail('');
      fetchRoleAssignments();
    } else {
      setRoleMsg(`Error: ${data.error || 'Failed to update roles'}`);
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
          <img src={settings.logoUrl} alt="Logo" className="w-24 h-24 rounded-3xl border-2 border-amber-300 object-cover shadow-xl animate-bounce" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center font-bold text-4xl text-white shadow-xl animate-bounce">
            🐘
          </div>
        )}

        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{settings.appTitle || 'Ganesh Puja - LBC'}</h2>
          <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Festival Management & Transparency Portal</p>
          <p className="text-xs text-slate-600 max-w-xs pt-1 font-medium leading-relaxed">
            Access to collection records, treasury vaults, and reimbursement ledgers is restricted to verified members.
          </p>
        </div>

        <div className="w-full max-w-xs bg-white border border-amber-200/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-center space-x-2 text-emerald-700 text-xs font-semibold">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Google OAuth 2.0 Protection</span>
          </div>

          <button
            onClick={() => signIn('google')}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 transition transform active:scale-95"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V13.4h6.887c-.58 3.424-3.57 5.767-6.887 5.767-4.12 0-7.464-3.344-7.464-7.464S8.12 4.238 12.24 4.238c1.86 0 3.55.674 4.86 1.785l2.454-2.453C17.754 1.83 15.16.8 12.24.8 6.03.8 1 5.83 1 12.04s5.03 11.24 11.24 11.24c6.49 0 10.8-4.56 10.8-10.98 0-.74-.08-1.46-.2-2.015H12.24z"/>
            </svg>
            <span>Sign in with Google Account</span>
          </button>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-center space-x-3 font-medium">
            <a href="/privacy" className="hover:text-orange-600 underline">Privacy Policy</a>
            <span>•</span>
            <a href="/terms" className="hover:text-orange-600 underline">Terms & Disclaimer</a>
          </div>
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
      <div className="flex items-center justify-between bg-white border border-amber-200/80 rounded-2xl px-4 py-2.5 text-xs shadow-sm">
        <div className="flex items-center space-x-2.5">
          {session.user?.image ? (
            <img src={session.user.image} alt="User avatar" className="w-8 h-8 rounded-full border-2 border-orange-400 object-cover shadow-xs" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-white text-xs shadow-xs">
              {session.user?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <p className="font-extrabold text-slate-900 leading-tight">{session.user?.name}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isViewOnly ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
              {userRole}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Pending Approvals Bell Icon */}
          {totalPendingActionCount > 0 && (
            <button 
              onClick={() => setActiveTab('approvals')}
              className="relative p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 animate-pulse shadow-xs"
              title="Pending Verification Approvals & Membership Requests"
            >
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                {totalPendingActionCount}
              </span>
            </button>
          )}

          <button 
            onClick={() => signOut()}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition border border-slate-200 shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* View-Only User Membership Notice & Active Request Form */}
      {isViewOnly && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold shadow-xs shrink-0">
              🪔
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">View-Only Guest Access</h3>
              <p className="text-xs text-slate-600 font-medium">Request official Member access from the Super Admin below</p>
            </div>
          </div>
          <div className="bg-white border border-amber-200/80 rounded-2xl p-4 text-xs text-slate-700 space-y-3">
            <p className="text-slate-600 leading-relaxed font-medium">
              Only verified members can log expenses or claims. Select your Area / Wing below to submit an active membership request directly to the Super Admin for approval.
            </p>
            
            <form onSubmit={handleRequestMembershipSubmit} className="flex flex-col sm:flex-row gap-2 items-center">
              <select
                className="w-full sm:flex-1 bg-amber-50/50 border border-amber-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-orange-500"
                value={membershipArea}
                onChange={(e) => setMembershipArea(e.target.value)}
                required
              >
                <option value="">-- Select Your Area / Wing --</option>
                {(settings.areaOptions || []).map((area, idx) => (
                  <option key={idx} value={area}>{area}</option>
                ))}
              </select>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-sm whitespace-nowrap transition transform active:scale-95 flex items-center justify-center space-x-1.5"
              >
                <span>🙋‍♂️ Request Member Upgrade</span>
              </button>
            </form>

            {membershipReqMsg && (
              <p className={`text-[11px] font-bold p-2 rounded-xl text-center ${membershipReqMsg.startsWith('Error') ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {membershipReqMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Target Goal & Quick Actions Header */}
      <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{settings.targetGoalLabel}</span>
          <span className="text-sm font-black text-slate-900">₹{summary?.totalCollected.toLocaleString()} / ₹{(summary?.targetGoal || 200000).toLocaleString()}</span>
        </div>
        
        <div className="w-full bg-amber-100/60 rounded-full h-3.5 overflow-hidden p-0.5 border border-amber-200/60">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 h-2.5 rounded-full transition-all duration-500 shadow-xs" style={{ width: `${targetProgress}%` }}></div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center text-xs">
          <div className="bg-emerald-50/50 border border-emerald-200/60 p-3 rounded-2xl">
            <p className="text-slate-600 text-xs font-semibold">Net Treasury Vault</p>
            <p className="text-lg font-black text-emerald-600 mt-0.5">₹{summary?.netTreasuryBalance.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-rose-50/50 border border-rose-200/60 p-3 rounded-2xl">
            <p className="text-slate-600 text-xs font-semibold">Total Expenses</p>
            <p className="text-lg font-black text-rose-600 mt-0.5">₹{summary?.totalSpent.toLocaleString() || '0'}</p>
          </div>
        </div>

        {/* Action Buttons - Role Scoped */}
        <div className={`grid gap-2 pt-3 border-t border-slate-100 ${isCollector ? 'grid-cols-2 sm:grid-cols-4' : isMember ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
          {isCollector && (
            <button 
              onClick={() => setShowAddContribution(true)}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold transition shadow-xs"
            >
              <PlusCircle className="w-4.5 h-4.5 mb-1 text-orange-600" />
              {settings.collectionButtonLabel}
            </button>
          )}

          {isMember && (
            <button 
              onClick={() => setShowAddExpense(true)}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold transition shadow-xs"
            >
              <TrendingDown className="w-4.5 h-4.5 mb-1 text-rose-600" />
              {settings.spendButtonLabel}
            </button>
          )}

          <button 
            onClick={() => setShowRemindCollector(true)}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition shadow-xs"
          >
            <Bell className="w-4.5 h-4.5 mb-1 text-amber-600" />
            Remind Collector
          </button>

          <a 
            href="/api/finance?format=csv"
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition shadow-xs"
          >
            <Download className="w-4.5 h-4.5 mb-1 text-emerald-600" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Mobile Tab Segmented Controls */}
      <div className="flex bg-white border border-amber-200/80 rounded-2xl p-1.5 shadow-sm text-xs font-bold overflow-x-auto">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`flex-1 py-2 px-3 rounded-xl text-center whitespace-nowrap transition ${activeTab === 'overview' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('programmes')} 
          className={`flex-1 py-2 px-3.5 rounded-xl text-center whitespace-nowrap transition flex items-center justify-center space-x-1 ${activeTab === 'programmes' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <span>Schedule & Media</span>
        </button>
        <button 
          onClick={() => setActiveTab('contributions')} 
          className={`flex-1 py-2 px-3.5 rounded-xl text-center whitespace-nowrap transition ${activeTab === 'contributions' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Collections
        </button>
        <button 
          onClick={() => setActiveTab('members')} 
          className={`flex-1 py-2 px-3.5 rounded-xl text-center whitespace-nowrap transition flex items-center justify-center space-x-1 ${activeTab === 'members' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Members Directory</span>
        </button>

        {(totalPendingActionCount > 0 || isSuperAdmin || isTreasurer) && (
          <button 
            onClick={() => setActiveTab('approvals')} 
            className={`flex-1 py-2 px-3.5 rounded-xl text-center whitespace-nowrap transition flex items-center justify-center gap-1 ${activeTab === 'approvals' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm' : 'text-amber-700 hover:text-amber-900'}`}
          >
            <span>Approvals</span>
            {totalPendingActionCount > 0 && (
              <span className="bg-amber-900 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">{totalPendingActionCount}</span>
            )}
          </button>
        )}

        <button 
          onClick={() => setActiveTab('collectors')} 
          className={`flex-1 py-2 px-3.5 rounded-xl text-center whitespace-nowrap transition ${activeTab === 'collectors' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Collectors
        </button>

        {!isViewOnly && (
          <>
            <button 
              onClick={() => setActiveTab('expenses')} 
              className={`flex-1 py-2 px-3.5 rounded-xl text-center whitespace-nowrap transition ${activeTab === 'expenses' ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Expenses
            </button>
            <button 
              onClick={() => setActiveTab('reimbursements')} 
              className={`flex-1 py-2 px-3.5 rounded-xl text-center whitespace-nowrap transition flex items-center justify-center space-x-1 ${activeTab === 'reimbursements' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <span>Reimbursements</span>
              {expenses.filter(e => e.isOutofPocket && !e.isReimbursed).length > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-emerald-600 text-white font-black">
                  {expenses.filter(e => e.isOutofPocket && !e.isReimbursed).length}
                </span>
              )}
            </button>
          </>
        )}

        {isSuperAdmin && (
          <>
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`flex-1 py-2 px-3.5 rounded-xl text-center whitespace-nowrap transition ${activeTab === 'admin' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Roles
            </button>
            <button 
              onClick={() => setActiveTab('branding')} 
              className={`flex-1 py-2 px-3.5 rounded-xl text-center whitespace-nowrap transition ${activeTab === 'branding' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
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
            <div className="bg-amber-500/10 border border-amber-300 p-4 rounded-3xl shadow-xs">
              <div className="flex items-center text-amber-800 text-xs font-bold mb-1">
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Pending Handovers
              </div>
              <p className="text-2xl font-black text-slate-900">₹{summary?.pendingHandovers.toLocaleString()}</p>
              <p className="text-xs text-slate-500 font-medium">Cash waiting approval</p>
            </div>

            <div className="bg-purple-500/10 border border-purple-300 p-4 rounded-3xl shadow-xs">
              <div className="flex items-center text-purple-800 text-xs font-bold mb-1">
                <Wallet className="w-3.5 h-3.5 mr-1 text-purple-600" />
                Owed Out-of-Pocket
              </div>
              <p className="text-2xl font-black text-slate-900">₹{summary?.pendingReimbursements.toLocaleString()}</p>
              <p className="text-xs text-slate-500 font-medium">Spent by members to reimburse</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-amber-200/80 rounded-3xl p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span>Recent Approved Contributions</span>
                <button onClick={() => setActiveTab('contributions')} className="text-orange-600 text-xs normal-case hover:underline font-bold">View All →</button>
              </h3>
              <div className="divide-y divide-slate-100">
                {contributions.filter(c => c.status === 'APPROVED').slice(0, 5).map((c) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{c.memberName} <span className="text-slate-500 font-normal">({c.memberArea})</span></p>
                      <p className="text-[11px] text-slate-500">Collected by: {c.collectorName}</p>
                    </div>
                    <div className="text-right flex items-center space-x-2">
                      <div>
                        <p className="font-black text-emerald-600 text-sm">+₹{c.amount.toLocaleString()}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">{c.paymentMode}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedReceipt(c)}
                        className="p-1.5 rounded-xl bg-amber-100/80 text-amber-800 border border-amber-200 hover:bg-amber-200 shadow-xs"
                        title="View Digital Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-amber-200/80 rounded-3xl p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span>Recent Expenses Log</span>
                <button onClick={() => setActiveTab('expenses')} className="text-rose-600 text-xs normal-case hover:underline font-bold">View All →</button>
              </h3>
              <div className="divide-y divide-slate-100">
                {expenses.slice(0, 5).map((exp) => (
                  <div key={exp.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{exp.title}</p>
                      <p className="text-[11px] text-slate-500">Paid by: {exp.paidByName} ({exp.category})</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-rose-600 text-sm">₹{exp.amount.toLocaleString()}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${exp.isOutofPocket ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
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

      {/* TAB CONTENT: Schedule & Media (Programmes) */}
      {activeTab === 'programmes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-amber-200/80 rounded-3xl p-4 shadow-sm">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-600" />
                Festival Schedule & Media Highlights
              </h3>
              <p className="text-xs text-slate-500 font-medium">Events, daily rituals, photos & official video highlights</p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setShowAddProgramme(true)}
                className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-extrabold text-xs shadow-md transition"
              >
                + Add Activity
              </button>
            )}
          </div>

          {programmes.length === 0 ? (
            <div className="bg-white border border-amber-200/80 rounded-3xl p-8 text-center text-xs text-slate-500 space-y-1 shadow-sm">
              <p className="font-bold text-slate-700 text-sm">No festival activities scheduled yet.</p>
              <p className="text-xs text-slate-500 font-medium">Super Admin can post upcoming rituals, cultural programmes & media links here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programmes.map((prog) => (
                <div key={prog.id} className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">{prog.title}</h4>
                        <p className="text-xs text-cyan-700 font-bold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-600" />
                          {new Date(prog.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          {prog.location && <span className="text-slate-500 font-normal">({prog.location})</span>}
                        </p>
                      </div>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDeleteProgramme(prog.id)}
                          className="text-slate-400 hover:text-rose-600 text-xs p-1 font-bold"
                          title="Remove Activity"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">{prog.description}</p>

                    {/* Media Embedding (Photos / Whitelisted YouTube & Instagram with Click-to-Play & Adaptive Framing) */}
                    <ProgrammeMediaCard prog={prog} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Pending Approvals Queue */}
      {activeTab === 'approvals' && (
        <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center space-x-2 border-b border-amber-100 pb-3">
            <Bell className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Pending Verification Approvals</h3>
          </div>

          {pendingApprovalsForMe.length === 0 ? (
            <p className="text-slate-500 text-xs py-4 text-center font-medium">No pending approvals waiting your verification.</p>
          ) : (
            <div className="space-y-3">
              {pendingApprovalsForMe.map((item) => (
                <div key={item.id} className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{item.memberName}</p>
                      <p className="text-xs text-slate-600 font-medium">Area: {item.memberArea}</p>
                      <p className="text-xs text-slate-500">Note: {item.note || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-orange-600 text-base">₹{item.amount.toLocaleString()}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-slate-700 font-bold border border-slate-200">{item.paymentMode}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => handleDecideContribution(item.id, 'APPROVE')}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold shadow-sm text-xs flex items-center justify-center space-x-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Approve</span>
                    </button>
                    <button 
                      onClick={() => handleDecideContribution(item.id, 'REJECT')}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* COLLECTOR FUND TRANSFER REQUESTS SECTION */}
          <div className="pt-4 border-t border-amber-100 space-y-3">
            <div className="flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-orange-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Pending Collector Transfers For Me ({pendingCollectorTransfersForMe.length})
              </h4>
            </div>

            {pendingCollectorTransfersForMe.length === 0 ? (
              <p className="text-slate-500 text-xs py-3 text-center font-medium bg-amber-50/40 rounded-2xl border border-amber-200/60">
                No pending collector transfer requests.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingCollectorTransfersForMe.map((trans) => (
                  <div key={trans.id} className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm">
                          Transfer Request from <span className="text-orange-600 font-bold">{trans.fromCollectorName}</span>
                        </p>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">Amount: <span className="font-black text-emerald-600 text-sm">₹{trans.amount.toLocaleString()}</span></p>
                        {trans.notes && <p className="text-xs text-slate-500 italic mt-0.5">Note: "{trans.notes}"</p>}
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(trans.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecideCollectorTransfer(trans.id, 'APPROVE')}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-xs flex items-center justify-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Ownership</span>
                      </button>
                      <button
                        onClick={() => handleDecideCollectorTransfer(trans.id, 'REJECT')}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs border border-slate-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MEMBERSHIP UPGRADE REQUESTS SECTION FOR SUPER ADMIN & TREASURER */}
          {(isSuperAdmin || isTreasurer) && (
            <div className="pt-4 border-t border-amber-100 space-y-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Pending Membership Upgrade Requests ({membershipRequests.filter(r => r.status === 'PENDING').length})
                </h4>
              </div>

              {membershipRequests.filter(r => r.status === 'PENDING').length === 0 ? (
                <p className="text-slate-500 text-xs py-3 text-center font-medium bg-amber-50/40 rounded-2xl border border-amber-200/60">
                  No pending membership requests waiting approval.
                </p>
              ) : (
                <div className="space-y-3">
                  {membershipRequests.filter(r => r.status === 'PENDING').map((req) => (
                    <div key={req.id} className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{req.userName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                              Requested {req.requestedRole}
                            </span>
                          </p>
                          <p className="text-xs text-slate-600 font-medium">Email: <span className="text-slate-900 font-bold">{req.userEmail}</span></p>
                          <p className="text-xs text-slate-600 font-medium">Area / Wing: <span className="text-orange-700 font-bold">{req.userArea}</span></p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(req.createdAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleDecideMembershipRequest(req.id, 'APPROVE', 'MEMBER')}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-xs flex items-center justify-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Member</span>
                        </button>
                        <button
                          onClick={() => handleDecideMembershipRequest(req.id, 'APPROVE', 'COLLECTOR')}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-xs"
                        >
                          Approve Collector
                        </button>
                        <button
                          onClick={() => handleDecideMembershipRequest(req.id, 'REJECT')}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs border border-slate-200"
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
        </div>
      )}

      {/* TAB CONTENT: Collectors */}
      {activeTab === 'collectors' && (
        <div className="space-y-4">
          <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-amber-100 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Collector Cash Balances</h3>
              {isCollector && (
                <button 
                  onClick={() => setShowAddHandover(true)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold shadow-xs"
                >
                  + {settings.handoverButtonLabel}
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {collectorBalances.map((col) => (
                <div key={col.collectorId} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{col.collectorName}</p>
                    <p className="text-xs text-slate-500 font-medium">Area: {col.collectorArea}</p>
                    <p className="text-xs text-amber-700 font-semibold">Pending Handover: ₹{col.pendingHandoverAmount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block font-medium">Cash in hand</span>
                    <p className="font-black text-lg text-amber-600">₹{col.cashInHand.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-amber-100 pb-3">Handover Approval Requests & Vouchers</h3>
            {handovers.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 font-medium text-center">No handover requests logged.</p>
            ) : (
              <div className="space-y-3">
                {handovers.map((h) => (
                  <div key={h.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{h.collectorName}</p>
                      <p className="text-xs text-slate-600 font-medium">Area: {h.collectorArea || 'General Area'}</p>
                      <p className="text-xs text-slate-500">Notes: {h.notes || 'N/A'}</p>
                      <span className={`inline-block text-[10px] px-2 py-0.5 mt-1 rounded-md font-bold uppercase ${h.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {h.status}
                      </span>
                    </div>
                    <div className="text-right flex items-center space-x-2">
                      <div>
                        <p className="font-black text-amber-600 text-base mb-1">₹{h.amount.toLocaleString()}</p>
                        {h.status === 'PENDING' && isTreasurer && (
                          <button 
                            onClick={() => handleApproveHandover(h.id)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-xs"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                      <button 
                        onClick={() => setSelectedHandover(h)}
                        className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 shadow-xs"
                        title="View Handover Voucher"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Members Directory & Smart User Management */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Super Admin Smart Suggestions & Add Member Panel */}
          {isSuperAdmin && (
            <div className="space-y-4">
              {/* Smart Merge Suggestions */}
              {smartSuggestions.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-sm">
                    <UserCheck className="w-5 h-5 text-orange-600" />
                    <span>Smart User Merge Suggestions ({smartSuggestions.length})</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    The backend detected collection records logged on the field that match logged-in Google OAuth users. Click merge to link their contribution history into their account.
                  </p>

                  <div className="space-y-2">
                    {smartSuggestions.map((sug, idx) => (
                      <div key={idx} className="bg-white border border-amber-200/80 rounded-2xl p-3 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-xs">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-slate-900">{sug.collectionName}</span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200">{sug.collectionArea}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">{sug.collectionCount} collection(s)</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Matches account: <span className="font-bold text-orange-600">{sug.suggestedUserName}</span> ({sug.suggestedUserEmail})
                          </p>
                        </div>
                        <button
                          onClick={() => handleMergeCollectionUser(sug.collectionName, sug.suggestedUserEmail)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-xs transition transform active:scale-95 shrink-0"
                        >
                          🔗 Merge Under Account
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Member Form Panel */}
              <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm border-b border-amber-100 pb-3">
                  <PlusCircle className="w-5 h-5 text-emerald-600" />
                  <span>Manually Add New Club Member</span>
                </div>

                <form onSubmit={handleAddMemberSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Member Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={addMemberForm.name}
                      onChange={(e) => setAddMemberForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Area / Wing *</label>
                    <select
                      value={addMemberForm.area}
                      onChange={(e) => setAddMemberForm(prev => ({ ...prev, area: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                      required
                    >
                      <option value="">-- Select Area / Wing --</option>
                      {(settings.areaOptions || []).map((area, idx) => (
                        <option key={idx} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Google Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="ramesh@gmail.com"
                      value={addMemberForm.email}
                      onChange={(e) => setAddMemberForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                    <select
                      value={addMemberForm.role}
                      onChange={(e) => setAddMemberForm(prev => ({ ...prev, role: e.target.value as any }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                    >
                      <option value="MEMBER">MEMBER (Standard Access)</option>
                      <option value="COLLECTOR">COLLECTOR (Field Cash Collector)</option>
                      <option value="TREASURER">TREASURER (Financial Auditor)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 pt-2 flex items-center justify-between">
                    {addMemberMsg && (
                      <span className={`text-xs font-bold ${addMemberMsg.startsWith('Error') ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {addMemberMsg}
                      </span>
                    )}
                    <button
                      type="submit"
                      className="ml-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-sm transition transform active:scale-95 flex items-center space-x-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add to Directory</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Members Directory Searchable List */}
          <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-100 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Public Members Directory ({membersDirectory.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">All active members, registered OAuth users, and field collection entities</p>
              </div>

              <input
                type="text"
                placeholder="🔍 Search member name or area..."
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {membersDirectory
                .filter(m => !searchMemberQuery || m.name.toLowerCase().includes(searchMemberQuery.toLowerCase()) || m.area.toLowerCase().includes(searchMemberQuery.toLowerCase()))
                .map((m) => (
                  <div key={m.id} className="p-3.5 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/50 to-white hover:border-amber-200 transition shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        {m.image ? (
                          <img src={m.image} alt={m.name} className="w-8 h-8 rounded-full border border-amber-300 object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {m.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs leading-tight">{m.name}</p>
                          <span className="text-[10px] text-slate-500 font-medium">{m.area}</span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${m.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' : m.role === 'COLLECTOR' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                        {m.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500 font-semibold">Total Contribution:</span>
                      <span className="font-black text-emerald-600 text-xs">₹{m.totalContributed.toLocaleString()} ({m.countContributed} records)</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Collections */}
      {activeTab === 'contributions' && (
        <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-amber-100 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">All Collections Logged</h3>
            {isCollector && (
              <button 
                onClick={() => setShowAddContribution(true)}
                className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xs"
              >
                {settings.collectionButtonLabel}
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {contributions.map((c) => (
              <div key={c.id} className="py-3 text-xs flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 text-sm">{c.memberName}</span>
                    <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium border border-slate-200">{c.memberArea}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Receipt: <span className="text-slate-700 font-mono font-bold">{c.receiptNo}</span></p>
                  <div className="flex gap-2 mt-1 items-center">
                    <span className="text-xs text-slate-500 font-medium">Collector: {c.collectorName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
                <div className="text-right flex items-center space-x-2">
                  <div>
                    <p className="font-black text-emerald-600 text-base">₹{c.amount.toLocaleString()}</p>
                    <span className="text-[10px] text-slate-500 font-bold">{c.paymentMode}</span>
                  </div>
                  {isCollector && c.collectorId.toLowerCase() === (session?.user?.email || '').toLowerCase() && c.status === 'APPROVED' && (
                    <button 
                      onClick={() => {
                        setSelectedContributionForTransfer(c);
                        if (collectorsList.length > 0) {
                          setTargetTransferCollectorEmail(collectorsList.find(u => u.email.toLowerCase() !== (session?.user?.email || '').toLowerCase())?.email || '');
                        }
                      }}
                      className="p-2 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 shadow-xs flex items-center space-x-1"
                      title="Transfer collection entry to another collector"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold hidden sm:inline">Transfer</span>
                    </button>
                  )}
                  {c.status === 'APPROVED' && (
                    <button 
                      onClick={() => setSelectedReceipt(c)}
                      className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 shadow-xs"
                      title="View Digital Receipt"
                    >
                      <Printer className="w-4 h-4" />
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
        <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-amber-100 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Puja Expenses & Out-of-Pocket</h3>
            {isMember && (
              <button 
                onClick={() => setShowAddExpense(true)}
                className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold shadow-xs"
              >
                {settings.spendButtonLabel}
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {expenses.map((exp) => (
              <div key={exp.id} className="py-3 text-xs flex justify-between items-center">
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">{exp.title}</p>
                  <p className="text-xs text-slate-500 font-medium">Paid by: {exp.paidByName}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">{exp.category}</span>
                    {exp.isOutofPocket && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${exp.isReimbursed ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}`}>
                        {exp.isReimbursed ? 'Reimbursed' : 'Owed Out-of-pocket'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-rose-600 text-base">₹{exp.amount.toLocaleString()}</p>
                  {exp.isOutofPocket && !exp.isReimbursed && isTreasurer && (
                    <button 
                      onClick={() => handleSettleReimbursement(exp.id)}
                      className="mt-1 px-3 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs"
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
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-500/10 border border-purple-300 rounded-3xl p-4 shadow-xs">
              <p className="text-xs text-purple-800 font-bold uppercase tracking-wider">Unsettled OOP Claims</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{expenses.filter(e => e.isOutofPocket && !e.isReimbursed).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{expenses.filter(e => e.isOutofPocket && !e.isReimbursed).length} claims pending</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-300 rounded-3xl p-4 shadow-xs">
              <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Total Reimbursed</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ₹{expenses.filter(e => e.isOutofPocket && e.isReimbursed).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{expenses.filter(e => e.isOutofPocket && e.isReimbursed).length} claims settled</p>
            </div>
          </div>

          <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider border-b border-amber-100 pb-3">Out-Of-Pocket Expense Claims Ledger</h3>
            {expenses.filter(e => e.isOutofPocket).length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center font-medium">No out-of-pocket expenses logged yet.</p>
            ) : (
              <div className="space-y-3 divide-y divide-slate-100">
                {expenses.filter(e => e.isOutofPocket).map((exp) => (
                  <div key={exp.id} className="pt-3 first:pt-0 flex justify-between items-start">
                    <div className="space-y-1 max-w-[65%]">
                      <p className="font-extrabold text-slate-900 text-sm">{exp.title}</p>
                      <p className="text-xs text-slate-600 font-medium">Claimant: <span className="text-orange-600 font-bold">{exp.paidByName}</span></p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">{exp.category}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${exp.isReimbursed ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}`}>
                          {exp.isReimbursed ? '✅ Reimbursed' : '⏳ Pending Payment'}
                        </span>
                      </div>
                      {exp.isReimbursed && exp.settlementDate && (
                        <p className="text-[10px] text-slate-500 italic font-medium pt-0.5">
                          Settled via {exp.settlementMode || 'CASH'} on {new Date(exp.settlementDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <p className="font-black text-amber-600 text-base">₹{exp.amount.toLocaleString()}</p>
                      {!exp.isReimbursed && isTreasurer ? (
                        <button
                          onClick={() => handleSettleReimbursement(exp.id)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-xs ml-auto block"
                        >
                          Settle & Pay
                        </button>
                      ) : !exp.isReimbursed ? (
                        <span className="text-[10px] text-slate-400 font-medium">Requires Treasurer approval</span>
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
        <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-amber-100 pb-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Super Admin User Role Console</h3>
              <p className="text-[10px] text-slate-500 font-medium">Promote members or assign custom permissions securely</p>
            </div>
          </div>

          <form onSubmit={handleAssignRole} className="space-y-3 text-xs bg-purple-50/40 p-4 rounded-2xl border border-purple-200/60">
            <div>
              <label className="block text-slate-700 mb-1 font-extrabold">User Email Address(es) - Single or Bulk</label>
              <textarea 
                placeholder="Enter single email or paste bulk emails (separated by commas or newlines)&#10;e.g. member1@gmail.com, collector2@gmail.com"
                rows={3}
                className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-purple-500 font-mono text-[11px]"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                required
              />
              <p className="text-[10px] text-slate-500 mt-1 font-medium">Supports pasting lists from Excel, Google Sheets, or CSV.</p>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-extrabold">Assign Target Role</label>
              <select 
                className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-purple-500 font-bold"
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

            <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-xs transition transform active:scale-95">
              Save Role Assignment
            </button>

            {roleMsg && (
              <p className={`text-[11px] font-bold p-2.5 rounded-xl text-center ${roleMsg.startsWith('Error') ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                {roleMsg}
              </p>
            )}
          </form>

          {/* Role Assignments List */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <h4 className="font-extrabold text-slate-800 text-xs flex justify-between items-center">
              <span>Pre-Registered Role Assignments ({roleAssignments.length})</span>
            </h4>
            {roleAssignments.length === 0 ? (
              <p className="text-[10px] text-slate-500 font-medium">No pre-assigned roles yet.</p>
            ) : (
              <div className="divide-y divide-slate-200 max-h-48 overflow-y-auto pr-1">
                {roleAssignments.map((ra) => (
                  <div key={ra.email} className="py-2 flex justify-between items-center text-[11px]">
                    <div>
                      <p className="font-mono text-slate-900 text-[11px] font-bold">{ra.email}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Assigned by: {ra.assignedBy}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-extrabold text-[10px] border border-purple-200">
                      {ra.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Super Admin Fresh Start Reset Button */}
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 space-y-2">
            <h4 className="font-extrabold text-rose-800 text-xs">⚠️ Fresh Start Data Reset</h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Clear all test contributions, expenses, handovers, and non-admin accounts to prepare the application for official production launch.
            </p>
            <button
              type="button"
              onClick={handleResetDatabase}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-xs shadow-xs transition"
            >
              Reset Application Database (Fresh Start)
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Super Admin Branding Console */}
      {activeTab === 'branding' && isSuperAdmin && (
        <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center space-x-2.5 border-b border-amber-100 pb-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Sliders className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">App Branding & Custom Labels</h3>
              <p className="text-[10px] text-slate-500 font-medium">Customize logos, color themes, and form button labels</p>
            </div>
          </div>

          <form onSubmit={handleUpdateSettings} className="space-y-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-200/60">
            <div>
              <label className="block text-slate-700 mb-1 font-extrabold flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-amber-600" /> App Logo Image
              </label>
              <div className="flex items-center space-x-3">
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo Preview" className="w-10 h-10 rounded-xl object-cover border border-amber-300 shadow-xs" />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-gradient-to-r file:from-orange-500 file:to-amber-500 file:text-white hover:file:from-orange-600 hover:file:to-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-extrabold flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-amber-600" /> Visual Color Theme
              </label>
              <select 
                className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 font-bold"
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
                <label className="block text-slate-700 mb-1 font-extrabold">App Title</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 font-bold"
                  value={settings.appTitle}
                  onChange={(e) => setSettings({ ...settings, appTitle: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-extrabold">Target Amount (₹)</label>
                <input 
                  type="number" 
                  className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 font-bold text-amber-700"
                  value={settings.targetGoalAmount}
                  onChange={(e) => setSettings({ ...settings, targetGoalAmount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-extrabold">Configured Area / Wing Options (Comma-separated)</label>
              <input 
                type="text" 
                className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 font-mono text-xs"
                placeholder="Sector 1 / Wing A, Sector 2 / Wing B, General Area"
                value={(settings.areaOptions || []).join(', ')}
                onChange={(e) => {
                  const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  setSettings({ ...settings, areaOptions: opts });
                }}
              />
              <p className="text-[10px] text-slate-500 mt-1 font-medium">These options will populate dropdown selections in collection forms.</p>
            </div>

            <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-md transition transform active:scale-95">
              Save Branding & Label Customizations
            </button>

            {settingsMsg && (
              <p className={`text-[11px] font-bold p-2.5 rounded-xl text-center ${settingsMsg.startsWith('Error') ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                {settingsMsg}
              </p>
            )}
          </form>
        </div>
      )}

      {/* MODAL: REMIND AREA COLLECTOR TO RECORD CONTRIBUTION */}
      {showRemindCollector && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-amber-200/80 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Remind Collector to Record Contribution</h3>
                  <p className="text-[10px] text-slate-500">Send a quick WhatsApp message to your Area Collector</p>
                </div>
              </div>
              <button onClick={() => setShowRemindCollector(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 font-medium leading-relaxed">
                Paid your Ganesh Puja 2026 Chanda contribution? Select your Area Collector below to send them a pre-filled WhatsApp reminder to log your payment into the official portal.
              </p>

              <div className="space-y-2">
                <label className="block font-extrabold text-slate-800 text-xs">Select Area Collector</label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {collectorBalances.length === 0 ? (
                    <p className="text-slate-500 italic py-2 text-center">No collectors registered yet.</p>
                  ) : (
                    collectorBalances.map((collector) => (
                      <div key={collector.collectorId} className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between">
                        <div>
                          <p className="font-extrabold text-slate-900">{collector.collectorName}</p>
                          <p className="text-[10px] text-slate-600 font-medium">Area: <span className="text-orange-700 font-bold">{collector.collectorArea}</span></p>
                          <p className="text-[10px] text-slate-500">{collector.collectorId}</p>
                        </div>
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                            `Jai Ganesh! 🚩 Hi ${collector.collectorName}, I have contributed my Ganesh Puja 2026 Chanda. Please record my contribution in the Ganesh Puja - LBC portal: https://gp2026.luhurachati.com`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-xs flex items-center space-x-1 whitespace-nowrap"
                        >
                          <span>💬 WhatsApp</span>
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">💡 Don't see your collector?</p>
                <p>Contact the Super Admin at <a href="mailto:luhurenbaiclub@gmail.com" className="text-orange-600 font-bold underline">luhurenbaiclub@gmail.com</a> to verify your contribution.</p>
              </div>

              <button
                onClick={() => setShowRemindCollector(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Close Window
              </button>
            </div>
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
                <label className="block text-slate-400 mb-1 flex justify-between">
                  <span>Member Name</span>
                  <span className="text-[10px] text-amber-400 font-medium">⚡ Auto-indexed from DB</span>
                </label>
                <input 
                  type="text" 
                  list="approved-database-members"
                  placeholder="Type or pick approved member..."
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-orange-500 font-bold"
                  value={contribForm.memberName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matchedUser = registeredUsers.find(u => u.name.toLowerCase() === val.toLowerCase() || u.email.toLowerCase() === val.toLowerCase());
                    if (matchedUser) {
                      setContribForm({ 
                        ...contribForm, 
                        memberName: matchedUser.name, 
                        memberArea: matchedUser.area || contribForm.memberArea 
                      });
                    } else {
                      setContribForm({ ...contribForm, memberName: val });
                    }
                  }}
                  required
                />
                <datalist id="approved-database-members">
                  {registeredUsers.map((u) => (
                    <option key={u.id} value={u.name}>{u.name} ({u.area || 'General Area'}) - {u.email}</option>
                  ))}
                </datalist>
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

      {/* MODAL: Add Programme (Super Admin Only) */}
      {showAddProgramme && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex justify-between items-center">
              <span>+ Add Festival Programme Activity</span>
              <button onClick={() => setShowAddProgramme(false)} className="text-slate-400 text-xs">✕</button>
            </h3>
            <form onSubmit={handleAddProgramme} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Activity Title</label>
                <input
                  type="text"
                  placeholder="e.g. Mahabhishekam & Evening Aarti"
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-semibold"
                  value={programmeForm.title}
                  onChange={(e) => setProgrammeForm({ ...programmeForm, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  value={programmeForm.dateTime}
                  onChange={(e) => setProgrammeForm({ ...programmeForm, dateTime: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Location / Venue (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Main Pandal Hall"
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  value={programmeForm.location}
                  onChange={(e) => setProgrammeForm({ ...programmeForm, location: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Description</label>
                <textarea
                  placeholder="Details about rituals, prasad distribution..."
                  rows={2}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  value={programmeForm.description}
                  onChange={(e) => setProgrammeForm({ ...programmeForm, description: e.target.value })}
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Media Type</label>
                <select
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                  value={programmeForm.mediaType}
                  onChange={(e) => setProgrammeForm({ ...programmeForm, mediaType: e.target.value as any })}
                >
                  <option value="IMAGE">Direct Photo URL (Gallery / Camera)</option>
                  <option value="YOUTUBE">YouTube Video Link (Whitelisted)</option>
                  <option value="INSTAGRAM">Instagram Post / Reel Link (Whitelisted)</option>
                </select>
              </div>

              {programmeForm.mediaType === 'IMAGE' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Photo URL / Upload</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                    value={programmeForm.photoUrl}
                    onChange={(e) => setProgrammeForm({ ...programmeForm, photoUrl: e.target.value })}
                  />
                </div>
              )}

              {(programmeForm.mediaType === 'YOUTUBE' || programmeForm.mediaType === 'INSTAGRAM') && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">
                      Whitelisted {programmeForm.mediaType} Link
                    </label>
                    <input
                      type="url"
                      placeholder={programmeForm.mediaType === 'YOUTUBE' ? 'https://youtube.com/watch?v=...' : 'https://instagram.com/reel/...'}
                      className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                      value={programmeForm.embedUrl}
                      onChange={(e) => setProgrammeForm({ ...programmeForm, embedUrl: e.target.value })}
                    />
                    <p className="text-[9px] text-slate-500 mt-0.5">Only official youtube.com & instagram.com links allowed.</p>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Video Framing / Orientation</label>
                    <select
                      className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                      value={programmeForm.videoOrientation}
                      onChange={(e) => setProgrammeForm({ ...programmeForm, videoOrientation: e.target.value as any })}
                    >
                      <option value="LANDSCAPE">Landscape (16:9 Standard HD)</option>
                      <option value="PORTRAIT">Portrait (9:16 Reel / Shorts)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowAddProgramme(false)} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-cyan-600 text-white font-bold">Publish Activity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Collection Entry Modal */}
      {selectedContributionForTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-amber-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-orange-600 border-b border-amber-100 pb-3">
              <Share2 className="w-5 h-5" />
              <h3 className="font-extrabold text-slate-900 text-sm">Transfer Collection Entry</h3>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 text-xs space-y-1">
              <p className="text-slate-500 font-semibold">Entry Details:</p>
              <p className="font-extrabold text-slate-900">{selectedContributionForTransfer.memberName} ({selectedContributionForTransfer.memberArea})</p>
              <p className="font-black text-emerald-600 text-sm">Amount: ₹{selectedContributionForTransfer.amount.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 font-mono">Receipt: {selectedContributionForTransfer.receiptNo}</p>
            </div>

            <form onSubmit={handleInitiateTransferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Collector *</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                  value={targetTransferCollectorEmail}
                  onChange={(e) => setTargetTransferCollectorEmail(e.target.value)}
                  required
                >
                  <option value="">-- Select Receiving Collector --</option>
                  {collectorsList
                    .filter(u => u.email.toLowerCase() !== (session?.user?.email || '').toLowerCase())
                    .map(col => (
                      <option key={col.id} value={col.email}>{col.name} ({col.area || 'General Area'})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transfer Note / Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Collected on behalf of Collector B on field"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedContributionForTransfer(null)} 
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold shadow-sm hover:from-orange-600 hover:to-amber-600 transition"
                >
                  Request Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
