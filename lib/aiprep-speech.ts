/**
 * AI Prep Speech Recognition Utilities
 *
 * Provides phoneme and technical speech cleanups, sentence capitalization,
 * and deduplicating sequence alignment for real-time speech transcription.
 */

export const TECH_TERMS_REPLACEMENTS: [RegExp, string][] = [
  // Common Industry Acronyms & AI Terminology
  [/\bm\s*l\s*ops\b/gi, 'MLOps'],
  [/\bml\s*ops\b/gi, 'MLOps'],
  [/\benvelops\b/gi, 'MLOps'],
  [/\bgen\s*ai\b/gi, 'GenAI'],
  [/\bchain\s*ai\b/gi, 'GenAI'],
  [/\bagentic\s*ai\b/gi, 'Agentic AI'],
  [/\bagents?\s+with\s+ai\b/gi, 'Agentic AI'],
  [/\bl\s*l\s*m\s*s?\b/gi, 'LLMs'],
  [/\bn\s*l\s*p\b/gi, 'NLP'],
  [/\br\s*a\s*g\b/gi, 'RAG'],
  [/\ba\s*rack\s+system\b/gi, 'a RAG system'],
  [/\ba\s*p\s*i\s*s?\b/gi, 'APIs'],
  [/\bci\s*\/?\s*cd\b/gi, 'CI/CD'],
  [/\binto\s+and\b/gi, 'end-to-end'],
  [/\bin\s+to\s+end\b/gi, 'end-to-end'],
  [/\bproof\s+of\s+concept\b/gi, 'proof-of-concept'],
  [/\bvector\s+data\s*base\b/gi, 'vector database'],
  [/\bstructure\s+data\b/gi, 'unstructured data'],
  [/\bcoiry\s+pipeline\b/gi, 'query pipeline'],
  [/\binjection\s+pipeline\b/gi, 'ingestion pipeline'],
  [/\binjition\s+pipeline\b/gi, 'ingestion pipeline'],
  [/\bchanking\b/gi, 'chunking'],
];

export function cleanTechnicalSpeech(text: string): string {
  let cleaned = text;
  for (const [pattern, replacement] of TECH_TERMS_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned;
}

export function formatAsSentence(text: string): string {
  const trimmed = cleanTechnicalSpeech(text).trim();
  if (!trimmed) return '';
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.?!]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

export function appendDeduplicated(current: string, newSentence: string): string {
  const trimmedNew = cleanTechnicalSpeech(newSentence).trim();
  if (!trimmedNew) return current;
  const trimmedCur = current.trim();
  if (!trimmedCur) return trimmedNew;

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const curWords = trimmedCur.split(/\s+/);
  const newWords = trimmedNew.split(/\s+/);

  // 1. Suffix-prefix sequence alignment: check overlap of up to 30 words
  // allowing newWords to start at offset 0, 1, or 2 (skips clipped partial word fragments)
  for (let offset = 0; offset <= Math.min(2, newWords.length - 2); offset++) {
    const candidateNewWords = newWords.slice(offset);
    const maxOverlap = Math.min(curWords.length, candidateNewWords.length, 30);
    for (let len = maxOverlap; len >= 2; len--) {
      const curSlice = curWords.slice(curWords.length - len).map(clean).join(' ');
      const newSlice = candidateNewWords.slice(0, len).map(clean).join(' ');
      if (curSlice && curSlice === newSlice) {
        const remaining = candidateNewWords.slice(len);
        if (remaining.length === 0) return trimmedCur;
        return `${trimmedCur} ${remaining.join(' ')}`;
      }
    }
  }

  // 2. Full suffix / sentence deduplication
  const curClean = clean(trimmedCur);
  const newClean = clean(trimmedNew);
  if (curClean.endsWith(newClean)) {
    return trimmedCur;
  }

  const sentences = trimmedCur.split(/(?<=[.?!])\s+/).filter(Boolean);
  const lastOne = sentences[sentences.length - 1] || '';
  if (clean(lastOne) === newClean) {
    return trimmedCur;
  }

  return `${trimmedCur} ${trimmedNew}`;
}
