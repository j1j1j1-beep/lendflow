import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Building2 } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  {
    name: "Private Placement Memorandum",
    tag: "PPM",
    description: "Fund strategy, fee structure, risk factors, and every disclosure your investors need. This is the document they actually read before writing a check.",
  },
  {
    name: "Subscription Agreement",
    tag: "Sub",
    description: "The contract each investor signs to commit capital. Investment amount, representations, and the terms they agree to.",
  },
  {
    name: "Operating Agreement",
    tag: "OA",
    description: "Governs the fund entity. Management, distributions, voting rights, key person provisions, GP removal mechanics.",
  },
  {
    name: "Investor Questionnaire",
    tag: "IQ",
    description: "Accreditation status, tax ID, entity type, identity verification. Collects everything you need before accepting capital. No AI involved.",
  },
  {
    name: "Side Letter Template",
    tag: "SL",
    description: "Fee discounts, co-investment rights, information rights, MFN clauses. Custom terms for specific investors, templated so you can issue them quickly.",
  },
  {
    name: "Form D Draft",
    tag: "SEC",
    description: "Pre-filled SEC notice of sale. Must be filed within 15 days of your first close. Fund details populated so you can file on EDGAR immediately.",
  },
];

const FUND_TYPES = [
  { name: "Private Equity", desc: "Buyouts, growth, turnarounds. Hold period and carry waterfall reflected." },
  { name: "Venture Capital", desc: "Seed through growth. Pro rata, follow-on reserves, longer fund life." },
  { name: "Real Estate", desc: "Acquisition, development, value-add. Property risk factors and capital calls." },
  { name: "Hedge Fund", desc: "Long/short, macro, multi-strat. Redemptions, lockups, gates, high-water marks." },
  { name: "Credit", desc: "Direct lending, mezz, distressed. Interest mechanics and shorter duration." },
  { name: "Infrastructure", desc: "Energy, transport, utilities. Longer lives and regulatory risk factors." },
];

export default function CapitalPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full hero-glow hero-glow-violet">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-32 relative z-10">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3.5 py-1.5 text-sm text-violet-400 mb-6">
                <Building2 className="h-3.5 w-3.5" />
                Capital
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                Raising a fund?
                <br />
                <span className="text-gradient-violet">
                  Get all six documents in one generation.
                </span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                Before you can talk to your first investor, you need a PPM,
                subscription agreement, operating agreement, investor
                questionnaire, side letter template, and Form D. Most firms
                pay $50K to $100K in outside counsel to get those drafted.
                OpenShut generates them in minutes with consistent terms across
                every document.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <SignInButton mode="modal">
                  <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                    Start a Fund Free
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
              <p className="mt-5 text-sm text-muted-foreground/70">
                First fund free. All 6 documents. About five minutes of input.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Documents */}
      <section className="w-full relative">
        <div className="section-glow-divider" />
        <div className="bg-muted/20 bg-dot-pattern">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  The six documents every fund needs before a first close
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Generated as a set so terms, definitions, and numbers stay
                  consistent from the PPM through the Form D. Your counsel
                  reviews a complete package instead of drafting from scratch.
                </p>
              </div>
            </FadeIn>

            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
              {DOCUMENTS.map((doc) => (
                <StaggerItem key={doc.name}>
                  <div className="rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-violet-500/20 card-glow-border h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center justify-center rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-400 tracking-wide">
                        {doc.tag}
                      </span>
                      <h3 className="text-sm font-semibold text-card-foreground">{doc.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{doc.description}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
        <div className="section-glow-divider" />
      </section>

      {/* Fund Types */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Six fund types, each with different docs
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                A venture fund has different risk factors, redemption terms, and
                disclosure requirements than a hedge fund or credit fund. Pick
                your type and the documents change to match.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
            {FUND_TYPES.map((fund) => (
              <StaggerItem key={fund.name}>
                <div className="rounded-xl border bg-card p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 card-glow-border h-full">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Building2 className="h-4 w-4 text-violet-500 shrink-0" />
                    <h3 className="text-sm font-semibold text-card-foreground">{fund.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{fund.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Compliance */}
      <section className="w-full relative">
        <div className="section-glow-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                  Securities compliance handled
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-10">
                  Fund formation lives at the intersection of securities law,
                  tax law, and state regulations. The system checks your documents
                  against the rules that apply to your specific fund structure.
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    "Reg D 506(b) vs. 506(c) verification requirements applied correctly",
                    "Accredited investor criteria: income, net worth, and Series 7/65/82",
                    "3(c)(1) 100-investor limit and 3(c)(7) qualified purchaser thresholds",
                    "ERISA 25% aggregate test with VCOC and REOC exemptions",
                    "Carried interest 3-year holding period (IRC 1061)",
                    "Bad actor disqualification checks (Rule 506(d))",
                    "State blue sky filing requirements tracked",
                    "Form D pre-filled and ready to file within the 15-day window",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5 p-3 rounded-lg transition-colors hover:bg-muted/50">
                      <CheckCircle2 className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
        <div className="section-glow-divider" />
      </section>

      {/* How It Works */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Five minutes of input. Six documents out.
              </h2>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
            {[
              { n: "01", title: "Describe the fund", desc: "Fund type, target raise, management fee, carry, preferred return, GP commitment, and key people." },
              { n: "02", title: "Get all 6 documents", desc: "PPM, sub agreement, operating agreement, investor questionnaire, side letter template, and Form D. Terms are consistent across every document." },
              { n: "03", title: "Edit, download, send to counsel", desc: "Make changes inline. Export as Word or PDF. Your attorney reviews a first draft instead of starting from a blank engagement letter." },
            ].map((step) => (
              <StaggerItem key={step.n}>
                <div className="rounded-xl border bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 card-glow-border h-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 text-sm font-bold mb-5 font-mono">
                    {step.n}
                  </div>
                  <h3 className="text-base font-semibold text-card-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="w-full relative">
        <div className="section-glow-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="relative rounded-2xl border bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 hover:border-foreground/15 hover:shadow-xl hero-glow hero-glow-violet">
                <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Generate your fund docs tonight.
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                    Hand your attorney a complete first draft instead of a blank
                    engagement letter. First fund is free.
                  </p>
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <SignInButton mode="modal">
                      <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                        Start a Fund Free
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
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
