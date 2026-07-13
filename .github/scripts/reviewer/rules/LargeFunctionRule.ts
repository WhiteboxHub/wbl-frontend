import { Rule, Finding } from '../types/finding';
import { Node, SyntaxKind } from 'ts-morph';

export class LargeFunctionRule implements Rule {
  name = "LargeFunctionRule";

  run(sourceFile: any, changedLines: number[], isNewFile: boolean): { critical: string[], findings: Finding[] } {
    const critical: string[] = [];
    const findings: Finding[] = [];
    
    const isChanged = (node: any) => {
      const start = node.getStartLineNumber();
      const end = node.getEndLineNumber();
      return changedLines.some(l => l >= start && l <= end);
    };

    const functions = sourceFile.getFunctions();
    const arrowFunctions = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);
    const methods = sourceFile.getClasses().flatMap((c: any) => c.getMethods());
    
    for (const fn of [...functions, ...arrowFunctions, ...methods]) {
      if (isChanged(fn)) {
        const length = fn.getEndLineNumber() - fn.getStartLineNumber();
        let name = 'anonymous';
        if (Node.isFunctionDeclaration(fn) || Node.isMethodDeclaration(fn)) {
           name = fn.getName() || 'anonymous';
        } else if (Node.isArrowFunction(fn)) {
            const parent = fn.getParent();
            if (Node.isVariableDeclaration(parent)) name = parent.getName();
        }

        if (length > 300) {
           findings.push({
             severity: 'MEDIUM',
             confidence: 'HIGH',
             type: 'Code Smell',
             evidence: `Function '${name}' is ${length} lines long (exceeds 300 limit) at line ${fn.getStartLineNumber()}.`
           });
        }
      }
    }

    return { critical, findings };
  }
}
