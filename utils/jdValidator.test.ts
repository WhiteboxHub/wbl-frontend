import { describe, it, expect } from 'vitest';
import { validateJobDescription, normalizeText } from './jdValidator';

const BASE_JD = `
Job Title: Senior Backend Engineer
Location: San Francisco, CA (Remote)
About the Role:
We are seeking a Senior Backend Engineer to join our core engineering team. In this role, you will be responsible for designing, building, and maintaining our high-scale distributed APIs and cloud infrastructure.

Key Responsibilities:
- Design and implement scalable microservices using Python, FastAPI, and PostgreSQL.
- Partner with product managers and frontend engineers to deliver end-to-end features.
- Maintain code quality through automated testing and code reviews.

Requirements and Qualifications:
- 5+ years of software development experience in Python or Go.
- Bachelor's degree in Computer Science or equivalent practical experience.
- Experience with relational databases, distributed systems, and AWS cloud environments.
- Strong problem-solving abilities and communication skills.
`;

describe('validateJobDescription - Comprehensive Table-Driven Suite', () => {
  it('normalizes curly apostrophes, quotes, and non-breaking spaces', () => {
    const raw = 'What you’ll do: “Lead engineering” – 5+ years\u00A0experience';
    const norm = normalizeText(raw);
    expect(norm).toBe('What you\'ll do: "Lead engineering" - 5+ years experience');
  });

  const testCases = [
    {
      description: 'Standard authentic Job Description passes',
      text: BASE_JD,
      fileName: undefined,
      expectedValid: true,
      expectedHardBlock: false,
    },
    {
      description: 'File named Standard_Backend_Engineer_JD.docx is NOT disqualified as nda',
      text: BASE_JD,
      fileName: 'Standard_Backend_Engineer_JD.docx',
      expectedValid: true,
      expectedHardBlock: false,
    },
    {
      description: 'File named Backend_Engineer_Contract_Role.pdf is accepted',
      text: BASE_JD,
      fileName: 'Backend_Engineer_Contract_Role.pdf',
      expectedValid: true,
      expectedHardBlock: false,
    },
    {
      description: 'JD mentioning "multi-tenant SaaS" is NOT flagged as tenant/legal doc',
      text: BASE_JD + '\nYou will architect multi-tenant SaaS systems and manage database isolation across customers.',
      fileName: undefined,
      expectedValid: true,
      expectedHardBlock: false,
    },
    {
      description: 'Careers-page footer "Privacy Policy / Terms of Service" is accepted',
      text: BASE_JD + '\n\n© 2026 TechCorp Inc. All rights reserved. | Privacy Policy | Terms of Service',
      fileName: undefined,
      expectedValid: true,
      expectedHardBlock: false,
    },
    {
      description: 'JD mentioning "LLMs, including system prompt design" is accepted without prompt injection false flag',
      text: BASE_JD + '\nExperience building LLMs, including system prompt design, fine-tuning, and RAG pipelines.',
      fileName: undefined,
      expectedValid: true,
      expectedHardBlock: false,
    },
    {
      description: 'JD mentioning "Research published in top-tier venues; Master’s thesis" is accepted',
      text: BASE_JD + '\nPreferred: Master’s thesis in machine learning or research published in top-tier venues (NeurIPS, ICML).',
      fileName: undefined,
      expectedValid: true,
      expectedHardBlock: false,
    },
    {
      description: 'JD mentioning "Write release notes and maintain the changelog" is accepted',
      text: BASE_JD + '\nResponsibilities include: Write release notes and maintain the changelog for developer SDKs.',
      fileName: undefined,
      expectedValid: true,
      expectedHardBlock: false,
    },
    {
      description: 'Culture line mentioning "handbook" is accepted',
      text: BASE_JD + '\nWe are an open-first company; please review our public employee handbook for details on our culture.',
      fileName: undefined,
      expectedValid: true,
      expectedHardBlock: false,
    },
    {
      description: 'Pasted recruiter email ending with "Best regards, Priya" is accepted',
      text: 'Hi,\nHere is the job description:\n' + BASE_JD + '\nBest regards,\nPriya Sharma\nTechnical Recruiter',
      fileName: undefined,
      expectedValid: true,
      expectedHardBlock: false,
    },
    {
      description: 'JD with "Education: …" plus "Apply: Email: careers@acme.com" is NOT flagged as resume',
      text: BASE_JD + '\nEducation: Bachelor of Science in Engineering.\nApply by sending your info to Email: careers@acme.com',
      fileName: undefined,
      expectedValid: true,
      expectedHardBlock: false,
    },
    {
      description: 'Headings "What you’ll do / What you bring" with curly apostrophes pass',
      text: `
Job Title: Senior Product Designer
About the Role:
Join our design team to create user-centered experiences.

What you’ll do:
- Design interfaces and user flows for web and mobile.
- Collaborate with engineering and product teams.

What you bring:
- 4+ years of product design experience.
- Proficiency in Figma and design systems.
`,
      fileName: undefined,
      expectedValid: true,
      expectedHardBlock: false,
    },
    {
      description: 'International headings "Your role / Your profile" pass',
      text: `
Position: Data Engineer
Company: Global Tech

Your role:
- Build and optimize data pipelines using Spark and Snowflake.
- Ensure data integrity and observability across the data warehouse.

Your profile:
- 3+ years experience with data engineering pipelines.
- Degree in Computer Science, Mathematics, or equivalent.
`,
      fileName: undefined,
      expectedValid: true,
      expectedHardBlock: false,
    },
    {
      description: 'Candidate Resume with employment date ranges and headers is hard blocked',
      text: `
Amara Williams
San Francisco, CA • amara@example.com

PROFESSIONAL SUMMARY
Results-driven software engineer with 6+ years of experience in distributed backend systems.

WORK EXPERIENCE
Senior Software Engineer | Stripe
Jan 2022 – Present
- Architected payment processing service.

Software Engineer | Twilio
Jun 2019 – Dec 2021
- Built messaging APIs.

EDUCATION
B.S. in Computer Science | UC Berkeley (2015 – 2019)
`,
      fileName: 'Amara_Williams_Resume.pdf',
      expectedValid: false,
      expectedHardBlock: true,
    },
    {
      description: 'Empty text is hard blocked',
      text: '',
      fileName: undefined,
      expectedValid: false,
      expectedHardBlock: true,
    },
    {
      description: 'Repetitive gibberish is hard blocked',
      text: 'asdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdf',
      fileName: undefined,
      expectedValid: false,
      expectedHardBlock: true,
    },
    {
      description: 'Custom informal JD text gives soft warning with canProceedAnyway=true (never hard blocked)',
      text: 'We are looking for an experienced Python developer to help our startup build our MVP backend for 3 months. The work involves building REST APIs, connecting to a PostgreSQL database, setting up authentication with JWT, and deploying to AWS. Fully remote contractor role.',
      fileName: undefined,
      expectedValid: false,
      expectedHardBlock: false,
    },
  ];

  for (const tc of testCases) {
    it(tc.description, () => {
      const res = validateJobDescription(tc.text, tc.fileName);
      expect(res.isValid).toBe(tc.expectedValid);
      expect(res.isHardBlock).toBe(tc.expectedHardBlock);
      if (!tc.expectedHardBlock) {
        expect(res.canProceedAnyway).toBe(true);
      }
    });
  }
});
