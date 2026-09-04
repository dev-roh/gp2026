import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb, saveDb, getUserRole } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const userRole = getUserRole(userEmail);

  if (userRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
  }

  const db = getDb();
  return NextResponse.json({
    roleAssignments: Object.values(db.roleAssignments),
    superAdminEmail: 'luhurenbaiclub@gmail.com'
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const superAdminEmail = session?.user?.email;
    const userRole = getUserRole(superAdminEmail);

    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Only Super Admin (luhurenbaiclub@gmail.com) can manage roles.' }, { status: 403 });
    }

    const body = await req.json();
    const { targetEmail, targetEmails, newRole } = body;

    const validRoles = ['SUPER_ADMIN', 'TREASURER', 'COLLECTOR', 'MEMBER', 'VIEW_ONLY'];
    if (!newRole || !validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid target role.' }, { status: 400 });
    }

    const db = getDb();
    const emailsToProcess: string[] = [];

    if (Array.isArray(targetEmails) && targetEmails.length > 0) {
      emailsToProcess.push(...targetEmails.map((e: string) => e.trim().toLowerCase()).filter(Boolean));
    } else if (typeof targetEmail === 'string' && targetEmail.trim()) {
      emailsToProcess.push(targetEmail.trim().toLowerCase());
    } else {
      return NextResponse.json({ error: 'Target email or email list is required.' }, { status: 400 });
    }

    let addedCount = 0;
    emailsToProcess.forEach(email => {
      db.roleAssignments[email] = {
        email,
        role: newRole,
        assignedBy: superAdminEmail || 'SUPER_ADMIN',
        updatedAt: new Date().toISOString()
      };

      // Check if user already registered, update role if present
      const existingUserIndex = db.users.findIndex(u => u.email.toLowerCase() === email);
      if (existingUserIndex !== -1) {
        db.users[existingUserIndex].role = newRole;
      }
      addedCount++;
    });

    saveDb(db);
    return NextResponse.json({ success: true, count: addedCount, message: `Successfully assigned ${newRole} role to ${addedCount} user email(s).` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const superAdminEmail = session?.user?.email;
    const userRole = getUserRole(superAdminEmail);

    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Only Super Admin can reset application database.' }, { status: 403 });
    }

    const db = getDb();
    const superAdminUser = db.users.find(u => u.email.toLowerCase() === 'luhurenbaiclub@gmail.com') || {
      id: 'usr-0',
      name: 'Super Admin',
      email: 'luhurenbaiclub@gmail.com',
      role: 'SUPER_ADMIN',
      area: 'Admin Central',
      createdAt: new Date().toISOString()
    };

    db.contributions = [];
    db.handovers = [];
    db.expenses = [];
    db.notifications = [];
    db.users = [superAdminUser];
    db.roleAssignments = {
      'luhurenbaiclub@gmail.com': {
        email: 'luhurenbaiclub@gmail.com',
        role: 'SUPER_ADMIN',
        assignedBy: 'SYSTEM',
        updatedAt: new Date().toISOString()
      }
    };

    saveDb(db);
    return NextResponse.json({ success: true, message: 'Database reset successfully for fresh start.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
