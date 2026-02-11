import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  FlaskConical,
  Upload,
  Microscope,
  Download,
  CheckCircle2,
  ArrowRight,
  Lock,
  ShieldCheck,
  Scale,
  BookOpen,
  TestTubes,
  Landmark,
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

      {/* HERO */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
          <div className="max-w-4xl">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 animate-fade-up">
              <FlaskConical className="h-6 w-6" />
            </div>
            <h1
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              From raw lab data to
              <br />
              <span className="text-emerald-500">FDA-ready IND submission in hours.</span>
            </h1>
            <p
              className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-4xl leading-relaxed animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              Upload your batch records, stability data, toxicology reports, and PK studies.
              OpenShut Bio extracts every data point, runs it through a deterministic rules engine
              built on 21 CFR Part 312, ICH guidelines, and FDA Project Optimus, then generates
              all 11 IND submission documents. Every number verified. Every regulatory reference cited.
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
            </div>
          </div>
        </div>
      </section>

      {/* DOCUMENT TYPES */}
      <section id="documents" className="w-full border-y border-emerald-500/10 bg-emerald-500/[0.03]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up">
              11 IND submission documents, generated and verified
            </h2>
            <p className="mt-4 text-muted-foreground animate-fade-up" style={{ animationDelay: "50ms" }}>
              Every document follows the CTD (Common Technical Document) format required by FDA, with regulatory citations to the governing guideline.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { name: "Module 1", sub: "Administrative", delay: "50ms" },
              { name: "Module 2", sub: "Summaries", delay: "100ms" },
              { name: "Module 3", sub: "Quality (CMC)", delay: "150ms" },
              { name: "Module 4", sub: "Nonclinical", delay: "200ms" },
              { name: "Module 5", sub: "Clinical", delay: "250ms" },
              { name: "Investigator Brochure", sub: "IB", delay: "300ms" },
              { name: "Clinical Protocol", sub: "Phase 1", delay: "350ms" },
              { name: "Pre-IND Briefing", sub: "FDA Meeting", delay: "400ms" },
              { name: "Informed Consent", sub: "ICF", delay: "450ms" },
              { name: "Diversity Action Plan", sub: "FDA 2024", delay: "500ms" },
              { name: "FDA Form 1571", sub: "IND Application", delay: "550ms" },
            ].map((doc) => (
              <div
                key={doc.name}
                className="rounded-lg border border-emerald-500/20 bg-card p-4 text-center transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-500/5 hover:border-emerald-500/40 animate-fade-up"
                style={{ animationDelay: doc.delay }}
              >
                <div className="text-sm font-semibold text-card-foreground">{doc.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{doc.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="w-full bg-emerald-500/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up">
              Upload lab data to IND package in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Drop in your lab data",
                desc: "Batch records, certificates of analysis, stability reports, tox studies, PK data, clinical protocols. Any format. Every upload encrypted.",
                delay: "100ms",
              },
              {
                step: "02",
                icon: Microscope,
                title: "AI extracts, rules engine verifies",
                desc: "Every data point is extracted and validated against 21 CFR Part 312 requirements. DAR, purity, NOAEL, HED calculations, stability trending, dose escalation design — all verified deterministically.",
                delay: "175ms",
              },
              {
                step: "03",
                icon: Download,
                title: "Download the complete IND package",
                desc: "All 11 CTD modules and supporting documents, each with compliance checks and regulatory citations. Download individually, edit inline, or grab the entire submission as a ZIP.",
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
                <h3 className="text-lg font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REGULATORY FRAMEWORK */}
      <section id="regulatory" className="w-full border-y border-emerald-500/10 bg-emerald-500/[0.03]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up">
              Built on the regulations that govern your submission
            </h2>
            <p className="mt-4 text-muted-foreground animate-fade-up" style={{ animationDelay: "50ms" }}>
              Every document is verified against the actual FDA regulations and ICH guidelines. Not summaries. The regulations themselves.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Landmark,
                category: "FDA IND Requirements",
                items: [
                  "21 CFR Part 312 (IND Regulations)",
                  "21 CFR Part 312.23 (IND Content)",
                  "21 CFR Part 312.32 (Safety Reporting)",
                  "FDA Guidance: Content and Format of INDs",
                  "FDA Project Optimus (Dose Optimization)",
                  "FDA Diversity Action Plan Guidance (2024)",
                ],
                delay: "100ms",
              },
              {
                icon: BookOpen,
                category: "ICH Guidelines",
                items: [
                  "ICH M4 (CTD Format & Structure)",
                  "ICH S6(R1) (Biotechnology Products)",
                  "ICH S9 (Anticancer Pharmaceuticals)",
                  "ICH E6(R2) (Good Clinical Practice)",
                  "ICH Q1A (Stability Testing)",
                  "ICH Q6B (Specifications for Biologics)",
                ],
                delay: "150ms",
              },
              {
                icon: TestTubes,
                category: "GLP / GMP / GCP",
                items: [
                  "21 CFR Part 58 (GLP for Nonclinical)",
                  "21 CFR Part 210/211 (cGMP)",
                  "21 CFR Part 11 (Electronic Records)",
                  "21 CFR Part 50 (Informed Consent)",
                  "21 CFR Part 56 (IRB Requirements)",
                  "USP <1> Injections",
                ],
                delay: "200ms",
              },
              {
                icon: ShieldCheck,
                category: "ADC-Specific Requirements",
                items: [
                  "DAR validation (HIC-HPLC, mass spec)",
                  "Free payload quantitation (<2% spec)",
                  "Linker stability assessment",
                  "Conjugation site characterization",
                  "Potency assay (cytotoxicity IC50)",
                  "Aggregation monitoring (SE-HPLC)",
                ],
                delay: "250ms",
              },
              {
                icon: Scale,
                category: "Safety & Dose Selection",
                items: [
                  "NOAEL to HED conversion (FDA guidance)",
                  "Safety margin calculations",
                  "Starting dose justification (1/10 HED)",
                  "3+3 dose escalation design",
                  "DLT definitions per CTCAE v5.0",
                  "Therapeutic index assessment",
                ],
                delay: "300ms",
              },
              {
                icon: Lock,
                category: "Security & Compliance",
                items: [
                  "End-to-end encryption at rest and in transit",
                  "21 CFR Part 11 electronic signatures",
                  "Full audit trail on all actions",
                  "Role-based access controls",
                  "Organization-level data isolation",
                  "No data shared or used for training",
                ],
                delay: "350ms",
              },
            ].map((group) => (
              <div
                key={group.category}
                className="group rounded-xl border border-emerald-500/20 bg-card p-7 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-500/40 animate-fade-up"
                style={{ animationDelay: group.delay }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <group.icon className="h-5 w-5 text-emerald-500 transition-transform duration-200 group-hover:scale-110" />
                  <h3 className="text-sm font-semibold text-card-foreground">
                    {group.category}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-emerald-500/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="relative rounded-2xl border border-emerald-500/20 bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 animate-fade-up">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
            </div>

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Your IND submission,
                <br className="hidden sm:block" /> verified and ready.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                One program, fully processed. See what the platform does with real preclinical data.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <SignInButton mode="modal">
                  <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-8 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/25 hover:-translate-y-0.5 active:scale-[0.98]">
                    Try Bio Free
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </SignInButton>
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
                  Verified against FDA regulations
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
