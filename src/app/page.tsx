import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { FileText, ShieldCheck, Zap } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Subtle gradient orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />

      <div className="mx-auto max-w-2xl text-center relative">
        <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 animate-fade-up">
          <FileText className="h-7 w-7" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl animate-fade-up" style={{ animationDelay: "50ms" }}>
          LendFlow AI
        </h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl animate-fade-up" style={{ animationDelay: "100ms" }}>
          Triple-verified credit analysis in minutes, not hours.
        </p>
        <p className="mt-2 text-sm text-muted-foreground/80 max-w-md mx-auto animate-fade-up" style={{ animationDelay: "150ms" }}>
          Upload borrower documents. Every data point extracted, verified, and
          analyzed. Professional credit memos generated automatically.
        </p>

        <div className="mt-10 flex items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <SignInButton mode="modal">
            <button className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="inline-flex h-11 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium text-foreground shadow-xs transition-all duration-150 ease-out hover:bg-accent hover:shadow-sm hover:-translate-y-px active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Get Started
            </button>
          </SignUpButton>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
          {[
            { icon: Zap, title: "AI Extraction", desc: "Tax returns, bank statements, and financials extracted with AWS Textract + Claude.", delay: "250ms" },
            { icon: ShieldCheck, title: "Triple Verified", desc: "Math checks, cross-document validation, and human review loops ensure accuracy.", delay: "300ms" },
            { icon: FileText, title: "Auto Documents", desc: "Loan agreements, promissory notes, and security agreements generated from deal terms.", delay: "350ms" },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border bg-card p-5 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15 animate-fade-up"
              style={{ animationDelay: feature.delay }}
            >
              <feature.icon className="h-5 w-5 text-muted-foreground mb-3 transition-colors duration-200 group-hover:text-primary" />
              <h3 className="text-sm font-semibold text-card-foreground">
                {feature.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
