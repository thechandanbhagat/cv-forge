import MarkdownIt from "markdown-it";
import { mdToPdf } from "md-to-pdf";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import escapeHtml from "escape-html";
import { sanitizeFileName, validateAndNormalizePath, safeJoinPath, ensureDirectoryExists } from "./path-utils.js";

export interface CVData {
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

export enum OutputFormat {
  MARKDOWN = "markdown",
  PDF = "pdf",
  HTML = "html"
}

/**
 * Convert CV data to Markdown format
 */
export function formatCVAsMarkdown(cvData: any): string {
  // Validate that we have the required data structure
  if (!cvData || typeof cvData !== 'object') {
    throw new Error('Invalid CV data: Expected an object');
  }
  
  if (!cvData.personalInfo || !cvData.personalInfo.fullName) {
    throw new Error('Invalid CV data: Missing personalInfo.fullName');
  }
  
  let markdown = "";
  
  // Header
  markdown += `# ${cvData.personalInfo.fullName}\n\n`;
  
  // Contact Information
  const contactInfo = [
    cvData.personalInfo.email,
    cvData.personalInfo.phone,
    cvData.personalInfo.location,
    cvData.personalInfo.linkedIn,
    cvData.personalInfo.github,
    cvData.personalInfo.website
  ].filter(Boolean);
  
  if (contactInfo.length > 0) {
    markdown += `**Contact:** ${contactInfo.join(" | ")}\n\n`;
  }
  
  markdown += "---\n\n";
  
  // Professional Summary
  markdown += "## Professional Summary\n\n";
  markdown += `${cvData.summary}\n\n`;
  
  // Skills
  markdown += "## Skills\n\n";
  
  if (cvData.skills && typeof cvData.skills === 'object') {
    if (cvData.skills.technical && Array.isArray(cvData.skills.technical) && cvData.skills.technical.length > 0) {
      markdown += `**Technical Skills:** ${cvData.skills.technical.join(", ")}\n\n`;
    }
    
    if (cvData.skills.soft && Array.isArray(cvData.skills.soft) && cvData.skills.soft.length > 0) {
      markdown += `**Soft Skills:** ${cvData.skills.soft.join(", ")}\n\n`;
    }
    
    if (cvData.skills.languages && Array.isArray(cvData.skills.languages) && cvData.skills.languages.length > 0) {
      markdown += `**Languages:** ${cvData.skills.languages.join(", ")}\n\n`;
    }
    
    if (cvData.skills.certifications && Array.isArray(cvData.skills.certifications) && cvData.skills.certifications.length > 0) {
      markdown += `**Certifications:** ${cvData.skills.certifications.join(", ")}\n\n`;
    }
  }
  
  // Experience
  markdown += "## Experience\n\n";
  if (cvData.experience && Array.isArray(cvData.experience)) {
    cvData.experience.forEach((exp: any) => {
      if (!exp.jobTitle || !exp.company) {
        return;
      }
      
      markdown += `### ${exp.jobTitle} | ${exp.company}\n`;
      
      const expDetails = [exp.location, exp.duration].filter(Boolean);
      if (expDetails.length > 0) {
        markdown += `*${expDetails.join(" | ")}*\n\n`;
      }
      
      if (exp.description) {
        markdown += `${exp.description}\n\n`;
      }
      
      if (exp.achievements && Array.isArray(exp.achievements) && exp.achievements.length > 0) {
        markdown += "**Key Achievements:**\n";
        exp.achievements.forEach((achievement: any) => {
          if (typeof achievement === 'string') {
            // Remove markdown formatting from achievements for cleaner output
            const cleanAchievement = achievement.replace(/\*\*(.*?)\*\*/g, "$1");
            markdown += `- ${cleanAchievement}\n`;
          }
        });
        markdown += "\n";
      }
    });
  }
  
  // Education
  markdown += "## Education\n\n";
  if (cvData.education && Array.isArray(cvData.education)) {
    cvData.education.forEach((edu: any) => {
      if (!edu.degree || !edu.institution) {
        return;
      }
      
      markdown += `### ${edu.degree}\n`;
      markdown += `**${edu.institution}**`;
      
      const eduDetails = [edu.location, edu.graduationYear];
      if (edu.gpa) eduDetails.push(`GPA: ${edu.gpa}`);
      
      if (eduDetails.filter(Boolean).length > 0) {
        markdown += ` | *${eduDetails.filter(Boolean).join(" | ")}*`;
      }
      markdown += "\n\n";
      
      if (edu.honors && Array.isArray(edu.honors) && edu.honors.length > 0) {
        markdown += `**Honors:** ${edu.honors.join(", ")}\n\n`;
      }
    });
  }
  
  // Projects
  if (cvData.projects && Array.isArray(cvData.projects) && cvData.projects.length > 0) {
    markdown += "## Projects\n\n";
    cvData.projects.forEach((project: any) => {
      if (!project.name || !project.description) {
        return;
      }
      
      markdown += `### ${project.name}\n`;
      
      if (project.url) {
        markdown += `*Project URL: ${project.url}*\n\n`;
      }
      
      markdown += `${project.description}\n\n`;
      
      if (project.technologies && Array.isArray(project.technologies)) {
        markdown += `**Technologies:** ${project.technologies.join(", ")}\n\n`;
      }
    });
  }
  
  return markdown;
}

/**
 * Convert CV data to HTML format
 */
export function formatCVAsHTML(cvData: any): string {
  // Validation is handled in formatCVAsMarkdown
  const markdown = formatCVAsMarkdown(cvData);
  // SECURITY: Disable HTML pass-through to prevent HTML injection attacks
  const md = new MarkdownIt({
    html: false,  // Disable raw HTML for security
    linkify: true,
    typographer: true
  });
  
  const htmlContent = md.render(markdown);

  // Escape fullName for use in title to prevent XSS
  const escapedFullName = escapeHtml(cvData.personalInfo.fullName);

  // Wrap in a complete HTML document with professional styling
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapedFullName} - Resume</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #fff;
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        h2 {
            color: #2980b9;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 5px;
            margin-top: 30px;
        }
        
        h3 {
            color: #34495e;
            margin-bottom: 5px;
        }
        
        hr {
            border: none;
            border-top: 2px solid #ecf0f1;
            margin: 20px 0;
        }
        
        strong {
            color: #2c3e50;
        }
        
        em {
            color: #7f8c8d;
        }
        
        ul {
            padding-left: 20px;
        }
        
        li {
            margin-bottom: 5px;
        }
        
        @media print {
            body {
                padding: 0;
                background: white;
            }
            
            h1, h2, h3 {
                page-break-after: avoid;
            }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
}

/**
 * Generate CV document in specified format
 */
export interface PDFOptions {
  pageSize?: string;
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export async function generateDocument(
  cvData: any,
  outputPath: string,
  fileName: string,
  format: OutputFormat = OutputFormat.PDF,
  pdfOptions?: PDFOptions
): Promise<string> {
  // Validate and normalize the output path to prevent path traversal
  const validatedOutputPath = validateAndNormalizePath(outputPath);

  // Ensure output directory exists
  await ensureDirectoryExists(validatedOutputPath);

  // Sanitize filename to prevent path traversal
  const sanitizedFileName = sanitizeFileName(fileName);
  const baseName = sanitizedFileName.replace(/\.[^/.]+$/, ""); // Remove extension if present

  switch (format) {
    case OutputFormat.MARKDOWN: {
      const markdown = formatCVAsMarkdown(cvData);
      const filePath = safeJoinPath(validatedOutputPath, `${baseName}.md`);
      await fs.writeFile(filePath, markdown, 'utf-8');
      return filePath;
    }

    case OutputFormat.HTML: {
      const html = formatCVAsHTML(cvData);
      const filePath = safeJoinPath(validatedOutputPath, `${baseName}.html`);
      await fs.writeFile(filePath, html, 'utf-8');
      return filePath;
    }

    case OutputFormat.PDF: {
      const markdown = formatCVAsMarkdown(cvData);
      const filePath = safeJoinPath(validatedOutputPath, `${baseName}.pdf`);
      
      console.error(`[DEBUG document-generator] outputPath parameter: ${outputPath}`);
      console.error(`[DEBUG document-generator] validated outputPath: ${validatedOutputPath}`);
      console.error(`[DEBUG document-generator] baseName: ${baseName}`);
      console.error(`[DEBUG document-generator] resolved filePath: ${filePath}`);

      try {
        // Directory already ensured to exist above
        console.error(`[DEBUG document-generator] Using validated directory: ${validatedOutputPath}`);
        
        // Create a temporary CSS file
        const tempCssPath = path.join(os.tmpdir(), `cv-style-${Date.now()}.css`);
        
        // Get font configuration from environment variables
        // MS Word 10pt ≈ 13.33px, 9pt ≈ 12px
        const baseFontSize = process.env.PDF_BASE_FONT_SIZE || '12px';
        const lineHeight = process.env.PDF_LINE_HEIGHT || '1.4';
        const h1FontSize = process.env.PDF_H1_FONT_SIZE || '20px';
        const h2FontSize = process.env.PDF_H2_FONT_SIZE || '15px';
        const h3FontSize = process.env.PDF_H3_FONT_SIZE || '13px';
        const paragraphSpacing = process.env.PDF_PARAGRAPH_SPACING || '8px';
        const sectionSpacing = process.env.PDF_SECTION_SPACING || '12px';
        
        const cssContent = `body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Calibri', sans-serif;
          font-size: ${baseFontSize};
          line-height: ${lineHeight};
          color: #333;
          max-width: none;
          margin: 0;
          padding: 20px;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 6px;
          margin-bottom: ${sectionSpacing};
          margin-top: 0;
          font-size: ${h1FontSize};
          font-weight: 600;
          line-height: 1.2;
        }
        h2 {
          color: #2980b9;
          border-bottom: 1px solid #bdc3c7;
          padding-bottom: 3px;
          margin-top: ${sectionSpacing};
          margin-bottom: ${paragraphSpacing};
          font-size: ${h2FontSize};
          font-weight: 600;
          line-height: 1.3;
        }
        h3 {
          color: #34495e;
          margin-bottom: 4px;
          margin-top: ${paragraphSpacing};
          font-size: ${h3FontSize};
          font-weight: 600;
          line-height: 1.3;
        }
        p {
          margin-top: 0;
          margin-bottom: ${paragraphSpacing};
        }
        strong {
          color: #2c3e50;
          font-weight: 600;
        }
        em {
          color: #7f8c8d;
        }
        ul {
          margin: ${paragraphSpacing} 0;
          padding-left: 20px;
        }
        li {
          margin-bottom: 3px;
          line-height: ${lineHeight};
        }
        hr {
          border: none;
          border-top: 1px solid #ecf0f1;
          margin: 20px 0;
        }`;
        
        await fs.writeFile(tempCssPath, cssContent, 'utf-8');
        
        console.error(`[DEBUG document-generator] About to call mdToPdf with dest: ${filePath}`);
        
        // Get page size and margins from options or environment variables
        const pageSize = pdfOptions?.pageSize || process.env.PDF_PAGE_SIZE || 'A4';
        const margins = {
          top: pdfOptions?.margins?.top || process.env.PDF_MARGIN_TOP || '10mm',
          right: pdfOptions?.margins?.right || process.env.PDF_MARGIN_RIGHT || '10mm',
          bottom: pdfOptions?.margins?.bottom || process.env.PDF_MARGIN_BOTTOM || '10mm',
          left: pdfOptions?.margins?.left || process.env.PDF_MARGIN_LEFT || '10mm'
        };

        console.error(`[DEBUG document-generator] Using page size: ${pageSize}`);
        console.error(`[DEBUG document-generator] Using margins: ${JSON.stringify(margins)}`);

        // Generate PDF with the temporary CSS file
        const pdf = await mdToPdf(
          { content: markdown },
          {
            dest: filePath,
            pdf_options: {
              format: pageSize as any,
              margin: margins,
              printBackground: true
            },
            launch_options: {
              args: ['--no-sandbox', '--disable-setuid-sandbox']
            },
            stylesheet: [tempCssPath]
          }
        );
        
        // Clean up temporary CSS file
        try {
          await fs.unlink(tempCssPath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        
        // Verify the PDF was created
        if (!pdf || !pdf.filename) {
          throw new Error(`PDF generation failed - no output file created`);
        }
        
        // Verify file exists
        try {
          await fs.access(filePath);
          return filePath;
        } catch (accessError) {
          throw new Error(`PDF file was not created at ${filePath}`);
        }
        
      } catch (error) {
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}