import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbAsync, saveDbAsync, getUserRole, registerOrUpdateUser, logUserActivity, supabase } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const userRole = getUserRole(userEmail);

  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let format: string | null = null;
  try {
    if (req?.url && typeof req.url === 'string' && !req.url.includes('[SENSITIVE]')) {
      const { searchParams } = new URL(req.url, 'https://gp2026.luhurachati.com');
      format = searchParams.get('format');
    }
  } catch (e) {}

  const db = await getDbAsync();

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

  // Pending Approvals & Requests requiring action by THIS user
  const pendingApprovalsForMe = db.contributions.filter(c => 
    (c.status === 'PENDING_COLLECTOR_APPROVAL' && c.approverEmail?.toLowerCase() === userEmail.toLowerCase()) ||
    (c.status === 'PENDING_SUPER_ADMIN_APPROVAL' && userRole === 'SUPER_ADMIN')
  );

  const pendingCollectorTransfersForMe = (db.collectorTransfers || []).filter(t =>
    t.status === 'PENDING' && t.toCollectorEmail.toLowerCase() === userEmail.toLowerCase()
  );

  const pendingMembershipRequestsCount = (userRole === 'SUPER_ADMIN' || userRole === 'TREASURER')
    ? (db.membershipRequests || []).filter(r => r.status === 'PENDING').length
    : 0;

  const totalPendingActionCount = pendingApprovalsForMe.length + pendingCollectorTransfersForMe.length + pendingMembershipRequestsCount;

  const canViewPrivate = userRole === 'SUPER_ADMIN' || userRole === 'TREASURER' || userRole === 'COLLECTOR';

  const sanitizedContributions = db.contributions.map(c => {
    if (c.isPrivate && !canViewPrivate) {
      return {
        ...c,
        memberName: 'Anonymous / Confidential',
        memberArea: 'Confidential Area',
        note: c.note ? '*** Private Note ***' : undefined
      };
    }
    return c;
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
    latestContributions: sanitizedContributions.slice().reverse(),
    pendingApprovalsForMe,
    pendingCollectorTransfersForMe,
    collectorTransfers: (db.collectorTransfers || []).slice().reverse(),
    totalPendingActionCount,
    notifications: myNotifications,
    latestExpenses: db.expenses.slice().reverse(),
    handovers: db.handovers.slice().reverse(),
    programmes: (db.programmes || []).slice().reverse(),
    membershipRequests: (db.membershipRequests || []).slice().reverse(),
    users: db.users,
    userActivities: userRole === 'SUPER_ADMIN' ? (db.userActivities || []).slice(0, 100) : []
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
    const db = await getDbAsync();
    const { type, data } = body;

    // SELF CONTRIBUTION / RECORD CONTRIBUTION WORKFLOW
    if (type === 'ADD_SELF_CONTRIBUTION') {
      return NextResponse.json({ error: 'Self-contribution is currently disabled. Please contact your Area Collector to log your contribution.' }, { status: 400 });
    }

    if (type === 'ADD_CONTRIBUTION') {
      if (userRole !== 'COLLECTOR' && userRole !== 'TREASURER' && userRole !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden: Only authorized Area Collectors can record contributions.' }, { status: 403 });
      }

      let status: 'APPROVED' | 'PENDING_COLLECTOR_APPROVAL' | 'PENDING_SUPER_ADMIN_APPROVAL' = 'APPROVED';
      let approverEmail = data.collectorId;

      // Check if the collector is recording their own contribution (requires Admin approval)
      const isOwnCollection = (data.memberId && data.memberId.toLowerCase() === userEmail.toLowerCase()) || 
                             (data.memberName && session?.user?.name && data.memberName.trim().toLowerCase() === session.user.name.trim().toLowerCase());

      if (isOwnCollection) {
        if (userRole === 'COLLECTOR' || userRole === 'TREASURER') {
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
        isSelfContribution: false,
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

      await saveDbAsync(db);
      await logUserActivity(
        userEmail,
        session?.user?.name || userEmail,
        userRole,
        'ADD_CONTRIBUTION',
        `Recorded ₹${data.amount} for ${data.memberName} (${data.paymentMode})`
      );
      return NextResponse.json({ success: true, item: newContribution, status });
    }

    // EDIT CORPORATE SPONSOR (Super Admin Only)
    if (type === 'EDIT_SPONSOR') {
      if (userRole !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden: Only Super Admins can edit corporate sponsor details and logos.' }, { status: 403 });
      }

      const { sponsorId, businessName, category, amount, logoUrl, websiteUrl, mapUrl, phone, notes } = data;
      const index = db.contributions.findIndex(c => c.id === sponsorId);

      if (index === -1) {
        return NextResponse.json({ error: 'Sponsor record not found.' }, { status: 404 });
      }

      const sponsor = db.contributions[index];

      // Update fields
      if (businessName) sponsor.memberName = businessName.trim();
      if (category) sponsor.sponsorCategory = category;
      if (amount !== undefined && !isNaN(Number(amount))) sponsor.amount = Number(amount);
      if (logoUrl !== undefined) sponsor.sponsorLogoUrl = logoUrl || undefined;
      if (websiteUrl !== undefined) sponsor.sponsorWebsiteUrl = websiteUrl || undefined;
      if (mapUrl !== undefined) sponsor.sponsorMapUrl = mapUrl || undefined;
      if (phone !== undefined) sponsor.sponsorPhone = phone || undefined;
      if (notes !== undefined) sponsor.note = notes ? `[Sponsor Note]: ${notes.trim()}` : undefined;

      await saveDbAsync(db);

      await logUserActivity(
        userEmail,
        session?.user?.name || userEmail,
        userRole,
        'EDIT_SPONSOR',
        `Super Admin edited corporate sponsor "${sponsor.memberName}" (${sponsor.sponsorCategory})`
      );

      return NextResponse.json({
        success: true,
        message: `Corporate sponsor "${sponsor.memberName}" updated successfully!`,
        sponsor
      });
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

      await saveDbAsync(db);
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
      await saveDbAsync(db);
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
      await saveDbAsync(db);
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
        await saveDbAsync(db);
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

        await saveDbAsync(db);
        return NextResponse.json({ success: true, item: exp });
      }
    }

    // PROGRAMME ACTIVITIES (SUPER ADMIN ONLY)
    if (type === 'ADD_PROGRAMME') {
      if (userRole !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Only Super Admin can post festival programmes.' }, { status: 403 });
      }

      const { title, description, dateTime, location, photoUrl, mediaType, embedUrl, videoOrientation } = data;

      // Security Whitelisting for YouTube & Instagram URL embeds
      if (mediaType === 'YOUTUBE' && embedUrl) {
        const isWhitelisted = /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i.test(embedUrl);
        if (!isWhitelisted) {
          return NextResponse.json({ error: 'Invalid YouTube URL. Only official youtube.com or youtu.be links are allowed.' }, { status: 400 });
        }
      }

      if (mediaType === 'INSTAGRAM' && embedUrl) {
        const isWhitelisted = /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/.+/i.test(embedUrl);
        if (!isWhitelisted) {
          return NextResponse.json({ error: 'Invalid Instagram URL. Only official instagram.com/p/ or /reel/ links are allowed.' }, { status: 400 });
        }
      }

      const newProg = {
        id: `prog-${Date.now()}`,
        title,
        description,
        dateTime: dateTime || new Date().toISOString(),
        location,
        photoUrl,
        mediaType: mediaType || 'IMAGE',
        embedUrl,
        videoOrientation: videoOrientation || (embedUrl?.includes('/shorts/') || embedUrl?.includes('/reel/') ? 'PORTRAIT' : 'LANDSCAPE'),
        createdAt: new Date().toISOString()
      };

      if (!db.programmes) db.programmes = [];
      db.programmes.push(newProg);
      await saveDbAsync(db);
      return NextResponse.json({ success: true, item: newProg });
    }

    if (type === 'EDIT_PROGRAMME') {
      if (userRole !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Only Super Admin can edit festival programmes.' }, { status: 403 });
      }

      const { programmeId, title, description, dateTime, location, photoUrl, mediaType, embedUrl, videoOrientation } = data;
      if (!programmeId) {
        return NextResponse.json({ error: 'Missing programme ID' }, { status: 400 });
      }

      if (!db.programmes) db.programmes = [];
      const progIndex = db.programmes.findIndex(p => p.id === programmeId);
      if (progIndex === -1) {
        return NextResponse.json({ error: 'Programme not found' }, { status: 404 });
      }

      // Security Whitelisting for YouTube & Instagram URL embeds
      if (mediaType === 'YOUTUBE' && embedUrl) {
        const isWhitelisted = /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i.test(embedUrl);
        if (!isWhitelisted) {
          return NextResponse.json({ error: 'Invalid YouTube URL. Only official youtube.com or youtu.be links are allowed.' }, { status: 400 });
        }
      }

      if (mediaType === 'INSTAGRAM' && embedUrl) {
        const isWhitelisted = /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/.+/i.test(embedUrl);
        if (!isWhitelisted) {
          return NextResponse.json({ error: 'Invalid Instagram URL. Only official instagram.com/p/ or /reel/ links are allowed.' }, { status: 400 });
        }
      }

      db.programmes[progIndex] = {
        ...db.programmes[progIndex],
        title: title || db.programmes[progIndex].title,
        description: description !== undefined ? description : db.programmes[progIndex].description,
        dateTime: dateTime || db.programmes[progIndex].dateTime,
        location: location !== undefined ? location : db.programmes[progIndex].location,
        photoUrl: photoUrl !== undefined ? photoUrl : db.programmes[progIndex].photoUrl,
        mediaType: mediaType || db.programmes[progIndex].mediaType || 'IMAGE',
        embedUrl: embedUrl !== undefined ? embedUrl : db.programmes[progIndex].embedUrl,
        videoOrientation: videoOrientation || db.programmes[progIndex].videoOrientation || 'PORTRAIT'
      };

      await saveDbAsync(db);
      return NextResponse.json({ success: true, item: db.programmes[progIndex] });
    }

    if (type === 'DELETE_PROGRAMME') {
      if (userRole !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Only Super Admin can remove festival programmes.' }, { status: 403 });
      }
      if (!db.programmes) db.programmes = [];
      db.programmes = db.programmes.filter(p => p.id !== data.programmeId);
      if (supabase && data.programmeId) {
        try {
          await supabase.from('programmes').delete().eq('id', data.programmeId);
        } catch (e) {
          console.error('Failed to delete programme from Supabase:', e);
        }
      }
      await saveDbAsync(db);
      return NextResponse.json({ success: true });
    }

    // MEMBERSHIP REQUEST WORKFLOW
    if (type === 'REQUEST_MEMBERSHIP') {
      const userName = data?.userName || session.user?.name || 'Guest User';
      const userArea = data?.userArea || 'General Area';
      
      if (!db.membershipRequests) db.membershipRequests = [];

      // Check if pending request exists
      const existingReq = db.membershipRequests.find(r => r.userEmail.toLowerCase() === userEmail.toLowerCase() && r.status === 'PENDING');
      if (existingReq) {
        return NextResponse.json({ error: 'You already have a pending membership request. Please wait for Super Admin approval.' }, { status: 400 });
      }

      const newReq = {
        id: `mreq-${Date.now()}`,
        userName,
        userEmail,
        userArea,
        requestedRole: 'MEMBER' as const,
        status: 'PENDING' as const,
        createdAt: new Date().toISOString()
      };

      db.membershipRequests.push(newReq);

      // Push notification for Super Admin
      if (!db.notifications) db.notifications = [];
      db.notifications.push({
        id: `notif-${Date.now()}`,
        recipientEmail: 'luhurenbaiclub@gmail.com',
        title: 'New Membership Request 🙋‍♂️',
        message: `${userName} (${userEmail}) from ${userArea} requested Member upgrade access.`,
        type: 'MEMBERSHIP_REQUEST',
        targetId: newReq.id,
        isRead: false,
        date: new Date().toISOString()
      });

      await saveDbAsync(db);
      return NextResponse.json({ success: true, item: newReq });
    }

    if (type === 'DECIDE_MEMBERSHIP_REQUEST') {
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'TREASURER') {
        return NextResponse.json({ error: 'Forbidden. Only Super Admin/Treasurer can approve membership requests.' }, { status: 403 });
      }

      const { requestId, decision, assignedRole } = data;
      if (!db.membershipRequests) db.membershipRequests = [];

      const reqIndex = db.membershipRequests.findIndex(r => r.id === requestId);
      if (reqIndex === -1) {
        return NextResponse.json({ error: 'Membership request not found.' }, { status: 404 });
      }

      const targetReq = db.membershipRequests[reqIndex];
      targetReq.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      targetReq.decidedBy = userEmail;
      targetReq.decidedAt = new Date().toISOString();

      if (decision === 'APPROVE') {
        const finalRole = assignedRole || targetReq.requestedRole || 'MEMBER';
        
        // 1. Assign role in roleAssignments
        if (!db.roleAssignments) db.roleAssignments = {};
        db.roleAssignments[targetReq.userEmail.toLowerCase()] = {
          email: targetReq.userEmail.toLowerCase(),
          role: finalRole,
          assignedBy: userEmail,
          updatedAt: new Date().toISOString()
        };

        // 2. Automatically record/update user details in db.users to optimize searches
        const userObj = registerOrUpdateUser(targetReq.userName, targetReq.userEmail);
        userObj.role = finalRole;
        if (targetReq.userArea) userObj.area = targetReq.userArea;

        // 3. Notify the approved user
        if (!db.notifications) db.notifications = [];
        db.notifications.push({
          id: `notif-${Date.now()}`,
          recipientEmail: targetReq.userEmail,
          title: 'Membership Request Approved! 🎉',
          message: `Congratulations! Your membership request has been approved as ${finalRole} by ${session.user?.name || 'Super Admin'}.`,
          type: 'MEMBERSHIP_APPROVED',
          targetId: targetReq.id,
          isRead: false,
          date: new Date().toISOString()
        });
      }

      await saveDbAsync(db);
      return NextResponse.json({ success: true, item: targetReq });
    }

    if (type === 'INITIATE_COLLECTOR_TRANSFER') {
      if (userRole !== 'COLLECTOR' && userRole !== 'TREASURER' && userRole !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Only collectors can initiate fund transfers.' }, { status: 403 });
      }

      const { contributionId, contributionIds, toCollectorEmail, notes } = data;
      if (!toCollectorEmail) {
        return NextResponse.json({ error: 'Target collector email is required.' }, { status: 400 });
      }

      const targetCollector = db.users.find(u => u.email.toLowerCase() === toCollectorEmail.toLowerCase());
      if (!targetCollector) {
        return NextResponse.json({ error: 'Target collector account not found.' }, { status: 404 });
      }

      let amountToTransfer = 0;
      const targetContributionIds: string[] = [];

      if (Array.isArray(contributionIds) && contributionIds.length > 0) {
        targetContributionIds.push(...contributionIds);
      } else if (contributionId) {
        targetContributionIds.push(contributionId);
      }

      if (targetContributionIds.length > 0) {
        const items = db.contributions.filter(c => targetContributionIds.includes(c.id));
        if (items.length === 0) {
          return NextResponse.json({ error: 'No matching contribution entries found.' }, { status: 404 });
        }

        // Ownership check: only the current collector of these entries can transfer them
        const unauthorized = items.some(c => c.collectorId.toLowerCase() !== userEmail.toLowerCase());
        if (unauthorized && userRole !== 'SUPER_ADMIN') {
          return NextResponse.json({ error: 'Forbidden. You can only transfer contribution entries assigned to your account.' }, { status: 403 });
        }

        const unapproved = items.some(c => c.status !== 'APPROVED');
        if (unapproved) {
          return NextResponse.json({ error: 'Only approved collection entries can be transferred.' }, { status: 400 });
        }

        amountToTransfer = items.reduce((sum, c) => sum + c.amount, 0);
      }

      if (!db.collectorTransfers) db.collectorTransfers = [];

      const newTransfer = {
        id: `trans-${Date.now()}`,
        contributionId: targetContributionIds.length === 1 ? targetContributionIds[0] : undefined,
        contributionIds: targetContributionIds.length > 0 ? targetContributionIds : undefined,
        amount: amountToTransfer,
        fromCollectorEmail: userEmail.toLowerCase(),
        fromCollectorName: session.user?.name || 'Collector',
        toCollectorEmail: targetCollector.email.toLowerCase(),
        toCollectorName: targetCollector.name,
        status: 'PENDING' as const,
        notes,
        createdAt: new Date().toISOString()
      };

      db.collectorTransfers.push(newTransfer);

      // Send notification to receiving collector
      if (!db.notifications) db.notifications = [];
      db.notifications.push({
        id: `notif-${Date.now()}`,
        recipientEmail: targetCollector.email,
        title: 'Collector Transfer Request 🔄',
        message: `${session.user?.name || 'Collector'} requested transfer of ₹${amountToTransfer} (${targetContributionIds.length > 0 ? `${targetContributionIds.length} entry/entries` : 'Cash'}) to you.`,
        type: 'COLLECTOR_TRANSFER_REQUEST',
        targetId: newTransfer.id,
        isRead: false,
        date: new Date().toISOString()
      });

      await saveDbAsync(db);
      return NextResponse.json({ success: true, item: newTransfer, message: 'Transfer request submitted to collector for approval.' });
    }

    if (type === 'DECIDE_COLLECTOR_TRANSFER') {
      const { transferId, decision } = data; // decision: 'APPROVE' | 'REJECT'
      if (!transferId || !['APPROVE', 'REJECT'].includes(decision)) {
        return NextResponse.json({ error: 'Valid transfer ID and decision required.' }, { status: 400 });
      }

      if (!db.collectorTransfers) db.collectorTransfers = [];

      const transfer = db.collectorTransfers.find(t => t.id === transferId);
      if (!transfer) {
        return NextResponse.json({ error: 'Collector transfer request not found.' }, { status: 404 });
      }

      if (transfer.toCollectorEmail.toLowerCase() !== userEmail.toLowerCase() && userRole !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Only the designated recipient collector can approve this transfer.' }, { status: 403 });
      }

      transfer.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      transfer.decidedAt = new Date().toISOString();

      if (decision === 'APPROVE') {
        // Update collector attribution for single or bulk transfer
        const idsToUpdate = new Set<string>();
        if (Array.isArray(transfer.contributionIds) && transfer.contributionIds.length > 0) {
          transfer.contributionIds.forEach(id => idsToUpdate.add(id));
        } else if (transfer.contributionId) {
          idsToUpdate.add(transfer.contributionId);
        }

        if (idsToUpdate.size > 0) {
          db.contributions.forEach(c => {
            if (idsToUpdate.has(c.id)) {
              c.collectorId = transfer.toCollectorEmail;
              c.collectorName = transfer.toCollectorName;
            }
          });
        }

        // Notify initiating collector
        if (!db.notifications) db.notifications = [];
        db.notifications.push({
          id: `notif-${Date.now()}`,
          recipientEmail: transfer.fromCollectorEmail,
          title: 'Collector Transfer Approved ✅',
          message: `${transfer.toCollectorName} accepted your transfer of ₹${transfer.amount}. Ownership updated.`,
          type: 'COLLECTOR_TRANSFER_APPROVED',
          targetId: transfer.id,
          isRead: false,
          date: new Date().toISOString()
        });
      }

      await saveDbAsync(db);
      return NextResponse.json({ success: true, item: transfer, message: `Transfer ${decision.toLowerCase()}d successfully.` });
    }

    if (type === 'DELETE_CONTRIBUTIONS') {
      if (userRole !== 'TREASURER' && userRole !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Only Treasurer or Super Admin can delete contributions.' }, { status: 403 });
      }

      const { contributionIds, reason } = data;
      if (!Array.isArray(contributionIds) || contributionIds.length === 0) {
        return NextResponse.json({ error: 'At least one contribution ID must be selected.' }, { status: 400 });
      }

      if (!reason || typeof reason !== 'string' || !reason.trim()) {
        return NextResponse.json({ error: 'A mandatory reason is required to delete contribution(s).' }, { status: 400 });
      }

      const idsToDelete = new Set(contributionIds);
      const initialCount = db.contributions.length;
      const deletedItems = db.contributions.filter(c => idsToDelete.has(c.id));
      
      db.contributions = db.contributions.filter(c => !idsToDelete.has(c.id));
      const deletedCount = initialCount - db.contributions.length;

      if (supabase && idsToDelete.size > 0) {
        try {
          await supabase.from('contributions').delete().in('id', Array.from(idsToDelete));
        } catch (e) {
          console.error('Failed to delete contributions from Supabase:', e);
        }
      }

      // Log deletion notifications for audit trail
      if (!db.notifications) db.notifications = [];
      deletedItems.forEach(item => {
        db.notifications.push({
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          recipientEmail: 'luhurenbaiclub@gmail.com',
          title: 'Contribution Deleted (Audit Trail) 🗑️',
          message: `Contribution ${item.receiptNo} (₹${item.amount} by ${item.memberName}) deleted by ${session.user?.name || userEmail}. Reason: "${reason.trim()}"`,
          type: 'CONTRIBUTION_APPROVED',
          targetId: item.id,
          isRead: false,
          date: new Date().toISOString()
        });
      });

      await saveDbAsync(db);
      return NextResponse.json({
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} contribution(s).`
      });
    }

    if (type === 'TOGGLE_PRIVATE') {
      if (userRole !== 'COLLECTOR' && userRole !== 'TREASURER' && userRole !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Only Collectors, Treasurer, or Super Admin can change privacy settings.' }, { status: 403 });
      }

      const { contributionId, isPrivate } = data;
      if (!contributionId) {
        return NextResponse.json({ error: 'Contribution ID is required.' }, { status: 400 });
      }

      const index = db.contributions.findIndex(c => c.id === contributionId);
      if (index === -1) {
        return NextResponse.json({ error: 'Contribution not found.' }, { status: 404 });
      }

      db.contributions[index].isPrivate = Boolean(isPrivate);
      await saveDbAsync(db);

      return NextResponse.json({
        success: true,
        item: db.contributions[index],
        message: `Contribution marked as ${isPrivate ? 'Private' : 'Public'}.`
      });
    }

    return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
