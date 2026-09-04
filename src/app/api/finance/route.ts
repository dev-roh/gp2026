import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb, saveDb, getUserRole } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');
  const db = getDb();

  if (format === 'csv') {
    let csv = 'Type,ID,Date,Name/Title,Area/Category,Amount,PaymentMode/OutofPocket,Collector/PaidBy,Notes/Status\n';
    
    db.contributions.forEach(c => {
      csv += `Contribution,"${c.id}","${c.date}","${c.memberName}","${c.memberArea}",${c.amount},"${c.paymentMode}","${c.collectorName}","Receipt: ${c.receiptNo}"\n`;
    });

    db.expenses.forEach(e => {
      csv += `Expense,"${e.id}","${e.date}","${e.title}","${e.category}",${e.amount},"${e.isOutofPocket ? 'Out of Pocket' : 'Direct'}","${e.paidByName}","${e.isReimbursed ? 'Reimbursed' : 'Pending Reimbursement'}"\n`;
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="GP2026_Audit_Report.csv"',
      },
    });
  }

  // Calculate Totals
  const totalCollected = db.contributions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSpent = db.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Pending collector cash waiting handover
  const pendingHandovers = db.handovers
    .filter(h => h.status === 'PENDING')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Out of pocket balances owed to individuals
  const pendingReimbursements = db.expenses
    .filter(e => e.isOutofPocket && !e.isReimbursed)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Per collector balances
  const collectorBalances = db.users
    .filter(u => u.role === 'COLLECTOR' || u.role === 'TREASURER' || u.role === 'SUPER_ADMIN')
    .map(collector => {
      const totalCashCollected = db.contributions
        .filter(c => c.collectorId === collector.id && c.paymentMode === 'CASH')
        .reduce((sum, c) => sum + c.amount, 0);
      
      const totalApprovedHandovers = db.handovers
        .filter(h => h.collectorId === collector.id && h.status === 'APPROVED')
        .reduce((sum, h) => sum + h.amount, 0);
      
      const totalPendingHandovers = db.handovers
        .filter(h => h.collectorId === collector.id && h.status === 'PENDING')
        .reduce((sum, h) => sum + h.amount, 0);

      const cashInHand = totalCashCollected - totalApprovedHandovers;
      
      return {
        collectorId: collector.id,
        collectorName: collector.name,
        collectorArea: collector.area || 'General',
        cashInHand,
        pendingHandoverAmount: totalPendingHandovers
      };
    });

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
    latestExpenses: db.expenses.slice().reverse(),
    handovers: db.handovers.slice().reverse()
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = getUserRole(session?.user?.email);

    const body = await req.json();
    const db = getDb();
    const { type, data } = body;

    if (userRole === 'VIEW_ONLY') {
      return NextResponse.json({ error: 'Forbidden. VIEW_ONLY users cannot perform mutations.' }, { status: 403 });
    }

    if (type === 'ADD_CONTRIBUTION') {
      if (userRole === 'MEMBER') {
        return NextResponse.json({ error: 'Forbidden. Members cannot record collections.' }, { status: 403 });
      }
      const newContribution = {
        id: `cnt-${Date.now()}`,
        receiptNo: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString(),
        ...data
      };
      db.contributions.push(newContribution);
      saveDb(db);
      return NextResponse.json({ success: true, item: newContribution });
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
      if (userRole === 'MEMBER') {
        return NextResponse.json({ error: 'Forbidden. Members cannot request cash handovers.' }, { status: 403 });
      }
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
        db.handovers[index].treasurerId = data.treasurerId || 'usr-1';
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
        db.expenses[index].isReimbursed = true;
        saveDb(db);
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
