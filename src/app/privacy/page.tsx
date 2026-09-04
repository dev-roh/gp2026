import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | GP 2026 Finance',
  description: 'Privacy Policy and data protection details for Ganesh Puja 2026 Financial Portal'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-slate-200">
      <Link href="/" className="inline-flex items-center space-x-1.5 text-xs text-orange-400 hover:text-orange-300 font-bold mb-2">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Portal Home</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-100">Privacy Policy</h1>
            <p className="text-xs text-slate-400 font-medium">Ganesh Puja 2026 Financial Management Portal (gp2026.luhurachati.com)</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-1">
            <h2 className="text-sm font-bold text-orange-400">1. Information We Collect</h2>
            <p>
              When you authenticate using Google OAuth 2.0, we collect basic profile information necessary to verify your identity and manage role-based permissions:
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-400">
              <li>Full Name (as registered with your Google Account)</li>
              <li>Email Address</li>
              <li>Profile Picture URL</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h2 className="text-sm font-bold text-orange-400">2. How We Use Your Data</h2>
            <p>
              Your data is strictly utilized for internal community audit and transparency purposes for Ganesh Puja 2026:
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-400">
              <li>Authenticating users and assigning role permissions (Super Admin, Treasurer, Collector, Member, View Only).</li>
              <li>Linking financial contributions, receipts, out-of-pocket spend claims, and cash handovers to verified members.</li>
              <li>Sending in-app verification notifications for pending approvals.</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h2 className="text-sm font-bold text-orange-400">3. Data Sharing & Privacy</h2>
            <p>
              We do NOT sell, rent, share, or transfer your personal information or Google profile data to any third-party marketing services or external companies. All financial logs are maintained strictly for community transparency.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-sm font-bold text-orange-400">4. Google API Compliance</h2>
            <p>
              Our application adheres strictly to the Google API Services User Data Policy, including the Limited Use requirements.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-sm font-bold text-orange-400">5. Contact Us</h2>
            <p>
              If you have any questions regarding your data privacy or wish to request profile deletion, please contact the Super Admin at:
              <br />
              <span className="font-mono text-emerald-400">luhurenbaiclub@gmail.com</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
