"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGate } from "@/hooks/use-gate";
import {
  Landmark,
  Building2,
  Handshake,
  Building,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Calendar,
  Clock,
  Plus,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FadeIn,
  Stagger,
  StaggerItem,
  CountUp,
  ScaleIn,
  AnimatedListItem,
} from "@/components/motion";

type Module = "lending" | "capital" | "ma" | "syndication" | "compliance";

interface DashboardData {
  stats: {
    total: number;
    active: number;
    needsReview: number;
    complete: number;
    error: number;
    docsGenerated: number;
    byModule: Record<Module, number>;
  };
  recent: Array<{
    module: Module;
    id: string;
    name: string;
    status: string;
    updatedAt: string;
    docs: number;
  }>;
  deadlines: Array<{
    module: string;
    projectId: string;
    projectName: string;
    label: string;
    date: string;
  }>;
  flagged: Array<{
    module: Module;
    id: string;
    name: string;
    status: string;
  }>;
}

const MODULE_CONFIG: Record<
  Module,
  { label: string; icon: typeof Landmark; href: string; color: string; bg: string; newHref: string }
> = {
  lending: { label: "Lending", icon: Landmark, href: "/dashboard/lending", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/50", newHref: "/dashboard/lending/new" },
  capital: { label: "Capital", icon: Building2, href: "/dashboard/capital", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/50", newHref: "/dashboard/capital/new" },
  ma: { label: "Deals/M&A", icon: Handshake, href: "/dashboard/deals", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50", newHref: "/dashboard/deals/new" },
  syndication: { label: "Syndication", icon: Building, href: "/dashboard/syndication", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50", newHref: "/dashboard/syndication/new" },
  compliance: { label: "Compliance", icon: ShieldCheck, href: "/dashboard/compliance", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/50", newHref: "/dashboard/compliance/new" },
};

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  CREATED: { label: "Created", variant: "secondary" },
  GENERATING_DOCS: { label: "Generating", variant: "secondary" },
  COMPLIANCE_REVIEW: { label: "In Review", variant: "secondary" },
  NEEDS_REVIEW: { label: "Needs Review", variant: "outline" },
  NEEDS_TERM_REVIEW: { label: "Needs Review", variant: "outline" },
  COMPLETE: { label: "Complete", variant: "default" },
  ERROR: { label: "Error", variant: "destructive" },
};

function projectHref(module: Module, id: string): string {
  if (module === "lending") return `/dashboard/lending/${id}`;
  if (module === "ma") return `/dashboard/deals/${id}`;
  return `/dashboard/${module}/${id}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(dateStr: string): { text: string; urgent: boolean } {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, urgent: true };
  if (days === 0) return { text: "Today", urgent: true };
  if (days === 1) return { text: "Tomorrow", urgent: true };
  if (days <= 7) return { text: `${days} days`, urgent: true };
  if (days <= 30) return { text: `${days} days`, urgent: false };
  return { text: `${Math.floor(days / 30)}mo`, urgent: false };
}

export default function DashboardPage() {
  const router = useRouter();
  const { isGated, isLoading: gateLoading } = useGate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gateLoading && isGated) {
      router.replace("/dashboard/upgrade");
    }
  }, [gateLoading, isGated, router]);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (gateLoading || loading) return <DashboardSkeleton />;
  if (isGated) return <DashboardSkeleton />;
  if (!data) return <DashboardEmpty />;

  const { stats, recent, deadlines, flagged } = data;
  const hasProjects = stats.total > 0;

  if (!hasProjects) return <DashboardEmpty />;

  const activeModules = (Object.entries(stats.byModule) as [Module, number][])
    .filter(([, count]) => count > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn delay={0} duration={0.5}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Overview across all your products
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Stats row */}
      <Stagger className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3" staggerDelay={0.08} initialDelay={0.1}>
        <StaggerItem>
          <StatCard label="Total Projects" value={stats.total} icon={Activity} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Active" value={stats.active} icon={TrendingUp} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Needs Review" value={stats.needsReview} icon={AlertTriangle} highlight={stats.needsReview > 0} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Complete" value={stats.complete} icon={FileText} />
        </StaggerItem>
        <StaggerItem className="col-span-2 sm:col-span-1">
          <StatCard label="Docs Generated" value={stats.docsGenerated} icon={FileText} />
        </StaggerItem>
      </Stagger>

      {/* Module cards */}
      <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" staggerDelay={0.06} initialDelay={0.3}>
        {activeModules.map(([mod, count]) => {
          const config = MODULE_CONFIG[mod];
          const Icon = config.icon;
          return (
            <StaggerItem key={mod}>
              <Link href={config.href}>
                <Card className="group cursor-pointer transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm card-shine metallic-sheen">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 inset-shine ${config.color} ${config.bg}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{count} project{count !== 1 ? "s" : ""}</p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </CardContent>
                </Card>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent projects */}
        <FadeIn delay={0.4} className="lg:col-span-2">
          <Card className="card-shine">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recent.map((project, i) => {
                  const config = MODULE_CONFIG[project.module];
                  const Icon = config.icon;
                  const statusCfg = STATUS_STYLES[project.status];
                  return (
                    <AnimatedListItem key={`${project.module}-${project.id}`} index={i}>
                      <Link
                        href={projectHref(project.module, project.id)}
                        className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors group"
                      >
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-transform duration-200 group-hover:scale-105 ${config.color} ${config.bg}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors duration-150">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {config.label} &middot; {project.docs} doc{project.docs !== 1 ? "s" : ""} &middot; {timeAgo(project.updatedAt)}
                          </p>
                        </div>
                        {statusCfg && (
                          <Badge variant={statusCfg.variant} className="text-[10px] shrink-0">
                            {statusCfg.label}
                          </Badge>
                        )}
                      </Link>
                    </AnimatedListItem>
                  );
                })}
                {recent.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Right sidebar: Deadlines + Flags */}
        <div className="space-y-6">
          {/* Deadlines */}
          <FadeIn delay={0.5}>
            <Card className="card-shine">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {deadlines.length > 0 ? deadlines.map((dl, i) => {
                    const due = daysUntil(dl.date);
                    return (
                      <AnimatedListItem key={i} index={i}>
                        <Link
                          href={projectHref(dl.module as Module, dl.projectId)}
                          className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{dl.projectName}</p>
                            <p className="text-xs text-muted-foreground">{dl.label}</p>
                          </div>
                          <span className={`text-xs font-medium shrink-0 tabular-nums ${due.urgent ? "text-destructive" : "text-muted-foreground"}`}>
                            {due.text}
                          </span>
                        </Link>
                      </AnimatedListItem>
                    );
                  }) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No upcoming deadlines</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Flagged */}
          {flagged.length > 0 && (
            <FadeIn delay={0.6}>
              <Card className="border-amber-200 dark:border-amber-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Needs Attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {flagged.map((project, i) => {
                      const config = MODULE_CONFIG[project.module];
                      const statusCfg = STATUS_STYLES[project.status];
                      return (
                        <AnimatedListItem key={`${project.module}-${project.id}`} index={i}>
                          <Link
                            href={projectHref(project.module, project.id)}
                            className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{project.name}</p>
                              <p className="text-xs text-muted-foreground">{config.label}</p>
                            </div>
                            {statusCfg && (
                              <Badge variant={statusCfg.variant} className="text-[10px] shrink-0">
                                {statusCfg.label}
                              </Badge>
                            )}
                          </Link>
                        </AnimatedListItem>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <FadeIn delay={0.7}>
        <Card className="card-shine">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeModules.map(([mod]) => {
                const config = MODULE_CONFIG[mod];
                const Icon = config.icon;
                return (
                  <Link key={mod} href={config.newHref}>
                    <Button variant="outline" size="sm" className="gap-2 transition-all duration-200 hover:shadow-sm hover:-translate-y-px active:translate-y-0">
                      <Plus className="h-3.5 w-3.5" />
                      <Icon className="h-3.5 w-3.5" />
                      New {config.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
  className,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <Card className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 card-shine metallic-sheen ${className ?? ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <Icon className={`h-4 w-4 ${highlight ? "text-amber-500" : "text-muted-foreground/50"}`} />
        </div>
        <p className={`text-2xl font-semibold tracking-tight tabular-nums ${highlight ? "text-amber-600 dark:text-amber-400" : ""}`}>
          <CountUp to={value} duration={0.8} />
        </p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-60 mt-2" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardEmpty() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 px-4">
        <ScaleIn delay={0.1}>
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Activity className="h-7 w-7 text-primary" />
          </div>
        </ScaleIn>
        <FadeIn delay={0.2}>
          <h2 className="text-xl font-semibold mb-2 text-center">Welcome to OpenShut</h2>
        </FadeIn>
        <FadeIn delay={0.3}>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
            Legal document automation for private equity, lending, syndication, M&A, and fund compliance. Get started by creating your first project.
          </p>
        </FadeIn>
        <Stagger className="flex flex-wrap justify-center gap-3" staggerDelay={0.08} initialDelay={0.4}>
          {(["lending", "capital", "syndication", "ma", "compliance"] as Module[]).map((mod) => {
            const config = MODULE_CONFIG[mod];
            const Icon = config.icon;
            return (
              <StaggerItem key={mod}>
                <Link href={config.newHref}>
                  <Button variant="outline" className="gap-2 transition-all duration-200 hover:shadow-sm hover:-translate-y-px">
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </Button>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </div>
  );
}
