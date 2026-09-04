import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  
  // Return list of Collectors and Treasurers for tagging, plus all users
  const collectorsAndTreasurers = db.users.filter(u => 
    u.role === 'COLLECTOR' || u.role === 'TREASURER' || u.role === 'SUPER_ADMIN'
  );

  return NextResponse.json({
    users: db.users,
    collectorsAndTreasurers
  });
}
