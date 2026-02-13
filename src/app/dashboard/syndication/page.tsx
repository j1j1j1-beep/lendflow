"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Building,
  Plus,
  Search,
  X,
  Loader2,
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FadeIn, Stagger, StaggerItem, ScaleIn } from "@/components/motion";

/* ---------- Types ---------- */

type SyndicationProject = {
  id: string;
  name: string;
  entityName: string;
  sponsorName: string;
  propertyAddress: string;
  propertyType: string;
  purchasePrice: number | string | null;
  totalEquityRaise: number | string | null;
  status: string;
  createdAt: string;
  _count: {
    syndicationDocuments: number;
    syndicationInvestors: number;
  };
};

/* ---------- Constants ---------- */

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Processing", value: "processing" },
  { label: "Needs Review", value: "NEEDS_REVIEW" },
  { label: "Complete", value: "COMPLETE" },
] as const;

const PROCESSING_STATUSES = new Set([
  "GENERATING_DOCS",
  "COMPLIANCE_REVIEW",
]);

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  MULTIFAMILY: "Multifamily",
  OFFICE: "Office",
  RETAIL: "Retail",
  INDUSTRIAL: "Industrial",
  MIXED_USE: "Mixed Use",
  SELF_STORAGE: "Self Storage",
  MOBILE_HOME_PARK: "Mobile Home Park",
  HOTEL: "Hotel",
  NNN_RETAIL: "NNN Retail",
  SENIOR_HOUSING: "Senior Housing",
  STUDENT_HOUSING: "Student Housing",
  BUILD_TO_RENT: "Build to Rent",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  CREATED: { label: "Created", variant: "secondary" },
  GENERATING_DOCS: { label: "Generating Docs", variant: "secondary" },
  COMPLIANCE_REVIEW: { label: "Compliance Review", variant: "secondary" },
  NEEDS_REVIEW: { label: "Needs Review", variant: "outline" },
  COMPLETE: { label: "Complete", variant: "default" },
  ERROR: { label: "Error", variant: "destructive" },
};

/* ---------- Helpers ---------- */

function formatCurrency(value: number | string | null): string {
  if (value === null || value === undefined) return "--";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* ---------- Component ---------- */

export default function SyndicationPage() {
  const [projects, setProjects] = useState<SyndicationProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isInitialLoad = useRef(true);

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        if (filter === "processing") {
          params.set("status", [...PROCESSING_STATUSES].join(","));
        } else {
          params.set("status", filter);
        }
      }
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/syndication?${params}`);
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();
      setProjects(data.projects ?? []);
      setFetchError(null);
    } catch {
      setFetchError("Unable to load syndication projects. Please try again.");
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [filter, debouncedSearch]);

  // Polling every 10s
  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 10000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <FadeIn>
        <h1 className="text-2xl font-bold tracking-tight">Syndication</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Generate complete real estate syndication packages — PPMs, operating
          agreements, subscription documents, waterfall structures, and property
          disclosures.
        </p>
      </FadeIn>

      {/* Filters + Actions */}
      <FadeIn delay={0.1}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
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
                placeholder="Search projects..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-8 text-sm outline-none transition-shadow duration-150 focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
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
            <Button asChild size="sm" className="shadow-sm">
              <Link href="/dashboard/syndication/new">
                <Plus className="h-4 w-4 mr-1.5" />
                New Syndication
              </Link>
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Content */}
      {loading && isInitialLoad.current ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={fetchProjects}
          >
            Retry
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ScaleIn delay={0.1}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <Building className="h-8 w-8 text-primary" />
            </div>
          </ScaleIn>
          <FadeIn delay={0.2}>
            <h3 className="text-lg font-semibold">No syndication projects yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Create your first real estate syndication to generate a complete
              document package including PPM, operating agreement, and subscription
              documents.
            </p>
            <Button asChild className="mt-6 shadow-sm">
              <Link href="/dashboard/syndication/new">
                <Plus className="h-4 w-4 mr-1.5" />
                New Syndication
              </Link>
            </Button>
          </FadeIn>
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
                <Link href={`/dashboard/syndication/${project.id}`}>
                  <Card className="group transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15 active:translate-y-0 active:shadow-sm cursor-pointer h-full">
                    <CardContent className="pt-0">
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors duration-150">
                            {project.propertyAddress || project.entityName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {PROPERTY_TYPE_LABELS[project.propertyType] ??
                                project.propertyType}
                            </Badge>
                          </div>
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

                      {/* Financials */}
                      <div className="flex items-baseline gap-3 mb-1">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Purchase
                          </p>
                          <p className="text-lg font-semibold tracking-tight tabular-nums truncate">
                            {formatCurrency(project.purchasePrice)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Equity Raise</p>
                          <p className="text-sm font-medium tracking-tight tabular-nums truncate">
                            {formatCurrency(project.totalEquityRaise)}
                          </p>
                        </div>
                      </div>

                      {/* Sponsor */}
                      <p className="text-xs text-muted-foreground truncate mb-3">
                        {project.sponsorName}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {project._count.syndicationDocuments} doc
                            {project._count.syndicationDocuments !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {project._count.syndicationInvestors}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
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
