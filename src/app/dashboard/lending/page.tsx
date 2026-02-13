"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, X, Landmark, Loader2, Sparkles, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DealCard } from "@/components/DealCard";
import { toast } from "sonner";

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

const PROCESSING_STATUSES = new Set([
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
]);

// M15: CSV export helper
function downloadDealsCSV(deals: DealSummary[]) {
  const headers = ["Borrower Name", "Loan Amount", "Loan Type", "Status", "Documents", "Created"];
  const rows = deals.map((d) => [
    `"${d.borrowerName.replace(/"/g, '""')}"`,
    d.loanAmount ?? "",
    d.loanType ?? "",
    d.status,
    String(d._count.documents),
    new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `deals-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Suspense boundary required for useSearchParams in Next.js 15
export default function LoanOriginationPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    }>
      <LoanOriginationPage />
    </Suspense>
  );
}

function LoanOriginationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // M18: Read initial state from URL query params
  const initialFilter = searchParams.get("filter") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialPage = Math.max(1, Number(searchParams.get("page") || "1"));

  const [deals, setDeals] = useState<DealSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>(initialFilter);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const isInitialLoad = useRef(true);
  const pollErrorCount = useRef(0);
  const [sampleLoading, setSampleLoading] = useState(false);

  // M1: Pagination state
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // M6: Exponential backoff state
  const pollIntervalRef = useRef(5000);
  const prevDealsRef = useRef<string>("");

  // M18: Sync filter/search/page state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    const newUrl = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [filter, debouncedSearch, page]);

  const handleSampleDeal = async () => {
    setSampleLoading(true);
    try {
      const res = await fetch("/api/deals/sample", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create sample deal");
      }
      const { deal } = await res.json();
      toast.success("Sample deal created! Watch the pipeline process it.");
      router.push(`/dashboard/lending/${deal.id}`);
    } catch (err) {
      // M7: 8s duration for error toasts
      toast.error(err instanceof Error ? err.message : "Something went wrong", { duration: 8000 });
    } finally {
      setSampleLoading(false);
    }
  };

  const fetchDeals = useCallback(async () => {
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
      // M1: Pass page param to API
      params.set("page", String(page));

      const res = await fetch(`/api/deals?${params}`);
      if (!res.ok) throw new Error("Failed to load deals");
      const data = await res.json();
      const newDeals = data.deals ?? [];
      setDeals(newDeals);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
      setFetchError(null);
      pollErrorCount.current = 0;

      // M6: Exponential backoff — check if deals changed
      const dealsFingerprint = JSON.stringify(newDeals.map((d: DealSummary) => `${d.id}:${d.status}:${d.updatedAt}`));
      const hasProcessingDeals = newDeals.some((d: DealSummary) => PROCESSING_STATUSES.has(d.status));

      if (hasProcessingDeals) {
        // Reset to fast polling when there are processing deals
        pollIntervalRef.current = 5000;
      } else if (dealsFingerprint === prevDealsRef.current) {
        // Nothing changed, double the interval (cap at 30s)
        pollIntervalRef.current = Math.min(pollIntervalRef.current * 2, 30000);
      } else {
        // Something changed but no processing — moderate interval
        pollIntervalRef.current = 10000;
      }
      prevDealsRef.current = dealsFingerprint;
    } catch {
      pollErrorCount.current += 1;
      setFetchError("Unable to load deals. Please try again.");
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [filter, debouncedSearch, page]);

  // M6: Polling with dynamic interval
  useEffect(() => {
    fetchDeals();
    let timeoutId: ReturnType<typeof setTimeout>;
    function schedulePoll() {
      timeoutId = setTimeout(() => {
        if (pollErrorCount.current >= 3) return;
        fetchDeals().then(() => schedulePoll());
      }, pollIntervalRef.current);
    }
    schedulePoll();
    return () => clearTimeout(timeoutId);
  }, [fetchDeals]);

  // M11: Online/offline auto-retry
  useEffect(() => {
    function handleOnline() {
      toast.success("Connection restored. Refreshing deals...", { duration: 3000 });
      pollIntervalRef.current = 5000; // Reset backoff on reconnect
      pollErrorCount.current = 0;
      fetchDeals();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [fetchDeals]);

  // M4: Search debounce 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      // Reset to page 1 when search changes
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  // Memoize whether there are any deals to export
  const hasDeals = deals.length > 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Loan Origination</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload borrower documents, structure deals across 10 loan programs, and generate 38 ready-to-sign legal documents — all verified against federal and state regulations.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
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
              className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* M15: CSV Export button */}
          {hasDeals && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadDealsCSV(deals)}
              title="Export current filtered deals as CSV"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          )}
          <Button asChild size="sm">
            <Link href="/dashboard/lending/new">
              <Plus className="h-4 w-4 mr-1.5" />
              New Deal
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {/* L5: Show skeleton on initial load to prevent FOUC */}
      {loading && isInitialLoad.current ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">{fetchError}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchDeals}>
            Retry
          </Button>
        </div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Landmark className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No deals yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Upload borrower documents to originate your first loan, or try a sample deal to see the full pipeline in action.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Button asChild>
              <Link href="/dashboard/lending/new">
                <Plus className="h-4 w-4 mr-1.5" />
                New Deal
              </Link>
            </Button>
            <Button variant="outline" onClick={handleSampleDeal} disabled={sampleLoading}>
              {sampleLoading ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Creating...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-1.5" />Try Sample Deal</>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => (
              <Link key={deal.id} href={`/dashboard/lending/${deal.id}`}>
                <DealCard deal={deal} />
              </Link>
            ))}
          </div>

          {/* M1: Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} deals
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
