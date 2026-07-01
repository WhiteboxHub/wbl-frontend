export interface ContactInfo {
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  github?: string;
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface ResumeData {
  fullName: string;
  title: string;
  summary: string;
  contact: ContactInfo;
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications?: string[];
  languages?: string[];
}

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  category: "Classic" | "Modern" | "Creative" | "Professional" | "Technical";
  accentColor: string;
  tags: string[];
  popular?: boolean;
}
