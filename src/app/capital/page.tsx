import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Building2, ShieldCheck, Scale } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  {
    name: "Private Placement Memorandum",
    tag: "PPM",
    description: "Fund strategy, target returns, fee structure (management fee, carry, preferred return), risk factors specific to your fund type, conflicts of interest, LP rights, tax considerations, and every disclosure your investors need before they write a check.",
  },
  {
    name: "Subscription Agreement",
    tag: "Sub",
    description: "The contract each investor signs to commit capital. Investment amount, accreditation representations, suitability confirmations, tax status, and the terms they agree to. Adapts based on whether you are running 506(b) or 506(c).",
  },
  {
    name: "Operating Agreement",
    tag: "OA",
    description: "Governs the fund entity. Management authority, distribution waterfall with GP catch-up, voting rights, transfer restrictions, key person provisions, GP removal mechanics, and capital account maintenance rules.",
  },
  {
    name: "Investor Questionnaire",
    tag: "IQ",
    description: "Accreditation verification: income test ($200K/$300K joint), net worth test ($1M excluding primary residence), or SEC-designated credentials (Series 7, 65, or 82). Entity type, tax ID, and identity verification. Pure template, no AI.",
  },
  {
    name: "Side Letter Template",
    tag: "SL",
    description: "Fee discounts, co-investment rights, information rights, MFN clauses, and any custom terms for specific investors. Templated so you can issue them quickly without redrafting from scratch each time.",
  },
  {
    name: "Form D Draft",
    tag: "SEC",
    description: "Pre-filled SEC notice of exempt offering of securities. Must be filed within 15 days of your first sale. Fund details populated so you can file on EDGAR immediately. Pure template, no AI needed.",
  },
];

const FUND_TYPES = [
  {
    name: "Private Equity",
    details: "Buyouts, growth equity, turnarounds. 10-year fund life with extensions. Carry waterfall reflects hold period and J-curve. Capital calls as deals close.",
  },
  {
    name: "Venture Capital",
    details: "Seed through growth stage. Pro rata and follow-on reserves built into the PPM. Longer fund life (12+ years typical). Portfolio company detail in risk factors.",
  },
  {
    name: "Real Estate",
    details: "Acquisition, development, value-add. Property-specific risk factors. Capital call timing tied to closing schedules. Depreciation and tax treatment in the PPM.",
  },
  {
    name: "Hedge Fund",
    details: "Long/short, macro, multi-strategy. Redemption terms, lockup periods, gates, side pockets, and high-water marks all reflected in the operating agreement and PPM.",
  },
  {
    name: "Credit",
    details: "Direct lending, mezzanine, distressed. Interest income mechanics, shorter duration, and different distribution timing than equity funds. Carry based on income, not appreciation.",
  },
  {
    name: "Infrastructure",
    details: "Energy, transportation, utilities, digital. Longer fund lives (15+ years). Regulatory risk factors. Government contract considerations in the PPM.",
  },
];

export default function CapitalPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full hero-light bg-noise">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-32 relative z-10">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-sm text-muted-foreground mb-6">
                <Building2 className="h-3.5 w-3.5" />
                Capital
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                Six fund formation documents
                <br />
                <span className="text-muted-foreground">
                  from one set of terms.
                </span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                Before you can talk to your first investor, you need a PPM,
                subscription agreement, operating agreement, investor
                questionnaire, side letter template, and Form D. OpenShut
                generates all six in minutes with consistent terms across
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
        <div className="section-divider" />
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
                  <div className="rounded-xl bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-foreground/70 tracking-wide inset-shine">
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
        <div className="section-divider" />
      </section>

      {/* 506(b) vs 506(c) */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                506(b) or 506(c). The documents adapt.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Your choice of Reg D exemption changes the investor
                verification requirements, who you can market to, and how
                many non-accredited investors you can accept. Pick one and
                the entire document set adjusts.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2" staggerDelay={0.06} initialDelay={0.1}>
            <StaggerItem>
              <div className="rounded-xl bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                <h3 className="text-base font-semibold text-card-foreground mb-4">Rule 506(b)</h3>
                <ul className="space-y-3">
                  {[
                    "Up to 35 non-accredited but sophisticated investors",
                    "No general solicitation or advertising",
                    "Self-certification of accredited status accepted",
                    "More flexible, but limits how you can raise",
                    "Most common for funds with existing investor relationships",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="rounded-xl bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                <h3 className="text-base font-semibold text-card-foreground mb-4">Rule 506(c)</h3>
                <ul className="space-y-3">
                  {[
                    "All investors must be accredited, no exceptions",
                    "General solicitation and advertising allowed",
                    "Third-party verification of accreditation required",
                    "Income ($200K/$300K joint), net worth ($1M), or Series 7/65/82",
                    "Better for broad outreach, stricter on investor qualification",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Fund Types */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Six fund types, each with different docs
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  A venture fund has different risk factors, redemption terms,
                  and disclosure requirements than a hedge fund or credit fund.
                  Pick your type and the documents adjust to match.
                </p>
              </div>
            </FadeIn>

            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
              {FUND_TYPES.map((fund) => (
                <StaggerItem key={fund.name}>
                  <div className="rounded-xl bg-card p-5 sm:p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Building2 className="h-4 w-4 text-foreground/50 shrink-0" />
                      <h3 className="text-sm font-semibold text-card-foreground">{fund.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{fund.details}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Compliance */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                Securities compliance checks
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-10">
                Your documents are checked against securities regulations
                before you download them. The right exemption is applied,
                accreditation requirements match the offering, and investor
                limits are enforced.
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {[
                  {
                    title: "Reg D and offering rules",
                    icon: Scale,
                    items: [
                      "506(b) vs. 506(c) verification requirements applied correctly",
                      "Accredited investor criteria: income, net worth, and Series 7/65/82",
                      "Bad actor disqualification checks (Rule 506(d))",
                      "Form D pre-filled for 15-day EDGAR filing window",
                      "State blue sky filing requirements tracked",
                    ],
                  },
                  {
                    title: "Investment Company Act",
                    icon: ShieldCheck,
                    items: [
                      "3(c)(1) exemption: 100-investor limit enforced",
                      "3(c)(7) exemption: qualified purchaser threshold ($5M)",
                      "3(c)(5)(C) exemption for real estate funds",
                      "ERISA 25% aggregate benefit plan investor test",
                      "VCOC and REOC exemptions where applicable",
                    ],
                  },
                  {
                    title: "Tax and structure",
                    icon: Building2,
                    items: [
                      "Carried interest 3-year holding period (IRC 1061)",
                      "GP catch-up waterfall calculated correctly",
                      "Capital account maintenance rules applied",
                      "Partnership Representative designation (BBA 2015)",
                      "FinCEN BOI reporting (domestic entities exempt since March 2025)",
                    ],
                  },
                ].map((col) => (
                  <div key={col.title} className="rounded-xl bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 card-shine">
                    <div className="flex items-center gap-2 mb-4">
                      <col.icon className="h-4 w-4 text-foreground/50" />
                      <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {col.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                          <span className="text-xs text-muted-foreground leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20 bg-dot-pattern">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Five minutes of input, six documents out
                </h2>
              </div>
            </FadeIn>

            <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
              {[
                { n: "01", title: "Describe the fund", desc: "Fund type, target raise, management fee, carry, preferred return, GP commitment, key people, and whether you are running 506(b) or 506(c)." },
                { n: "02", title: "Get all 6 documents", desc: "PPM, subscription agreement, operating agreement, investor questionnaire, side letter template, and Form D. Terms are consistent across every document." },
                { n: "03", title: "Edit, download, send to counsel", desc: "Make changes inline. Export as Word or PDF. Your attorney reviews a first draft instead of starting from a blank engagement letter." },
              ].map((step) => (
                <StaggerItem key={step.n}>
                  <div className="rounded-xl bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground text-sm font-bold mb-5 font-mono inset-shine">
                      {step.n}
                    </div>
                    <h3 className="text-base font-semibold text-card-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
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
      </section>

      <MarketingFooter />
    </div>
  );
}
