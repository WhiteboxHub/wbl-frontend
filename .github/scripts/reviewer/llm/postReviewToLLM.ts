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
      console.log("##  AI Code Review\n\nFailed to generate review. No content returned.");
      return;
    }

    try {
      const data = JSON.parse(content);
      if (data.bugs && data.bugs.length > 0) {
        let markdown = "##  AI Code Review Findings\n\n";
        for (const bug of data.bugs) {
          markdown += `###    [${bug.bug_category.toUpperCase()}] ${bug.summary}\n`;
          markdown += `**File:** \`${bug.changed_file}\` (Lines: ${bug.changed_lines})\n\n`;
          markdown += `${bug.comment}\n\n`;
          if (bug.diff_fix_suggestion) {
            markdown += `**Suggested Fix:**\n\`\`\`diff\n${bug.diff_fix_suggestion}\n\`\`\`\n\n`;
          }
          markdown += `---\n\n`;
        }
        console.log(markdown);
      } else {
        console.log("##  AI Code Review\n\nNo significant risks or bugs found. LGTM! ✅");
      }
    } catch (e) {
      console.log("##  AI Code Review\n\nFailed to parse JSON response. Raw output:\n\n```json\n" + content + "\n```");
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error.message || error);
    let fallbackMarkdown = "##  AI Reviewer Unavailable\n\n";
    fallbackMarkdown += `**Error Details:** \`${error.message || error}\`\n\n`;
    fallbackMarkdown += "The AI code reviewer is currently unavailable or timed out. Below are the deterministic AST findings and downstream impact analysis gathered by the engine:\n\n";
    
    fallbackMarkdown += "###  AST Findings (Facts)\n";
    if (allFindings.length === 0) {
      fallbackMarkdown += "None.\n\n";
    } else {
      for (const f of allFindings) {
        fallbackMarkdown += `- **[Severity: ${f.severity}]** [Type: ${f.type}] - ${f.evidence}\n`;
      }
      fallbackMarkdown += "\n";
    }

    fallbackMarkdown += "###  Downstream Impact Analysis\n";
    if (impactAnalysis.length === 0) {
      fallbackMarkdown += "No major downstream impacts detected.\n\n";
    } else {
      fallbackMarkdown += impactAnalysis.join("\n") + "\n\n";
    }
    
    console.log(fallbackMarkdown);
  }
}
