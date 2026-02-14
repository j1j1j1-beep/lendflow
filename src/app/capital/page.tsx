import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Building2 } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  {
    name: "Private Placement Memorandum (PPM)",
    description:
      "The offering document your investors read before committing capital. Describes the fund's strategy, terms, risks, and legal disclosures.",
  },
  {
    name: "Subscription Agreement",
    description:
      "The contract an investor signs to commit capital to the fund. Includes representations, warranties, and the subscription amount.",
  },
  {
    name: "Operating Agreement",
    description:
      "Defines how the fund entity is governed. Management rights, voting, distributions, removal provisions.",
  },
  {
    name: "Investor Questionnaire",
    description:
      "Collects investor information for accreditation verification, tax reporting, and anti-money laundering compliance.",
  },
  {
    name: "Side Letter",
    description:
      "Negotiated terms for specific investors. Fee discounts, co-investment rights, most-favored-nation clauses.",
  },
  {
    name: "Form D Draft",
    description:
      "The SEC filing required when raising capital under Regulation D. Pre-filled with your fund's details.",
  },
];

const FUND_TYPES = [
  {
    name: "Private Equity",
    description: "Buyout, growth equity, or turnaround funds acquiring controlling stakes in private companies.",
  },
  {
    name: "Venture Capital",
    description: "Early-stage or growth-stage funds investing in startups and high-growth companies.",
  },
  {
    name: "Real Estate",
    description: "Funds acquiring, developing, or managing commercial and residential properties.",
  },
  {
    name: "Hedge Fund",
    description: "Multi-strategy, long/short, or event-driven funds trading public and private markets.",
  },
  {
    name: "Credit",
    description: "Direct lending, mezzanine, or distressed debt funds providing capital to borrowers.",
  },
  {
    name: "Infrastructure",
    description: "Funds investing in transportation, energy, utilities, and public works projects.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Enter your fund details",
    description: "Fund type, target size, terms, fee structure, and key parties.",
  },
  {
    number: "2",
    title: "We generate all 6 documents",
    description: "PPM, subscription agreement, operating agreement, investor questionnaire, side letter, and Form D draft.",
  },
  {
    number: "3",
    title: "Review, edit, and download",
    description: "Make changes in the editor. Download as Word or PDF. Share with counsel for final review.",
  },
];

export default function CapitalPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-violet-500/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-violet-500/3 blur-3xl" />

      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-500 mb-6">
                <Building2 className="h-3.5 w-3.5" />
                Capital
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Configure your fund.
                <br />
                <span className="text-violet-500">Get back a complete set of formation documents.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                You tell us the fund type, target size, and terms. We generate all 6 documents
                you need to start raising capital. Securities exemptions, accreditation requirements,
                and state filings are handled automatically.
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
              <p className="mt-6 text-sm text-muted-foreground">
                One fund free. Full document package. No credit card.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Documents */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                6 documents. One generation.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every fund formation requires the same core documents. Enter your fund details once
                and get all six back, formatted and cross-referenced.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
            {DOCUMENTS.map((doc) => (
              <StaggerItem key={doc.name}>
                <div className="rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0" />
                    <h3 className="text-sm font-semibold text-card-foreground">{doc.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{doc.description}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Fund Types */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Works for any fund structure
              </h2>
              <p className="mt-4 text-muted-foreground">
                Select your fund type and the documents adjust automatically. Terms, disclosures,
                and risk factors reflect the strategy you are actually running.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
            {FUND_TYPES.map((fund) => (
              <StaggerItem key={fund.name}>
                <div className="rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Building2 className="h-4 w-4 text-violet-500 shrink-0" />
                    <h3 className="text-sm font-semibold text-card-foreground">{fund.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{fund.description}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Compliance */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Securities compliance is built in
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Securities exemptions are handled automatically. Whether you are raising under
                506(b) or 506(c), the documents reflect the right exemption. Investor accreditation
                is verified. State filing requirements are tracked.
              </p>
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl mx-auto text-left">
                {[
                  "Regulation D exemptions (506(b) and 506(c))",
                  "Investor accreditation verification",
                  "State blue sky filing requirements",
                  "Anti-money laundering checks",
                  "Qualified purchaser thresholds",
                  "Form D pre-filled for SEC filing",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Three steps. All your docs.
              </h2>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
            {STEPS.map((step) => (
              <StaggerItem key={step.number}>
                <div className="rounded-xl border bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 text-sm font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-base font-semibold text-card-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="w-full border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="relative rounded-2xl border bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 hover:border-foreground/15 hover:shadow-xl">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-64 w-64 rounded-full bg-violet-500/5 blur-3xl" />
              </div>

              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Try it free. One fund, full document package, no credit card.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  Sign up and configure your first fund. All 6 documents generated. Download and
                  send to counsel for review.
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
                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-500" />
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-500" />
                    6 documents included
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-500" />
                    Download as Word or PDF
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
