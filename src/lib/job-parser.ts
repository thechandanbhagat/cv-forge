import { z } from "zod";

/**
 * Schema for job requirements input
 */
export const JobRequirementsSchema = z.object({
  jobTitle: z.string().describe("The job title/position"),
  company: z.string().describe("Company name"),
  jobDescription: z.string().describe("Full job description text"),
  requirements: z.array(z.string()).optional().describe("Specific requirements if separated"),
  preferredSkills: z.array(z.string()).optional().describe("Preferred skills if separated"),
  location: z.string().optional().describe("Job location"),
  salaryRange: z.string().optional().describe("Salary range if provided")
});

/**
 * Schema for user profile data
 */
export const UserProfileSchema = z.object({
  personalInfo: z.object({
    fullName: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedIn: z.string().optional(),
    github: z.string().optional(),
    website: z.string().optional()
  }),
  summary: z.string().describe("Professional summary"),
  experience: z.array(z.object({
    jobTitle: z.string(),
    company: z.string(),
    location: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    description: z.string(),
    achievements: z.array(z.string()).optional()
  })),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    location: z.string().optional(),
    graduationYear: z.string(),
    gpa: z.string().optional(),
    honors: z.array(z.string()).optional()
  })),
  skills: z.object({
    technical: z.array(z.string()),
    soft: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional()
  }),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    url: z.string().optional()
  })).optional()
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
    salaryRange: jobReq.salaryRange
  };
}