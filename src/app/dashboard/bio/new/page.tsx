"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
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

const DRUG_CLASSES = [
  { value: "ADC", label: "ADC (Antibody-Drug Conjugate)" },
  { value: "SMALL_MOLECULE", label: "Small Molecule" },
  { value: "BIOLOGIC", label: "Biologic" },
  { value: "GENE_THERAPY", label: "Gene Therapy" },
  { value: "CELL_THERAPY", label: "Cell Therapy" },
  { value: "VACCINE", label: "Vaccine" },
];

const PHASES = [
  { value: "PRECLINICAL", label: "Preclinical" },
  { value: "PHASE_1", label: "Phase 1" },
  { value: "PHASE_2", label: "Phase 2" },
  { value: "PHASE_3", label: "Phase 3" },
  { value: "APPROVED", label: "Approved" },
];

const TOOL_TYPES = [
  { value: "DATA_ANALYSIS", label: "Data Analysis" },
  { value: "REGULATORY_DOCS", label: "Regulatory Documents" },
  { value: "COMPLIANCE_AUDIT", label: "Compliance Audit" },
];

export default function NewBioProgramPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [drugName, setDrugName] = useState("");
  const [drugClass, setDrugClass] = useState("");
  const [target, setTarget] = useState("");
  const [mechanism, setMechanism] = useState("");
  const [indication, setIndication] = useState("");
  const [phase, setPhase] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [toolType, setToolType] = useState("REGULATORY_DOCS");

  // ADC-specific
  const [antibodyType, setAntibodyType] = useState("");
  const [linkerType, setLinkerType] = useState("");
  const [payloadType, setPayloadType] = useState("");
  const [dar, setDar] = useState("");

  const isAdc = drugClass === "ADC";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Program name is required");
      return;
    }
    if (!drugName.trim()) {
      toast.error("Drug name is required");
      return;
    }
    if (!sponsorName.trim()) {
      toast.error("Sponsor name is required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/bio/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          drugName: drugName.trim(),
          drugClass: drugClass || null,
          target: target.trim() || null,
          mechanism: mechanism.trim() || null,
          indication: indication.trim() || null,
          phase: phase || null,
          sponsorName: sponsorName.trim(),
          toolType,
          ...(isAdc && {
            antibodyType: antibodyType.trim() || null,
            linkerType: linkerType.trim() || null,
            payloadType: payloadType.trim() || null,
            dar: dar ? parseFloat(dar) : null,
          }),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create program");
      }

      const program = await res.json();
      toast.success("Program created! Upload documents to begin.");
      router.push(`/dashboard/bio/${program.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/bio"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-x-0.5 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Bio Programs
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New Program</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Define a biopharma program to generate IND regulatory documents
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Program Information</CardTitle>
            <CardDescription>
              Basic details about the drug program and regulatory submission
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">
                  Program Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. DEM301 IND Submission"
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="drugName">
                  Drug Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="drugName"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  placeholder="e.g. DEM301"
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="drugClass">Drug Class</Label>
                <Select value={drugClass} onValueChange={setDrugClass}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select drug class" />
                  </SelectTrigger>
                  <SelectContent>
                    {DRUG_CLASSES.map((dc) => (
                      <SelectItem key={dc.value} value={dc.value}>
                        {dc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="target">Target</Label>
                <Input
                  id="target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. Nectin-4"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="mechanism">Mechanism of Action</Label>
                <Input
                  id="mechanism"
                  value={mechanism}
                  onChange={(e) => setMechanism(e.target.value)}
                  placeholder="e.g. ADC targeting Nectin-4 expressing solid tumors"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="indication">Indication</Label>
                <Input
                  id="indication"
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  placeholder="e.g. Urothelial carcinoma, solid tumors"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="phase">Phase</Label>
                <Select value={phase} onValueChange={setPhase}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {PHASES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sponsorName">
                  Sponsor Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sponsorName"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="e.g. Daiichi Sankyo"
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="toolType">Tool Type</Label>
                <Select value={toolType} onValueChange={setToolType}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select tool type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOOL_TYPES.map((tt) => (
                      <SelectItem key={tt.value} value={tt.value}>
                        {tt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ADC-specific fields */}
        {isAdc && (
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardHeader>
              <CardTitle>ADC-Specific Details</CardTitle>
              <CardDescription>
                Additional parameters for antibody-drug conjugate characterization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="antibodyType">Antibody Type</Label>
                  <Input
                    id="antibodyType"
                    value={antibodyType}
                    onChange={(e) => setAntibodyType(e.target.value)}
                    placeholder="e.g. Humanized IgG1"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="linkerType">Linker Type</Label>
                  <Input
                    id="linkerType"
                    value={linkerType}
                    onChange={(e) => setLinkerType(e.target.value)}
                    placeholder="e.g. Cleavable valine-citrulline"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="payloadType">Payload Type</Label>
                  <Input
                    id="payloadType"
                    value={payloadType}
                    onChange={(e) => setPayloadType(e.target.value)}
                    placeholder="e.g. MMAE"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="dar">Target DAR</Label>
                  <Input
                    id="dar"
                    type="number"
                    value={dar}
                    onChange={(e) => setDar(e.target.value)}
                    placeholder="e.g. 4.0"
                    className="mt-1.5"
                    min={0}
                    max={20}
                    step={0.1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/bio")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Program...
              </>
            ) : (
              "Create Program"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
