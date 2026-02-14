import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, FileText, Calculator } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  {
    name: "LP Quarterly Report",
    description:
      "NAV, contributions, distributions, IRR, TVPI, DPI, RVPI, and portfolio company detail. Formatted to ILPA standards so institutional LPs recognize the layout without asking questions.",
  },
  {
    name: "Capital Call Notice",
    description:
      "Per-investor amounts, due date with minimum 10 business days, wire instructions, default penalties, and purpose of the call. Ready to send the day you generate it.",
  },
  {
    name: "Distribution Notice",
    description:
      "Breaks down the source, walks through the waterfall, and calculates tax withholding per investor type. 30% for foreign LPs, 15% FIRPTA, 24% backup withholding.",
  },
  {
    name: "K-1 Summary Report",
    tag: "23 boxes",
    description:
      "All 23 IRS boxes from ordinary income through QBI deduction. Late K-1s cost $260 per partner per month. This gets them done before the penalties start.",
  },
  {
    name: "Annual Report",
    description:
      "Balance sheet, statement of operations, cash flows, schedule of investments, and ASC 820 fair value hierarchy. Everything an auditor or institutional LP expects at year-end.",
  },
  {
    name: "Form ADV Part 2A Summary",
    tag: "SEC",
    description:
      "All 18 SEC-required items in plain language: fees, conflicts, disciplinary history, custody practices. Must be delivered within 120 days of fiscal year end.",
  },
];

export default function CompliancePage() {
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
                <ShieldCheck className="h-3.5 w-3.5" />
                Compliance
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                Six fund admin documents
                <br />
                <span className="text-muted-foreground">
                  from one period of data.
                </span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                The quarterly reports that take your back office two weeks to
                assemble. The K-1s that are always late. The capital call
                notices copied from last quarter with manual edits. Enter your
                fund data once and get all 6 back in ILPA format, with the
                right numbers in the right places.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <SignInButton mode="modal">
                  <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                    Run a Period Free
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
                One reporting period free. All 6 documents.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-14">
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
        </div>
        <div className="section-divider" />
      </section>

      {/* Documents */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                The 6 documents that eat your quarter-end
              </h2>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
            {DOCUMENTS.map((doc) => (
              <StaggerItem key={doc.name}>
                <div className={`rounded-xl bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full ${doc.tag ? "ring-1 ring-border" : ""}`}>
                  <div className="flex items-center gap-2.5 mb-3">
                    {doc.tag ? (
                      <span className="inline-flex items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-foreground/70 tracking-wide inset-shine">
                        {doc.tag}
                      </span>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-foreground/40 shrink-0" />
                    )}
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
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20 bg-dot-pattern">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                  What institutional LPs expect to see
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-10">
                  When the quarterly report matches ILPA standards, the K-1
                  covers all 23 boxes with correct withholding rates, and
                  everything arrives on time, your next fundraise gets easier.
                  These are the standards the system enforces.
                </p>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {[
                    {
                      title: "LP reporting",
                      icon: FileText,
                      items: [
                        "ILPA-standard quarterly layout",
                        "IRR, TVPI, DPI, RVPI calculated consistently",
                        "Portfolio company detail by investment",
                        "NAV bridge with attribution",
                      ],
                    },
                    {
                      title: "Tax compliance",
                      icon: Calculator,
                      items: [
                        "All 23 K-1 boxes, ordinary income through QBI",
                        "$260/partner/month late penalty avoided",
                        "Withholding: domestic, foreign, tax-exempt",
                        "FIRPTA 15%, backup 24%, foreign 30%",
                      ],
                    },
                    {
                      title: "Regulatory",
                      icon: ShieldCheck,
                      items: [
                        "Form ADV with all 18 SEC-required items",
                        "Capital call: 10-day notice + default terms",
                        "ASC 820 fair value hierarchy in annual report",
                        "120-day delivery window tracked",
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
        </div>
        <div className="section-divider" />
      </section>

      {/* How It Works */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-3" staggerDelay={0.08} initialDelay={0.1}>
            {[
              { n: "01", title: "Enter the fund data", desc: "NAV, cash flows, investor list, portfolio positions. If you have it in a spreadsheet, this takes minutes." },
              { n: "02", title: "Get all 6 documents", desc: "LP report, capital call notice, distribution notice, K-1 summaries, annual report, and Form ADV. Generated together from the same data." },
              { n: "03", title: "Review, edit, distribute", desc: "Read everything in the editor. Make changes. Download as Word or PDF and send to your LPs." },
            ].map((step) => (
              <StaggerItem key={step.n}>
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground text-sm font-bold font-mono inset-shine">
                    {step.n}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="relative rounded-2xl bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 card-shine hero-light bg-noise">
                <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Run one reporting period. Check every number.
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                    Enter your fund data, get all 6 documents back. If the
                    output is better than what your team is doing now, you will
                    know immediately.
                  </p>
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <SignInButton mode="modal">
                      <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                        Run a Period Free
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
