import OpenAI from 'openai';
import { Finding } from '../types/finding';
import { buildPrompt } from '../prompts/reviewPrompt';

import fs from 'fs';
import path from 'path';

function loadRegistry(): any {
  // If a remote URL is provided (e.g. raw github gist URL), fetch it dynamically (mocked here by assuming env passing)
  // In a real environment, you'd fetch using top-level await or similar. 
  // For simplicity since this script runs synchronously right now, we will read the local config file
  // or expect the orchestrator to have fetched and saved it.
  try {
    // If testing locally, the file is in the backend repo relative to here, or passed in
    const registryPath = process.env.MODEL_REGISTRY_PATH || path.join(process.cwd(), "..", "wbl-backend", ".github", "scripts", "model_registry.json");
    if (fs.existsSync(registryPath)) {
      return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    } else {
      console.warn(`[Warning] Registry file not found at ${registryPath}. Falling back to hardcoded defaults.`);
    }
  } catch (e: any) {
    console.warn(`[Warning] Failed to load registry: ${e.message}. Falling back to hardcoded defaults.`);
  }
  
  // Ultimate fail-safe
  return {
    MODEL_CAPABILITIES: {
      "deepseek-reasoner": ["reasoning", "coding"],
      "gemini-2.5-pro": ["reasoning", "large_context"],
      "gpt-4o": ["reasoning", "coding", "large_context"],
      "deepseek-chat": ["balanced", "coding"],
      "gemini-3.5-flash": ["fast", "large_context"],
      "gpt-4o-mini": ["fast", "balanced"],
      "gemini-3.1-flash-lite": ["fast", "cost_efficient"]
    },
    MODEL_SCORES: {
      "deepseek-reasoner": 10,
      "gemini-2.5-pro": 9,
      "gpt-4o": 8,
      "deepseek-chat": 8,
      "gemini-3.5-flash": 7,
      "gpt-4o-mini": 6,
      "gemini-3.1-flash-lite": 5
    },
    TAG_WEIGHTS: {"reasoning": 5, "coding": 3, "large_context": 2, "balanced": 1, "fast": 1, "cost_efficient": 0}
  };
}

const hardcodedDefaults = {
    MODEL_CAPABILITIES: {
      "deepseek-reasoner": ["reasoning", "coding"],
      "gemini-2.5-pro": ["reasoning", "coding", "large_context"],
      "gpt-4o": ["reasoning", "coding", "large_context"],
      "deepseek-chat": ["balanced", "coding"],
      "gemini-3.5-flash": ["fast", "large_context"],
      "gpt-4o-mini": ["fast", "balanced"],
      "gemini-3.1-flash-lite": ["fast", "cost_efficient"]
    },
    MODEL_SCORES: {
      "deepseek-reasoner": 10,
      "gemini-2.5-pro": 9,
      "gpt-4o": 8,
      "deepseek-chat": 8,
      "gemini-3.5-flash": 7,
      "gpt-4o-mini": 6,
      "gemini-3.1-flash-lite": 5
    },
    TAG_WEIGHTS: {"reasoning": 5, "coding": 3, "large_context": 2, "balanced": 1, "fast": 1, "cost_efficient": 0}
};

const REGISTRY = loadRegistry();

let MODEL_CAPABILITIES: Record<string, Set<string>> = {};
if (REGISTRY.models) {
  for (const [k, v] of Object.entries(REGISTRY.models)) {
    const model = v as any;
    if (model.verified) {
      MODEL_CAPABILITIES[k] = new Set(model.caps || []);
    }
  }
} else if (REGISTRY.MODEL_CAPABILITIES) {
  for (const [k, v] of Object.entries(REGISTRY.MODEL_CAPABILITIES)) {
    MODEL_CAPABILITIES[k] = new Set(v as string[]);
  }
}

// If the registry provided zero verified models (or the JSON was empty/invalid), fallback to hardcoded defaults
if (Object.keys(MODEL_CAPABILITIES).length === 0) {
  console.warn("[Warning] Registry provided zero verified models. Falling back to internal hardcoded models.");
  for (const [k, v] of Object.entries(hardcodedDefaults.MODEL_CAPABILITIES)) {
    MODEL_CAPABILITIES[k] = new Set(v as string[]);
  }
}

const MODEL_SCORES: Record<string, number> = REGISTRY.MODEL_SCORES || hardcodedDefaults.MODEL_SCORES;
const TAG_WEIGHTS: Record<string, number> = REGISTRY.TAG_WEIGHTS || hardcodedDefaults.TAG_WEIGHTS;

function determineModelsToTry(metadata: any): string[] {
  const requiredTags = new Set<string>();

  if ((metadata.signature_changes || 0) > 0) {
    requiredTags.add("reasoning");
  }
  if (metadata.impact_score === "HIGH") {
    requiredTags.add("reasoning");
  }
  if ((metadata.architecture_violations || 0) > 0) {
    requiredTags.add("coding");
  }
  if ((metadata.lines_changed || 0) >= 300) {
    requiredTags.add("large_context");
  }
  if (requiredTags.size === 0) {
    requiredTags.add("fast");
  }

  function scoreModel(modelName: string): number {
    const modelTags = MODEL_CAPABILITIES[modelName];
    const matchedTags = new Set([...requiredTags].filter(x => modelTags.has(x)));
    
    let tagScore = 0;
    matchedTags.forEach(tag => {
      tagScore += (TAG_WEIGHTS[tag] || 0);
    });
    
    const inherentScore = MODEL_SCORES[modelName] || 0;
    return tagScore + inherentScore;
  }

  const sortedModels = Object.keys(MODEL_CAPABILITIES).sort((a, b) => scoreModel(b) - scoreModel(a));
  return sortedModels;
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
  } else if (model.startsWith("gpt") || model.startsWith("o1") || model.startsWith("o3")) {
    const key = process.env.OPENAI_API_KEY || "";
    const keys = key.trim() ? [key.trim()] : [];
    return { baseURL: undefined, keys };
  }
  return { baseURL: undefined, keys: [] };
}

export async function postReviewToLLM(finalContext: string, allFindings: Finding[], impactAnalysis: string[], metadata?: any, securityPrimitives: any[] = []) {
  if (!metadata) metadata = { impact_score: "LOW", signature_changes: 0, architecture_violations: 0, lines_changed: 0 };

  if (securityPrimitives.length > 0) {
    finalContext += "\n# 6. AST Security Primitives\n";
    finalContext += "These are deterministic sinks found by the AST. Treat them as factual.\n```json\n";
    const minifiedPrimitives = securityPrimitives.map(p => ({
      id: p.id, kind: p.kind, owasp: p.owasp, line: p.line, evidence: p.evidence
    }));
    finalContext += JSON.stringify(minifiedPrimitives, null, 2) + "\n```\n\n";
  }

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
            diff_fix_suggestion: { type: "string" },
            confidence: { type: "number" },
            owasp_category: { type: "string" },
            concrete_exploit_path: { type: "string" },
            ast_primitive_id: { type: "string" }
          },
          required: ["changed_file", "changed_lines", "bug_category", "summary", "comment", "diff_fix_suggestion"],
          additionalProperties: false
        }
      }
    },
    required: ["bugs"],
    additionalProperties: false
  };

  const modelsToTry = determineModelsToTry(metadata);

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
        
        let responseFormat: any = {
          type: "json_schema",
          json_schema: {
            name: "bug_report",
            schema: jsonSchema
          }
        };
        
        let finalPrompt = prompt;
        if (model.startsWith("deepseek")) {
          responseFormat = { type: "json_object" };
          finalPrompt += `\n\nYou MUST return your response as a JSON object matching this exact schema:\n${JSON.stringify(jsonSchema)}`;
        }

        const response = await client.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: finalPrompt }],
          response_format: responseFormat
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
        continue; // Try the next available API key in the list
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
      let hasCriticalSecurity = false;
      let blockingBug: any = null;

      for (const bug of data.bugs) {
        if (bug.bug_category.toLowerCase() === "security" && bug.confidence >= 0.95 && bug.owasp_category && bug.concrete_exploit_path && bug.ast_primitive_id) {
          const primitive = securityPrimitives.find(p => p.id === bug.ast_primitive_id);
          if (primitive) {
            const isFileMatch = bug.changed_file.replace(/\\/g, '/').endsWith(primitive.file.split('/').pop());
            const lineMatch = bug.changed_lines.includes(primitive.line.toString()) || Math.abs(parseInt(bug.changed_lines.split('-')[0]) - primitive.line) <= 10;
            
            if (isFileMatch && lineMatch) {
              hasCriticalSecurity = true;
              blockingBug = bug;
              break;
            }
          }
        }
      }

      if (hasCriticalSecurity && blockingBug) {
        console.error(`\n[!] FATAL: Blocking merge.`);
        console.error(`SEC ID: ${blockingBug.ast_primitive_id}`);
        console.error(`File: ${blockingBug.changed_file}:${blockingBug.changed_lines}`);
        console.error(`OWASP: ${blockingBug.owasp_category}`);
        console.error(`Confidence: ${blockingBug.confidence}`);
        console.error(`\nAI Reviewer detected a high-confidence OWASP violation that perfectly matches a deterministic AST sink. Exploit Path:\n${blockingBug.concrete_exploit_path}`);
        process.exit(1);
      }

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
