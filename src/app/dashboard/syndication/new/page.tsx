"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Building,
  DollarSign,
  Percent,
  MapPin,
} from "lucide-react";
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
import type { SourceDocDef } from "@/lib/source-doc-types";

/* ---------- Constants ---------- */

const PROPERTY_TYPES = [
  { value: "MULTIFAMILY", label: "Multifamily" },
  { value: "OFFICE", label: "Office" },
  { value: "RETAIL", label: "Retail" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "MIXED_USE", label: "Mixed Use" },
  { value: "SELF_STORAGE", label: "Self Storage" },
  { value: "MOBILE_HOME_PARK", label: "Mobile Home Park" },
  { value: "HOTEL", label: "Hotel" },
  { value: "NNN_RETAIL", label: "NNN Retail" },
  { value: "SENIOR_HOUSING", label: "Senior Housing" },
  { value: "STUDENT_HOUSING", label: "Student Housing" },
  { value: "BUILD_TO_RENT", label: "Build to Rent" },
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

/* ---------- Component ---------- */

export default function NewSyndicationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Required fields
  const [name, setName] = useState("");
  const [entityName, setEntityName] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");

  // Optional deal economics
  const [purchasePrice, setPurchasePrice] = useState("");
  const [totalEquityRaise, setTotalEquityRaise] = useState("");
  const [minInvestment, setMinInvestment] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [preferredReturn, setPreferredReturn] = useState("");
  const [projectedIrr, setProjectedIrr] = useState("");
  const [projectedHoldYears, setProjectedHoldYears] = useState("");
  const [acquisitionFee, setAcquisitionFee] = useState("");
  const [assetMgmtFee, setAssetMgmtFee] = useState("");
  const [units, setUnits] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");

  // Source documents & missing-docs dialog
  const [files, setFiles] = useState<File[]>([]);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [showMissingDocs, setShowMissingDocs] = useState(false);
  const [missingRequired, setMissingRequired] = useState<SourceDocDef[]>([]);
  const [missingOptional, setMissingOptional] = useState<SourceDocDef[]>([]);

  const doGenerate = async (projectId: string) => {
    const genRes = await fetch(`/api/syndication/${projectId}/generate`, {
      method: "POST",
    });
    if (!genRes.ok) {
      toast.error("Project created but generation failed to start. You can retry from the deal page.");
    } else {
      toast.success("Syndication created! Document generation started.");
    }
    router.push(`/dashboard/syndication/${projectId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (createdProjectId) {
      setSubmitting(true);
      try {
        for (const file of files) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("module", "syndication");
          fd.append("projectId", createdProjectId);
          await fetch("/api/source-documents/upload", { method: "POST", body: fd });
        }
        const result = await fetchMissingSourceDocs("syndication", createdProjectId);
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
    if (!entityName.trim()) { toast.error("SPV entity name is required"); return; }
    if (!sponsorName.trim()) { toast.error("Sponsor name is required"); return; }
    if (!propertyAddress.trim()) { toast.error("Property address is required"); return; }
    if (!propertyType) { toast.error("Property type is required"); return; }

    setSubmitting(true);

    try {
      const createRes = await fetch("/api/syndication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          entityName: entityName.trim(),
          sponsorName: sponsorName.trim(),
          propertyAddress: propertyAddress.trim(),
          propertyType,
          purchasePrice: purchasePrice ? parseNumber(purchasePrice) : null,
          totalEquityRaise: totalEquityRaise ? parseNumber(totalEquityRaise) : null,
          minInvestment: minInvestment ? parseNumber(minInvestment) : null,
          loanAmount: loanAmount ? parseNumber(loanAmount) : null,
          interestRate: interestRate ? parseFloat(interestRate) / 100 : null,
          preferredReturn: preferredReturn ? parseFloat(preferredReturn) / 100 : null,
          projectedIrr: projectedIrr ? parseFloat(projectedIrr) / 100 : null,
          projectedHoldYears: projectedHoldYears ? parseInt(projectedHoldYears, 10) : null,
          acquisitionFee: acquisitionFee ? parseFloat(acquisitionFee) / 100 : null,
          assetMgmtFee: assetMgmtFee ? parseFloat(assetMgmtFee) / 100 : null,
          units: units ? parseInt(units, 10) : null,
          yearBuilt: yearBuilt ? parseInt(yearBuilt, 10) : null,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create syndication project");
      }
      const { project } = await createRes.json();
      setCreatedProjectId(project.id);

      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("module", "syndication");
        fd.append("projectId", project.id);
        await fetch("/api/source-documents/upload", { method: "POST", body: fd });
      }

      const result = await fetchMissingSourceDocs("syndication", project.id);
      if (result.missingRequired.length > 0 || result.missingOptional.length > 0) {
        setMissingRequired(result.missingRequired);
        setMissingOptional(result.missingOptional);
        setShowMissingDocs(true);
        setSubmitting(false);
        return;
      }

      await doGenerate(project.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/syndication"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-x-0.5 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Syndication
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          New Syndication
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Enter property and deal details to generate your complete syndication
          package
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Property & Entity Details */}
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Property & Entity Details
            </CardTitle>
            <CardDescription>
              Required information for the syndication entity and property
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
                  placeholder="Oak Park Apartments Fund"
                  required
                  className="mt-1.5 transition-shadow duration-150 focus:shadow-sm"
                />
              </div>

              {/* Entity Name */}
              <div>
                <Label htmlFor="entityName">
                  SPV Entity Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="entityName"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="Oak Park Investors, LLC"
                  required
                  className="mt-1.5 transition-shadow duration-150 focus:shadow-sm"
                />
              </div>

              {/* Sponsor Name */}
              <div>
                <Label htmlFor="sponsorName">
                  Sponsor Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sponsorName"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="Acme Realty Partners"
                  required
                  className="mt-1.5 transition-shadow duration-150 focus:shadow-sm"
                />
              </div>

              {/* Property Address */}
              <div className="md:col-span-2">
                <Label htmlFor="propertyAddress">
                  Property Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="propertyAddress"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    placeholder="123 Oak Park Dr, Austin, TX 78701"
                    required
                    className="pl-9 transition-shadow duration-150 focus:shadow-sm"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="md:col-span-2">
                <Label htmlFor="propertyType">
                  Property Type <span className="text-destructive">*</span>
                </Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="mt-1.5 w-full transition-shadow duration-150 focus:shadow-sm">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>
                        {pt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Deal Economics */}
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Deal Economics
            </CardTitle>
            <CardDescription>
              Optional financial details for the syndication offering
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
                    placeholder="12,500,000"
                    className="pl-7 transition-shadow duration-150 focus:shadow-sm"
                  />
                </div>
              </div>

              {/* Total Equity Raise */}
              <div>
                <Label htmlFor="totalEquityRaise">Total Equity Raise</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="totalEquityRaise"
                    type="text"
                    inputMode="decimal"
                    value={totalEquityRaise}
                    onChange={(e) => setTotalEquityRaise(formatNumber(e.target.value))}
                    placeholder="4,000,000"
                    className="pl-7 transition-shadow duration-150 focus:shadow-sm"
                  />
                </div>
              </div>

              {/* Min Investment */}
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
                    placeholder="50,000"
                    className="pl-7 transition-shadow duration-150 focus:shadow-sm"
                  />
                </div>
              </div>

              {/* Loan Amount */}
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
                    placeholder="8,500,000"
                    className="pl-7 transition-shadow duration-150 focus:shadow-sm"
                  />
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <Label htmlFor="interestRate">Interest Rate</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="interestRate"
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="5.5"
                    className="pr-8 transition-shadow duration-150 focus:shadow-sm"
                    min={0}
                    max={100}
                    step={0.01}
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Preferred Return */}
              <div>
                <Label htmlFor="preferredReturn">Preferred Return</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="preferredReturn"
                    type="number"
                    value={preferredReturn}
                    onChange={(e) => setPreferredReturn(e.target.value)}
                    placeholder="8.0"
                    className="pr-8 transition-shadow duration-150 focus:shadow-sm"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Projected IRR */}
              <div>
                <Label htmlFor="projectedIrr">Projected IRR</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="projectedIrr"
                    type="number"
                    value={projectedIrr}
                    onChange={(e) => setProjectedIrr(e.target.value)}
                    placeholder="18.0"
                    className="pr-8 transition-shadow duration-150 focus:shadow-sm"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Projected Hold Years */}
              <div>
                <Label htmlFor="projectedHoldYears">
                  Projected Hold Period (years)
                </Label>
                <Input
                  id="projectedHoldYears"
                  type="number"
                  value={projectedHoldYears}
                  onChange={(e) => setProjectedHoldYears(e.target.value)}
                  placeholder="5"
                  className="mt-1.5 transition-shadow duration-150 focus:shadow-sm"
                  min={1}
                  max={30}
                  step={1}
                />
              </div>

              {/* Acquisition Fee */}
              <div>
                <Label htmlFor="acquisitionFee">Acquisition Fee</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="acquisitionFee"
                    type="number"
                    value={acquisitionFee}
                    onChange={(e) => setAcquisitionFee(e.target.value)}
                    placeholder="2.0"
                    className="pr-8 transition-shadow duration-150 focus:shadow-sm"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Asset Mgmt Fee */}
              <div>
                <Label htmlFor="assetMgmtFee">Asset Management Fee</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="assetMgmtFee"
                    type="number"
                    value={assetMgmtFee}
                    onChange={(e) => setAssetMgmtFee(e.target.value)}
                    placeholder="1.5"
                    className="pr-8 transition-shadow duration-150 focus:shadow-sm"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Units */}
              <div>
                <Label htmlFor="units">Units</Label>
                <Input
                  id="units"
                  type="number"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  placeholder="200"
                  className="mt-1.5 transition-shadow duration-150 focus:shadow-sm"
                  min={0}
                  step={1}
                />
              </div>

              {/* Year Built */}
              <div>
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  placeholder="1985"
                  className="mt-1.5 transition-shadow duration-150 focus:shadow-sm"
                  min={1800}
                  max={2030}
                  step={1}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Source Documents */}
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Source Documents</CardTitle>
            <CardDescription>
              Upload supporting documents (appraisal, rent roll, property financials, etc.).
              These will be scanned and used to fill in your generated documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUploader files={files} onFilesSelected={setFiles} />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/syndication")}
            disabled={submitting}
            className="transition-all duration-150"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="shadow-sm transition-all duration-150"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Project...
              </>
            ) : (
              "Create & Generate Documents"
            )}
          </Button>
        </div>
      </form>

      <MissingDocsDialog
        open={showMissingDocs}
        onOpenChange={setShowMissingDocs}
        missingRequired={missingRequired}
        missingOptional={missingOptional}
        module="syndication"
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
