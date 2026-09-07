/**
 * AIPrep API Client Layer (Master PDF & JSON Contract Compliant)
 * 
 * Target Workspace: wbl-frontend
 * Primary Contract Spec: AIPrep_Contracts_signature.pdf / contracts/api_endpoints.md
 * Base URL Prefix: /api/aiprep
 */

import { apiFetch as baseApiFetch } from '@/lib/api';

const apiFetch = (endpoint: string, options?: any) => {
  const path = endpoint.startsWith('aiprep/') || endpoint === 'user_dashboard' ? endpoint : `aiprep/${endpoint}`;
  return baseApiFetch(path, options);
};

// ============================================================================
// TypeScript Interfaces & Contract Schema Definitions
// ============================================================================

export type AssessmentType =
  | 'INTRO'
  | 'JD_INTRO'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'SYSTEM_DESIGN'
  | 'TECHNICAL';

export type MediaType = 'VIDEO' | 'AUDIO' | 'VIDEO_AUDIO' | 'AUDIO_ONLY' | string;

export type AssessmentStatus =
  | 'IN_PROGRESS'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'FAILED';

export const NO_PAUSE_ASSESSMENT_TYPES: ReadonlyArray<AssessmentType> = [
  'INTRO',
  'JD_INTRO',
];

export type AssessmentMode = MediaType;

export type ProcessingSteps = any;

export interface ProcessingStatusResponse {
  step: ProcessingSteps;
  progress: number;
  status: string;
  steps?: Record<string, number>;
  error?: string;
}

export interface CreateAssessmentRequest {
  candidate_id: number;
  assessment_type: AssessmentType;
  media_type: MediaType;
  assessment_mode?: string;
  job_description?: string | null;
  job_description_text?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface CreateAssessmentResponse {
  id: number;
  status: AssessmentStatus;
  started_at: string;
}

export interface QuestionTelemetryItem {
  question_id: number;
  question_text: string;
}

export interface TranscriptTelemetry {
  full_text: string;
  segments?: Array<{ text: string; start: number; end: number }>;
}

export interface AudioTelemetry {
  words_per_minute?: number;
  speaking_pace_wpm?: number;
  silence_ratio_pct?: number;
  filler_rate_per_min?: number;
  avg_volume_db?: number;
  mean_pitch_hz?: number;
  pause_count?: number;
  background_noise_level?: string;
  speaking_duration_seconds?: number;
}

export interface VideoTelemetry {
  is_video_mode?: boolean;
  face_visible_pct?: number;
  face_visibility_pct?: number;
  head_nods_count?: number;
  eye_contact_pct?: number;
  screen_attention_pct?: number;
  distraction_level_pct?: number;
  facial_engagement_pct?: number;
  acknowledgement_count?: number;
  expression_variety_pct?: number;
  posture_score?: number;
  visual_engagement_pct?: number;
  frame_stability_score?: number;
  sitting_position?: string;
  gaze_direction?: string;
  stress_level?: string;
}

export interface SubmitTelemetryPayload {
  questions: QuestionTelemetryItem[];
  transcript: TranscriptTelemetry;
  audio_telemetry: AudioTelemetry;
  video_telemetry: VideoTelemetry;
}

// Master Evaluation Output Schema (PDF Part 3 & all_json_schemas.json)
export interface AudioEvaluation {
  coherence?: string;
  clarity?: string;
  fluency?: string;
  confidence?: string;
  pace?: string;
  volume?: string;
  professionalism?: string;
}

export interface VideoEvaluation {
  eye_contact?: string;
  facial_engagement?: string;
  posture?: string;
  expression_variety?: string;
  distraction?: string;
}

export interface ScoresBreakdown {
  ai_engineering?: { score: number };
  core_engineering?: { score: number };
  non_technical?: { score: number };
  business_acumen?: { score: number };
  [key: string]: { score: number } | undefined;
}

export interface TechnicalAnalysis {
  summary?: string;
  strengths?: string[];
  areas_for_improvement?: string[];
}

export interface CoachingSuggestionItem {
  priority: number;
  dimension?: string;
  area?: string;
  suggestion: string;
}

export interface TranscriptEvidenceItem {
  quote: string;
  timestamp_s?: number;
}

export interface TranscriptEvaluation {
  scores_breakdown?: ScoresBreakdown;
  technical_analysis?: TechnicalAnalysis;
  coaching_suggestions?: CoachingSuggestionItem[];
  transcript_evidence?: TranscriptEvidenceItem[];
}

export interface MasterReportSchema {
  audio_evaluation?: AudioEvaluation;
  video_evaluation?: VideoEvaluation;
  transcript_evaluation?: TranscriptEvaluation;
}

export interface AssessmentDetails {
  id: number;
  candidate_id: number;
  assessment_type: AssessmentType;
  media_type: MediaType;
  assessment_mode?: string;
  status: AssessmentStatus;
  youtube_url?: string | null;
  data?: any;
  report?: MasterReportSchema;
  created_at?: string;
}

export interface QuestionBankResponse {
  id: number;
  category: string;
  sub_category?: string | null;
  difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | string | null;
  question_text: string;
  ideal_answer_rubric?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface QuestionListResponse {
  items: QuestionBankResponse[];
  total: number;
}

export interface AssessmentCardMeta {
  type: AssessmentType;
  title: string;
  description: string;
  timeLimit: string;
  questionCount: string;
  pauseAllowed: boolean;
  requiresJd: boolean;
}

// ============================================================================
// Helper Utilities
// ============================================================================

export function getDifficultySeconds(difficulty?: string): number {
  switch (difficulty?.toUpperCase()) {
    case 'EASY':
      return 90;
    case 'HARD':
      return 180;
    case 'EXPERT':
      return 240;
    case 'MEDIUM':
    default:
      return 120;
  }
}

export function getDefaultTypeSeconds(type: AssessmentType): number {
  switch (type) {
    case 'INTRO':
    case 'JD_INTRO':
      return 240;
    case 'RECRUITER':
      return 120;
    case 'HIRING_MANAGER':
    case 'TECHNICAL':
    case 'SYSTEM_DESIGN':
    default:
      return 180;
  }
}

export function formatTimeEstimate(
  count: number,
  secPerQuestion: number = 120,
  type?: AssessmentType
): string {
  if (type === 'INTRO' || type === 'JD_INTRO') return '4 mins';
  if (count > 0) {
    const totalMin = Math.round((count * secPerQuestion) / 60);
    return `~${totalMin} mins`;
  }
  return '~15 mins';
}

export interface WhatToCoverCategory {
  title: string;
  theme: 'blue' | 'green' | 'amber';
  icon: 'user' | 'cpu' | 'settings' | 'layers' | 'code' | 'shield';
  items: string[];
}

export interface WhatToExpectItem {
  icon: 'clock' | 'chat' | 'file' | 'chart';
  text: string;
}

export interface AssessmentExample {
  title: string;
  description: string;
  linkText: string;
}

export interface AssessmentInfo {
  type: AssessmentType;
  title: string;
  subtitle: string;
  modalHeader: string;
  modalQuestion: string;
  modalDescription: string;
  shortDescription: string;
  cardDescription: string;
  duration: string;
  keyTopics: string[];
  whatIsThis: string;
  whatWillYouDo: string;
  whatToCover: string[];
  whatToExpect: string;
  tips: string[];
  // Rich assessment details for comprehensive guidance modal
  overview?: string;
  purposeBullets?: string[];
  coverCategories?: WhatToCoverCategory[];
  expectItems?: WhatToExpectItem[];
  example?: AssessmentExample;
}

export const ASSESSMENT_INFO_DETAILS: Record<AssessmentType, AssessmentInfo> = {
  INTRO: {
    type: 'INTRO',
    title: 'Introduction Assessment',
    subtitle: 'Tell Me About Yourself',
    modalHeader: 'Intro Assessment Details',
    modalQuestion: 'What is an Introduction Assessment?',
    modalDescription:
      'This is a short introduction you present during an interview, based on your resume, recent projects, experience, and recent work. Typically, your introduction should take 3–5 minutes.',
    shortDescription:
      'Introduce yourself in a professional interview-style format covering background, skills, strengths, and career goals.',
    cardDescription:
      'This is a short introduction you present during an interview, based on your resume, recent projects, experience, and recent work. Typically, your introduction should take 3–5 minutes.',
    duration: '3–5 mins',
    keyTopics: [
      'Professional Background & Experience',
      'Current & Recent Work',
      'Relevant Projects & Achievements',
      'Technical & Professional Skills',
      'Education & Qualifications',
    ],
    whatIsThis:
      'This is a short introduction you present during an interview, based on your resume, recent projects, experience, and recent work. Typically, your introduction should take 3–5 minutes.',
    whatWillYouDo:
      'You will introduce yourself in a clear and structured way, giving the interviewer an overview of your professional background and the experience most relevant to the opportunity.',
    whatToCover: [
      'Your professional background',
      'Education or relevant qualifications',
      'Career journey',
      'Recent or current experience',
      'Important projects',
      'Relevant skills',
      'Key strengths',
      'Career goals',
    ],
    whatToExpect:
      'This is usually one of the first questions in an interview. You should be able to speak about your background naturally and connect your experience to the role.',
    tips: [
      'Keep your introduction around 3–5 minutes.',
      'Start with your current project or most relevant experience.',
      'Highlight important projects and contributions.',
      'Connect your experience and skills to the role you are interviewing for.',
      'Speak naturally instead of memorizing your introduction.',
      'Keep your introduction clear, structured, and concise.',
    ],
    overview:
      'The Intro Assessment is a 3–5 minute AI-powered interview where you introduce yourself and share your professional journey.\n\nThis is a short introduction you present during an interview, based on your resume, recent projects, experience, and recent work. It helps you practice presenting your background, skills, achievements, and career goals in a clear and structured way.',
    purposeBullets: [
      'Build a clear, confident, and well-structured self-introduction',
      'Highlight your educational background, professional experience, and career journey',
      'Showcase your technical knowledge, projects, and relevant experience',
      'Clearly communicate your key skills, strengths, and areas of expertise',
      'Help interviewers quickly understand your background and professional profile',
      'Create a strong first impression and prepare you for future interview discussions',
    ],
    coverCategories: [
      {
        title: 'Background & Experience',
        theme: 'blue',
        icon: 'user',
        items: [
          'Current role and responsibilities',
          'Previous experience and career journey',
          'Key projects and achievements',
          'How your experience aligns with the role',
          'Strengths relevant to the role',
        ],
      },
      {
        title: 'AI Engineering',
        theme: 'green',
        icon: 'cpu',
        items: [
          'AI/ML Experience – Your experience working with AI, ML, and Generative AI',
          'Agentic AI – Agents, workflows, orchestration, and how they are used',
          'RAG & Vector Databases – Retrieval-augmented generation, embeddings, and vector search',
          'Tools & Frameworks – Experience with LangChain, LangGraph, ADK, MCP, or similar tools',
          'AI Goals & Expertise – Your areas of interest, strengths, and future goals in AI engineering',
        ],
      },
      {
        title: 'Software Engineering & More',
        theme: 'amber',
        icon: 'settings',
        items: [
          'Software engineering experience and key projects',
          'Programming languages, frameworks, and tools',
          'System design, APIs, and database exposure',
          'Testing, DevOps, cloud, or MLOps experience',
          'Technical strengths, achievements, and career growth',
        ],
      },
    ],
    expectItems: [
      { icon: 'clock', text: 'Duration: 3–5 minutes' },
      { icon: 'chat', text: 'Conversational AI interviewer' },
      { icon: 'file', text: 'Questions based on the areas above' },
      { icon: 'chart', text: 'Real-time feedback after completion' },
    ],
    example: {
      title: 'Example Intro and Transcript',
      description: 'Watch an example introduction to see how to structure your response.',
      linkText: 'View Example Intro →',
    },
  },
  JD_INTRO: {
    type: 'JD_INTRO',
    title: 'JD Introduction Assessment',
    subtitle: 'Job Description Introduction',
    modalHeader: 'JD Intro Assessment Details',
    modalQuestion: 'What is a JD Introduction Assessment?',
    modalDescription:
      'This assessment helps you demonstrate that you understand the Job Description (JD) and can connect its requirements to your own experience, skills, and projects.',
    shortDescription:
      'Explain your understanding of the target job description and demonstrate how your background matches the role.',
    cardDescription:
      'Explain the JD, your understanding of the role, and how your experience matches it. Show that you have read and understood the position requirements.',
    duration: '3–5 mins',
    keyTopics: [
      'Role & Core Responsibilities',
      'Required Skills & Technical Qualifications',
      'Direct Experience Match',
      'How You Plan to Add Value',
    ],
    whatIsThis:
      'An assessment where you review a Job Description and explain your understanding of the role, responsibilities, required skills, and how your experience matches the position.',
    whatWillYouDo:
      'You will review the job description and explain your understanding of the role, responsibilities, required skills, and expectations.',
    whatToCover: [
      'What you understand about the role',
      'Main responsibilities',
      'Required skills and technologies',
      'Important qualifications',
      'Relevant experience from your background',
      'Projects related to the JD',
      'Areas where your skills match the role',
      'Areas where you may need to learn or improve',
    ],
    whatToExpect:
      'You will be expected to explain the JD in your own words and show how your background relates to the position. You may be asked follow-up questions about specific requirements.',
    tips: [
      'Read the JD carefully before starting.',
      'Identify the most important requirements.',
      'Focus on requirements relevant to your experience.',
      'Connect requirements to specific projects or responsibilities.',
      'Explain the JD in your own words.',
      'Don\'t simply read or repeat the JD.',
      'Be honest about skills or requirements you have not worked with.',
      'Prioritize quality over trying to mention every requirement.',
    ],
    overview:
      'A Job Description (JD) is a document that outlines what a company expects from a candidate for a specific role, including the responsibilities, required skills, experience, technologies, and expectations. This assessment helps you understand those requirements, connect them with your background and experience, and clearly explain how you can contribute to the role.',
    purposeBullets: [
      'Understand the key responsibilities and expectations of the role',
      'Connect your skills, experience, and projects to the JD',
      'Highlight the qualifications and technologies relevant to the position',
      'Explain how you can contribute value and solve role-related challenges',
      'Demonstrate strong preparation and alignment with the role',
    ],
    coverCategories: [
      {
        title: 'Role & Responsibilities',
        theme: 'blue',
        icon: 'user',
        items: [
          'Understand the key responsibilities mentioned in the JD',
          'Explain the main duties and expected outcomes of the role',
          'Identify the key goals and deliverables',
          'Describe the level of ownership and decision-making expected',
        ],
      },
      {
        title: 'Tech Stack & Tool Match',
        theme: 'green',
        icon: 'cpu',
        items: [
          'Programming languages and core technologies required for the role',
          'Frameworks, libraries, and development tools listed in the JD',
          'Cloud platforms and other relevant technical skills',
          'Architecture, databases, testing, and development practices',
          'AI/ML and other role-specific technologies',
        ],
      },
      {
        title: 'Experience & Value Delivery',
        theme: 'amber',
        icon: 'settings',
        items: [
          'Relevant projects and experience related to the role',
          'Key achievements and measurable impact',
          'How your experience aligns with the JD requirements',
          'Value you can bring to the team and organization',
        ],
      },
    ],
    expectItems: [
      { icon: 'clock', text: 'Duration: 3–5 minutes' },
      { icon: 'chat', text: 'Targeted JD-based AI interviewer' },
      { icon: 'file', text: 'Questions based on your pasted JD' },
      { icon: 'chart', text: 'Real-time role-matching analysis' },
    ],
    example: {
      title: 'Example JD Walkthrough & Transcript',
      description: 'Watch a candidate demonstrate strong job description alignment.',
      linkText: 'View Example JD Intro →',
    },
  },
  RECRUITER: {
    type: 'RECRUITER',
    title: 'Recruiter Assessment',
    subtitle: 'General Recruiter Interview',
    modalHeader: 'Recruiter Assessment Details',
    modalQuestion: 'What is a Recruiter Assessment?',
    modalDescription:
      'This assessment simulates an initial conversation with a recruiter. It covers your career journey, experience, skills, motivation, and expectations for the role.',
    shortDescription:
      'Simulate an initial recruiter conversation covering your professional background, career interests, motivation, and general qualifications.',
    cardDescription:
      'Simulate an initial recruiter conversation covering your professional background, career interests, motivation, and general qualifications.',
    duration: '~15 mins',
    keyTopics: [
      'Career Journey & Work Experience',
      'Key Accomplishments & Responsibilities',
      'Communication & Motivation',
      'Role Expectations & Fit',
    ],
    whatIsThis:
      'A realistic simulation of a recruiter phone or video screen. Recruiters ask broad questions to evaluate communication, motivation, experience, and cultural alignment.',
    whatWillYouDo:
      'You will answer common recruiter questions about your background, career decisions, experience, motivation, and interest in the opportunity.',
    whatToCover: [
      'Your career journey and background',
      'Key responsibilities in current or previous roles',
      'Why you are interested in this opportunity',
      'What you are looking for in your next role',
      'Preferred work environment',
      'Your strengths and areas where you excel',
      'Salary and availability expectations (general)',
      'Any questions you have for the recruiter',
    ],
    whatToExpect:
      'Expect conversational and behavioral questions. Recruiters want to understand who you are, how well you communicate, and whether your experience aligns with the role.',
    tips: [
      'Keep your answers concise and focused (1–2 minutes per answer).',
      'Clearly explain why you are interested in the opportunity.',
      'Highlight relevant experience and accomplishments.',
      'Be honest about your skills and background.',
      'Speak clearly and professionally.',
      'Show enthusiasm for the role and company.',
      'Prepare 1–2 thoughtful questions to ask.',
    ],
    overview:
      'A Recruiter Interview is an initial conversation that helps the recruiter understand your professional background, career goals, motivation, availability, and overall fit for the role. It focuses on your experience, what you are looking for in your next opportunity, and important job-related expectations.',
    purposeBullets: [
      'Clearly communicate your background and career journey',
      'Explain your motivation and interest in the opportunity',
      'Highlight relevant skills, experience, and achievements',
      'Demonstrate clear, confident, and professional communication',
      'Discuss availability, compensation, and work preferences confidently',
    ],
    coverCategories: [
      {
        title: 'Career Narrative & Transitions',
        theme: 'blue',
        icon: 'user',
        items: [
          'Brief overview of your professional journey',
          'Reasons for changing roles or exploring new opportunities',
          'Current employment status and availability',
          'Relevant industries, domains, and experience',
        ],
      },
      {
        title: 'Motivation & Cultural Fit',
        theme: 'green',
        icon: 'cpu',
        items: [
          'Why you are interested in the company and role',
          'What you are looking for in your next opportunity',
          'How you approach collaboration, feedback, and ownership',
          'Career goals, learning interests, and growth plans',
        ],
      },
      {
        title: 'Logistics & Alignment',
        theme: 'amber',
        icon: 'settings',
        items: [
          'Salary and total compensation expectations',
          'Availability and potential start date',
          'Work authorization and sponsorship requirements',
          'Remote, hybrid, onsite, or relocation preferences',
        ],
      },
    ],
    expectItems: [
      { icon: 'clock', text: 'Duration: ~15 minutes' },
      { icon: 'chat', text: 'Conversational Recruiter screening format' },
      { icon: 'file', text: 'Behavioral, career & logistics questions' },
      { icon: 'chart', text: 'Detailed feedback on pacing, clarity & tone' },
    ],
    example: {
      title: 'Example Recruiter Screen & Transcript',
      description: 'Review a high-performing recruiter screen with model responses.',
      linkText: 'View Example Recruiter Screen →',
    },
  },
  HIRING_MANAGER: {
    type: 'HIRING_MANAGER',
    title: 'Hiring Manager Assessment',
    subtitle: 'Role Fit & Experience',
    modalHeader: 'Hiring Manager Assessment Details',
    modalQuestion: 'What is a Hiring Manager Assessment?',
    modalDescription:
      'This assessment evaluates how well your skills, past experience, and problem-solving approach fit the team\'s needs. You will be asked about your past projects, technical decisions, leadership, and collaboration style.',
    shortDescription:
      'Deep discussion about your experience, ownership, problem-solving, decision-making, and ability to contribute effectively to the team.',
    cardDescription:
      'Deep discussion about your experience, ownership, problem-solving, decision-making, and ability to contribute effectively to the team.',
    duration: '~15 mins',
    keyTopics: [
      'Project Experience & Ownership',
      'Problem-Solving & Decision Making',
      'Team Collaboration & Leadership',
      'Impact & Value Delivery',
    ],
    whatIsThis:
      'An interview with the team lead or hiring manager to assess your ability to execute, collaborate, and make meaningful contributions.',
    whatWillYouDo:
      'You will discuss your past projects in detail, explain technical and business decisions, and answer situational or behavioral questions about how you handle real-world challenges.',
    whatToCover: [
      'Detailed walkthrough of your most important projects',
      'Your specific role, contributions, and ownership',
      'Technical decisions you made and why',
      'Challenges you encountered and how you resolved them',
      'How you collaborate with cross-functional teams',
      'How you handle disagreements or conflicting priorities',
      'Results and business impact of your work',
      'How you stay updated with new technologies',
    ],
    whatToExpect:
      'Questions will be deeper and more specific than a recruiter screen. The interviewer will dig into "why" and "how" you made decisions and look for evidence of ownership and problem-solving ability.',
    tips: [
      'Use the STAR method (Situation, Task, Action, Result) for behavioral questions.',
      'Be specific about YOUR contribution vs. the team\'s contribution.',
      'Quantify results where possible (metrics, performance improvements, time saved).',
      'Be ready to discuss trade-offs and alternative approaches you considered.',
      'Acknowledge mistakes or lessons learned honestly.',
      'Connect your past experience to the problems the hiring manager\'s team is solving.',
    ],
    overview:
      'A Hiring Manager Interview evaluates your experience, ownership, problem-solving, decision-making, and ability to handle role-related challenges. This assessment helps you practice discussing real-world situations, demonstrate your approach to complex problems, and show how you can contribute effectively to the team.',
    purposeBullets: [
      'Demonstrate ownership and effective decision-making',
      'Showcase your problem-solving and critical-thinking skills',
      'Explain how you handle challenges, ambiguity, and deadlines',
      'Highlight collaboration, leadership, and communication skills',
    ],
    coverCategories: [
      {
        title: 'Ownership & Accountability',
        theme: 'blue',
        icon: 'user',
        items: [
          'Project ownership and key responsibilities',
          'Technical and architectural decision-making',
          'Results, impact, and measurable outcomes',
          'Learning from challenges and setbacks',
        ],
      },
      {
        title: 'Collaboration & Leadership',
        theme: 'green',
        icon: 'cpu',
        items: [
          'Cross-functional teamwork and collaboration',
          'Handling disagreements and technical discussions',
          'Mentoring and supporting team members',
          'Stakeholder communication and expectation management',
        ],
      },
      {
        title: 'Execution & Complex Problem-Solving',
        theme: 'amber',
        icon: 'settings',
        items: [
          'Delivering under deadlines and changing requirements',
          'Handling ambiguity and complex challenges',
          'Balancing quality, technical debt, and delivery',
          'Troubleshooting issues and prioritizing tasks',
        ],
      },
    ],
    expectItems: [
      { icon: 'clock', text: 'Duration: ~15 minutes' },
      { icon: 'chat', text: 'Deep-dive behavioral AI interviewer' },
      { icon: 'file', text: 'STAR-method situational interview questions' },
      { icon: 'chart', text: 'Scorecard on leadership, ownership & judgment' },
    ],
    example: {
      title: 'Example Hiring Manager Interview & Transcript',
      description: 'See how candidates use the STAR method to answer challenging scenarios.',
      linkText: 'View Example HM Interview →',
    },
  },
  TECHNICAL: {
    type: 'TECHNICAL',
    title: 'Technical Assessment',
    subtitle: 'Technical Interview',
    modalHeader: 'Technical Assessment Details',
    modalQuestion: 'What is a Technical Assessment?',
    modalDescription:
      'This assessment tests your technical knowledge, coding concepts, problem-solving skills, and understanding of tools and technologies relevant to the role.',
    shortDescription:
      'Evaluate your technical knowledge, problem-solving ability, and understanding of technologies relevant to the role you are preparing for.',
    cardDescription:
      'Evaluate your technical knowledge, problem-solving ability, and understanding of technologies relevant to the role you are preparing for.',
    duration: '~15 mins',
    keyTopics: [
      'Core Programming & Algorithms',
      'System & Architecture Concepts',
      'Frameworks, Libraries & Tools',
      'Debugging & Optimization',
    ],
    whatIsThis:
      'A focused technical interview evaluating your engineering skills, technology stack depth, problem-solving methodology, and code comprehension.',
    whatWillYouDo:
      'You will answer technical questions, explain concepts, analyze code snippets, discuss architecture choices, and solve problems related to your domain.',
    whatToCover: [
      'Core programming languages (Python, Java, TypeScript, etc.)',
      'Data structures and algorithm concepts',
      'Frameworks and libraries relevant to the role',
      'Database concepts (SQL, NoSQL, data modeling)',
      'APIs',
      'Cloud technologies',
      'AI/ML concepts (if applicable)',
      'Testing',
      'Deployment',
      'Your project architecture',
      'Technical decisions you made',
    ],
    whatToExpect:
      'Questions can range from fundamental concepts to practical and scenario-based problems. You may also be asked to explain technologies listed on your resume or discuss how you implemented something in a project.',
    tips: [
      'Review the technical requirements in the JD.',
      'Understand the fundamentals behind the technologies you list.',
      'Be prepared to explain your own projects.',
      'Understand why you selected a particular technology or approach.',
      'Practice practical and scenario-based questions.',
      'Explain your reasoning step-by-step.',
      'Don\'t memorize definitions without understanding them.',
      'If you don\'t know something, be honest and explain how you would approach learning or solving it.',
    ],
    overview:
      'The Technical Assessment evaluates your coding skills, technical knowledge, problem-solving ability, and understanding of software engineering fundamentals. It helps you demonstrate how you approach technical problems, design solutions, debug issues, and explain your decisions clearly.',
    purposeBullets: [
      'Demonstrate coding and technical knowledge',
      'Solve problems using a structured approach',
      'Explain technical solutions clearly',
      'Apply algorithms and software engineering concepts',
      'Show debugging, testing, and code quality skills',
      'Communicate technical decisions with confidence',
    ],
    coverCategories: [
      {
        title: 'Data Structures & Problem Solving',
        theme: 'blue',
        icon: 'code',
        items: [
          'Core data structures and algorithms',
          'Sorting, searching, recursion, and dynamic programming',
          'Time and space complexity',
          'Edge cases and constraint handling',
        ],
      },
      {
        title: 'Programming & System Fundamentals',
        theme: 'green',
        icon: 'cpu',
        items: [
          'OOP, programming concepts, and design patterns',
          'APIs, databases, caching, and data handling',
          'Concurrency and asynchronous programming',
          'Performance and memory optimization',
        ],
      },
      {
        title: 'Code Quality & Production Practices',
        theme: 'amber',
        icon: 'settings',
        items: [
          'Clean, modular, and maintainable code',
          'Unit testing and integration testing',
          'Debugging and troubleshooting',
          'CI/CD and deployment practices',
          'Production reliability and performance',
        ],
      },
    ],
    expectItems: [
      { icon: 'clock', text: 'Duration: ~15 minutes' },
      { icon: 'chat', text: 'Technical AI interviewer & code evaluator' },
      { icon: 'file', text: 'Algorithmic, conceptual & scenario questions' },
      { icon: 'chart', text: 'In-depth analysis of accuracy, depth & explanation' },
    ],
    example: {
      title: 'Example Technical Interview & Transcript',
      description: 'Review sample technical questions with step-by-step reasoning.',
      linkText: 'View Example Technical Interview →',
    },
  },
  SYSTEM_DESIGN: {
    type: 'SYSTEM_DESIGN',
    title: 'System Design Assessment',
    subtitle: 'Design a Scalable System',
    modalHeader: 'System Design Assessment Details',
    modalQuestion: 'What is a System Design Assessment?',
    modalDescription:
      'This assessment evaluates your ability to design a complete software or AI system and explain how the different parts work together.',
    shortDescription:
      'Demonstrate how you design and build software systems, architecture, components, databases, APIs, scalability, and reliability.',
    cardDescription:
      'Design and explain a complete software system including architecture, components, data flow, scalability, reliability, and technical decisions.',
    duration: '~15 mins',
    keyTopics: [
      'System Architecture & Components',
      'Databases & APIs Integration',
      'Scalability & Reliability Design',
      'Technical Decisions & Trade-offs',
    ],
    whatIsThis:
      'This assessment evaluates your ability to design a complete software or AI system and explain how the different parts work together.',
    whatWillYouDo:
      'You will be given a system-design problem and asked to develop a solution. You will explain the architecture, components, data flow, scalability, reliability, security, and technical decisions involved in your design.',
    whatToCover: [
      'Requirements (functional & non-functional)',
      'High-level architecture',
      'Major components',
      'APIs and services',
      'Data storage',
      'Data flow',
      'Scalability',
      'Reliability',
      'Security',
      'Performance',
      'Monitoring and observability',
      'Failure handling',
      'Technical trade-offs',
    ],
    whatToExpect:
      'You will be given a real-world design problem. You should first understand the requirements, then gradually build and explain your solution. You may be asked to change your design based on scale, performance, cost, or reliability requirements.',
    tips: [
      'Start by clarifying the requirements.',
      'Don\'t jump directly into technologies.',
      'Explain your architecture step-by-step.',
      'Separate functional and non-functional requirements.',
      'Think about scalability and reliability.',
      'Consider security from the beginning.',
      'Explain important trade-offs.',
      'Think about failure scenarios.',
      'Discuss monitoring and observability.',
      'Start with a simple design and add complexity only when needed.',
      'Be prepared to explain why you made each major design decision.',
    ],
    overview:
      'A System Design Assessment evaluates your ability to design scalable, reliable, and maintainable systems from real-world requirements. It helps you practice breaking down complex problems, designing system architecture and data flows, selecting appropriate technologies, and explaining key trade-offs, scalability, performance, and reliability decisions.',
    purposeBullets: [
      'Translate requirements into a clear and scalable system design',
      'Define system architecture, components, APIs, and data flows',
      'Choose suitable databases, caching, and messaging solutions',
      'Address scalability, performance, availability, and fault tolerance',
    ],
    coverCategories: [
      {
        title: 'Requirements & AI Architecture',
        theme: 'blue',
        icon: 'layers',
        items: [
          'Define functional and non-functional AI requirements',
          'Design scalable AI/ML system architecture and data flows',
          'Choose suitable models, services, and AI components',
          'Design model serving and inference workflows',
        ],
      },
      {
        title: 'Data & AI Infrastructure',
        theme: 'green',
        icon: 'cpu',
        items: [
          'Design data pipelines for training and inference',
          'Choose suitable databases, vector databases, and storage',
          'Design embeddings, indexing, and retrieval workflows',
          'Apply caching and partitioning for large-scale AI workloads',
        ],
      },
      {
        title: 'Reliability & AI Safety',
        theme: 'amber',
        icon: 'settings',
        items: [
          'Design reliable and fault-tolerant AI services',
          'Handle model failures and fallback strategies',
          'Monitor model performance and AI output quality',
          'Address data privacy, security, and responsible AI',
        ],
      },
    ],
    expectItems: [
      { icon: 'clock', text: 'Duration: ~15 minutes' },
      { icon: 'chat', text: 'Distributed systems AI interviewer' },
      { icon: 'file', text: 'End-to-end design problems (URL shortener, Feed, Chat)' },
      { icon: 'chart', text: 'Scorecard on scalability, reliability & trade-off analysis' },
    ],
    example: {
      title: 'Example System Design Walkthrough & Transcript',
      description: 'Explore a full architectural walkthrough with diagram explanations.',
      linkText: 'View Example System Design →',
    },
  },
};

export function buildAssessmentCardMetadata(
  type: AssessmentType,
  dbQuestionCount?: number,
  avgSecondsPerQuestion?: number
): AssessmentCardMeta {
  const isNoPause = NO_PAUSE_ASSESSMENT_TYPES.includes(type);
  const requiresJd = type === 'JD_INTRO';
  const isIntro = type === 'INTRO' || type === 'JD_INTRO';
  const info = ASSESSMENT_INFO_DETAILS[type];

  const count = typeof dbQuestionCount === 'number' ? dbQuestionCount : 0;
  const sec = typeof avgSecondsPerQuestion === 'number' ? avgSecondsPerQuestion : getDefaultTypeSeconds(type);
  const timeLimit = isIntro ? '4 mins' : formatTimeEstimate(count, sec, type);

  return {
    type,
    title: type,
    description: info?.modalDescription || info?.shortDescription || '',
    timeLimit,
    questionCount: '',
    pauseAllowed: !isNoPause,
    requiresJd,
  };
}

// ============================================================================
// API Caller Methods 
// ============================================================================

async function getPublicClientIp(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(1500) });
    const data = await res.json();
    return data?.ip || null;
  } catch {
    return null;
  }
}

export const aiprepApi = {
  /**
   * 1. Create Assessment: POST /api/aiprep/assessments
   * Note: ip_address and user_agent read automatically from HTTP headers by backend
   */
  createAssessment: async (payload: {
    candidate_id?: number;
    assessment_type: AssessmentType;
    media_type?: MediaType;
    assessment_mode?: string;
    job_description?: string | null;
    job_description_text?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
  }): Promise<CreateAssessmentResponse> => {
    let candidateId = payload.candidate_id;
    if (!candidateId) {
      try {
        const userDash: any = await apiFetch('user_dashboard');
        candidateId = userDash?.candidate_id || userDash?.basic_info?.id || userDash?.id || userDash?.user_id;
      } catch (e) {
        console.warn('Could not fetch candidateId from user_dashboard profile', e);
      }
    }
    if (!candidateId) {
      throw new Error('Candidate ID is required to create an assessment session.');
    }

    const normMediaType: MediaType = (
      payload.media_type === 'AUDIO' || payload.assessment_mode === 'AUDIO_ONLY' || payload.assessment_mode === 'AUDIO'
        ? 'AUDIO'
        : 'VIDEO'
    ) as MediaType;
    const jd = payload.job_description || payload.job_description_text || null;

    let clientIp = payload.ip_address;
    if (!clientIp) {
      clientIp = await getPublicClientIp();
    }

    const reqHeaders: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      reqHeaders['User-Agent'] = window.navigator.userAgent;
    }
    if (payload.user_agent) {
      reqHeaders['User-Agent'] = payload.user_agent;
    }
    if (clientIp) {
      reqHeaders['X-Forwarded-For'] = clientIp;
      reqHeaders['X-Client-IP'] = clientIp;
      reqHeaders['X-Real-IP'] = clientIp;
    }

    const body: Record<string, any> = {
      candidate_id: candidateId,
      assessment_type: payload.assessment_type,
      media_type: normMediaType,
      job_description: jd,
    };

    if (clientIp) body.ip_address = clientIp;
    if (payload.user_agent) body.user_agent = payload.user_agent;

    return apiFetch('assessments', {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify(body),
    });
  },

  /**
   * 2. Submit Assessment Data: POST /api/aiprep/assessments/{id}/data
   */
  submitTelemetryData: async (
    assessmentId: number,
    payload: SubmitTelemetryPayload
  ): Promise<{ message: string }> => {
    return apiFetch(`assessments/${assessmentId}/data`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * 3. Update Assessment Media URL: PATCH /api/aiprep/assessments/{id}/media
   */
  updateMediaUrl: async (
    assessmentId: number,
    youtubeUrl: string
  ): Promise<{ id: number; youtube_url: string }> => {
    return apiFetch(`assessments/${assessmentId}/media`, {
      method: 'PATCH',
      body: JSON.stringify({ youtube_url: youtubeUrl }),
    });
  },

  /**
   * 4. Trigger Evaluation: POST /api/aiprep/assessments/{id}/evaluate
   */
  triggerEvaluation: async (
    assessmentId: number
  ): Promise<{ id: number; status: AssessmentStatus }> => {
    return apiFetch(`assessments/${assessmentId}/evaluate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  /**
   * 5. Get Assessment Report: GET /api/aiprep/assessments/{id}
   */
  getAssessment: async (assessmentId: number): Promise<AssessmentDetails> => {
    return apiFetch(`assessments/${assessmentId}`);
  },

  /**
   * 6. List Candidate Assessments: GET /api/aiprep/assessments?candidate_id={id}
   */
  listCandidateAssessments: async (
    candidateId: number
  ): Promise<{ items: AssessmentDetails[]; total: number }> => {
    return apiFetch(`assessments?candidate_id=${candidateId}`);
  },

  /**
   * 7. List Questions: GET /api/aiprep/questions?category={cat}&difficulty_level={diff}
   */
  getQuestions: async (
    category?: string,
    difficulty?: string
  ): Promise<QuestionListResponse> => {
    const params = new URLSearchParams();
    if (category && category !== 'GENERAL') {
      params.append('category', category.toUpperCase());
    }
    if (difficulty) params.append('difficulty_level', difficulty.toUpperCase());

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`questions${queryStr}`);
  },

  /**
   * 8. Create Question: POST /api/aiprep/questions
   */
  createQuestion: async (payload: {
    category: string;
    sub_category?: string;
    difficulty_level: string;
    question_text: string;
    is_active?: boolean;
  }): Promise<QuestionBankResponse> => {
    return apiFetch('questions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * 9. Update Question: PATCH /api/aiprep/questions/{id}
   */
  updateQuestion: async (
    id: number,
    payload: { is_active?: boolean; question_text?: string; difficulty_level?: string }
  ): Promise<QuestionBankResponse> => {
    return apiFetch(`questions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // ── Compatibility Helper Methods ─────────────────────────────────────────
  saveVisionTelemetry: async (data: {
    assessment_id: number;
    face_visible_pct?: number;
    head_nods_count?: number;
    frame_stability_score?: number;
    sitting_position?: string;
  }): Promise<{ message: string }> => {
    return aiprepApi.submitTelemetryData(data.assessment_id, {
      questions: [],
      transcript: { full_text: '' },
      audio_telemetry: {},
      video_telemetry: {
        face_visible_pct: data.face_visible_pct,
        head_nods_count: data.head_nods_count,
        frame_stability_score: data.frame_stability_score,
        sitting_position: data.sitting_position,
      },
    });
  },

  updateAssessmentStatus: async (
    id: number,
    status: string
  ): Promise<{ id: number; status: string }> => {
    if (status === 'EVALUATING' || status === 'COMPLETED') {
      try {
        await aiprepApi.triggerEvaluation(id);
      } catch (_) {}
    }
    return { id, status };
  },

  uploadChunk: async (
    assessmentId: number,
    chunkIndex: number,
    blob: Blob,
    mediaType: string = 'VIDEO',
    isFinal: boolean = false
  ): Promise<{ message: string; chunk_index?: number; file_path?: string; success?: boolean }> => {
    const formData = new FormData();
    formData.append('file', blob, `chunk_${chunkIndex}.webm`);
    formData.append('chunk_index', String(chunkIndex));
    formData.append('assessment_id', String(assessmentId));
    formData.append('media_type', mediaType);
    if (isFinal !== undefined) {
      formData.append('is_final', String(isFinal));
    }

    try {
      const res = await apiFetch(`assessments/${assessmentId}/upload-media`, {
        method: 'POST',
        body: formData,
      });
      return { success: true, ...res };
    } catch (err: any) {
      // If 404, fallback to /aiprep/assessments prefix
      if (err?.status === 404 || (typeof err?.message === 'string' && err.message.includes('404'))) {
        try {
          const fallbackRes = await apiFetch(`aiprep/assessments/${assessmentId}/upload-media`, {
            method: 'POST',
            body: formData,
          });
          return { success: true, ...fallbackRes };
        } catch (_) {}
      }
      console.error(`[AIPrep API] Failed to upload chunk ${chunkIndex}:`, err);
      throw err;
    }
  },

  getProcessingStatus: async (
    assessmentId: number
  ): Promise<ProcessingStatusResponse> => {
    try {
      const assessment = await aiprepApi.getAssessment(assessmentId);
      const status = assessment?.status || 'IN_PROGRESS';

      let progress = 10;
      let step = 'SUBMITTED';

      if (status === 'IN_PROGRESS') {
        progress = 25;
        step = 'RECORDING';
      } else if (status === 'EVALUATING') {
        progress = 65;
        step = 'EVALUATING_ENGINES';
      } else if (status === 'COMPLETED') {
        progress = 100;
        step = 'COMPLETED';
      } else if (status === 'FAILED') {
        step = 'FAILED';
        progress = 0;
      }

      return {
        step,
        progress,
        status,
      };
    } catch (err: any) {
      console.error(`[AIPrep API] Failed to fetch processing status for ${assessmentId}:`, err);
      return {
        step: 'RETRYING',
        progress: 50,
        status: 'EVALUATING',
      };
    }
  },

  subscribeToProcessing: (
    assessmentId: number,
    onProgress: (status: ProcessingStatusResponse) => void,
    onError?: (err: any) => void
  ): (() => void) => {
    let isCancelled = false;

    const poll = async () => {
      try {
        const res = await aiprepApi.getProcessingStatus(assessmentId);
        if (isCancelled) return;
        onProgress(res);

        if (res.status === 'COMPLETED' || res.status === 'FAILED') {
          return;
        }
      } catch (err) {
        if (!isCancelled && onError) onError(err);
      }

      if (!isCancelled) {
        timerId = setTimeout(poll, 3000);
      }
    };

    let timerId = setTimeout(poll, 1500);

    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  },
};

export default aiprepApi;
