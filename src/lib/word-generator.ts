// Word generator module - currently disabled due to docx library compatibility issues
// This will be enabled once docx import issues are resolved

export enum CVTemplate {
  ATS_FRIENDLY = "ats-friendly",
  MODERN = "modern", 
  CLASSIC = "classic",
  MINIMAL = "minimal"
}

export interface TailoredCV {
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    github?: string;
    website?: string;
  };
  summary: string;
  skills: {
    technical: string[];
    soft?: string[];
    languages?: string[];
    certifications?: string[];
  };
  experience: Array<{
    jobTitle: string;
    company: string;
    location?: string;
    duration: string;
    description?: string;
    achievements: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location?: string;
    graduationYear: string;
    gpa?: string;
    honors?: string[];
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
}

/**
 * Generate a filename for the CV document
 */
export function generateFileName(fullName: string, jobTitle: string, company: string): string {
  // Clean the name for filename use
  const cleanName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanJobTitle = jobTitle.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanCompany = company.replace(/[^a-zA-Z0-9]/g, '_');
  
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  
  return `${cleanName}_${cleanJobTitle}_${cleanCompany}_${timestamp}.docx`;
}

/**
 * Create Word document from tailored CV data (currently disabled)
 */
export async function createWordDocument(
  cvData: TailoredCV,
  template: CVTemplate = CVTemplate.ATS_FRIENDLY,
  filePath: string
): Promise<string> {
  throw new Error("Word document generation is currently disabled due to library compatibility issues. Use save_cv_text tool instead.");
}