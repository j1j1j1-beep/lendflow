import type { Metadata } from "next";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Eye,
  Landmark,
  Building2,
  Handshake,
  Building,
  FileText,
  Plug,
  Scale,
  ChevronDown,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const SECURITY_ITEMS = [
  {
    title: "AES-256 encryption at rest",
    desc: "Every file is encrypted before it hits disk. Decryption keys are managed separately from the files themselves.",
    icon: Lock,
  },
  {
    title: "HTTPS/TLS in transit",
    desc: "Every API call, file upload, and document download goes over HTTPS/TLS.",
    icon: ShieldCheck,
  },
  {
    title: "Links that expire",
    desc: "Download links stop working after 1 hour. Upload links expire in 10 minutes. There are no permanent URLs to your documents.",
    icon: Eye,
  },
  {
    title: "Org-level data isolation",
    desc: "Every database query is scoped to your organization. One firm cannot see another firm's deals, documents, or financials.",
    icon: Building2,
  },
  {
    title: "Append-only audit trail",
    desc: "Every action is logged with user identity, IP address, and timestamp. Logs are append-only and cannot be edited after the fact.",
    icon: FileText,
  },
  {
    title: "We don't train on your data",
    desc: "Documents are processed for your organization only. Your files, deal data, and uploads are never used for model training.",
    icon: Scale,
  },
];

const ACCURACY_POINTS = [
  {
    title: "Every number is calculated, not generated",
    desc: "Financial figures in your documents are never AI-generated. Loan amounts, rates, fees, allocations, and tax withholding are computed directly from your inputs and uploads. AI handles legal language. Math is handled separately.",
  },
  {
    title: "Legal language is checked against real statutes",
    desc: "Every clause is validated against the specific federal and state regulations for your deal type, program, and jurisdiction. Nothing ships without passing.",
  },
  {
    title: "Uploaded financials are verified automatically",
    desc: "When you upload financials, every figure is independently verified before it enters your documents. Discrepancies are flagged for your review. You always have your original documents to check against.",
  },
];

const REGULATIONS = [
  {
    category: "Federal Lending",
    icon: Landmark,
    items: ["TILA / Regulation Z (12 CFR 1026)", "RESPA / Regulation X (12 CFR 1024)", "ECOA / Regulation B (12 CFR 1002)", "Dodd-Frank ATR/QM Rule (12 CFR 1026.43)", "TRID Integrated Disclosures", "HMDA / Regulation C (12 CFR 1003)", "HPML (12 CFR 1026.35)", "FIRREA Appraisal Requirements", "CRA (Community Reinvestment Act)", "Flood Disaster Protection Act (42 USC 4012a)", "UCC Article 9", "State Usury Laws (50 states + DC)", "State Commercial Financing Disclosure Laws"],
  },
  {
    category: "SBA Programs",
    icon: Landmark,
    items: ["13 CFR 120 (SBA Loan Programs)", "SBA SOP 50 10 8", "13 CFR 121 (Size Standards)", "SBA Guaranty Fee Tiers", "CDC/504 Debenture Requirements", "SBA Use of Proceeds Rules", "SBA Affiliation Rules", "SBA Credit Elsewhere Test", "SBA 504 Eligibility Requirements", "SBA Job Creation Requirements"],
  },
  {
    category: "Securities & Fund Formation",
    icon: Building2,
    items: ["Reg D 506(b) / 506(c) (17 CFR 230.506)", "Securities Act of 1933", "Investment Company Act 3(c)(1) / 3(c)(7)", "Form ADV Part 2A (17 CFR 275.203-1)", "NSMIA / Blue Sky Filings", "17 CFR 230.501(a) (Accredited Investor)", "ILPA Reporting Template v2.0", "Rule 10b-5 Anti-Fraud (17 CFR 240.10b-5)", "Section 17(a) Securities Fraud (15 USC 77q)", "Form D / Rule 503 (17 CFR 239.500)", "ERISA (29 CFR 2510.3-101)", "Volcker Rule (12 CFR 248)", "SEC Marketing Rule 206(4)-1", "Form PF (17 CFR 279.9)", "ASC 820 / IPEV Valuation Guidelines"],
  },
  {
    category: "M&A",
    icon: Handshake,
    items: ["DGCL Section 251 / 262 / 271", "HSR Act (15 USC 18a)", "IRC 338(h)(10) / 368 (Tax Elections)", "CFIUS Filing Requirements (31 CFR Part 800)", "IRC 280G (Golden Parachutes)", "IRC 382 (Net Operating Losses)", "WARN Act (29 USC 2101)", "State Mini-WARN Acts (CA, NY, NJ, IL)", "CCPA/CPRA (Data Privacy)", "EU AI Act Compliance", "Supply Chain Transparency Laws", "D&O Tail Coverage Requirements"],
  },
  {
    category: "Tax",
    icon: Scale,
    items: ["IRC 704(b) (Partnership Allocations)", "IRC 754 (Basis Adjustments)", "IRC 1031 (Like-Kind Exchange)", "IRC 1400Z-2 (Opportunity Zones)", "IRC 469 (Passive Activity Rules)", "IRC 1446 / 1445 / 3406 (Withholding)", "IRC 199A (QBI Deduction)", "IRC 1061 (Carried Interest)", "IRC 511-514 (UBTI)", "IRC 1250 (Depreciation Recapture)", "IRC 6698 (Late Filing Penalties)", "FIRPTA (IRC 897/1445)", "OBBBA Bonus Depreciation (2025)"],
  },
  {
    category: "AML & Sanctions",
    icon: ShieldCheck,
    items: ["BSA (31 USC 5311-5332)", "FinCEN CDD Rule (31 CFR 1010.230)", "OFAC Consolidated Sanctions List", "USA PATRIOT Act", "GENIUS Act (P.L. 119-27)", "FinCEN Guidance FIN-2019-G001", "FinCEN BOI Rule (31 CFR 1010.380)", "FATF Recommendation 10", "Source of Funds Requirements", "State Money Transmitter Laws"],
  },
];

const INTEGRATIONS = [
  {
    category: "CRM",
    icon: Building,
    tools: ["Salesforce", "DealCloud", "HubSpot", "Dynamics 365"],
    desc: "New deals in Salesforce or DealCloud can trigger document generation automatically. Contact and entity data flows in without re-entry.",
  },
  {
    category: "Fund Administration",
    icon: Landmark,
    tools: ["Juniper Square", "Allvue", "eFront", "Investran"],
    desc: "Sync investor records, capital account balances, and distribution schedules. Quarterly reports and capital call notices pull live data.",
  },
  {
    category: "Document Management",
    icon: FileText,
    tools: ["NetDocuments", "iManage", "SharePoint", "Google Drive"],
    desc: "Generated documents are filed directly into your DMS with the correct folder structure and metadata.",
  },
  {
    category: "Automation",
    icon: Plug,
    tools: ["Zapier", "Make", "Workato"],
    desc: "Trigger document generation from any event in your stack, or push completed documents into downstream systems for review and signature.",
  },
];

export const metadata: Metadata = {
  title: "Enterprise Security for PE Deal Tools",
  description:
    "Enterprise-grade security for legal automation. Encrypted document handling, org-level isolation, full audit trail. 73 regulatory requirements covered. Built for PE firms handling sensitive deal terms.",
  keywords: ["PE security", "legal automation security", "deal tools security", "encrypted document handling", "SOC 2 compliance", "enterprise legal software"],
  alternates: { canonical: "https://openshut.me/platform" },
  openGraph: {
    title: "Enterprise Security for PE Deal Tools | OpenShut",
    description: "Enterprise-grade security for legal automation. 73 regulatory requirements covered.",
    url: "https://openshut.me/platform",
  },
};

export default function PlatformPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background bg-ambient relative overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full hero-light bg-noise">
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-20 sm:pt-36 sm:pb-24 lg:pt-44 lg:pb-28 relative z-10">
          <FadeIn>
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                How we handle{" "}
                <span className="text-muted-foreground">your data.</span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                For your compliance team, your CTO, or anyone at the firm who
                needs to understand how OpenShut protects data, gets the numbers
                right, and meets regulatory requirements.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Security */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Security
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  How your data is protected at every step.
                </p>
              </div>
            </FadeIn>

            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
              {SECURITY_ITEMS.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="rounded-xl bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                    <div className="flex items-center gap-2.5 mb-3">
                      <item.icon className="h-4 w-4 text-foreground/50" />
                      <h3 className="text-sm font-semibold text-card-foreground">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* How Accuracy Works */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How accuracy works
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Every number is verified. Every clause is checked. Nothing is left to chance.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-5" staggerDelay={0.08} initialDelay={0.1}>
            {ACCURACY_POINTS.map((point, i) => (
              <StaggerItem key={point.title}>
                <div className="rounded-xl bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen">
                  <div className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground text-sm font-bold tabular-nums font-mono inset-shine">
                      0{i + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-card-foreground mb-2">{point.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{point.desc}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <FadeIn delay={0.3}>
            <div className="mt-8 rounded-xl border border-border bg-muted/30 p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-foreground/50 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Hallucination-free, guaranteed
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Financial figures are calculated, not generated. Uploaded
                    numbers are verified and flagged if anything is off. AI
                    handles legal language. Math is handled separately. You always
                    have your original uploads to verify against.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Regulatory Coverage */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Regulatory coverage
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Every document is checked against the statutes and regulations
                  that apply to that specific deal type and jurisdiction.
                </p>
              </div>
            </FadeIn>

            <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-2" staggerDelay={0.08} initialDelay={0.1}>
              {REGULATIONS.map((reg) => (
                <StaggerItem key={reg.category}>
                  <details className="group rounded-xl bg-card card-shine metallic-sheen h-full">
                    <summary className="flex items-center gap-3 p-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground inset-shine">
                        <reg.icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-semibold text-card-foreground flex-1">{reg.category}</h3>
                      <span className="text-xs text-muted-foreground tabular-nums mr-2">{reg.items.length}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="px-6 pb-6 pt-0 flex flex-wrap gap-2">
                      {reg.items.map((item) => (
                        <span key={item} className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {item}
                        </span>
                      ))}
                    </div>
                  </details>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Enterprise Integrations */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Enterprise integrations
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                OpenShut plugs into the tools you already use. Your CRM, fund
                admin, and DMS stay where they are.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2" staggerDelay={0.06} initialDelay={0.1}>
            {INTEGRATIONS.map((integration) => (
              <StaggerItem key={integration.category}>
                <div className="rounded-xl bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <integration.icon className="h-4 w-4 text-foreground/50" />
                    <h3 className="text-sm font-semibold text-card-foreground">{integration.category}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{integration.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {integration.tools.map((tool) => (
                      <span key={tool} className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Data Handling */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8">
                  Data handling
                </h2>
                <Stagger className="space-y-4" staggerDelay={0.06} initialDelay={0.1}>
                  {[
                    { title: "Where your data lives", text: "Files are stored with AES-256 encryption. The database is encrypted at rest. All infrastructure runs in US-based data centers." },
                    { title: "Your data stays yours", text: "We do not train on your data. Your documents, deal terms, and uploaded financials are never used to improve models or shared with third parties. Everything is processed for your organization only." },
                    { title: "Who can access your data", text: "Only authenticated members of your org. Support staff cannot view your documents unless you explicitly grant temporary access." },
                    { title: "What happens when you delete", text: "Delete means delete. Files are removed from storage and database records are hard-deleted. Audit logs are retained for compliance, but they contain no document content." },
                  ].map((item) => (
                    <StaggerItem key={item.title}>
                      <div className="rounded-xl bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen">
                        <h3 className="text-sm font-semibold text-card-foreground mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                      </div>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            </FadeIn>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Bottom CTA */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="relative rounded-2xl bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 card-shine hero-light bg-noise">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  See it yourself.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  Pick any module and see the full document output on a sample deal.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <SignInButton mode="modal">
                    <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                      See a Sample Deal
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </SignInButton>
                  <Link
                    href="/pricing"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-8 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-foreground/15"
                  >
                    See Pricing
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
