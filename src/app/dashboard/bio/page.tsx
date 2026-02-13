"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, X, FlaskConical, TestTubes, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BioProgramCard } from "@/components/BioProgramCard";

type ProgramSummary = {
  id: string;
  name: string;
  drugName: string | null;
  drugClass: string | null;
  phase: string | null;
  status: string;
  createdAt: string;
  _count: { bioDocuments: number; bioGeneratedDocuments: number };
};

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Processing", value: "processing" },
  { label: "Complete", value: "COMPLETE" },
  { label: "Error", value: "ERROR" },
] as const;

const PROCESSING_STATUSES = [
  "UPLOADING",
  "PROCESSING_OCR",
  "EXTRACTING",
  "CLASSIFYING",
  "VERIFYING",
  "ANALYZING",
  "GENERATING_DOCS",
  "COMPLIANCE_REVIEW",
];

export default function BioDashboardPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const isInitialLoad = useRef(true);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const pollErrorCount = useRef(0);

  const handleTrySample = async () => {
    setSampleLoading(true);
    setSampleError(null);
    try {
      const res = await fetch("/api/bio/programs/sample", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSampleError(data.error ?? "Failed to create sample program");
        return;
      }
      const programId = data.program?.id;
      if (programId) {
        router.push(`/dashboard/bio/${programId}`);
      } else {
        // Refresh list
        fetchPrograms();
      }
    } catch {
      setSampleError("Failed to create sample program. Please try again.");
    } finally {
      setSampleLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPrograms = useCallback(async () => {
    try {
      setFetchError(null);
      const params = new URLSearchParams();
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      const res = await fetch(`/api/bio/programs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load programs");
      const data = await res.json();
      setPrograms(Array.isArray(data) ? data : data.programs ?? []);
      pollErrorCount.current = 0;
    } catch (err) {
      pollErrorCount.current += 1;
      if (isInitialLoad.current) {
        setFetchError(err instanceof Error ? err.message : "Failed to load programs");
      }
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (isInitialLoad.current) setLoading(true);
    fetchPrograms();
  }, [fetchPrograms]);

  // Polling when any program is processing
  const fetchRef = useRef(fetchPrograms);
  useEffect(() => {
    fetchRef.current = fetchPrograms;
  }, [fetchPrograms]);

  useEffect(() => {
    const hasActive = programs.some((p) =>
      PROCESSING_STATUSES.includes(p.status)
    );
    if (!hasActive) return;
    if (pollErrorCount.current >= 3) return;
    const interval = setInterval(() => {
      if (pollErrorCount.current >= 3) {
        clearInterval(interval);
        return;
      }
      fetchRef.current();
    }, 10000);
    return () => clearInterval(interval);
  }, [programs]);

  // Client-side filtering
  const trimmedSearch = searchInput.trim().toLowerCase();
  const searchedPrograms = trimmedSearch
    ? programs.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmedSearch) ||
          (p.drugName && p.drugName.toLowerCase().includes(trimmedSearch))
      )
    : programs;

  const filteredPrograms =
    filter === "all"
      ? searchedPrograms
      : filter === "processing"
        ? searchedPrograms.filter((p) => PROCESSING_STATUSES.includes(p.status))
        : searchedPrograms.filter((p) => p.status === filter);

  const stats = {
    total: programs.length,
    processing: programs.filter((p) => PROCESSING_STATUSES.includes(p.status)).length,
    complete: programs.filter((p) => p.status === "COMPLETE").length,
    error: programs.filter((p) => p.status === "ERROR").length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Bio Programs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage biopharma regulatory programs and IND submissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              aria-label="Search programs"
              placeholder="Search by name or drug..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={100}
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-9 text-sm transition-all duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40"
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
          <Link href="/dashboard/bio/new" className="shrink-0">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" />
              New Program
            </Button>
          </Link>
        </div>
      </div>

      {/* Fetch Error */}
      {fetchError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 mb-6">
          <p className="text-sm text-destructive font-medium">{fetchError}</p>
          <button
            onClick={() => {
              isInitialLoad.current = true;
              setLoading(true);
              fetchPrograms();
            }}
            className="text-sm text-destructive underline mt-1"
          >
            Try again
          </button>
        </div>
      )}

      {/* Stats */}
      {!loading && !fetchError && programs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total },
            { label: "Processing", value: stats.processing },
            { label: "Complete", value: stats.complete },
            { label: "Error", value: stats.error },
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

      {/* Program Grid */}
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
      ) : filteredPrograms.length === 0 ? (
        filter === "all" && !searchInput ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 px-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <FlaskConical className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No bio programs yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Create your first program to get started with biopharma regulatory document generation,
              or try a sample ADC program to see the platform in action.
            </p>
            {sampleError && (
              <p className="text-sm text-destructive mb-4">{sampleError}</p>
            )}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleTrySample}
                disabled={sampleLoading}
                className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
              >
                {sampleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTubes className="h-4 w-4" />
                )}
                {sampleLoading ? "Creating..." : "Try Sample Program"}
              </Button>
              <Link href="/dashboard/bio/new">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4" />
                  New Program
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
                ? `No programs matching "${searchInput.trim()}"`
                : "No matching programs"}
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
          {filteredPrograms.map((program) => (
            <BioProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}
    </div>
  );
}
