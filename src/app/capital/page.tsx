import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Building2, ShieldCheck, Scale, ChevronDown, AlertTriangle } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  {
    name: "Private Placement Memorandum",
    tag: "PPM",
    sections: ["Fund strategy and target returns", "Fee structure (management, carry, preferred)", "Risk factors specific to your fund type", "Conflicts of interest disclosure", "LP rights and governance", "Tax considerations and elections"],
  },
  {
    name: "Subscription Agreement",
    tag: "Sub",
    sections: ["Capital commitment amount", "Accreditation representations", "Suitability confirmations", "Tax status and entity type", "Adapts for 506(b) or 506(c)"],
  },
  {
    name: "Operating Agreement",
    tag: "OA",
    sections: ["Management authority and delegation", "Distribution waterfall with GP catch-up", "Voting rights and LP advisory committee", "Transfer restrictions and ROFR", "Key person provisions", "GP removal mechanics"],
  },
  {
    name: "Investor Questionnaire",
    tag: "IQ",
    sections: ["Income test ($200K / $300K joint)", "Net worth test ($1M excl. primary residence)", "SEC credentials (Series 7, 65, or 82)", "Entity type and tax ID", "Pure template, no AI needed"],
  },
  {
    name: "Side Letter Template",
    tag: "SL",
    sections: ["Fee discounts and rebates", "Co-investment rights", "Information and reporting rights", "MFN (most favored nation) clauses", "Custom terms per investor"],
  },
  {
    name: "Form D Draft",
    tag: "SEC",
    sections: ["Pre-filled SEC notice of exempt offering", "File on EDGAR within 15 days of first sale", "Fund details auto-populated", "Pure template, no AI needed"],
  },
];

const FUND_TYPES = [
  {
    name: "Private Equity",
    details: "Buyouts, growth equity, turnarounds. 10-year fund life with extensions. Carry waterfall reflects hold period and J-curve.",
  },
  {
    name: "Venture Capital",
    details: "Seed through growth stage. Pro rata and follow-on reserves in the PPM. Longer fund life (12+ years typical).",
  },
  {
    name: "Real Estate",
    details: "Acquisition, development, value-add. Property-specific risk factors. Capital call timing tied to closing schedules.",
  },
  {
    name: "Hedge Fund",
    details: "Long/short, macro, multi-strategy. Redemptions, lockups, gates, side pockets, and high-water marks in the OA and PPM.",
  },
  {
    name: "Credit",
    details: "Direct lending, mezzanine, distressed. Interest income mechanics, shorter duration. Carry based on income, not appreciation.",
  },
  {
    name: "Infrastructure",
    details: "Energy, transport, utilities, digital. 15+ year fund lives. Regulatory risk factors. Government contract considerations.",
  },
];

export default function CapitalPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background bg-ambient relative overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full hero-light bg-noise">
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-32 relative z-10">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-sm text-muted-foreground mb-6">
                <Building2 className="h-3.5 w-3.5" />
                Capital
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                Fund formation docs
                <br />
                <span className="text-muted-foreground">
                  with consistent terms throughout.
                </span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                Enter your fund terms once. Get the PPM, subscription
                agreement, operating agreement, investor questionnaire, side
                letter template, and Form D back as a set. Every definition,
                number, and term stays consistent across all six documents.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <SignInButton mode="modal">
                  <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                    See a Sample Fund
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
                Free demo. All 6 documents. About five minutes of input.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Risk / Consistency */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <FadeIn>
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-foreground/50 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">The consistency problem</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl">
                    When your PPM says a 2% management fee and your operating agreement says 2.5%, that&apos;s a securities issue. When the subscription agreement references a provision that doesn&apos;t exist in the OA, someone has to find it. OpenShut generates all six documents from one set of inputs so terms, defined terms, and cross-references stay aligned across every document.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Documents - Expandable with section details */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Six documents, each with the sections that matter
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Expand each document to see what&apos;s inside.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DOCUMENTS.map((doc) => (
              <details key={doc.name} className="group rounded-xl bg-card transition-all duration-200 hover:-translate-y-0.5 card-shine metallic-sheen">
                <summary className="flex items-center justify-between cursor-pointer p-5 sm:p-6 list-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-foreground/70 tracking-wide inset-shine">
                      {doc.tag}
                    </span>
                    <h3 className="text-sm font-semibold text-card-foreground">{doc.name}</h3>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0" />
                </summary>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                  <div className="border-t border-border pt-4">
                    <ul className="space-y-2">
                      {doc.sections.map((section) => (
                        <li key={section} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                          <span className="text-sm text-muted-foreground">{section}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 506(b) vs 506(c) - Full width split */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  506(b) or 506(c). Pick one, the docs adjust.
                </h2>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FadeIn delay={0.05}>
                <div className="rounded-xl bg-card p-6 sm:p-8 card-shine metallic-sheen h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="inline-flex items-center justify-center rounded-md bg-muted px-2.5 py-1 text-xs font-bold text-foreground/70 inset-shine">506(b)</span>
                    <span className="text-xs text-muted-foreground">Most common</span>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Up to 35 non-accredited but sophisticated investors",
                      "No general solicitation or advertising",
                      "Self-certification of accredited status accepted",
                      "Best for funds with existing investor relationships",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="rounded-xl bg-card p-6 sm:p-8 card-shine metallic-sheen h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="inline-flex items-center justify-center rounded-md bg-muted px-2.5 py-1 text-xs font-bold text-foreground/70 inset-shine">506(c)</span>
                    <span className="text-xs text-muted-foreground">Broader outreach</span>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "All investors must be verified accredited",
                      "General solicitation and advertising allowed",
                      "Third-party verification required (income, net worth, or Series 7/65/82)",
                      "Stricter on qualification, but lets you market the fund",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Fund Types - Horizontal cards */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Six fund types
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Each fund type changes the risk factors, redemption terms,
                fee structures, and regulatory disclosures in your documents.
              </p>
            </div>
          </FadeIn>

          <Stagger className="space-y-3" staggerDelay={0.04} initialDelay={0.1}>
            {FUND_TYPES.map((fund) => (
              <StaggerItem key={fund.name}>
                <div className="rounded-xl bg-card p-5 sm:p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <div className="flex items-center gap-3 sm:min-w-[180px]">
                      <Building2 className="h-4 w-4 text-foreground/50 shrink-0" />
                      <h3 className="text-sm font-semibold text-card-foreground">{fund.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{fund.details}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Compliance - Single wide section */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Securities compliance checks
                </h2>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {[
                {
                  title: "Reg D and offering",
                  icon: Scale,
                  items: [
                    "506(b) vs. 506(c) verification applied",
                    "Accredited investor criteria enforced",
                    "Bad actor disqualification (Rule 506(d))",
                    "Form D pre-filled for 15-day window",
                    "State blue sky filings tracked",
                  ],
                },
                {
                  title: "Investment Company Act",
                  icon: ShieldCheck,
                  items: [
                    "3(c)(1): 100-investor limit",
                    "3(c)(7): qualified purchaser ($5M)",
                    "3(c)(5)(C): real estate fund exemption",
                    "ERISA 25% benefit plan investor test",
                    "VCOC and REOC exemptions",
                  ],
                },
                {
                  title: "Tax and structure",
                  icon: Building2,
                  items: [
                    "Carried interest 3-year hold (IRC 1061)",
                    "GP catch-up waterfall calculated",
                    "Capital account maintenance",
                    "Partnership Representative (BBA 2015)",
                    "FinCEN BOI (domestic exempt since March 2025)",
                  ],
                },
              ].map((col) => (
                <FadeIn key={col.title} delay={0.05}>
                  <div className="rounded-xl bg-card p-6 card-shine h-full">
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
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Bottom CTA */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="relative rounded-2xl bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 card-shine hero-light bg-noise">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  See what the full fund package looks like.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  Six documents, consistent terms. Free demo in any fund type.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <SignInButton mode="modal">
                    <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                      See a Sample Fund
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
