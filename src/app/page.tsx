import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import {
  FileText,
  ShieldCheck,
  Zap,
  Upload,
  Brain,
  Download,
  CheckCircle2,
  Scale,
  ArrowRight,
  FileStack,
  Clock,
  DollarSign,
  AlertTriangle,
  Lock,
} from "lucide-react";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      {/* ── Gradient Orbs ── */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-primary/3 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/4 blur-3xl" />

      {/* ── Navigation ── */}
      <nav className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Loan Origination Platform
            </span>
          </div>
          <div className="flex items-center gap-3">
            <SignInButton mode="modal">
              <button className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Sign In
              </button>
            </SignInButton>
            <a
              href="mailto:demo@lendflow.ai?subject=Demo Request — Loan Origination Platform"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
              Request Demo
            </a>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════ */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
          <div className="max-w-3xl">
            <h1
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              Your analysts spend weeks.
              <br />
              <span className="text-primary">This takes minutes.</span>
            </h1>
            <p
              className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed animate-fade-up"
              style={{ animationDelay: "75ms" }}
            >
              Upload borrower documents. The system reads every line,
              cross-checks every number against the source, generates a
              complete loan package with 26 legal documents — each one
              cited to statute and compliance-verified before you ever see it.
            </p>
            <div
              className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up"
              style={{ animationDelay: "150ms" }}
            >
              <a
                href="mailto:demo@lendflow.ai?subject=Demo Request — Loan Origination Platform"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:scale-[0.98]"
              >
                See It Live
                <ArrowRight className="h-4 w-4" />
              </a>
              <SignInButton mode="modal">
                <button className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium text-foreground shadow-xs transition-all duration-150 ease-out hover:bg-accent hover:shadow-sm hover:-translate-y-px active:scale-[0.98]">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          THE PROBLEM
      ══════════════════════════════════════════════ */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <h2
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-center mb-4 animate-fade-up"
          >
            You already know what&apos;s broken
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "50ms" }}>
            Every lending team deals with the same bottlenecks. The question is whether you keep paying for them.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: Clock,
                stat: "40+ hours",
                label: "per deal in analyst time",
                desc: "Manually keying numbers from tax returns, cross-referencing bank statements, catching your own typos. Your best people spend most of their time on data entry.",
                delay: "100ms",
              },
              {
                icon: DollarSign,
                stat: "$15K+",
                label: "in legal fees per deal",
                desc: "Outside counsel drafts the same loan agreement for the hundredth time. You pay partner rates for work a template could handle — if the template understood regulations.",
                delay: "175ms",
              },
              {
                icon: AlertTriangle,
                stat: "1 in 4",
                label: "deals have data errors",
                desc: "Manual data entry across documents creates discrepancies that slip through review. One wrong number in a debt-service calculation changes the entire credit decision.",
                delay: "250ms",
              },
            ].map((problem) => (
              <div
                key={problem.label}
                className="rounded-xl border border-destructive/20 bg-destructive/5 p-7 animate-fade-up"
                style={{ animationDelay: problem.delay }}
              >
                <problem.icon className="h-5 w-5 text-destructive mb-4" />
                <div className="text-2xl font-bold text-foreground">{problem.stat}</div>
                <div className="text-sm font-medium text-foreground mt-0.5">{problem.label}</div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{problem.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          WHAT CHANGES
      ══════════════════════════════════════════════ */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
            >
              What changes when the machine does the work
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              {
                icon: Brain,
                title: "Reads documents like a senior analyst",
                desc: "Tax returns, bank statements, rent rolls, K-1s, balance sheets — the system reads every line, extracts every field, and flags anything that doesn't add up. No manual data entry. No missed fields.",
                delay: "100ms",
              },
              {
                icon: ShieldCheck,
                title: "Every number verified against the source",
                desc: "Each extracted figure is mathematically recalculated, cross-referenced against other documents in the package, and compared to the raw OCR output. If line 31 of a 1040 doesn't match the sum of lines 1 through 25 — you'll know.",
                delay: "150ms",
              },
              {
                icon: FileStack,
                title: "26 legal documents, generated and cited to statute",
                desc: "Promissory notes, loan agreements, security instruments, guaranties, environmental indemnities, UCC filings, closing disclosures — each one populated from verified deal terms with actual statutory citations. Not boilerplate. Not templates with blanks.",
                delay: "200ms",
              },
              {
                icon: Scale,
                title: "Compliance-checked before it hits your desk",
                desc: "Every document runs through a separate AI legal review (independent from generation), deterministic regulatory checks against 50-state usury limits, program-specific rules (SBA, TRID, ATR/QM), and structural verification. Issues are flagged with the exact regulation and fix.",
                delay: "250ms",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-xl border bg-card p-8 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15 animate-fade-up"
                style={{ animationDelay: feature.delay }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-5 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT ACTUALLY WORKS
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
            >
              Upload to loan package in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Drop in the borrower file",
                desc: "Tax returns, bank statements, financials — any format, any volume. The system handles the rest.",
                delay: "100ms",
              },
              {
                step: "02",
                icon: Zap,
                title: "AI extracts, verifies, and structures",
                desc: "Every data point extracted. Every number recalculated. Deal terms structured against your loan program. Discrepancies flagged for your review.",
                delay: "175ms",
              },
              {
                step: "03",
                icon: Download,
                title: "Download the complete package",
                desc: "Credit memo + all loan documents — generated, compliance-checked, and ready. Download individually, edit inline, or grab the entire package as a ZIP.",
                delay: "250ms",
              },
            ].map((step) => (
              <div
                key={step.step}
                className="relative text-center animate-fade-up"
                style={{ animationDelay: step.delay }}
              >
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Step {step.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TRUST / NUMBERS
      ══════════════════════════════════════════════ */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: "26", label: "Legal documents per deal", delay: "100ms" },
              { value: "50", suffix: "-state", label: "Regulatory compliance", delay: "150ms" },
              { value: "10", label: "Loan programs supported", delay: "200ms" },
              { value: "5", suffix: "-layer", label: "Verification on every doc", delay: "250ms" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center animate-fade-up"
                style={{ animationDelay: stat.delay }}
              >
                <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-muted-foreground">{stat.suffix}</span>
                  )}
                </div>
                <div className="mt-1.5 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div
            className="relative rounded-2xl border bg-card p-12 sm:p-16 text-center overflow-hidden animate-fade-up"
          >
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Stop paying for work
                <br className="hidden sm:block" /> a machine does better.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                See the full system on a live deal. 15 minutes. No slides.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="mailto:demo@lendflow.ai?subject=Demo Request — Loan Origination Platform"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:scale-[0.98]"
                >
                  See It Live
                  <ArrowRight className="h-4 w-4" />
                </a>
                <SignInButton mode="modal">
                  <button className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium text-foreground shadow-xs transition-all duration-150 ease-out hover:bg-accent hover:shadow-sm hover:-translate-y-px active:scale-[0.98]">
                    Sign In
                  </button>
                </SignInButton>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Bank-grade encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  SOC 2 compliant
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  No data leaves your environment
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          <a
            href="mailto:demo@lendflow.ai"
            className="transition-colors hover:text-foreground"
          >
            demo@lendflow.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
