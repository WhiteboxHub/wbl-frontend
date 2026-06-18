import OpenAI from 'openai';
import { Finding } from '../types/finding';
import { buildPrompt } from '../prompts/reviewPrompt';

function determineModelsToTry(prompt: string): string[] {
  const isComplex = prompt.includes("Downstream Impact: HIGH") || prompt.includes("Architectural Violation");
  const lines = prompt.split('\n').length;
  
  if (isComplex) {
    return ["deepseek-reasoner", "gemini-2.5-pro", "gpt-4o", "gemini-2.5-flash"];
  } else if (lines < 300) {
    return ["gemini-2.5-flash-lite", "gpt-4o-mini"];
  } else {
    return ["gemini-2.5-flash", "gpt-4o-mini", "deepseek-chat"];
  }
}

function getProviderConfig(model: string): { baseURL: string | undefined, keys: string[] } {
  if (model.startsWith("gemini")) {
    const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
    const keys = keysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
    return { baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", keys };
  } else if (model.startsWith("deepseek")) {
    const key = process.env.DEEPSEEK_API_KEY || "";
    const keys = key.trim() ? [key.trim()] : [];
    return { baseURL: "https://api.deepseek.com", keys };
  } else if (model.startsWith("gpt") || model.startsWith("o1")) {
    const key = process.env.OPENAI_API_KEY || "";
    const keys = key.trim() ? [key.trim()] : [];
    return { baseURL: undefined, keys };
  }
  return { baseURL: undefined, keys: [] };
}

export async function postReviewToLLM(finalContext: string, allFindings: Finding[], impactAnalysis: string[]) {

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

  const modelsToTry = determineModelsToTry(prompt);

  let content: string | null = null;
  let lastError: any = null;
  let usedModel: string | null = null;

  for (const model of modelsToTry) {
    const { baseURL, keys } = getProviderConfig(model);
    if (keys.length === 0) {
      console.error(`[Warning] Skipping model ${model}: No API key configured for this provider.`);
      continue;
    }

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const clientOptions: any = {
        apiKey: key,
        timeout: 180000,
        maxRetries: 1
      };
      if (baseURL) {
        clientOptions.baseURL = baseURL;
      }
      const client = new OpenAI(clientOptions);

      try {
        console.error(`Attempting AI Review using model ${model} and API Key ${i + 1} of ${keys.length}...`);
        const response = await client.chat.completions.create({
          model: model,
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
        usedModel = model;
        break; // Success! Break out of the keys loop
      }
    } catch (error: any) {
      lastError = error;
      const status = error.status || error.statusCode;
      if (status === 429 || status === 503) {
        console.error(`[Warning] Model ${model} with API Key ${i + 1} hit rate limit or server busy (Status ${status}). Switching...`);
        continue;
      } else {
        console.error(`[Error] Fatal API error with Key ${i + 1}: ${error.message}`);
        break; // Don't retry on 400 Bad Request or invalid schemas
      }
    }
  }

  if (content) {
    break; // Success! Break out of the models loop
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
      let markdown = `##  AI Code Review Findings (Model: \`${usedModel}\`)\n\n`;
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
      console.log("##  AI Code Review\n\nNo significant risks or bugs found. LGTM! ");
    }
  } catch (e) {
    console.log("##  AI Code Review\n\nFailed to parse JSON response. Raw output:\n\n```json\n" + content + "\n```");
  }
}
