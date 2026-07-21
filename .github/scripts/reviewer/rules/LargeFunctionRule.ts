import { Rule, Evidence } from '../types/finding';
import { Node, SyntaxKind } from 'ts-morph';

export class LargeFunctionRule implements Rule {
  name = "LargeFunctionRule";

  run(sourceFile: any, changedLines: number[], isNewFile: boolean): { critical: string[], findings: Evidence[] } {
    const critical: string[] = [];
    const Evidences: Evidence[] = [];
    
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

        if (length > 150) {
           Evidences.push({
             schemaVersion: 1,
             id: `SMELL-LARGE-${fn.getStartLineNumber()}`,
             type: 'code_smell',
             source: 'ast',
             severity: 'MEDIUM',
             attributes: { functionName: name, lineCount: length },
             evidence: `Function '${name}' is ${length} lines long (exceeds 150 limit) at line ${fn.getStartLineNumber()}.`
           });
        }
      }
    }

    return { critical, findings: Evidences };
  }
}
