import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbAsync, saveDbAsync, getUserRole, registerOrUpdateUserAsync, logUserActivity } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDbAsync();
    const approvedSponsors = (db.contributions || [])
      .filter(c => c.isSponsorship && c.status === 'APPROVED')
      .map(c => ({
        id: c.id,
        businessName: c.memberName,
        sponsorCategory: c.sponsorCategory || 'GOLD',
        amount: c.amount,
        sponsorLogoUrl: c.sponsorLogoUrl,
        sponsorWebsiteUrl: c.sponsorWebsiteUrl,
        sponsorMapUrl: c.sponsorMapUrl,
        sponsorPhone: c.sponsorPhone,
        note: c.note,
        date: c.date,
      }));

    return NextResponse.json({ sponsors: approvedSponsors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch sponsors' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const userName = session?.user?.name || userEmail?.split('@')[0] || 'Prospective Sponsor';

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with Google to submit a sponsorship application.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      businessName,
      contactPerson,
      phone,
      category,
      amount,
      logoUrl,
      websiteUrl,
      mapUrl,
      notes,
    } = body;

    // Server-side validations
    if (!businessName || !businessName.trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid sponsorship amount.' }, { status: 400 });
    }

    // Validate Logo File / Data URL constraints (Max 2MB, Image MIME only)
    if (logoUrl && typeof logoUrl === 'string') {
      if (logoUrl.startsWith('data:')) {
        const mimeMatch = logoUrl.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,/);
        if (!mimeMatch) {
          return NextResponse.json(
            { error: 'Invalid logo format. Only image files (PNG, JPG, WEBP, SVG) are permitted.' },
            { status: 400 }
          );
        }
        const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
        if (!allowedMimes.includes(mimeMatch[1].toLowerCase())) {
          return NextResponse.json(
            { error: 'Unrecognized image format. Allowed formats: PNG, JPG, WEBP, SVG.' },
            { status: 400 }
          );
        }
        // Check base64 string size (~1.37x ratio for 2.5MB cap)
        const base64Data = logoUrl.split(',')[1] || '';
        const sizeInBytes = (base64Data.length * 3) / 4;
        if (sizeInBytes > 2.5 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Logo image exceeds the maximum 2 MB size limit.' },
            { status: 400 }
          );
        }
      }
    }

    const db = await getDbAsync();

    // 1. Tag user account with SPONSOR role if currently VIEW_ONLY or MEMBER
    const currentRole = getUserRole(userEmail);
    if (currentRole === 'VIEW_ONLY' || currentRole === 'MEMBER') {
      await registerOrUpdateUserAsync(
        userName,
        userEmail,
        session?.user?.image || undefined,
        'SPONSOR'
      );
      // Also tag in local DB users array
      const targetUser = db.users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
      if (targetUser) {
        targetUser.role = 'SPONSOR';
      }
    }

    // 2. Create pending contribution record for Super Admin approval
    const newContributionId = `spn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const receiptNo = `SPN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSponsorshipContribution = {
      id: newContributionId,
      amount: parsedAmount,
      paymentMode: 'UPI' as const,
      receiptNo,
      note: notes ? `[Sponsor Note]: ${notes.trim()}` : `Sponsorship Application - ${contactPerson || userName}`,
      date: new Date().toISOString().split('T')[0],
      memberId: userEmail,
      memberName: businessName.trim(),
      memberArea: 'Corporate Sponsor',
      collectorId: userEmail,
      collectorName: contactPerson || userName,
      status: 'PENDING_SUPER_ADMIN_APPROVAL' as const,
      isSponsorship: true,
      sponsorCategory: category || 'GOLD',
      sponsorLogoUrl: logoUrl || undefined,
      sponsorWebsiteUrl: websiteUrl || undefined,
      sponsorMapUrl: mapUrl || undefined,
      sponsorPhone: phone || undefined,
    };

    db.contributions.push(newSponsorshipContribution);

    // 3. Create Notification for Super Admins
    const superAdminUsers = db.users.filter(u => u.role === 'SUPER_ADMIN');
    if (!db.notifications) db.notifications = [];

    superAdminUsers.forEach(admin => {
      db.notifications.push({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        recipientEmail: admin.email,
        title: '👑 New Corporate Sponsorship Application',
        message: `"${businessName}" (${category} - ₹${parsedAmount.toLocaleString()}) submitted a sponsorship application. Review and approve in Admin panel.`,
        type: 'CONTRIBUTION_APPROVAL_REQUIRED',
        targetId: newContributionId,
        isRead: false,
        date: new Date().toISOString(),
      });
    });

    await saveDbAsync(db);

    await logUserActivity(
      userEmail,
      userName,
      currentRole,
      'SPONSORSHIP_APPLICATION_SUBMITTED',
      `Applied for ${category} sponsorship for "${businessName}" (₹${parsedAmount})`
    );

    return NextResponse.json({
      success: true,
      message: `Thank you! Your sponsorship application for "${businessName}" has been submitted successfully. Our Super Admin team will review and publish your brand logo to the Wall of Gratitude shortly.`,
      contributionId: newContributionId,
    });
  } catch (err: any) {
    console.error('Error in /api/sponsors/apply:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit application' }, { status: 500 });
  }
}
