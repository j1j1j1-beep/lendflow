import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  Landmark,
  Building2,
  Handshake,
  Building,
  ShieldCheck,
  FileText,
  ArrowRight,
  CheckCircle2,
  Lock,
  Brain,
  Scale,
  Zap,
  Eye,
  BookOpen,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem, CountUp, ScaleIn } from "@/components/motion";

/* ═══════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════ */

const MODULES = [
  {
    name: "Lending",
    icon: Landmark,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    docs: 36,
    sub: "14 loan programs",
    tagline: "Upload borrower documents. Get a complete loan package.",
    description:
      "Promissory notes, loan agreements, deeds of trust, UCC filings, SBA forms, TRID disclosures. Every number independently verified against the source documents. Rates, fees, and terms set by rules engine.",
    highlights: [
      "SBA 7(a), SBA 504, Commercial CRE, DSCR, Bank Statement, Conventional, Line of Credit, Equipment, Bridge, Multifamily, Mezzanine, Construction, Hard Money, Crypto-Collateralized",
      "Dual verification: Textract and AI extraction compared within $1 tolerance",
      "Full credit analysis with DSCR, DTI, cash flow, and income trends",
      "50-state usury compliance with exact statute citations",
      "16 automated compliance checks per deal",
    ],
  },
  {
    name: "Capital",
    icon: Building2,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    docs: 6,
    sub: "6 fund types",
    tagline: "Configure your fund. Generate the full doc package.",
    description:
      "PPM, subscription agreement, operating agreement, investor questionnaire, side letter, and Form D draft. Reg D 506(b) and 506(c) with proper accreditation verification.",
    highlights: [
      "PE, VC, real estate, hedge fund, credit, and infrastructure funds",
      "3(c)(1) and 3(c)(7) Investment Company Act exemptions",
      "Waterfall structures with carried interest, preferred return, clawback",
      "ERISA considerations with VCOC/REOC elections",
      "Blue sky filings tracked per state",
    ],
  },
  {
    name: "Deals / M&A",
    icon: Handshake,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    docs: 6,
    sub: "8 transaction types",
    tagline: "Structure the deal. LOI through closing.",
    description:
      "LOI, NDA, purchase agreement, due diligence checklist, disclosure schedules, closing checklist. HSR thresholds and filing fees calculated automatically.",
    highlights: [
      "Stock purchase, asset purchase, forward merger, reverse triangular, tender offer, Section 363 sale",
      "HSR filing thresholds and fees at 2026 rates",
      "DGCL compliance: Section 251, 262 appraisal rights, 271",
      "8 tax structures: 338(h)(10), 368 reorganizations, QSBS 1202, 1031",
      "MAC definitions with standard carveouts, R&W insurance",
    ],
  },
  {
    name: "Syndication",
    icon: Building,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    docs: 5,
    sub: "12 property types",
    tagline: "Model the deal. Generate investor docs.",
    description:
      "PPM, operating agreement, subscription agreement, investor questionnaire, and deterministic pro forma. Waterfall distributions calculated year by year.",
    highlights: [
      "Multifamily, office, retail, industrial, mixed use, self storage, MHP, hotel, NNN, senior, student, build-to-rent",
      "IRR computed via Newton's method with year-by-year cash flows",
      "QOZ (26 USC 1400Z-2) and 1031 exchange overlays",
      "Passive activity loss analysis under IRC 469",
      "UBTI disclosure for tax-exempt investors",
    ],
  },
  {
    name: "Compliance",
    icon: ShieldCheck,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    docs: 6,
    sub: "LP reporting",
    tagline: "Fund administration. K-1s, quarterly reports, capital calls.",
    description:
      "ILPA v2.0 compliant quarterly reports. All 19 K-1 fields mapped to IRS Form 1065 Schedule K-1. Form ADV Part 2A with all 18 SEC-required items in plain English.",
    highlights: [
      "LP quarterly reports, capital call notices, distribution notices",
      "Tax withholding: IRC 1446 (30%), 1445 (15% FIRPTA), 3406 (24% backup)",
      "Business day calculation excluding federal holidays",
      "TVPI = DPI + RVPI identity verified to 0.001 tolerance",
      "ASC 820 fair value hierarchy (Level 1/2/3)",
    ],
  },
];

const STEPS = [
  {
    step: "01",
    icon: FileText,
    title: "You configure the deal",
    desc: "Pick the module. Fill in the details. Loan amount, fund terms, purchase price, property type, reporting period. Whatever the project requires.",
  },
  {
    step: "02",
    icon: Zap,
    title: "Rules engine structures everything",
    desc: "Interest rates, LTV ratios, fee structures, DSCR thresholds, waterfall distributions, tax withholding rates. All computed deterministically from program rules. The AI never sets a number.",
  },
  {
    step: "03",
    icon: Brain,
    title: "AI writes legal prose",
    desc: "Default provisions, risk factors, indemnification language, tax considerations. Every clause cites the governing statute by section number. \"13 CFR 120.151\" not \"under federal guidelines.\"",
  },
  {
    step: "04",
    icon: Scale,
    title: "Compliance checks run automatically",
    desc: "Usury limits for all 50 states. Securities exemptions. HSR thresholds. Tax structure validation. ILPA metrics. Every check returns pass or fail with the exact regulation.",
  },
];

const REGULATIONS = [
  {
    icon: Landmark,
    category: "Federal Lending",
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
    icon: BookOpen,
    category: "SBA Programs",
    items: [
      "13 CFR 120 (Loan Programs)",
      "SBA SOP 50 10 8",
      "13 CFR 121 (Size Standards)",
      "SBA Guaranty Fee Tiers",
      "CDC/504 Debenture Requirements",
      "SBA Use of Proceeds Rules",
    ],
  },
  {
    icon: FileText,
    category: "Securities & Fund Formation",
    items: [
      "Reg D 506(b) / 506(c)",
      "Investment Company Act 3(c)(1) / 3(c)(7)",
      "Form ADV Part 2A (17 CFR 275)",
      "NSMIA / Blue Sky Filings",
      "17 CFR 230.501(a) Accreditation",
      "ILPA Reporting Template v2.0",
    ],
  },
  {
    icon: Handshake,
    category: "M&A",
    items: [
      "DGCL Section 251 / 262 / 271",
      "HSR Act (15 USC 18a)",
      "IRC 338(h)(10) / 368 Reorganizations",
      "CFIUS Filing Requirements",
      "IRC 280G Golden Parachute",
      "IRC 382 NOL Limitations",
    ],
  },
  {
    icon: Building2,
    category: "Tax",
    items: [
      "IRC 1031 (Like-Kind Exchange)",
      "IRC 1400Z-2 (Qualified Opportunity Zone)",
      "IRC 469 (Passive Activity Loss)",
      "IRC 1446 / 1445 / 3406 (Withholding)",
      "IRC 199A (Qualified Business Income)",
      "IRC 1061 (Carried Interest)",
    ],
  },
  {
    icon: Lock,
    category: "AML & Sanctions",
    items: [
      "BSA (31 USC 5311)",
      "FinCEN CDD Rule (31 CFR 1010.230)",
      "OFAC Consolidated Sanctions List",
      "USA PATRIOT Act (CIP)",
      "GENIUS Act (P.L. 119-27)",
      "FinCEN Guidance FIN-2019-G001",
    ],
  },
];

const SECURITY_ITEMS = [
  {
    title: "AES-256 encryption at rest",
    desc: "Every document uploaded to S3 is encrypted with AES-256 server-side encryption.",
  },
  {
    title: "HTTPS in transit",
    desc: "All requests encrypted via TLS. No exceptions.",
  },
  {
    title: "Expiring document links",
    desc: "Download links expire after 1 hour. Upload links expire in 10 minutes. No permanent URLs.",
  },
  {
    title: "Organization-level data isolation",
    desc: "Every database query is scoped to your organization. No cross-tenant access.",
  },
  {
    title: "Append-only audit trail",
    desc: "Every action logged with IP address, timestamp, and user identity. Immutable.",
  },
  {
    title: "No training on your data",
    desc: "AI files deleted immediately after processing. No data retained by the AI provider. No model training on your documents.",
  },
];

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-primary/3 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/4 blur-3xl" />

      <MarketingNav />

      {/* ─── HERO ─── */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
          <FadeIn>
            <div className="max-w-4xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                59 document types.
                <br />
                <span className="text-primary">Zero hallucination.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-3xl leading-relaxed">
                Document automation for private equity, lending, and fund administration.
                A deterministic rules engine sets every rate, fee, and threshold.
                AI writes legal prose and cites the governing statute.
                Two independent systems verify every figure.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
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
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  AES-256 encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  Full audit trail
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  No training on your data
                </span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <FadeIn delay={0} className="text-center">
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
                <CountUp to={59} />
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">Document types</div>
            </FadeIn>
            <FadeIn delay={0.05} className="text-center">
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
                <CountUp to={14} />
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">Loan programs</div>
            </FadeIn>
            <FadeIn delay={0.1} className="text-center">
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
                <CountUp to={50} /><span className="text-muted-foreground">-state</span>
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">Regulatory compliance</div>
            </FadeIn>
            <FadeIn delay={0.15} className="text-center">
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
                <CountUp to={0} /><span className="text-muted-foreground">%</span>
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">Hallucination rate</div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── THE SUITE ─── */}
      <section id="suite" className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Five modules. One platform.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Each module generates production-ready legal documents with deterministic compliance checks. Pick the module that fits your deal.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2" staggerDelay={0.08} initialDelay={0.1}>
            {MODULES.map((mod) => (
              <StaggerItem
                key={mod.name}
                className={mod.name === "Compliance" ? "md:col-span-2 md:max-w-[calc(50%-0.75rem)]" : ""}
              >
                <div className="group rounded-xl border bg-card p-8 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${mod.bg} ${mod.color} transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground`}>
                        <mod.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-card-foreground">{mod.name}</h3>
                        <span className="text-xs text-muted-foreground">{mod.sub}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground tabular-nums">
                      {mod.docs} docs
                    </span>
                  </div>

                  <p className="text-sm font-medium text-foreground mb-2">{mod.tagline}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{mod.description}</p>

                  <ul className="space-y-2">
                    {mod.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How the zero-hallucination architecture works
              </h2>
              <p className="mt-4 text-muted-foreground">
                Numbers come from the rules engine. Prose comes from AI. Nothing is made up.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.08} className="group relative text-center">
                <ScaleIn delay={i * 0.08 + 0.05}>
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 group-hover:shadow-xl group-hover:shadow-primary/30 group-hover:scale-105">
                    <step.icon className="h-6 w-6" />
                  </div>
                </ScaleIn>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Step {step.step}
                </div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REGULATORY FRAMEWORK ─── */}
      <section id="regulations" className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-6">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Built on the regulations that govern your deals
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every document is verified against the actual federal and state statutes that apply.
                Not summaries. Not interpretations. The law itself.
              </p>
            </div>
          </FadeIn>

          <Stagger className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
            {REGULATIONS.map((group) => (
              <StaggerItem key={group.category}>
                <div className="group rounded-xl border bg-card p-7 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <group.icon className="h-5 w-5 text-primary transition-transform duration-200 group-hover:scale-110" />
                    <h3 className="text-sm font-semibold text-card-foreground">{group.category}</h3>
                  </div>
                  <ul className="space-y-2">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─── SECURITY ─── */}
      <section id="security" className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Your data is encrypted, isolated, and never used for training
              </h2>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
            {SECURITY_ITEMS.map((item) => (
              <StaggerItem key={item.title}>
                <div className="group rounded-xl border bg-card p-7 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Lock className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-card-foreground">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="relative rounded-2xl border bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 hover:border-foreground/15 hover:shadow-xl">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
              </div>

              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Start with one project.
                  <br className="hidden sm:block" /> Any module. Free.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  Full pipeline. Full document package. No credit card. No commitment.
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
                    Every upload encrypted
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    No credit card required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Full audit trail
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
