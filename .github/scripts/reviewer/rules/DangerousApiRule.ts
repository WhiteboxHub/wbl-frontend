import { Rule, Evidence, SecurityEvidence } from '../types/Evidence';
import { SyntaxKind } from 'ts-morph';
import crypto from 'crypto';

export class DangerousApiRule implements Rule {
  name = "DangerousApiRule";

  run(sourceFile: any, changedLines: number[], isNewFile: boolean): { critical: string[], Evidences: Evidence[] } {
    const critical: string[] = [];
    const Evidences: Evidence[] = [];
    
    const isChanged = (node: any) => {
      const start = node.getStartLineNumber();
      const end = node.getEndLineNumber();
      return changedLines.some(l => l >= start && l <= end);
    };

    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of calls) {
      if (isChanged(call)) {
        const name = call.getExpression().getText();
        if (name === 'eval') {
          const startLine = call.getStartLineNumber();
          const id = `SEC-SINK-${crypto.createHash('md5').update(`eval-${startLine}`).digest('hex').substring(0, 8).toUpperCase()}`;
          
          const attributes: SecurityEvidence = {
            sink: 'eval',
            sanitizerDetected: false,
            reason: 'Dangerous dynamic code execution sink'
          };
          
          Evidences.push({
             schemaVersion: 1,
             id: id,
             type: 'security_sink',
             source: 'ast',
             severity: 'CRITICAL',
             attributes: attributes,
             evidence: `Usage of dangerous 'eval()' API detected at line ${startLine}.`
          });
        }
      }
    }

    return { critical, Evidences };
  }
}

