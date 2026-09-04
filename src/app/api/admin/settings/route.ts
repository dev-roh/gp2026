import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbAsync, saveDbAsync, getUserRole } from '@/lib/db';

export async function GET() {
  const db = await getDbAsync();
  return NextResponse.json({ settings: db.settings });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = getUserRole(session?.user?.email);

    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Only Super Admin can update branding & settings.' }, { status: 403 });
    }

    const body = await req.json();
    const db = await getDbAsync();

    db.settings = {
      ...db.settings,
      ...body
    };

    await saveDbAsync(db);
    return NextResponse.json({ success: true, settings: db.settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
