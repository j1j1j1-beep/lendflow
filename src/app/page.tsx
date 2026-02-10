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
              Loan Origination.
              <br />
              <span className="text-muted-foreground">Automated.</span>
            </h1>
            <p
              className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed animate-fade-up"
              style={{ animationDelay: "75ms" }}
            >
              Upload borrower documents. Get triple-verified credit analysis,
              complete loan packages, and compliance-checked documents — in
              minutes, not days.
            </p>
            <div
              className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up"
              style={{ animationDelay: "150ms" }}
            >
              <a
                href="mailto:demo@lendflow.ai?subject=Demo Request — Loan Origination Platform"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:scale-[0.98]"
              >
                Request Demo
                <ArrowRight className="h-4 w-4" />
              </a>
              <SignInButton mode="modal">
                <button className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium text-foreground shadow-xs transition-all duration-150 ease-out hover:bg-accent hover:shadow-sm hover:-translate-y-px active:scale-[0.98]">
                  Sign In
                </button>
              </SignInButton>
            </div>
            <div
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground animate-fade-up"
              style={{ animationDelay: "225ms" }}
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                SOC 2 compliant infrastructure
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Enterprise-grade security
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS / SOCIAL PROOF
      ══════════════════════════════════════════════ */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: "26", label: "Document Templates", delay: "100ms" },
              { value: "50", label: "State Compliance", suffix: "-State", delay: "150ms" },
              { value: "10", label: "Loan Programs", delay: "200ms" },
              { value: "3x", label: "Triple Verification", delay: "250ms" },
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
          FEATURE GRID
      ══════════════════════════════════════════════ */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              Everything you need to close faster
            </h2>
            <p
              className="mt-4 text-lg text-muted-foreground animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              From document intake to final loan package — one platform handles
              the entire origination workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              {
                icon: Zap,
                title: "AI Document Extraction",
                desc: "AWS Textract combined with large language models extracts every data point from tax returns, bank statements, rent rolls, and financial statements — with field-level confidence scores.",
                delay: "100ms",
              },
              {
                icon: ShieldCheck,
                title: "Triple Verification",
                desc: "Three independent verification layers: mathematical recalculation of every figure, cross-document consistency checks, and source-document comparison against Textract output.",
                delay: "150ms",
              },
              {
                icon: FileStack,
                title: "Auto Document Generation",
                desc: "26 loan document templates generate complete packages — promissory notes, loan agreements, security instruments, guarantees, environmental indemnities, and more — all populated from verified deal terms.",
                delay: "200ms",
              },
              {
                icon: Scale,
                title: "Compliance Built-In",
                desc: "State-by-state regulatory checks, program-specific compliance requirements, usury limits, and disclosure rules verified automatically. Every document gets a compliance score before it reaches your desk.",
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
          HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              Three steps to a complete loan package
            </h2>
            <p
              className="mt-4 text-lg text-muted-foreground animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              What used to take days of analyst time now runs in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload Documents",
                desc: "Drop in borrower financials — tax returns, bank statements, rent rolls, personal financial statements. Any format, any volume.",
                delay: "100ms",
              },
              {
                step: "02",
                icon: Brain,
                title: "AI Extracts & Verifies",
                desc: "Every data point is extracted, mathematically verified, cross-referenced across documents, and compared against source. Discrepancies are flagged automatically.",
                delay: "175ms",
              },
              {
                step: "03",
                icon: Download,
                title: "Download Loan Package",
                desc: "A complete credit memo plus all loan documents — generated, compliance-checked, and ready for review. Download individually or as a single ZIP file.",
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
          BOTTOM CTA
      ══════════════════════════════════════════════ */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div
            className="relative rounded-2xl border bg-card p-12 sm:p-16 text-center overflow-hidden animate-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            {/* CTA background orb */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Ready to transform your
                <br className="hidden sm:block" /> lending operations?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                See how automated origination can cut your deal processing time
                from days to minutes. Schedule a live walkthrough with our team.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="mailto:demo@lendflow.ai?subject=Demo Request — Loan Origination Platform"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:scale-[0.98]"
                >
                  Request Demo
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
