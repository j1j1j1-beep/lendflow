"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { SourceDocDef } from "@/lib/source-doc-types";

const FUND_TYPES = [
  { value: "PRIVATE_EQUITY", label: "Private Equity" },
  { value: "VENTURE_CAPITAL", label: "Venture Capital" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "HEDGE_FUND", label: "Hedge Fund" },
  { value: "CREDIT", label: "Credit" },
  { value: "INFRASTRUCTURE", label: "Infrastructure" },
];

const EXEMPTION_TYPES = [
  { value: "REG_D_506B", label: "Reg D 506(b)" },
  { value: "REG_D_506C", label: "Reg D 506(c)" },
  { value: "REG_A_TIER1", label: "Reg A Tier 1" },
  { value: "REG_A_TIER2", label: "Reg A Tier 2" },
  { value: "REG_CF", label: "Reg CF" },
];

function formatNumber(value: string): string {
  const stripped = value.replace(/[^\d.]/g, "");
  const parts = stripped.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}
function parseNumber(value: string): number {
  return parseFloat(value.replace(/,/g, "")) || 0;
}

export default function NewCapitalPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Required fields
  const [name, setName] = useState("");
  const [fundName, setFundName] = useState("");
  const [fundType, setFundType] = useState("");
  const [gpEntityName, setGpEntityName] = useState("");

  // Optional fields
  const [exemptionType, setExemptionType] = useState("");
  const [targetRaise, setTargetRaise] = useState("");
  const [minInvestment, setMinInvestment] = useState("");
  const [managementFee, setManagementFee] = useState("");
  const [carriedInterest, setCarriedInterest] = useState("");
  const [preferredReturn, setPreferredReturn] = useState("");
  const [fundTermYears, setFundTermYears] = useState("");
  const [investmentStrategy, setInvestmentStrategy] = useState("");
  const [geographicFocus, setGeographicFocus] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [showMissingDocs, setShowMissingDocs] = useState(false);
  const [missingRequired, setMissingRequired] = useState<SourceDocDef[]>([]);
  const [missingOptional, setMissingOptional] = useState<SourceDocDef[]>([]);

  const doGenerate = async (projectId: string) => {
    const genRes = await fetch(`/api/capital/${projectId}/generate`, {
      method: "POST",
    });
    if (!genRes.ok) {
      toast.error("Project created but generation failed to start. You can retry from the deal page.");
    } else {
      toast.success("Fund created! Document generation started.");
    }
    router.push(`/dashboard/capital/${projectId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If we already created the project (user came back from missing docs dialog to add more files)
    // just re-upload new files, re-classify, and check again
    if (createdProjectId) {
      setSubmitting(true);
      try {
        // Upload any new files
        for (const file of files) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("module", "capital");
          fd.append("projectId", createdProjectId);
          await fetch("/api/source-documents/upload", { method: "POST", body: fd });
        }

        // Re-classify and check
        const result = await fetchMissingSourceDocs("capital", createdProjectId);
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
    if (!fundName.trim()) { toast.error("Fund name is required"); return; }
    if (!fundType) { toast.error("Fund type is required"); return; }
    if (!gpEntityName.trim()) { toast.error("GP entity name is required"); return; }

    setSubmitting(true);

    try {
      // 1. Build body
      const body: Record<string, unknown> = {
        name: name.trim(),
        fundName: fundName.trim(),
        fundType,
        gpEntityName: gpEntityName.trim(),
      };
      if (exemptionType) body.exemptionType = exemptionType;
      if (targetRaise) body.targetRaise = parseNumber(targetRaise);
      if (minInvestment) body.minInvestment = parseNumber(minInvestment);
      if (managementFee) body.managementFee = parseFloat(managementFee) / 100;
      if (carriedInterest) body.carriedInterest = parseFloat(carriedInterest) / 100;
      if (preferredReturn) body.preferredReturn = parseFloat(preferredReturn) / 100;
      if (fundTermYears) body.fundTermYears = parseInt(fundTermYears, 10);
      if (investmentStrategy.trim()) body.investmentStrategy = investmentStrategy.trim();
      if (geographicFocus.trim()) body.geographicFocus = geographicFocus.trim();

      // 2. Create project
      const createRes = await fetch("/api/capital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create project");
      }
      const { project } = await createRes.json();
      setCreatedProjectId(project.id);

      // 3. Upload files
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("module", "capital");
        fd.append("projectId", project.id);
        await fetch("/api/source-documents/upload", { method: "POST", body: fd });
      }

      // 4. Classify and check for missing docs
      const result = await fetchMissingSourceDocs("capital", project.id);
      if (result.missingRequired.length > 0 || result.missingOptional.length > 0) {
        setMissingRequired(result.missingRequired);
        setMissingOptional(result.missingOptional);
        setShowMissingDocs(true);
        setSubmitting(false);
        return;
      }

      // 5. All docs present → generate
      await doGenerate(project.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/capital"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-x-0.5 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Capital
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New Fund</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Enter fund details to generate your complete capital formation package
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Required Fields */}
        <Card className="transition-all duration-200 hover:shadow-sm">
          <CardHeader>
            <CardTitle>Fund Information</CardTitle>
            <CardDescription>
              Core details for the capital formation documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">
                  Project Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Fund III Capital Raise"
                  required
                  className="mt-1.5 transition-all duration-200 focus:shadow-sm"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="fundName">
                  Fund Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fundName"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  placeholder="Acme Capital Partners III, L.P."
                  required
                  className="mt-1.5 transition-all duration-200 focus:shadow-sm"
                />
              </div>

              <div>
                <Label htmlFor="fundType">
                  Fund Type <span className="text-destructive">*</span>
                </Label>
                <Select value={fundType} onValueChange={setFundType}>
                  <SelectTrigger className="mt-1.5 w-full transition-all duration-200">
                    <SelectValue placeholder="Select fund type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUND_TYPES.map((ft) => (
                      <SelectItem key={ft.value} value={ft.value}>
                        {ft.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gpEntityName">
                  GP Entity Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="gpEntityName"
                  value={gpEntityName}
                  onChange={(e) => setGpEntityName(e.target.value)}
                  placeholder="Acme Capital Management, LLC"
                  required
                  className="mt-1.5 transition-all duration-200 focus:shadow-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optional Fields */}
        <Card className="transition-all duration-200 hover:shadow-sm">
          <CardHeader>
            <CardTitle>Fund Terms & Structure</CardTitle>
            <CardDescription>
              Optional details for more accurate document generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exemptionType">Exemption Type</Label>
                <Select value={exemptionType} onValueChange={setExemptionType}>
                  <SelectTrigger className="mt-1.5 w-full transition-all duration-200">
                    <SelectValue placeholder="Select exemption" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXEMPTION_TYPES.map((et) => (
                      <SelectItem key={et.value} value={et.value}>
                        {et.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fundTermYears">Fund Term (years)</Label>
                <Input
                  id="fundTermYears"
                  type="number"
                  value={fundTermYears}
                  onChange={(e) => setFundTermYears(e.target.value)}
                  placeholder="10"
                  className="mt-1.5 transition-all duration-200 focus:shadow-sm"
                  min={1}
                  step={1}
                />
              </div>

              <div>
                <Label htmlFor="targetRaise">Target Raise</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="targetRaise"
                    type="text"
                    inputMode="decimal"
                    value={targetRaise}
                    onChange={(e) => setTargetRaise(formatNumber(e.target.value))}
                    placeholder="50,000,000"
                    className="pl-7 transition-all duration-200 focus:shadow-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="minInvestment">Minimum Investment</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="minInvestment"
                    type="text"
                    inputMode="decimal"
                    value={minInvestment}
                    onChange={(e) => setMinInvestment(formatNumber(e.target.value))}
                    placeholder="250,000"
                    className="pl-7 transition-all duration-200 focus:shadow-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="managementFee">Management Fee (%)</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="managementFee"
                    type="number"
                    value={managementFee}
                    onChange={(e) => setManagementFee(e.target.value)}
                    placeholder="2.0"
                    className="pr-8 transition-all duration-200 focus:shadow-sm"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    %
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="carriedInterest">Carried Interest (%)</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="carriedInterest"
                    type="number"
                    value={carriedInterest}
                    onChange={(e) => setCarriedInterest(e.target.value)}
                    placeholder="20.0"
                    className="pr-8 transition-all duration-200 focus:shadow-sm"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    %
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="preferredReturn">Preferred Return (%)</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="preferredReturn"
                    type="number"
                    value={preferredReturn}
                    onChange={(e) => setPreferredReturn(e.target.value)}
                    placeholder="8.0"
                    className="pr-8 transition-all duration-200 focus:shadow-sm"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    %
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="geographicFocus">Geographic Focus</Label>
                <Input
                  id="geographicFocus"
                  value={geographicFocus}
                  onChange={(e) => setGeographicFocus(e.target.value)}
                  placeholder="United States"
                  className="mt-1.5 transition-all duration-200 focus:shadow-sm"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="investmentStrategy">Investment Strategy</Label>
                <Textarea
                  id="investmentStrategy"
                  value={investmentStrategy}
                  onChange={(e) => setInvestmentStrategy(e.target.value)}
                  placeholder="Growth equity investments in mid-market technology companies..."
                  rows={3}
                  className="mt-1.5 resize-none transition-all duration-200 focus:shadow-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Source Documents */}
        <Card className="transition-all duration-200 hover:shadow-sm">
          <CardHeader>
            <CardTitle>Source Documents</CardTitle>
            <CardDescription>
              Upload supporting documents (business plan, formation docs, etc.).
              These will be scanned and used to fill in your generated documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUploader files={files} onFilesSelected={setFiles} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/capital")}
            disabled={submitting}
            className="transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="transition-all duration-200 hover:shadow-md"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Fund...
              </>
            ) : (
              "Create Fund & Generate Documents"
            )}
          </Button>
        </div>
      </form>

      <MissingDocsDialog
        open={showMissingDocs}
        onOpenChange={setShowMissingDocs}
        missingRequired={missingRequired}
        missingOptional={missingOptional}
        module="capital"
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
