import { SignInButton } from "@clerk/nextjs";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Zap,
  Brain,
  Lock,
  Scale,
  Search,
  Calculator,
  FileStack,
  Eye,
  ChevronDown,
  Sparkles,
  Building2,
} from "lucide-react";

/* ────────────────────────────────────────────────
   Data
   ──────────────────────────────────────────────── */

const TIERS = [
  {
    name: "Try It Free",
    price: "$0",
    period: "",
    description: "One deal. Full pipeline. No credit card. See exactly what the platform does before you commit.",
    highlight: false,
    features: [
      "1 deal, fully processed",
      "Up to 37 legal documents generated",
      "Full credit analysis and deal structuring",
      "All 10 loan programs",
      "50-state compliance checks",
      "Sample deal with pre-loaded data or upload your own",
      "No credit card required",
    ],
    cta: "Try It Free",
    icon: Sparkles,
    delay: "100ms",
  },
  {
    name: "Full License",
    price: "$50,000",
    period: " initiation",
    priceSecondary: "$5,000 - $10,000",
    periodSecondary: "/month",
    description:
      "Unlimited deals for up to 25 people. Replaces what most firms spend tens of thousands per deal on outside counsel and analyst hours. Pays for itself in a handful of deals.",
    highlight: true,
    badge: "Full Platform",
    features: [
      "Unlimited deals",
      "Up to 25 seats per organization",
      "All 10 loan programs with full compliance",
      "Up to 37 legal documents per deal",
      "Full audit trail on every action",
      "Inline document editing and review",
      "Download complete loan packages (ZIP)",
      "Team management and seat controls",
      "Dedicated onboarding",
      "Paid via bank transfer (ACH) or wire",
    ],
    cta: "Get Started",
    icon: Building2,
    delay: "175ms",
  },
];

const INCLUDED_FEATURES = [
  {
    icon: FileText,
    title: "Document extraction",
    desc: "Tax returns, bank statements, and financials parsed against IRS field specifications.",
    delay: "100ms",
  },
  {
    icon: Calculator,
    title: "Mathematical verification",
    desc: "Every data point independently recalculated. No manual spot-checks.",
    delay: "150ms",
  },
  {
    icon: Search,
    title: "Cross-document consistency",
    desc: "Income, expenses, and cash flow cross-referenced across every document in the file.",
    delay: "200ms",
  },
  {
    icon: Brain,
    title: "Full credit analysis",
    desc: "DSCR, DTI, cash flow, liquidity, and risk flags. Full credit evaluation with recommendations.",
    delay: "250ms",
  },
  {
    icon: Zap,
    title: "Deterministic deal structuring",
    desc: "Rate, LTV, fees, covenants, and conditions set by rules engine. Every number deterministically calculated.",
    delay: "300ms",
  },
  {
    icon: FileStack,
    title: "Up to 37 legal documents",
    desc: "Promissory notes, loan agreements, deeds of trust, UCC filings, disclosures, and more.",
    delay: "350ms",
  },
  {
    icon: Scale,
    title: "Compliance review",
    desc: "Every document verified against federal and state regulations. Issues flagged with the exact statute.",
    delay: "400ms",
  },
  {
    icon: ShieldCheck,
    title: "Full audit trail",
    desc: "Every extraction, verification, and generation logged with timestamps and results.",
    delay: "450ms",
  },
  {
    icon: Lock,
    title: "Encrypted document storage",
    desc: "End-to-end encryption at rest and in transit. Secure document access with expiring links. Organization-level data isolation.",
    delay: "500ms",
  },
  {
    icon: Eye,
    title: "Inline document viewer and editor",
    desc: "View rendered DOCX documents in-browser. Edit in place. Download individually or as a package.",
    delay: "550ms",
  },
];

const FAQ = [
  {
    q: "What counts as a deal?",
    a: "One borrower, one loan. Upload as many documents as needed for that borrower, including tax returns, bank statements, and financials. All document extraction, verification, analysis, structuring, and generation for that deal is included.",
    delay: "100ms",
  },
  {
    q: "What happens after my free deal?",
    a: "You'll need a full license to create additional deals. Your first deal and all its generated documents remain accessible.",
    delay: "150ms",
  },
  {
    q: "Can I try it with sample data?",
    a: "Yes. When you create your free deal, you can use our pre-loaded sample borrower data to see the full pipeline without uploading any real documents.",
    delay: "200ms",
  },
  {
    q: "How do seats work?",
    a: "Each organization gets up to 25 seats. Any member of your organization can create deals, view documents, and download loan packages.",
    delay: "250ms",
  },
  {
    q: "What loan programs are supported?",
    a: "SBA 7(a), SBA 504, Commercial CRE, DSCR, Bank Statement, Conventional Business, Line of Credit, Equipment Financing, Bridge, and Crypto-Collateralized. Each with program-specific regulatory compliance.",
    delay: "300ms",
  },
  {
    q: "Is my data secure?",
    a: "Every document is encrypted end-to-end, at rest and in transit. Secure access through expiring links. Full audit trail on every action. Organization-level data isolation. No borrower data is shared or used for training.",
    delay: "350ms",
  },
  {
    q: "How does payment work?",
    a: "The $50,000 initiation fee is a one-time payment via bank transfer (ACH) or wire. Monthly fees are billed automatically after that. No contracts, no negotiations.",
    delay: "400ms",
  },
];

/* ────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────── */

export default function PricingPage() {
  return (
    <div className="dark flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-primary/3 blur-3xl" />

      <MarketingNav />

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-32 sm:pb-20 text-center">
          <h1
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            Simple pricing.
            <br />
            <span className="text-primary">No per-document fees.</span>
          </h1>
          <p
            className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto leading-relaxed animate-fade-up"
            style={{ animationDelay: "75ms" }}
          >
            One deal free. Then the full platform, no limits.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PRICING CARDS
      ══════════════════════════════════════════════ */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 pb-24 sm:pb-32">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-4xl mx-auto lg:items-start">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-8 sm:p-10 animate-fade-up transition-all duration-200 ${
                  tier.highlight
                    ? "border-primary/50 bg-card shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                    : "border-border/50 bg-card"
                }`}
                style={{ animationDelay: tier.delay }}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      tier.highlight
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <tier.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {tier.name}
                  </h3>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-base text-muted-foreground">
                      {tier.period}
                    </span>
                  )}
                  {tier.priceSecondary && (
                    <div className="mt-1">
                      <span className="text-xl font-semibold text-foreground">
                        {tier.priceSecondary}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {tier.periodSecondary}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  {tier.description}
                </p>

                {/* CTA */}
                <SignInButton mode="modal">
                  <button
                    className={`w-full inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium shadow-sm transition-all duration-150 ease-out hover:shadow-md hover:-translate-y-px active:scale-[0.98] ${
                      tier.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {tier.cta}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>

                {/* Divider */}
                <div className="my-8 border-t border-border/50" />

                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          WHAT'S INCLUDED IN EVERY DEAL
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
            >
              What&apos;s included in every deal
            </h2>
            <p
              className="mt-4 text-muted-foreground animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              Every deal gets the full pipeline. Free trial or licensed,
              the output is the same.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-7 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15 animate-fade-up"
                style={{ animationDelay: feature.delay }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════ */}
      <section className="w-full">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
          <div className="text-center mb-14">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
            >
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-0 divide-y divide-border/50">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group animate-fade-up"
                style={{ animationDelay: item.delay }}
              >
                <summary className="flex cursor-pointer items-center justify-between py-6 text-left">
                  <span className="text-base font-medium text-foreground pr-4">
                    {item.q}
                  </span>
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="pb-6 text-sm text-muted-foreground leading-relaxed pr-10">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BOTTOM CTA
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
                Start with one deal.
                <br className="hidden sm:block" /> See what changes.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                Full pipeline. Full document package. No credit card. No commitment.
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
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Full audit trail
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
