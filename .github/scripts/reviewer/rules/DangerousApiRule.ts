import { Rule, Finding } from '../types/finding';
import { SyntaxKind } from 'ts-morph';

export class DangerousApiRule implements Rule {
  name = "DangerousApiRule";

  run(sourceFile: any, changedLines: number[], isNewFile: boolean): { critical: string[], findings: Finding[] } {
    const critical: string[] = [];
    const findings: Finding[] = [];
    
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
          critical.push(`Usage of dangerous 'eval()' API detected at line ${call.getStartLineNumber()}.`);
        }
      }
    }

    return { critical, findings };
  }
}
