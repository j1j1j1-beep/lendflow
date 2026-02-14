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
      "This is the document your investors actually read. It lays out the fund strategy, fee structure, risk factors, and every disclosure they need before writing a check.",
  },
  {
    name: "Subscription Agreement",
    description:
      "The contract each investor signs to commit money to the fund. Covers how much they are investing, their representations, and the terms they are agreeing to.",
  },
  {
    name: "Operating Agreement",
    description:
      "Governs the fund entity itself. Who manages it, how distributions work, voting rights, key person provisions, and how an LP can remove the GP.",
  },
  {
    name: "Investor Questionnaire",
    description:
      "Gathers what you need from each investor: income and net worth for accreditation, tax info for K-1 reporting, and identity verification for AML.",
  },
  {
    name: "Side Letter",
    description:
      "Custom terms for specific investors. Fee discounts, co-investment rights, information rights, most-favored-nation clauses. One per investor.",
  },
  {
    name: "Form D Draft",
    description:
      "Pre-filled SEC notice of sale. Must be filed within 15 days of your first close. We fill in the fund details so you can file on EDGAR immediately.",
  },
];

const FUND_TYPES = [
  {
    name: "Private Equity",
    description: "Buyouts, growth equity, turnarounds. The PPM reflects your hold period, deal-by-deal vs. blind pool structure, and carry waterfall.",
  },
  {
    name: "Venture Capital",
    description: "Seed through growth stage. Documents handle pro rata rights, follow-on reserves, and the longer fund life VCs typically need.",
  },
  {
    name: "Real Estate",
    description: "Acquisition, development, or value-add. Property-specific risk factors, capital call schedules, and distribution waterfalls built in.",
  },
  {
    name: "Hedge Fund",
    description: "Long/short, macro, multi-strategy. Redemption terms, lockup periods, gates, and high-water marks reflected across all docs.",
  },
  {
    name: "Credit",
    description: "Direct lending, mezzanine, distressed. Docs cover interest rate mechanics, default provisions, and the shorter duration typical of credit funds.",
  },
  {
    name: "Infrastructure",
    description: "Energy, transport, utilities, public-private. Longer fund lives, regulatory risk factors, and government contract considerations included.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Tell us about the fund",
    description: "Fund type, target raise, management fee, carry, preferred return, GP commitment, and key people. Takes about five minutes.",
  },
  {
    number: "2",
    title: "Get all 6 documents back",
    description: "PPM, sub agreement, operating agreement, investor questionnaire, side letter template, and Form D. Generated together so the terms match across every doc.",
  },
  {
    number: "3",
    title: "Edit, download, send to counsel",
    description: "Make changes inline. Export as Word or PDF. Your attorney reviews final docs instead of drafting from scratch. That is where the time savings come from.",
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
                Your fund formation docs.
                <br />
                <span className="text-violet-500">All six. Ready to send to counsel.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                Enter your fund terms once. Get back the PPM, subscription agreement, operating agreement,
                investor questionnaire, side letter, and Form D draft. The numbers, disclosures, and
                compliance language are consistent across every document. Your counsel reviews instead
                of drafting from zero.
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
                First fund free. All 6 documents. No credit card required.
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
                The 6 documents every fund needs
              </h2>
              <p className="mt-4 text-muted-foreground">
                These are the same docs your attorney would draft. We generate them as a set so
                the terms, definitions, and numbers stay consistent from the PPM through the Form D.
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
                Built for 6 fund types
              </h2>
              <p className="mt-4 text-muted-foreground">
                Pick your fund type and the documents change to match. Risk factors, distribution
                waterfalls, redemption terms, and disclosure language all reflect what you are
                actually building.
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
                Compliance checks you would otherwise do by hand
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                About 30 checks run across your documents before you download them. The right
                exemption type is applied. Accreditation requirements match the offering. Investor
                limits are enforced. You still verify everything, but you start from a clean baseline
                instead of a blank page.
              </p>
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl mx-auto text-left">
                {[
                  "506(b) self-certification vs. 506(c) verification handled correctly",
                  "Accreditation criteria: income, net worth, and professional certifications",
                  "100-investor limit for 3(c)(1) funds enforced",
                  "Qualified purchaser thresholds for 3(c)(7) funds",
                  "State blue sky filing requirements tracked",
                  "Form D pre-filled and ready to file on EDGAR",
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
                Five minutes of input. Six documents out.
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
                  Stop paying counsel to draft from scratch.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  Generate your full document package. Hand your attorney a first draft instead
                  of a blank engagement letter. First fund is free, no credit card.
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
