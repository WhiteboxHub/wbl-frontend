import { Rule, Evidence } from '../types/finding';
import { Node, SyntaxKind } from 'ts-morph';

export class HardcodedSecretRule implements Rule {
  name = "HardcodedSecretRule";

  run(sourceFile: any, changedLines: number[], isNewFile: boolean): { critical: string[], Evidences: Evidence[] } {
    const critical: string[] = [];
    const Evidences: Evidence[] = [];
    
    const isChanged = (node: any) => {
      const start = node.getStartLineNumber();
      const end = node.getEndLineNumber();
      return changedLines.some(l => l >= start && l <= end);
    };

    const strings = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
    for (const str of strings) {
      if (isChanged(str)) {
        const val = str.getLiteralText();
        if (val.length < 5) continue;
        
        const parent = str.getParent();
        if (Node.isVariableDeclaration(parent)) {
          const varName = parent.getName().toLowerCase();
          if (varName.includes('secret') || varName.includes('password') || varName.includes('token') || varName.includes('api_key')) {
            if (!val.includes('ENV_') && !val.includes('process.env')) {
               critical.push(`Potential hardcoded secret assigned to '${parent.getName()}' at line ${str.getStartLineNumber()}.`);
            }
          }
        }
        if (Node.isBinaryExpression(parent)) {
          if (parent.getOperatorToken().getText() === '||' || parent.getOperatorToken().getText() === '??') {
            const leftText = parent.getLeft().getText().toLowerCase();
            if (leftText.includes('env') || leftText.includes('secret')) {
               critical.push(`Hardcoded fallback secret detected in binary expression at line ${str.getStartLineNumber()}.`);
            }
          }
        }
      }
    }

    return { critical, findings: Evidences };
  }
}
