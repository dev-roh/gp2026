'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import {
  Award,
  PlusCircle,
  Share2,
  ExternalLink,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Upload,
  AlertCircle,
  Building2,
  Lock,
  Loader2,
  Heart
} from 'lucide-react';

interface ApprovedSponsor {
  id: string;
  businessName: string;
  sponsorCategory: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  amount: number;
  sponsorLogoUrl?: string;
  sponsorWebsiteUrl?: string;
  sponsorMapUrl?: string;
  sponsorPhone?: string;
  note?: string;
  date: string;
}

export default function SponsorsPage() {
  const { data: session, status } = useSession();
  const [sponsors, setSponsors] = useState<ApprovedSponsor[]>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(true);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<'ALL' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE'>('ALL');

  // Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Logo file state & validation
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const [logoError, setLogoError] = useState<string>('');

  const [form, setForm] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    category: 'GOLD' as 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE',
    amount: '10000',
    websiteUrl: '',
    mapUrl: '',
    notes: '',
  });

  const fetchSponsors = async () => {
    try {
      setLoadingSponsors(true);
      const res = await fetch('/api/sponsors/apply', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSponsors(data.sponsors || []);
      }
    } catch (e) {
      console.error('Error fetching sponsors:', e);
    } finally {
      setLoadingSponsors(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const handleCategoryChange = (cat: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE') => {
    let defaultAmount = '5000';
    if (cat === 'PLATINUM') defaultAmount = '25000';
    if (cat === 'GOLD') defaultAmount = '10000';
    if (cat === 'SILVER') defaultAmount = '5000';
    if (cat === 'BRONZE') defaultAmount = '2500';

    setForm(prev => ({ ...prev, category: cat, amount: defaultAmount }));
  };

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Strict File Type Validation
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
      setLogoError('Invalid file type! Only image files (PNG, JPG, WEBP, SVG) are allowed.');
      setLogoFile(null);
      setLogoPreviewUrl('');
      return;
    }

    // 2. Strict File Size Validation (Max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('File size exceeds 2 MB! Please upload a compressed logo image under 2MB.');
      setLogoFile(null);
      setLogoPreviewUrl('');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitSponsorship = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!session?.user?.email) {
      signIn('google');
      return;
    }

    if (!form.businessName.trim()) {
      setFormMsg({ text: 'Please enter your Business / Shop name.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sponsors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          contactPerson: form.contactPerson || session.user.name || '',
          logoUrl: logoPreviewUrl || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFormMsg({ text: data.message, type: 'success' });
        setForm({
          businessName: '',
          contactPerson: '',
          phone: '',
          category: 'GOLD',
          amount: '10000',
          websiteUrl: '',
          mapUrl: '',
          notes: '',
        });
        setLogoFile(null);
        setLogoPreviewUrl('');
        setTimeout(() => {
          setShowApplyModal(false);
          setFormMsg(null);
        }, 3000);
      } else {
        setFormMsg({ text: data.error || 'Failed to submit application.', type: 'error' });
      }
    } catch (err: any) {
      setFormMsg({ text: err.message || 'Error submitting application', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const platinumList = sponsors.filter(s => s.sponsorCategory === 'PLATINUM');
  const goldList = sponsors.filter(s => s.sponsorCategory === 'GOLD');
  const silverList = sponsors.filter(s => s.sponsorCategory === 'SILVER');
  const bronzeList = sponsors.filter(s => s.sponsorCategory === 'BRONZE');

  const packagesRef = React.useRef<HTMLDivElement>(null);

  const scrollToPackages = () => {
    if (packagesRef.current) {
      packagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-slate-950 text-slate-100 pb-16 font-sans">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-amber-500/30 px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 font-extrabold text-xs sm:text-sm transition">
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Main App</span>
          </Link>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full shadow-xs">
              Sponsors-First Hub 2026
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-10 sm:py-14 text-center overflow-hidden bg-slate-950 border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-orange-600/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 text-xs font-black uppercase tracking-widest shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Official Festival Sponsorship & Gratitude Deck</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
            Partner With <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">Ganesh Puja 2026</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            Sponsors-First Philosophy: Celebrating local business leaders powering our community festival. Gain high-impact brand exposure across LED pandal screens, digital receipts, and map links!
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={scrollToPackages}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-black text-sm shadow-xl hover:scale-105 transition transform active:scale-95 flex items-center space-x-2 border border-amber-300/60"
            >
              <Award className="w-5 h-5 text-slate-950" />
              <span>Become an Official Sponsor ↓</span>
            </button>

            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `🚩 *Ganesh Puja 2026 - Corporate Sponsorship Invitation* 🐘\n\nPartner with our festival and showcase your brand logo to thousands of local devotees & patrons!\n\n👑 Platinum Sponsor: ₹25,000+\n🥇 Gold Sponsor: ₹10,000+\n🥈 Silver Sponsor: ₹5,000+\n\nView tier details & register online: https://gp2026.luhurachati.com/sponsors`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg transition flex items-center space-x-2 border border-emerald-400/40"
            >
              <Share2 className="w-5 h-5" />
              <span>Share Pitch Deck (WhatsApp)</span>
            </a>
          </div>
        </div>
      </section>

      {/* 1. DIGITAL WALL OF GRATITUDE GALLERY (Rendered First for Sponsors-First Philosophy) */}
      <section className="max-w-6xl mx-auto px-4 py-10 space-y-6 border-b border-slate-900">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-black text-amber-400 flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500 fill-current" />
              <span>Digital Wall of Gratitude ({sponsors.length})</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">Honoring our corporate sponsors and local business patrons</p>
          </div>

          {/* Filter Segmented Controls */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 text-xs font-bold">
            {(['ALL', 'PLATINUM', 'GOLD', 'SILVER'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  selectedFilterCategory === cat ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loadingSponsors ? (
          <div className="text-center py-12 space-y-2">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Loading Wall of Gratitude...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3 max-w-lg mx-auto">
            <Building2 className="w-12 h-12 text-amber-400/50 mx-auto" />
            <h3 className="font-black text-slate-200 text-base">No sponsors published in this tier yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Be the first business to claim sponsorship in this tier and showcase your logo to thousands of devotees!
            </p>
            <button
              onClick={() => {
                if (!session?.user?.email) signIn('google');
                else setShowApplyModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black shadow-md hover:bg-amber-300 transition"
            >
              + Register Business Sponsor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map(s => (
              <div
                key={s.id}
                className={`rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between border transition ${
                  s.sponsorCategory === 'PLATINUM' ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400' :
                  s.sponsorCategory === 'GOLD' ? 'bg-slate-900 border border-amber-400/50' :
                  'bg-slate-900 border border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      {s.sponsorLogoUrl ? (
                        <img
                          src={s.sponsorLogoUrl}
                          alt={s.businessName}
                          className="w-14 h-14 rounded-2xl object-cover border border-amber-400 shrink-0 bg-white p-0.5"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                          {s.businessName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-black text-slate-100 text-base leading-tight">{s.businessName}</h3>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md inline-block mt-1 ${
                          s.sponsorCategory === 'PLATINUM' ? 'bg-amber-400 text-slate-950' :
                          s.sponsorCategory === 'GOLD' ? 'bg-amber-200 text-amber-900' :
                          'bg-slate-700 text-slate-200'
                        }`}>
                          {s.sponsorCategory || 'SPONSOR'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {s.note && (
                    <p className="text-xs text-slate-300 font-medium italic bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                      "{s.note.replace(/^\[Sponsor Note\]:\s*/, '')}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-400">
                  {s.sponsorWebsiteUrl && (
                    <a
                      href={s.sponsorWebsiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Website</span>
                    </a>
                  )}
                  {s.sponsorMapUrl && (
                    <a
                      href={s.sponsorMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Shop Map</span>
                    </a>
                  )}
                  {s.sponsorPhone && (
                    <a href={`tel:${s.sponsorPhone}`} className="text-slate-300 hover:underline flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.sponsorPhone}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. SPONSORSHIP PACKAGES & PRIVILEGES (Scrolled To via CTA Button) */}
      <section ref={packagesRef} className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-black uppercase tracking-widest">
            <span>✨ Take Action & Join Our Festival Partners</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-400">Sponsorship Packages & Privileges</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">Select a tier below to register your business & display your brand logo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Platinum Tier */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl space-y-4 relative flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-bl-xl tracking-widest shadow-md">
              MOST POPULAR
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <span className="text-3xl">👑</span>
                <div>
                  <h3 className="font-black text-amber-400 text-lg">Platinum Partner</h3>
                  <p className="text-xs text-slate-400 font-semibold">Tier 1 Maximum Visibility</p>
                </div>
              </div>
              <p className="text-3xl font-black text-amber-400">₹25,000<span className="text-xs font-normal text-slate-400"> / minimum</span></p>

              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Top Visual Logo</strong> on PWA & LED Pandal Screens</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Logo on <strong>Official Digital PDF Receipts</strong> sent to contributors</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Dedicated WhatsApp & Social Media shoutout</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>VIP Pass & Felicitations during Maha Aarti</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                handleCategoryChange('PLATINUM');
                if (!session?.user?.email) signIn('google');
                else setShowApplyModal(true);
              }}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-md"
            >
              Select Platinum Package
            </button>
          </div>

          {/* Gold Tier */}
          <div className="bg-slate-900 border border-amber-300/40 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <span className="text-3xl">🥇</span>
                <div>
                  <h3 className="font-black text-amber-300 text-lg">Gold Sponsor</h3>
                  <p className="text-xs text-slate-400 font-semibold">Tier 2 Prime Visibility</p>
                </div>
              </div>
              <p className="text-3xl font-black text-orange-400">₹10,000<span className="text-xs font-normal text-slate-400"> / minimum</span></p>

              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Prominent logo placement on Digital Gratitude Wall</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Direct Google Maps Shop location & website link</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Main entrance pandal banner logo listing</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                handleCategoryChange('GOLD');
                if (!session?.user?.email) signIn('google');
                else setShowApplyModal(true);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs transition shadow-md"
            >
              Select Gold Package
            </button>
          </div>

          {/* Silver Tier */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <span className="text-3xl">🥈</span>
                <div>
                  <h3 className="font-black text-slate-200 text-lg">Silver Supporter</h3>
                  <p className="text-xs text-slate-400 font-semibold">Community Brand Partner</p>
                </div>
              </div>
              <p className="text-3xl font-black text-slate-200">₹5,000<span className="text-xs font-normal text-slate-400"> / minimum</span></p>

              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Business name & logo in Digital Sponsor Directory</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Official Digital PDF Thank-You Certificate</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                handleCategoryChange('SILVER');
                if (!session?.user?.email) signIn('google');
                else setShowApplyModal(true);
              }}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs transition border border-slate-700"
            >
              Select Silver Package
            </button>
          </div>
        </div>
      </section>

      {/* BECOME A SPONSOR MODAL (Google Auth Gated + Strict File Validation) */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-400/60 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-slate-100 text-lg">Official Sponsor Application</h3>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {!session?.user?.email ? (
              <div className="text-center py-6 space-y-4">
                <Lock className="w-12 h-12 text-amber-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-black text-slate-100 text-base">Google Sign-in Required</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    To prevent spam and secure sponsor listings, please sign in with Google to submit your business details.
                  </p>
                </div>
                <button
                  onClick={() => signIn('google')}
                  className="px-6 py-3 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg hover:bg-amber-300 transition"
                >
                  Sign in with Google →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitSponsorship} className="space-y-4 text-xs">
                {formMsg && (
                  <div
                    className={`p-3 rounded-2xl font-bold flex items-center gap-2 ${
                      formMsg.type === 'success' ? 'bg-emerald-950 border border-emerald-500 text-emerald-300' : 'bg-rose-950 border border-rose-500 text-rose-300'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formMsg.text}</span>
                  </div>
                )}

                {/* Business Name */}
                <div className="space-y-1">
                  <label className="font-black text-slate-200 uppercase tracking-wider text-[10px]">
                    Business / Shop Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Laxmi Jewellers / Apex Traders"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                    value={form.businessName}
                    onChange={e => setForm({ ...form, businessName: e.target.value })}
                  />
                </div>

                {/* Contact Person & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-black text-slate-200 uppercase tracking-wider text-[10px]">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                      value={form.contactPerson}
                      onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-200 uppercase tracking-wider text-[10px]">
                      WhatsApp / Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Sponsorship Tier & Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-black text-slate-200 uppercase tracking-wider text-[10px]">
                      Sponsorship Tier
                    </label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                      value={form.category}
                      onChange={e => handleCategoryChange(e.target.value as any)}
                    >
                      <option value="PLATINUM">👑 Platinum (₹25,000+)</option>
                      <option value="GOLD">🥇 Gold (₹10,000+)</option>
                      <option value="SILVER">🥈 Silver (₹5,000+)</option>
                      <option value="BRONZE">🥉 Bronze (₹2,500+)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-200 uppercase tracking-wider text-[10px]">
                      Pledge Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                    />
                  </div>
                </div>

                {/* Business Logo File Upload (Strict Validation) */}
                <div className="space-y-1">
                  <label className="font-black text-slate-200 uppercase tracking-wider text-[10px] flex justify-between">
                    <span>Business Logo (Image Only - Max 2MB)</span>
                    <span className="text-amber-400">PNG, JPG, WEBP, SVG</span>
                  </label>

                  <div className="bg-slate-950 border border-dashed border-slate-700 hover:border-amber-400 rounded-2xl p-4 text-center space-y-2 cursor-pointer transition relative">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                      onChange={handleLogoFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {logoPreviewUrl ? (
                      <div className="flex items-center justify-center space-x-3">
                        <img src={logoPreviewUrl} alt="Logo preview" className="w-12 h-12 rounded-xl object-cover border border-amber-400" />
                        <div className="text-left">
                          <p className="font-bold text-slate-100 text-xs">{logoFile?.name}</p>
                          <p className="text-[10px] text-emerald-400 font-semibold">✓ Valid image selected</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="font-bold text-slate-300 text-xs">Click to browse or drop logo image here</p>
                        <p className="text-[10px] text-slate-500 font-medium">Maximum allowed size: 2 MB</p>
                      </div>
                    )}
                  </div>

                  {logoError && (
                    <p className="text-[11px] font-bold text-rose-400 pt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{logoError}</span>
                    </p>
                  )}
                </div>

                {/* Website & Google Maps Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-black text-slate-200 uppercase tracking-wider text-[10px]">
                      Website / Social Media URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourshop.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                      value={form.websiteUrl}
                      onChange={e => setForm({ ...form, websiteUrl: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-200 uppercase tracking-wider text-[10px]">
                      Google Maps Location URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                      value={form.mapUrl}
                      onChange={e => setForm({ ...form, mapUrl: e.target.value })}
                    />
                  </div>
                </div>

                {/* Special Requests / Notes */}
                <div className="space-y-1">
                  <label className="font-black text-slate-200 uppercase tracking-wider text-[10px]">
                    Special Requests / Message
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any specific banner location preferences or Aarti invitations..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !!logoError}
                    className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Submit Sponsorship Application →</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-2">
                    🔒 Applications undergo Super Admin approval before being published to the public Wall of Gratitude.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
