import { Rule, Finding } from '../types/finding';
import { Node, SyntaxKind } from 'ts-morph';

export class SignatureChangeRule implements Rule {
  name = "SignatureChangeRule";

  run(sourceFile: any, changedLines: number[], isNewFile: boolean): { critical: string[], findings: Finding[] } {
    const critical: string[] = [];
    const findings: Finding[] = [];
    if (isNewFile) return { critical, findings };
    
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
        let name = 'anonymous';
        if (Node.isFunctionDeclaration(fn) || Node.isMethodDeclaration(fn)) name = fn.getName() || 'anonymous';
        else if (Node.isArrowFunction(fn)) {
            const parent = fn.getParent();
            if (Node.isVariableDeclaration(parent)) name = parent.getName();
        }

        const startLine = fn.getStartLineNumber();
        const body = (fn as any).getBody?.();
        const bodyStartLine = body ? body.getStartLineNumber() : startLine;
        const signatureChanged = changedLines.some(l => l >= startLine && l <= bodyStartLine);
        
        if (signatureChanged && name !== 'anonymous') {
           // Only report if it's exported
           let isExported = false;
           if (fn.hasExportKeyword && fn.hasExportKeyword()) {
             isExported = true;
           } else if (Node.isArrowFunction(fn)) {
             const varDec = fn.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
             const varStmt = varDec?.getFirstAncestorByKind(SyntaxKind.VariableStatement);
             if (varStmt && varStmt.hasExportKeyword()) {
               isExported = true;
             }
           } else if (Node.isMethodDeclaration(fn)) {
             const classDecl = fn.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
             if (classDecl && classDecl.hasExportKeyword()) {
               isExported = true;
             }
           }
           if (isExported) {
             findings.push({
               severity: 'HIGH',
               confidence: 'MEDIUM',
               type: 'Signature Change',
               evidence: `Exported function '${name}' definition changed around line ${startLine}. This may break downstream callers.`
             });
           }
        }
      }
    }

    return { critical, findings };
  }
}
