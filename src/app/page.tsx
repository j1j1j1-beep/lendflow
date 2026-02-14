import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  Landmark,
  Building2,
  Handshake,
  Building,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem, CountUp } from "@/components/motion";

const MODULES = [
  {
    name: "Lending",
    href: "/lending",
    icon: Landmark,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    docs: 36,
    what: "Upload your borrower's financials. Get back a promissory note, loan agreement, deed of trust, and 33 more documents. Checked against federal and state lending laws in all 50 states.",
  },
  {
    name: "Capital",
    href: "/capital",
    icon: Building2,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    docs: 6,
    what: "Set up your fund. Get a PPM, subscription agreement, operating agreement, investor questionnaire, side letter, and Form D draft. Securities exemptions and accreditation handled.",
  },
  {
    name: "Deals / M&A",
    href: "/deals",
    icon: Handshake,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    docs: 6,
    what: "Structure your acquisition. Get an LOI, NDA, purchase agreement, due diligence checklist, disclosure schedules, and closing checklist. Filing thresholds calculated at current rates.",
  },
  {
    name: "Syndication",
    href: "/syndication",
    icon: Building,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    docs: 5,
    what: "Model your real estate deal. Get a PPM, operating agreement, subscription agreement, investor questionnaire, and a year-by-year financial model with waterfall distributions.",
  },
  {
    name: "Compliance",
    href: "/compliance",
    icon: ShieldCheck,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    docs: 6,
    what: "Run your fund admin. Get quarterly LP reports, capital call notices, distribution notices, K-1 summaries, annual reports, and Form ADV. All mapped to current reporting standards.",
  },
];

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-primary/3 blur-3xl" />

      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
          <FadeIn>
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Legal documents for your next deal.
                <br />
                <span className="text-primary">Ready in minutes.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                OpenShut generates the legal documents that PE firms, lenders, and fund managers
                produce for every deal. You fill in the details. We give you the docs. Every number
                verified, every clause compliant.
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
                No demo call. No sales pitch. Sign up and run a deal.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <FadeIn delay={0} className="text-center">
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
                <CountUp to={59} />
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">document types</div>
            </FadeIn>
            <FadeIn delay={0.05} className="text-center">
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
                <CountUp to={5} />
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">modules</div>
            </FadeIn>
            <FadeIn delay={0.1} className="text-center">
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
                <CountUp to={50} />
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">states covered</div>
            </FadeIn>
            <FadeIn delay={0.15} className="text-center">
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
                <CountUp to={0} /><span className="text-muted-foreground">%</span>
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">hallucination rate</div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Five products. Pick the ones you need.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Each one generates a complete set of legal documents for that type of deal.
                Try any of them free.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-5" staggerDelay={0.06} initialDelay={0.1}>
            {MODULES.map((mod) => (
              <StaggerItem key={mod.name}>
                <Link href={mod.href} className="block group">
                  <div className="rounded-xl border bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                      <div className="flex items-center gap-3 sm:min-w-[180px]">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${mod.bg} ${mod.color} transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground`}>
                          <mod.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-card-foreground">{mod.name}</h3>
                          <span className="text-xs text-muted-foreground tabular-nums">{mod.docs} documents</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                        {mod.what}
                      </p>
                      <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground/50 mt-1 shrink-0 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Cost */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Replace what you spend on outside counsel
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Most PE firms spend over $1.5M a year on outside counsel just for document prep.
                The full OpenShut suite costs $420K a year after year one. That is over a million
                dollars back every year, and your docs are ready in minutes instead of weeks.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/pricing"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  See Pricing
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Trust */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mx-auto text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Built for firms that handle sensitive deals
              </h2>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
            {[
              { title: "Your data is encrypted", desc: "Every file uploaded is encrypted at rest and in transit. Download links expire automatically." },
              { title: "Your data is never used for training", desc: "Files are deleted from the AI provider immediately after processing. Nothing is retained or used to train models." },
              { title: "Your firm's data is isolated", desc: "Every query is scoped to your organization. No other firm can see your deals, documents, or data." },
              { title: "Full audit trail", desc: "Every action is logged with timestamps and user identity. You can see who generated what, when." },
              { title: "50-state regulatory compliance", desc: "Documents are checked against the actual federal and state laws that apply to your deal." },
              { title: "Every number is verified twice", desc: "Two independent systems check every figure in your documents. If they disagree, the system flags it." },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <div className="rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Lock className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-card-foreground">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <FadeIn delay={0.2}>
            <div className="mt-8 text-center">
              <Link
                href="/platform"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Full security and compliance details
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="w-full border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="relative rounded-2xl border bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 hover:border-foreground/15 hover:shadow-xl">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
              </div>

              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Try it on a real deal.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  One project free in any module. Full output. No credit card. No sales call.
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
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    Encrypted
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    50-state compliant
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
