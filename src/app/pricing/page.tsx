import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
  Building2,
  Phone,
  Landmark,
  Handshake,
  Building,
  ChevronDown,
  Users,
  Plug,
  Headphones,
  Globe,
  KeyRound,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════ */

const MODULE_PRICING = [
  { modules: 1, license: "$250,000", monthly: "$14,999", year1: "$429,988" },
  { modules: 2, license: "$325,000", monthly: "$19,999", year1: "$564,988" },
  { modules: 3, license: "$400,000", monthly: "$24,999", year1: "$699,988" },
  { modules: 4, license: "$475,000", monthly: "$29,999", year1: "$834,988" },
  { modules: 5, license: "$550,000", monthly: "$34,999", year1: "$969,988" },
];

const MODULES = [
  {
    name: "Lending",
    icon: Landmark,
    color: "text-blue-500",
    docs: 36,
    desc: "14 loan programs. SBA, commercial CRE, DSCR, bridge, construction, and more. 50-state compliance.",
  },
  {
    name: "Capital",
    icon: Building2,
    color: "text-violet-500",
    docs: 6,
    desc: "Fund formation docs. PPM, sub agreements, operating agreements. Reg D 506(b) and 506(c).",
  },
  {
    name: "Deals / M&A",
    icon: Handshake,
    color: "text-amber-500",
    docs: 6,
    desc: "LOI through closing. Purchase agreements, DD checklists, disclosure schedules. HSR thresholds auto-calculated.",
  },
  {
    name: "Syndication",
    icon: Building,
    color: "text-emerald-500",
    docs: 5,
    desc: "Real estate syndication. PPM, investor docs, deterministic pro forma with IRR and waterfall distributions.",
  },
  {
    name: "Compliance",
    icon: ShieldCheck,
    color: "text-cyan-500",
    docs: 6,
    desc: "Fund admin. ILPA v2.0 quarterly reports, K-1 summaries, capital calls, Form ADV.",
  },
];

const ENTERPRISE_FEATURES = [
  {
    icon: Users,
    title: "Unlimited seats",
    desc: "Everyone at the firm gets access. Associates, partners, paralegals, compliance officers. No seat caps.",
  },
  {
    icon: Plug,
    title: "Custom integrations",
    desc: "Connect to your fund admin (Juniper Square, Allvue, eFront), CRM (Salesforce, DealCloud), or document management system.",
  },
  {
    icon: Headphones,
    title: "Dedicated support",
    desc: "Named account manager. Priority response. Direct line. Not a ticket queue.",
  },
  {
    icon: Globe,
    title: "Custom SLAs",
    desc: "Guaranteed uptime, response times, and data residency requirements for your compliance team.",
  },
  {
    icon: KeyRound,
    title: "SSO / SCIM",
    desc: "Single sign-on with Okta, Azure AD, or your identity provider. Auto-provision and deprovision users.",
  },
  {
    icon: Lock,
    title: "Security review",
    desc: "SOC 2 documentation, penetration test results, and custom security questionnaire responses for your InfoSec team.",
  },
];

const FAQ = [
  {
    q: "What counts as a module?",
    a: "Each of the five products is one module: Lending, Capital, Deals/M&A, Syndication, and Compliance. Pick one to start. Add more anytime.",
  },
  {
    q: "How does upgrading work?",
    a: "Pay the $75,000 license difference per module added, plus the $4,999/month increase. If you have 2 modules and want a third, that's $75,000 one-time and your monthly goes from $19,999 to $24,999.",
  },
  {
    q: "What does the free tier include?",
    a: "One project in any module. Full pipeline, full document package, all compliance checks. The exact same output as the paid version. No credit card required.",
  },
  {
    q: "What happens after my free project?",
    a: "You need a license to create additional projects. Your first project and all its generated documents stay accessible.",
  },
  {
    q: "Is the license fee a one-time payment?",
    a: "Yes. The license is a one-time payment. Monthly fees are billed separately and cover ongoing platform access, updates, and support.",
  },
  {
    q: "How do seats work on the standard plan?",
    a: "Up to 25 seats per organization. Any member can create projects, generate documents, and download packages. Need more than 25? Talk to us about Enterprise.",
  },
  {
    q: "Is my data secure?",
    a: "AES-256 encryption at rest. HTTPS in transit. Expiring document links. Organization-level data isolation. Full audit trail on every action. No data used for AI training.",
  },
  {
    q: "How does payment work?",
    a: "License fee paid via wire transfer or ACH. Monthly fees billed automatically. No long-term contracts.",
  },
];

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */

export default function PricingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-primary/3 blur-3xl" />

      <MarketingNav />

      {/* ─── HERO ─── */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-32 sm:pb-20 text-center">
          <FadeIn>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Per-module pricing.
              <br />
              <span className="text-primary">Start free.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Pick the modules your firm needs. One project free in any module, no credit card.
              Then license the modules you use.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ─── PRICING CARDS ─── */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 pb-24 sm:pb-32">
          <Stagger
            className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start"
            staggerDelay={0.08}
            initialDelay={0.1}
          >
            {/* Free */}
            <StaggerItem>
              <div className="rounded-2xl border border-border/50 bg-card p-8 sm:p-10 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    Free
                  </h3>
                </div>

                <div className="mb-2">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    $0
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  One project in any module. Full pipeline, full document package. See exactly what the platform does.
                </p>

                <SignInButton mode="modal">
                  <button className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium border border-border bg-background text-foreground shadow-sm transition-all duration-150 ease-out hover:bg-muted hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
                    Try It Free
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>

                <div className="my-8 border-t border-border/50" />

                <ul className="space-y-3">
                  {[
                    "1 project in any module",
                    "Full document generation",
                    "All compliance checks",
                    "No credit card required",
                    "No time limit",
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>

            {/* Per-Module License */}
            <StaggerItem>
              <div className="relative rounded-2xl border border-primary/50 bg-card p-8 sm:p-10 shadow-lg shadow-primary/5 ring-1 ring-primary/20 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                    Most Firms
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    Per-Module License
                  </h3>
                </div>

                <div className="mb-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    $250,000
                  </span>
                  <span className="text-base text-muted-foreground ml-1">
                    license
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-xl font-semibold text-foreground">
                    $14,999
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /month
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                  First module. Each additional module adds $75,000 to the license and $4,999/month.
                </p>
                <p className="text-xs text-muted-foreground/70 mb-8">
                  25 seats included. $499/seat/month after that.
                </p>

                <SignInButton mode="modal">
                  <button className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>

                <div className="my-8 border-t border-border/50" />

                <ul className="space-y-3">
                  {[
                    "Unlimited projects",
                    "Up to 25 seats",
                    "Full document generation per module",
                    "All compliance checks",
                    "Full audit trail",
                    "Inline document editing",
                    "Download packages (ZIP)",
                    "Team management",
                    "Onboarding included",
                    "Wire or ACH payment",
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>

            {/* Enterprise */}
            <StaggerItem>
              <div className="rounded-2xl border border-border/50 bg-card p-8 sm:p-10 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    Enterprise
                  </h3>
                </div>

                <div className="mb-2">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    Custom
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  All 5 modules, unlimited seats, custom integrations with your CRM, fund admin, and document management systems. Dedicated support team. Priced by firm size and scope.
                </p>

                <Link
                  href="mailto:sales@openshut.me"
                  className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium border border-border bg-background text-foreground shadow-sm transition-all duration-150 ease-out hover:bg-muted hover:shadow-md hover:-translate-y-px active:scale-[0.98]"
                >
                  Contact Sales
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="my-8 border-t border-border/50" />

                <ul className="space-y-3">
                  {[
                    "Everything in Per-Module",
                    "Unlimited seats",
                    "Custom integrations (CRM, fund admin, DMS)",
                    "Dedicated account manager",
                    "Custom SLAs and uptime guarantees",
                    "SSO / SCIM provisioning",
                    "Security review and SOC 2 docs",
                    "Data residency options",
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* ─── MODULE PRICING TABLE ─── */}
      <section className="w-full border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Add modules as you grow
              </h2>
              <p className="mt-4 text-muted-foreground">
                Start with one module. Add more when you need them. $75,000 license and $4,999/month per additional module.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="overflow-x-auto">
              <table className="w-full max-w-3xl mx-auto">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="py-4 px-4 text-left text-sm font-semibold text-foreground">
                      Modules
                    </th>
                    <th className="py-4 px-4 text-right text-sm font-semibold text-foreground">
                      License (one-time)
                    </th>
                    <th className="py-4 px-4 text-right text-sm font-semibold text-foreground">
                      Monthly
                    </th>
                    <th className="py-4 px-4 text-right text-sm font-semibold text-foreground">
                      Year 1 Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MODULE_PRICING.map((row) => (
                    <tr
                      key={row.modules}
                      className={`border-b border-border/30 transition-colors hover:bg-muted/50 ${
                        row.modules === 5 ? "font-medium" : ""
                      }`}
                    >
                      <td className="py-4 px-4 text-sm text-foreground">
                        {row.modules}
                        {row.modules === 5 && (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            Full suite
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right text-sm text-foreground tabular-nums">
                        {row.license}
                      </td>
                      <td className="py-4 px-4 text-right text-sm text-foreground tabular-nums">
                        {row.monthly}
                      </td>
                      <td className="py-4 px-4 text-right text-sm text-foreground tabular-nums">
                        {row.year1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <p className="mt-8 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
              Year 2+ is just the monthly. A firm running 5 modules pays $550,000 in year one, then $419,988/year after that. Compare that to $1.5M+ in outside counsel for the same work.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ─── AVAILABLE MODULES ─── */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                59 document types across 5 modules
              </h2>
              <p className="mt-4 text-muted-foreground">
                Each module generates production-ready legal documents with deterministic compliance checks.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            staggerDelay={0.06}
            initialDelay={0.1}
          >
            {MODULES.map((mod) => (
              <StaggerItem
                key={mod.name}
                className={mod.name === "Compliance" ? "sm:col-span-2 lg:col-span-1" : ""}
              >
                <div className="group rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <mod.icon className={`h-5 w-5 ${mod.color}`} />
                      <h3 className="text-sm font-semibold text-card-foreground">
                        {mod.name}
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">
                      {mod.docs} docs
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <FadeIn delay={0.2}>
            <div className="mt-8 text-center">
              <Link
                href="/#suite"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                See full module details on the homepage
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── ENTERPRISE DETAILS ─── */}
      <section className="w-full border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Enterprise: we build around your firm
              </h2>
              <p className="mt-4 text-muted-foreground">
                Your firm already has a CRM, fund admin software, and document management system.
                Enterprise means we make OpenShut fit your existing workflow, not the other way around. Priced per engagement based on firm size, module count, and integration scope.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            staggerDelay={0.06}
            initialDelay={0.1}
          >
            {ENTERPRISE_FEATURES.map((item) => (
              <StaggerItem key={item.title}>
                <div className="group rounded-xl border bg-card p-7 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <item.icon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-card-foreground">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="w-full">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Frequently asked questions
              </h2>
            </div>
          </FadeIn>

          <div className="space-y-0 divide-y divide-border/50">
            {FAQ.map((item, i) => (
              <FadeIn key={item.q} delay={i * 0.04}>
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between py-6 text-left">
                    <span className="text-base font-medium text-foreground pr-4">
                      {item.q}
                    </span>
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="pb-6 text-sm text-muted-foreground leading-relaxed pr-10">
                    {item.a}
                  </p>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="w-full border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="relative rounded-2xl border bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 hover:border-foreground/15 hover:shadow-xl">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
              </div>

              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Start with one project.
                  <br className="hidden sm:block" /> Any module. Free.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  Full pipeline. Full document package. No credit card. No commitment.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <SignInButton mode="modal">
                    <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                      Try It Free
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </SignInButton>
                  <Link
                    href="mailto:sales@openshut.me"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-8 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-foreground/15"
                  >
                    Contact Sales
                  </Link>
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    Every upload encrypted
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    No credit card required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Full audit trail
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
