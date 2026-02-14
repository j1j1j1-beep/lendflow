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

const MODULE_PRICING = [
  { modules: 1, license: "$250,000", monthly: "$14,999", year1: "$429,988" },
  { modules: 2, license: "$325,000", monthly: "$19,999", year1: "$564,988" },
  { modules: 3, license: "$400,000", monthly: "$24,999", year1: "$699,988" },
  { modules: 4, license: "$475,000", monthly: "$29,999", year1: "$834,988" },
  { modules: 5, license: "$550,000", monthly: "$34,999", year1: "$969,988" },
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
  { q: "What counts as a module?", a: "Each of the five products is one module: Lending, Capital, Deals/M&A, Syndication, and Compliance. Pick one to start. Add more anytime." },
  { q: "How does upgrading work?", a: "Pay the $75,000 license difference per module added, plus the $4,999/month increase. If you have 2 modules and want a third, that's $75,000 one-time and your monthly goes from $19,999 to $24,999." },
  { q: "What does the sample deal include?", a: "Pick any module and generate a full document package using sample data. Same output, same compliance checks, same quality as production. You just can't upload your own documents until you subscribe." },
  { q: "What happens after the sample deal?", a: "You need a license to create projects with your own data. Your sample deal stays accessible so you can reference the output." },
  { q: "Is the license fee a one-time payment?", a: "Yes. The license is paid once. Monthly fees cover ongoing platform access, updates, and support." },
  { q: "How do seats work on the standard plan?", a: "Up to 15 seats per organization. Any member can create projects, generate documents, and download packages. Need more than 15? Talk to us about Enterprise or add seats at $750/seat/month." },
  { q: "Is my data secure?", a: "All uploads are encrypted at rest and in transit. Expiring document links. Organization-level data isolation. Full audit trail. We don't use your data for training." },
  { q: "How does payment work?", a: "License fee paid via wire transfer or ACH. Monthly fees billed automatically." },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
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
              Pick the modules your firm needs. Run a sample deal in any module
              to see the full output. Then license the modules you use.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 pb-24 sm:pb-32">
          <Stagger className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start" staggerDelay={0.08} initialDelay={0.1}>
            {/* Free */}
            <StaggerItem>
              <div className="rounded-2xl bg-card p-8 sm:p-10 transition-all duration-200 hover:-translate-y-1 card-shine metallic-sheen">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground inset-shine">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">Free</h3>
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-bold tracking-tight text-foreground">$0</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  Free demo in any module. Full document output. See exactly
                  what the platform does before you buy anything.
                </p>
                <SignInButton mode="modal">
                  <button className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium border border-border bg-background text-foreground shadow-sm transition-all duration-150 ease-out hover:bg-muted hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
                    See a Sample Deal
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>
                <div className="my-8 border-t border-border/50" />
                <ul className="space-y-3">
                  {["Sample deal in any module", "Full document output", "All compliance checks", "No credit card required", "No time limit"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-foreground/30 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>

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
                  <span className="text-base text-muted-foreground ml-1">license</span>
                </div>
                <div className="mb-2">
                  <span className="text-xl font-semibold text-foreground">$14,999</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                  First module. Each additional adds $75,000 to the license and $4,999/month.
                </p>
                <p className="text-xs text-muted-foreground/70 mb-8">15 seats included. $750/seat/month after that.</p>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium bg-foreground text-background shadow-sm transition-all duration-150 ease-out hover:bg-foreground/90 hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>
                <div className="my-8 border-t border-border/50" />
                <ul className="space-y-3">
                  {["Unlimited projects", "Up to 15 seats", "Full document generation per module", "All compliance checks", "Full audit trail", "Inline document editing", "Download packages (ZIP)", "Team management", "Onboarding included", "Wire or ACH payment"].map((f) => (
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
        </div>
      </section>

      {/* Module Pricing Table */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="text-center max-w-2xl mx-auto mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Add modules as you grow</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">Start with one module. Add more when you need them. $75,000 license and $4,999/month per additional module.</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="overflow-x-auto">
                <table className="w-full max-w-3xl mx-auto">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="py-4 px-4 text-left text-sm font-semibold text-foreground">Modules</th>
                      <th className="py-4 px-4 text-right text-sm font-semibold text-foreground">License (one-time)</th>
                      <th className="py-4 px-4 text-right text-sm font-semibold text-foreground">Monthly</th>
                      <th className="py-4 px-4 text-right text-sm font-semibold text-foreground">Year 1 Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULE_PRICING.map((row) => (
                      <tr key={row.modules} className={`border-b border-border/30 transition-colors hover:bg-muted/50 ${row.modules === 5 ? "font-medium" : ""}`}>
                        <td className="py-4 px-4 text-sm text-foreground">
                          {row.modules}
                          {row.modules === 5 && <span className="ml-2 text-xs text-muted-foreground font-normal">Full suite</span>}
                        </td>
                        <td className="py-4 px-4 text-right text-sm text-foreground tabular-nums">{row.license}</td>
                        <td className="py-4 px-4 text-right text-sm text-foreground tabular-nums">{row.monthly}</td>
                        <td className="py-4 px-4 text-right text-sm text-foreground tabular-nums">{row.year1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <p className="mt-8 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
                Year 2+ is just the monthly. A firm running all 5 modules pays $550,000 in year one, then $419,988/year after that.
              </p>
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
