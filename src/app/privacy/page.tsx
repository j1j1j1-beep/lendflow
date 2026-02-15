import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "OpenShut privacy policy. How we handle your data, documents, and personal information.",
  alternates: { canonical: "https://openshut.me/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <MarketingNav />
      <main className="flex-1 mx-auto max-w-3xl px-6 pt-28 pb-24 sm:pt-36">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">Privacy Policy</h1>
        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <p className="text-sm text-muted-foreground/70">Last updated: February 14, 2026</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">1. Information We Collect</h2>
          <p>When you use OpenShut, we collect information you provide directly: your name, email address, organization name, and billing information. When you upload documents, we process them solely to generate your requested output.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">2. How We Use Your Information</h2>
          <p>We use your information to provide and improve our services, process transactions, and communicate with you about your account. We do not sell your personal information to third parties.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">3. Document Handling</h2>
          <p>Documents you upload are encrypted at rest and in transit. They are processed to generate your requested documents and stored in your organization's isolated environment. We do not use your documents to train AI models. You can delete your documents at any time.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">4. Data Security</h2>
          <p>We implement industry-standard security measures including AES-256 encryption, organization-level data isolation, expiring document links, and full audit trails. Access to your data is restricted to authorized personnel.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">5. Third-Party Services</h2>
          <p>We use third-party services for authentication, payment processing, and infrastructure. These providers are bound by their own privacy policies and our data processing agreements.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">6. Data Retention</h2>
          <p>We retain your account information for as long as your account is active. Generated documents are retained until you delete them or close your account. We may retain certain information as required by law.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">7. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal information at any time by contacting us. You may also request a copy of your data in a portable format.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">8. Contact</h2>
          <p>For privacy-related questions, contact us at <Link href="mailto:privacy@openshut.me" className="text-foreground underline">privacy@openshut.me</Link>.</p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
