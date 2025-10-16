import { UserProfile, ParsedJobRequirements } from "./job-parser.js";

/**
 * Generate tailored CV content based on user profile and job requirements
 */
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
  experience: Array<{
    jobTitle: string;
    company: string;
    location?: string;
    duration: string;
    description: string;
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
  skills: {
    technical: string[];
    soft?: string[];
    languages?: string[];
    certifications?: string[];
  };
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
}

/**
 * Generate a tailored CV based on user profile and job requirements
 */
export function generateTailoredCV(
  userProfile: UserProfile,
  jobRequirements: ParsedJobRequirements
): TailoredCV {
  // Tailor the summary to match job requirements
  const tailoredSummary = tailorSummary(userProfile.summary, jobRequirements);
  
  // Prioritize relevant skills
  const relevantTechnicalSkills = prioritizeSkills(
    userProfile.skills.technical,
    jobRequirements.keySkills
  );
  
  // Tailor experience descriptions to highlight relevant achievements
  const tailoredExperience = userProfile.experience.map(exp => ({
    jobTitle: exp.jobTitle,
    company: exp.company,
    location: exp.location,
    duration: formatDuration(exp.startDate, exp.endDate),
    description: tailorExperienceDescription(exp.description, jobRequirements),
    achievements: exp.achievements?.map(achievement => 
      tailorAchievement(achievement, jobRequirements)
    ) || []
  }));
  
  // Filter and prioritize projects
  const relevantProjects = userProfile.projects
    ?.filter(project => 
      project.technologies.some(tech => 
        jobRequirements.keySkills.some(skill => 
          tech.toLowerCase().includes(skill.toLowerCase())
        )
      )
    )
    .slice(0, 3); // Show top 3 most relevant projects
  
  return {
    personalInfo: userProfile.personalInfo,
    summary: tailoredSummary,
    experience: tailoredExperience,
    education: userProfile.education.map(edu => ({
      degree: edu.degree,
      institution: edu.institution,
      location: edu.location,
      graduationYear: edu.graduationYear,
      gpa: edu.gpa,
      honors: edu.honors
    })),
    skills: {
      technical: relevantTechnicalSkills,
      soft: userProfile.skills.soft,
      languages: userProfile.skills.languages,
      certifications: userProfile.skills.certifications
    },
    projects: relevantProjects
  };
}

/**
 * Tailor the professional summary to match job requirements
 */
function tailorSummary(summary: string, jobReq: ParsedJobRequirements): string {
  let tailoredSummary = summary;
  
  // Add job-specific keywords if not already present
  jobReq.keySkills.forEach(skill => {
    if (!tailoredSummary.toLowerCase().includes(skill.toLowerCase())) {
      tailoredSummary += ` Experienced with ${skill}.`;
    }
  });
  
  // Adjust for experience level
  if (jobReq.experienceLevel === 'senior' && !tailoredSummary.toLowerCase().includes('senior')) {
    tailoredSummary = tailoredSummary.replace('experienced', 'senior experienced');
  }
  
  return tailoredSummary;
}

/**
 * Prioritize skills based on job requirements
 */
function prioritizeSkills(userSkills: string[], requiredSkills: string[]): string[] {
  const requiredSet = new Set(requiredSkills.map(skill => skill.toLowerCase()));
  const prioritized: string[] = [];
  const others: string[] = [];
  
  userSkills.forEach(skill => {
    if (requiredSet.has(skill.toLowerCase()) || 
        requiredSkills.some(req => skill.toLowerCase().includes(req.toLowerCase()))) {
      prioritized.push(skill);
    } else {
      others.push(skill);
    }
  });
  
  return [...prioritized, ...others];
}

/**
 * Tailor experience description to highlight relevant aspects
 */
function tailorExperienceDescription(description: string, jobReq: ParsedJobRequirements): string {
  let tailored = description;
  
  // Highlight technologies mentioned in job requirements
  jobReq.keySkills.forEach(skill => {
    const regex = new RegExp(`\\b${skill}\\b`, 'gi');
    if (tailored.match(regex)) {
      tailored = tailored.replace(regex, `**${skill}**`);
    }
  });
  
  return tailored;
}

/**
 * Tailor achievement statements to be more relevant
 */
function tailorAchievement(achievement: string, jobReq: ParsedJobRequirements): string {
  let tailored = achievement;
  
  // Highlight relevant keywords
  jobReq.keyWords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (tailored.match(regex)) {
      tailored = tailored.replace(regex, `**${keyword}**`);
    }
  });
  
  return tailored;
}

/**
 * Format employment duration
 */
function formatDuration(startDate: string, endDate?: string): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const endMonth = endDate ? 
    end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 
    'Present';
  
  return `${startMonth} - ${endMonth}`;
}