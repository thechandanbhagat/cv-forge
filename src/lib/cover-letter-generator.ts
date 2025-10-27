import { UserProfile, ParsedJobRequirements } from "./job-parser.js";

/**
 * Interface for cover letter data
 */
export interface CoverLetterData {
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    github?: string;
    website?: string;
  };
  recipient: {
    companyName: string;
    hiringManagerName?: string;
    department?: string;
    jobTitle: string;
    emailAddress?: string;
  };
  content: {
    opening: string;
    body: string[];
    closing: string;
  };
  signature: string;
}

/**
 * Generate a tailored cover letter based on user profile and job requirements
 */
export function generateCoverLetter(
  userProfile: UserProfile,
  jobRequirements: ParsedJobRequirements,
  hiringManagerName?: string,
  emailAddress?: string
): CoverLetterData {
  const { personalInfo } = userProfile;
  const { jobTitle, company, keySkills, experienceLevel } = jobRequirements;

  // Generate opening paragraph
  const opening = generateOpening(jobTitle, company, hiringManagerName);

  // Generate body paragraphs
  const bodyParagraphs = generateBodyParagraphs(userProfile, jobRequirements);

  // Generate closing paragraph
  const closing = generateClosing(company, jobTitle);

  // Generate signature
  const signature = generateSignature(personalInfo);

  return {
    personalInfo,
    recipient: {
      companyName: company,
      hiringManagerName,
      jobTitle,
      emailAddress
    },
    content: {
      opening,
      body: bodyParagraphs,
      closing
    },
    signature
  };
}

/**
 * Generate opening paragraph
 */
function generateOpening(jobTitle: string, company: string, hiringManagerName?: string): string {
  const greeting = hiringManagerName ? `Dear ${hiringManagerName}` : "Dear Hiring Manager";
  
  const openings = [
    `${greeting},\n\nI am writing to express my strong interest in the ${jobTitle} position at ${company}. With my proven track record and passion for excellence, I am excited about the opportunity to contribute to your team's success.`,
    
    `${greeting},\n\nI was delighted to discover the ${jobTitle} opening at ${company}. Your company's reputation for innovation and excellence aligns perfectly with my career aspirations and professional values.`,
    
    `${greeting},\n\nI am excited to submit my application for the ${jobTitle} role at ${company}. Having researched your organization extensively, I am impressed by your commitment to quality and would welcome the opportunity to contribute to your continued growth.`
  ];

  return openings[Math.floor(Math.random() * openings.length)];
}

/**
 * Generate body paragraphs highlighting relevant experience and skills
 */
function generateBodyParagraphs(userProfile: UserProfile, jobRequirements: ParsedJobRequirements): string[] {
  const paragraphs: string[] = [];

  // Paragraph 1: Experience and qualifications
  const experienceParagraph = generateExperienceParagraph(userProfile, jobRequirements);
  paragraphs.push(experienceParagraph);

  // Paragraph 2: Technical skills and achievements
  const skillsParagraph = generateSkillsParagraph(userProfile, jobRequirements);
  paragraphs.push(skillsParagraph);

  // Paragraph 3: Cultural fit and enthusiasm (if we have enough content)
  if (userProfile.projects && userProfile.projects.length > 0) {
    const projectsParagraph = generateProjectsParagraph(userProfile, jobRequirements);
    paragraphs.push(projectsParagraph);
  }

  return paragraphs;
}

/**
 * Generate experience-focused paragraph
 */
function generateExperienceParagraph(userProfile: UserProfile, jobRequirements: ParsedJobRequirements): string {
  const totalYears = calculateTotalExperience(userProfile.experience);
  const relevantExperience = userProfile.experience.slice(0, 2); // Focus on most recent roles
  
  let paragraph = `In my ${totalYears} years of professional experience, I have developed a comprehensive skill set that directly aligns with your requirements for this ${jobRequirements.jobTitle} position. `;

  if (relevantExperience.length > 0) {
    const mostRecentRole = relevantExperience[0];
    paragraph += `Most recently, as ${mostRecentRole.jobTitle} at ${mostRecentRole.company}, I have successfully `;
    
    // Highlight key achievements that match job requirements
    const relevantAchievements = mostRecentRole.achievements?.filter(achievement =>
      jobRequirements.keySkills.some(skill =>
        achievement.toLowerCase().includes(skill.toLowerCase())
      )
    ) || [];

    if (relevantAchievements.length > 0) {
      paragraph += relevantAchievements.slice(0, 2).join(', and ').toLowerCase();
    } else {
      paragraph += "delivered impactful results and exceeded performance expectations";
    }
    paragraph += ".";
  }

  return paragraph;
}

/**
 * Generate skills-focused paragraph
 */
function generateSkillsParagraph(userProfile: UserProfile, jobRequirements: ParsedJobRequirements): string {
  const matchingSkills = userProfile.skills.technical.filter(skill =>
    jobRequirements.keySkills.some(reqSkill =>
      skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
      reqSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );

  let paragraph = "My technical expertise includes ";
  
  if (matchingSkills.length > 0) {
    paragraph += matchingSkills.slice(0, 5).join(", ");
    paragraph += ", which directly supports the requirements outlined in your job posting. ";
  } else {
    paragraph += userProfile.skills.technical.slice(0, 5).join(", ");
    paragraph += ", providing a strong foundation for this role. ";
  }

  // Add soft skills if available
  if (userProfile.skills.soft && userProfile.skills.soft.length > 0) {
    paragraph += `Additionally, my strong ${userProfile.skills.soft.slice(0, 3).join(", ").toLowerCase()} skills enable me to collaborate effectively and drive results in dynamic environments.`;
  }

  return paragraph;
}

/**
 * Generate projects-focused paragraph
 */
function generateProjectsParagraph(userProfile: UserProfile, jobRequirements: ParsedJobRequirements): string {
  const relevantProjects = userProfile.projects?.filter(project =>
    project.technologies.some(tech =>
      jobRequirements.keySkills.some(skill =>
        tech.toLowerCase().includes(skill.toLowerCase())
      )
    )
  ) || [];

  let paragraph = "I am particularly excited about this opportunity because ";

  if (relevantProjects.length > 0) {
    const project = relevantProjects[0];
    paragraph += `my recent work on ${project.name} demonstrates my ability to ${project.description.toLowerCase()}. `;
    paragraph += `This project utilized ${project.technologies.slice(0, 3).join(", ")}, technologies that are directly relevant to your needs.`;
  } else {
    paragraph += `your company's focus on innovation aligns perfectly with my passion for tackling complex challenges and delivering high-quality solutions. `;
    paragraph += `I am eager to bring my problem-solving abilities and technical expertise to contribute meaningfully to your team's objectives.`;
  }

  return paragraph;
}

/**
 * Generate closing paragraph
 */
function generateClosing(company: string, jobTitle: string): string {
  const closings = [
    `I am enthusiastic about the possibility of joining ${company} and contributing to your continued success. I would welcome the opportunity to discuss how my background and passion for excellence can benefit your team. Thank you for considering my application.`,
    
    `I am excited about the opportunity to bring my skills and enthusiasm to the ${jobTitle} role at ${company}. I look forward to discussing how I can contribute to your team's goals and would appreciate the chance to speak with you further about this position.`,
    
    `Thank you for taking the time to review my application. I am confident that my experience and dedication make me a strong candidate for the ${jobTitle} position, and I would be thrilled to discuss how I can contribute to ${company}'s continued growth and success.`
  ];

  return closings[Math.floor(Math.random() * closings.length)];
}

/**
 * Generate professional signature
 */
function generateSignature(personalInfo: UserProfile['personalInfo']): string {
  let signature = `Sincerely,\n${personalInfo.fullName}`;
  
  const contactDetails: string[] = [];
  if (personalInfo.email) contactDetails.push(personalInfo.email);
  if (personalInfo.phone) contactDetails.push(personalInfo.phone);
  if (personalInfo.linkedIn) contactDetails.push(personalInfo.linkedIn);
  
  if (contactDetails.length > 0) {
    signature += `\n${contactDetails.join(" | ")}`;
  }
  
  return signature;
}

/**
 * Calculate total years of experience
 */
function calculateTotalExperience(experience: UserProfile['experience']): number {
  if (!experience || experience.length === 0) return 0;

  let totalMonths = 0;
  experience.forEach(exp => {
    const startDate = new Date(exp.startDate);
    const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
    
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                    (endDate.getMonth() - startDate.getMonth());
      totalMonths += Math.max(0, months);
    }
  });

  return Math.max(1, Math.round(totalMonths / 12));
}

/**
 * Format cover letter as text
 */
export function formatCoverLetterAsText(coverLetter: CoverLetterData): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let text = "";
  
  // Header with personal info
  text += `${coverLetter.personalInfo.fullName}\n`;
  if (coverLetter.personalInfo.email) text += `${coverLetter.personalInfo.email}\n`;
  if (coverLetter.personalInfo.phone) text += `${coverLetter.personalInfo.phone}\n`;
  if (coverLetter.personalInfo.location) text += `${coverLetter.personalInfo.location}\n`;
  text += `\n${currentDate}\n\n`;

  // Recipient info
  if (coverLetter.recipient.hiringManagerName) {
    text += `${coverLetter.recipient.hiringManagerName}\n`;
  }
  text += `${coverLetter.recipient.companyName}\n`;
  if (coverLetter.recipient.emailAddress) {
    text += `${coverLetter.recipient.emailAddress}\n`;
  }
  text += `\nRe: Application for ${coverLetter.recipient.jobTitle} Position\n\n`;

  // Cover letter content
  text += `${coverLetter.content.opening}\n\n`;
  
  coverLetter.content.body.forEach(paragraph => {
    text += `${paragraph}\n\n`;
  });
  
  text += `${coverLetter.content.closing}\n\n`;
  text += `${coverLetter.signature}`;

  return text;
}

/**
 * Format cover letter as HTML
 */
export function formatCoverLetterAsHTML(coverLetter: CoverLetterData): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cover Letter - ${coverLetter.personalInfo.fullName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Calibri', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #fff;
        }
        
        .header {
            text-align: left;
            margin-bottom: 30px;
        }
        
        .header h1 {
            margin: 0;
            color: #2c3e50;
            font-size: 24px;
        }
        
        .contact-info {
            margin: 10px 0;
            color: #7f8c8d;
        }
        
        .date {
            margin: 20px 0;
            font-weight: 500;
        }
        
        .recipient {
            margin: 20px 0;
            font-weight: 500;
        }
        
        .subject {
            margin: 20px 0;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .content {
            margin: 30px 0;
        }
        
        .content p {
            margin-bottom: 20px;
            text-align: justify;
        }
        
        .signature {
            margin-top: 30px;
            white-space: pre-line;
        }
        
        @media print {
            body {
                padding: 0;
                background: white;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${coverLetter.personalInfo.fullName}</h1>
        <div class="contact-info">
            ${coverLetter.personalInfo.email || ''}
            ${coverLetter.personalInfo.phone ? ' | ' + coverLetter.personalInfo.phone : ''}
            ${coverLetter.personalInfo.location ? ' | ' + coverLetter.personalInfo.location : ''}
        </div>
    </div>
    
    <div class="date">${currentDate}</div>
    
    <div class="recipient">
        ${coverLetter.recipient.hiringManagerName || ''}${coverLetter.recipient.hiringManagerName ? '<br>' : ''}
        ${coverLetter.recipient.companyName}
        ${coverLetter.recipient.emailAddress ? '<br>' + coverLetter.recipient.emailAddress : ''}
    </div>
    
    <div class="subject">Re: Application for ${coverLetter.recipient.jobTitle} Position</div>
    
    <div class="content">
        <p>${coverLetter.content.opening.replace(/\n\n/g, '</p><p>')}</p>
        ${coverLetter.content.body.map(paragraph => `<p>${paragraph}</p>`).join('')}
        <p>${coverLetter.content.closing}</p>
    </div>
    
    <div class="signature">${coverLetter.signature}</div>
</body>
</html>`;
}