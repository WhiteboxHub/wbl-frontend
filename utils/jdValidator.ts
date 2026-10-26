/**
 * Client-Side Job Description (JD) Validator
 *
 * Implements deterministic structural and heuristic classification
 * to verify that uploaded documents or pasted text represent an AUTHENTIC Job Description.
 *
 * Designed with high precision to avoid false rejections on valid JDs:
 * - Normalizes quotes (curly ’/“” -> straight '/"), dashes, and spaces before matching.
 * - Anchors filename patterns to prevent accidental substring matches (e.g., "Standard" vs "nda").
 * - Requires multiple corroborating signals before flagging documents as non-JDs.
 * - Distinguishes between Hard Blocks (empty, gibberish, candidate resumes) and Soft Warnings
 *   (missing typical headings or ambiguous non-JD signals), allowing users to override soft warnings.
 * - Supports modern international headings ("Your role", "Your profile", "Who you are", "What you'll do").
 *
 * Runs completely on the client (0ms latency, zero API calls, zero console noise).
 */

export interface JDValidationDetails {
  wordCount: number;
  charCount: number;
  hasRoleSignals: boolean;
  hasResponsibilitySignals: boolean;
  hasRequirementSignals: boolean;
  isTooShort: boolean;
  isRepetitiveOrGibberish: boolean;
  isLikelyResume: boolean;
  isHardBlock: boolean;
  detectedDisqualifier?: string;
}

export interface JDValidationResult {
  isValid: boolean;          // true if passes all structural / substance criteria
  isWarning: boolean;        // true if it has a soft warning (user can override)
  isHardBlock: boolean;      // true ONLY if it cannot be used (empty, gibberish, resume)
  canProceedAnyway: boolean; // true if the candidate can click "Use this description anyway"
  error?: string;
  guidance?: string[];
  details: JDValidationDetails;
}

/**
 * Normalizes curly quotes, em/en-dashes, and non-breaking spaces into standard ASCII characters.
 */
export function normalizeText(text: string): string {
  return (text || '')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // curly single quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // curly double quotes
    .replace(/[\u2013\u2014]/g, '-')             // en-dash, em-dash
    .replace(/\u00A0/g, ' ')                     // non-breaking space
    .trim();
}

// ─── Heavy Disqualifier Dictionaries (Non-JD Documents) ────────────────────────

// Resume indicators: chronological employment date ranges
const RESUME_DATE_RANGES = /\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?(?:19|20)\d\d\s*[-–—]\s*(?:present|current|now|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?(?:19|20)\d\d)\b/gi;
const RESUME_SECTION_HEADERS = /(?:^|\n)\s*(?:[-*•#]+\s*)?(?:professional\s+summary|career\s+summary|work\s+experience|professional\s+experience|employment\s+history|work\s+history)\s*[:\n\-–]/i;
const RESUME_SPECIFIC_SIGNALS = [
  /\b(curriculum vitae|resume of|my resume|references available upon request|work authorization:?\s*(us citizen|green card|h1b)|ats resume)\b/i,
  /\b(my objective|career objective|professional summary:?(\s*i am|\s*motivated candidate|\s*results-driven))\b/i,
  /\b(i graduated|i have \d+\+? years of hands[- ]on experience in my career|my previous company|worked as an? \w+ at)\b/i,
];

// Study guides require at least 2 distinct patterns to avoid false positives on words like "handbook"
const STUDY_GUIDE_SIGNALS = [
  /\b(study guide|cheat sheet|course curriculum|course syllabus|lecture notes?|exam prep|mock interview questions?|interview prep guide|learning path|practice questions?)\b/i,
  /\b(in this (study )?guide|in this module|in this chapter|table of contents|concept summary|chapter \d+)\b/i,
  /\b(problem statement\s*[:-]|solution architecture\s*[:-]|review questions\s*[:-]|summary of concepts)\b/i,
];

// Technical tutorials require at least 2 distinct patterns
const TUTORIAL_SIGNALS = [
  /\b(in this (tutorial|walkthrough|guide)|how to build a|getting started with (python|react|fastapi|docker|aws)|step \d+\s*[:-]|click here to read|read more articles|min read|written by)\b/i,
  /\b(towards data science|medium\.com|freecodecamp|stack overflow|w3schools|dev\.to)\b/i,
];

// Software codebases / developer docs require at least 2 distinct patterns
const CODE_DOCS_SIGNALS = [
  /\b(api reference|installation instructions?|npm install|pip install|yarn add|git clone|docker run|curl -X)\b/i,
  /\b(license:?\s*mit|apache license|repository url|pull request|readme\.md)\b/i,
];

// Academic coursework requires at least 2 distinct patterns
const ACADEMIC_SIGNALS = [
  /\b(homework\s*(assignment)?\s*#?\d|assignment\s*#?\d|due date\s*[:-]|course instructor|professor\s+[a-z]|grading rubric|problem set \d+)\b/i,
  /\b(syllabus|course description|term project|literature review|references cited)\b/i,
];

// Cover letters require at least 2 distinct patterns
const COVER_LETTER_SIGNALS = [
  /\b(dear hiring manager|dear (?:mr\.|ms\.|recruiter|search committee))\b/i,
  /\b(i am writing to (?:apply for|express my (?:strong )?interest in)|please (?:find|accept) my (?:resume|application)|i would welcome the opportunity to discuss)\b/i,
  /\b(thank you for your time and consideration|sincerely,|respectfully,)\b/i,
];

// Business invoices & contracts require at least 2 distinct patterns (and must NOT flag "multi-tenant" or website footers)
const BUSINESS_DOC_SIGNALS = [
  /\b(invoice\s*#|billing statement|balance due|amount due|remit payment|payment terms\s*[:-]|wire transfer instructions)\b/i,
  /\b(lease agreement|tenant shall|landlord shall|premises located at|rent per month|security deposit)\b/i,
  /\b(governing law and jurisdiction|indemnification clause|limitation of liability|severability clause)\b/i,
];

// Anchored filename checks: avoids substring collision (e.g. "Standard" matching "nda")
const FILENAME_DISQUALIFIERS = [
  { regex: /(?:^|[._ -])(?:study[-_ ]*guide|syllabus|courseware|cheat[-_ ]*sheet)(?:[._ -]|$)/i, type: 'STUDY_GUIDE', label: 'Study Guide' },
  { regex: /(?:^|[._ -])(?:resume|curriculum[-_ ]*vitae|cv)(?:[._ -]|$)/i, type: 'RESUME', label: 'Candidate Resume' },
  { regex: /(?:^|[._ -])cover[-_ ]*letter(?:[._ -]|$)/i, type: 'COVER_LETTER', label: 'Cover Letter' },
  { regex: /(?:^|[._ -])(?:assignment|homework|lab[-_ ]*report)(?:[._ -]|$)/i, type: 'ACADEMIC', label: 'Academic Assignment' },
  { regex: /(?:^|[._ -])(?:readme)(?:[._ -]|$)/i, type: 'DOCS', label: 'Project README' },
  { regex: /(?:^|[._ -])(?:invoice|billing|receipt|\bnda\b|non[-_ ]*disclosure)(?:[._ -]|$)/i, type: 'BUSINESS', label: 'Invoice or Legal Agreement' },
];

// ─── Affirmative JD Structural Patterns ────────────────────────────────────────

const RESP_REGEX = /\b(?:key\s+|core\s+|primary\s+|main\s+)?responsibilities\b|\bwhat you(?:'ll| will) (?:do|be doing|bring)\b|\bwhat you will be working on\b|\b(?:your|the)\s+(?:role|mission|responsibilities|day[- ]to[- ]day)\b|\bduties\s*(?:include|and\s+responsibilities)?\b|\bscope of (?:work|the role)\b|\brole overview\b|\bposition summary\b/i;

const REQ_REGEX = /\b(?:basic\s+|minimum\s+|preferred\s+|required\s+)?(?:requirements|qualifications)(?:\s*(?:and|&)\s*(?:qualifications|requirements|skills|experience))?\s*[:\n\-–]|\bwhat (?:we(?:'re| are) looking for|you bring|you(?:'ll| will) need|we expect)\b|\b(?:must[- ]haves?|required skills|technical skills|skills (?:&|and) experience)\b|\b(?:your|candidate)\s+profile\b|\bwho you are\b|\bwho we are looking for\b/i;

const HEADER_ABOUT_ROLE = /(?:^|\n)\s*(?:[-*•#]+\s*)?(?:about (?:the )?(?:role|job|opportunity|position|company|us)|job (?:summary|overview|description)|position (?:summary|overview))\s*[:\n\-–]/i;
const HEADER_REQ_FIELDS = /(?:^|\n)\s*(?:[-*•#]+\s*)?(?:job\s+title|position|role|title|location|employment\s+type|reports\s+to|job\s+id|req\s+id)\s*[:\-–]/i;

const HIRING_CONTEXT_PATTERNS = [
  /\b(we are (?:looking for|seeking|hiring)|join our (?:team|company)|about the (?:role|job)|the ideal candidate|the successful candidate|you will be responsible for|equal opportunity employer|full[- ]time (?:role|position|opportunity)|competitive (?:salary|compensation)|comprehensive benefits|apply (?:now|for this (?:role|position))|seeking a qualified)\b/i,
];

const QUALIFICATION_EXPRESSIONS = [
  /\b(\d+\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:professional|relevant|hands[- ]on|industry)?\s*(?:experience|software development)|bachelor(?:'s)?(?:\s+degree)?\s+(?:in|or)|master(?:'s)?\s+degree|degree in computer science|proven track record|demonstrated proficiency|strong working knowledge)\b/i,
];

const REPETITIVE_CHARS_REGEX = /([a-zA-Z0-9])\1{7,}/;

/**
 * Validates whether the given text conforms to an authentic Job Description.
 * @param rawText The extracted or pasted job description text.
 * @param fileName Optional file name if the text was extracted from an uploaded document.
 */
export function validateJobDescription(rawText: string | null | undefined, fileName?: string): JDValidationResult {
  const text = normalizeText(rawText || '');

  // Basic counters
  const charCount = text.length;
  const words = text
    .split(/\s+/)
    .map((w) => w.replace(/^[^\w]+|[^\w]+$/g, ''))
    .filter(Boolean);
  const wordCount = words.length;

  const details: JDValidationDetails = {
    wordCount,
    charCount,
    hasRoleSignals: false,
    hasResponsibilitySignals: false,
    hasRequirementSignals: false,
    isTooShort: false,
    isRepetitiveOrGibberish: false,
    isLikelyResume: false,
    isHardBlock: false,
  };

  // ── 1. Empty Check (Hard Block) ──────────────────────────────────────────────
  if (!text || wordCount === 0) {
    details.isHardBlock = true;
    return {
      isValid: false,
      isWarning: false,
      isHardBlock: true,
      canProceedAnyway: false,
      error: 'Please paste or upload a job description to continue.',
      guidance: [
        'Copy the target job posting from LinkedIn, Indeed, or a company careers site',
        'Upload a PDF or Word document containing the job requirements',
      ],
      details,
    };
  }

  // ── 2. Repetitive Gibberish (Hard Block) ─────────────────────────────────────
  if (REPETITIVE_CHARS_REGEX.test(text)) {
    details.isRepetitiveOrGibberish = true;
    details.isHardBlock = true;
    return {
      isValid: false,
      isWarning: false,
      isHardBlock: true,
      canProceedAnyway: false,
      error: 'The provided text contains repetitive characters or gibberish. Please provide an authentic job description.',
      guidance: ['Ensure the text is copied cleanly without corrupted formatting.'],
      details,
    };
  }

  // ── 3. Minimum Length (Hard Block for empty/extremely short) ─────────────────
  if (wordCount < 30 || charCount < 150) {
    details.isTooShort = true;
    details.isHardBlock = true;
    return {
      isValid: false,
      isWarning: false,
      isHardBlock: true,
      canProceedAnyway: false,
      error: `The provided text is too brief (${wordCount} words). A complete Job Description with role duties and requirements is required.`,
      guidance: [
        'Include the full role title and company context',
        'Include the responsibilities or daily duties',
        'Include the required skills, qualifications, and tech stack',
      ],
      details,
    };
  }

  // Word uniqueness ratio
  const lowerWords = words.map((w) => w.toLowerCase());
  const uniqueWords = new Set(lowerWords);
  const uniquenessRatio = uniqueWords.size / wordCount;

  if (wordCount >= 30 && uniquenessRatio < 0.25) {
    details.isRepetitiveOrGibberish = true;
    details.isHardBlock = true;
    return {
      isValid: false,
      isWarning: false,
      isHardBlock: true,
      canProceedAnyway: false,
      error: 'The text appears to be repetitive spam. Please provide an actual job description.',
      guidance: ['Paste a standard job description with varied requirements and duties.'],
      details,
    };
  }

  // Alphanumeric density check
  const alphaNumericMatches = text.match(/[a-zA-Z0-9]/g);
  const alphaRatio = (alphaNumericMatches ? alphaNumericMatches.length : 0) / charCount;
  if (alphaRatio < 0.40) {
    details.isRepetitiveOrGibberish = true;
    details.isHardBlock = true;
    return {
      isValid: false,
      isWarning: false,
      isHardBlock: true,
      canProceedAnyway: false,
      error: 'The text contains too many non-text characters or symbols. Please provide standard job text.',
      guidance: ['Check that the document was converted properly and is not corrupted.'],
      details,
    };
  }

  // ── 4. Filename-Level Checks ────────────────────────────────────────────────
  if (fileName) {
    for (const disq of FILENAME_DISQUALIFIERS) {
      if (disq.regex.test(fileName)) {
        details.detectedDisqualifier = disq.type;
        const hasAnyResumeSignal =
          RESUME_SECTION_HEADERS.test(text) || RESUME_SPECIFIC_SIGNALS.some((p) => p.test(text));

        // Resume filename + resume signals is a hard block
        if (disq.type === 'RESUME' && hasAnyResumeSignal) {
          details.isLikelyResume = true;
          details.isHardBlock = true;
          return {
            isValid: false,
            isWarning: false,
            isHardBlock: true,
            canProceedAnyway: false,
            error: `The uploaded file (${fileName}) appears to be a candidate Resume or CV rather than a Job Description.`,
            guidance: [
              'Your candidate profile already contains your resume.',
              'Please upload or paste the Job Description for the role you want to practice for.',
            ],
            details,
          };
        }

        // Other filename warnings are soft warnings that the user can override
        return {
          isValid: false,
          isWarning: true,
          isHardBlock: false,
          canProceedAnyway: true,
          error: `The uploaded file name (${fileName}) suggests it may be a ${disq.label} rather than a Job Description.`,
          guidance: [
            'If this file contains your target job description, you can click "Use this description anyway" to proceed.',
          ],
          details,
        };
      }
    }
  }

  // ── 5. Definitive Resume Disqualifier (Hard Block) ───────────────────────────
  // Resumes are identified by multiple chronological work history dates AND resume sections/signals
  const dateRanges = text.match(RESUME_DATE_RANGES) || [];
  const hasResumeHeader = RESUME_SECTION_HEADERS.test(text);
  const hasResumeSignal = RESUME_SPECIFIC_SIGNALS.some((p) => p.test(text));

  if (dateRanges.length >= 2 && (hasResumeHeader || hasResumeSignal)) {
    details.isLikelyResume = true;
    details.isHardBlock = true;
    details.detectedDisqualifier = 'RESUME';
    return {
      isValid: false,
      isWarning: false,
      isHardBlock: true,
      canProceedAnyway: false,
      error: 'This document appears to be a candidate Resume or CV rather than a Job Description.',
      guidance: [
        'Your candidate profile already contains your resume.',
        'Please upload or paste the Job Description for the role you want to practice for.',
      ],
      details,
    };
  }

  // ── 6. Suspected Non-JD Documents (Soft Warnings, Require >= 2 signals) ──────
  const checkDisqualifier = (signals: RegExp[]) => {
    let count = 0;
    for (const sig of signals) {
      if (sig.test(text)) count++;
    }
    return count >= 2;
  };

  if (checkDisqualifier(STUDY_GUIDE_SIGNALS)) {
    details.detectedDisqualifier = 'STUDY_GUIDE';
    return {
      isValid: false,
      isWarning: true,
      isHardBlock: false,
      canProceedAnyway: true,
      error: 'This document appears to contain study guide or coursework material rather than an employer Job Description.',
      guidance: [
        'If this text is your target job description, you can click "Use this description anyway" to proceed.',
      ],
      details,
    };
  }

  if (checkDisqualifier(TUTORIAL_SIGNALS)) {
    details.detectedDisqualifier = 'TUTORIAL';
    return {
      isValid: false,
      isWarning: true,
      isHardBlock: false,
      canProceedAnyway: true,
      error: 'This document appears to be a technical article or tutorial rather than a Job Description.',
      guidance: [
        'If this text is your target job description, you can click "Use this description anyway" to proceed.',
      ],
      details,
    };
  }

  if (checkDisqualifier(CODE_DOCS_SIGNALS)) {
    details.detectedDisqualifier = 'CODE_DOCS';
    return {
      isValid: false,
      isWarning: true,
      isHardBlock: false,
      canProceedAnyway: true,
      error: 'This document appears to be software documentation or a code README rather than a Job Description.',
      guidance: [
        'If this text is your target job description, you can click "Use this description anyway" to proceed.',
      ],
      details,
    };
  }

  if (checkDisqualifier(ACADEMIC_SIGNALS)) {
    details.detectedDisqualifier = 'ACADEMIC';
    return {
      isValid: false,
      isWarning: true,
      isHardBlock: false,
      canProceedAnyway: true,
      error: 'This document appears to be an academic assignment or syllabus rather than a Job Description.',
      guidance: [
        'If this text is your target job description, you can click "Use this description anyway" to proceed.',
      ],
      details,
    };
  }

  if (checkDisqualifier(COVER_LETTER_SIGNALS)) {
    details.detectedDisqualifier = 'COVER_LETTER';
    return {
      isValid: false,
      isWarning: true,
      isHardBlock: false,
      canProceedAnyway: true,
      error: 'This document appears to be a candidate cover letter rather than an employer Job Description.',
      guidance: [
        'If this text is your target job description, you can click "Use this description anyway" to proceed.',
      ],
      details,
    };
  }

  if (checkDisqualifier(BUSINESS_DOC_SIGNALS)) {
    details.detectedDisqualifier = 'BUSINESS_DOC';
    return {
      isValid: false,
      isWarning: true,
      isHardBlock: false,
      canProceedAnyway: true,
      error: 'This document appears to be an invoice or legal agreement rather than a Job Description.',
      guidance: [
        'If this text is your target job description, you can click "Use this description anyway" to proceed.',
      ],
      details,
    };
  }

  // ── 7. Affirmative Structural Verification ──────────────────────────────────
  const hasResp = RESP_REGEX.test(text);
  const hasReq = REQ_REGEX.test(text);
  const hasAboutRole = HEADER_ABOUT_ROLE.test(text);
  const hasReqFields = HEADER_REQ_FIELDS.test(text);
  const hasHiringContext = HIRING_CONTEXT_PATTERNS.some((p) => p.test(text));
  const hasQualExpr = QUALIFICATION_EXPRESSIONS.some((p) => p.test(text));

  details.hasResponsibilitySignals = hasResp;
  details.hasRequirementSignals = hasReq || hasQualExpr;
  details.hasRoleSignals = hasAboutRole || hasReqFields || hasHiringContext;

  const hasStandardHeaders = hasResp && (hasReq || hasQualExpr);
  const hasHeaderPlusHiring = (hasResp || hasReq) && (hasHiringContext || hasAboutRole || hasReqFields);
  const hasStrongHiringFormat = hasHiringContext && hasQualExpr && (hasAboutRole || hasReqFields);

  if (hasStandardHeaders || hasHeaderPlusHiring || hasStrongHiringFormat) {
    return {
      isValid: true,
      isWarning: false,
      isHardBlock: false,
      canProceedAnyway: true,
      details,
    };
  }

  // Soft warning for unstructured/custom JD text
  return {
    isValid: false,
    isWarning: true,
    isHardBlock: false,
    canProceedAnyway: true,
    error: "We couldn't detect standard job description sections (such as Responsibilities or Qualifications). You can still proceed if this is your target job description.",
    guidance: [
      'Include the target role title (e.g. Senior Software Engineer)',
      'Include the Responsibilities / Duties section (What you will do)',
      'Include the Requirements / Qualifications / Tech Stack section',
      'Tip: You can click "Use this description anyway" to proceed with this text',
    ],
    details,
  };
}
