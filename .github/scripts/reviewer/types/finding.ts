export type Finding = Evidence;
export type EvidenceType = 'api_signature' | 'security_sink' | 'architecture' | 'code_smell';
export type EvidenceSource = 'ast' | 'semantic' | 'git' | 'security' | 'impact';

export interface ApiSignatureEvidence {
  changeType: "required_parameter_added" | "optional_parameter_added" | "parameter_removed" | "return_type_changed" | "signature_modified";
  compatibility?: "breaking" | "backward_compatible";
  affectedCallers?: number | null;
  reason?: string;
}

export interface SecurityEvidence {
  sink: string;
  sanitizerDetected: boolean;
  source?: string;
  reason?: string;
}

export interface Evidence<T = any> {
  schemaVersion: 1;
  id: string;              // Stable identifier
  type: EvidenceType;
  source: EvidenceSource;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  attributes: T;           // Typed payload
  evidence: string;        // Legacy field for UI compatibility
}

export interface Rule {
  name: string;
  run(sourceFile: any, changedLines: number[], isNewFile: boolean, project: any): { critical: string[], findings: Evidence[], securityPrimitives?: SecurityPrimitive[] };
}

export interface SecurityPrimitive {
  id: string;
  language: "typescript";
  category: "Injection" | "Security Misconfiguration" | "Broken Access Control" | "Cryptographic Failures";
  owasp: "A01:2021" | "A03:2021" | "A05:2021" | "A08:2021";
  kind: string;
  file: string;
  line: number;
  evidence: string;
  severity?: "low" | "medium" | "high";
  metadata?: Record<string, unknown>;
}
