/**
 * TalentScreen ATS Detection Utility
 * Detects ATS platform from job_url_type, source, or job_url domain
 */

export const SUPPORTED_ATS_LIST = [
  { id: 'greenhouse', name: 'Greenhouse', pattern: /greenhouse|boards\.greenhouse\.io/i },
  { id: 'lever', name: 'Lever', pattern: /lever|jobs\.lever\.co/i },
  { id: 'workday', name: 'Workday', pattern: /workday|myworkdayjobs\.com/i },
  { id: 'ashby', name: 'Ashby', pattern: /ashby|jobs\.ashbyhq\.com/i },
  { id: 'jobvite', name: 'Jobvite', pattern: /jobvite|jobs\.jobvite\.com/i },
  { id: 'smartrecruiters', name: 'SmartRecruiters', pattern: /smartrecruiters|jobs\.smartrecruiters\.com/i },
  { id: 'recruitee', name: 'Recruitee', pattern: /recruitee/i },
  { id: 'pinpoint', name: 'Pinpoint', pattern: /pinpoint/i },
  { id: 'rippling', name: 'Rippling', pattern: /rippling/i },
  { id: 'bamboohr', name: 'BambooHR', pattern: /bamboohr/i },
  { id: 'workable', name: 'Workable', pattern: /workable/i }
];

export function detectAtsSystem(job: any): string {
  if (!job) return 'other';

  const type = (job.job_url_type || '').toLowerCase();
  const url = (job.job_url || '').toLowerCase();
  const source = (job.source || '').toLowerCase();

  for (const ats of SUPPORTED_ATS_LIST) {
    if (
      type.includes(ats.id) ||
      source.includes(ats.id) ||
      ats.pattern.test(url)
    ) {
      return ats.id;
    }
  }

  return 'other';
}
