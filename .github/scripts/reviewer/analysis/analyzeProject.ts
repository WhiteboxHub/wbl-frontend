import { Project, Node, FunctionDeclaration } from 'ts-morph';
import path from 'path';
import { execSync } from 'child_process';
import { Evidence, SecurityPrimitive } from '../types/finding';
import { rules } from '../rules';

function groupConsecutiveLines(lines: number[]): number[][] {
  if (lines.length === 0) return [];
  const sorted = [...lines].sort((a, b) => a - b);
  const groups: number[][] = [];
  let currentGroup = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i-1] + 1) {
      currentGroup.push(sorted[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  groups.push(currentGroup);
  return groups;
}

function getSnippet(sourceFile: any, centerLine: number, pad: number = 8): string {
  const lines = sourceFile.getFullText().split('\n');
  const start = Math.max(0, centerLine - pad - 1);
  const end = Math.min(lines.length, centerLine + pad);
  return lines.slice(start, end).join('\n');
}

function calculateImpactScore(refs: Node[], changedFilePath: string): { score: number, details: string } {
  let score = 0;
  for (const ref of refs) {
    const refPath = ref.getSourceFile().getFilePath().replace(/\\/g, '/');
    if (refPath.includes('/api/')) score += 5;
    else if (refPath.includes('/hooks/') || refPath.includes('/shared/')) score += 4;
    else if (refPath.includes('/components/') || refPath.includes('/pages/') || refPath.includes('/app/')) score += 2;
    else score += 1;
  }
  
  if (changedFilePath.includes('/api/') || changedFilePath.includes('/hooks/') || changedFilePath.includes('/services/')) {
    score *= 2;
  }
  
  if (score > 10) return { score, details: 'HIGH' };
  if (score > 3) return { score, details: 'MEDIUM' };
  return { score, details: 'LOW' };
}

export function analyzeProject(project: Project, changes: Map<string, number[]>, addedFiles: Set<string>) {
  let allCritical: string[] = [];
  let allFindings: Evidence[] = [];
  let allSecurityPrimitives: SecurityPrimitive[] = [];
  let impactAnalysis: string[] = [];
  let modifiedPublicApis: string[] = [];
  let contextParts: string[] = ["## Context Snippets\n"];

  for (const [file, lines] of changes.entries()) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
    
    let sourceFile = project.getSourceFile(path.join(process.cwd(), file));
    if (!sourceFile) {
      sourceFile = project.addSourceFileAtPathIfExists(path.join(process.cwd(), file));
    }
    if (!sourceFile) continue;

    const filePath = sourceFile.getFilePath().replace(/\\/g, '/');
    if (filePath.includes('/dist/') || filePath.includes('/build/') || filePath.includes('/.next/')) {
      continue;
    }
    let breakingApis = 0;
    let nonBreakingApis = 0;
    let oldSourceFile: any = null;
    let oldFileLoaded = false;

    function isCompatibleType(oldType: string, newType: string): boolean {
        // e.g. 'number' -> 'number | string' is safe.
        // 'number' -> 'number[]' is unsafe.
        const newTypes = newType.split('|').map(t => t.trim());
        const oldTypes = oldType.split('|').map(t => t.trim());
        return oldTypes.every(ot => newTypes.includes(ot));
    }

    function isBreakingSignatureChange(oldDecl: FunctionDeclaration, newDecl: FunctionDeclaration): boolean {
      const oldParams = oldDecl.getParameters();
      const newParams = newDecl.getParameters();
      if (oldParams.length > newParams.length) return true;
      for (let i = 0; i < oldParams.length; i++) {
          const oldType = oldParams[i].getTypeNode()?.getText();
          const newType = newParams[i].getTypeNode()?.getText();
          if (oldType && newType && oldType !== newType && !isCompatibleType(oldType, newType)) return true;
          
          if (oldParams[i].isOptional() && !newParams[i].isOptional() && !newParams[i].hasInitializer()) return true;
      }
      const addedCount = newParams.length - oldParams.length;
      if (addedCount > 0) {
          for (let i = oldParams.length; i < newParams.length; i++) {
              const p = newParams[i];
              if (!p.isOptional() && !p.hasInitializer() && !p.isRestParameter()) return true;
          }
      }
      return false;
    }

    for (const [name, declarations] of sourceFile.getExportedDeclarations()) {
      for (const decl of declarations) {
        const startLine = decl.getStartLineNumber();
        const endLine = decl.getEndLineNumber();
        if (lines.some(l => l >= startLine && l <= endLine)) {
          let isBreaking = false;
          if (Node.isFunctionDeclaration(decl) || Node.isVariableDeclaration(decl)) {
              isBreaking = true;
              if (!oldFileLoaded) {
                  try {
                      const targetBranch = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
                      try { execSync('git fetch --unshallow', { stdio: 'ignore' }); } catch (e) {}
                      const oldContent = execSync(`git show ${targetBranch}:${file}`, { stdio: 'pipe' }).toString();
                      oldSourceFile = project.createSourceFile(`old_${Math.random()}.ts`, oldContent);
                  } catch (e) {}
                  oldFileLoaded = true;
              }
              if (oldSourceFile) {
                  const declName = typeof (decl as any).getName === 'function' ? (decl as any).getName() : '';
                  const oldDecl = oldSourceFile.getFunction(declName || "");
                  if (oldDecl && Node.isFunctionDeclaration(decl)) isBreaking = isBreakingSignatureChange(oldDecl, decl);
                  else isBreaking = false; // New function
              } else {
                  isBreaking = false; // New file or failed to load old file
              }
          }
          if (isBreaking) breakingApis++;
          else nonBreakingApis++;
        }
      }
    }

    if (breakingApis > 0 || nonBreakingApis > 0) {
      if (breakingApis > 0) modifiedPublicApis.push(`${file} (Breaking: True)`);
      else modifiedPublicApis.push(`${file} (Breaking: False)`);
    }

    const functions = sourceFile.getFunctions();
    const classes = sourceFile.getClasses();
    const vars = sourceFile.getVariableDeclarations();
    const interfaces = sourceFile.getInterfaces();
    const allDeclarations: Node[] = [...functions, ...classes, ...vars, ...interfaces];
    
    const coveredLines = new Set<number>();
    
    for (const decl of allDeclarations) {
      const startLine = decl.getStartLineNumber();
      const endLine = decl.getEndLineNumber();
      
      if (lines.some(l => l >= startLine && l <= endLine)) {
        if (endLine - startLine < 300) {
           const text = decl.getFullText();
           let name = "anonymous";
           if (typeof (decl as any).getName === "function") {
             name = (decl as any).getName() || "anonymous";
           }

           contextParts.push(`### Changed File: ${file} (lines ${startLine}-${endLine} enclosing ${name})\n\`\`\`typescript\n${text}\n\`\`\`\n`);
           for (let i = startLine; i <= endLine; i++) coveredLines.add(i);
        }
      }
    }

    const uncoveredLines = lines.filter(l => !coveredLines.has(l));
    const lineGroups = groupConsecutiveLines(uncoveredLines);
    for (const group of lineGroups) {
      const center = group[Math.floor(group.length / 2)];
      const snippet = getSnippet(sourceFile, center, 6);
      contextParts.push(`### Changed File: ${file} (lines ${group[0]}-${group[group.length - 1]})\n\`\`\`typescript\n${snippet}\n\`\`\`\n`);
    }

    for (const decl of allDeclarations) {
      let startLine = decl.getStartLineNumber();
      let endLine = decl.getEndLineNumber();
      
      if (lines.some(l => l >= startLine && l <= endLine)) {
        try {
          const nameNode = (decl as any).getNameNode?.();
          if (nameNode) {
            const refs = nameNode.findReferencesAsNodes();
            if (refs.length > 0) {
              const { score, details } = calculateImpactScore(refs, filePath);
              impactAnalysis.push(`- Symbol '${nameNode.getText()}' (Score: ${score}, Downstream Impact: ${details}, References: ${refs.length})`);
              
              for (const ref of refs) {
                const refFile = ref.getSourceFile();
                const refLine = ref.getStartLineNumber();
                contextParts.push(`### Caller to '${nameNode.getText()}' in ${path.relative(process.cwd(), refFile.getFilePath())}\n\`\`\`typescript\n${getSnippet(refFile, refLine, 8)}\n\`\`\`\n`);
              }
            }
          }
        } catch (e) {}
      }
    }
    
    const isNewFile = addedFiles.has(file);
    
    // Run all rules
    for (const rule of rules) {
      const result = rule.run(sourceFile, lines, isNewFile, project);
      const critical = result.critical || [];
      const findings = result.findings || (result as any).Evidences || [];
      const securityPrimitives = result.securityPrimitives || [];
      
      if (critical.length > 0) {
        allCritical.push(...critical.map((c: string) => `[${file}] ${c}`));
      }
      if (findings.length > 0) {
        allFindings.push(...findings);
      }
      if (securityPrimitives && securityPrimitives.length > 0) {
        allSecurityPrimitives.push(...securityPrimitives);
      }
    }
  }

  return { allCritical, allFindings, impactAnalysis, modifiedPublicApis, contextParts, allSecurityPrimitives };
}
