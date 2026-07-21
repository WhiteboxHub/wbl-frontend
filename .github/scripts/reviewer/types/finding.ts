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
  run(sourceFile: any, changedLines: number[], isNewFile: boolean, project: any): { critical: string[], findings: Evidence[] };
}
