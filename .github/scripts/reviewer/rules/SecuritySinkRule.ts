import { Rule, Finding, SecurityPrimitive } from '../types/finding';
import { SyntaxKind, Node, CallExpression, JsxAttribute, PropertyAssignment, VariableDeclaration, StringLiteral } from 'ts-morph';
import crypto from 'crypto';

function generateSecId() {
  return 'SEC-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

export class SecuritySinkRule implements Rule {
  name = "SecuritySinkRule";

  run(sourceFile: any, changedLines: number[], isNewFile: boolean): { critical: string[], findings: Finding[], securityPrimitives: SecurityPrimitive[] } {
    const securityPrimitives: SecurityPrimitive[] = [];
    const filePath = sourceFile.getFilePath();

    const isChanged = (node: any) => {
      const start = node.getStartLineNumber();
      const end = node.getEndLineNumber();
      return changedLines.some(l => l >= start && l <= end);
    };

    // 1. XSS Sinks
    const jsxAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute);
    for (const attr of jsxAttributes) {
      if (!isChanged(attr)) continue;
      const name = attr.getNameNode().getText();
      if (name === 'dangerouslySetInnerHTML' || name === 'v-html') {
        const text = attr.getText();
        if (!text.includes('DOMPurify.sanitize') && !text.includes('sanitize(')) {
          securityPrimitives.push({
            id: generateSecId(),
            language: "typescript",
            category: "Injection",
            owasp: "A03:2021",
            kind: name,
            file: filePath,
            line: attr.getStartLineNumber(),
            evidence: text.substring(0, 100),
            severity: "high"
          });
        }
      }
    }
    
    const propAssignments = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAssignment);
    for (const prop of propAssignments) {
      if (!isChanged(prop)) continue;
      const name = prop.getName();
      if (name === 'dangerouslySetInnerHTML' || name === 'bypassSecurityTrustHtml') {
        const text = prop.getText();
        if (!text.includes('DOMPurify.sanitize') && !text.includes('sanitize(')) {
          securityPrimitives.push({
            id: generateSecId(),
            language: "typescript",
            category: "Injection",
            owasp: "A03:2021",
            kind: name,
            file: filePath,
            line: prop.getStartLineNumber(),
            evidence: text.substring(0, 100),
            severity: "high"
          });
        }
      }
    }

    // 2. Hardcoded Secrets
    const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
    for (const str of stringLiterals) {
      if (!isChanged(str)) continue;
      const value = str.getLiteralText();
      const parent = str.getParent();
      
      let isSecret = false;
      let evidence = "";
      
      if (value.startsWith('sk_live_') || value.startsWith('AIza') || value.startsWith('ghp_') || value.startsWith('AKIA')) {
        isSecret = true;
        evidence = `Found secret value prefix in literal`;
      }
      
      if (!isSecret && Node.isVariableDeclaration(parent)) {
        const varName = parent.getName().toLowerCase();
        const rawVarName = parent.getName();
        if (!(rawVarName.startsWith('NEXT_PUBLIC_') || rawVarName.startsWith('REACT_APP_') || rawVarName.startsWith('NEXT_RUNTIME_') || rawVarName.startsWith('PUBLIC_'))) {
          if (['secret', 'token', 'password', 'apikey', 'privatekey', 'clientsecret'].some(s => varName.includes(s))) {
            isSecret = true;
            evidence = `Hardcoded literal assigned to ${rawVarName}`;
          }
        }
      }
      
      if (isSecret) {
        securityPrimitives.push({
          id: generateSecId(),
          language: "typescript",
          category: "Security Misconfiguration",
          owasp: "A05:2021",
          kind: "hardcoded_secret",
          file: filePath,
          line: str.getStartLineNumber(),
          evidence: evidence,
          severity: "high"
        });
      }
    }

    // 3. JWT/Insecure Storage
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of calls) {
      if (!isChanged(call)) continue;
      const expression = call.getExpression().getText();
      if (expression === 'localStorage.setItem' || expression === 'sessionStorage.setItem') {
        const args = call.getArguments();
        if (args.length >= 1 && Node.isStringLiteral(args[0])) {
          const key = args[0].getLiteralText().toLowerCase();
          if (['jwt', 'access_token', 'refresh_token', 'auth', 'idtoken'].includes(key)) {
            securityPrimitives.push({
              id: generateSecId(),
              language: "typescript",
              category: "Security Misconfiguration",
              owasp: "A05:2021",
              kind: "insecure_jwt_storage",
              file: filePath,
              line: call.getStartLineNumber(),
              evidence: call.getText().substring(0, 100),
              severity: "high",
              metadata: { storage: expression, key: key }
            });
          }
        }
      }
    }

    return { critical: [], findings: [], securityPrimitives };
  }
}
