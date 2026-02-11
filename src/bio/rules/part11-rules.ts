// part11-rules.ts
// 21 CFR Part 11 compliance rules for electronic records and signatures.
// These are federal law requirements that apply to all electronic records
// submitted to the FDA. Deterministic checks only.

import type { RuleCheckResult } from "./fda-rules";

// Input types

export interface AuditTrailEntry {
  timestamp: string | Date;
  userId: string;
  action: string;
  fieldChanged?: string;
  previousValue?: unknown;
  newValue?: unknown;
}

export interface ElectronicDocument {
  id: string;
  auditTrail?: AuditTrailEntry[];
  createdAt?: string | Date;
  lastModifiedAt?: string | Date;
  lastModifiedBy?: string;
  version?: number;
}

export interface UserSession {
  userId: string;
  loginMethod?: "unique_credentials" | "shared" | "unknown";
  hasUniqueLogin: boolean;
  sessionTimeoutMinutes?: number;
  lastActivity?: string | Date;
  mfaEnabled?: boolean;
}

export interface ElectronicSignature {
  signerId: string;
  signerName?: string;
  meaning?: string;
  date?: string | Date;
  hasTwoFactorAuth?: boolean;
  method?: "password_reentry" | "biometric" | "token" | "unknown";
  linkedToRecord?: boolean;
}

export interface ElectronicRecord {
  id: string;
  hasAuditTrail: boolean;
  allowsOverwrite: boolean;
  amendmentHistory?: Array<{
    timestamp: string | Date;
    userId: string;
    reason: string;
  }>;
  integrityChecksum?: string;
  createdAt?: string | Date;
}

// 21 CFR Part 11.10(e): Audit trails must be computer-generated,
// time-stamped, and record operator actions. Data cannot be overwritten,
// only amended. Audit trail entries must include who, what, and when.
export function checkAuditTrail(document: ElectronicDocument): RuleCheckResult {
  if (!document.auditTrail || document.auditTrail.length === 0) {
    return {
      rule: "Audit Trail",
      status: "fail",
      message: "No audit trail found. 21 CFR Part 11 requires computer-generated, time-stamped audit trails for all electronic records.",
      regulation: "21 CFR Part 11.10(e)",
      details: { documentId: document.id },
    };
  }

  const issues: string[] = [];

  for (let i = 0; i < document.auditTrail.length; i++) {
    const entry = document.auditTrail[i];

    if (!entry.timestamp) {
      issues.push(`Audit trail entry ${i + 1}: missing timestamp`);
    }

    if (!entry.userId) {
      issues.push(`Audit trail entry ${i + 1}: missing user ID`);
    }

    if (!entry.action) {
      issues.push(`Audit trail entry ${i + 1}: missing action description`);
    }
  }

  if (issues.length > 0) {
    return {
      rule: "Audit Trail",
      status: "fail",
      message: `Audit trail incomplete: ${issues.join("; ")}`,
      regulation: "21 CFR Part 11.10(e)",
      details: {
        documentId: document.id,
        entryCount: document.auditTrail.length,
        issues,
      },
    };
  }

  return {
    rule: "Audit Trail",
    status: "pass",
    message: `Audit trail complete with ${document.auditTrail.length} entries, all containing timestamp, user ID, and action`,
    regulation: "21 CFR Part 11.10(e)",
    details: {
      documentId: document.id,
      entryCount: document.auditTrail.length,
    },
  };
}

// 21 CFR Part 11.10(d): Access controls must use unique logins.
// Automatic session timeout: best practice under 11.10(d) (limiting access to authorized individuals).
// Unique credentials ensure accountability; shared logins violate Part 11.
export function checkAccessControl(userSession: UserSession): RuleCheckResult {
  const issues: string[] = [];

  if (!userSession.hasUniqueLogin) {
    issues.push("User does not have unique login credentials");
  }

  if (userSession.loginMethod === "shared") {
    issues.push("Shared login detected; Part 11 requires unique credentials per user");
  }

  // FDA expects session timeout; 15-30 minutes is standard for validated systems
  const MAX_TIMEOUT_MINUTES = 30;
  if (userSession.sessionTimeoutMinutes === undefined || userSession.sessionTimeoutMinutes === null) {
    issues.push("No session timeout policy defined");
  } else if (userSession.sessionTimeoutMinutes > MAX_TIMEOUT_MINUTES) {
    issues.push(`Session timeout of ${userSession.sessionTimeoutMinutes} minutes exceeds recommended maximum of ${MAX_TIMEOUT_MINUTES} minutes`);
  } else if (userSession.sessionTimeoutMinutes <= 0) {
    issues.push("Session timeout is disabled or set to 0");
  }

  if (issues.length > 0) {
    return {
      rule: "Access Control",
      status: "fail",
      message: issues.join(". "),
      regulation: "21 CFR Part 11.10(d), 11.10(g)",
      details: {
        userId: userSession.userId,
        hasUniqueLogin: userSession.hasUniqueLogin,
        loginMethod: userSession.loginMethod,
        sessionTimeoutMinutes: userSession.sessionTimeoutMinutes,
        issues,
      },
    };
  }

  // Warn if MFA is not enabled (not strictly Part 11 required but strongly recommended)
  if (!userSession.mfaEnabled) {
    return {
      rule: "Access Control",
      status: "warning",
      message: "Access controls meet Part 11 requirements but MFA is not enabled (recommended for additional security)",
      regulation: "21 CFR Part 11.10(d), 11.10(g)",
      details: {
        userId: userSession.userId,
        hasUniqueLogin: true,
        sessionTimeoutMinutes: userSession.sessionTimeoutMinutes,
        mfaEnabled: false,
      },
    };
  }

  return {
    rule: "Access Control",
    status: "pass",
    message: `Access controls compliant: unique login, ${userSession.sessionTimeoutMinutes}-minute timeout, MFA enabled`,
    regulation: "21 CFR Part 11.10(d), 11.10(g)",
    details: {
      userId: userSession.userId,
      hasUniqueLogin: true,
      sessionTimeoutMinutes: userSession.sessionTimeoutMinutes,
      mfaEnabled: true,
    },
  };
}

// 21 CFR Part 11.50 and 11.70: Electronic signatures must include the
// signer's identity, the meaning of the signature (e.g., "author",
// "reviewer", "approver"), the date/time, and must be linked to
// the respective electronic record. Two-factor authentication or
// password re-entry is required.
export function checkSignatureRequirements(signature: ElectronicSignature): RuleCheckResult {
  const issues: string[] = [];

  if (!signature.signerId) {
    issues.push("Missing signer identity");
  }

  if (!signature.meaning) {
    issues.push("Missing signature meaning (e.g., 'author', 'reviewer', 'approver')");
  }

  if (!signature.date) {
    issues.push("Missing signature date/time");
  }

  if (!signature.hasTwoFactorAuth) {
    if (signature.method === "password_reentry") {
      // Password re-entry is acceptable per Part 11.200(a)
    } else {
      issues.push("Signature lacks two-factor authentication or password re-entry verification");
    }
  }

  if (!signature.linkedToRecord) {
    issues.push("Signature is not linked to the electronic record");
  }

  if (issues.length > 0) {
    return {
      rule: "Electronic Signature",
      status: "fail",
      message: issues.join(". "),
      regulation: "21 CFR Part 11.50, 11.70, 11.200",
      details: {
        signerId: signature.signerId,
        meaning: signature.meaning,
        date: signature.date,
        hasTwoFactorAuth: signature.hasTwoFactorAuth,
        method: signature.method,
        linkedToRecord: signature.linkedToRecord,
        issues,
      },
    };
  }

  return {
    rule: "Electronic Signature",
    status: "pass",
    message: `Electronic signature compliant: signer ${signature.signerId}, meaning "${signature.meaning}", dated, ${signature.hasTwoFactorAuth ? "2FA" : "password re-entry"} verified, linked to record`,
    regulation: "21 CFR Part 11.50, 11.70, 11.200",
    details: {
      signerId: signature.signerId,
      meaning: signature.meaning,
      date: signature.date,
      method: signature.method,
      linkedToRecord: true,
    },
  };
}

// 21 CFR Part 11.10(a),(c),(e): Electronic records must maintain integrity,
// must not allow overwriting of data (only amendments with reason), and
// must have audit trails. Records should include integrity verification
// (e.g., checksums).
export function validateElectronicRecord(record: ElectronicRecord): RuleCheckResult {
  const issues: string[] = [];

  if (!record.hasAuditTrail) {
    issues.push("Record lacks audit trail");
  }

  if (record.allowsOverwrite) {
    issues.push("Record system allows data overwriting; Part 11 requires amendment-only changes with reason documentation");
  }

  // Check amendment history quality if present
  if (record.amendmentHistory && record.amendmentHistory.length > 0) {
    for (let i = 0; i < record.amendmentHistory.length; i++) {
      const amendment = record.amendmentHistory[i];
      if (!amendment.reason) {
        issues.push(`Amendment ${i + 1}: missing reason for change`);
      }
      if (!amendment.userId) {
        issues.push(`Amendment ${i + 1}: missing user ID`);
      }
      if (!amendment.timestamp) {
        issues.push(`Amendment ${i + 1}: missing timestamp`);
      }
    }
  }

  if (issues.length > 0) {
    return {
      rule: "Electronic Record Integrity",
      status: "fail",
      message: issues.join(". "),
      regulation: "21 CFR Part 11.10(a), 11.10(c), 11.10(e)",
      details: {
        recordId: record.id,
        hasAuditTrail: record.hasAuditTrail,
        allowsOverwrite: record.allowsOverwrite,
        amendmentCount: record.amendmentHistory?.length ?? 0,
        hasIntegrityChecksum: !!record.integrityChecksum,
        issues,
      },
    };
  }

  // Warn if no integrity checksum (not strictly required but recommended)
  if (!record.integrityChecksum) {
    return {
      rule: "Electronic Record Integrity",
      status: "warning",
      message: "Record meets Part 11 requirements but lacks integrity checksum (recommended for tamper detection)",
      regulation: "21 CFR Part 11.10(a), 11.10(c), 11.10(e)",
      details: {
        recordId: record.id,
        hasAuditTrail: true,
        allowsOverwrite: false,
        amendmentCount: record.amendmentHistory?.length ?? 0,
        hasIntegrityChecksum: false,
      },
    };
  }

  return {
    rule: "Electronic Record Integrity",
    status: "pass",
    message: `Electronic record ${record.id} is Part 11 compliant: audit trail present, no overwriting, integrity checksum verified`,
    regulation: "21 CFR Part 11.10(a), 11.10(c), 11.10(e)",
    details: {
      recordId: record.id,
      hasAuditTrail: true,
      allowsOverwrite: false,
      amendmentCount: record.amendmentHistory?.length ?? 0,
      hasIntegrityChecksum: true,
    },
  };
}
