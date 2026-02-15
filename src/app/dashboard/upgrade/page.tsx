"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Home, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGate } from "@/hooks/use-gate";
import { FadeIn, ScaleIn } from "@/components/motion";

type ProjectLink = { module: string; id: string; name: string } | null;

export default function UpgradePage() {
  const router = useRouter();
  const { isGated, isLoading: gateLoading } = useGate();
  const [project, setProject] = useState<ProjectLink>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch the user's one project so we can link to it
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
      })
      .catch(() => {})
      .finally(() => setLoadingProject(false));
  }, []);

  // If not gated (active sub or hasn't used free project), redirect to dashboard
  useEffect(() => {
    if (!gateLoading && !isGated) {
      router.replace("/dashboard");
    }
  }, [gateLoading, isGated, router]);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "license" }),
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

  if (gateLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Skeleton className="h-64 w-full max-w-lg rounded-2xl" />
      </div>
    );
  }

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
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">
                  Subscribe to create projects with your own data across all modules. Your
                  sample deal and documents stay accessible.
                </p>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="space-y-3">
                  <Button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full h-11 gap-2"
                  >
                    {checkoutLoading ? "Redirecting..." : "Purchase License"}
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
