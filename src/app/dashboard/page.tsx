"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Plus, Search, X, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DealCard } from "@/components/DealCard";

type DealSummary = {
  id: string;
  borrowerName: string;
  loanAmount: string | null;
  loanType: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: { documents: number };
};

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Processing", value: "processing" },
  { label: "Needs Review", value: "NEEDS_REVIEW" },
  { label: "Complete", value: "COMPLETE" },
] as const;

const PROCESSING_STATUSES = [
  "UPLOADED",
  "PROCESSING_OCR",
  "CLASSIFYING",
  "EXTRACTING",
  "VERIFYING",
  "RESOLVING",
  "ANALYZING",
  "STRUCTURING",
  "GENERATING_DOCS",
  "GENERATING_MEMO",
];

export default function DashboardPage() {
  const [deals, setDeals] = useState<DealSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isInitialLoad = useRef(true);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch deals from server — only depends on debounced search (tab switching is instant/client-side)
  const fetchDeals = useCallback(async () => {
    try {
      setFetchError(null);
      const params = new URLSearchParams();
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      params.set("limit", "200");
      const res = await fetch(`/api/deals?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load deals");
      const data = await res.json();
      setDeals(data.deals ?? data);
    } catch (err) {
      if (isInitialLoad.current) {
        setFetchError(err instanceof Error ? err.message : "Failed to load deals");
      }
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (isInitialLoad.current) setLoading(true);
    fetchDeals();
  }, [fetchDeals]);

  // Polling for active deals — ref-based to avoid interval recreation on every render
  const fetchDealsRef = useRef(fetchDeals);
  useEffect(() => { fetchDealsRef.current = fetchDeals; }, [fetchDeals]);

  useEffect(() => {
    const hasActiveDeals = deals.some((d) =>
      PROCESSING_STATUSES.includes(d.status)
    );
    if (!hasActiveDeals) return;

    const interval = setInterval(() => fetchDealsRef.current(), 10000);
    return () => clearInterval(interval);
  }, [deals]);

  // Client-side filtering (instant, no re-fetch needed for tab switching or typing)
  const trimmedSearch = searchInput.trim().toLowerCase();
  const searchedDeals = trimmedSearch
    ? deals.filter((d) =>
        d.borrowerName.toLowerCase().includes(trimmedSearch)
      )
    : deals;

  const filteredDeals =
    filter === "all"
      ? searchedDeals
      : filter === "processing"
        ? searchedDeals.filter((d) => PROCESSING_STATUSES.includes(d.status))
        : filter === "NEEDS_REVIEW"
          ? searchedDeals.filter((d) => d.status === "NEEDS_REVIEW" || d.status === "NEEDS_TERM_REVIEW")
          : searchedDeals.filter((d) => d.status === filter);

  const stats = {
    total: deals.length,
    processing: deals.filter((d) => PROCESSING_STATUSES.includes(d.status)).length,
    review: deals.filter((d) => d.status === "NEEDS_REVIEW" || d.status === "NEEDS_TERM_REVIEW").length,
    complete: deals.filter((d) => d.status === "COMPLETE").length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Deals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage loan applications and credit analyses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              aria-label="Search deals by borrower name"
              placeholder="Search by borrower name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={100}
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-9 text-sm transition-all duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Link href="/dashboard/lending/new" className="shrink-0">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Deal
            </Button>
          </Link>
        </div>
      </div>

      {/* Fetch Error */}
      {fetchError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 mb-6">
          <p className="text-sm text-destructive font-medium">{fetchError}</p>
          <button
            onClick={() => { isInitialLoad.current = true; setLoading(true); fetchDeals(); }}
            className="text-sm text-destructive underline mt-1"
          >
            Try again
          </button>
        </div>
      )}

      {/* Stats */}
      {!loading && !fetchError && deals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total },
            { label: "Processing", value: stats.processing },
            { label: "Needs Review", value: stats.review },
            { label: "Complete", value: stats.complete },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="rounded-lg border bg-card p-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/15 animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <p className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold tracking-tight mt-0.5 tabular-nums">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-1 mb-5 rounded-lg bg-muted p-1 w-fit">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ease-out ${
              filter === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Deal Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredDeals.length === 0 ? (
        filter === "all" && !searchInput ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 px-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Welcome to OpenShut</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
            Upload borrower documents to generate a complete loan package — credit analysis, deal structuring, and legal documents in minutes.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/lending/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New Deal
              </Button>
            </Link>
            <span className="text-xs text-muted-foreground">or</span>
            <Link href="/dashboard/lending/new">
              <Button size="sm" variant="outline">
                Try Sample Deal
              </Button>
            </Link>
          </div>
        </div>
        ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 px-4 transition-colors duration-200 hover:border-foreground/20">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 animate-fade-up">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium mb-1">
            {searchInput
              ? `No deals matching "${searchInput.trim()}"`
              : "No matching deals"}
          </h3>
          <p className="text-sm text-muted-foreground mb-5 text-center max-w-xs">
            {searchInput
              ? "Try a different search term or clear the filter."
              : "Try a different filter."}
          </p>
        </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
}
