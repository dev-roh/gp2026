import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb, saveDb, getUserRole } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const userRole = getUserRole(userEmail);

  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');
  const db = getDb();

  if (format === 'csv') {
    let csv = 'Type,ID,Date,Name/Title,Area/Category,Amount,PaymentMode/OutofPocket,Collector/PaidBy,Status,Notes\n';
    
    db.contributions.forEach(c => {
      csv += `Contribution,"${c.id}","${c.date}","${c.memberName}","${c.memberArea}",${c.amount},"${c.paymentMode}","${c.collectorName}","${c.status}","Receipt: ${c.receiptNo}"\n`;
    });

    db.expenses.forEach(e => {
      csv += `Expense,"${e.id}","${e.date}","${e.title}","${e.category}",${e.amount},"${e.isOutofPocket ? 'Out of Pocket' : 'Direct'}","${e.paidByName}","${e.isReimbursed ? 'Reimbursed' : 'Pending Reimbursement'}","N/A"\n`;
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="GP2026_Audit_Report.csv"',
      },
    });
  }

  // Filter approved contributions for Treasury Vaults
  const approvedContributions = db.contributions.filter(c => c.status === 'APPROVED');
  const totalCollected = approvedContributions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSpent = db.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  const pendingHandovers = db.handovers
    .filter(h => h.status === 'PENDING')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingReimbursements = db.expenses
    .filter(e => e.isOutofPocket && !e.isReimbursed)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Per collector balances
  const collectorBalances = db.users
    .filter(u => u.role === 'COLLECTOR' || u.role === 'TREASURER' || u.role === 'SUPER_ADMIN')
    .map(collector => {
      const totalCashCollected = approvedContributions
        .filter(c => c.collectorId === collector.email && c.paymentMode === 'CASH')
        .reduce((sum, c) => sum + c.amount, 0);
      
      const totalApprovedHandovers = db.handovers
        .filter(h => h.collectorId === collector.email && h.status === 'APPROVED')
        .reduce((sum, h) => sum + h.amount, 0);
      
      const totalPendingHandovers = db.handovers
        .filter(h => h.collectorId === collector.email && h.status === 'PENDING')
        .reduce((sum, h) => sum + h.amount, 0);

      const cashInHand = totalCashCollected - totalApprovedHandovers;
      
      return {
        collectorId: collector.id,
        collectorEmail: collector.email,
        collectorName: collector.name,
        collectorArea: collector.area || 'General',
        cashInHand,
        pendingHandoverAmount: totalPendingHandovers
      };
    });

  // User-specific Notifications
  const myNotifications = (db.notifications || []).filter(n => n.recipientEmail.toLowerCase() === userEmail.toLowerCase());

  // Pending Contributions requiring approval by THIS user
  const pendingApprovalsForMe = db.contributions.filter(c => 
    (c.status === 'PENDING_COLLECTOR_APPROVAL' && c.approverEmail?.toLowerCase() === userEmail.toLowerCase()) ||
    (c.status === 'PENDING_SUPER_ADMIN_APPROVAL' && userRole === 'SUPER_ADMIN')
  );

  return NextResponse.json({
    settings: db.settings,
    summary: {
      totalCollected,
      totalSpent,
      netTreasuryBalance: totalCollected - totalSpent,
      pendingHandovers,
      pendingReimbursements,
      targetGoal: db.settings?.targetGoalAmount || 200000
    },
    collectorBalances,
    latestContributions: db.contributions.slice().reverse(),
    pendingApprovalsForMe,
    notifications: myNotifications,
    latestExpenses: db.expenses.slice().reverse(),
    handovers: db.handovers.slice().reverse()
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const userRole = getUserRole(userEmail);

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const db = getDb();
    const { type, data } = body;

    // SELF CONTRIBUTION / RECORD CONTRIBUTION WORKFLOW
    if (type === 'ADD_SELF_CONTRIBUTION' || type === 'ADD_CONTRIBUTION') {
      const isSelf = type === 'ADD_SELF_CONTRIBUTION';
      let status: 'APPROVED' | 'PENDING_COLLECTOR_APPROVAL' | 'PENDING_SUPER_ADMIN_APPROVAL' = 'APPROVED';
      let approverEmail = data.collectorId;

      // Check if the contribution member is the collector/treasurer themselves or self-contribution
      const isSelfOrOwnCollection = isSelf || (data.memberId && data.memberId.toLowerCase() === userEmail.toLowerCase()) || (data.memberName && session?.user?.name && data.memberName.trim().toLowerCase() === session.user.name.trim().toLowerCase());

      if (isSelfOrOwnCollection) {
        if (userRole === 'VIEW_ONLY' || userRole === 'MEMBER') {
          status = 'PENDING_COLLECTOR_APPROVAL';
        } else if (userRole === 'COLLECTOR' || userRole === 'TREASURER') {
          status = 'PENDING_SUPER_ADMIN_APPROVAL';
          approverEmail = 'luhurenbaiclub@gmail.com';
        } else if (userRole === 'SUPER_ADMIN') {
          status = 'APPROVED';
        }
      }

      const newContribution = {
        id: `cnt-${Date.now()}`,
        receiptNo: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString(),
        status,
        approverEmail,
        isSelfContribution: isSelf,
        ...data
      };

      db.contributions.push(newContribution);

      // Create Notification if approval required
      if (status !== 'APPROVED') {
        db.notifications.push({
          id: `notif-${Date.now()}`,
          recipientEmail: approverEmail,
          title: 'Contribution Approval Required 🔔',
          message: `${data.memberName} (${data.memberArea}) recorded a self-contribution of ₹${data.amount} waiting your verification.`,
          type: 'CONTRIBUTION_APPROVAL_REQUIRED',
          targetId: newContribution.id,
          isRead: false,
          date: new Date().toISOString()
        });
      }

      saveDb(db);
      return NextResponse.json({ success: true, item: newContribution, status });
    }

    // APPROVE / REJECT SELF CONTRIBUTION
    if (type === 'DECIDE_CONTRIBUTION_APPROVAL') {
      const { contributionId, decision } = data; // decision: 'APPROVE' | 'REJECT'
      const index = db.contributions.findIndex(c => c.id === contributionId);

      if (index === -1) {
        return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
      }

      const contrib = db.contributions[index];

      // Validate permission
      const isSuperAdminApprover = contrib.status === 'PENDING_SUPER_ADMIN_APPROVAL' && userRole === 'SUPER_ADMIN';
      const isCollectorApprover = contrib.status === 'PENDING_COLLECTOR_APPROVAL' && contrib.approverEmail?.toLowerCase() === userEmail.toLowerCase();

      if (!isSuperAdminApprover && !isCollectorApprover) {
        return NextResponse.json({ error: 'Forbidden. You are not authorized to decide this approval.' }, { status: 403 });
      }

      if (decision === 'APPROVE') {
        db.contributions[index].status = 'APPROVED';
        db.notifications.push({
          id: `notif-${Date.now()}`,
          recipientEmail: contrib.memberId || userEmail,
          title: 'Contribution Verified & Approved! ✅',
          message: `Your contribution of ₹${contrib.amount} has been verified and added to the official treasury.`,
          type: 'CONTRIBUTION_APPROVED',
          targetId: contrib.id,
          isRead: false,
          date: new Date().toISOString()
        });
      } else {
        db.contributions[index].status = 'REJECTED';
      }

      saveDb(db);
      return NextResponse.json({ success: true, item: db.contributions[index] });
    }

    if (type === 'ADD_EXPENSE') {
      const newExpense = {
        id: `exp-${Date.now()}`,
        date: new Date().toISOString(),
        isReimbursed: false,
        ...data
      };
      db.expenses.push(newExpense);
      saveDb(db);
      return NextResponse.json({ success: true, item: newExpense });
    }

    if (type === 'REQUEST_HANDOVER') {
      const newHandover = {
        id: `hnd-${Date.now()}`,
        status: 'PENDING',
        date: new Date().toISOString(),
        ...data
      };
      db.handovers.push(newHandover);
      saveDb(db);
      return NextResponse.json({ success: true, item: newHandover });
    }

    if (type === 'APPROVE_HANDOVER') {
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'TREASURER') {
        return NextResponse.json({ error: 'Forbidden. Only Super Admin or Treasurer can approve handovers.' }, { status: 403 });
      }
      const index = db.handovers.findIndex(h => h.id === data.handoverId);
      if (index !== -1) {
        db.handovers[index].status = 'APPROVED';
        db.handovers[index].treasurerId = userEmail;
        db.handovers[index].treasurerName = session?.user?.name || 'Treasurer';
        saveDb(db);
        return NextResponse.json({ success: true, item: db.handovers[index] });
      }
    }

    if (type === 'SETTLE_REIMBURSEMENT') {
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'TREASURER') {
        return NextResponse.json({ error: 'Forbidden. Only Super Admin or Treasurer can settle reimbursements.' }, { status: 403 });
      }
      const index = db.expenses.findIndex(e => e.id === data.expenseId);
      if (index !== -1) {
        const exp = db.expenses[index];
        exp.isReimbursed = true;
        exp.settledBy = userEmail;
        exp.settlementMode = data.settlementMode || 'CASH';
        exp.settlementDate = new Date().toISOString();
        exp.settlementNote = data.settlementNote || '';

        // Add Notification to claimant
        if (!db.notifications) db.notifications = [];
        db.notifications.push({
          id: `notif-${Date.now()}`,
          recipientEmail: exp.paidById || 'luhurenbaiclub@gmail.com',
          title: 'Out-Of-Pocket Expense Reimbursed! 💵',
          message: `Your out-of-pocket spend of ₹${exp.amount} for "${exp.title}" has been reimbursed via ${exp.settlementMode}.`,
          type: 'CONTRIBUTION_APPROVED',
          targetId: exp.id,
          isRead: false,
          date: new Date().toISOString()
        });

        saveDb(db);
        return NextResponse.json({ success: true, item: exp });
      }
    }

    return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
