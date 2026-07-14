export const validateJson = (jsonStr: string) => {
  try { 
    JSON.parse(jsonStr); 
    return true; 
  } catch { 
    return false; 
  }
};

export const validateResumeStructure = (data: any) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** BFS deep-search for a key with a non-empty value */
  const findKeyDeepBFS = (obj: any, keyName: string): any => {
    if (!obj || typeof obj !== 'object') return undefined;
    let queue: any[] = [obj];
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || typeof current !== 'object') continue;
      if (keyName in current) {
        const val = current[keyName];
        if (typeof val === 'string' && val.trim() !== '') return val;
        if (Array.isArray(val) && val.length > 0) return val;
        if (typeof val === 'object' && val !== null && Object.keys(val).length > 0) return val;
      }
      for (const k of Object.keys(current)) {
        if (typeof current[k] === 'object') queue.push(current[k]);
      }
    }
    return undefined;
  };

  /** Check if any string value in the object contains a linkedin.com URL */
  const hasLinkedInDeep = (obj: any): boolean => {
    if (!obj) return false;
    if (typeof obj === 'string') return obj.toLowerCase().includes('linkedin.com');
    if (typeof obj === 'object') {
      for (const k of Object.keys(obj)) {
        if (hasLinkedInDeep(obj[k])) return true;
      }
    }
    return false;
  };

  // ─── Detect format ─────────────────────────────────────────────────────────
  // Custom format uses `personal` block; standard JSON Resume uses `basics`
  const isCustomFormat = !!(data.personal && typeof data.personal === 'object');

  // ─── Name (mandatory) ──────────────────────────────────────────────────────
  if (isCustomFormat) {
    const p = data.personal as Record<string, any>;
    const firstName = (p.first_name || p.firstName || '').toString().trim();
    const lastName  = (p.last_name  || p.lastName  || '').toString().trim();
    const singleName = (p.name || '').toString().trim();
    if (!firstName && !lastName && !singleName) {
      errors.push('name (personal.first_name / personal.last_name)');
    }
  } else {
    if (!findKeyDeepBFS(data, 'name')) errors.push('name');
  }

  // ─── Email (mandatory) ─────────────────────────────────────────────────────
  if (!findKeyDeepBFS(data, 'email')) errors.push('email');

  // ─── LinkedIn (mandatory) ──────────────────────────────────────────────────
  if (!hasLinkedInDeep(data)) errors.push('linkedin profile (valid LinkedIn URL is required)');

  // ─── Summary (recommended) ─────────────────────────────────────────────────
  if (!findKeyDeepBFS(data, 'summary')) warnings.push('summary');

  // ─── Work / Experience ─────────────────────────────────────────────────────
  // Accept: work[] (standard) OR experience[] (custom)
  const workData: any[] | null =
    (Array.isArray(data.work) && data.work.length > 0)
      ? data.work
      : (Array.isArray(data.experience) && data.experience.length > 0)
        ? data.experience
        : null;

  if (!workData) {
    warnings.push('work (recommended to have at least one job entry)');
  } else {
    workData.forEach((w: any, idx: number) => {
      // Standard: name + position  |  Custom: company + title
      const hasCompany   = !!(w.name     || w.company);
      const hasPosition  = !!(w.position || w.title);
      if (!hasCompany)  errors.push(`work[${idx}].name`);
      if (!hasPosition) errors.push(`work[${idx}].position`);

      // Dates — recommended
      const hasStart = !!(w.startDate || w.start_date);
      const hasEnd   = !!(w.endDate   || w.end_date);
      if (!hasStart) warnings.push(`work[${idx}].startDate`);
      if (!hasEnd)   warnings.push(`work[${idx}].endDate`);

      // Highlights / achievements — recommended
      const highlights = w.highlights || w.achievements || w.bullets;
      if (!Array.isArray(highlights) || highlights.length === 0) {
        warnings.push(`work[${idx}].highlights`);
      }
    });
  }

  // ─── Skills ────────────────────────────────────────────────────────────────
  // Accept: plain strings ["Python", ...] OR objects [{name: "Python"}, ...]
  const skillsData: any[] | null =
    (Array.isArray(data.skills) && data.skills.length > 0) ? data.skills : null;

  if (!skillsData) {
    warnings.push('skills (recommended to list your skills)');
  } else {
    skillsData.forEach((s: any, idx: number) => {
      const isPlainString = typeof s === 'string' && s.trim() !== '';
      const hasNameProp = s && typeof s === 'object' && typeof s.name === 'string' && s.name.trim() !== '';
      if (!isPlainString && !hasNameProp) {
        errors.push(`skills[${idx}] must be a non-empty string or object with a 'name' field`);
      }
    });
  }

  // ─── Education ─────────────────────────────────────────────────────────────
  const educationData: any[] | null =
    (Array.isArray(data.education) && data.education.length > 0) ? data.education : null;

  if (!educationData) {
    warnings.push('education');
  } else {
    educationData.forEach((e: any, idx: number) => {
      // institution is in both formats
      if (!e.institution) warnings.push(`education[${idx}].institution`);
      // Standard JSON Resume uses studyType + area; custom uses degree + location
      if (isCustomFormat) {
        if (!e.degree) warnings.push(`education[${idx}].degree`);
      } else {
        if (!e.studyType) warnings.push(`education[${idx}].studyType`);
        if (!e.area)      warnings.push(`education[${idx}].area`);
      }
    });
  }

  // ─── Custom fields (recommended, only relevant if present in schema) ────────
  if (!findKeyDeepBFS(data, 'technical_screening')) {
    warnings.push('custom_fields.technical_screening');
  }
  ['application_logistics', 'legal', 'eeo'].forEach(field => {
    if (!findKeyDeepBFS(data, field)) warnings.push(`custom_fields.${field}`);
  });

  return { isValid: errors.length === 0, errors, warnings };
};
