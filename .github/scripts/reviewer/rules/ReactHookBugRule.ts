import { Rule, Evidence } from '../types/finding';
import { Node, SyntaxKind } from 'ts-morph';

export class ReactHookBugRule implements Rule {
  name = "ReactHookBugRule";

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
        const expr = call.getExpression();
        const name = expr.getText();
        
        if (['useEffect', 'useCallback', 'useMemo'].includes(name)) {
          const args = call.getArguments();
          if (args.length < 2) {
            Evidences.push({
              severity: 'HIGH',
              confidence: 'HIGH',
              type: 'React Hook Bug',
              evidence: `Missing dependency array in '${name}' at line ${call.getStartLineNumber()}.`
            });
          } else if (args.length === 2 && Node.isArrayLiteralExpression(args[1])) {
            const bodyNode = args[0];
            const arrayNode = args[1];
            const arrayElements = arrayNode.getElements().map((el: any) => el.getText());
            
            const identifiers = bodyNode.getDescendantsOfKind(SyntaxKind.Identifier);
            for (const id of identifiers) {
              const parent = id.getParent();
              if (Node.isPropertyAccessExpression(parent) && parent.getNameNode() === id) {
                continue;
              }
              const idName = id.getText();
              if (['console', 'window', 'document', 'Math', 'JSON', 'Object', 'Array', 'String'].includes(idName)) continue;
              
              const symbol = id.getSymbol();
              if (symbol) {
                const declarations = symbol.getDeclarations();
                if (declarations.length > 0) {
                  const declKind = declarations[0].getKind();
                  if (declKind === SyntaxKind.ImportSpecifier || declKind === SyntaxKind.ImportClause || declKind === SyntaxKind.ImportEqualsDeclaration) {
                    continue;
                  }
                  const declStart = declarations[0].getStart();
                  if (declStart < bodyNode.getStart() || declStart > bodyNode.getEnd()) {
                     if (!arrayElements.includes(idName)) {
                       Evidences.push({
                         severity: 'HIGH',
                         confidence: 'MEDIUM',
                         type: 'React Hook Bug',
                         evidence: `React Hook '${name}' at line ${call.getStartLineNumber()} has a missing external dependency: '${idName}'.`
                       });
                     }
                  }
                }
              }
            }
          }
        }
      }
    }

    return { critical, findings: Evidences };
  }
}
