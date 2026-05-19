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
        if (typeof current[k] === 'object') {
          queue.push(current[k]);
        }
      }
    }
    return undefined;
  };

  const hasLinkedInDeep = (obj: any): boolean => {
    if (!obj) return false;
    if (typeof obj === 'string') {
      return obj.toLowerCase().includes('linkedin.com');
    }
    if (typeof obj === 'object') {
      for (const k of Object.keys(obj)) {
        if (hasLinkedInDeep(obj[k])) return true;
      }
    }
    return false;
  };

  const highBasics = ['name', 'email'];
  highBasics.forEach(field => {
    if (!findKeyDeepBFS(data, field)) errors.push(field);
  });

  if (!findKeyDeepBFS(data, 'summary')) {
    warnings.push('summary');
  }

  if (!hasLinkedInDeep(data)) {
    errors.push('linkedin profile (valid LinkedIn URL is required)');
  }

  const workData = findKeyDeepBFS(data, 'work') || data.work;
  if (!Array.isArray(workData) || workData.length === 0) {
    warnings.push("work (recommended to have at least one job entry)");
  } else {
    workData.forEach((w: any, idx: number) => {
      ['name', 'position'].forEach(field => {
        if (w[field] === undefined || w[field] === null) errors.push(`work[${idx}].${field}`);
      });
      
      ['startDate', 'endDate'].forEach(field => {
        if (w[field] === undefined || w[field] === null) warnings.push(`work[${idx}].${field}`);
      });

      if (!Array.isArray(w.highlights) || w.highlights.length === 0) {
        warnings.push(`work[${idx}].highlights`);
      }
    });
  }

  const skillsData = findKeyDeepBFS(data, 'skills') || data.skills;
  if (!Array.isArray(skillsData) || skillsData.length === 0) {
    warnings.push("skills (recommended to list your skills)");
  } else {
    skillsData.forEach((s: any, idx: number) => {
      if (!s.name) errors.push(`skills[${idx}].name`);
      if (!Array.isArray(s.keywords) || s.keywords.length === 0) {
        warnings.push(`skills[${idx}].keywords`);
      }
    });
  }

  const educationData = findKeyDeepBFS(data, 'education') || data.education;
  if (!Array.isArray(educationData) || educationData.length === 0) {
    warnings.push("education");
  } else {
    educationData.forEach((e: any, idx: number) => {
      ['institution', 'studyType', 'area'].forEach(field => {
        if (!e[field]) warnings.push(`education[${idx}].${field}`);
      });
    });
  }
  
  if (!findKeyDeepBFS(data, 'technical_screening')) {
    warnings.push("custom_fields.technical_screening");
  }

  ['application_logistics', 'legal', 'eeo'].forEach(field => {
    if (!findKeyDeepBFS(data, field)) warnings.push(`custom_fields.${field}`);
  });

  return { isValid: errors.length === 0, errors, warnings };
};
