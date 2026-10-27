/**
 * Client-Side Job Description (JD) Validator
 *
 * Implements deterministic structural and heuristic classification
 * to ensure that uploaded documents or pasted text represent an AUTHENTIC Job Description.
 *
 * Strictly rejects:
 * - Candidate Resumes & CVs (detected via date ranges, resume headers, contact blocks, or filename)
 * - Study Guides, Handbooks, Cheatsheets & Courseware
 * - Technical Tutorials, Articles & Blog Posts
 * - Project Documentation, GitHub READMEs & Code Repositories
 * - Meeting Minutes, Notes & Transcripts
 * - Academic Papers, Homework & Lab Reports
 * - Cover Letters & Job Application Pitches
 * - Legal Agreements, Invoices & Financial Statements
 * - Short fragments, gibberish & prompt injections
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
  isPromptInjection: boolean;
  detectedDisqualifier?: string;
}

export interface JDValidationResult {
  isValid: boolean;
  error?: string;
  guidance?: string[];
  details: JDValidationDetails;
}

// ─── Heavy Disqualifier Dictionaries (Non-JD Documents) ────────────────────────

// Resume indicators
const RESUME_DATE_RANGES = /\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?(?:19|20)\d\d\s*[-–—]\s*(?:present|current|now|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?(?:19|20)\d\d)\b/gi;
const RESUME_SECTION_HEADERS = /(?:^|\n)\s*(?:[-*•#]+\s*)?(?:professional\s+summary|career\s+summary|work\s+experience|professional\s+experience|employment\s+history|work\s+history|education(?:\s*(?:&|and)\s*certifications)?)\s*[:\n\-–]/i;
const RESUME_SPECIFIC_SIGNALS = [
  /\b(curriculum vitae|resume of|my resume|references available upon request|work authorization:?\s*(us citizen|green card|h1b)|ats resume)\b/i,
  /\b(gpa[:\s]+\d\.\d|graduated (with|from)|dean'?s list)\b/i,
  /\b(my objective|career objective|professional summary:?(\s*i am|\s*motivated candidate|\s*results-driven))\b/i,
  /\b(i graduated|i have \d+\+? years of hands[- ]on experience in my career|my previous company|worked as an? \w+ at)\b/i,
  /\b(email:\s*[\w\.\-]+@|phone:\s*[\(\d]|\blinkedin\.com\/in\/)/i,
];

const STUDY_GUIDE_PATTERNS = [
  /\b(study guide|handbook|cheat sheet|course curriculum|course syllabus|lecture notes?|exam prep|mock interview questions?|interview prep guide|learning path|practice questions?)\b/i,
  /\b(in this (study )?guide|in this handbook|in this module|in this chapter|key concepts\s*[:-]|table of contents|concept summary|chapter \d+)\b/i,
  /\b(case study\s*[:-]|use case overview|architecture overview\s*[:-]|problem statement\s*[:-]|solution architecture\s*[:-]|business scenario\s*[:-]|review questions\s*[:-]|summary of concepts)\b/i,
];

const TUTORIAL_PATTERNS = [
  /\b(in this (tutorial|article|walkthrough|guide|post)|how to build a|getting started with (python|react|fastapi|docker|aws)|step \d+\s*[:-]|click here to read|read more articles|published in|min read|author\s*[:-]|written by)\b/i,
  /\b(towards data science|medium\.com|freecodecamp|stack overflow|w3schools|dev\.to)\b/i,
];

const CODE_OR_DOCS_PATTERNS = [
  /\b(api reference|getting started\s*[:-]|how to install|installation instructions?|release notes|changelog|license:?\s*mit|apache license|repository url|npm install|pip install|yarn add|git clone|docker run|curl -X)\b/i,
];

const ACADEMIC_PATTERNS = [
  /\b(abstract\s*[:-]|homework\s*(assignment)?\s*#?\d|assignment\s*#?\d|due date\s*[:-]|course instructor|professor\s+[a-z]|references cited|literature review|dissertation|thesis)\b/i,
];

const COVER_LETTER_PATTERNS = [
  /\b(dear hiring manager|dear (mr\.|ms\.|recruiter)|i am writing to (apply for|express my interest in)|sincerely,|best regards,\s+[a-z]+)\b/i,
];

const BUSINESS_DOC_PATTERNS = [
  /\b(invoice\s*#|billing statement|balance due|payment terms\s*[:-]|terms of service|privacy policy|non-disclosure agreement|lease agreement|landlord|tenant)\b/i,
];

const MEETING_NOTES_PATTERNS = [
  /\b(meeting minutes|meeting notes|retrospective notes|sprint \d+ retro|action items\s*[:-]|attendees\s*[:-]|discussion points\s*[:-])\b/i,
];

// Disqualifier filename checks
const FILENAME_DISQUALIFIERS = [
  { regex: /study[-_ ]*guide|handbook|syllabus|courseware|cheat[-_ ]*sheet/i, type: 'STUDY_GUIDE', label: 'Study Guide or Handbook' },
  { regex: /resume|curriculum[-_ ]*vitae|\bcv\b/i, type: 'RESUME', label: 'Candidate Resume or CV' },
  { regex: /cover[-_ ]*letter/i, type: 'COVER_LETTER', label: 'Cover Letter' },
  { regex: /assignment|homework|lab[-_ ]*report|syllabus|thesis|dissertation/i, type: 'ACADEMIC', label: 'Academic Assignment or Coursework' },
  { regex: /readme|changelog|license/i, type: 'DOCS', label: 'Technical Documentation or README' },
  { regex: /invoice|receipt|contract|agreement|nda|billing/i, type: 'BUSINESS', label: 'Business Contract or Invoice' },
];

// ─── Affirmative JD Structural Patterns ────────────────────────────────────────

const RESP_REGEX = /\b(?:key\s+|core\s+|primary\s+|main\s+)?responsibilities\b|\bwhat you('ll| will) (?:do|be doing)\b|\bduties\s*(?:include|and\s+responsibilities)?\b/i;
const REQ_REGEX = /\b(?:basic\s+|minimum\s+|preferred\s+|required\s+)?(?:requirements|qualifications)(?:\s*(?:and|&)\s*(?:qualifications|requirements|skills|experience))?\s*[:\n\-–]|\bwhat (?:we('re| are) looking for|you bring|you'll need)\b|\b(?:must[- ]haves?|required skills)\b/i;
const HEADER_ABOUT_ROLE = /(?:^|\n)\s*(?:[-*•#]+\s*)?(?:about the (?:role|job|opportunity|position|company)|job (?:summary|overview|description)|position (?:summary|overview))\s*[:\n\-–]/i;
const HEADER_REQ_FIELDS = /(?:^|\n)\s*(?:[-*•#]+\s*)?(?:job\s+title|position|role|title|location|employment\s+type|reports\s+to|job\s+id|req\s+id)\s*[:\-–]/i;

const HIRING_CONTEXT_PATTERNS = [
  /\b(we are (?:looking for|seeking|hiring)|join our (?:team|company)|about the (?:role|job)|the ideal candidate|the successful candidate|you will be responsible for|equal opportunity employer|full[- ]time (?:role|position|opportunity)|competitive (?:salary|compensation)|comprehensive benefits|apply (?:now|for this (?:role|position))|seeking a qualified)\b/i,
];

const QUALIFICATION_EXPRESSIONS = [
  /\b(\d+\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:professional|relevant|hands[- ]on|industry)?\s*(?:experience|software development)|bachelor(?:'s)?(?:\s+degree)?\s+(?:in|or)|master(?:'s)?\s+degree|degree in computer science|proven track record|demonstrated proficiency|strong working knowledge)\b/i,
];

const INJECTION_PATTERNS = [
  /\bignore\s+(all\s+)?(previous|prior)\s+instructions\b/i,
  /\bsystem\s+prompt\b/i,
  /\bgive\s+me\s+(a\s+)?(100|perfect|full)\s+score\b/i,
];

export function normalizeText(text: string): string {
  return (text || '')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00A0/g, ' ')
    .trim();
}

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
    isPromptInjection: false,
  };

  // ── 1. Empty Check ──────────────────────────────────────────────────────────
  if (!text || wordCount === 0) {
    return {
      isValid: false,
      error: 'Please paste or upload a job description to continue.',
      guidance: [
        'Copy the target job posting from LinkedIn, Indeed, or a company careers site',
        'Upload a PDF or Word document containing the job requirements',
      ],
      details,
    };
  }

  // ── 2. Security / Meta Prompt Injections ─────────────────────────────────────
  if (INJECTION_PATTERNS.some((pat) => pat.test(text))) {
    details.isPromptInjection = true;
    return {
      isValid: false,
      error: 'Invalid content detected. Please provide an authentic job posting.',
      guidance: ['Paste an actual job description without prompt instructions.'],
      details,
    };
  }

  // ── 3. Repetitive Character Gibberish Check ─────────────────────────────────
  if (REPETITIVE_CHARS_REGEX.test(text)) {
    details.isRepetitiveOrGibberish = true;
    return {
      isValid: false,
      error: 'The provided text contains repetitive characters or gibberish. Please provide an authentic job description.',
      guidance: ['Ensure the text is copied cleanly without corrupted formatting.'],
      details,
    };
  }

  // ── 4. Minimum Length & Substance ───────────────────────────────────────────
  if (wordCount < 40 || charCount < 200) {
    details.isTooShort = true;
    return {
      isValid: false,
      error: `The provided text is too brief (${wordCount} words). A complete Job Description with role duties and requirements is required.`,
      guidance: [
        'Include the full role title and company context',
        'Include the responsibilities or daily duties',
        'Include the required skills, qualifications, and tech stack',
      ],
      details,
    };
  }

  // Unique word ratio
  const lowerWords = words.map((w) => w.toLowerCase());
  const uniqueWords = new Set(lowerWords);
  const uniquenessRatio = uniqueWords.size / wordCount;

  if (wordCount >= 30 && uniquenessRatio < 0.28) {
    details.isRepetitiveOrGibberish = true;
    return {
      isValid: false,
      error: 'The text appears to be repetitive spam. Please provide an actual job description.',
      guidance: ['Paste a standard job description with varied requirements and duties.'],
      details,
    };
  }

  // Alphanumeric density check
  const alphaNumericMatches = text.match(/[a-zA-Z0-9]/g);
  const alphaRatio = (alphaNumericMatches ? alphaNumericMatches.length : 0) / charCount;
  if (alphaRatio < 0.45) {
    details.isRepetitiveOrGibberish = true;
    return {
      isValid: false,
      error: 'The text contains too many non-text characters or symbols. Please provide standard job text.',
      guidance: ['Check that the document was converted properly and is not corrupted.'],
      details,
    };
  }

  // ── 5. Filename-Level Disqualifier Check ─────────────────────────────────────
  if (fileName) {
    for (const disq of FILENAME_DISQUALIFIERS) {
      if (disq.regex.test(fileName)) {
        details.detectedDisqualifier = disq.type;
        return {
          isValid: false,
          error: `The uploaded file (${fileName}) appears to be a ${disq.label} rather than a Job Description.`,
          guidance: [
            'Please upload or paste the official Job Description / vacancy details for the role you are targeting.',
            'A Job Description defines the open role, day-to-day responsibilities, and required candidate qualifications.',
          ],
          details,
        };
      }
    }
  }

  // ── 6. Content-Level Heavy Disqualifiers ("Other Stuff") ─────────────────────

  // Disqualifier: Candidate Resume or CV
  // Resumes are identified by employment history date ranges, resume section headers, or personal profile blocks
  const dateRanges = text.match(RESUME_DATE_RANGES) || [];
  const hasResumeHeader = RESUME_SECTION_HEADERS.test(text);
  const hasResumeSignal = RESUME_SPECIFIC_SIGNALS.some((p) => p.test(text));

  // If a document has 2 or more past employment date ranges, or a resume section header with personal signals/dates:
  if (dateRanges.length >= 2 || (hasResumeHeader && (dateRanges.length >= 1 || hasResumeSignal))) {
    details.isLikelyResume = true;
    details.detectedDisqualifier = 'RESUME';
    return {
      isValid: false,
      error: 'This document appears to be a candidate Resume or CV rather than a Job Description.',
      guidance: [
        'Your candidate profile already contains your resume.',
        'Please upload or paste the Job Description for the role you want to practice for.',
      ],
      details,
    };
  }

  // Disqualifier: Study Guides, Handbooks, Courseware
  if (STUDY_GUIDE_PATTERNS.some((p) => p.test(text))) {
    details.detectedDisqualifier = 'STUDY_GUIDE';
    return {
      isValid: false,
      error: 'This document appears to be a Study Guide, Handbook, or educational course material rather than an authentic Job Description.',
      guidance: [
        'Please upload or paste the actual job posting from the employer.',
        'A valid Job Description specifies an open position, team responsibilities, and required candidate qualifications.',
      ],
      details,
    };
  }

  // Disqualifier: Technical Tutorials & Blog Articles
  if (TUTORIAL_PATTERNS.some((p) => p.test(text))) {
    details.detectedDisqualifier = 'TUTORIAL';
    return {
      isValid: false,
      error: 'This document appears to be a technical article, blog post, or tutorial rather than a Job Description.',
      guidance: [
        'Please copy and paste the official job posting from LinkedIn, Indeed, or a company careers page.',
      ],
      details,
    };
  }

  // Disqualifier: Software Documentation, Codebases & Project READMEs
  if (CODE_OR_DOCS_PATTERNS.some((p) => p.test(text))) {
    details.detectedDisqualifier = 'CODE_OR_DOCS';
    return {
      isValid: false,
      error: 'This document appears to be technical documentation, a project README, or code instructions rather than a Job Description.',
      guidance: [
        'Please upload the job vacancy description you want to practice your walkthrough against.',
      ],
      details,
    };
  }

  // Disqualifier: Academic Papers & Homework
  if (ACADEMIC_PATTERNS.some((p) => p.test(text))) {
    details.detectedDisqualifier = 'ACADEMIC';
    return {
      isValid: false,
      error: 'This document appears to be an academic paper, homework assignment, or syllabus rather than a Job Description.',
      guidance: [
        'Please provide a professional job posting for the position you are targeting.',
      ],
      details,
    };
  }

  // Disqualifier: Cover Letters
  if (COVER_LETTER_PATTERNS.some((p) => p.test(text))) {
    details.detectedDisqualifier = 'COVER_LETTER';
    return {
      isValid: false,
      error: 'This document appears to be a Cover Letter or candidate application note rather than a Job Description.',
      guidance: [
        'Please upload the employer job posting with requirements and responsibilities.',
      ],
      details,
    };
  }

  // Disqualifier: Invoices, Contracts, Business Agreements
  if (BUSINESS_DOC_PATTERNS.some((p) => p.test(text))) {
    details.detectedDisqualifier = 'BUSINESS_DOC';
    return {
      isValid: false,
      error: 'This document appears to be a financial, legal, or administrative document rather than a Job Description.',
      guidance: [
        'Please upload the job opening description for this assessment.',
      ],
      details,
    };
  }

  // Disqualifier: Meeting Notes & Retrospectives
  if (MEETING_NOTES_PATTERNS.some((p) => p.test(text))) {
    details.detectedDisqualifier = 'MEETING_NOTES';
    return {
      isValid: false,
      error: 'This document appears to be meeting minutes or retrospective notes rather than a Job Description.',
      guidance: [
        'Please provide an authentic employer job description.',
      ],
      details,
    };
  }

  // ── 7. Affirmative Job Description Structural Verification ──────────────────
  const hasResp = RESP_REGEX.test(text);
  const hasReq = REQ_REGEX.test(text);
  const hasAboutRole = HEADER_ABOUT_ROLE.test(text);
  const hasReqFields = HEADER_REQ_FIELDS.test(text);
  const hasHiringContext = HIRING_CONTEXT_PATTERNS.some((p) => p.test(text));
  const hasQualExpr = QUALIFICATION_EXPRESSIONS.some((p) => p.test(text));

  details.hasResponsibilitySignals = hasResp;
  details.hasRequirementSignals = hasReq || hasQualExpr;
  details.hasRoleSignals = hasAboutRole || hasReqFields || hasHiringContext;

  // A genuine Job Description MUST have at least one of these structural compositions:
  // 1) Both standard section headers (Responsibilities AND Requirements)
  // 2) At least one standard header (Responsibilities OR Requirements) PLUS explicit Hiring Context / Requisition fields
  // 3) Strong Hiring Context (e.g. "We are looking for...") AND explicit candidate qualification expressions
  const hasStandardHeaders = hasResp && (hasReq || hasQualExpr);
  const hasHeaderPlusHiring = (hasResp || hasReq) && (hasHiringContext || hasAboutRole || hasReqFields);
  const hasStrongHiringFormat = hasHiringContext && hasQualExpr && (hasAboutRole || hasReqFields);

  if (hasStandardHeaders || hasHeaderPlusHiring || hasStrongHiringFormat) {
    return {
      isValid: true,
      details,
    };
  }

  // If text failed affirmative structural checks
  return {
    isValid: false,
    error: 'The provided content does not appear to be an authentic Job Description. It is missing standard job posting sections like Responsibilities or Requirements.',
    guidance: [
      'Include the target role title (e.g. Senior Software Engineer)',
      'Include the Responsibilities / Duties section (What you will do)',
      'Include the Requirements / Qualifications / Tech Stack section',
      'Tip: Copy and paste the full job posting directly from LinkedIn, Indeed, or the employer careers page',
    ],
    details,
  };
}
