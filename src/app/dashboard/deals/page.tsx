"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  X,
  Handshake,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FadeIn, Stagger, StaggerItem, ScaleIn } from "@/components/motion";
import { useGate } from "@/hooks/use-gate";

/* ---------- Types ---------- */

type MAProject = {
  id: string;
  name: string;
  targetCompany: string;
  transactionType: string;
  buyerName: string;
  sellerName: string;
  purchasePrice: number | string | null;
  status: string;
  createdAt: string;
  _count: { maDocuments: number };
};

/* ---------- Constants ---------- */

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Processing", value: "processing" },
  { label: "Needs Review", value: "NEEDS_REVIEW" },
  { label: "Complete", value: "COMPLETE" },
] as const;

const PROCESSING_STATUSES = new Set(["GENERATING_DOCS", "COMPLIANCE_REVIEW"]);

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  STOCK_PURCHASE: "Stock Purchase",
  ASSET_PURCHASE: "Asset Purchase",
  MERGER_FORWARD: "Forward Merger",
  MERGER_REVERSE_TRIANGULAR: "Reverse Triangular Merger",
  MERGER_FORWARD_TRIANGULAR: "Forward Triangular Merger",
  REVERSE_MERGER: "Reverse Merger",
  TENDER_OFFER: "Tender Offer",
  SECTION_363_SALE: "Section 363 Sale",
};

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

/* ---------- Page ---------- */

export default function DealsPage() {
  const router = useRouter();
  const { isGated, isLoading: gateLoading } = useGate();
  const [projects, setProjects] = useState<MAProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isInitialLoad = useRef(true);

  // Redirect gated users with no projects in this module
  useEffect(() => {
    if (!gateLoading && isGated && !loading && projects.length === 0) {
      router.replace("/dashboard/upgrade");
    }
  }, [gateLoading, isGated, loading, projects.length, router]);

  /* Debounce search */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* Fetch projects */
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

      const res = await fetch(`/api/ma?${params}`);
      if (!res.ok) throw new Error("Failed to load deals");
      const data = await res.json();
      setProjects(data.projects ?? []);
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

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <FadeIn>
        <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Generate M&A transaction documents — LOIs, purchase agreements, due
          diligence reports, disclosure schedules, and closing packages.
        </p>
      </FadeIn>

      {/* Filters + Actions */}
      <FadeIn delay={0.1}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
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
                placeholder="Search deals..."
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
            {isGated && projects.length > 0 ? (
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href={`/dashboard/deals/${projects[0].id}`}>
                  <Eye className="h-4 w-4" />
                  View Your Deal
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="gap-1.5 shadow-sm">
                <Link href="/dashboard/deals/new">
                  <Plus className="h-4 w-4" />
                  New Deal
                </Link>
              </Button>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Content */}
      {loading && isInitialLoad.current ? (
        /* Skeleton loading state */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : fetchError ? (
        /* Error state */
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
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ScaleIn delay={0.1}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <Handshake className="h-8 w-8 text-primary" />
            </div>
          </ScaleIn>
          <FadeIn delay={0.2}>
            <h3 className="text-lg font-semibold">No deals yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Create your first M&A transaction to generate LOIs, purchase
              agreements, due diligence checklists, and complete closing packages.
            </p>
            <Button asChild className="mt-6 gap-1.5">
              <Link href="/dashboard/deals/new">
                <Plus className="h-4 w-4" />
                New Deal
              </Link>
            </Button>
          </FadeIn>
        </div>
      ) : (
        /* Cards grid */
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.05} initialDelay={0.15}>
          {projects.map((project) => {
            const statusConf = STATUS_CONFIG[project.status] ?? {
              label: project.status,
              variant: "outline" as const,
            };
            const isProcessing = PROCESSING_STATUSES.has(project.status);

            return (
              <StaggerItem key={project.id}>
                <Link href={`/dashboard/deals/${project.id}`}>
                  <Card className="group relative transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 active:translate-y-0 active:shadow-sm cursor-pointer h-full card-shine metallic-sheen">
                    <CardContent className="pt-0">
                      {/* Title + Status */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors duration-150">
                            {project.targetCompany}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {project.name}
                          </p>
                        </div>
                        <Badge
                          variant={statusConf.variant}
                          className="shrink-0 ml-2 text-[11px]"
                        >
                          {isProcessing && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1" />
                          )}
                          {statusConf.label}
                        </Badge>
                      </div>

                      {/* Transaction type badge */}
                      <Badge variant="secondary" className="text-[10px] mb-3">
                        {TRANSACTION_TYPE_LABELS[project.transactionType] ??
                          project.transactionType}
                      </Badge>

                      {/* Purchase price */}
                      <p className="text-xl font-semibold tracking-tight mb-3 tabular-nums flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {formatCurrency(project.purchasePrice).replace("$", "")}
                      </p>

                      {/* Buyer / Seller */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {project.buyerName}
                          <span className="mx-1 opacity-50">/</span>
                          {project.sellerName}
                        </span>
                      </div>

                      {/* Footer: docs + date */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          {project._count.maDocuments} doc
                          {project._count.maDocuments !== 1 ? "s" : ""}
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
