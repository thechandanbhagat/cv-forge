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
  
  // Group and tailor experience to handle multiple roles at same company
  const tailoredExperience = groupAndTailorExperience(userProfile.experience, jobRequirements);
  
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
  
  // Check if startDate is valid
  if (isNaN(start.getTime())) {
    return 'Invalid start date';
  }
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  
  // Check if endDate is provided and valid
  if (!endDate || endDate.trim() === '' || endDate.toLowerCase() === 'present') {
    return `${startMonth} - Present`;
  }
  
  const end = new Date(endDate);
  
  // Check if endDate is valid
  if (isNaN(end.getTime())) {
    return `${startMonth} - Present`;
  }
  
  const endMonth = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return `${startMonth} - ${endMonth}`;
}

/**
 * Group multiple roles at the same company and tailor experience
 */
function groupAndTailorExperience(
  experiences: UserProfile['experience'], 
  jobRequirements: ParsedJobRequirements
): TailoredCV['experience'] {
  // Group experiences by company
  const companiesMap = new Map<string, UserProfile['experience']>();
  
  experiences.forEach(exp => {
    const company = exp.company.trim();
    if (!companiesMap.has(company)) {
      companiesMap.set(company, []);
    }
    companiesMap.get(company)!.push(exp);
  });
  
  const tailoredExperience: TailoredCV['experience'] = [];
  
  // Process each company
  companiesMap.forEach((companyExperiences, company) => {
    // Sort by start date (most recent first)
    companyExperiences.sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return dateB.getTime() - dateA.getTime();
    });
    
    if (companyExperiences.length === 1) {
      // Single role at company - process normally
      const exp = companyExperiences[0];
      tailoredExperience.push({
        jobTitle: exp.jobTitle,
        company: exp.company,
        location: exp.location,
        duration: formatDuration(exp.startDate, exp.endDate),
        description: tailorExperienceDescription(exp.description, jobRequirements),
        achievements: exp.achievements?.map(achievement => 
          tailorAchievement(achievement, jobRequirements)
        ) || []
      });
    } else {
      // Multiple roles at same company - consolidate
      const mostRecentRole = companyExperiences[0];
      const earliestRole = companyExperiences[companyExperiences.length - 1];
      
      // Create consolidated title showing progression
      const allTitles = companyExperiences.map(exp => exp.jobTitle).reverse();
      const consolidatedTitle = allTitles.length > 2 
        ? `${mostRecentRole.jobTitle} (Previously: ${allTitles.slice(0, -1).join(', ')})`
        : `${mostRecentRole.jobTitle} (Previously: ${allTitles.slice(0, -1).join(', ')})`;
      
      // Calculate total duration from earliest start to most recent end
      const totalDuration = formatDuration(earliestRole.startDate, mostRecentRole.endDate);
      
      // Combine descriptions and achievements from all roles
      const allDescriptions = companyExperiences
        .map(exp => tailorExperienceDescription(exp.description, jobRequirements))
        .filter(desc => desc.trim().length > 0);
      
      const consolidatedDescription = allDescriptions.length > 1
        ? `Career progression through multiple roles: ${allDescriptions.join(' ')}`
        : allDescriptions[0] || '';
      
      // Collect all achievements from all roles (remove duplicates)
      const allAchievements = new Set<string>();
      companyExperiences.forEach(exp => {
        exp.achievements?.forEach(achievement => {
          const tailored = tailorAchievement(achievement, jobRequirements);
          if (tailored.trim().length > 0) {
            allAchievements.add(tailored);
          }
        });
      });
      
      // Add role progression summary as first achievement
      const roleProgressionSummary = `Progressed through ${companyExperiences.length} roles: ${companyExperiences.map(exp => 
        `${exp.jobTitle} (${formatDuration(exp.startDate, exp.endDate)})`
      ).reverse().join(' → ')}`;
      
      tailoredExperience.push({
        jobTitle: consolidatedTitle,
        company: company,
        location: mostRecentRole.location,
        duration: totalDuration,
        description: consolidatedDescription,
        achievements: [roleProgressionSummary, ...Array.from(allAchievements)]
      });
    }
  });
  
  // Sort final experience by most recent start date
  tailoredExperience.sort((a, b) => {
    // For consolidated roles, we'll use a heuristic based on the duration string
    const extractYear = (duration: string) => {
      const match = duration.match(/(\d{4})/g);
      return match ? Math.max(...match.map(Number)) : 0;
    };
    
    return extractYear(b.duration) - extractYear(a.duration);
  });
  
  return tailoredExperience;
}