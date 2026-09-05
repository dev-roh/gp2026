import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbAsync, saveDbAsync, getUserRole, User } from '@/lib/db';

const SUPER_ADMIN_EMAIL = 'luhurenbaiclub@gmail.com';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const userRole = getUserRole(userEmail);

    // All authenticated users can view the member directory
    if (!userEmail) {
      return NextResponse.json({ error: 'Access denied. Please sign in.' }, { status: 401 });
    }

    const db = await getDbAsync();

    // Aggregated Members list for public directory
    const memberDirectoryMap: Record<string, { id: string; name: string; area: string; role: string; email?: string; image?: string; isRegistered: boolean; totalContributed: number; countContributed: number }> = {};

    // 1. Process registered & manual users
    db.users.forEach(u => {
      // Calculate contributions total for this user
      const userContribs = db.contributions.filter(c => c.memberId === u.id || (c.memberName && c.memberName.trim().toLowerCase() === u.name.trim().toLowerCase()));
      const totalContributed = userContribs.reduce((sum, c) => sum + (c.status === 'APPROVED' ? c.amount : 0), 0);

      memberDirectoryMap[u.id] = {
        id: u.id,
        name: u.name,
        area: u.area || 'General Area',
        role: u.role,
        email: u.email,
        image: u.image,
        isRegistered: !u.isManual,
        totalContributed,
        countContributed: userContribs.length
      };
    });

    // 2. Extract unlinked collection entities (Collection Entry Users)
    db.contributions.forEach(c => {
      if (c.memberName && c.memberName.trim()) {
        const matchingUser = db.users.find(u => u.id === c.memberId || u.name.trim().toLowerCase() === c.memberName.trim().toLowerCase());
        if (!matchingUser) {
          const key = `entry-${c.memberName.trim().toLowerCase()}`;
          if (!memberDirectoryMap[key]) {
            memberDirectoryMap[key] = {
              id: key,
              name: c.memberName.trim(),
              area: c.memberArea || 'General Area',
              role: 'MEMBER',
              isRegistered: false,
              totalContributed: c.status === 'APPROVED' ? c.amount : 0,
              countContributed: 1
            };
          } else {
            if (c.status === 'APPROVED') memberDirectoryMap[key].totalContributed += c.amount;
            memberDirectoryMap[key].countContributed += 1;
          }
        }
      }
    });

    const membersList = Object.values(memberDirectoryMap);

    // If request is from SUPER_ADMIN, also return smart merge suggestions and pending membership requests
    let smartSuggestions: Array<{ collectionName: string; collectionArea: string; collectionCount: number; suggestedUserEmail: string; suggestedUserName: string; confidence: string }> = [];
    let pendingMembershipRequests: typeof db.membershipRequests = [];

    if (userRole === 'SUPER_ADMIN') {
      pendingMembershipRequests = db.membershipRequests.filter(r => r.status === 'PENDING');

      // Generate smart suggestions between unlinked collection entries & registered OAuth users
      const unlinkedEntryNames = new Set<string>();
      db.contributions.forEach(c => {
        if (c.memberName) {
          const isLinked = db.users.some(u => u.id === c.memberId);
          if (!isLinked) unlinkedEntryNames.add(c.memberName.trim());
        }
      });

      unlinkedEntryNames.forEach(entryName => {
        const entryLower = entryName.toLowerCase();
        const entryContribs = db.contributions.filter(c => c.memberName && c.memberName.trim().toLowerCase() === entryLower);
        const entryArea = entryContribs[0]?.memberArea || 'General Area';

        // Find candidate registered user by fuzzy or token name match
        const candidateUser = db.users.find(u => {
          if (u.role === 'SUPER_ADMIN') return false; // Exclude super admin
          const uLower = u.name.trim().toLowerCase();
          return uLower.includes(entryLower) || entryLower.includes(uLower);
        });

        if (candidateUser) {
          smartSuggestions.push({
            collectionName: entryName,
            collectionArea: entryArea,
            collectionCount: entryContribs.length,
            suggestedUserEmail: candidateUser.email,
            suggestedUserName: candidateUser.name,
            confidence: entryName.toLowerCase() === candidateUser.name.toLowerCase() ? 'HIGH' : 'MEDIUM'
          });
        }
      });
    }

    return NextResponse.json({
      members: membersList,
      currentUserRole: userRole,
      smartSuggestions,
      pendingMembershipRequests,
      allUsers: userRole === 'SUPER_ADMIN' ? db.users : undefined
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const userRole = getUserRole(userEmail);

    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    const db = await getDbAsync();

    // ACTION 1: Manually add a new member
    if (action === 'ADD_MEMBER') {
      const { name, area, phone, email, role } = body;
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Member name is required.' }, { status: 400 });
      }

      const assignedRole = role || 'MEMBER';
      const userEmailTarget = (email && email.trim()) ? email.trim().toLowerCase() : `manual_${Date.now()}@gp2026.local`;

      // Check if user already exists
      const existingUser = db.users.find(u => u.email.toLowerCase() === userEmailTarget || u.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (existingUser) {
        return NextResponse.json({ error: `Member with name/email "${existingUser.name}" already exists.` }, { status: 400 });
      }

      const newUser: User = {
        id: `usr-man-${Date.now()}`,
        name: name.trim(),
        email: userEmailTarget,
        role: assignedRole,
        area: area || 'General Area',
        phone: phone || '',
        isManual: true,
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);

      // Auto link any existing contributions matching this exact name
      db.contributions.forEach(c => {
        if (c.memberName && c.memberName.trim().toLowerCase() === newUser.name.toLowerCase()) {
          c.memberId = newUser.id;
        }
      });

      // Assign role in roleAssignments
      if (userEmailTarget && !userEmailTarget.endsWith('@gp2026.local')) {
        db.roleAssignments[userEmailTarget] = {
          email: userEmailTarget,
          role: assignedRole,
          assignedBy: userEmail || 'SUPER_ADMIN',
          updatedAt: new Date().toISOString()
        };
      }

      await saveDbAsync(db);
      return NextResponse.json({ success: true, user: newUser, message: `Successfully added ${name} to members directory.` });
    }

    // ACTION 2: Smart Merge / Link Collection Entry to User
    if (action === 'MERGE_COLLECTION_USER') {
      const { collectionName, targetUserId, targetUserEmail } = body;
      if (!collectionName || (!targetUserId && !targetUserEmail)) {
        return NextResponse.json({ error: 'Collection name and target user identification are required.' }, { status: 400 });
      }

      const targetUser = db.users.find(u => (targetUserId && u.id === targetUserId) || (targetUserEmail && u.email.toLowerCase() === targetUserEmail.toLowerCase()));
      if (!targetUser) {
        return NextResponse.json({ error: 'Target user account not found.' }, { status: 404 });
      }

      // Safeguard against modifying Super Admin
      if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        return NextResponse.json({ error: 'Cannot merge collection entries into Super Admin account.' }, { status: 400 });
      }

      let mergedCount = 0;
      const collectionLower = collectionName.trim().toLowerCase();

      db.contributions.forEach(c => {
        if (c.memberName && c.memberName.trim().toLowerCase() === collectionLower) {
          c.memberId = targetUser.id;
          c.memberName = targetUser.name;
          if (targetUser.area && targetUser.area !== 'General Area') {
            c.memberArea = targetUser.area;
          }
          mergedCount++;
        }
      });

      await saveDbAsync(db);
      return NextResponse.json({ success: true, count: mergedCount, message: `Merged ${mergedCount} contribution record(s) under ${targetUser.name}.` });
    }

    // ACTION 3: Approve / Reject Membership Request
    if (action === 'HANDLE_MEMBERSHIP_REQUEST') {
      const { requestId, status } = body; // status: 'APPROVED' | 'REJECTED'
      if (!requestId || !['APPROVED', 'REJECTED'].includes(status)) {
        return NextResponse.json({ error: 'Valid Request ID and Status are required.' }, { status: 400 });
      }

      const request = db.membershipRequests.find(r => r.id === requestId);
      if (!request) {
        return NextResponse.json({ error: 'Membership request not found.' }, { status: 404 });
      }

      request.status = status;
      request.decidedBy = userEmail || 'SUPER_ADMIN';
      request.decidedAt = new Date().toISOString();

      if (status === 'APPROVED') {
        const targetEmail = request.userEmail.toLowerCase();
        db.roleAssignments[targetEmail] = {
          email: targetEmail,
          role: request.requestedRole || 'MEMBER',
          assignedBy: userEmail || 'SUPER_ADMIN',
          updatedAt: new Date().toISOString()
        };

        const targetUser = db.users.find(u => u.email.toLowerCase() === targetEmail);
        if (targetUser) {
          targetUser.role = request.requestedRole || 'MEMBER';
          if (request.userArea) targetUser.area = request.userArea;
        }

        // Send approval notification to user
        db.notifications.push({
          id: `notif-${Date.now()}`,
          recipientEmail: targetEmail,
          title: 'Membership Approved',
          message: `Your membership request has been approved! You now have ${request.requestedRole || 'MEMBER'} access.`,
          type: 'MEMBERSHIP_APPROVED',
          targetId: targetEmail,
          isRead: false,
          date: new Date().toISOString()
        });
      }

      await saveDbAsync(db);
      return NextResponse.json({ success: true, message: `Membership request ${status.toLowerCase()} successfully.` });
    }

    return NextResponse.json({ error: 'Invalid action provided.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
