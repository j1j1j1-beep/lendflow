"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Plus, Search, X, Building2, Loader2 } from "lucide-react";
import { FileText, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FadeIn, Stagger, StaggerItem, ScaleIn } from "@/components/motion";

type CapitalProject = {
  id: string;
  name: string;
  fundName: string;
  fundType: string;
  targetRaise: number | null;
  status: string;
  createdAt: string;
  _count: { capitalDocuments: number };
};

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Processing", value: "processing" },
  { label: "Needs Review", value: "NEEDS_REVIEW" },
  { label: "Complete", value: "COMPLETE" },
] as const;

const PROCESSING_STATUSES = new Set(["GENERATING_DOCS", "COMPLIANCE_REVIEW"]);

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  CREATED: { label: "Created", variant: "secondary" },
  GENERATING_DOCS: { label: "Generating", variant: "secondary" },
  COMPLIANCE_REVIEW: { label: "Compliance Review", variant: "secondary" },
  NEEDS_REVIEW: { label: "Needs Review", variant: "outline" },
  COMPLETE: { label: "Complete", variant: "default" },
  ERROR: { label: "Error", variant: "destructive" },
};

const FUND_TYPE_LABELS: Record<string, string> = {
  PRIVATE_EQUITY: "Private Equity",
  VENTURE_CAPITAL: "Venture Capital",
  REAL_ESTATE: "Real Estate",
  HEDGE_FUND: "Hedge Fund",
  CREDIT: "Credit",
  INFRASTRUCTURE: "Infrastructure",
};

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "--";
  if (isNaN(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function CapitalListPage() {
  const [projects, setProjects] = useState<CapitalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isInitialLoad = useRef(true);

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all" && filter !== "processing") {
        params.set("status", filter);
      }
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/capital?${params}`);
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();
      let items: CapitalProject[] = data.projects ?? [];

      // Client-side filter for processing statuses
      if (filter === "processing") {
        items = items.filter((p) => PROCESSING_STATUSES.has(p.status));
      }

      setProjects(items);
      setFetchError(null);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 10000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <FadeIn>
        <h1 className="text-2xl font-bold tracking-tight">Capital</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate complete fund formation and private placement packages — PPMs,
          subscription agreements, operating agreements, SPV docs, and Form D
          filings.
        </p>
      </FadeIn>

      {/* Actions */}
      <FadeIn delay={0.1}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-out ${
                  filter === f.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search funds..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-8 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button asChild size="sm" className="transition-all duration-200 hover:shadow-md">
              <Link href="/dashboard/capital/new">
                <Plus className="h-4 w-4 mr-1.5" />
                New Fund
              </Link>
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Content */}
      {loading && isInitialLoad.current ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 transition-all duration-200"
            onClick={fetchProjects}
          >
            Retry
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ScaleIn delay={0.1}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4 transition-transform duration-300 hover:scale-105">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </ScaleIn>
          <FadeIn delay={0.2}>
            <h3 className="text-lg font-semibold">No fund projects yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Create your first fund to generate a complete capital formation
              package including PPM, subscription agreement, operating agreement,
              and more.
            </p>
          </FadeIn>
          <div className="flex items-center gap-3 mt-6">
            <Button asChild className="transition-all duration-200 hover:shadow-md">
              <Link href="/dashboard/capital/new">
                <Plus className="h-4 w-4 mr-1.5" />
                New Fund
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.05} initialDelay={0.15}>
          {projects.map((project) => {
            const statusConfig = STATUS_CONFIG[project.status] ?? {
              label: project.status,
              variant: "outline" as const,
            };
            const isProcessing = PROCESSING_STATUSES.has(project.status);

            return (
              <StaggerItem key={project.id}>
                <Link href={`/dashboard/capital/${project.id}`}>
                  <Card className="group transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 active:translate-y-0 active:shadow-sm cursor-pointer card-shine metallic-sheen">
                    <CardContent className="pt-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors duration-150">
                            {project.fundName}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="text-[10px] mt-1 font-normal"
                          >
                            {FUND_TYPE_LABELS[project.fundType] ?? project.fundType}
                          </Badge>
                        </div>
                        <Badge
                          variant={statusConfig.variant}
                          className="shrink-0 ml-2 text-[11px]"
                        >
                          {isProcessing && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1" />
                          )}
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <p className="text-xl font-semibold tracking-tight mb-4 tabular-nums">
                        {formatCurrency(project.targetRaise)}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          {project._count.capitalDocuments} doc
                          {project._count.capitalDocuments !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(project.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
