import { Rule, Evidence } from '../types/finding';
import { SyntaxKind } from 'ts-morph';

export class DirectFetchRule implements Rule {
  name = "DirectFetchRule";

  run(sourceFile: any, changedLines: number[], isNewFile: boolean): { critical: string[], Evidences: Evidence[] } {
    const critical: string[] = [];
    const Evidences: Evidence[] = [];
    const filePath = sourceFile.getFilePath().replace(/\\/g, '/');
    
    const isChanged = (node: any) => {
      const start = node.getStartLineNumber();
      const end = node.getEndLineNumber();
      return changedLines.some(l => l >= start && l <= end);
    };

    if (filePath.includes('/components/')) {
      const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
      for (const call of calls) {
        if (isChanged(call)) {
          const name = call.getExpression().getText();
          if (name === 'fetch' || name === 'axios' || name === 'axios.get' || name === 'axios.post') {
            Evidences.push({
              severity: 'HIGH',
              confidence: 'HIGH',
              type: 'Architectural Violation',
              evidence: `Data fetching ('${name}') detected directly in UI component at line ${call.getStartLineNumber()}.`
            });
          }
        }
      }
    }

    return { critical, findings: Evidences };
  }
}
