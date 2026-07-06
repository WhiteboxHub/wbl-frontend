export interface Finding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  evidence: string;
}

export interface Rule {
  name: string;
  run(sourceFile: any, changedLines: number[], isNewFile: boolean, project: any): { critical: string[], findings: Finding[] };
}
