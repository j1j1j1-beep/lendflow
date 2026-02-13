"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  X,
  ShieldCheck,
  Loader2,
  FileText,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ComplianceProject = {
  id: string;
  name: string;
  fundName: string;
  reportType: string;
  reportingQuarter: string | null;
  taxYear: number | null;
  status: string;
  createdAt: string;
  _count: { complianceDocuments: number };
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Processing", value: "processing" },
  { label: "Needs Review", value: "NEEDS_REVIEW" },
  { label: "Complete", value: "COMPLETE" },
] as const;

const PROCESSING_STATUSES = [
  "CREATED",
  "GENERATING_DOCS",
  "COMPLIANCE_REVIEW",
];

const REPORT_TYPE_LABELS: Record<string, string> = {
  LP_QUARTERLY_REPORT: "LP Quarterly Report",
  CAPITAL_CALL_NOTICE: "Capital Call Notice",
  DISTRIBUTION_NOTICE: "Distribution Notice",
  K1_SUMMARY: "K-1 Summary",
  ANNUAL_REPORT: "Annual Report",
  FORM_ADV_SUMMARY: "Form ADV Summary",
  CAPITAL_ACCOUNT_STATEMENT: "Capital Account Statement",
  VALUATION_REPORT: "Valuation Report",
  AUDITED_FINANCIALS: "Audited Financials",
  SIDE_LETTER_SUMMARY: "Side Letter Summary",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  CREATED: { label: "Created", variant: "secondary" },
  GENERATING_DOCS: { label: "Generating", variant: "secondary" },
  COMPLIANCE_REVIEW: { label: "Reviewing", variant: "secondary" },
  NEEDS_REVIEW: { label: "Needs Review", variant: "outline" },
  COMPLETE: { label: "Complete", variant: "default" },
  ERROR: { label: "Error", variant: "destructive" },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CompliancePage() {
  const [projects, setProjects] = useState<ComplianceProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isInitialLoad = useRef(true);

  /* ---------- Fetch ---------- */

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        if (filter === "processing") {
          params.set("status", PROCESSING_STATUSES.join(","));
        } else {
          params.set("status", filter);
        }
      }
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/compliance?${params}`);
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setProjects(data.projects ?? []);
      setFetchError(null);
    } catch {
      setFetchError("Unable to load compliance reports. Please try again.");
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [filter, debouncedSearch]);

  /* ---------- Polling (10s) ---------- */

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 10_000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  /* ---------- Debounced search (300ms) ---------- */

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ---------- Render ---------- */

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Generate investor reports, compliance filings, and fund administration
          documents — LP reports, capital calls, distributions, K-1 prep, and
          Form ADV documentation.
        </p>
      </div>

      {/* Filters + Search + New */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
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
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-8 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button asChild size="sm" className="shadow-sm">
            <Link href="/dashboard/compliance/new">
              <Plus className="h-4 w-4 mr-1.5" />
              New Report
            </Link>
          </Button>
        </div>
      </div>

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
            className="mt-4"
            onClick={fetchProjects}
          >
            Retry
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No compliance reports yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Generate LP quarterly reports, capital call notices, distribution
            notices, K-1 summaries, and more to keep your fund compliant.
          </p>
          <Button asChild className="mt-6 shadow-sm">
            <Link href="/dashboard/compliance/new">
              <Plus className="h-4 w-4 mr-1.5" />
              New Report
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const statusCfg = STATUS_CONFIG[project.status] ?? {
              label: project.status,
              variant: "outline" as const,
            };
            const isProcessing = PROCESSING_STATUSES.includes(project.status);

            return (
              <Link
                key={project.id}
                href={`/dashboard/compliance/${project.id}`}
              >
                <Card className="group transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 active:translate-y-0 active:shadow-sm cursor-pointer h-full">
                  <CardContent className="pt-0 flex flex-col h-full">
                    {/* Title row */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors duration-150">
                          {project.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {project.fundName}
                        </p>
                      </div>
                      <Badge
                        variant={statusCfg.variant}
                        className="shrink-0 ml-2 text-[11px]"
                      >
                        {isProcessing && (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1" />
                        )}
                        {statusCfg.label}
                      </Badge>
                    </div>

                    {/* Report type badge */}
                    <div className="mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {REPORT_TYPE_LABELS[project.reportType] ??
                          project.reportType}
                      </Badge>
                    </div>

                    {/* Quarter / Tax Year */}
                    <div className="flex-1" />
                    {(project.reportingQuarter || project.taxYear) && (
                      <p className="text-sm font-medium tabular-nums mb-3">
                        {project.reportingQuarter ??
                          `Tax Year ${project.taxYear}`}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        {project._count.complianceDocuments} doc
                        {project._count.complianceDocuments !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(project.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
