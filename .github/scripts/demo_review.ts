import { execSync } from 'child_process';
import { Project, Node, SyntaxKind, Identifier } from 'ts-morph';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

interface Finding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  evidence: string;
}

// 1. Get changed lines from git diff
function getChangedLines(): Map<string, number[]> {
  const targetBranch = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
  const diffOutput = execSync(`git diff --unified=0 ${targetBranch}...HEAD`, { encoding: 'utf-8' });
  const lines = diffOutput.split('\n');
  const changes = new Map<string, number[]>();
  let currentFile = '';

  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.substring(6);
    } else if (line.startsWith('@@ ') && currentFile) {
      const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
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

// 3. Static Analysis Rules Engine (AST)
function runStaticAnalysis(sourceFile: any, changedLines: number[]): { critical: string[], findings: Finding[] } {
  const critical: string[] = [];
  const findings: Finding[] = [];
  
  const isChanged = (node: Node) => {
    const start = node.getStartLineNumber();
    const end = node.getEndLineNumber();
    return changedLines.some(l => l >= start && l <= end);
  };

  const filePath = sourceFile.getFilePath().replace(/\\/g, '/');

  // Architecture Rule 1: Pages should not import DB layer
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

  // Architecture Rule 2: Components should not use fetch/axios directly
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

  // Functions (Large functions + Signature changes)
  const functions = sourceFile.getFunctions();
  const arrowFunctions = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);
  const methods = sourceFile.getClasses().flatMap((c: any) => c.getMethods());
  
  for (const fn of [...functions, ...arrowFunctions, ...methods]) {
    if (isChanged(fn as Node)) {
      const length = (fn as Node).getEndLineNumber() - (fn as Node).getStartLineNumber();
      let name = 'anonymous';
      if (Node.isFunctionDeclaration(fn) || Node.isMethodDeclaration(fn)) name = fn.getName() || 'anonymous';
      else if (Node.isArrowFunction(fn)) {
          const parent = fn.getParent();
          if (Node.isVariableDeclaration(parent)) name = parent.getName();
      }

      if (length > 150) {
         findings.push({
           severity: 'MEDIUM',
           confidence: 'HIGH',
           type: 'Code Smell',
           evidence: `Function '${name}' is ${length} lines long (exceeds 150 limit) at line ${(fn as Node).getStartLineNumber()}.`
         });
      }

      // Signature Change Detection
      const defLine = (fn as Node).getStartLineNumber();
      if (changedLines.includes(defLine)) {
         findings.push({
           severity: 'HIGH',
           confidence: 'MEDIUM',
           type: 'Signature Change',
           evidence: `Function '${name}' definition changed at line ${defLine}. This may break downstream callers.`
         });
      }
    }
  }

  // React Rules & Dangerous APIs
  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const call of calls) {
    if (isChanged(call)) {
      const expr = call.getExpression();
      const name = expr.getText();
      
      // Advanced React Dependency Arrays
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
                       confidence: 'MEDIUM', // Intent is hard to prove statically
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
      
      // Dangerous API
      if (name === 'eval') {
        critical.push(`Usage of dangerous 'eval()' API detected at line ${call.getStartLineNumber()}.`);
      }
    }
  }

  // Critical Check: Data-Flow-Aware Secrets
  const strings = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  for (const str of strings) {
    if (isChanged(str)) {
      const val = str.getLiteralText();
      if (val.length < 5) continue;
      
      const parent = str.getParent();
      // Simple assignment check: const SECRET = "..."
      if (Node.isVariableDeclaration(parent)) {
        const varName = parent.getName().toLowerCase();
        if (varName.includes('secret') || varName.includes('password') || varName.includes('token') || varName.includes('api_key')) {
          if (!val.includes('ENV_') && !val.includes('process.env')) {
             critical.push(`Potential hardcoded secret assigned to '${parent.getName()}' at line ${str.getStartLineNumber()}.`);
          }
        }
      }
      // Binary expression check: process.env.KEY || "secret"
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

function calculateBlastRadius(refs: Node[], changedFilePath: string): { score: number, details: string } {
  let score = 0;
  for (const ref of refs) {
    const refPath = ref.getSourceFile().getFilePath().replace(/\\/g, '/');
    if (refPath.includes('/api/')) score += 5;
    else if (refPath.includes('/hooks/') || refPath.includes('/shared/')) score += 4;
    else if (refPath.includes('/components/') || refPath.includes('/pages/') || refPath.includes('/app/')) score += 2;
    else score += 1;
  }
  
  // Public API Multiplier
  if (changedFilePath.includes('/api/') || changedFilePath.includes('/hooks/') || changedFilePath.includes('/services/')) {
    score *= 2;
  }
  
  if (score > 10) return { score, details: 'HIGH' };
  if (score > 3) return { score, details: 'MEDIUM' };
  return { score, details: 'LOW' };
}

const severityValue = {
  'CRITICAL': 4,
  'HIGH': 3,
  'MEDIUM': 2,
  'LOW': 1
};

// 4. Main Review Logic
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

  let contextParts = ["# 5. Code Context\n"];
  
  try {
    const targetBranch = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
    const diffText = execSync(`git diff --unified=3 ${targetBranch}...HEAD`, { encoding: 'utf-8' });
    contextParts.push("## Git Diff\n```diff\n" + diffText + "\n```\n");
  } catch (e) {
    console.error("Failed to get git diff", e);
  }

  contextParts.push("## Context Snippets\n");

  let allCritical: string[] = [];
  let allFindings: Finding[] = [];
  let blastRadiusAnalysis: string[] = [];
  let modifiedPublicApis: string[] = [];

  for (const [file, lines] of changes.entries()) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
    
    const sourceFile = project.getSourceFile(path.join(process.cwd(), file));
    if (!sourceFile) continue;

    const filePath = sourceFile.getFilePath().replace(/\\/g, '/');
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
              const { score, details } = calculateBlastRadius(refs, filePath);
              blastRadiusAnalysis.push(`- Symbol '${nameNode.getText()}' (Score: ${score}, Blast Radius: ${details}, References: ${refs.length})`);
              
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
    
    const { critical, findings } = runStaticAnalysis(sourceFile, lines);
    if (critical.length > 0) {
      allCritical.push(...critical.map(c => `[${file}] ${c}`));
    }
    if (findings.length > 0) {
      allFindings.push(...findings);
    }
  }

  // Stage 1: Critical Check (Fail Fast)
  if (allCritical.length > 0) {
    console.error("❌ CRITICAL AST FINDINGS DETECTED - FAILING PR IMMEDIATELY");
    allCritical.forEach(c => console.error(" - " + c));
    
    let criticalMarkdown = "## 🚨 CRITICAL AST VIOLATIONS\n\n";
    criticalMarkdown += "The PR has been automatically failed due to critical structural or security violations:\n\n";
    allCritical.forEach(c => {
      criticalMarkdown += `- **${c}**\n`;
    });
    console.log(criticalMarkdown);
    
    process.exit(1);
  }
  
  let finalContext = "";
  
  finalContext += "# 1. AST Findings (Facts)\n";
  if (allFindings.length === 0) {
    finalContext += "None.\n\n";
  } else {
    for (const f of allFindings) {
      finalContext += `- [Severity: ${f.severity}] [Confidence: ${f.confidence}] [Type: ${f.type}]\n  Evidence: ${f.evidence}\n`;
    }
    finalContext += "\n";
  }

  finalContext += "# 2. Blast Radius Analysis\n";
  if (blastRadiusAnalysis.length === 0) {
    finalContext += "No major downstream impacts detected.\n\n";
  } else {
    finalContext += blastRadiusAnalysis.join("\n") + "\n\n";
  }

  finalContext += "# 3. Modified Public APIs\n";
  if (modifiedPublicApis.length === 0) {
    finalContext += "None.\n\n";
  } else {
    finalContext += modifiedPublicApis.map(m => `- ${m}`).join("\n") + "\n\n";
  }

  finalContext += contextParts.join("\n");

  console.error("Context built. Sending to LLM...");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY environment variable not found.");
    process.exit(1);
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  });

  const prompt = `You are a senior code reviewer analyzing a PR.

${finalContext}

INSTRUCTIONS:
Do not verify AST findings. Assume AST findings are correct.
Focus only on:
- business impact
- operational risk
- regression risk
- migration concerns
- testing recommendations

When reviewing, pay special attention to functions with HIGH Blast Radius or Modified Public APIs.

If no bugs found, return empty bugs array.`;

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
      console.log("## 🤖 AI Code Review\n\nFailed to generate review. No content returned.");
      return;
    }

    try {
      const data = JSON.parse(content);
      if (data.bugs && data.bugs.length > 0) {
        let markdown = "## 🤖 AI Code Review Findings\n\n";
        for (const bug of data.bugs) {
          markdown += `### 🚨 [${bug.bug_category.toUpperCase()}] ${bug.summary}\n`;
          markdown += `**File:** \`${bug.changed_file}\` (Lines: ${bug.changed_lines})\n\n`;
          markdown += `${bug.comment}\n\n`;
          if (bug.diff_fix_suggestion) {
            markdown += `**Suggested Fix:**\n\`\`\`diff\n${bug.diff_fix_suggestion}\n\`\`\`\n\n`;
          }
          markdown += `---\n\n`;
        }
        console.log(markdown);
      } else {
        console.log("## 🤖 AI Code Review\n\nNo significant risks or bugs found. LGTM! ✅");
      }
    } catch (e) {
      console.log("## 🤖 AI Code Review\n\nFailed to parse JSON response. Raw output:\n\n```json\n" + content + "\n```");
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error.message || error);
    let fallbackMarkdown = "## ⚠️ AI Reviewer Unavailable\n\n";
    fallbackMarkdown += "The AI code reviewer is currently unavailable or timed out. Below are the deterministic AST findings and blast radius analysis gathered by the engine:\n\n";
    
    fallbackMarkdown += "### 🔍 AST Findings (Facts)\n";
    if (allFindings.length === 0) {
      fallbackMarkdown += "None.\n\n";
    } else {
      for (const f of allFindings) {
        fallbackMarkdown += `- **[Severity: ${f.severity}]** [Type: ${f.type}] - ${f.evidence}\n`;
      }
      fallbackMarkdown += "\n";
    }

    fallbackMarkdown += "### 💥 Blast Radius Analysis\n";
    if (blastRadiusAnalysis.length === 0) {
      fallbackMarkdown += "No major downstream impacts detected.\n\n";
    } else {
      fallbackMarkdown += blastRadiusAnalysis.join("\n") + "\n\n";
    }
    
    console.log(fallbackMarkdown);
  }
}

runReview().catch(console.error);
