import type { Metadata } from "next";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { FAQSchema, SoftwareApplicationSchema } from "@/components/structured-data";

export const metadata: Metadata = {
  title: "Pricing for Legal Automation & PE Deal Tools",
  description:
    "Early access from $2,500 per deal. Per-module licensing at $250,000 per module + $20,000/month unlimited usage. Generate deal terms, loan packages, PPMs, and compliance reports.",
  keywords: ["legal automation pricing", "PE tools pricing", "deal tools cost", "legal document automation pricing", "enterprise legal software"],
  alternates: { canonical: "https://openshut.me/pricing" },
  openGraph: {
    title: "Pricing | OpenShut Legal Automation & Deal Tools",
    description: "Per-module licensing. $250,000 per module + $20,000/month unlimited deal terms generation.",
    url: "https://openshut.me/pricing",
  },
};
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
  Zap,
} from "lucide-react";

const MODULE_PRICING = [
  { modules: 1, license: "$250,000", monthly: "$20,000", yearlyTotal: "$490,000" },
  { modules: 2, license: "$500,000", monthly: "$27,499", yearlyTotal: "$829,988" },
  { modules: 3, license: "$750,000", monthly: "$34,998", yearlyTotal: "$1,169,976" },
  { modules: 4, license: "$1,000,000", monthly: "$42,497", yearlyTotal: "$1,509,964" },
  { modules: 5, license: "$1,250,000", monthly: "$49,996", yearlyTotal: "$1,849,952" },
];

const MODULES = [
  { name: "Lending", icon: Landmark, docs: 36, desc: "14 loan programs. SBA, commercial CRE, DSCR, bridge, construction, and more. 50-state compliance." },
  { name: "Capital", icon: Building2, docs: 6, desc: "Fund formation docs. PPM, sub agreements, operating agreements. Reg D 506(b) and 506(c)." },
  { name: "Deals / M&A", icon: Handshake, docs: 6, desc: "LOI through closing. Purchase agreements, DD checklists, disclosure schedules. HSR thresholds calculated." },
  { name: "Syndication", icon: Building, docs: 5, desc: "Real estate syndication. PPM, investor docs, and a year-by-year financial model with waterfall distributions." },
  { name: "Compliance", icon: ShieldCheck, docs: 6, desc: "Fund admin. Quarterly LP reports, K-1 summaries, capital calls, distribution notices, Form ADV." },
];

const ENTERPRISE_FEATURES = [
  { icon: Users, title: "Unlimited seats", desc: "Everyone at the firm gets access. Associates, partners, paralegals, compliance officers." },
  { icon: Plug, title: "Custom integrations", desc: "Salesforce, DealCloud, Juniper Square, Allvue, eFront, NetDocuments, iManage. Built as part of your engagement." },
  { icon: Headphones, title: "Dedicated support", desc: "Named account manager. Priority response. Direct line." },
  { icon: Globe, title: "Custom SLAs", desc: "Guaranteed uptime, response times, and data residency requirements for your compliance team." },
  { icon: KeyRound, title: "SSO / SCIM", desc: "Single sign-on with Okta, Azure AD, or your identity provider. Auto-provision and deprovision users." },
  { icon: Lock, title: "Security review", desc: "SOC 2 documentation, penetration test results, and custom security questionnaire responses for your InfoSec team." },
];

const FAQ = [
  { q: "What is Early Access?", a: "Pay per deal instead of a full module license. Prices range from $2,500 (Compliance) to $8,500 (Capital or M&A) depending on the module. You get full access, all compliance checks, and can upload your own documents. Available until May 10th." },
  { q: "When does Early Access end?", a: "May 10th. After that, new deals require a per-module license ($250,000 + $20,000/mo). Any deals you've already paid for during early access are yours forever." },
  { q: "What counts as a module?", a: "Each of the five products is one module: Lending, Capital, Deals/M&A, Syndication, and Compliance. Pick one to start. Add more anytime." },
  { q: "How does adding a module work?", a: "Pay the $250,000 license for the new module and add $7,499/month to your subscription. Unlimited usage from day one. No change to your existing modules." },
  { q: "What does the sample deal include?", a: "Pick any module and generate a full document package using sample data. Same output, same compliance checks, same quality as production. You just can't upload your own documents until you subscribe." },
  { q: "What happens after the sample deal?", a: "You need a license or early access to create projects with your own data. Your sample deal stays accessible so you can reference the output." },
  { q: "Is usage really unlimited?", a: "Yes. No per-deal fees, no caps, no overage charges. Generate as many document packages as your firm needs. The monthly fee covers everything." },
  { q: "How do seats work?", a: "Up to 10 seats per organization. Any member can create projects, generate documents, and download packages. Need more than 10? Talk to us about Enterprise or add seats at $750/seat/month." },
  { q: "Is my data secure?", a: "All uploads are encrypted at rest and in transit. Expiring document links. Organization-level data isolation. Full audit trail. We don't use your data for training." },
  { q: "How does payment work?", a: "License fee paid via wire transfer or ACH. Monthly subscription billed automatically." },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background bg-ambient relative overflow-x-hidden">
      <SoftwareApplicationSchema />
      <FAQSchema faqs={FAQ} />
      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full hero-light bg-noise">
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-16 sm:pt-36 sm:pb-20 text-center relative z-10">
          <FadeIn>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
              Per-module pricing.
              <br />
              <span className="text-muted-foreground">See it before you buy.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Early access: pay per deal until May 10th. Run a sample deal first to see the full output.
              Per-module licensing at general availability.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Early Access */}
      <section className="w-full">
        <div className="mx-auto max-w-4xl px-6 pb-16">
          <FadeIn>
            <div className="relative rounded-2xl border-2 border-primary/30 bg-primary/[0.03] p-8 sm:p-10 overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1.5 rounded-bl-xl text-xs font-semibold tracking-wide uppercase">
                Until May 10th
              </div>
              <div className="flex items-center gap-2.5 mb-3">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">Early Access Program</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                Pay per deal. No license required.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mb-6">
                Full document package, all compliance checks, upload your own documents.
                Available until May 10th. After that, per-module licensing only.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {[
                  { name: "Lending", price: "$3,000", icon: Landmark },
                  { name: "Capital", price: "$8,500", icon: Building2 },
                  { name: "Deals / M&A", price: "$8,500", icon: Handshake },
                  { name: "Syndication", price: "$5,000", icon: Building },
                  { name: "Compliance", price: "$2,500", icon: ShieldCheck },
                ].map((mod) => (
                  <div key={mod.name} className="flex items-center justify-between rounded-lg border border-primary/15 bg-background/50 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <mod.icon className="h-4 w-4 text-primary/60" />
                      <span className="text-sm font-medium text-foreground">{mod.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{mod.price}<span className="text-xs text-muted-foreground font-normal"> / deal</span></span>
                  </div>
                ))}
              </div>

              <ul className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
                {["Full document package", "All compliance checks", "Upload your own documents", "No license commitment"].map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary/50 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
                  Get Early Access
                  <ArrowRight className="h-4 w-4" />
                </button>
              </SignInButton>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 pb-24 sm:pb-32">
          <Stagger className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start" staggerDelay={0.08} initialDelay={0.1}>
            {/* Per-Module */}
            <StaggerItem>
              <div className="relative rounded-2xl border border-foreground/20 bg-card p-8 sm:p-10 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-foreground px-4 py-1 text-xs font-semibold text-background shadow-sm">
                    Most Firms
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">Per-Module License</h3>
                </div>
                <div className="mb-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">$250,000</span>
                  <span className="text-base text-muted-foreground ml-1">per module</span>
                </div>
                <div className="mb-2">
                  <span className="text-xl font-semibold text-foreground">+ $20,000/mo</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                  One-time license per module. Unlimited usage. No per-deal fees, no caps.
                </p>
                <p className="text-xs text-muted-foreground/70 mb-1">Each additional module: +$250,000 license + $7,499/mo.</p>
                <p className="text-xs text-muted-foreground/70 mb-8">10 seats included. $750/seat/month after that.</p>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium bg-foreground text-background shadow-sm transition-all duration-150 ease-out hover:bg-foreground/90 hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>
                <div className="my-8 border-t border-border/50" />
                <ul className="space-y-3">
                  {["Unlimited usage", "Up to 10 seats", "Full document package per deal", "All compliance checks", "Full audit trail", "Inline document editing", "Download packages (ZIP)", "Team management", "Onboarding included", "Wire or ACH payment"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-foreground/30 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>

            {/* Enterprise */}
            <StaggerItem>
              <div className="rounded-2xl bg-card p-8 sm:p-10 transition-all duration-200 hover:-translate-y-1 card-shine metallic-sheen">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground inset-shine">
                    <Phone className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">Enterprise</h3>
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-bold tracking-tight text-foreground">Custom</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  All 5 modules, unlimited seats, custom integrations with your CRM, fund admin, and DMS. Dedicated support team.
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
                  {["Everything in Per-Module", "Unlimited seats", "Salesforce, DealCloud, Juniper Square, and more", "Dedicated account manager", "Custom SLAs and uptime guarantees", "SSO / SCIM provisioning", "Security review and SOC 2 docs", "Data residency options"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-foreground/30 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          </Stagger>

          {/* Free - below the paid tiers */}
          <FadeIn delay={0.3}>
            <div className="mt-8 mx-auto max-w-md">
              <div className="rounded-2xl bg-card p-8 text-center card-shine metallic-sheen">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-card-foreground">Try it first</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Run a sample deal in any module. Full document output, all compliance checks. No credit card, no time limit.
                </p>
                <SignInButton mode="modal">
                  <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium border border-border bg-background text-foreground px-6 shadow-sm transition-all duration-150 ease-out hover:bg-muted hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
                    See a Sample Deal
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Module Scaling Table */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="text-center max-w-2xl mx-auto mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Add modules as you grow</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">$250,000 license for your first module. Each additional module is +$250,000 license and +$7,499/month. Unlimited usage on every module.</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="overflow-x-auto">
                <table className="w-full max-w-4xl mx-auto">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="py-4 px-4 text-left text-sm font-semibold text-foreground">Modules</th>
                      <th className="py-4 px-4 text-right text-sm font-semibold text-foreground">License (One-Time)</th>
                      <th className="py-4 px-4 text-right text-sm font-semibold text-foreground">Monthly</th>
                      <th className="py-4 px-4 text-right text-sm font-semibold text-foreground">Year 1 Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULE_PRICING.map((row) => (
                      <tr key={row.modules} className="border-b border-border/30 transition-colors hover:bg-muted/50">
                        <td className="py-4 px-4 text-sm text-foreground font-medium">{row.modules} module{row.modules > 1 ? "s" : ""}</td>
                        <td className="py-4 px-4 text-right text-sm text-foreground tabular-nums">{row.license}</td>
                        <td className="py-4 px-4 text-right text-sm text-foreground tabular-nums">{row.monthly}<span className="text-xs text-muted-foreground font-normal">/mo</span></td>
                        <td className="py-4 px-4 text-right text-sm text-foreground font-semibold tabular-nums">{row.yearlyTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeIn>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Available Modules */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">59 document types across 5 modules</h2>
            </div>
          </FadeIn>
          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
            {MODULES.map((mod) => (
              <StaggerItem key={mod.name} className={mod.name === "Compliance" ? "sm:col-span-2 lg:col-span-1" : ""}>
                <div className="group rounded-xl bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <mod.icon className="h-5 w-5 text-foreground/50" />
                      <h3 className="text-sm font-semibold text-card-foreground">{mod.name}</h3>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">{mod.docs} docs</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{mod.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <FadeIn delay={0.2}>
            <div className="mt-8 text-center">
              <Link href="/lending" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80">
                Explore each module in detail
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Enterprise Details */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="text-center max-w-2xl mx-auto mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Enterprise: we build around your firm</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Your firm already has a CRM, fund admin software, and document management system. Enterprise means OpenShut fits your existing workflow.
                </p>
              </div>
            </FadeIn>
            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
              {ENTERPRISE_FEATURES.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="group rounded-xl bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                    <div className="flex items-center gap-2.5 mb-3">
                      <item.icon className="h-4 w-4 text-foreground/50" />
                      <h3 className="text-sm font-semibold text-card-foreground">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* FAQ */}
      <section className="w-full">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Frequently asked questions</h2>
            </div>
          </FadeIn>
          <div className="space-y-0 divide-y divide-border/50">
            {FAQ.map((item, i) => (
              <FadeIn key={item.q} delay={i * 0.04}>
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between py-6 text-left">
                    <span className="text-base font-medium text-foreground pr-4">{item.q}</span>
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="pb-6 text-sm text-muted-foreground leading-relaxed pr-10">{item.a}</p>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="relative rounded-2xl bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 card-shine hero-light bg-noise">
                  <div className="relative z-10">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    See the output before you buy.
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                    Free demo in any module. Full document output.
                  </p>
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <SignInButton mode="modal">
                      <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                        See a Sample Deal
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
