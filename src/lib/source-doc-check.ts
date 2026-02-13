// Server-side utility to compute missing source docs for a project.
// Used by Inngest functions before doc generation.

import { prisma } from "@/lib/db";
import { getSourceDocsForModule, type SourceDocDef } from "@/lib/source-doc-types";

/**
 * Returns the list of missing source doc keys for a module/project.
 * Checks against uploaded (non-deleted) source documents.
 */
export async function getMissingSourceDocKeys(
  module: string,
  projectId: string,
): Promise<string[]> {
  const defs = getSourceDocsForModule(module);
  if (!defs.length) return [];

  const uploaded = await prisma.sourceDocument.findMany({
    where: { module, projectId, deletedAt: null },
    select: { docType: true },
  });

  // Filter out nulls (unclassified uploads) before building the set
  const uploadedKeys = new Set(uploaded.map((d) => d.docType).filter(Boolean));
  return defs
    .filter((d) => !uploadedKeys.has(d.key))
    .map((d) => d.key);
}

/**
 * Returns the full SourceDocDef[] for missing docs (for use with pendingDocNotices helper).
 */
export async function getMissingSourceDocs(
  module: string,
  projectId: string,
): Promise<SourceDocDef[]> {
  const defs = getSourceDocsForModule(module);
  if (!defs.length) return [];

  const uploaded = await prisma.sourceDocument.findMany({
    where: { module, projectId, deletedAt: null },
    select: { docType: true },
  });

  // Filter out nulls (unclassified uploads) before building the set
  const uploadedKeys = new Set(uploaded.map((d) => d.docType).filter(Boolean));
  return defs.filter((d) => !uploadedKeys.has(d.key));
}
