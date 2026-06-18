import OpenAI from 'openai';
import { Finding } from '../types/finding';
import { buildPrompt } from '../prompts/reviewPrompt';

export async function postReviewToLLM(finalContext: string, allFindings: Finding[], impactAnalysis: string[]) {
  const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
  if (!keysStr) {
    console.warn("Warning: GEMINI_API_KEYS or GEMINI_API_KEY environment variable not found. Skipping AI review gracefully.");
    process.exit(0);
  }

  const apiKeys = keysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
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

  let content: string | null = null;
  let lastError: any = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];
    const client = new OpenAI({
      apiKey: key,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      timeout: 180000, // 3 minutes timeout for large PRs
      maxRetries: 1    // Reduce retries per key so it fails over faster
    });

    try {
      console.error(`Attempting AI Review using API Key ${i + 1} of ${apiKeys.length}...`);
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

      content = response.choices[0].message.content;
      if (content) {
        break; // Success! Break out of the loop
      }
    } catch (error: any) {
      lastError = error;
      const status = error.status || error.statusCode;
      if (status === 429 || status === 503) {
        console.error(`[Warning] API Key ${i + 1} hit rate limit or server busy (Status ${status}). Switching to next key...`);
        continue;
      } else {
        console.error(`[Error] Fatal API error with Key ${i + 1}: ${error.message}`);
        break; // Don't retry on 400 Bad Request or invalid schemas
      }
    }
  }

  if (!content) {
    console.error("Gemini API Error: Exhausted all available API keys or hit a fatal error.");
    let fallbackMarkdown = "##  AI Reviewer Unavailable\n\n";
    if (lastError) {
      fallbackMarkdown += `**Error Details:** \`${lastError.message || lastError}\`\n\n`;
    }
    fallbackMarkdown += "The AI code reviewer hit rate limits across all keys or timed out. Below are the deterministic AST findings and downstream impact analysis gathered by the engine:\n\n";
    
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
}
