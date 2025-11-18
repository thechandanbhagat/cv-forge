import { z } from "zod";

/**
 * Schema for job requirements input with enhanced validation
 */
export const JobRequirementsSchema = z.object({
  jobTitle: z.string().min(1).max(200).describe("The job title/position"),
  company: z.string().min(1).max(200).describe("Company name"),
  jobDescription: z.string().min(1).max(50000).describe("Full job description text"),
  requirements: z.array(z.string().max(1000)).max(100).optional().describe("Specific requirements if separated"),
  preferredSkills: z.array(z.string().max(200)).max(100).optional().describe("Preferred skills if separated"),
  location: z.string().max(200).optional().describe("Job location"),
  salaryRange: z.string().max(100).optional().describe("Salary range if provided")
});

/**
 * Schema for user profile data with enhanced validation
 */
export const UserProfileSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(1).max(200),
    email: z.string().email("Invalid email format").max(254),
    phone: z.string().max(50).regex(/^[\d\s\-\+\(\)\.]+$/, "Invalid phone number format").optional(),
    location: z.string().max(200).optional(),
    linkedIn: z.string().url("Invalid LinkedIn URL").max(500).optional().or(z.literal('')),
    github: z.string().url("Invalid GitHub URL").max(500).optional().or(z.literal('')),
    website: z.string().url("Invalid website URL").max(500).optional().or(z.literal(''))
  }),
  summary: z.string().min(1).max(5000).describe("Professional summary"),
  experience: z.array(z.object({
    jobTitle: z.string().min(1).max(200),
    company: z.string().min(1).max(200),
    location: z.string().max(200).optional(),
    startDate: z.string().max(50),
    endDate: z.string().max(50).optional(),
    description: z.string().max(5000),
    achievements: z.array(z.string().max(1000)).max(50).optional()
  })).max(50),
  education: z.array(z.object({
    degree: z.string().min(1).max(200),
    institution: z.string().min(1).max(200),
    location: z.string().max(200).optional(),
    graduationYear: z.string().max(10),
    gpa: z.string().max(20).optional(),
    honors: z.array(z.string().max(500)).max(20).optional()
  })).max(20),
  skills: z.object({
    technical: z.array(z.string().max(100)).max(100),
    soft: z.array(z.string().max(100)).max(50).optional(),
    languages: z.array(z.string().max(100)).max(30).optional(),
    certifications: z.array(z.string().max(200)).max(50).optional()
  }),
  projects: z.array(z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(5000),
    technologies: z.array(z.string().max(100)).max(50),
    url: z.string().url("Invalid project URL").max(500).optional().or(z.literal(''))
  })).max(50).optional()
});

export type JobRequirements = z.infer<typeof JobRequirementsSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Parsed job requirements with extracted keywords
 */
export interface ParsedJobRequirements {
  jobTitle: string;
  company: string;
  keySkills: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  keyWords: string[];
  experienceLevel: string;
  location?: string;
  salaryRange?: string;
  jobType?: string;
  benefits?: string[];
  contactEmails?: string[];
  hiringManagerName?: string;
}

/**
 * Parse job requirements and extract key information for CV tailoring
 */
export function parseJobRequirements(jobReq: JobRequirements): ParsedJobRequirements {
  const fullText = `${jobReq.jobTitle} ${jobReq.jobDescription} ${jobReq.requirements?.join(' ') || ''} ${jobReq.preferredSkills?.join(' ') || ''}`;
  
  // Extract common tech skills (this is a simplified version - in production you'd use more sophisticated NLP)
  const techSkills = [
    'javascript', 'typescript', 'python', 'java', 'c#', 'react', 'angular', 'vue',
    'node.js', 'express', 'django', 'flask', 'spring', 'docker', 'kubernetes',
    'aws', 'azure', 'gcp', 'git', 'sql', 'mongodb', 'postgresql', 'mysql',
    'html', 'css', 'bootstrap', 'tailwind', 'sass', 'api', 'rest', 'graphql',
    'agile', 'scrum', 'devops', 'ci/cd', 'jenkins', 'terraform'
  ];
  
  const foundSkills = techSkills.filter(skill => 
    fullText.toLowerCase().includes(skill.toLowerCase())
  );
  
  // Extract experience level
  let experienceLevel = 'mid';
  if (fullText.toLowerCase().includes('senior') || fullText.toLowerCase().includes('lead')) {
    experienceLevel = 'senior';
  } else if (fullText.toLowerCase().includes('junior') || fullText.toLowerCase().includes('entry')) {
    experienceLevel = 'junior';
  }
  
  // Extract email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const contactEmails = fullText.match(emailRegex) || [];
  
  // Extract hiring manager name (common patterns)
  const hiringManagerName = extractHiringManagerName(jobReq.jobDescription);
  
  // Extract keywords (simplified - remove common words)
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'a', 'an'];
  const words = fullText.toLowerCase().match(/\b\w+\b/g) || [];
  const keyWords = [...new Set(words.filter(word => 
    word.length > 3 && !commonWords.includes(word)
  ))].slice(0, 20);
  
  return {
    jobTitle: jobReq.jobTitle,
    company: jobReq.company,
    keySkills: foundSkills,
    requiredSkills: jobReq.requirements || [],
    preferredSkills: jobReq.preferredSkills || [],
    keyWords,
    experienceLevel,
    location: jobReq.location,
    salaryRange: jobReq.salaryRange,
    contactEmails: contactEmails.length > 0 ? contactEmails : undefined,
    hiringManagerName
  };
}

/**
 * Extract hiring manager name from job description
 */
function extractHiringManagerName(jobDescription: string): string | undefined {
  // Common patterns for hiring manager mentions
  const patterns = [
    /contact\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /reach\s+out\s+to\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /hiring\s+manager[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /questions\?\s+contact\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)[,\s]+hiring\s+manager/i,
    /please\s+send.+to\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Validate it looks like a proper name (two words, starts with capitals)
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(name)) {
        return name;
      }
    }
  }
  
  return undefined;
}