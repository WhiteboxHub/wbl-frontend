import os
import pathlib

base_dir = pathlib.Path(r"C:\Users\Adarsh Teja\avatar\wbl-frontend\.github\scripts\reviewer")
base_dir.mkdir(parents=True, exist_ok=True)

files = {}

files["types/finding.ts"] = """\
export interface Finding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  evidence: string;
}

export interface Rule {
  name: string;
  run(sourceFile: any, changedLines: number[], isNewFile: boolean, project: any): { critical: string[], findings: Finding[] };
}
"""

files["git/getGitContext.ts"] = """\
import { execSync } from 'child_process';

export function getChangedLines(): Map<string, number[]> {
  const targetBranch = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
  const diffOutput = execSync(`git diff --unified=0 -w -B ${targetBranch}...HEAD`, { encoding: 'utf-8' });
  const lines = diffOutput.split('\\n');
  const changes = new Map<string, number[]>();
  let currentFile = '';

  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.substring(6);
    } else if (line.startsWith('@@ ') && currentFile) {
      const match = line.match(/@@ -\\d+(?:,\\d+)? \\+(\\d+)(?:,(\\d+))? @@/);
      if (match) {
        const start = parseInt(match[1], 10);
        const count = match[2] ? parseInt(match[2], 10) : 1;
        if (!changes.has(currentFile)) changes.set(currentFile, []);
        for (let i = 0; i < count; i++) {
          changes.get(currentFile)!.push(start + i);
        }
      }
    }
  }
  return changes;
}

export function getGitContext() {
  const targetBranch = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
  let diffText = "";
  let addedFiles = new Set<string>();
  
  try {
    diffText = execSync(`git diff --unified=3 ${targetBranch}...HEAD`, { encoding: 'utf-8' });
    const addedFilesOut = execSync(`git diff --name-status ${targetBranch}...HEAD`, { encoding: 'utf-8' });
    addedFilesOut.split('\\n').forEach(line => {
      if (line.startsWith('A\\t')) {
        addedFiles.add(line.split('\\t')[1].trim());
      }
    });
  } catch (e) {
    console.error("Failed to get git diff", e);
  }
  
  return { diffText, addedFiles };
}
"""

files["prompts/reviewPrompt.ts"] = """\
export function buildPrompt(finalContext: string): string {
  return `You are a senior code reviewer analyzing a PR.

${finalContext}

INSTRUCTIONS:
Do not verify AST findings. Assume AST findings are correct.
Focus only on:
- business impact
- operational risk
- regression risk
- migration concerns
- testing recommendations

When reviewing, pay special attention to functions with HIGH Downstream Impact or Modified Public APIs.

If no bugs found, return empty bugs array.`;
}
"""

files["rules/DbImportRule.ts"] = """\
import { Rule, Finding } from '../types/finding';

export class DbImportRule implements Rule {
  name = "DbImportRule";

  run(sourceFile: any, changedLines: number[], isNewFile: boolean): { critical: string[], findings: Finding[] } {
    const critical: string[] = [];
    const findings: Finding[] = [];
    const filePath = sourceFile.getFilePath().replace(/\\\\/g, '/');
    
    const isChanged = (node: any) => {
      const start = node.getStartLineNumber();
      const end = node.getEndLineNumber();
      return changedLines.some(l => l >= start && l <= end);
    };

    if (filePath.includes('/pages/') || filePath.includes('/app/')) {
      sourceFile.getImportDeclarations().forEach((imp: any) => {
        if (isChanged(imp)) {
          const moduleSpecifier = imp.getModuleSpecifierValue();
          if (moduleSpecifier.match(/db|database|prisma|typeorm|sql/i)) {
            findings.push({
               severity: 'HIGH',
               confidence: 'HIGH',
               type: 'Architectural Violation',
               evidence: `Forbidden Import: '${moduleSpecifier}' detected in page/routing layer at line ${imp.getStartLineNumber()}.`
            });
          }
        }
      });
    }

    return { critical, findings };
  }
}
"""

files["rules/DirectFetchRule.ts"] = """\
import { Rule, Finding } from '../types/finding';
import { SyntaxKind } from 'ts-morph';

export class DirectFetchRule implements Rule {
  name = "DirectFetchRule";

  run(sourceFile: any, changedLines: number[], isNewFile: boolean): { critical: string[], findings: Finding[] } {
    const critical: string[] = [];
    const findings: Finding[] = [];
    const filePath = sourceFile.getFilePath().replace(/\\\\/g, '/');
    
    const isChanged = (node: any) => {
      const start = node.getStartLineNumber();
      const end = node.getEndLineNumber();
      return changedLines.some(l => l >= start && l <= end);
    };

    if (filePath.includes('/components/')) {
      const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
      for (const call of calls) {
        if (isChanged(call)) {
          const name = call.getExpression().getText();
          if (name === 'fetch' || name === 'axios' || name === 'axios.get' || name === 'axios.post') {
            findings.push({
              severity: 'HIGH',
              confidence: 'HIGH',
              type: 'Architectural Violation',
              evidence: `Data fetching ('${name}') detected directly in UI component at line ${call.getStartLineNumber()}.`
            });
          }
        }
      }
    }

    return { critical, findings };
  }
}
"""

files["rules/LargeFunctionRule.ts"] = """\
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

        if (length > 150) {
           findings.push({
             severity: 'MEDIUM',
             confidence: 'HIGH',
             type: 'Code Smell',
             evidence: `Function '${name}' is ${length} lines long (exceeds 150 limit) at line ${fn.getStartLineNumber()}.`
           });
        }
      }
    }

    return { critical, findings };
  }
}
"""

files["rules/SignatureChangeRule.ts"] = """\
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
        
        if (signatureChanged) {
           findings.push({
             severity: 'HIGH',
             confidence: 'MEDIUM',
             type: 'Signature Change',
             evidence: `Function '${name}' definition changed around line ${startLine}. This may break downstream callers.`
           });
        }
      }
    }

    return { critical, findings };
  }
}
"""

files["rules/ReactHookBugRule.ts"] = """\
import { Rule, Finding } from '../types/finding';
import { Node, SyntaxKind } from 'ts-morph';

export class ReactHookBugRule implements Rule {
  name = "ReactHookBugRule";

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
        const expr = call.getExpression();
        const name = expr.getText();
        
        if (['useEffect', 'useCallback', 'useMemo'].includes(name)) {
          const args = call.getArguments();
          if (args.length < 2) {
            findings.push({
              severity: 'HIGH',
              confidence: 'HIGH',
              type: 'React Hook Bug',
              evidence: `Missing dependency array in '${name}' at line ${call.getStartLineNumber()}.`
            });
          } else if (args.length === 2 && Node.isArrayLiteralExpression(args[1])) {
            const bodyNode = args[0];
            const arrayNode = args[1];
            const arrayText = arrayNode.getText();
            
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
                  const declStart = declarations[0].getStart();
                  if (declStart < bodyNode.getStart() || declStart > bodyNode.getEnd()) {
                     if (!arrayText.includes(idName)) {
                       findings.push({
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

    return { critical, findings };
  }
}
"""

files["rules/DangerousApiRule.ts"] = """\
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
"""

files["rules/HardcodedSecretRule.ts"] = """\
import { Rule, Finding } from '../types/finding';
import { Node, SyntaxKind } from 'ts-morph';

export class HardcodedSecretRule implements Rule {
  name = "HardcodedSecretRule";

  run(sourceFile: any, changedLines: number[], isNewFile: boolean): { critical: string[], findings: Finding[] } {
    const critical: string[] = [];
    const findings: Finding[] = [];
    
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

    return { critical, findings };
  }
}
"""

files["rules/index.ts"] = """\
import { DbImportRule } from './DbImportRule';
import { DirectFetchRule } from './DirectFetchRule';
import { LargeFunctionRule } from './LargeFunctionRule';
import { SignatureChangeRule } from './SignatureChangeRule';
import { ReactHookBugRule } from './ReactHookBugRule';
import { DangerousApiRule } from './DangerousApiRule';
import { HardcodedSecretRule } from './HardcodedSecretRule';

export const rules = [
  new DbImportRule(),
  new DirectFetchRule(),
  new LargeFunctionRule(),
  new SignatureChangeRule(),
  new ReactHookBugRule(),
  new DangerousApiRule(),
  new HardcodedSecretRule()
];
"""

files["analysis/analyzeProject.ts"] = """\
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
  const lines = sourceFile.getFullText().split('\\n');
  const start = Math.max(0, centerLine - pad - 1);
  const end = Math.min(lines.length, centerLine + pad);
  return lines.slice(start, end).join('\\n');
}

function calculateImpactScore(refs: Node[], changedFilePath: string): { score: number, details: string } {
  let score = 0;
  for (const ref of refs) {
    const refPath = ref.getSourceFile().getFilePath().replace(/\\\\/g, '/');
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
  let contextParts: string[] = ["## Context Snippets\\n"];

  for (const [file, lines] of changes.entries()) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
    
    let sourceFile = project.getSourceFile(path.join(process.cwd(), file));
    if (!sourceFile) {
      sourceFile = project.addSourceFileAtPathIfExists(path.join(process.cwd(), file));
    }
    if (!sourceFile) continue;

    const filePath = sourceFile.getFilePath().replace(/\\\\/g, '/');
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
      contextParts.push(`### Changed File: ${file} (lines ${group[0]}-${group[group.length - 1]})\\n\`\`\`typescript\\n${snippet}\\n\`\`\`\\n`);
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
                contextParts.push(`### Caller to '${nameNode.getText()}' in ${path.relative(process.cwd(), refFile.getFilePath())}\\n\`\`\`typescript\\n${getSnippet(refFile, refLine, 8)}\\n\`\`\`\\n`);
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
"""

files["llm/postReviewToLLM.ts"] = """\
import OpenAI from 'openai';
import { Finding } from '../types/finding';

export async function postReviewToLLM(finalContext: string, allFindings: Finding[], impactAnalysis: string[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Warning: GEMINI_API_KEY environment variable not found. Skipping AI review gracefully.");
    process.exit(0);
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  });

  const { buildPrompt } = require('../prompts/reviewPrompt');
  const prompt = buildPrompt(finalContext);

  const jsonSchema = {
    type: "object",
    properties: {
      bugs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            changed_file: { type: "string" },
            changed_lines: { type: "string" },
            bug_category: { type: "string" },
            summary: { type: "string" },
            comment: { type: "string" },
            diff_fix_suggestion: { type: "string" }
          },
          required: ["changed_file", "changed_lines", "bug_category", "summary", "comment", "diff_fix_suggestion"],
          additionalProperties: false
        }
      }
    },
    required: ["bugs"],
    additionalProperties: false
  };

  try {
    const response = await client.chat.completions.create({
      model: "gemini-3.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "bug_report",
          schema: jsonSchema,
          strict: true
        }
      }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.log("##  AI Code Review\\n\\nFailed to generate review. No content returned.");
      return;
    }

    try {
      const data = JSON.parse(content);
      if (data.bugs && data.bugs.length > 0) {
        let markdown = "##  AI Code Review Findings\\n\\n";
        for (const bug of data.bugs) {
          markdown += `###    [${bug.bug_category.toUpperCase()}] ${bug.summary}\\n`;
          markdown += `**File:** \`${bug.changed_file}\` (Lines: ${bug.changed_lines})\\n\\n`;
          markdown += `${bug.comment}\\n\\n`;
          if (bug.diff_fix_suggestion) {
            markdown += `**Suggested Fix:**\\n\`\`\`diff\\n${bug.diff_fix_suggestion}\\n\`\`\`\\n\\n`;
          }
          markdown += `---\\n\\n`;
        }
        console.log(markdown);
      } else {
        console.log("##  AI Code Review\\n\\nNo significant risks or bugs found. LGTM! ✅");
      }
    } catch (e) {
      console.log("##  AI Code Review\\n\\nFailed to parse JSON response. Raw output:\\n\\n```json\\n" + content + "\\n```");
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error.message || error);
    let fallbackMarkdown = "## ⚠️ AI Reviewer Unavailable\\n\\n";
    fallbackMarkdown += `**Error Details:** \`${error.message || error}\`\\n\\n`;
    fallbackMarkdown += "The AI code reviewer is currently unavailable or timed out. Below are the deterministic AST findings and downstream impact analysis gathered by the engine:\\n\\n";
    
    fallbackMarkdown += "### 🔍 AST Findings (Facts)\\n";
    if (allFindings.length === 0) {
      fallbackMarkdown += "None.\\n\\n";
    } else {
      for (const f of allFindings) {
        fallbackMarkdown += `- **[Severity: ${f.severity}]** [Type: ${f.type}] - ${f.evidence}\\n`;
      }
      fallbackMarkdown += "\\n";
    }

    fallbackMarkdown += "### 💥 Downstream Impact Analysis\\n";
    if (impactAnalysis.length === 0) {
      fallbackMarkdown += "No major downstream impacts detected.\\n\\n";
    } else {
      fallbackMarkdown += impactAnalysis.join("\\n") + "\\n\\n";
    }
    
    console.log(fallbackMarkdown);
  }
}
"""

files["demo_review.ts"] = """\
import { Project } from 'ts-morph';
import path from 'path';
import { getChangedLines, getGitContext } from './git/getGitContext';
import { analyzeProject } from './analysis/analyzeProject';
import { postReviewToLLM } from './llm/postReviewToLLM';

async function runReview() {
  console.error("Building Smart Impact Context for Frontend...");
  
  const changes = getChangedLines();
  if (changes.size === 0) {
    console.error("No files changed.");
    return;
  }

  const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), "tsconfig.json"),
  });

  const { diffText, addedFiles } = getGitContext();
  const analysis = analyzeProject(project, changes, addedFiles);

  // Stage 1: Critical Check (Fail Fast)
  if (analysis.allCritical.length > 0) {
    console.error("❌ CRITICAL AST FINDINGS DETECTED - FAILING PR IMMEDIATELY");
    analysis.allCritical.forEach(c => console.error(" - " + c));
    
    let criticalMarkdown = "##    CRITICAL AST VIOLATIONS\\n\\n";
    criticalMarkdown += "The PR has been automatically failed due to critical structural or security violations:\\n\\n";
    analysis.allCritical.forEach(c => {
      criticalMarkdown += `- **${c}**\\n`;
    });
    console.log(criticalMarkdown);
    
    process.exit(1);
  }
  
  let finalContext = "";
  
  finalContext += "# 1. AST Findings (Facts)\\n";
  if (analysis.allFindings.length === 0) {
    finalContext += "None.\\n\\n";
  } else {
    for (const f of analysis.allFindings) {
      finalContext += `- [Severity: ${f.severity}] [Confidence: ${f.confidence}] [Type: ${f.type}]\\n  Evidence: ${f.evidence}\\n`;
    }
    finalContext += "\\n";
  }

  finalContext += "# 2. Downstream Impact Analysis\\n";
  if (analysis.impactAnalysis.length === 0) {
    finalContext += "No major downstream impacts detected.\\n\\n";
  } else {
    finalContext += analysis.impactAnalysis.join("\\n") + "\\n\\n";
  }

  finalContext += "# 3. Modified Public APIs\\n";
  if (analysis.modifiedPublicApis.length === 0) {
    finalContext += "None.\\n\\n";
  } else {
    finalContext += analysis.modifiedPublicApis.map(m => `- ${m}`).join("\\n") + "\\n\\n";
  }

  finalContext += "# 5. Code Context\\n";
  finalContext += "## Git Diff\\n```diff\\n" + diffText + "\\n```\\n";
  finalContext += analysis.contextParts.join("\\n");

  console.error("Context built. Sending to LLM...");
  await postReviewToLLM(finalContext, analysis.allFindings, analysis.impactAnalysis);
}

runReview().catch(error => {
  console.error(error);
  process.exit(1);
});
"""

for rel_path, content in files.items():
    p = base_dir / rel_path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding='utf-8')
    print(f"Created: {p}")
