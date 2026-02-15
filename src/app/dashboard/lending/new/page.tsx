"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
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
import { DocumentChecklist } from "@/components/DocumentChecklist";
import { DocumentSelector } from "@/components/DocumentSelector";
import { SampleDealPicker } from "@/components/sample-deal-picker";
import { LendingSampleDocsPreview } from "@/components/sample-source-docs-preview";
import { LOAN_PROGRAM_LIST, getLoanProgram } from "@/config/loan-programs";
import { SAMPLE_LENDING_DEALS } from "@/config/sample-deals/lending";
import { getLendingExtractions } from "@/config/sample-deals/lending-extractions";

const LOAN_PURPOSES = [
  { value: "purchase", label: "Purchase" },
  { value: "refinance", label: "Refinance" },
  { value: "cash-out-refinance", label: "Cash-Out Refinance" },
  { value: "construction", label: "Construction" },
  { value: "bridge", label: "Bridge" },
];

function formatNumber(value: string): string {
  const digits = value.replace(/[^\d.]/g, "");
  const parts = digits.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
}

function parseNumber(value: string): string {
  return value.replace(/,/g, "");
}

export default function NewDealPage() {
  const router = useRouter();
  const { canUpload } = useGate();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const [borrowerName, setBorrowerName] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [loanProgramId, setLoanProgramId] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [proposedTerm, setProposedTerm] = useState("");
  const [selectedOutputDocs, setSelectedOutputDocs] = useState<string[]>([]);
  const [sampleDealId, setSampleDealId] = useState<string | null>(null);

  const selectedProgram = loanProgramId ? getLoanProgram(loanProgramId) : null;

  const sampleExtractions = sampleDealId
    ? getLendingExtractions(sampleDealId)
    : null;

  const handleLoadSample = (dealId: string) => {
    const sample = SAMPLE_LENDING_DEALS.find((d) => d.id === dealId);
    if (!sample) return;
    setSampleDealId(dealId);
    setBorrowerName(sample.borrowerName);
    setLoanAmount(formatNumber(String(sample.loanAmount)));
    setLoanPurpose(sample.loanPurpose);
    setLoanProgramId(sample.loanProgramId);
    setPropertyAddress(sample.propertyAddress);
    setProposedRate(String(sample.proposedRate));
    setProposedTerm(String(sample.proposedTerm));
    toast.success("Sample deal loaded. Review the details, then submit.");
  };

  const handleClearSample = () => {
    setSampleDealId(null);
    setBorrowerName("");
    setLoanAmount("");
    setLoanPurpose("");
    setLoanProgramId("");
    setPropertyAddress("");
    setProposedRate("");
    setProposedTerm("");
    setFiles([]);
    setSelectedOutputDocs([]);
  };

  useEffect(() => {
    if (loanProgramId) {
      const program = getLoanProgram(loanProgramId);
      if (program) {
        setSelectedOutputDocs([...program.requiredOutputDocs]);
      }
    } else {
      setSelectedOutputDocs([]);
    }
  }, [loanProgramId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!borrowerName.trim()) {
      toast.error("Borrower name is required", { duration: 8000 });
      return;
    }

    // Sample mode: call /api/deals/sample
    if (sampleDealId) {
      setSubmitting(true);
      try {
        const res = await fetch("/api/deals/sample", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId: sampleDealId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create sample deal");
        }
        const { deal } = await res.json();
        toast.success("Sample deal created! Analysis pipeline started.");
        router.push(`/dashboard/lending/${deal.id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong", { duration: 8000 });
        setSubmitting(false);
      }
      return;
    }

    // Normal mode: upload files
    if (files.length === 0) {
      toast.error("Please upload at least one document", { duration: 8000 });
      return;
    }

    setSubmitting(true);

    try {
      const dealRes = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerName: borrowerName.trim(),
          loanAmount: loanAmount ? parseFloat(parseNumber(loanAmount)) : null,
          loanPurpose: loanPurpose || null,
          loanProgramId: loanProgramId || null,
          loanType: selectedProgram?.category ?? null,
          propertyAddress: propertyAddress || null,
          proposedRate: proposedRate ? parseFloat(proposedRate) : null,
          proposedTerm: proposedTerm ? parseInt(proposedTerm, 10) : null,
          selectedOutputDocs,
        }),
      });

      if (!dealRes.ok) {
        const err = await dealRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create deal");
      }

      const { deal } = await dealRes.json();
      const createdDealId = deal.id;

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("dealId", createdDealId);

        const uploadRes = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.error || `Failed to upload ${file.name}`);
        }
      }

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: createdDealId }),
      });

      if (!analyzeRes.ok) {
        toast.error(
          "Documents uploaded but analysis failed to start. You can retry from the deal page.",
          { duration: 8000 }
        );
      } else {
        toast.success("Deal created! Analysis pipeline started.");
      }

      router.push(`/dashboard/lending/${createdDealId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong", { duration: 8000 });
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/lending"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-x-0.5 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Deals
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New Deal</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Enter borrower details and upload documents to begin credit analysis
        </p>
      </div>

      <SampleDealPicker
        deals={SAMPLE_LENDING_DEALS}
        onSelect={handleLoadSample}
        moduleName="lending"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Deal Information</CardTitle>
            <CardDescription>
              Basic loan details for the credit analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="borrowerName">
                  Borrower Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="borrowerName"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="John Smith"
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="loanAmount">Loan Amount</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="loanAmount"
                    type="text"
                    inputMode="decimal"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(formatNumber(e.target.value))}
                    placeholder="500,000"
                    className="pl-7"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="loanPurpose">Loan Purpose</Label>
                <Select value={loanPurpose} onValueChange={setLoanPurpose}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_PURPOSES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="loanProgram">Loan Program</Label>
                <Select value={loanProgramId} onValueChange={setLoanProgramId}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select loan program" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_PROGRAM_LIST.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProgram && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedProgram.description}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="propertyAddress">Property Address</Label>
                <Input
                  id="propertyAddress"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  placeholder="123 Main St, City, ST 12345"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="proposedRate">Proposed Rate (%)</Label>
                <Input
                  id="proposedRate"
                  type="number"
                  value={proposedRate}
                  onChange={(e) => setProposedRate(e.target.value)}
                  placeholder="7.25"
                  className="mt-1.5"
                  min={0}
                  max={100}
                  step={0.01}
                />
              </div>

              <div>
                <Label htmlFor="proposedTerm">Proposed Term (months)</Label>
                <Input
                  id="proposedTerm"
                  type="number"
                  value={proposedTerm}
                  onChange={(e) => setProposedTerm(e.target.value)}
                  placeholder="360"
                  className="mt-1.5"
                  min={1}
                  step={1}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {sampleDealId && sampleExtractions ? (
          <LendingSampleDocsPreview
            documents={sampleExtractions.documents}
            onClear={handleClearSample}
          />
        ) : canUpload ? (
          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>
                Upload borrower financial documents for AI-powered extraction and
                analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <DocumentUploader files={files} onFilesSelected={setFiles} />
                </div>
                <div className="lg:col-span-1 space-y-6">
                  <DocumentChecklist
                    loanProgramId={loanProgramId}
                    uploadedDocTypes={[]}
                  />
                  <DocumentSelector
                    loanProgramId={loanProgramId}
                    selectedDocs={selectedOutputDocs}
                    onSelectionChange={setSelectedOutputDocs}
                  />
                </div>
              </div>
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

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Deal...
              </>
            ) : (
              "Create Deal & Start Analysis"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
