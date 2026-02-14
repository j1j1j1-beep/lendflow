import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  {
    name: "LP Quarterly Report",
    description:
      "What your LPs actually want to see every quarter. NAV, contributions, distributions, IRR, TVPI/DPI/RVPI, and portfolio company detail. Formatted to ILPA standards so institutional LPs recognize the layout.",
  },
  {
    name: "Capital Call Notice",
    description:
      "The formal notice to draw down committed capital. Per-investor amounts, due date (minimum 10 business days), wire instructions, default penalties, and purpose of the call. Ready to send.",
  },
  {
    name: "Distribution Notice",
    description:
      "Tells each LP what they are getting and why. Breaks down the source, walks through the waterfall, and calculates tax withholding per investor type: 30% for foreign LPs, 15% FIRPTA, 24% backup withholding.",
  },
  {
    name: "K-1 Summary Report",
    description:
      "Covers all 23 IRS boxes from ordinary income through QBI deduction. Late K-1s cost $260 per partner per month in penalties. This gets them done on time.",
  },
  {
    name: "Annual Report",
    description:
      "Balance sheet, statement of operations, cash flows, schedule of investments, and ASC 820 fair value hierarchy. Everything an auditor or institutional LP expects in a year-end report.",
  },
  {
    name: "Form ADV Part 2A Summary",
    description:
      "SEC requires this for registered advisers. All 18 required items in plain language: fees, conflicts, disciplinary history, custody practices. Must be delivered within 120 days of fiscal year end.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Enter the fund data for the period",
    description:
      "NAV, cash flows, investor list, portfolio positions. If you have the data in a spreadsheet, this takes minutes.",
  },
  {
    number: "2",
    title: "Get all 6 documents back",
    description:
      "LP report, capital call notice, distribution notice, K-1 summaries, annual report, and Form ADV. Generated together from the same data.",
  },
  {
    number: "3",
    title: "Review, edit, send to your LPs",
    description:
      "Read everything in the editor. Fix what needs fixing. Download as Word or PDF and distribute.",
  },
];

export default function CompliancePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-500/3 blur-3xl" />

      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-500 mb-6">
                <ShieldCheck className="h-3.5 w-3.5" />
                Compliance
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Stop doing fund admin by hand.
                <br />
                <span className="text-cyan-500">
                  LP reports, K-1s, capital calls. Done.
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                K-1s are late. LP reports look different every quarter. Capital call notices
                get copy-pasted from last time. You know the problem. Enter your fund data
                once and get back 6 documents, formatted correctly, with the right numbers
                in the right places.
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
                One reporting period free. All 6 documents. No credit card.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-3 gap-8 text-center">
            <FadeIn delay={0}>
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">6</div>
              <div className="mt-1.5 text-sm text-muted-foreground">document types</div>
            </FadeIn>
            <FadeIn delay={0.05}>
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">23</div>
              <div className="mt-1.5 text-sm text-muted-foreground">K-1 boxes covered</div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">ILPA</div>
              <div className="mt-1.5 text-sm text-muted-foreground">reporting standards</div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 6 Documents */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                The 6 documents every fund manager dreads
              </h2>
              <p className="mt-4 text-muted-foreground">
                These are the ones that eat your quarter-end. Enter the fund data once
                and get them all back, formatted and consistent.
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
                <div className="rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" />
                    <h3 className="text-sm font-semibold text-card-foreground">{doc.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{doc.description}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Standards */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Your LPs have seen bad reports. These are not that.
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Institutional LPs expect a specific format. ILPA layout for quarterly reports.
                All 23 IRS boxes on the K-1. Correct withholding rates for domestic, foreign,
                and tax-exempt investors. If your reports look professional and arrive on time,
                your next fundraise gets easier.
              </p>
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl mx-auto text-left">
                {[
                  "ILPA-standard LP report layout",
                  "All 23 K-1 boxes, ordinary income through QBI",
                  "IRR, TVPI, DPI, RVPI calculated consistently",
                  "Withholding rates by investor type (domestic, foreign, tax-exempt)",
                  "Form ADV with all 18 SEC-required items",
                  "Capital call with 10-day notice and default terms",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
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
                How it works
              </h2>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-6 sm:grid-cols-3"
            staggerDelay={0.08}
            initialDelay={0.1}
          >
            {STEPS.map((step) => (
              <StaggerItem key={step.number}>
                <div className="rounded-xl border bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500 text-sm font-bold mb-4">
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
                <div className="h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />
              </div>

              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Run one reporting period for free. See what comes out.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  No credit card. Enter your fund data, get all 6 documents back.
                  If the output is better than what you are doing now, you will know immediately.
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
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-500" />
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-500" />
                    6 documents included
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-500" />
                    ILPA standards
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
