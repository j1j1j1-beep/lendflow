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
} from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const SECURITY_ITEMS = [
  {
    title: "Encryption at rest",
    desc: "Every file is encrypted with AES-256 server-side encryption in AWS S3. Your documents are unreadable without the decryption key, which is managed by AWS KMS.",
    icon: Lock,
  },
  {
    title: "Encryption in transit",
    desc: "All data transmitted over HTTPS/TLS. No exceptions. Every API call, every file upload, every document download is encrypted end to end.",
    icon: ShieldCheck,
  },
  {
    title: "Expiring document links",
    desc: "Download links expire after 1 hour. Upload links expire in 10 minutes. There are no permanent URLs to your documents. If someone intercepts a link, it stops working.",
    icon: Eye,
  },
  {
    title: "Organization-level data isolation",
    desc: "Every database query is scoped to your organization. No cross-tenant data access is possible. Your deals, documents, and financial data are invisible to every other firm on the platform.",
    icon: Building2,
  },
  {
    title: "Append-only audit trail",
    desc: "Every action is logged with the user's identity, IP address, and timestamp. Logs are immutable. Nobody can delete or edit an audit entry after the fact.",
    icon: FileText,
  },
  {
    title: "No AI training on your data",
    desc: "Files are deleted from the AI provider immediately after processing. Nothing is retained. No model is trained on your documents. Your data goes in, your documents come out, and that is the end of it.",
    icon: Scale,
  },
];

const ACCURACY_POINTS = [
  {
    title: "Numbers come from a rules engine, not from AI",
    desc: "Interest rates, LTV ratios, fee structures, tax withholding rates, and deal terms are calculated by a deterministic rules engine that follows program rules exactly. The AI never picks a number. If the SBA 7(a) guarantee fee is 3.5% on a $1.2M loan, that number comes from the program rules, not a language model.",
  },
  {
    title: "AI writes legal language, and cites its sources",
    desc: "The AI writes the prose: default provisions, risk factors, indemnification clauses, tax considerations. Every clause it writes cites the specific law or regulation by section number. If a risk factor references Regulation D, it cites 17 CFR 230.506(b). You can check every citation against the actual statute.",
  },
  {
    title: "Two independent systems verify every number",
    desc: "When you upload documents, two independent extraction systems read every figure. If the two extractions disagree by more than $1, the system flags it for manual review. No number makes it into your final documents without passing this check.",
  },
];

const REGULATIONS = [
  {
    category: "Federal Lending",
    icon: Landmark,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    desc: "The core federal statutes that govern consumer and commercial lending. These rules control disclosure requirements, fair lending, ability-to-repay standards, and reporting obligations.",
    items: [
      "TILA / Regulation Z",
      "RESPA / Regulation X",
      "ECOA / Regulation B",
      "Dodd-Frank ATR/QM Rule",
      "TRID Integrated Disclosures",
      "HMDA / Regulation C",
    ],
  },
  {
    category: "SBA Programs",
    icon: Landmark,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    desc: "The regulatory framework for SBA-guaranteed lending. These rules define eligibility, size standards, guaranty fee tiers, debenture requirements, and permitted use of proceeds across all SBA loan programs.",
    items: [
      "13 CFR 120",
      "SBA SOP 50 10 8",
      "13 CFR 121",
      "SBA Guaranty Fee Tiers",
      "CDC/504 Debenture Requirements",
      "SBA Use of Proceeds Rules",
    ],
  },
  {
    category: "Securities & Fund Formation",
    icon: Building2,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    desc: "The securities exemptions and registration requirements that govern private fund offerings. These rules determine who can invest, what disclosures are required, and how fund managers must report to regulators and investors.",
    items: [
      "Reg D 506(b) / 506(c)",
      "Investment Company Act 3(c)(1) / 3(c)(7)",
      "Form ADV Part 2A",
      "NSMIA / Blue Sky",
      "17 CFR 230.501(a)",
      "ILPA Reporting Template",
    ],
  },
  {
    category: "M&A",
    icon: Handshake,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    desc: "The statutes that govern mergers, acquisitions, and asset purchases. These rules cover merger approval mechanics, appraisal rights, antitrust filing thresholds, tax-free reorganizations, and foreign investment review.",
    items: [
      "DGCL Section 251 / 262 / 271",
      "HSR Act (15 USC 18a)",
      "IRC 338(h)(10) / 368",
      "CFIUS Filing Requirements",
      "IRC 280G",
      "IRC 382",
    ],
  },
  {
    category: "Tax",
    icon: Scale,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    desc: "The Internal Revenue Code sections that affect deal structuring, fund distributions, withholding, and investor tax treatment. These rules determine how gains are taxed, what deferrals are available, and what withholding applies to foreign and domestic partners.",
    items: [
      "IRC 1031",
      "IRC 1400Z-2",
      "IRC 469",
      "IRC 1446 / 1445 / 3406",
      "IRC 199A",
      "IRC 1061",
    ],
  },
  {
    category: "AML & Sanctions",
    icon: ShieldCheck,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    desc: "The anti-money laundering and sanctions rules that apply to financial transactions and investor onboarding. These rules define customer due diligence requirements, sanctions screening obligations, and beneficial ownership reporting.",
    items: [
      "BSA (31 USC 5311)",
      "FinCEN CDD Rule",
      "OFAC Consolidated Sanctions List",
      "USA PATRIOT Act",
      "GENIUS Act",
      "FinCEN Guidance FIN-2019-G001",
    ],
  },
];

const INTEGRATIONS = [
  {
    category: "CRM",
    icon: Building,
    desc: "Pull deal data directly from your CRM. New deals in Salesforce or DealCloud can trigger document generation automatically. Contact and entity data flows in without re-entry.",
    tools: ["Salesforce", "DealCloud", "HubSpot", "Dynamics 365"],
  },
  {
    category: "Fund Administration",
    icon: Landmark,
    desc: "Sync investor records, capital account balances, and distribution schedules with your fund admin platform. Quarterly reports and capital call notices pull live data instead of spreadsheets.",
    tools: ["Juniper Square", "Allvue", "eFront", "Investran"],
  },
  {
    category: "Document Management",
    icon: FileText,
    desc: "Generated documents are filed directly into your DMS with the correct folder structure and metadata. No manual uploads. No version confusion.",
    tools: ["NetDocuments", "iManage", "SharePoint", "Google Drive"],
  },
  {
    category: "Automation",
    icon: Plug,
    desc: "Connect OpenShut to your existing workflows. Trigger document generation from any event in your stack, or push completed documents into downstream systems for review and signature.",
    tools: ["Zapier", "Make", "Workato"],
  },
];

export default function PlatformPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-primary/3 blur-3xl" />

      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-24">
          <FadeIn>
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Security, compliance, and accuracy.{" "}
                <span className="text-primary">The details.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                This page is for your compliance team, your CTO, or anyone who
                needs to know exactly how OpenShut handles your data and verifies
                your documents.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Security */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Security
              </h2>
              <p className="mt-4 text-muted-foreground">
                Six layers of protection between your data and the outside world.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            staggerDelay={0.06}
            initialDelay={0.1}
          >
            {SECURITY_ITEMS.map((item) => (
              <StaggerItem key={item.title}>
                <div className="rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <item.icon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-card-foreground">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* How Accuracy Works */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How accuracy works
              </h2>
              <p className="mt-4 text-muted-foreground">
                This is how we get to a 0% hallucination rate. The system is
                designed so that AI never has the opportunity to make up a number.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-6"
            staggerDelay={0.08}
            initialDelay={0.1}
          >
            {ACCURACY_POINTS.map((point, i) => (
              <StaggerItem key={point.title}>
                <div className="rounded-xl border bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold tabular-nums">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-card-foreground mb-2">
                        {point.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {point.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <FadeIn delay={0.3}>
            <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    The result: 0% hallucination rate
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Because financial figures come from a rules engine and not from
                    AI, and because every extracted number is verified by two
                    independent systems, the AI cannot hallucinate a number into
                    your documents. It writes the words. The rules engine writes the
                    numbers. And two systems make sure the numbers match.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Regulatory Coverage */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Regulatory coverage
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every document OpenShut generates is checked against the statutes
                and regulations that apply to that deal type. Here is the full list
                of what the system covers.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            staggerDelay={0.08}
            initialDelay={0.1}
          >
            {REGULATIONS.map((reg) => (
              <StaggerItem key={reg.category}>
                <div className="rounded-xl border bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${reg.bg} ${reg.color}`}
                    >
                      <reg.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold text-card-foreground">
                      {reg.category}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {reg.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {reg.items.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Enterprise Integrations */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Enterprise integrations
              </h2>
              <p className="mt-4 text-muted-foreground">
                For enterprise clients, we build direct integrations with your
                existing systems. No rip-and-replace. OpenShut fits into the stack
                you already have.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-5 sm:grid-cols-2"
            staggerDelay={0.06}
            initialDelay={0.1}
          >
            {INTEGRATIONS.map((integration) => (
              <StaggerItem key={integration.category}>
                <div className="rounded-xl border bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <integration.icon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-card-foreground">
                      {integration.category}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {integration.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {integration.tools.map((tool) => (
                      <span
                        key={tool}
                        className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      >
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
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8">
                Data handling
              </h2>
              <div className="space-y-6">
                <div className="rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15">
                  <h3 className="text-sm font-semibold text-card-foreground mb-2">
                    Where your data lives
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    All files are stored in AWS S3 with AES-256 server-side
                    encryption. Database records are stored in a managed PostgreSQL
                    instance with encryption at rest. All infrastructure runs in AWS
                    US regions.
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15">
                  <h3 className="text-sm font-semibold text-card-foreground mb-2">
                    What happens during AI processing
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    When the system generates a document, relevant data is sent to
                    the AI provider over an encrypted connection. The AI provider
                    processes the request and returns the result. Your data is
                    deleted from their systems immediately after processing. The AI
                    provider does not store, log, or train on your data.
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15">
                  <h3 className="text-sm font-semibold text-card-foreground mb-2">
                    Who can access your data
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Only authenticated members of your organization can access your
                    data. Every API request is scoped to your organization ID. There
                    is no admin backdoor. OpenShut support staff cannot view your
                    documents unless you explicitly grant temporary access.
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15">
                  <h3 className="text-sm font-semibold text-card-foreground mb-2">
                    What happens when you delete a project
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    When you delete a project, all associated files are permanently
                    removed from S3 and all database records are hard-deleted. This
                    is not a soft delete. The data is gone. Audit log entries are
                    retained for compliance purposes, but they contain no document
                    content.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="w-full border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="relative rounded-2xl border bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 hover:border-foreground/15 hover:shadow-xl">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
              </div>

              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Try it free. See the platform for yourself.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  One project free in any module. Full output. No credit card. No
                  sales call.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <SignInButton mode="modal">
                    <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                      Try It Free
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </SignInButton>
                  <Link
                    href="/pricing"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-8 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-foreground/15"
                  >
                    View Pricing
                  </Link>
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    AES-256 encrypted
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    50-state compliant
                  </span>
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
