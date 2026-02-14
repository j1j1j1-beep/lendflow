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
    title: "Numbers come from program rules",
    desc: "Every number in your documents is calculated from the actual program rules. If the SBA 7(a) guarantee fee is 3.5% on a $1.2M loan, that comes from the SBA's published fee schedule. The AI writes legal language around those numbers but never picks one.",
  },
  {
    title: "Legal language is checked against real statutes",
    desc: "After AI writes default provisions, risk factors, and indemnification clauses, every clause is checked against the specific federal and state regulations for your deal. Citations point to actual statute sections you can look up.",
  },
  {
    title: "Uploaded numbers are cross-checked automatically",
    desc: "When you upload financials, two independent systems extract every figure. If they disagree by more than $1, the system flags it for your review. You always have your original documents to check against.",
  },
];

const REGULATIONS = [
  {
    category: "Federal Lending",
    icon: Landmark,
    items: ["TILA / Regulation Z", "RESPA / Regulation X", "ECOA / Regulation B", "Dodd-Frank ATR/QM Rule", "TRID Integrated Disclosures", "HMDA / Regulation C"],
  },
  {
    category: "SBA Programs",
    icon: Landmark,
    items: ["13 CFR 120", "SBA SOP 50 10 8", "13 CFR 121", "SBA Guaranty Fee Tiers", "CDC/504 Debenture Requirements", "SBA Use of Proceeds Rules"],
  },
  {
    category: "Securities & Fund Formation",
    icon: Building2,
    items: ["Reg D 506(b) / 506(c)", "Investment Company Act 3(c)(1) / 3(c)(7)", "Form ADV Part 2A", "NSMIA / Blue Sky", "17 CFR 230.501(a)", "ILPA Reporting Template"],
  },
  {
    category: "M&A",
    icon: Handshake,
    items: ["DGCL Section 251 / 262 / 271", "HSR Act (15 USC 18a)", "IRC 338(h)(10) / 368", "CFIUS Filing Requirements", "IRC 280G", "IRC 382"],
  },
  {
    category: "Tax",
    icon: Scale,
    items: ["IRC 1031", "IRC 1400Z-2", "IRC 469", "IRC 1446 / 1445 / 3406", "IRC 199A", "IRC 1061"],
  },
  {
    category: "AML & Sanctions",
    icon: ShieldCheck,
    items: ["BSA (31 USC 5311)", "FinCEN CDD Rule", "OFAC Consolidated Sanctions List", "USA PATRIOT Act", "GENIUS Act", "FinCEN Guidance FIN-2019-G001"],
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

export default function PlatformPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full hero-light bg-noise">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
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
        <div className="bg-muted/20 bg-dot-pattern">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Security
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Six layers between your data and the outside world.
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
                AI writes the legal language. It never picks a number. Here is
                how that separation works in practice.
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
                    Zero hallucination, guaranteed
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Financial figures come from program rules. Extracted numbers
                    are cross-checked and flagged if anything is off. AI handles
                    legal language. Math is handled separately. You always have
                    your original uploads to verify against.
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
                  <div className="rounded-xl bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground inset-shine">
                        <reg.icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-semibold text-card-foreground">{reg.category}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {reg.items.map((item) => (
                        <span key={item} className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
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
                    { title: "What happens during AI processing", text: "When you generate a document, relevant data goes to the AI provider over an encrypted connection. We don't train on your data. Documents are processed for your organization only." },
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
              <div className="absolute inset-0 bg-grid-pattern opacity-30" />
              <div className="relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  See it yourself.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  One free project in any module. Full document output.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <SignInButton mode="modal">
                    <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                      Start a Deal Free
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
