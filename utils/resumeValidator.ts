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

  const getNested = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : undefined, obj);
  };

  const highBasics = ['name', 'email'];
  highBasics.forEach(field => {
    if (!getNested(data, `basics.${field}`)) errors.push(`basics.${field}`);
  });

  ['url', 'summary'].forEach(field => {
    if (!getNested(data, `basics.${field}`)) warnings.push(`basics.${field}`);
  });

  if (!Array.isArray(data.work) || data.work.length === 0) {
    warnings.push("work (recommended to have at least one job entry)");
  } else {
    data.work.forEach((w: any, idx: number) => {
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

  if (!Array.isArray(data.skills) || data.skills.length === 0) {
    warnings.push("skills (recommended to list your skills)");
  } else {
    data.skills.forEach((s: any, idx: number) => {
      if (!s.name) errors.push(`skills[${idx}].name`);
      if (!Array.isArray(s.keywords) || s.keywords.length === 0) {
        warnings.push(`skills[${idx}].keywords`);
      }
    });
  }

  if (!Array.isArray(data.education) || data.education.length === 0) {
    warnings.push("education");
  } else {
    data.education.forEach((e: any, idx: number) => {
      ['institution', 'studyType', 'area'].forEach(field => {
        if (!e[field]) warnings.push(`education[${idx}].${field}`);
      });
    });
  }
  
  if (!Array.isArray(getNested(data, 'basics.profiles')) || data.basics.profiles.length === 0) {
    warnings.push("basics.profiles");
  }
  if (!getNested(data, 'custom_fields.technical_screening')) {
    warnings.push("custom_fields.technical_screening");
  }

  ['application_logistics', 'legal', 'eeo'].forEach(field => {
    if (!getNested(data, `custom_fields.${field}`)) warnings.push(`custom_fields.${field}`);
  });

  return { isValid: errors.length === 0, errors, warnings };
};
