import { SignInButton } from "@clerk/nextjs";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import {
  ArrowRight,
  Upload,
  FileSearch,
  Brain,
  Settings2,
  FileCheck2,
  CheckCircle2,
  FolderUp,
  ShieldCheck,
  Calculator,
  Layers,
  ClipboardList,
  Lock,
  FileText,
  Scale,
  Activity,
  Search,
  Binary,
  RefreshCcw,
  BookOpen,
} from "lucide-react";

/* ────────────────────────────────────────────
   STAGE DATA
   ──────────────────────────────────────────── */
const STAGES = [
  {
    number: "01",
    title: "Upload & Classification",
    icon: FolderUp,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
    dotColor: "bg-blue-400",
    summary:
      "Drop in the borrower file. Every document auto-classified, encrypted, and processed against IRS field specifications.",
    details: [
      {
        icon: Upload,
        text: "Drop in tax returns, bank statements, P&Ls, rent rolls, balance sheets — any format, any volume.",
      },
      {
        icon: FileSearch,
        text: "AI auto-classifies every file: Form 1040, Schedule C, Schedule E, K-1, W-2, bank statement (checking/savings), P&L, balance sheet, rent roll, 1120, 1120S, 1065.",
      },
      {
        icon: Lock,
        text: "Every file encrypted with AES-256 at rest, TLS in transit. Stored in AWS S3 with presigned URL access only.",
      },
      {
        icon: Settings2,
        text: "AWS Textract Lending adapter processes each document against IRS field specifications — not generic OCR, but field-level extraction purpose-built for financial documents.",
      },
    ],
  },
  {
    number: "02",
    title: "Extraction & Verification",
    icon: FileSearch,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
    dotColor: "bg-emerald-400",
    summary:
      "Every data point extracted from every document. Every number independently recalculated. Every cross-document discrepancy flagged.",
    details: [
      {
        icon: Search,
        text: "Every data point extracted from every document — line by line, field by field. Nothing inferred, everything sourced.",
      },
      {
        icon: Calculator,
        text: "Math verification: every line item sum, subtotal, and total independently recalculated. Example: 1040 Line 9 is verified as the sum of Lines 1 through 8. If it doesn't add up, it gets flagged with expected vs. actual values.",
      },
      {
        icon: Layers,
        text: "Cross-document verification: income on the tax return matched against bank deposits. P&L revenue matched against Schedule E rents. Wages on the 1040 matched against W-2 box 1. Every cross-reference checked.",
      },
      {
        icon: Binary,
        text: "Textract-vs-AI comparison: two independent extraction methods compared field by field. If they disagree, both values are presented with the percentage difference.",
      },
      {
        icon: ClipboardList,
        text: "Result: a Verification Report with every math check (passed/failed), every cross-document check (passed/failed/warned), and every discrepancy flagged with exact field paths and percentage differences.",
      },
    ],
  },
  {
    number: "03",
    title: "Credit Analysis",
    icon: Brain,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    borderColor: "border-violet-400/20",
    dotColor: "bg-violet-400",
    summary:
      "AI analyzes all verified extractions. DSCR, DTI, cash flow, liquidity — every metric calculated and every risk identified.",
    details: [
      {
        icon: Activity,
        text: "AI analyzes all verified extractions together — not document by document, but as a complete financial picture of the borrower.",
      },
      {
        icon: Calculator,
        text: "Key metrics calculated: DSCR (Net Operating Income / Annual Debt Service), debt-to-income ratio, cash flow from operations, liquidity ratios, and working capital.",
      },
      {
        icon: FileSearch,
        text: "Income verification across all sources: wages, rental income, business income, investment returns. Each source traced back to its supporting document.",
      },
      {
        icon: ShieldCheck,
        text: "Risk flags: insufficient DSCR, high DTI, declining revenue trends, cash flow shortfalls, concentration risk, insufficient liquidity reserves. Every flag supported by the specific data that triggered it.",
      },
      {
        icon: FileText,
        text: "Result: a comprehensive Credit Memo with deal recommendations, supporting data, risk assessment, and the full analytical rationale — ready for committee review.",
      },
    ],
  },
  {
    number: "04",
    title: "Deal Structuring",
    icon: Settings2,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
    dotColor: "bg-amber-400",
    summary:
      "A deterministic rules engine — not AI — calculates every deal term. Rate, LTV, fees, covenants, all checked against 50-state usury limits.",
    details: [
      {
        icon: Binary,
        text: "A rules engine (not AI) calculates all deal terms. Every number is deterministic — the same inputs always produce the same outputs. No hallucination risk.",
      },
      {
        icon: Layers,
        text: "Selects from 10 loan programs based on deal characteristics: SBA 7(a), SBA 504, Commercial CRE, DSCR, Bank Statement, Conventional Business, Line of Credit, Equipment Financing, Bridge, and Crypto-Collateralized.",
      },
      {
        icon: Calculator,
        text: "Sets interest rate, LTV ratio, origination fees, closing costs, term length, and amortization schedule. Generates covenants and conditions specific to the selected loan program.",
      },
      {
        icon: Scale,
        text: "State-specific compliance: the calculated rate is checked against 50-state usury limits before the deal terms are finalized. If a rate would violate a state statute, it is automatically adjusted.",
      },
      {
        icon: ClipboardList,
        text: "Result: structured Deal Terms with every number deterministically calculated, every fee itemized, and every covenant tied to the program requirements.",
      },
    ],
  },
  {
    number: "05",
    title: "Document Generation & Legal Review",
    icon: FileCheck2,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    borderColor: "border-rose-400/20",
    dotColor: "bg-rose-400",
    summary:
      "Up to 37 legal documents generated, independently reviewed against applicable regulations, and revised until every compliance check passes.",
    details: [
      {
        icon: FileText,
        text: "Up to 37 legal documents generated per deal: loan agreement, promissory note, deed of trust/mortgage, guaranty, UCC financing statement, closing disclosure, environmental indemnity, SBA forms, and more.",
      },
      {
        icon: Brain,
        text: "AI-generated documents (loan agreement, promissory note, guaranty) are written with program-specific legal references — not boilerplate, but provisions tied to the actual regulations governing the deal.",
      },
      {
        icon: Binary,
        text: "Deterministic documents (UCC filing, closing disclosure, amortization schedule) are built from pure template + data. No AI involved — just verified numbers placed in the correct fields.",
      },
      {
        icon: Scale,
        text: "Every document independently reviewed against applicable regulations: TILA/Reg Z, SBA SOP 50 10, UCC Article 9, CERCLA 42 USC 9601, state usury statutes, ATR/QM rules, TRID integrated disclosure requirements.",
      },
      {
        icon: RefreshCcw,
        text: "Deficiencies flagged with the specific regulation and recommended fix. AI revises and resubmits for review — up to 3 cycles — until all compliance checks pass.",
      },
      {
        icon: CheckCircle2,
        text: "Result: a complete loan package — credit memo plus up to 37 legal documents — ready for download individually, inline editing, or as a single ZIP archive.",
      },
    ],
  },
];

/* ────────────────────────────────────────────
   BEHIND THE SCENES CARDS
   ──────────────────────────────────────────── */
const BEHIND_SCENES = [
  {
    icon: BookOpen,
    title: "IRS Field Specifications",
    desc: "Every extraction maps to the exact IRS field definition. Line 31 of Form 1040 isn't just a number — it's verified against the IRS specification for Adjusted Gross Income. Schedule E Line 26 is verified as the sum of Lines 3 through 20 minus Lines 5 through 19. No guessing.",
    delay: "100ms",
  },
  {
    icon: Binary,
    title: "Deterministic Verification",
    desc: "No AI in the verification loop. Every math check is a deterministic calculation. 2 + 2 = 4, not \"approximately 4.\" Every cross-document comparison uses exact field values. The verification layer never hallucinates because it never uses a language model.",
    delay: "175ms",
  },
  {
    icon: RefreshCcw,
    title: "Three-Layer Review",
    desc: "AI writes prose. Compliance review checks every provision against the governing statute. Deterministic verification confirms every required provision is present and every number is correct. If any layer fails, the cycle repeats — up to three times — until the document passes.",
    delay: "250ms",
  },
  {
    icon: ClipboardList,
    title: "Audit Trail",
    desc: "Every action logged. Every extraction, every verification result, every analysis decision, every document generation, and every review cycle recorded with timestamp, user, and full context. When a regulator asks \"how did you arrive at this number,\" the answer is one click away.",
    delay: "325ms",
  },
  {
    icon: Layers,
    title: "Dual Extraction Pipeline",
    desc: "AWS Textract Lending and AI extract every field independently. The results are compared field by field. Agreement increases confidence. Disagreement triggers manual review with both values displayed. You never rely on a single extraction source.",
    delay: "400ms",
  },
  {
    icon: ShieldCheck,
    title: "Rules Engine Owns the Numbers",
    desc: "AI never sets a rate, LTV, fee, or covenant. The deterministic rules engine owns every number in the deal terms. AI writes the narrative around the numbers, but the numbers themselves come from code that produces the same output every time for the same input.",
    delay: "475ms",
  },
];

/* ────────────────────────────────────────────
   STATS
   ──────────────────────────────────────────── */
const STATS = [
  { value: "37", label: "Legal documents per deal (up to)", delay: "100ms" },
  {
    value: "50",
    suffix: "-state",
    label: "Regulatory compliance",
    delay: "175ms",
  },
  { value: "10", label: "Loan programs", delay: "250ms" },
  {
    value: "3",
    suffix: "-layer",
    label: "Verification (math, cross-doc, Textract)",
    delay: "325ms",
  },
];

/* ════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════ */
export default function HowItWorksPage() {
  return (
    <div className="dark flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      {/* ── Gradient Orbs ── */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute top-[40%] -left-40 h-[500px] w-[500px] rounded-full bg-primary/3 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/4 blur-3xl" />

      <MarketingNav />

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-24">
          <div className="max-w-4xl">
            <p
              className="text-sm font-semibold uppercase tracking-widest text-primary mb-4 animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              How It Works
            </p>
            <h1
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              From uploaded file to{" "}
              <span className="text-primary">signed loan package</span>
            </h1>
            <p
              className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-3xl leading-relaxed animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              Five stages. Every number verified. Every document cited to the
              governing statute.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          THE FIVE STAGES — VERTICAL TIMELINE
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              The five stages of every deal
            </h2>
            <p
              className="mt-4 text-muted-foreground animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              Each stage builds on the verified output of the previous one.
              Nothing is assumed. Everything is checked.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line — hidden on mobile, visible on md+ */}
            <div className="hidden md:block absolute left-8 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-16 md:space-y-20">
              {STAGES.map((stage, idx) => (
                <div
                  key={stage.number}
                  className="relative animate-fade-up"
                  style={{ animationDelay: `${idx * 75}ms` }}
                >
                  {/* Timeline dot — hidden on mobile */}
                  <div
                    className={`hidden md:flex absolute left-8 -translate-x-1/2 top-1 h-4 w-4 rounded-full ${stage.dotColor} ring-4 ring-background z-10`}
                  />

                  {/* Content */}
                  <div className="md:pl-20">
                    {/* Stage header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stage.bgColor} ${stage.color}`}
                      >
                        <stage.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                          Stage {stage.number}
                        </p>
                        <h3 className="text-2xl font-bold text-foreground">
                          {stage.title}
                        </h3>
                        <p className="mt-2 text-muted-foreground leading-relaxed max-w-2xl">
                          {stage.summary}
                        </p>
                      </div>
                    </div>

                    {/* Detail bullets */}
                    <div
                      className={`rounded-xl border ${stage.borderColor} bg-card p-6 sm:p-8`}
                    >
                      <div className="space-y-5">
                        {stage.details.map((detail, dIdx) => (
                          <div
                            key={dIdx}
                            className="flex items-start gap-4"
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${stage.bgColor} ${stage.color}`}
                            >
                              <detail.icon className="h-4 w-4" />
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                              {detail.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BEHIND THE SCENES
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              What happens behind the scenes
            </h2>
            <p
              className="mt-4 text-muted-foreground animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              The technical architecture that makes every output auditable,
              reproducible, and defensible.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BEHIND_SCENES.map((card) => (
              <div
                key={card.title}
                className="group relative rounded-xl border bg-card p-8 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15 animate-fade-up"
                style={{ animationDelay: card.delay }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-5 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((stat) => (
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
          BOTTOM CTA
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="relative rounded-2xl border bg-card p-12 sm:p-16 text-center overflow-hidden animate-fade-up">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Try it yourself
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                One deal, fully processed. See what the platform does with real
                borrower data.
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
