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
