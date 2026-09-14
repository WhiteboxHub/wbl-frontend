/**
 * Assessment Card & Guidance Modal UI Static Content & Metadata
 *
 * Pure UI presentation data for candidate guidance cards and modals.
 * Does not depend on or trigger any network or API calls.
 */

import {
  AssessmentType,
  NO_PAUSE_ASSESSMENT_TYPES,
} from '@/types/aiprep';

export interface AssessmentCardMeta {
  type: AssessmentType;
  title: string;
  description: string;
  timeLimit: string;
  questionCount: string;
  pauseAllowed: boolean;
  requiresJd: boolean;
}

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
      'The Intro Assessment is a 3–5 minute AI-powered interview where you introduce yourself and share your professional journey, technical expertise, and career goals in a clear and structured format.',
    purposeBullets: [
      'Build a clear, confident, and well-structured self-introduction',
      'Highlight your educational background, experience, and career journey',
      'Showcase your technical knowledge, projects, and key strengths',
      'Create a strong first impression and prepare for future interview discussions',
    ],
    coverCategories: [
      {
        title: 'Background & Experience',
        theme: 'blue',
        icon: 'user',
        items: [
          'Current role and core responsibilities',
          'Key projects, achievements & impact',
          'Professional journey and career milestones',
          'Strengths and alignment with target roles',

        ],
      },
      {
        title: 'Technical & AI Depth',
        theme: 'green',
        icon: 'cpu',
        items: [
          'Core programming, frameworks & tools',
          'AI/ML, Generative AI, or specialized domain skills',
          'System architecture, APIs & design patterns',
          'Testing, DevOps, cloud & quality practices',

        ],
      },
      {
        title: 'Execution & Delivery',
        theme: 'amber',
        icon: 'settings',
        items: [
          'Problem-solving approach and project ownership',
          'Cross-functional collaboration & teamwork',
          'Delivering value under changing requirements',
          'Continuous learning and career goals',
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
      'A Job Description (JD) outlines what a company expects from a candidate. This assessment helps you understand those requirements, connect them with your background, and clearly explain how you contribute to the role.',
    purposeBullets: [
      'Understand key responsibilities and expectations of the role',
      'Connect your skills, experience, and projects directly to the JD',
      'Highlight relevant qualifications and core technologies',
      'Explain how you contribute value and solve role-related challenges',
    ],
    coverCategories: [
      {
        title: 'Role & Responsibilities',
        theme: 'blue',
        icon: 'user',
        items: [
          'Understand key responsibilities in the JD',
          'Explain main duties and expected outcomes',
          'Identify role deliverables and milestones',
          'Describe ownership and decision-making scope',
          'Prioritize critical requirements over secondary ones',
        ],
      },
      {
        title: 'Tech Stack & Tool Match',
        theme: 'green',
        icon: 'cpu',
        items: [
          'Required programming languages & frameworks',
          'Cloud platforms and infrastructure tools',
          'Databases, architecture & testing practices',
          'AI/ML and specialized technical requirements',
          'Core developer tooling & operational workflows',
        ],
      },
      {
        title: 'Experience & Value Delivery',
        theme: 'amber',
        icon: 'settings',
        items: [
          'Relevant projects demonstrating matching skills',
          'Measurable impact and business contributions',
          'Alignment of past experience with JD needs',
          'Proactive plan to bridge any skill gaps',
          'Concrete examples of solving similar challenges',
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
      'A Recruiter Interview is an initial conversation that evaluates your career journey, motivation, role alignment, compensation expectations, and cultural fit.',
    purposeBullets: [
      'Clearly communicate your background and career journey',
      'Explain your motivation and interest in the opportunity',
      'Highlight relevant skills, experience, and achievements',
      'Demonstrate clear, confident, and professional communication',
    ],
    coverCategories: [
      {
        title: 'Career Narrative & Transitions',
        theme: 'blue',
        icon: 'user',
        items: [
          'Professional journey and career milestones',
          'Reasons for transition and progression',
          'Current role scope and responsibilities',
          'Relevant domain and industry experience',
          'Demonstrated career growth and upward trajectory',
        ],
      },
      {
        title: 'Motivation & Cultural Fit',
        theme: 'green',
        icon: 'cpu',
        items: [
          'Interest in the company, product, and mission',
          'Preferred work style, ownership & collaboration',
          'Handling feedback and team dynamics',
          'Long-term growth and learning interests',
          'Positive attitude, enthusiasm, and team energy',
        ],
      },
      {
        title: 'Logistics & Alignment',
        theme: 'amber',
        icon: 'settings',
        items: [
          'Total compensation & salary expectations',
          'Work authorization and start availability',
          'Remote, hybrid, onsite, or relocation scope',
          'Thoughtful questions to ask the recruiter',
          'Next steps and timeline expectations',
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
      'A Hiring Manager Interview evaluates your project ownership, problem-solving, decision-making, team collaboration, and ability to deliver under ambiguity.',
    purposeBullets: [
      'Demonstrate end-to-end ownership and architectural decision-making',
      'Showcase structured problem-solving using the STAR method',
      'Explain how you handle challenges, ambiguity, and deadlines',
      'Highlight cross-functional collaboration, leadership, and adaptability',
    ],
    coverCategories: [
      {
        title: 'Ownership & Accountability',
        theme: 'blue',
        icon: 'user',
        items: [
          'End-to-end project ownership & milestones',
          'Technical decisions, rationale, and trade-offs',
          'Measurable business outcomes & KPI impact',
          'Lessons learned from setbacks or production bugs',
          'Advocating for engineering excellence and quality',
        ],
      },
      {
        title: 'Collaboration & Leadership',
        theme: 'green',
        icon: 'cpu',
        items: [
          'Cross-functional teamwork with product & QA',
          'Handling technical disagreements constructively',
          'Mentoring teammates and improving code quality',
          'Stakeholder expectation management',
          'Fostering an inclusive, high-performing culture',
        ],
      },
      {
        title: 'Execution & Problem-Solving',
        theme: 'amber',
        icon: 'settings',
        items: [
          'Delivering under changing requirements',
          'Managing technical debt vs. fast releases',
          'Troubleshooting complex production roadblocks',
          'Balancing speed, scalability, and code health',
          'Navigating uncharted technical territory',
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
      'The Technical Assessment evaluates your coding fundamentals, system knowledge, problem-solving ability, and domain mastery across core programming paradigms.',
    purposeBullets: [
      'Demonstrate coding fundamentals and algorithmic depth',
      'Solve problems using structured, step-by-step logic',
      'Explain design patterns, complexity, and performance trade-offs',
      'Show clean architecture, testing, and production quality',
    ],
    coverCategories: [
      {
        title: 'Data Structures & Algorithms',
        theme: 'blue',
        icon: 'code',
        items: [
          'Core data structures, trees & graphs',
          'Sorting, searching & dynamic programming',
          'Time and space complexity (Big-O analysis)',
          'Edge cases and constraint optimization',
          'Iterative vs. recursive implementations',
        ],
      },
      {
        title: 'Programming & System Fundamentals',
        theme: 'green',
        icon: 'cpu',
        items: [
          'OOP, functional patterns & design principles',
          'REST/GraphQL APIs, databases & caching',
          'Concurrency, async programming & memory',
          'Microservices and modular architecture',
          'Security fundamentals and input validation',
        ],
      },
      {
        title: 'Code Quality & Production Practices',
        theme: 'amber',
        icon: 'settings',
        items: [
          'Modular code structure and clean design',
          'Unit testing, integration tests & CI/CD',
          'Debugging, profiling & performance tuning',
          'Observability, logging & fault handling',
          'Writing maintainable, readable software',
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
      'A System Design Assessment evaluates your ability to design scalable, reliable, and fault-tolerant architectures from ambiguous real-world requirements.',
    purposeBullets: [
      'Translate business requirements into scalable architectures',
      'Define component interactions, APIs, and data models',
      'Choose suitable databases, caching, and message queues',
      'Analyze trade-offs in scalability, latency, cost, and resilience',
    ],
    coverCategories: [
      {
        title: 'Requirements & Architecture',
        theme: 'blue',
        icon: 'layers',
        items: [
          'Functional & non-functional constraints',
          'Component diagrams, load balancing & gateways',
          'Microservices, event-driven flows & async jobs',
          'API design (REST/gRPC) and service boundaries',
          'Capacity planning for traffic, data & bandwidth',
        ],
      },
      {
        title: 'Data & Infrastructure',
        theme: 'green',
        icon: 'cpu',
        items: [
          'SQL vs. NoSQL, vector stores & caching',
          'Data partitioning, replication & consensus',
          'Message queues, streaming & indexing',
          'Distributed storage and retrieval pipelines',
          'Data consistency models (strong vs. eventual)',
        ],
      },
      {
        title: 'Reliability & Trade-offs',
        theme: 'amber',
        icon: 'settings',
        items: [
          'Fault tolerance, circuit breakers & failover',
          'Monitoring, distributed tracing & SLA/SLOs',
          'CAP theorem trade-offs, rate limits & security',
          'Cost efficiency and horizontal auto-scaling',
          'Disaster recovery and automated health checks',
        ],
      },
    ],
    expectItems: [
      { icon: 'clock', text: 'Duration: ~15 minutes' },
      { icon: 'chat', text: 'Distributed systems AI interviewer' },
      { icon: 'file', text: 'End-to-end design problems (Chat, Feed, Storage)' },
      { icon: 'chart', text: 'Scorecard on scalability, reliability & trade-offs' },
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