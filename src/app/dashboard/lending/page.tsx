"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, X, Landmark, Loader2, Sparkles } from "lucide-react";
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

export default function LoanOriginationPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<DealSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isInitialLoad = useRef(true);
  const pollErrorCount = useRef(0);
  const [sampleLoading, setSampleLoading] = useState(false);

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
      toast.error(err instanceof Error ? err.message : "Something went wrong");
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

      const res = await fetch(`/api/deals?${params}`);
      if (!res.ok) throw new Error("Failed to load deals");
      const data = await res.json();
      setDeals(data.deals ?? []);
      setFetchError(null);
      pollErrorCount.current = 0;
    } catch {
      pollErrorCount.current += 1;
      setFetchError("Unable to load deals. Please try again.");
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    fetchDeals();
    const interval = setInterval(() => {
      if (pollErrorCount.current >= 3) return;
      fetchDeals();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchDeals]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
          <Button asChild size="sm">
            <Link href="/dashboard/lending/new">
              <Plus className="h-4 w-4 mr-1.5" />
              New Deal
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <Link key={deal.id} href={`/dashboard/lending/${deal.id}`}>
              <DealCard deal={deal} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
