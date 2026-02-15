"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Handshake, Lock } from "lucide-react";
import { useGate } from "@/hooks/use-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentUploader } from "@/components/DocumentUploader";
import { MissingDocsDialog } from "@/components/missing-docs-dialog";
import { fetchMissingSourceDocs } from "@/components/source-doc-checklist";
import { SampleDealPicker } from "@/components/sample-deal-picker";
import { SampleSourceDocsPreview } from "@/components/sample-source-docs-preview";
import { SAMPLE_MA_DEALS } from "@/config/sample-deals/deals";
import { getMASourceDocs } from "@/config/sample-deals/source-docs/ma-source-docs";
import type { SourceDocDef } from "@/lib/source-doc-types";

/* ---------- Constants ---------- */

const TRANSACTION_TYPES = [
  { value: "STOCK_PURCHASE", label: "Stock Purchase" },
  { value: "ASSET_PURCHASE", label: "Asset Purchase" },
  { value: "MERGER_FORWARD", label: "Forward Merger" },
  { value: "MERGER_REVERSE_TRIANGULAR", label: "Reverse Triangular Merger" },
  { value: "MERGER_FORWARD_TRIANGULAR", label: "Forward Triangular Merger" },
  { value: "REVERSE_MERGER", label: "Reverse Merger" },
  { value: "TENDER_OFFER", label: "Tender Offer" },
  { value: "SECTION_363_SALE", label: "Section 363 Sale" },
];

/* ---------- Helpers ---------- */

function formatNumber(value: string): string {
  const stripped = value.replace(/[^\d.]/g, "");
  const parts = stripped.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}
function parseNumber(value: string): number {
  return parseFloat(value.replace(/,/g, "")) || 0;
}

/* ---------- Page ---------- */

export default function NewDealPage() {
  const router = useRouter();
  const { canUpload } = useGate();
  const [submitting, setSubmitting] = useState(false);

  /* Required fields */
  const [name, setName] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [targetCompany, setTargetCompany] = useState("");

  /* Optional fields */
  const [purchasePrice, setPurchasePrice] = useState("");
  const [cashComponent, setCashComponent] = useState("");
  const [stockComponent, setStockComponent] = useState("");
  const [earnoutAmount, setEarnoutAmount] = useState("");
  const [exclusivityDays, setExclusivityDays] = useState("");
  const [dueDiligenceDays, setDueDiligenceDays] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [governingLaw, setGoverningLaw] = useState("Delaware");
  const [nonCompeteYears, setNonCompeteYears] = useState("");
  const [escrowPercent, setEscrowPercent] = useState("");

  /* Source documents & missing-docs flow */
  const [files, setFiles] = useState<File[]>([]);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [sampleDealId, setSampleDealId] = useState<string | null>(null);

  const sampleSourceDocs = sampleDealId
    ? getMASourceDocs(sampleDealId)
    : null;

  const handleLoadSample = (dealId: string) => {
    const sample = SAMPLE_MA_DEALS.find((d) => d.id === dealId);
    if (!sample) return;
    setSampleDealId(dealId);
    setName(sample.name);
    setTransactionType(sample.transactionType);
    setBuyerName(sample.buyerName);
    setSellerName(sample.sellerName);
    setTargetCompany(sample.targetCompany);
    setPurchasePrice(formatNumber(String(sample.purchasePrice)));
    setCashComponent(formatNumber(String(sample.cashComponent)));
    setStockComponent(formatNumber(String(sample.stockComponent)));
    setEarnoutAmount(formatNumber(String(sample.earnoutAmount)));
    setExclusivityDays(String(sample.exclusivityDays));
    setDueDiligenceDays(String(sample.dueDiligenceDays));
    setTargetIndustry(sample.targetIndustry);
    setGoverningLaw(sample.governingLaw);
    setNonCompeteYears(String(sample.nonCompeteYears));
    setEscrowPercent(String(sample.escrowPercent));
    toast.success("Sample deal loaded. Review the details, then submit.");
  };

  const handleClearSample = () => {
    setSampleDealId(null);
    setName("");
    setTransactionType("");
    setBuyerName("");
    setSellerName("");
    setTargetCompany("");
    setPurchasePrice("");
    setCashComponent("");
    setStockComponent("");
    setEarnoutAmount("");
    setExclusivityDays("");
    setDueDiligenceDays("");
    setTargetIndustry("");
    setGoverningLaw("Delaware");
    setNonCompeteYears("");
    setEscrowPercent("");
    setFiles([]);
  };
  const [showMissingDocs, setShowMissingDocs] = useState(false);
  const [missingRequired, setMissingRequired] = useState<SourceDocDef[]>([]);
  const [missingOptional, setMissingOptional] = useState<SourceDocDef[]>([]);

  const canSubmit =
    name.trim() &&
    transactionType &&
    buyerName.trim() &&
    sellerName.trim() &&
    targetCompany.trim();

  const doGenerate = async (projectId: string) => {
    const genRes = await fetch(`/api/ma/${projectId}/generate`, {
      method: "POST",
    });
    if (!genRes.ok) {
      toast.error("Deal created but generation failed to start. You can retry from the deal page.");
    } else {
      toast.success("Deal created! Document generation started.");
    }
    router.push(`/dashboard/deals/${projectId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sample mode: call /api/ma/sample
    if (sampleDealId) {
      if (!name.trim()) { toast.error("Project name is required"); return; }
      if (!transactionType) { toast.error("Transaction type is required"); return; }
      if (!buyerName.trim()) { toast.error("Buyer name is required"); return; }
      if (!sellerName.trim()) { toast.error("Seller name is required"); return; }
      if (!targetCompany.trim()) { toast.error("Target company is required"); return; }

      setSubmitting(true);
      try {
        const res = await fetch("/api/ma/sample", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId: sampleDealId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create sample deal");
        }
        const { project } = await res.json();
        toast.success("Sample deal created! Generating documents...");
        router.push(`/dashboard/deals/${project.id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
        setSubmitting(false);
      }
      return;
    }

    // If project already created (user came back from missing docs to add more files)
    if (createdProjectId) {
      setSubmitting(true);
      try {
        for (const file of files) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("module", "ma");
          fd.append("projectId", createdProjectId);
          await fetch("/api/source-documents/upload", { method: "POST", body: fd });
        }
        const result = await fetchMissingSourceDocs("ma", createdProjectId);
        if (result.missingRequired.length > 0 || result.missingOptional.length > 0) {
          setMissingRequired(result.missingRequired);
          setMissingOptional(result.missingOptional);
          setShowMissingDocs(true);
          setSubmitting(false);
          return;
        }
        await doGenerate(createdProjectId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
        setSubmitting(false);
      }
      return;
    }

    // Validation
    if (!name.trim()) { toast.error("Project name is required"); return; }
    if (!transactionType) { toast.error("Transaction type is required"); return; }
    if (!buyerName.trim()) { toast.error("Buyer name is required"); return; }
    if (!sellerName.trim()) { toast.error("Seller name is required"); return; }
    if (!targetCompany.trim()) { toast.error("Target company is required"); return; }

    setSubmitting(true);

    try {
      // 1. Create project
      const createRes = await fetch("/api/ma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          transactionType,
          buyerName: buyerName.trim(),
          sellerName: sellerName.trim(),
          targetCompany: targetCompany.trim(),
          purchasePrice: purchasePrice ? parseNumber(purchasePrice) : null,
          cashComponent: cashComponent ? parseNumber(cashComponent) : null,
          stockComponent: stockComponent ? parseNumber(stockComponent) : null,
          earnoutAmount: earnoutAmount ? parseNumber(earnoutAmount) : null,
          exclusivityDays: exclusivityDays ? parseInt(exclusivityDays, 10) : null,
          dueDiligenceDays: dueDiligenceDays ? parseInt(dueDiligenceDays, 10) : null,
          targetIndustry: targetIndustry.trim() || null,
          governingLaw: governingLaw.trim() || "Delaware",
          nonCompeteYears: nonCompeteYears ? parseInt(nonCompeteYears, 10) : null,
          escrowPercent: escrowPercent ? parseFloat(escrowPercent) / 100 : null,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create deal");
      }
      const { project } = await createRes.json();
      setCreatedProjectId(project.id);

      // 2. Upload files
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("module", "ma");
        fd.append("projectId", project.id);
        await fetch("/api/source-documents/upload", { method: "POST", body: fd });
      }

      // 3. Classify and check
      const result = await fetchMissingSourceDocs("ma", project.id);
      if (result.missingRequired.length > 0 || result.missingOptional.length > 0) {
        setMissingRequired(result.missingRequired);
        setMissingOptional(result.missingOptional);
        setShowMissingDocs(true);
        setSubmitting(false);
        return;
      }

      // 4. All present -> generate
      await doGenerate(project.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Back + header */}
      <div className="mb-6">
        <Link
          href="/dashboard/deals"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:-translate-x-0.5 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Deals
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Handshake className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New Deal</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enter transaction details to generate your complete M&A document
              package
            </p>
          </div>
        </div>
      </div>

      <SampleDealPicker
        deals={SAMPLE_MA_DEALS}
        onSelect={handleLoadSample}
        moduleName="M&A"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Required fields */}
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Core information about the M&A transaction. All fields marked with
              * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Name */}
              <div className="md:col-span-2">
                <Label htmlFor="name">
                  Project Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Corp Acquisition"
                  required
                  className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Transaction Type */}
              <div>
                <Label htmlFor="transactionType">
                  Transaction Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={transactionType}
                  onValueChange={setTransactionType}
                >
                  <SelectTrigger className="mt-1.5 w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Company */}
              <div>
                <Label htmlFor="targetCompany">
                  Target Company <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="targetCompany"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="Acme Corporation"
                  required
                  className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Buyer Name */}
              <div>
                <Label htmlFor="buyerName">
                  Buyer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="buyerName"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Global Holdings, Inc."
                  required
                  className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Seller Name */}
              <div>
                <Label htmlFor="sellerName">
                  Seller Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sellerName"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Smith Family Holdings, LLC"
                  required
                  className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optional fields */}
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Financial Terms</CardTitle>
            <CardDescription>
              Optional deal economics and timeline. These improve the accuracy of
              generated documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Purchase Price */}
              <div>
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="purchasePrice"
                    type="text"
                    inputMode="decimal"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(formatNumber(e.target.value))}
                    placeholder="25,000,000"
                    className="pl-7 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Cash Component */}
              <div>
                <Label htmlFor="cashComponent">Cash Component</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="cashComponent"
                    type="text"
                    inputMode="decimal"
                    value={cashComponent}
                    onChange={(e) => setCashComponent(formatNumber(e.target.value))}
                    placeholder="15,000,000"
                    className="pl-7 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Stock Component */}
              <div>
                <Label htmlFor="stockComponent">Stock Component</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="stockComponent"
                    type="text"
                    inputMode="decimal"
                    value={stockComponent}
                    onChange={(e) => setStockComponent(formatNumber(e.target.value))}
                    placeholder="10,000,000"
                    className="pl-7 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Earnout Amount */}
              <div>
                <Label htmlFor="earnoutAmount">Earnout Amount</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="earnoutAmount"
                    type="text"
                    inputMode="decimal"
                    value={earnoutAmount}
                    onChange={(e) => setEarnoutAmount(formatNumber(e.target.value))}
                    placeholder="5,000,000"
                    className="pl-7 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Exclusivity Days */}
              <div>
                <Label htmlFor="exclusivityDays">Exclusivity Period (days)</Label>
                <Input
                  id="exclusivityDays"
                  type="number"
                  value={exclusivityDays}
                  onChange={(e) => setExclusivityDays(e.target.value)}
                  placeholder="45"
                  className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  min={0}
                  step={1}
                />
              </div>

              {/* Due Diligence Days */}
              <div>
                <Label htmlFor="dueDiligenceDays">
                  Due Diligence Period (days)
                </Label>
                <Input
                  id="dueDiligenceDays"
                  type="number"
                  value={dueDiligenceDays}
                  onChange={(e) => setDueDiligenceDays(e.target.value)}
                  placeholder="60"
                  className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  min={0}
                  step={1}
                />
              </div>

              {/* Target Industry */}
              <div>
                <Label htmlFor="targetIndustry">Target Industry</Label>
                <Input
                  id="targetIndustry"
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  placeholder="Technology"
                  className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Governing Law */}
              <div>
                <Label htmlFor="governingLaw">Governing Law</Label>
                <Input
                  id="governingLaw"
                  value={governingLaw}
                  onChange={(e) => setGoverningLaw(e.target.value)}
                  placeholder="Delaware"
                  className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Non-Compete Years */}
              <div>
                <Label htmlFor="nonCompeteYears">Non-Compete (years)</Label>
                <Input
                  id="nonCompeteYears"
                  type="number"
                  value={nonCompeteYears}
                  onChange={(e) => setNonCompeteYears(e.target.value)}
                  placeholder="3"
                  className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  min={0}
                  step={1}
                />
              </div>

              {/* Escrow Percent */}
              <div>
                <Label htmlFor="escrowPercent">Escrow (%)</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="escrowPercent"
                    type="number"
                    value={escrowPercent}
                    onChange={(e) => setEscrowPercent(e.target.value)}
                    placeholder="10"
                    className="pr-8 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    min={0}
                    max={100}
                    step={0.5}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    %
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Source Documents */}
        {sampleDealId && sampleSourceDocs ? (
          <SampleSourceDocsPreview
            docs={sampleSourceDocs}
            onClear={handleClearSample}
          />
        ) : canUpload ? (
          <Card className="transition-shadow duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Source Documents</CardTitle>
              <CardDescription>
                Upload supporting documents (target financials, tax returns, contracts, etc.).
                These will be scanned and used to fill in your generated documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploader files={files} onFilesSelected={setFiles} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Lock className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Document upload requires a subscription</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Select a sample deal above to see the full pipeline in action, or subscribe to upload your own documents.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/dashboard/upgrade">View Plans</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Submit buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/deals")}
            disabled={submitting}
            className="transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !canSubmit}
            className="gap-1.5 shadow-sm transition-all duration-200"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Deal...
              </>
            ) : (
              <>
                <Handshake className="h-4 w-4" />
                Create Deal & Generate Documents
              </>
            )}
          </Button>
        </div>
      </form>

      <MissingDocsDialog
        open={showMissingDocs}
        onOpenChange={setShowMissingDocs}
        missingRequired={missingRequired}
        missingOptional={missingOptional}
        module="ma"
        projectId={createdProjectId ?? undefined}
        onUploadMissing={() => {
          setShowMissingDocs(false);
          setFiles([]);
        }}
        onContinueAnyway={() => {
          if (createdProjectId) {
            setSubmitting(true);
            doGenerate(createdProjectId);
          }
        }}
        onMissingUpdated={(req, opt) => {
          setMissingRequired(req);
          setMissingOptional(opt);
        }}
      />
    </div>
  );
}
