import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, FileText, Calculator, Clock, AlertTriangle, ChevronDown } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

export default function CompliancePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background bg-ambient relative overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full hero-light bg-noise">
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-32 relative z-10">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-sm text-muted-foreground mb-6">
                <ShieldCheck className="h-3.5 w-3.5" />
                Compliance
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                Fund admin that
                <br />
                <span className="text-muted-foreground">
                  ships on time.
                </span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                The quarterly reports that take your back office two weeks.
                The K-1s that are always late. The capital call notices copied
                from last quarter. Enter your fund data once and get all 6
                documents back in ILPA format with the right numbers.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <SignInButton mode="modal">
                  <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                    See a Sample Report
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
                Free demo. All 6 documents for one reporting period.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Risk callout */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <FadeIn>
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-foreground/50 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Late K-1s cost $260 per partner per month</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl">
                    A fund with 50 LPs that misses the March 15 deadline by two months owes $26,000 in penalties alone. Wrong withholding rates mean IRS correction notices to your investors. A quarterly report that doesn&apos;t match ILPA format means your institutional LPs ask questions you have to answer manually. The numbers in these documents have to be right, and they have to be on time.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Documents - Full width, one per row with deep detail */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Six documents, each one expanded
              </h2>
            </div>
          </FadeIn>

          <div className="space-y-3">
            {/* LP Quarterly */}
            <details className="group rounded-xl bg-card transition-all duration-200 hover:-translate-y-0.5 card-shine metallic-sheen">
              <summary className="flex items-center justify-between cursor-pointer p-5 sm:p-6 list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-foreground/50" />
                  <h3 className="text-sm font-semibold text-card-foreground">LP Quarterly Report</h3>
                  <span className="text-xs text-muted-foreground">ILPA format</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0" />
              </summary>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                  {["Fund overview and strategy", "Financial summary (NAV, contributions, distributions)", "Performance metrics: IRR, TVPI, DPI, RVPI", "Portfolio company detail by investment", "Cash flow summary for the period", "Fee and expense disclosure", "GP commitment tracking", "ASC 820 fair value hierarchy (Level 1/2/3)"].map((item) => (
                    <div key={item} className="flex items-start gap-2 py-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>

            {/* Capital Call */}
            <details className="group rounded-xl bg-card transition-all duration-200 hover:-translate-y-0.5 card-shine metallic-sheen">
              <summary className="flex items-center justify-between cursor-pointer p-5 sm:p-6 list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-foreground/50" />
                  <h3 className="text-sm font-semibold text-card-foreground">Capital Call Notice</h3>
                  <span className="text-xs text-muted-foreground">10-day minimum notice</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0" />
              </summary>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                  {["Per-investor amounts with pro rata calculations", "Due date with minimum 10 business days notice", "Business day calculations excluding federal holidays", "Wire instructions and payment details", "Purpose of the call (investment, expenses, reserves)", "Overcall protection provisions", "Default penalties: grace period, default interest", "Forced sale of interest and commitment reduction"].map((item) => (
                    <div key={item} className="flex items-start gap-2 py-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>

            {/* Distribution */}
            <details className="group rounded-xl bg-card transition-all duration-200 hover:-translate-y-0.5 card-shine metallic-sheen">
              <summary className="flex items-center justify-between cursor-pointer p-5 sm:p-6 list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-foreground/50" />
                  <h3 className="text-sm font-semibold text-card-foreground">Distribution Notice</h3>
                  <span className="text-xs text-muted-foreground">6 withholding rates</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0" />
              </summary>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-4">Waterfall breakdown per the operating agreement, with tax withholding calculated by investor type:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { rate: "30%", type: "Foreign NRA / entity" },
                      { rate: "15%", type: "FIRPTA (Section 1445)" },
                      { rate: "10%", type: "Partnership transfer (1446(f))" },
                      { rate: "24%", type: "Backup withholding" },
                      { rate: "7%", type: "California state" },
                      { rate: "10.9%", type: "New York state" },
                    ].map((w) => (
                      <div key={w.type} className="rounded-lg bg-muted p-3">
                        <div className="text-lg font-bold text-foreground tabular-nums">{w.rate}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{w.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </details>

            {/* K-1 - Special treatment, open by default */}
            <details className="group rounded-xl bg-card transition-all duration-200 hover:-translate-y-0.5 card-shine metallic-sheen ring-1 ring-border" open>
              <summary className="flex items-center justify-between cursor-pointer p-5 sm:p-6 list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <Calculator className="h-4 w-4 text-foreground/50" />
                  <h3 className="text-sm font-semibold text-card-foreground">K-1 Summary Report</h3>
                  <span className="inline-flex items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-foreground/70 tracking-wide inset-shine">23 boxes</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0" />
              </summary>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                <div className="border-t border-border pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
                    {[
                      "Box 1: Ordinary business income/loss",
                      "Box 2: Net rental real estate income",
                      "Box 3: Other net rental income",
                      "Box 4a: Guaranteed payments (services)",
                      "Box 4b: Guaranteed payments (capital)",
                      "Box 5: Interest income",
                      "Box 6a: Ordinary dividends",
                      "Box 6b: Qualified dividends",
                      "Box 7: Royalties",
                      "Box 8: Net short-term capital gain/loss",
                      "Box 9a: Net long-term capital gain/loss",
                      "Box 9b: Collectibles (28%) gain",
                      "Box 9c: Unrecaptured Section 1250 gain",
                      "Box 10: Net Section 1231 gain/loss",
                      "Box 11: Other income/loss",
                      "Box 12: Section 179 deduction (Code A)",
                      "Box 13: Other deductions (Codes A-W)",
                      "Box 14: Self-employment earnings",
                      "Box 15: Credits",
                      "Box 16: Foreign transactions",
                      "Box 17: AMT items (Codes A-F)",
                      "Box 18: Tax-exempt income",
                      "Box 19: Distributions",
                      "Box 20: QBI / Section 199A (Code Z)",
                      "Box 21: Foreign taxes paid/accrued",
                    ].map((box) => (
                      <div key={box} className="flex items-start gap-2 py-1">
                        <CheckCircle2 className="h-3 w-3 text-foreground/25 mt-1 shrink-0" />
                        <span className="text-xs text-muted-foreground">{box}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground/60">$260 per partner per month penalty for late filing. March 15 deadline for partnerships.</p>
                </div>
              </div>
            </details>

            {/* Annual Report */}
            <details className="group rounded-xl bg-card transition-all duration-200 hover:-translate-y-0.5 card-shine metallic-sheen">
              <summary className="flex items-center justify-between cursor-pointer p-5 sm:p-6 list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-foreground/50" />
                  <h3 className="text-sm font-semibold text-card-foreground">Annual Report</h3>
                  <span className="text-xs text-muted-foreground">16 sections</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0" />
              </summary>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                  {["Balance sheet", "Statement of operations", "Statement of cash flows", "Schedule of investments", "ASC 820 fair value hierarchy (Level 1/2/3)", "Performance summary with attribution", "Management discussion and analysis", "Risk factors and market conditions"].map((item) => (
                    <div key={item} className="flex items-start gap-2 py-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>

            {/* Form ADV */}
            <details className="group rounded-xl bg-card transition-all duration-200 hover:-translate-y-0.5 card-shine metallic-sheen">
              <summary className="flex items-center justify-between cursor-pointer p-5 sm:p-6 list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-foreground/50" />
                  <h3 className="text-sm font-semibold text-card-foreground">Form ADV Part 2A Summary</h3>
                  <span className="inline-flex items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-foreground/70 tracking-wide inset-shine">SEC</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0" />
              </summary>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-3">All 18 SEC-required items in plain language. Must be delivered within 120 days of fiscal year end.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
                    {["Advisory business description", "Fees and compensation", "Performance-based fees and side-by-side", "Types of clients", "Methods of analysis and strategies", "Disciplinary information", "Other financial industry activities", "Code of ethics and personal trading", "Brokerage practices", "Review of accounts", "Client referrals and compensation", "Custody practices", "Investment discretion", "Voting client securities (proxy)", "Financial information and balance sheet", "Marketing Rule compliance"].map((item) => (
                      <div key={item} className="flex items-start gap-2 py-1">
                        <CheckCircle2 className="h-3 w-3 text-foreground/25 mt-1 shrink-0" />
                        <span className="text-xs text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Filing Deadlines - Timeline style */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Deadlines the system tracks
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Miss one and you pay a penalty or lose LP trust.
                </p>
              </div>
            </FadeIn>

            <div className="relative">
              <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border hidden sm:block" />

              <Stagger className="space-y-3" staggerDelay={0.04} initialDelay={0.1}>
                {[
                  { doc: "K-1 Summaries", deadline: "March 15", detail: "$260/partner/month late penalty" },
                  { doc: "LP Quarterly Reports", deadline: "45-60 days after quarter end", detail: "Industry standard, LP expectation" },
                  { doc: "Form ADV Annual Update", deadline: "90 days after fiscal year end", detail: "SEC enforcement action for non-filing" },
                  { doc: "Form ADV Delivery", deadline: "120 days after fiscal year end", detail: "Must be delivered to all advisory clients" },
                  { doc: "Form PF (Large Advisors)", deadline: "60 days after quarter end", detail: "$150M annual filers, $1.5B quarterly" },
                  { doc: "Form PF Current Events", deadline: "72 hours after trigger", detail: "Extraordinary investment losses, large redemptions" },
                  { doc: "Capital Call Notices", deadline: "10+ business days before due", detail: "Invalid call if notice period not met" },
                  { doc: "Distribution Notices", deadline: "With or before payment", detail: "Withholding errors create LP tax issues" },
                ].map((item) => (
                  <StaggerItem key={item.doc}>
                    <div className="flex gap-4 items-start">
                      <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted inset-shine">
                        <Clock className="h-4 w-4 text-foreground/50" />
                      </div>
                      <div className="flex-1 rounded-xl bg-card p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 card-shine">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                          <h3 className="text-sm font-semibold text-card-foreground">{item.doc}</h3>
                          <span className="text-xs font-medium text-muted-foreground tabular-nums bg-muted px-2 py-0.5 rounded w-fit">{item.deadline}</span>
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-1">{item.detail}</p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
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
                  See the full compliance package.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  Enter sample fund data, get all 6 documents back. If the
                  output is better than what your team is doing now, you&apos;ll
                  know immediately.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <SignInButton mode="modal">
                    <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                      See a Sample Report
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
