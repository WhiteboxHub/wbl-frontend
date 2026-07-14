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
    console.error(" CRITICAL AST FINDINGS DETECTED - FAILING PR IMMEDIATELY");
    analysis.allCritical.forEach(c => console.error(" - " + c));
    
    let criticalMarkdown = "##    CRITICAL AST VIOLATIONS\n\n";
    criticalMarkdown += "The PR has been automatically failed due to critical structural or security violations:\n\n";
    analysis.allCritical.forEach(c => {
      criticalMarkdown += `- **${c}**\n`;
    });
    console.log(criticalMarkdown);
    
    process.exit(1);
  }
  
  let finalContext = "";
  
  finalContext += "# 1. AST Findings (Facts)\n";
  if (analysis.allFindings.length === 0) {
    finalContext += "None.\n\n";
  } else {
    for (const f of analysis.allFindings) {
      finalContext += `- [Severity: ${f.severity}] [Confidence: ${f.confidence}] [Type: ${f.type}]\n  Evidence: ${f.evidence}\n`;
    }
    finalContext += "\n";
  }

  finalContext += "# 2. Downstream Impact Analysis\n";
  if (analysis.impactAnalysis.length === 0) {
    finalContext += "No major downstream impacts detected.\n\n";
  } else {
    finalContext += analysis.impactAnalysis.join("\n") + "\n\n";
  }

  finalContext += "# 3. Modified Public APIs\n";
  if (analysis.modifiedPublicApis.length === 0) {
    finalContext += "None.\n\n";
  } else {
    finalContext += analysis.modifiedPublicApis.map(m => `- ${m}`).join("\n") + "\n\n";
  }

  finalContext += "# 5. Code Context\n";
  finalContext += "## Git Diff\n```diff\n" + diffText + "\n```\n";
  finalContext += analysis.contextParts.join("\n");

  const impactScore = analysis.impactAnalysis.some(i => i.includes("HIGH")) ? "HIGH" : "LOW";
  const signatureChanges = analysis.modifiedPublicApis.length;
  const architectureViolations = analysis.allCritical.length > 0 ? 1 : 0;
  const linesChanged = Array.from(changes.values()).reduce((sum, lines) => sum + lines.length, 0);

  const metadata = {
    impact_score: impactScore,
    signature_changes: signatureChanges,
    architecture_violations: architectureViolations,
    lines_changed: linesChanged
  };

  console.error("Context built. Sending to LLM...");
  await postReviewToLLM(finalContext, analysis.allFindings, analysis.impactAnalysis, metadata, analysis.allSecurityPrimitives);
}

runReview().catch(error => {
  console.error(error);
  process.exit(1);
});
