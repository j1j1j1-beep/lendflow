import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import {
  FileText,
  ShieldCheck,
  Zap,
  Upload,
  Brain,
  Download,
  CheckCircle2,
  Scale,
  ArrowRight,
  FileStack,
  Clock,
  DollarSign,
  AlertTriangle,
  Lock,
  BookOpen,
  Landmark,
  FlaskConical,
  Microscope,
  TestTubes,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export default async function Home() {
  const { userId } = await auth();

  if (userId) redirect("/dashboard");

  return (
    <div className="dark flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      {/* ── Gradient Orbs ── */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-primary/3 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/4 blur-3xl" />

      <MarketingNav />

      {/* ══════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════ */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
          <div className="max-w-4xl">
            <h1
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              From borrower file to
              <br />
              <span className="text-primary">ready-to-sign deal terms in minutes.</span>
            </h1>
            <p
              className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-4xl leading-relaxed animate-fade-up"
              style={{ animationDelay: "75ms" }}
            >
              Every figure across the borrower&apos;s tax returns, bank
              statements, and financials independently verified and
              cross-referenced. Up to 28 legal documents cited to the governing
              federal or state statute. Your complete loan package, verified
              against federal and state lending regulations, ready in minutes.
              Every output is mathematically verified. Zero hallucinations, guaranteed.
            </p>
            <div
              className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up"
              style={{ animationDelay: "150ms" }}
            >
              <SignInButton mode="modal">
                <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
                  Try It Free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          2. LOAN PROGRAMS
      ══════════════════════════════════════════════ */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
            >
              10 loan programs, each with its own regulatory framework
            </h2>
            <p className="mt-4 text-muted-foreground animate-fade-up" style={{ animationDelay: "50ms" }}>
              Every program has program-specific compliance checks, document requirements, and regulatory references built in.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { name: "SBA 7(a)", docs: "27 docs", delay: "50ms" },
              { name: "SBA 504", docs: "28 docs", delay: "100ms" },
              { name: "Commercial CRE", docs: "23 docs", delay: "150ms" },
              { name: "DSCR", docs: "18 docs", delay: "200ms" },
              { name: "Bank Statement", docs: "18 docs", delay: "250ms" },
              { name: "Conventional Business", docs: "17 docs", delay: "300ms" },
              { name: "Line of Credit", docs: "18 docs", delay: "350ms" },
              { name: "Equipment Financing", docs: "17 docs", delay: "400ms" },
              { name: "Bridge", docs: "20 docs", delay: "450ms" },
              { name: "Crypto-Collateralized", docs: "16 docs", delay: "500ms" },
            ].map((program) => (
              <div
                key={program.name}
                className="rounded-lg border bg-card p-4 text-center animate-fade-up"
                style={{ animationDelay: program.delay }}
              >
                <div className="text-sm font-semibold text-card-foreground">{program.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{program.docs}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          3. HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
            >
              Upload to loan package in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Drop in the borrower file",
                desc: "Tax returns, bank statements, financials. Any format, any volume. Every upload encrypted and processed automatically.",
                delay: "100ms",
              },
              {
                step: "02",
                icon: ShieldCheck,
                title: "Two independent systems verify every number",
                desc: "Each document is read by two separate systems, independently. Every total, subtotal, and line item is recalculated from the raw numbers. Income on a tax return is matched against deposits in the bank statements. If the two systems disagree on a single figure, it gets flagged for review. Nothing slips through the cracks.",
                delay: "175ms",
              },
              {
                step: "03",
                icon: Download,
                title: "Download the complete loan package",
                desc: "Credit memo and up to 28 legal documents, each verified against federal and state lending regulations. Download individually, edit inline, or grab the entire package as a ZIP.",
                delay: "250ms",
              },
            ].map((step) => (
              <div
                key={step.step}
                className="relative text-center animate-fade-up"
                style={{ animationDelay: step.delay }}
              >
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Step {step.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          4. WHAT OPENSHUT HANDLES
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
            >
              What OpenShut handles
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: "Every number independently verified",
                desc: "Every figure is mathematically recalculated and cross-referenced against every other document in the borrower file. If the income on the tax return doesn\u2019t match the deposits in the bank statements, it gets flagged. If line 31 of a 1040 doesn\u2019t match the sum of lines 1 through 25 \u2014 you\u2019ll know.",
                delay: "100ms",
              },
              {
                icon: FileStack,
                title: "Up to 28 legal documents, verified against federal and state law",
                desc: "Promissory notes, loan agreements, deeds of trust, UCC filings, SBA forms, TRID disclosures, environmental indemnities. Every provision cites the governing statute: UCC Article 9, TILA/Reg Z, CERCLA 9601, SBA SOP 50 10. What you currently pay outside counsel tens of thousands per deal to prepare.",
                delay: "150ms",
              },
              {
                icon: Scale,
                title: "50-state regulatory compliance built in",
                desc: "Independent legal review on every document. Regulatory checks against 50-state usury statutes, SBA size standards per 13 CFR 120, HPML thresholds, ATR/QM rules, OFAC, and BSA/AML. Every issue flagged with the exact regulation and the recommended fix.",
                delay: "200ms",
              },
              {
                icon: Brain,
                title: "Full credit evaluation and deal structuring",
                desc: "DSCR, DTI, cash flow analysis, liquidity, income verification, and risk flags. Deal terms structured automatically: rate, LTV, fees, covenants, and conditions. No guesswork. No spreadsheets.",
                delay: "250ms",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-xl border bg-card p-8 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15 animate-fade-up"
                style={{ animationDelay: feature.delay }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-5 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          5. REGULATORY FRAMEWORK
      ══════════════════════════════════════════════ */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
            >
              Built on the regulations that govern your deals
            </h2>
            <p className="mt-4 text-muted-foreground animate-fade-up" style={{ animationDelay: "50ms" }}>
              Every document is verified against the actual federal and state statutes that apply to your loan program. Not summaries. Not interpretations. The law itself.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
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
                delay: "100ms",
              },
              {
                icon: BookOpen,
                category: "SBA Programs",
                items: [
                  "SBA SOP 50 10",
                  "13 CFR 120 (Loan Programs)",
                  "13 CFR 121 (Size Standards)",
                  "SBA Guaranty Fee Tiers",
                  "SBA Use of Proceeds Rules",
                  "CDC/504 Debenture Requirements",
                ],
                delay: "150ms",
              },
              {
                icon: Scale,
                category: "Commercial & Secured Lending",
                items: [
                  "UCC Article 9 (Secured Transactions)",
                  "CERCLA 42 USC 9601 (Environmental)",
                  "FIRREA (Appraisal Requirements)",
                  "Flood Disaster Protection Act",
                  "50-State Usury Statutes",
                  "State Licensing Requirements",
                ],
                delay: "200ms",
              },
              {
                icon: ShieldCheck,
                category: "Compliance & Anti-Fraud",
                items: [
                  "BSA / Anti-Money Laundering",
                  "OFAC Sanctions Screening",
                  "USA PATRIOT Act (CIP)",
                  "GLBA Privacy Requirements",
                  "FinCEN CDD Rule",
                  "HPML Thresholds (Dodd-Frank)",
                ],
                delay: "250ms",
              },
              {
                icon: FileText,
                category: "Document Standards",
                items: [
                  "UCC 9-108 Collateral Descriptions",
                  "UCC 9-503 Debtor Name Requirements",
                  "CERCLA 9607 Liability Standards",
                  "ASTM E1527-21 (Phase I ESA)",
                  "ABA Legal Opinion Standards",
                  "IRS Form Specifications",
                ],
                delay: "300ms",
              },
              {
                icon: Lock,
                category: "Security & Data",
                items: [
                  "End-to-end encryption at rest and in transit",
                  "Full audit trail on all actions",
                  "Role-based access controls",
                  "Organization-level data isolation",
                  "Secure document access with expiring links",
                  "No borrower data shared or used for training",
                ],
                delay: "350ms",
              },
            ].map((group) => (
              <div
                key={group.category}
                className="rounded-xl border bg-card p-7 animate-fade-up"
                style={{ animationDelay: group.delay }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <group.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold text-card-foreground">
                    {group.category}
                  </h3>
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
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          6. STATS
      ══════════════════════════════════════════════ */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: "Up to 28", label: "Legal documents per deal", delay: "100ms" },
              { value: "50", suffix: "-state", label: "Regulatory compliance", delay: "150ms" },
              { value: "10", label: "Loan programs supported", delay: "200ms" },
              { value: "75", suffix: "+", label: "Federal and state regulations", delay: "250ms" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center animate-fade-up"
                style={{ animationDelay: stat.delay }}
              >
                <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-muted-foreground">{stat.suffix}</span>
                  )}
                </div>
                <div className="mt-1.5 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          7. THE PROBLEM
      ══════════════════════════════════════════════ */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <h2
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-center mb-4 animate-fade-up"
          >
            You already know what&apos;s broken
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "50ms" }}>
            Every lending team deals with the same bottlenecks. The question is whether you keep paying for them.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: Clock,
                stat: "Weeks",
                label: "per deal in analyst time",
                desc: "Manually keying numbers from tax returns, cross-referencing bank statements, catching your own typos. Your best people spend most of their time on data entry.",
                delay: "100ms",
              },
              {
                icon: DollarSign,
                stat: "Tens of thousands",
                label: "in legal fees per deal",
                desc: "Outside counsel drafts the same loan agreement for the hundredth time. You pay partner rates for work that should take minutes, not weeks.",
                delay: "175ms",
              },
              {
                icon: AlertTriangle,
                stat: "Error-prone",
                label: "constant risk of data errors",
                desc: "Manual data entry across documents creates discrepancies that slip through review. One wrong number in a debt-service calculation changes the entire credit decision.",
                delay: "250ms",
              },
            ].map((problem) => (
              <div
                key={problem.label}
                className="rounded-xl border border-destructive/20 bg-destructive/5 p-7 animate-fade-up"
                style={{ animationDelay: problem.delay }}
              >
                <problem.icon className="h-5 w-5 text-destructive mb-4" />
                <div className="text-xl font-bold text-foreground">{problem.stat}</div>
                <div className="text-sm font-medium text-foreground mt-0.5">{problem.label}</div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{problem.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BIO VERTICAL — TRANSITION
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50" id="bio">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 animate-fade-up"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Also from OpenShut
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BIO HERO
      ══════════════════════════════════════════════ */}
      <section className="relative w-full border-t border-emerald-500/10 bg-emerald-500/[0.02]">
        <div className="pointer-events-none absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="max-w-4xl">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 animate-fade-up">
              <FlaskConical className="h-6 w-6" />
            </div>
            <h2
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              From raw lab data to
              <br />
              <span className="text-emerald-500">FDA-ready IND submission in hours.</span>
            </h2>
            <p
              className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-4xl leading-relaxed animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              Upload your batch records, stability data, toxicology reports, and PK studies.
              OpenShut Bio extracts every data point, runs it through a deterministic rules engine
              built on 21 CFR Part 312, ICH guidelines, and FDA Project Optimus, then generates
              all 11 IND submission documents. Every number verified. Every regulatory reference cited.
            </p>
            <div
              className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up"
              style={{ animationDelay: "150ms" }}
            >
              <SignInButton mode="modal">
                <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-8 text-sm font-medium text-white shadow-sm transition-all duration-150 ease-out hover:bg-emerald-700 hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
                  Try Bio Free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BIO DOCUMENT TYPES
      ══════════════════════════════════════════════ */}
      <section className="w-full border-y border-emerald-500/10 bg-emerald-500/[0.03]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
            >
              11 IND submission documents, generated and verified
            </h2>
            <p className="mt-4 text-muted-foreground animate-fade-up" style={{ animationDelay: "50ms" }}>
              Every document follows the CTD (Common Technical Document) format required by FDA, with regulatory citations to the governing guideline.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { name: "Module 1", sub: "Administrative", delay: "50ms" },
              { name: "Module 2", sub: "Summaries", delay: "100ms" },
              { name: "Module 3", sub: "Quality (CMC)", delay: "150ms" },
              { name: "Module 4", sub: "Nonclinical", delay: "200ms" },
              { name: "Module 5", sub: "Clinical", delay: "250ms" },
              { name: "Investigator Brochure", sub: "IB", delay: "300ms" },
              { name: "Clinical Protocol", sub: "Phase 1", delay: "350ms" },
              { name: "Pre-IND Briefing", sub: "FDA Meeting", delay: "400ms" },
              { name: "Informed Consent", sub: "ICF", delay: "450ms" },
              { name: "Diversity Action Plan", sub: "FDA 2024", delay: "500ms" },
              { name: "FDA Form 1571", sub: "IND Application", delay: "550ms" },
            ].map((doc) => (
              <div
                key={doc.name}
                className="rounded-lg border border-emerald-500/20 bg-card p-4 text-center animate-fade-up"
                style={{ animationDelay: doc.delay }}
              >
                <div className="text-sm font-semibold text-card-foreground">{doc.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{doc.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BIO HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section className="w-full bg-emerald-500/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
            >
              Upload lab data to IND package in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Drop in your lab data",
                desc: "Batch records, certificates of analysis, stability reports, tox studies, PK data, clinical protocols. Any format. Every upload encrypted.",
                delay: "100ms",
              },
              {
                step: "02",
                icon: Microscope,
                title: "AI extracts, rules engine verifies",
                desc: "Every data point is extracted and validated against 21 CFR Part 312 requirements. DAR, purity, NOAEL, HED calculations, stability trending, dose escalation design -- all verified deterministically.",
                delay: "175ms",
              },
              {
                step: "03",
                icon: Download,
                title: "Download the complete IND package",
                desc: "All 11 CTD modules and supporting documents, each with compliance checks and regulatory citations. Download individually, edit inline, or grab the entire submission as a ZIP.",
                delay: "250ms",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative text-center animate-fade-up"
                style={{ animationDelay: s.delay }}
              >
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Step {s.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BIO REGULATORY FRAMEWORK
      ══════════════════════════════════════════════ */}
      <section className="w-full border-y border-emerald-500/10 bg-emerald-500/[0.03]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
            >
              Built on the regulations that govern your submission
            </h2>
            <p className="mt-4 text-muted-foreground animate-fade-up" style={{ animationDelay: "50ms" }}>
              Every document is verified against the actual FDA regulations and ICH guidelines. Not summaries. The regulations themselves.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Landmark,
                category: "FDA IND Requirements",
                items: [
                  "21 CFR Part 312 (IND Regulations)",
                  "21 CFR Part 312.23 (IND Content)",
                  "21 CFR Part 312.32 (Safety Reporting)",
                  "FDA Guidance: Content and Format of INDs",
                  "FDA Project Optimus (Dose Optimization)",
                  "FDA Diversity Action Plan Guidance (2024)",
                ],
                delay: "100ms",
              },
              {
                icon: BookOpen,
                category: "ICH Guidelines",
                items: [
                  "ICH M4 (CTD Format & Structure)",
                  "ICH S6(R1) (Biotechnology Products)",
                  "ICH S9 (Anticancer Pharmaceuticals)",
                  "ICH E6(R2) (Good Clinical Practice)",
                  "ICH Q1A (Stability Testing)",
                  "ICH Q6B (Specifications for Biologics)",
                ],
                delay: "150ms",
              },
              {
                icon: TestTubes,
                category: "GLP / GMP / GCP",
                items: [
                  "21 CFR Part 58 (GLP for Nonclinical)",
                  "21 CFR Part 210/211 (cGMP)",
                  "21 CFR Part 11 (Electronic Records)",
                  "21 CFR Part 50 (Informed Consent)",
                  "21 CFR Part 56 (IRB Requirements)",
                  "USP <1> Injections",
                ],
                delay: "200ms",
              },
              {
                icon: ShieldCheck,
                category: "ADC-Specific Requirements",
                items: [
                  "DAR validation (HIC-HPLC, mass spec)",
                  "Free payload quantitation (<2% spec)",
                  "Linker stability assessment",
                  "Conjugation site characterization",
                  "Potency assay (cytotoxicity IC50)",
                  "Aggregation monitoring (SE-HPLC)",
                ],
                delay: "250ms",
              },
              {
                icon: Scale,
                category: "Safety & Dose Selection",
                items: [
                  "NOAEL to HED conversion (FDA guidance)",
                  "Safety margin calculations",
                  "Starting dose justification (1/10 HED)",
                  "3+3 dose escalation design",
                  "DLT definitions per CTCAE v5.0",
                  "Therapeutic index assessment",
                ],
                delay: "300ms",
              },
              {
                icon: Lock,
                category: "Security & Compliance",
                items: [
                  "End-to-end encryption at rest and in transit",
                  "21 CFR Part 11 electronic signatures",
                  "Full audit trail on all actions",
                  "Role-based access controls",
                  "Organization-level data isolation",
                  "No data shared or used for training",
                ],
                delay: "350ms",
              },
            ].map((group) => (
              <div
                key={group.category}
                className="rounded-xl border border-emerald-500/20 bg-card p-7 animate-fade-up"
                style={{ animationDelay: group.delay }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <group.icon className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-card-foreground">
                    {group.category}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BIO CTA
      ══════════════════════════════════════════════ */}
      <section className="w-full bg-emerald-500/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div
            className="relative rounded-2xl border border-emerald-500/20 bg-card p-12 sm:p-16 text-center overflow-hidden animate-fade-up"
          >
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
            </div>

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Your IND submission,
                <br className="hidden sm:block" /> verified and ready.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                One program, fully processed. See what the platform does with real preclinical data.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <SignInButton mode="modal">
                  <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-8 text-sm font-medium text-white shadow-sm transition-all duration-150 ease-out hover:bg-emerald-700 hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
                    Try Bio Free
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-500" />
                  Every upload encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  21 CFR Part 11 compliant
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Verified against FDA regulations
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          8. BOTTOM CTA
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div
            className="relative rounded-2xl border bg-card p-12 sm:p-16 text-center overflow-hidden animate-fade-up"
          >
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Stop paying for work
                <br className="hidden sm:block" /> a machine does better.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                One deal, fully processed. See what the platform does with real borrower data.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <SignInButton mode="modal">
                  <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
                    Try It Free
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Every upload encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Full audit trail
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Verified against federal and state regulations
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
