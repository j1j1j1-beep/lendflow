"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight, Home, Eye, Landmark, Building2, Handshake, Building, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn, ScaleIn } from "@/components/motion";

const EA_MODULES = [
  { key: "lending", label: "Lending", price: "$3,000", icon: Landmark },
  { key: "capital", label: "Capital", price: "$8,500", icon: Building2 },
  { key: "ma", label: "Deals / M&A", price: "$8,500", icon: Handshake },
  { key: "syndication", label: "Syndication", price: "$5,000", icon: Building },
  { key: "compliance", label: "Compliance", price: "$2,500", icon: ShieldCheck },
];

type ProjectLink = { module: string; id: string; name: string } | null;

export default function UpgradePage() {
  const [project, setProject] = useState<ProjectLink>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch the user's one project so we can link to it and pre-select the module
  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.recent?.length) return;
        const first = data.recent[0];
        setProject({
          module: first.module,
          id: first.id,
          name: first.name,
        });
        // Pre-select the module from their sample deal
        setSelectedModule(first.module);
      })
      .catch(() => {})
      .finally(() => setLoadingProject(false));
  }, []);

  const handleCheckout = async () => {
    if (!selectedModule) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "early_access", module: selectedModule }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setCheckoutLoading(false);
    }
  };

  function projectHref(mod: string, id: string): string {
    if (mod === "lending") return `/dashboard/lending/${id}`;
    if (mod === "ma") return `/dashboard/deals/${id}`;
    return `/dashboard/${mod}/${id}`;
  }

  const selected = EA_MODULES.find((m) => m.key === selectedModule);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="w-full max-w-lg">
        <ScaleIn delay={0.1}>
          <Card className="card-shine">
            <CardContent className="pt-8 pb-8 px-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-6">
                <Lock className="h-7 w-7 text-primary" />
              </div>

              <FadeIn delay={0.2}>
                <h1 className="text-2xl font-semibold tracking-tight mb-2">
                  Your sample deal is ready
                </h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  Get early access to run deals with your own documents. Pay per deal, per module. Available until May 10th.
                </p>
              </FadeIn>

              <FadeIn delay={0.25}>
                <div className="grid grid-cols-1 gap-2 mb-6">
                  {EA_MODULES.map((mod) => {
                    const Icon = mod.icon;
                    const isSelected = selectedModule === mod.key;
                    return (
                      <button
                        key={mod.key}
                        onClick={() => setSelectedModule(mod.key)}
                        className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all duration-150 ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border hover:border-foreground/20 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                            {mod.label}
                          </span>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                          {mod.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="space-y-3">
                  <Button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || !selectedModule}
                    className="w-full h-11 gap-2"
                  >
                    {checkoutLoading
                      ? "Redirecting..."
                      : selected
                        ? `Get Early Access — ${selected.price}`
                        : "Select a module"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  {loadingProject ? (
                    <Skeleton className="h-10 w-full rounded-lg" />
                  ) : project ? (
                    <Button variant="outline" asChild className="w-full h-10 gap-2">
                      <Link href={projectHref(project.module, project.id)}>
                        <Eye className="h-4 w-4" />
                        View Your Project
                      </Link>
                    </Button>
                  ) : null}

                  <Button variant="ghost" asChild className="w-full h-10 gap-2 text-muted-foreground">
                    <Link href="/">
                      <Home className="h-4 w-4" />
                      Back to Home
                    </Link>
                  </Button>
                </div>
              </FadeIn>
            </CardContent>
          </Card>
        </ScaleIn>
      </div>
    </div>
  );
}
