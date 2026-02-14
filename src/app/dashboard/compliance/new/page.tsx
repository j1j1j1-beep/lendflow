"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
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
import { SampleDealPicker } from "@/components/sample-deal-picker";
import { SampleSourceDocsPreview } from "@/components/sample-source-docs-preview";
import { SAMPLE_COMPLIANCE_DEALS } from "@/config/sample-deals/compliance";
import { getComplianceSourceDocs } from "@/config/sample-deals/source-docs/compliance-source-docs";
import type { SourceDocDef } from "@/lib/source-doc-types";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REPORT_TYPES = [
  { value: "LP_QUARTERLY_REPORT", label: "LP Quarterly Report" },
  { value: "CAPITAL_CALL_NOTICE", label: "Capital Call Notice" },
  { value: "DISTRIBUTION_NOTICE", label: "Distribution Notice" },
  { value: "K1_SUMMARY", label: "K-1 Summary" },
  { value: "ANNUAL_REPORT", label: "Annual Report" },
  { value: "FORM_ADV_SUMMARY", label: "Form ADV Summary" },
] as const;

const FUND_TYPES = [
  { value: "PRIVATE_EQUITY", label: "Private Equity" },
  { value: "VENTURE_CAPITAL", label: "Venture Capital" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "HEDGE_FUND", label: "Hedge Fund" },
  { value: "CREDIT", label: "Credit" },
  { value: "INFRASTRUCTURE", label: "Infrastructure" },
] as const;

const DISTRIBUTION_TYPES = [
  { value: "return_of_capital", label: "Return of Capital" },
  { value: "income", label: "Income" },
  { value: "gain", label: "Capital Gain" },
] as const;

/* Report types that show performance / NAV fields */
const PERFORMANCE_TYPES = new Set(["LP_QUARTERLY_REPORT", "ANNUAL_REPORT"]);

/* ------------------------------------------------------------------ */
/*  Number formatting helpers                                          */
/* ------------------------------------------------------------------ */

function formatNumber(value: string): string {
  const stripped = value.replace(/[^\d.]/g, "");
  const parts = stripped.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}
function parseNumber(value: string): number {
  return parseFloat(value.replace(/,/g, "")) || 0;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function NewComplianceReportPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  /* Required */
  const [name, setName] = useState("");
  const [reportType, setReportType] = useState("");
  const [fundName, setFundName] = useState("");

  /* Shared optional */
  const [fundType, setFundType] = useState("");
  const [reportingQuarter, setReportingQuarter] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  /* LP Report / Annual Report */
  const [nav, setNav] = useState("");
  const [totalContributions, setTotalContributions] = useState("");
  const [totalDistributions, setTotalDistributions] = useState("");
  const [netIrr, setNetIrr] = useState("");
  const [moic, setMoic] = useState("");

  /* Capital Call */
  const [callAmount, setCallAmount] = useState("");
  const [callDueDate, setCallDueDate] = useState("");
  const [callPurpose, setCallPurpose] = useState("");

  /* Distribution */
  const [distributionAmount, setDistributionAmount] = useState("");
  const [distributionType, setDistributionType] = useState("");

  /* K-1 */
  const [taxYear, setTaxYear] = useState("");
  const [filingDeadline, setFilingDeadline] = useState("");

  /* Source docs & missing-docs dialog */
  const [files, setFiles] = useState<File[]>([]);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [sampleDealId, setSampleDealId] = useState<string | null>(null);

  const sampleSourceDocs = sampleDealId
    ? getComplianceSourceDocs(sampleDealId)
    : null;

  const handleLoadSample = (dealId: string) => {
    const sample = SAMPLE_COMPLIANCE_DEALS.find((d) => d.id === dealId);
    if (!sample) return;
    setSampleDealId(dealId);
    setName(sample.name);
    setReportType(sample.reportType);
    setFundName(sample.fundName);
    setFundType(sample.fundType);
    setReportingQuarter(sample.reportingQuarter);
    setPeriodStart(sample.periodStart);
    setPeriodEnd(sample.periodEnd);
    // Performance fields
    if (sample.nav) setNav(formatNumber(String(sample.nav)));
    if (sample.totalContributions) setTotalContributions(formatNumber(String(sample.totalContributions)));
    if (sample.totalDistributions) setTotalDistributions(formatNumber(String(sample.totalDistributions)));
    if (sample.netIrr) setNetIrr(String(sample.netIrr));
    if (sample.moic) setMoic(String(sample.moic));
    // Capital call fields
    if (sample.callAmount) setCallAmount(formatNumber(String(sample.callAmount)));
    if (sample.callDueDate) setCallDueDate(sample.callDueDate);
    if (sample.callPurpose) setCallPurpose(sample.callPurpose);
    // Distribution fields
    if (sample.distributionAmount) setDistributionAmount(formatNumber(String(sample.distributionAmount)));
    if (sample.distributionType) setDistributionType(sample.distributionType);
    // K-1 fields
    if (sample.taxYear) setTaxYear(String(sample.taxYear));
    if (sample.filingDeadline) setFilingDeadline(sample.filingDeadline);
    toast.success("Sample report loaded. Review the details, then submit.");
  };

  const handleClearSample = () => {
    setSampleDealId(null);
    setName("");
    setReportType("");
    setFundName("");
    setFundType("");
    setReportingQuarter("");
    setPeriodStart("");
    setPeriodEnd("");
    setNav("");
    setTotalContributions("");
    setTotalDistributions("");
    setNetIrr("");
    setMoic("");
    setCallAmount("");
    setCallDueDate("");
    setCallPurpose("");
    setDistributionAmount("");
    setDistributionType("");
    setTaxYear("");
    setFilingDeadline("");
    setFiles([]);
  };
  const [showMissingDocs, setShowMissingDocs] = useState(false);
  const [missingRequired, setMissingRequired] = useState<SourceDocDef[]>([]);
  const [missingOptional, setMissingOptional] = useState<SourceDocDef[]>([]);

  /* ---------- Conditional visibility ---------- */

  const showPerformance = PERFORMANCE_TYPES.has(reportType);
  const showCapitalCall = reportType === "CAPITAL_CALL_NOTICE";
  const showDistribution = reportType === "DISTRIBUTION_NOTICE";
  const showK1 = reportType === "K1_SUMMARY";

  /* ---------- Submit ---------- */

  const doGenerate = async (projectId: string) => {
    const genRes = await fetch(`/api/compliance/${projectId}/generate`, {
      method: "POST",
    });
    if (!genRes.ok) {
      toast.error("Report created but generation failed to start. You can retry from the report page.");
    } else {
      toast.success("Report created! Document generation started.");
    }
    router.push(`/dashboard/compliance/${projectId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sample mode: call /api/compliance/sample
    if (sampleDealId) {
      if (!name.trim()) { toast.error("Report name is required"); return; }
      if (!reportType) { toast.error("Please select a report type"); return; }
      if (!fundName.trim()) { toast.error("Fund name is required"); return; }

      setSubmitting(true);
      try {
        const res = await fetch("/api/compliance/sample", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId: sampleDealId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create sample report");
        }
        const { project } = await res.json();
        toast.success("Sample report created! Generating documents...");
        router.push(`/dashboard/compliance/${project.id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
        setSubmitting(false);
      }
      return;
    }

    if (createdProjectId) {
      setSubmitting(true);
      try {
        for (const file of files) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("module", "compliance");
          fd.append("projectId", createdProjectId);
          await fetch("/api/source-documents/upload", { method: "POST", body: fd });
        }
        const result = await fetchMissingSourceDocs("compliance", createdProjectId);
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
    if (!name.trim()) { toast.error("Report name is required"); return; }
    if (!reportType) { toast.error("Please select a report type"); return; }
    if (!fundName.trim()) { toast.error("Fund name is required"); return; }

    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        reportType,
        fundName: fundName.trim(),
      };
      if (fundType) body.fundType = fundType;
      if (reportingQuarter.trim()) body.reportingQuarter = reportingQuarter.trim();
      if (periodStart) body.periodStart = periodStart;
      if (periodEnd) body.periodEnd = periodEnd;

      if (showPerformance) {
        if (nav) body.nav = parseNumber(nav);
        if (totalContributions) body.totalContributions = parseNumber(totalContributions);
        if (totalDistributions) body.totalDistributions = parseNumber(totalDistributions);
        if (netIrr) body.netIrr = parseFloat(netIrr) / 100;
        if (moic) body.moic = parseFloat(moic);
      }
      if (showCapitalCall) {
        if (callAmount) body.callAmount = parseNumber(callAmount);
        if (callDueDate) body.callDueDate = callDueDate;
        if (callPurpose.trim()) body.callPurpose = callPurpose.trim();
      }
      if (showDistribution) {
        if (distributionAmount) body.distributionAmount = parseNumber(distributionAmount);
        if (distributionType) body.distributionType = distributionType;
      }
      if (showK1) {
        if (taxYear) body.taxYear = parseInt(taxYear, 10);
        if (filingDeadline) body.filingDeadline = filingDeadline;
      }

      const createRes = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create report");
      }
      const { project } = await createRes.json();
      setCreatedProjectId(project.id);

      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("module", "compliance");
        fd.append("projectId", project.id);
        await fetch("/api/source-documents/upload", { method: "POST", body: fd });
      }

      const result = await fetchMissingSourceDocs("compliance", project.id);
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

  /* ---------- Render ---------- */

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Back + Title */}
      <div className="mb-6">
        <Link
          href="/dashboard/compliance"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-x-0.5 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Compliance
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select a report type and enter fund details to generate compliance
          documentation
        </p>
      </div>

      <SampleDealPicker
        deals={SAMPLE_COMPLIANCE_DEALS}
        onSelect={handleLoadSample}
        moduleName="compliance"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* -------------------------------------------------------- */}
        {/*  Core Information                                         */}
        {/* -------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Report Details
            </CardTitle>
            <CardDescription>
              Choose the document type and provide fund information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="md:col-span-2">
                <Label htmlFor="name">
                  Report Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Q4 2025 LP Report"
                  required
                  className="mt-1.5"
                />
              </div>

              {/* Report Type */}
              <div>
                <Label htmlFor="reportType">
                  Report Type <span className="text-destructive">*</span>
                </Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>
                        {rt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fund Name */}
              <div>
                <Label htmlFor="fundName">
                  Fund Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fundName"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  placeholder="Acme Capital Partners III, L.P."
                  required
                  className="mt-1.5"
                />
              </div>

              {/* Fund Type */}
              <div>
                <Label htmlFor="fundType">Fund Type</Label>
                <Select value={fundType} onValueChange={setFundType}>
                  <SelectTrigger className="mt-1.5 w-full">
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

              {/* Reporting Quarter */}
              <div>
                <Label htmlFor="reportingQuarter">Reporting Quarter</Label>
                <Input
                  id="reportingQuarter"
                  value={reportingQuarter}
                  onChange={(e) => setReportingQuarter(e.target.value)}
                  placeholder="Q4 2025"
                  className="mt-1.5"
                />
              </div>

              {/* Period Start */}
              <div>
                <Label htmlFor="periodStart">Period Start</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {/* Period End */}
              <div>
                <Label htmlFor="periodEnd">Period End</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* -------------------------------------------------------- */}
        {/*  Performance Fields (LP Report / Annual Report)           */}
        {/* -------------------------------------------------------- */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            showPerformance
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
          }`}
        >
          <div className="overflow-hidden">
            <Card>
              <CardHeader>
                <CardTitle>Fund Performance</CardTitle>
                <CardDescription>
                  Key financial metrics for the reporting period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* NAV */}
                  <div>
                    <Label htmlFor="nav">Net Asset Value</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <Input
                        id="nav"
                        type="text"
                        inputMode="decimal"
                        value={nav}
                        onChange={(e) => setNav(formatNumber(e.target.value))}
                        placeholder="150,000,000"
                        className="pl-7"
                      />
                    </div>
                  </div>

                  {/* Total Contributions */}
                  <div>
                    <Label htmlFor="totalContributions">
                      Total Contributions
                    </Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <Input
                        id="totalContributions"
                        type="text"
                        inputMode="decimal"
                        value={totalContributions}
                        onChange={(e) => setTotalContributions(formatNumber(e.target.value))}
                        placeholder="100,000,000"
                        className="pl-7"
                      />
                    </div>
                  </div>

                  {/* Total Distributions */}
                  <div>
                    <Label htmlFor="totalDistributions">
                      Total Distributions
                    </Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <Input
                        id="totalDistributions"
                        type="text"
                        inputMode="decimal"
                        value={totalDistributions}
                        onChange={(e) => setTotalDistributions(formatNumber(e.target.value))}
                        placeholder="45,000,000"
                        className="pl-7"
                      />
                    </div>
                  </div>

                  {/* Net IRR */}
                  <div>
                    <Label htmlFor="netIrr">Net IRR (%)</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="netIrr"
                        type="number"
                        value={netIrr}
                        onChange={(e) => setNetIrr(e.target.value)}
                        placeholder="18.5"
                        className="pr-8"
                        min={-100}
                        max={1000}
                        step={0.1}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        %
                      </span>
                    </div>
                  </div>

                  {/* MOIC */}
                  <div>
                    <Label htmlFor="moic">MOIC</Label>
                    <Input
                      id="moic"
                      type="number"
                      value={moic}
                      onChange={(e) => setMoic(e.target.value)}
                      placeholder="1.45"
                      className="mt-1.5"
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/*  Capital Call Fields                                       */}
        {/* -------------------------------------------------------- */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            showCapitalCall
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
          }`}
        >
          <div className="overflow-hidden">
            <Card>
              <CardHeader>
                <CardTitle>Capital Call Details</CardTitle>
                <CardDescription>
                  Specify the call amount, due date, and purpose
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Call Amount */}
                  <div>
                    <Label htmlFor="callAmount">Call Amount</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <Input
                        id="callAmount"
                        type="text"
                        inputMode="decimal"
                        value={callAmount}
                        onChange={(e) => setCallAmount(formatNumber(e.target.value))}
                        placeholder="5,000,000"
                        className="pl-7"
                      />
                    </div>
                  </div>

                  {/* Call Due Date */}
                  <div>
                    <Label htmlFor="callDueDate">Due Date</Label>
                    <Input
                      id="callDueDate"
                      type="date"
                      value={callDueDate}
                      onChange={(e) => setCallDueDate(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  {/* Call Purpose */}
                  <div className="md:col-span-2">
                    <Label htmlFor="callPurpose">Purpose</Label>
                    <Textarea
                      id="callPurpose"
                      value={callPurpose}
                      onChange={(e) => setCallPurpose(e.target.value)}
                      placeholder="Follow-on investment in Portfolio Company A..."
                      className="mt-1.5 min-h-[80px] resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/*  Distribution Fields                                      */}
        {/* -------------------------------------------------------- */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            showDistribution
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
          }`}
        >
          <div className="overflow-hidden">
            <Card>
              <CardHeader>
                <CardTitle>Distribution Details</CardTitle>
                <CardDescription>
                  Specify the distribution amount and type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Distribution Amount */}
                  <div>
                    <Label htmlFor="distributionAmount">
                      Distribution Amount
                    </Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <Input
                        id="distributionAmount"
                        type="text"
                        inputMode="decimal"
                        value={distributionAmount}
                        onChange={(e) => setDistributionAmount(formatNumber(e.target.value))}
                        placeholder="3,000,000"
                        className="pl-7"
                      />
                    </div>
                  </div>

                  {/* Distribution Type */}
                  <div>
                    <Label htmlFor="distributionType">Distribution Type</Label>
                    <Select
                      value={distributionType}
                      onValueChange={setDistributionType}
                    >
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DISTRIBUTION_TYPES.map((dt) => (
                          <SelectItem key={dt.value} value={dt.value}>
                            {dt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/*  K-1 Fields                                               */}
        {/* -------------------------------------------------------- */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            showK1
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
          }`}
        >
          <div className="overflow-hidden">
            <Card>
              <CardHeader>
                <CardTitle>K-1 Details</CardTitle>
                <CardDescription>
                  Tax year and filing deadline for Schedule K-1 preparation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tax Year */}
                  <div>
                    <Label htmlFor="taxYear">Tax Year</Label>
                    <Input
                      id="taxYear"
                      type="number"
                      value={taxYear}
                      onChange={(e) => setTaxYear(e.target.value)}
                      placeholder="2025"
                      className="mt-1.5"
                      min={2000}
                      max={2100}
                    />
                  </div>

                  {/* Filing Deadline */}
                  <div>
                    <Label htmlFor="filingDeadline">Filing Deadline</Label>
                    <Input
                      id="filingDeadline"
                      type="date"
                      value={filingDeadline}
                      onChange={(e) => setFilingDeadline(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/*  Source Documents                                          */}
        {/* -------------------------------------------------------- */}
        {sampleDealId && sampleSourceDocs ? (
          <SampleSourceDocsPreview
            docs={sampleSourceDocs}
            onClear={handleClearSample}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Source Documents</CardTitle>
              <CardDescription>
                Upload supporting documents (prior financials, capital account data, etc.).
                These will be scanned and used to fill in your generated documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploader files={files} onFilesSelected={setFiles} />
            </CardContent>
          </Card>
        )}

        {/* -------------------------------------------------------- */}
        {/*  Actions                                                  */}
        {/* -------------------------------------------------------- */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/compliance")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="shadow-sm">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Report...
              </>
            ) : (
              "Create Report & Generate"
            )}
          </Button>
        </div>
      </form>

      <MissingDocsDialog
        open={showMissingDocs}
        onOpenChange={setShowMissingDocs}
        missingRequired={missingRequired}
        missingOptional={missingOptional}
        module="compliance"
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
