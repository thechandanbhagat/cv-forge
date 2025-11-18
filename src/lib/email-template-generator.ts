import { UserProfile, ParsedJobRequirements } from "./job-parser.js";

/**
 * Sanitize string to prevent CRLF injection in email headers/content
 * Removes carriage return (\r) and line feed (\n) characters
 */
function sanitizeCRLF(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  // Remove all CR and LF characters to prevent header injection
  return text.replace(/[\r\n]/g, '');
}

/**
 * Interface for email template data
 */
export interface EmailTemplateData {
  sender: {
    name: string;
    email: string;
  };
  recipient: {
    email: string;
    name?: string;
    company: string;
  };
  subject: string;
  body: string;
  attachments: string[];
}

/**
 * Email template types
 */
export enum EmailTemplateType {
  APPLICATION = "application",
  FOLLOW_UP = "follow_up", 
  INQUIRY = "inquiry",
  THANK_YOU = "thank_you"
}

/**
 * Generate email template for job application
 */
export function generateEmailTemplate(
  userProfile: UserProfile,
  jobRequirements: ParsedJobRequirements,
  recipientEmail: string,
  templateType: EmailTemplateType = EmailTemplateType.APPLICATION,
  hiringManagerName?: string
): EmailTemplateData {
  const subject = generateSubject(jobRequirements, templateType);
  const body = generateEmailBody(userProfile, jobRequirements, templateType, hiringManagerName);

  // SECURITY: Sanitize all fields to prevent CRLF injection
  return {
    sender: {
      name: sanitizeCRLF(userProfile.personalInfo.fullName),
      email: sanitizeCRLF(userProfile.personalInfo.email)
    },
    recipient: {
      email: sanitizeCRLF(recipientEmail),
      name: hiringManagerName ? sanitizeCRLF(hiringManagerName) : undefined,
      company: sanitizeCRLF(jobRequirements.company)
    },
    subject: sanitizeCRLF(subject),
    body,
    attachments: ["CV.pdf", "Cover_Letter.pdf"]
  };
}

/**
 * Generate email subject line
 */
function generateSubject(jobRequirements: ParsedJobRequirements, templateType: EmailTemplateType): string {
  const { jobTitle, company } = jobRequirements;
  
  switch (templateType) {
    case EmailTemplateType.APPLICATION:
      return `Application for ${jobTitle} Position at ${company}`;
    
    case EmailTemplateType.FOLLOW_UP:
      return `Following up on ${jobTitle} Application - ${company}`;
    
    case EmailTemplateType.INQUIRY:
      return `Inquiry about ${jobTitle} Opportunity at ${company}`;
    
    case EmailTemplateType.THANK_YOU:
      return `Thank you for the ${jobTitle} interview - ${company}`;
    
    default:
      return `${jobTitle} Position at ${company}`;
  }
}

/**
 * Generate email body content
 */
function generateEmailBody(
  userProfile: UserProfile,
  jobRequirements: ParsedJobRequirements,
  templateType: EmailTemplateType,
  hiringManagerName?: string
): string {
  const greeting = hiringManagerName ? `Dear ${hiringManagerName}` : "Dear Hiring Manager";
  const { jobTitle, company } = jobRequirements;
  
  switch (templateType) {
    case EmailTemplateType.APPLICATION:
      return generateApplicationEmailBody(userProfile, jobRequirements, greeting);
    
    case EmailTemplateType.FOLLOW_UP:
      return generateFollowUpEmailBody(userProfile, jobRequirements, greeting);
    
    case EmailTemplateType.INQUIRY:
      return generateInquiryEmailBody(userProfile, jobRequirements, greeting);
    
    case EmailTemplateType.THANK_YOU:
      return generateThankYouEmailBody(userProfile, jobRequirements, greeting);
    
    default:
      return generateApplicationEmailBody(userProfile, jobRequirements, greeting);
  }
}

/**
 * Generate job application email body
 */
function generateApplicationEmailBody(
  userProfile: UserProfile,
  jobRequirements: ParsedJobRequirements,
  greeting: string
): string {
  const { jobTitle, company, keySkills } = jobRequirements;
  const { fullName } = userProfile.personalInfo;
  
  // Find matching skills
  const matchingSkills = userProfile.skills.technical.filter(skill =>
    keySkills.some(reqSkill =>
      skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
      reqSkill.toLowerCase().includes(skill.toLowerCase())
    )
  ).slice(0, 4);

  const totalExperience = calculateTotalExperience(userProfile.experience);

  // SECURITY: Sanitize user-controlled data to prevent CRLF injection
  const sanitizedEmail = sanitizeCRLF(userProfile.personalInfo.email);
  const sanitizedPhone = userProfile.personalInfo.phone ? sanitizeCRLF(userProfile.personalInfo.phone) : '';
  const sanitizedFullName = sanitizeCRLF(fullName);

  return `${greeting},

I hope this email finds you well. I am writing to express my strong interest in the ${jobTitle} position at ${company}. After reviewing the job requirements, I am confident that my background and skills align perfectly with what you are seeking.

With ${totalExperience} years of professional experience, I bring expertise in ${matchingSkills.length > 0 ? matchingSkills.join(', ') : userProfile.skills.technical.slice(0, 4).join(', ')}. My proven track record of delivering high-quality results and my passion for excellence make me an ideal candidate for this role.

I have attached my CV and cover letter for your review. These documents provide detailed information about my experience, achievements, and how I can contribute to ${company}'s continued success.

I would welcome the opportunity to discuss how my skills and enthusiasm can benefit your team. Please feel free to contact me at ${sanitizedEmail} or ${sanitizedPhone || 'via email'} to schedule a conversation.

Thank you for considering my application. I look forward to hearing from you soon.

Best regards,
${sanitizedFullName}
${sanitizedEmail}
${sanitizedPhone}`;
}

/**
 * Generate follow-up email body
 */
function generateFollowUpEmailBody(
  userProfile: UserProfile,
  jobRequirements: ParsedJobRequirements,
  greeting: string
): string {
  const { jobTitle, company } = jobRequirements;
  const { fullName } = userProfile.personalInfo;

  // SECURITY: Sanitize user-controlled data to prevent CRLF injection
  const sanitizedEmail = sanitizeCRLF(userProfile.personalInfo.email);
  const sanitizedPhone = userProfile.personalInfo.phone ? sanitizeCRLF(userProfile.personalInfo.phone) : '';
  const sanitizedFullName = sanitizeCRLF(fullName);

  return `${greeting},

I hope you are doing well. I wanted to follow up on my application for the ${jobTitle} position at ${company}, which I submitted on [DATE].

I remain very interested in this opportunity and believe my skills and experience would be a valuable addition to your team. If you need any additional information or would like to schedule an interview, please don't hesitate to reach out.

I understand that you likely receive many applications, and I appreciate the time you take to review each one. I look forward to the possibility of discussing how I can contribute to ${company}'s success.

Thank you for your time and consideration.

Best regards,
${sanitizedFullName}
${sanitizedEmail}
${sanitizedPhone}`;
}

/**
 * Generate inquiry email body
 */
function generateInquiryEmailBody(
  userProfile: UserProfile,
  jobRequirements: ParsedJobRequirements,
  greeting: string
): string {
  const { jobTitle, company } = jobRequirements;
  const { fullName } = userProfile.personalInfo;

  // SECURITY: Sanitize user-controlled data to prevent CRLF injection
  const sanitizedEmail = sanitizeCRLF(userProfile.personalInfo.email);
  const sanitizedPhone = userProfile.personalInfo.phone ? sanitizeCRLF(userProfile.personalInfo.phone) : '';
  const sanitizedFullName = sanitizeCRLF(fullName);

  return `${greeting},

I hope this email finds you well. I am reaching out to inquire about the ${jobTitle} position at ${company}. I am very interested in this opportunity and would like to learn more about the role and your team.

Based on my research of ${company} and the position requirements, I believe my background would be a strong fit. I would appreciate the opportunity to discuss how my skills and experience align with your needs.

Would it be possible to schedule a brief conversation to learn more about this position? I am flexible with timing and can accommodate your schedule.

Thank you for your time, and I look forward to hearing from you.

Best regards,
${sanitizedFullName}
${sanitizedEmail}
${sanitizedPhone}`;
}

/**
 * Generate thank you email body
 */
function generateThankYouEmailBody(
  userProfile: UserProfile,
  jobRequirements: ParsedJobRequirements,
  greeting: string
): string {
  const { jobTitle, company } = jobRequirements;
  const { fullName } = userProfile.personalInfo;

  // SECURITY: Sanitize user-controlled data to prevent CRLF injection
  const sanitizedEmail = sanitizeCRLF(userProfile.personalInfo.email);
  const sanitizedPhone = userProfile.personalInfo.phone ? sanitizeCRLF(userProfile.personalInfo.phone) : '';
  const sanitizedFullName = sanitizeCRLF(fullName);

  return `${greeting},

Thank you for taking the time to interview me for the ${jobTitle} position at ${company} today. I enjoyed our conversation and learning more about the role and your team's goals.

Our discussion reinforced my enthusiasm for this opportunity. I am particularly excited about [SPECIFIC ASPECT DISCUSSED] and how I can contribute to ${company}'s success in this area.

If you need any additional information or references, please don't hesitate to reach out. I look forward to the next steps in the process.

Thank you again for your time and consideration.

Best regards,
${sanitizedFullName}
${sanitizedEmail}
${sanitizedPhone}`;
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