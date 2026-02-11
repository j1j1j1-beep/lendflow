"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, FlaskConical } from "lucide-react";
import { BioStatusBadge } from "@/components/BioStatusBadge";

type BioProgramCardProps = {
  program: {
    id: string;
    name: string;
    drugName: string | null;
    drugClass: string | null;
    phase: string | null;
    status: string;
    createdAt: string;
    _count: { bioDocuments: number; bioGeneratedDocuments: number };
  };
};

const DRUG_CLASS_LABELS: Record<string, string> = {
  adc: "ADC",
  ADC: "ADC",
  small_molecule: "Small Molecule",
  SMALL_MOLECULE: "Small Molecule",
  biologic: "Biologic",
  BIOLOGIC: "Biologic",
  gene_therapy: "Gene Therapy",
  GENE_THERAPY: "Gene Therapy",
  cell_therapy: "Cell Therapy",
  CELL_THERAPY: "Cell Therapy",
  vaccine: "Vaccine",
  VACCINE: "Vaccine",
};

const PHASE_LABELS: Record<string, string> = {
  PRECLINICAL: "Preclinical",
  IND_FILING: "IND Filing",
  PHASE_1: "Phase 1",
  PHASE_1B: "Phase 1b",
  PHASE_2: "Phase 2",
  PHASE_2B: "Phase 2b",
  PHASE_3: "Phase 3",
  NDA_BLA: "NDA/BLA",
  APPROVED: "Approved",
  POST_MARKET: "Post-Market",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function BioProgramCard({ program }: BioProgramCardProps) {
  return (
    <Link href={`/dashboard/bio/${program.id}`}>
      <Card className="group transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-emerald-500/20 active:translate-y-0 active:shadow-sm">
        <CardContent className="pt-0">
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate group-hover:text-emerald-600 transition-colors duration-150">
                {program.name}
              </h3>
              {program.drugName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {program.drugName}
                </p>
              )}
            </div>
            <BioStatusBadge status={program.status} />
          </div>

          <div className="flex items-center gap-2 mb-4">
            {program.drugClass && (
              <Badge variant="outline" className="text-[11px] border-emerald-600/30 text-emerald-600">
                {DRUG_CLASS_LABELS[program.drugClass] ?? program.drugClass}
              </Badge>
            )}
            {program.phase && (
              <Badge variant="secondary" className="text-[11px]">
                {PHASE_LABELS[program.phase] ?? program.phase}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {program._count.bioDocuments} doc{program._count.bioDocuments !== 1 ? "s" : ""}
              </span>
              {program._count.bioGeneratedDocuments > 0 && (
                <span className="flex items-center gap-1.5">
                  <FlaskConical className="h-3.5 w-3.5" />
                  {program._count.bioGeneratedDocuments} generated
                </span>
              )}
            </div>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(program.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
