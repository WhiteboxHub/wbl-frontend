export interface Finding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  evidence: string;
}

export interface Rule {
  name: string;
  run(sourceFile: any, changedLines: number[], isNewFile: boolean, project: any): { critical: string[], findings: Finding[], securityPrimitives?: SecurityPrimitive[] };
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
