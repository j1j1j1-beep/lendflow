import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  Upload,
  ShieldCheck,
  Download,
  CheckCircle2,
  ArrowRight,
  Lock,
  BookOpen,
  TestTubes,
  AlertTriangle,
  Clock,
  DollarSign,
  XCircle,
  FileText,
  Activity,
  BarChart3,
  Beaker,
  Database,
  Search,
  Eye,
  Sparkles,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export default async function BioLanding() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard/bio");

  return (
    <div className="dark flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      {/* Emerald Gradient Orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/3 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/4 blur-3xl" />

      <MarketingNav />

      {/* ============================================ */}
      {/* HERO */}
      {/* ============================================ */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
          <div className="max-w-4xl">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 animate-fade-up">
              <TestTubes className="h-6 w-6" />
            </div>
            <h1
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              Your regulatory submissions,
              <br />
              <span className="text-emerald-500">done in hours — not months.</span>
            </h1>
            <p
              className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-3xl leading-relaxed animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              IND submissions cost $500K&ndash;$2M in consultants and take 6&ndash;12 months of manual work.
              One mismatched number between your CMC section and your batch records means an FDA rejection letter.
              OpenShut Bio generates your entire IND package from source data and independently verifies
              every data point before you download.
            </p>
            <div
              className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up"
              style={{ animationDelay: "150ms" }}
            >
              <SignInButton mode="modal">
                <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-8 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/25 hover:-translate-y-0.5 active:scale-[0.98]">
                  Try Bio Free
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </SignInButton>
              <Link
                href="/bio/features"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-emerald-500/20 px-8 text-sm font-medium text-muted-foreground transition-all duration-200 ease-out hover:text-foreground hover:border-emerald-500/40 hover:bg-emerald-500/5"
              >
                See All Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* THE PROBLEM */}
      {/* ============================================ */}
      <section className="w-full border-y border-emerald-500/10 bg-emerald-500/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up">
              IND submissions are broken
            </h2>
            <p className="mt-4 text-muted-foreground animate-fade-up" style={{ animationDelay: "50ms" }}>
              The current process wastes time, money, and leaves too much room for human error.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: Clock,
                title: "6-12 months of manual work",
                desc: "Regulatory consultants manually compile documents, cross-reference data, and format everything to CTD structure. Your team spends months reviewing drafts instead of advancing your science.",
                delay: "100ms",
              },
              {
                icon: DollarSign,
                title: "$500K-$2M in consultants",
                desc: "Regulatory writing firms charge $40K-$80K per CTD module. A full IND package with protocol, IB, and all five modules runs half a million at minimum. For a startup, that is runway.",
                delay: "175ms",
              },
              {
                icon: XCircle,
                title: "One wrong number = FDA rejection",
                desc: "A purity value in Module 3 that does not match the CoA. A NOAEL that does not match the tox report. A dose calculation that is off by a decimal. Any mismatch and FDA sends a Refuse to File letter.",
                delay: "250ms",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="group rounded-xl border border-emerald-500/20 bg-card p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-500/40 animate-fade-up"
                style={{ animationDelay: card.delay }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <card.icon className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">{card.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PLATFORM OVERVIEW */}
      {/* ============================================ */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up">
              One platform for regulatory submissions and daily data operations
            </h2>
            <p className="mt-4 text-muted-foreground animate-fade-up" style={{ animationDelay: "50ms" }}>
              OpenShut Bio is not just a document generator. It is a full regulatory platform with
              submission generation, daily data tools, and built-in verification.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileText,
                title: "IND Submissions",
                status: "Available",
                desc: "Complete Investigational New Drug application. All 11 documents generated from your source data, verified against 21 CFR 312 and ICH guidelines.",
                delay: "50ms",
              },
              {
                icon: Beaker,
                title: "Batch Record Review",
                status: "Available",
                desc: "Upload batch records and get automated review against 21 CFR 211.188 requirements. Every data point checked: yields, in-process controls, release testing.",
                delay: "100ms",
              },
              {
                icon: BarChart3,
                title: "Stability Tracking",
                status: "Available",
                desc: "Track stability studies per ICH Q1A(R2) and Q5C. Monitor potency, purity, aggregation, and degradation across time points and storage conditions.",
                delay: "150ms",
              },
              {
                icon: AlertTriangle,
                title: "Adverse Event Monitoring",
                status: "Available",
                desc: "Manage adverse events with proper classification per 21 CFR 312.32. Track SUSARs, SAEs, and reporting timelines. MedDRA-coded.",
                delay: "200ms",
              },
              {
                icon: Database,
                title: "Lab Data Management",
                status: "Available",
                desc: "Centralize analytical results with 21 CFR Part 11 compliance. Audit trails, electronic signatures, ALCOA+ data integrity. HPLC, mass spec, flow cytometry.",
                delay: "250ms",
              },
              {
                icon: Search,
                title: "Regulatory Intelligence",
                status: "Available",
                desc: "Track FDA guidance updates, ICH guideline changes, Federal Register notices, and warning letters. Stay ahead of regulatory changes that affect your program.",
                delay: "300ms",
              },
              {
                icon: FileText,
                title: "BLA Submissions",
                status: "Coming Soon",
                desc: "Biologics License Application for marketed products. Full eCTD package with post-market safety data integration.",
                delay: "350ms",
              },
              {
                icon: Activity,
                title: "Clinical Study Reports",
                status: "Coming Soon",
                desc: "ICH E3-compliant clinical study reports generated from your trial data, with statistical tables and safety narratives.",
                delay: "400ms",
              },
              {
                icon: FileText,
                title: "Annual Reports & Safety Reports",
                status: "Coming Soon",
                desc: "IND Annual Reports per 21 CFR 312.33, DSURs per ICH E2F, and PSUR/PBRER reports for post-market products.",
                delay: "450ms",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-xl border border-emerald-500/20 bg-card p-7 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-500/40 animate-fade-up"
                style={{ animationDelay: item.delay }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <item.icon className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      item.status === "Available"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-card-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* IND DOCUMENTS */}
      {/* ============================================ */}
      <section id="documents" className="w-full border-y border-emerald-500/10 bg-emerald-500/[0.03]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up">
              11 IND submission documents, generated and verified
            </h2>
            <p className="mt-4 text-muted-foreground animate-fade-up" style={{ animationDelay: "50ms" }}>
              Every document follows the CTD (Common Technical Document) format required by FDA.
              Each one is generated from your source data and independently verified before download.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Module 1 — Administrative & Prescribing",
                sub: "Cover letters, FDA Form 1571, investigator information, regulatory correspondence",
                delay: "50ms",
              },
              {
                name: "Module 2 — Overview & Summaries",
                sub: "Quality overall summary, nonclinical overview, clinical overview — the executive summary FDA reads first",
                delay: "100ms",
              },
              {
                name: "Module 3 — Drug Quality (CMC)",
                sub: "Manufacturing process, batch data, purity specifications, stability results, container closure systems",
                delay: "150ms",
              },
              {
                name: "Module 4 — Nonclinical Studies",
                sub: "Toxicology results, pharmacology, pharmacokinetics, NOAEL determination, safety margins",
                delay: "200ms",
              },
              {
                name: "Module 5 — Clinical Information",
                sub: "Clinical protocol, prior human experience, dose escalation rationale, safety monitoring plan",
                delay: "250ms",
              },
              {
                name: "Investigator Brochure (IB)",
                sub: "Complete summary of physical, chemical, pharmaceutical, pharmacological, and clinical data for investigators",
                delay: "300ms",
              },
              {
                name: "Clinical Protocol",
                sub: "Phase 1 study design, dose escalation, inclusion/exclusion criteria, endpoints, statistical plan",
                delay: "350ms",
              },
              {
                name: "Pre-IND Briefing Document",
                sub: "FDA meeting package with proposed development plan, key questions, and supporting data summaries",
                delay: "400ms",
              },
              {
                name: "Informed Consent Form (ICF)",
                sub: "Patient-facing consent per 21 CFR 50 with risks, benefits, alternatives, and voluntary participation language",
                delay: "450ms",
              },
              {
                name: "Diversity Action Plan",
                sub: "Enrollment strategy for underrepresented populations per FDA 2024 guidance and FDORA requirements",
                delay: "500ms",
              },
              {
                name: "FDA Form 1571",
                sub: "The official IND application form with all sponsor, drug, and regulatory information fields completed",
                delay: "550ms",
              },
            ].map((doc) => (
              <div
                key={doc.name}
                className="group rounded-lg border border-emerald-500/20 bg-card p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-500/5 hover:border-emerald-500/40 animate-fade-up"
                style={{ animationDelay: doc.delay }}
              >
                <div className="text-sm font-semibold text-card-foreground">{doc.name}</div>
                <div className="mt-2 text-xs text-muted-foreground leading-relaxed">{doc.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS */}
      {/* ============================================ */}
      <section id="how-it-works" className="w-full bg-emerald-500/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up">
              Three steps. Source data in, verified submission out.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload your source data",
                desc: "Batch records, certificates of analysis, stability reports, toxicology studies, PK data, clinical protocols. Any format. Every upload encrypted at rest and in transit.",
                delay: "100ms",
              },
              {
                step: "02",
                icon: ShieldCheck,
                title: "AI generates, verification checks",
                desc: "AI writes the regulatory prose for each document. Then a completely separate verification layer checks every single number, calculation, and regulatory reference against your source data independently.",
                delay: "175ms",
              },
              {
                step: "03",
                icon: Download,
                title: "Review, edit, and download",
                desc: "View each document with compliance checks alongside. Edit anything inline. Download individually or grab the entire submission as a ZIP. It is your first draft — your team makes it final.",
                delay: "250ms",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="group relative text-center animate-fade-up"
                style={{ animationDelay: s.delay }}
              >
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 transition-all duration-200 group-hover:shadow-xl group-hover:shadow-emerald-600/30 group-hover:scale-105">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Step {s.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* WHY YOU CAN TRUST IT */}
      {/* ============================================ */}
      <section className="w-full border-y border-emerald-500/10 bg-emerald-500/[0.03]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up">
              Why you can trust it
            </h2>
            <p className="mt-4 text-muted-foreground animate-fade-up" style={{ animationDelay: "50ms" }}>
              Regulatory submissions demand absolute accuracy. Here is how we deliver it.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: "Every number verified independently",
                desc: "AI writes the prose for each document. Then a completely separate verification system checks every data point — purity values, yields, NOAEL calculations, dose conversions, stability results — against your original source data. If a number in the document does not match the source, it gets flagged before you ever see it.",
                delay: "100ms",
              },
              {
                icon: BookOpen,
                title: "Built on FDA regulations",
                desc: "Every document is generated and verified against the actual regulations: 21 CFR Part 312 (IND requirements), 21 CFR 211.188 (batch records), ICH M4 (CTD format), ICH S6(R1) (biotech products), ICH Q1A(R2) (stability testing), ICH Q5C (biologics stability), ICH Q6B (biologics specifications), ICH E2A (safety reporting), 21 CFR Part 58 (GLP), and more.",
                delay: "175ms",
              },
              {
                icon: Lock,
                title: "Your data stays yours",
                desc: "All uploads encrypted at rest and in transit. Full audit trail on every action. Organization-level data isolation. Your data is never shared with other customers and never used to train AI models. Designed for 21 CFR Part 11 electronic records compliance.",
                delay: "250ms",
              },
              {
                icon: Eye,
                title: "You review everything",
                desc: "OpenShut Bio generates a first draft, not a final submission. Every document is presented with compliance checks alongside so your team can see exactly what was verified and what needs attention. Edit anything inline. Your regulatory team makes the final call on every word.",
                delay: "325ms",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="group rounded-xl border border-emerald-500/20 bg-card p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-500/40 animate-fade-up"
                style={{ animationDelay: card.delay }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <card.icon className="h-5 w-5 text-emerald-500 transition-transform duration-200 group-hover:scale-110" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">{card.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* COMING SOON */}
      {/* ============================================ */}
      <section className="w-full bg-emerald-500/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up">
              Coming soon
            </h2>
            <p className="mt-4 text-muted-foreground animate-fade-up" style={{ animationDelay: "50ms" }}>
              IND submissions are just the beginning. The same verification approach, applied to every submission type your program needs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "BLA Submissions",
                desc: "Full Biologics License Application with eCTD packaging, CMC updates, and post-market safety integration.",
                delay: "50ms",
              },
              {
                icon: Activity,
                title: "Clinical Study Reports",
                desc: "ICH E3-compliant CSRs with statistical tables, patient narratives, and safety summaries generated from trial data.",
                delay: "100ms",
              },
              {
                icon: FileText,
                title: "IND Annual Reports",
                desc: "Yearly updates per 21 CFR 312.33 with protocol amendments, safety data summaries, and manufacturing changes.",
                delay: "150ms",
              },
              {
                icon: AlertTriangle,
                title: "Development Safety Update Reports",
                desc: "DSURs per ICH E2F with cumulative safety analysis, benefit-risk assessment, and signal evaluation.",
                delay: "200ms",
              },
              {
                icon: FileText,
                title: "CMC Supplements",
                desc: "Chemistry, Manufacturing, and Controls supplements for process changes, new sites, and specification updates.",
                delay: "250ms",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-lg border border-emerald-500/10 bg-card/50 p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-500/5 hover:border-emerald-500/30 animate-fade-up"
                style={{ animationDelay: item.delay }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <item.icon className="h-4 w-4 text-emerald-500/70" />
                  <h3 className="text-sm font-semibold text-card-foreground">{item.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA */}
      {/* ============================================ */}
      <section className="w-full border-t border-emerald-500/10 bg-emerald-500/[0.03]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="relative rounded-2xl border border-emerald-500/20 bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 animate-fade-up">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
            </div>

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Your first IND submission,
                <br className="hidden sm:block" /> on us.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                Try one complete program free. Upload your data or use our sample program to see
                every document generated and verified end to end.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <SignInButton mode="modal">
                  <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-8 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/25 hover:-translate-y-0.5 active:scale-[0.98]">
                    Try Bio Free
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </SignInButton>
                <Link
                  href="/bio/pricing"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-emerald-500/20 px-8 text-sm font-medium text-muted-foreground transition-all duration-200 ease-out hover:text-foreground hover:border-emerald-500/40 hover:bg-emerald-500/5"
                >
                  View Pricing
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-500" />
                  Every upload encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  21 CFR Part 11 compliant
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Independent verification on every document
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-sell */}
      <section className="w-full py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Also available:{" "}
            <Link href="/" className="text-primary hover:text-primary/80 font-medium transition-colors duration-200">
              OpenShut Lending
            </Link>
            {" "}&mdash; Full loan origination platform
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
