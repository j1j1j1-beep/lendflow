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
      "Performance report sent to limited partners every quarter. Fund returns, portfolio summary, cash flow activity, and manager commentary. Formatted to meet ILPA reporting standards.",
  },
  {
    name: "Capital Call Notice",
    description:
      "Formal notice to LPs requesting their committed capital. Includes the call amount per investor, due date, wire instructions, and the purpose of the call.",
  },
  {
    name: "Distribution Notice",
    description:
      "Notifies LPs of a distribution from the fund. Breaks down the amount per investor, the source (income, return of capital, gain), and tax implications.",
  },
  {
    name: "K-1 Summary Report",
    description:
      "Summary of each investor's tax information mapped to IRS Form 1065 Schedule K-1. All 19 required fields populated. Includes federal and state tax withholding calculations.",
  },
  {
    name: "Annual Report",
    description:
      "Year-end fund report covering performance, portfolio activity, financial statements, and outlook. More detailed than quarterly reports.",
  },
  {
    name: "Form ADV Part 2A Summary",
    description:
      "The SEC-required disclosure document for registered investment advisers. Covers fees, conflicts of interest, disciplinary history, and all 18 required items in plain language.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Enter your fund data",
    description:
      "Reporting period, NAV, cash flows, investor details, and portfolio positions.",
  },
  {
    number: "2",
    title: "We generate all 6 documents",
    description:
      "LP report, capital call, distribution notice, K-1 summary, annual report, and Form ADV summary.",
  },
  {
    number: "3",
    title: "Review, edit, and send to your LPs",
    description:
      "Make changes in the editor. Download as Word or PDF. Distribute to your investors.",
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
                Fund administration documents.
                <br />
                <span className="text-cyan-500">
                  Quarterly reports, capital calls, K-1s, and more.
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                Enter your fund data for the period and get back 6 documents covering
                LP reporting, capital calls, distributions, tax summaries, and regulatory
                filings. Everything your LPs expect, formatted and ready to send.
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
                One reporting period free. Full output. No credit card.
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
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">19</div>
              <div className="mt-1.5 text-sm text-muted-foreground">K-1 fields mapped</div>
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
                6 documents. One reporting period.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every document a fund manager needs to keep LPs informed and stay
                compliant. Enter your fund data once and get the full package back.
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
                Built to match the standards your LPs expect
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                LP reports are formatted to meet ILPA standards. K-1 fields map directly
                to the IRS form. Tax withholding rates are calculated per investor type,
                whether they are domestic, foreign, or tax-exempt. Fund return metrics
                like TVPI, DPI, and RVPI are calculated and cross-checked.
              </p>
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl mx-auto text-left">
                {[
                  "ILPA-compliant LP reporting format",
                  "All 19 K-1 fields mapped to IRS Form 1065",
                  "TVPI, DPI, and RVPI calculated and verified",
                  "Tax withholding by investor type",
                  "Form ADV covers all 18 required items",
                  "Capital call and distribution accounting",
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
                  Try it free. One reporting period, full output, no credit card.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  Sign up and enter your fund data for a single period. All 6 documents
                  generated. Review them, then send to your LPs.
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
