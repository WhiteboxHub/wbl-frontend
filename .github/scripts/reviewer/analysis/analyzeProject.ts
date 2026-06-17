import { Project, Node } from 'ts-morph';
import path from 'path';
import { Finding } from '../types/finding';
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
  let allFindings: Finding[] = [];
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
    if (filePath.includes('/api/') || filePath.includes('/hooks/') || filePath.includes('/services/')) {
      modifiedPublicApis.push(file);
    }

    const lineGroups = groupConsecutiveLines(lines);
    for (const group of lineGroups) {
      const center = group[Math.floor(group.length / 2)];
      const snippet = getSnippet(sourceFile, center, 6);
      contextParts.push(`### Changed File: ${file} (lines ${group[0]}-${group[group.length - 1]})\n\`\`\`typescript\n${snippet}\n\`\`\`\n`);
    }
    
    const functions = sourceFile.getFunctions();
    const classes = sourceFile.getClasses();
    const vars = sourceFile.getVariableDeclarations();
    const allDeclarations: Node[] = [...functions, ...classes, ...vars];
    
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
      const { critical, findings } = rule.run(sourceFile, lines, isNewFile, project);
      if (critical.length > 0) {
        allCritical.push(...critical.map(c => `[${file}] ${c}`));
      }
      if (findings.length > 0) {
        allFindings.push(...findings);
      }
    }
  }

  return { allCritical, allFindings, impactAnalysis, modifiedPublicApis, contextParts };
}
