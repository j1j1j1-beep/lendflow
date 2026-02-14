import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Building } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  {
    name: "Private Placement Memorandum (PPM)",
    desc: "The offering document for your investors. Describes the property, the deal structure, projected returns, risks, and legal disclosures.",
  },
  {
    name: "LLC Operating Agreement",
    desc: "Governs the syndication entity. Management rights, voting, capital contributions, distribution waterfalls, transfer restrictions.",
  },
  {
    name: "Subscription Agreement",
    desc: "The contract each investor signs to commit capital. Includes the investment amount, representations, and suitability confirmations.",
  },
  {
    name: "Investor Questionnaire",
    desc: "Collects investor information for accreditation, tax reporting, and compliance. Required before accepting capital.",
  },
  {
    name: "Pro Forma Financial Projections",
    desc: "Year-by-year financial model for the deal. Rental income, operating expenses, debt service, distributions, sale proceeds. IRR, equity multiple, and cash-on-cash return calculated automatically.",
  },
];

const PROPERTY_TYPES = [
  {
    name: "Multifamily",
    desc: "Apartment buildings, garden-style communities, mid-rise and high-rise residential.",
  },
  {
    name: "Office",
    desc: "Class A, B, and C office buildings. Single-tenant or multi-tenant.",
  },
  {
    name: "Retail",
    desc: "Strip centers, power centers, neighborhood retail, single-tenant outparcels.",
  },
  {
    name: "Industrial",
    desc: "Warehouses, distribution centers, flex space, light manufacturing.",
  },
  {
    name: "Mixed Use",
    desc: "Ground-floor retail with residential or office above. Multiple income streams.",
  },
  {
    name: "Self Storage",
    desc: "Climate-controlled and drive-up units. Low operating costs, high margins.",
  },
  {
    name: "Manufactured Housing",
    desc: "Mobile home parks. Residents own the homes, you own the land.",
  },
  {
    name: "Hotel",
    desc: "Limited-service, full-service, or extended-stay hospitality properties.",
  },
  {
    name: "Triple Net (NNN)",
    desc: "Single-tenant properties where the tenant pays taxes, insurance, and maintenance.",
  },
  {
    name: "Senior Living",
    desc: "Independent living, assisted living, memory care, and continuing care communities.",
  },
  {
    name: "Student Housing",
    desc: "Purpose-built housing near universities. Leased by the bed or by the unit.",
  },
  {
    name: "Build-to-Rent",
    desc: "New construction single-family homes built specifically for rental income.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Enter your property details, deal structure, and assumptions",
    desc: "Property type, purchase price, financing terms, hold period, rent growth, and waterfall structure.",
  },
  {
    number: "2",
    title: "We generate all 5 documents plus the financial model",
    desc: "PPM, operating agreement, subscription agreement, investor questionnaire, and pro forma projections.",
  },
  {
    number: "3",
    title: "Review, edit, and download",
    desc: "View inline, make changes, download individually or as a ZIP. Send to counsel for final review.",
  },
];

export default function SyndicationPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/3 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/4 blur-3xl" />

      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Building className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
                  Syndication
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Model your real estate deal.
                <br />
                <span className="text-emerald-500">
                  Get investor-ready documents and a complete financial model.
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                You enter the property, the deal structure, and your assumptions. OpenShut generates
                all 5 syndication documents plus a year-by-year financial model with waterfall
                distributions, IRR, and equity multiples.
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
                One deal free. Full output. No credit card.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Documents */}
      <section className="w-full border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                5 documents. One generation.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Enter your deal once. Get back a PPM, operating agreement, subscription agreement,
                investor questionnaire, and a full pro forma financial model.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            staggerDelay={0.06}
            initialDelay={0.1}
          >
            {DOCUMENTS.map((doc) => (
              <StaggerItem key={doc.name}>
                <div className="group rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <h3 className="text-sm font-semibold text-card-foreground">
                      {doc.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {doc.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Property Types */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Works for any property type
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Select the asset class. The documents and financial model adjust to match the
                property type, including the right operating expense categories and market
                assumptions.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            staggerDelay={0.06}
            initialDelay={0.1}
          >
            {PROPERTY_TYPES.map((type) => (
              <StaggerItem key={type.name}>
                <div className="group rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Building className="h-4 w-4 text-emerald-500 shrink-0" />
                    <h3 className="text-sm font-semibold text-card-foreground">
                      {type.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {type.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Financial Model */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                The financial model runs on math, not AI
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Rental income, vacancy, operating expenses, debt service, and distributions are
                calculated year by year. Waterfall distributions follow the structure you set:
                preferred return, catch-up, promote splits. IRR is computed with actual cash flow
                timing.
              </p>
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
                {[
                  {
                    title: "Year-by-year projections",
                    desc: "Revenue, expenses, NOI, debt service, and cash flow for each year of the hold period. No black boxes.",
                  },
                  {
                    title: "Waterfall distributions",
                    desc: "Preferred return, catch-up, and promote splits calculated based on actual cash flows. You define the tiers.",
                  },
                  {
                    title: "Return metrics",
                    desc: "IRR, equity multiple, and cash-on-cash return computed from the projected cash flows and sale proceeds.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <h3 className="text-sm font-semibold text-card-foreground">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
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
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-muted-foreground">
                Three steps. No demo call. No onboarding.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-6 sm:grid-cols-3"
            staggerDelay={0.08}
            initialDelay={0.1}
          >
            {STEPS.map((step) => (
              <StaggerItem key={step.number}>
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
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
                <div className="h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
              </div>

              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Try it free. One deal, full output, no credit card.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  Sign up and model your first syndication. All 5 documents generated plus the
                  financial model. Download and send to counsel for review.
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
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    5 documents included
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Full financial model
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
