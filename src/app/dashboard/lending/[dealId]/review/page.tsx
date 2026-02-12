"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewItemComponent } from "@/components/ReviewItem";

type ReviewItemData = {
  id: string;
  fieldPath: string;
  extractedValue: string;
  expectedValue: string | null;
  checkType: string;
  description: string;
  documentPage: number | null;
  documentId: string | null;
  status: string;
  resolvedValue: string | null;
};

type DocumentRef = {
  id: string;
  fileName: string;
};

type Resolution = {
  itemId: string;
  status: "CONFIRMED" | "CORRECTED" | "NOTED";
  resolvedValue?: string;
  note?: string;
};

type DealData = {
  id: string;
  borrowerName: string;
  status: string;
  reviewItems: ReviewItemData[];
  documents: DocumentRef[];
};

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.dealId as string;

  const [deal, setDeal] = useState<DealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resolutions, setResolutions] = useState<Map<string, Resolution>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const fetchDeal = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${dealId}`);
      if (!res.ok) throw new Error("Failed to load deal");
      const data = await res.json();
      setDeal(data.deal ?? data);

      const existing = new Map<string, Resolution>();
      for (const item of data.reviewItems ?? []) {
        if (item.status !== "PENDING") {
          existing.set(item.id, {
            itemId: item.id,
            status: item.status as "CONFIRMED" | "CORRECTED" | "NOTED",
            resolvedValue: item.resolvedValue ?? undefined,
          });
        }
      }
      setResolutions(existing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchDeal();
  }, [fetchDeal]);

  const handleResolve = useCallback((resolution: Resolution) => {
    setResolutions((prev) => {
      const updated = new Map(prev);
      updated.set(resolution.itemId, resolution);
      return updated;
    });
  }, []);

  const reviewItems = deal?.reviewItems ?? [];
  const totalItems = reviewItems.length;
  const resolvedCount = resolutions.size;
  const allResolved = totalItems > 0 && resolvedCount >= totalItems;
  const progressPercent = totalItems > 0 ? (resolvedCount / totalItems) * 100 : 0;

  const documentMap = new Map<string, string>();
  for (const doc of deal?.documents ?? []) {
    documentMap.set(doc.id, doc.fileName);
  }

  const handleSubmitReview = async () => {
    if (!allResolved) return;
    setSubmitting(true);

    try {
      const statusToAction: Record<string, string> = {
        CONFIRMED: "confirm",
        CORRECTED: "correct",
        NOTED: "note",
      };

      for (const resolution of resolutions.values()) {
        const res = await fetch(`/api/deals/${dealId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewItemId: resolution.itemId,
            action: statusToAction[resolution.status] ?? "confirm",
            value: resolution.resolvedValue ?? undefined,
            note: resolution.note ?? undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          // Skip items already resolved (from a previous partial submit)
          if (err.error === "Review item has already been resolved") continue;
          throw new Error(err.error || "Failed to submit review");
        }
      }

      toast.success("Review submitted! Resuming analysis pipeline.");
      router.push(`/dashboard/lending/${dealId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? "Deal not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (deal.status !== "NEEDS_REVIEW") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <Alert>
          <AlertTitle>No Review Required</AlertTitle>
          <AlertDescription>
            This deal does not currently require review.{" "}
            <button
              onClick={() => router.push(`/dashboard/lending/${dealId}`)}
              className="font-medium underline"
            >
              Return to deal
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push(`/dashboard/lending/${dealId}`)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-x-0.5 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {deal.borrowerName}
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Data Verification
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {totalItems} discrepanc{totalItems !== 1 ? "ies" : "y"} found between the uploaded documents and our calculations. Please confirm or correct each item to proceed.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Review Progress</span>
            <span className="text-sm text-muted-foreground">
              {resolvedCount} of {totalItems} items reviewed
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      <div className="space-y-3 mb-8">
        {reviewItems.map((item) => (
          <ReviewItemComponent
            key={item.id}
            item={item}
            documentName={item.documentId ? documentMap.get(item.documentId) : undefined}
            onResolve={handleResolve}
          />
        ))}
      </div>

      <div className="sticky bottom-0 border-t bg-background/80 backdrop-blur-md py-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 shadow-[0_-1px_3px_0_rgb(0_0_0_/_0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {allResolved
              ? "All items reviewed. Ready to continue analysis."
              : `${totalItems - resolvedCount} item${totalItems - resolvedCount !== 1 ? "s" : ""} remaining`}
          </p>
          <Button
            onClick={handleSubmitReview}
            disabled={!allResolved || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Continue Analysis"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
