#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

import { 
  JobRequirementsSchema, 
  UserProfileSchema, 
  parseJobRequirements,
  type JobRequirements,
  type UserProfile 
} from "./lib/job-parser.js";
import { generateTailoredCV } from "./lib/cv-generator.js";
import { 
  generateDocument, 
  formatCVAsMarkdown,
  OutputFormat,
  type CVData,
  type PDFOptions 
} from "./lib/document-generator.js";
import { 
  generateCoverLetter, 
  formatCoverLetterAsText, 
  formatCoverLetterAsHTML,
  type CoverLetterData 
} from "./lib/cover-letter-generator.js";
import {
  generateEmailTemplate,
  EmailTemplateType,
  type EmailTemplateData
} from "./lib/email-template-generator.js";
import { sanitizeFileName, validateAndNormalizePath, safeJoinPath, ensureDirectoryExists } from "./lib/path-utils.js";
import { sanitizeErrorMessage, createSafeErrorResponse } from "./lib/error-utils.js";

/**
 * CV Maker MCP Server
 * 
 * This server provides tools for generating ATS-friendly CVs based on job requirements.
 * It can parse job postings, generate tailored CV content, and create text documents.
 */

/**
 * Get the default output path from environment variables or user's Documents folder
 */
function getDefaultOutputPath(): string {
  const envPath = process.env.DEFAULT_OUTPUT_PATH;
  console.error(`[DEBUG] DEFAULT_OUTPUT_PATH env var: ${envPath}`);
  // SECURITY: Never log all environment variables as they may contain sensitive data
  // console.error(`[DEBUG] All env vars: ${JSON.stringify(process.env, null, 2)}`);

  if (envPath) {
    const resolved = path.resolve(envPath.replace(/\//g, path.sep));
    console.error(`[DEBUG] Resolved output path: ${resolved}`);
    return resolved;
  }
  
  // Fallback to user's Documents/CVs folder
  const homeDir = process.env.USERPROFILE || process.env.HOME;
  if (homeDir) {
    const fallback = path.join(homeDir, 'Documents', 'CVs');
    console.error(`[DEBUG] Using fallback path: ${fallback}`);
    return fallback;
  }
  
  // Final fallback
  const finalFallback = path.resolve('./generated-cvs');
  console.error(`[DEBUG] Using final fallback path: ${finalFallback}`);
  return finalFallback;
}

const server = new McpServer({
  name: "cv-forge",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

// Register MCP Tools
server.registerTool(
  "parse_job_requirements",
  {
    description: "Parse job requirements and extract key information for CV tailoring",
    inputSchema: {
      jobTitle: z.string().describe("The job title/position"),
      company: z.string().describe("Company name"), 
      jobDescription: z.string().describe("Full job description text"),
      requirements: z.array(z.string()).optional().describe("Specific requirements if separated"),
      preferredSkills: z.array(z.string()).optional().describe("Preferred skills if separated"),
      location: z.string().optional().describe("Job location"),
      salaryRange: z.string().optional().describe("Salary range if provided")
    }
  },
  async (args) => {
    try {
      const parsedRequirements = parseJobRequirements(args);
      
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(parsedRequirements, null, 2)
          }
        ]
      };
    } catch (error) {
      return createSafeErrorResponse(error, 'parse_job');
    }
  }
);

server.registerTool(
  "generate_cv_data",
  {
    description: "Generate tailored CV content based on user profile and job requirements (returns structured data)",
    inputSchema: {
      userProfile: UserProfileSchema,
      jobRequirements: JobRequirementsSchema
    }
  },
  async (args) => {
    try {
      const { userProfile, jobRequirements } = args;
      
      // Parse job requirements
      const parsedJobReq = parseJobRequirements(jobRequirements);
      
      // Generate tailored CV
      const tailoredCV = generateTailoredCV(userProfile, parsedJobReq);
      
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              message: "CV data successfully generated",
              tailoredCV,
              parsedJobRequirements: parsedJobReq
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return createSafeErrorResponse(error, 'generate_cv');
    }
  }
);

server.registerTool(
  "generate_and_save_cv_pdf",
  {
    description: "Generate tailored CV and save specifically as PDF format (legacy tool - consider using 'generate_cv' which defaults to PDF). If outputPath is not provided, uses DEFAULT_OUTPUT_PATH from environment.",
    inputSchema: {
      userProfile: UserProfileSchema,
      jobRequirements: JobRequirementsSchema,
      outputPath: z.string().optional().describe("Directory path where the CV should be saved (optional, uses DEFAULT_OUTPUT_PATH if not provided)"),
      fileName: z.string().optional().describe("Custom filename (without extension)"),
      pageSize: z.string().optional().describe("PDF page size (e.g., 'A4', 'Letter', 'Legal') - uses PDF_PAGE_SIZE env var if not provided"),
      margins: z.object({
        top: z.string().optional().describe("Top margin (e.g., '10mm', '0.8in')"),
        right: z.string().optional().describe("Right margin (e.g., '10mm', '0.8in')"),
        bottom: z.string().optional().describe("Bottom margin (e.g., '10mm', '0.8in')"),
        left: z.string().optional().describe("Left margin (e.g., '10mm', '0.8in')")
      }).optional().describe("PDF margins - uses PDF_MARGIN_* env vars if not provided")
    }
  },
  async (args) => {
    try {
      const { userProfile, jobRequirements, fileName = "professional_cv", pageSize, margins } = args;
      // Use default path if outputPath is not provided, is "./" or is empty
      const outputPath = (args.outputPath && args.outputPath !== "./" && args.outputPath.trim() !== "") 
        ? args.outputPath 
        : getDefaultOutputPath();
      
      console.error(`[DEBUG generate_and_save_cv_pdf] Received outputPath: ${args.outputPath}`);
      console.error(`[DEBUG generate_and_save_cv_pdf] Using outputPath: ${outputPath}`);
      
      // Parse job requirements
      const parsedJobReq = parseJobRequirements(jobRequirements);
      
      // Generate tailored CV
      const tailoredCV = generateTailoredCV(userProfile, parsedJobReq);
      
      // Prepare PDF options
      const pdfOptions: PDFOptions = {
        pageSize,
        margins
      };

      // Generate PDF directly
      const filePath = await generateDocument(
        tailoredCV,
        outputPath,
        fileName,
        OutputFormat.PDF,
        pdfOptions
      );
      
      return {
        content: [
          {
            type: "text" as const,
            text: `CV successfully generated and saved as PDF: ${filePath}\n\nTailored for: ${jobRequirements.jobTitle} at ${jobRequirements.company}`
          }
        ]
      };
    } catch (error) {
      return createSafeErrorResponse(error, 'save_pdf');
    }
  }
);

server.registerTool(
  "save_cv_text",
  {
    description: "Save CV content as a text file to specified location",
    inputSchema: {
      cvData: z.any().describe("Tailored CV data object"),
      outputPath: z.string().describe("Directory path where the CV should be saved"),
      fileName: z.string().optional().describe("Optional custom filename (without extension)")
    }
  },
  async (args) => {
    try {
      const { cvData, fileName = "generated_cv" } = args;

      // Validate and sanitize paths to prevent path traversal
      const validatedOutputPath = validateAndNormalizePath(args.outputPath);
      const sanitizedFileName = sanitizeFileName(fileName);

      // Ensure output directory exists
      await ensureDirectoryExists(validatedOutputPath);

      // Create text format CV
      const cvText = formatCVAsText(cvData);

      // Full file path with safe join
      const fullPath = safeJoinPath(validatedOutputPath, `${sanitizedFileName}.txt`);

      // Save to file
      await fs.writeFile(fullPath, cvText, 'utf-8');

      return {
        content: [
          {
            type: "text" as const,
            text: `CV successfully saved as text file to: ${fullPath}`
          }
        ]
      };
    } catch (error) {
      return createSafeErrorResponse(error, 'save_file');
    }
  }
);

server.registerTool(
  "generate_cv_pdf",
  {
    description: "Generate and save CV as a professional PDF document",
    inputSchema: {
      cvData: z.any().describe("Tailored CV data object"),
      outputPath: z.string().describe("Directory path where the CV should be saved"),
      fileName: z.string().optional().describe("Custom filename (without extension)"),
      pageSize: z.string().optional().describe("PDF page size (e.g., 'A4', 'Letter', 'Legal') - uses PDF_PAGE_SIZE env var if not provided"),
      margins: z.object({
        top: z.string().optional().describe("Top margin (e.g., '10mm', '0.8in')"),
        right: z.string().optional().describe("Right margin (e.g., '10mm', '0.8in')"),
        bottom: z.string().optional().describe("Bottom margin (e.g., '10mm', '0.8in')"),
        left: z.string().optional().describe("Left margin (e.g., '10mm', '0.8in')")
      }).optional().describe("PDF margins - uses PDF_MARGIN_* env vars if not provided")
    }
  },
  async (args) => {
    try {
      const { cvData, outputPath, fileName = "professional_cv", pageSize, margins } = args;
      
      // Prepare PDF options
      const pdfOptions: PDFOptions = {
        pageSize,
        margins
      };

      const filePath = await generateDocument(
        cvData,
        outputPath,
        fileName,
        OutputFormat.PDF,
        pdfOptions
      );
      
      return {
        content: [
          {
            type: "text" as const,
            text: `CV successfully generated as PDF: ${filePath}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

server.registerTool(
  "generate_cv_markdown",
  {
    description: "Generate CV as Markdown format for easy editing and version control",
    inputSchema: {
      cvData: z.any().describe("Tailored CV data object"),
      outputPath: z.string().describe("Directory path where the CV should be saved"),
      fileName: z.string().optional().describe("Custom filename (without extension)")
    }
  },
  async (args) => {
    try {
      const { cvData, outputPath, fileName = "cv_markdown" } = args;
      
      const filePath = await generateDocument(
        cvData,
        outputPath,
        fileName,
        OutputFormat.MARKDOWN
      );
      
      return {
        content: [
          {
            type: "text" as const,
            text: `CV successfully generated as Markdown: ${filePath}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error generating Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

server.registerTool(
  "generate_cv_html",
  {
    description: "Generate CV as styled HTML document for web viewing",
    inputSchema: {
      cvData: z.any().describe("Tailored CV data object"),
      outputPath: z.string().describe("Directory path where the CV should be saved"),
      fileName: z.string().optional().describe("Custom filename (without extension)")
    }
  },
  async (args) => {
    try {
      const { cvData, outputPath, fileName = "cv_web" } = args;
      
      const filePath = await generateDocument(
        cvData,
        outputPath,
        fileName,
        OutputFormat.HTML
      );
      
      return {
        content: [
          {
            type: "text" as const,
            text: `CV successfully generated as HTML: ${filePath}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error generating HTML: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

server.registerTool(
  "generate_and_save_cv_markdown",
  {
    description: "Generate tailored CV and save directly as Markdown (combines CV generation and Markdown creation in one step)",
    inputSchema: {
      userProfile: UserProfileSchema,
      jobRequirements: JobRequirementsSchema,
      outputPath: z.string().describe("Directory path where the CV should be saved"),
      fileName: z.string().optional().describe("Custom filename (without extension)")
    }
  },
  async (args) => {
    try {
      const { userProfile, jobRequirements, outputPath, fileName = "cv_markdown" } = args;
      
      // Parse job requirements
      const parsedJobReq = parseJobRequirements(jobRequirements);
      
      // Generate tailored CV
      const tailoredCV = generateTailoredCV(userProfile, parsedJobReq);
      
      // Generate Markdown directly
      const filePath = await generateDocument(
        tailoredCV,
        outputPath,
        fileName,
        OutputFormat.MARKDOWN
      );
      
      return {
        content: [
          {
            type: "text" as const,
            text: `CV successfully generated and saved as Markdown: ${filePath}\n\nTailored for: ${jobRequirements.jobTitle} at ${jobRequirements.company}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error generating and saving Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

server.registerTool(
  "generate_and_save_cv_html",
  {
    description: "Generate tailored CV and save directly as HTML (combines CV generation and HTML creation in one step)",
    inputSchema: {
      userProfile: UserProfileSchema,
      jobRequirements: JobRequirementsSchema,
      outputPath: z.string().describe("Directory path where the CV should be saved"),
      fileName: z.string().optional().describe("Custom filename (without extension)")
    }
  },
  async (args) => {
    try {
      const { userProfile, jobRequirements, outputPath, fileName = "cv_html" } = args;
      
      // Parse job requirements
      const parsedJobReq = parseJobRequirements(jobRequirements);
      
      // Generate tailored CV
      const tailoredCV = generateTailoredCV(userProfile, parsedJobReq);
      
      // Generate HTML directly
      const filePath = await generateDocument(
        tailoredCV,
        outputPath,
        fileName,
        OutputFormat.HTML
      );
      
      return {
        content: [
          {
            type: "text" as const,
            text: `CV successfully generated and saved as HTML: ${filePath}\n\nTailored for: ${jobRequirements.jobTitle} at ${jobRequirements.company}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error generating and saving HTML: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

// Main CV generation tool - defaults to PDF format
server.registerTool(
  "generate_cv",
  {
    description: "Generate tailored CV in PDF format and save to specified location or default folder. Always generates PDF unless a different format is explicitly requested.",
    inputSchema: {
      userProfile: UserProfileSchema,
      jobRequirements: JobRequirementsSchema,
      outputPath: z.string().optional().describe("Directory path where the CV should be saved (optional, uses DEFAULT_OUTPUT_PATH if not provided)"),
      fileName: z.string().optional().describe("Custom filename (without extension)"),
      format: z.enum(["pdf", "html", "markdown"]).optional().default("pdf").describe("Output format - automatically set to PDF, only specify if you want HTML or Markdown instead"),
      pageSize: z.string().optional().describe("PDF page size (e.g., 'A4', 'Letter', 'Legal') - uses PDF_PAGE_SIZE env var if not provided"),
      margins: z.object({
        top: z.string().optional().describe("Top margin (e.g., '10mm', '0.8in')"),
        right: z.string().optional().describe("Right margin (e.g., '10mm', '0.8in')"),
        bottom: z.string().optional().describe("Bottom margin (e.g., '10mm', '0.8in')"),
        left: z.string().optional().describe("Left margin (e.g., '10mm', '0.8in')")
      }).optional().describe("PDF margins - uses PDF_MARGIN_* env vars if not provided")
    }
  },
  async (args) => {
    try {
      const { userProfile, jobRequirements, fileName = "professional_cv", format = "pdf", pageSize, margins } = args;
      
      // Use provided path or default path if outputPath is not provided, is "./" or is empty
      const outputPath = (args.outputPath && args.outputPath !== "./" && args.outputPath.trim() !== "") 
        ? args.outputPath 
        : getDefaultOutputPath();
      
      console.error(`[DEBUG generate_cv] Received outputPath: ${args.outputPath}`);
      console.error(`[DEBUG generate_cv] Using outputPath: ${outputPath}`);
      console.error(`[DEBUG generate_cv] Format: ${format}`);
      
      // Parse job requirements
      const parsedJobReq = parseJobRequirements(jobRequirements);
      
      // Generate tailored CV
      const tailoredCV = generateTailoredCV(userProfile, parsedJobReq);
      
      // Determine output format
      let outputFormat: OutputFormat;
      switch (format) {
        case "html":
          outputFormat = OutputFormat.HTML;
          break;
        case "markdown":
          outputFormat = OutputFormat.MARKDOWN;
          break;
        default:
          outputFormat = OutputFormat.PDF;
      }
      
      // Prepare PDF options if generating PDF
      const pdfOptions: PDFOptions | undefined = format === "pdf" ? {
        pageSize,
        margins
      } : undefined;

      // Generate document
      const filePath = await generateDocument(
        tailoredCV,
        outputPath,
        fileName,
        outputFormat,
        pdfOptions
      );
      
      return {
        content: [
          {
            type: "text" as const,
            text: `CV successfully generated and saved as ${format.toUpperCase()}: ${filePath}\n\nTailored for: ${jobRequirements.jobTitle} at ${jobRequirements.company}\nUsed output path: ${outputPath}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error generating CV: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

server.registerTool(
  "generate_cv_to_default_folder",
  {
    description: "Generate tailored CV and save to default folder (uses .env DEFAULT_OUTPUT_PATH). Defaults to PDF format.",
    inputSchema: {
      userProfile: UserProfileSchema,
      jobRequirements: JobRequirementsSchema,
      fileName: z.string().optional().describe("Custom filename (without extension)"),
      format: z.enum(["pdf", "html", "markdown"]).optional().default("pdf").describe("Output format (defaults to PDF)"),
      pageSize: z.string().optional().describe("PDF page size (e.g., 'A4', 'Letter', 'Legal') - uses PDF_PAGE_SIZE env var if not provided"),
      margins: z.object({
        top: z.string().optional().describe("Top margin (e.g., '10mm', '0.8in')"),
        right: z.string().optional().describe("Right margin (e.g., '10mm', '0.8in')"),
        bottom: z.string().optional().describe("Bottom margin (e.g., '10mm', '0.8in')"),
        left: z.string().optional().describe("Left margin (e.g., '10mm', '0.8in')")
      }).optional().describe("PDF margins - uses PDF_MARGIN_* env vars if not provided")
    }
  },
  async (args) => {
    try {
      const { userProfile, jobRequirements, fileName = "professional_cv", format = "pdf", pageSize, margins } = args;
      
      // Use default output path from environment or fallback
      const outputPath = getDefaultOutputPath();
      
      // Parse job requirements
      const parsedJobReq = parseJobRequirements(jobRequirements);
      
      // Generate tailored CV
      const tailoredCV = generateTailoredCV(userProfile, parsedJobReq);
      
      // Determine output format
      let outputFormat: OutputFormat;
      switch (format) {
        case "html":
          outputFormat = OutputFormat.HTML;
          break;
        case "markdown":
          outputFormat = OutputFormat.MARKDOWN;
          break;
        default:
          outputFormat = OutputFormat.PDF;
      }
      
      // Prepare PDF options if generating PDF
      const pdfOptions: PDFOptions | undefined = format === "pdf" ? {
        pageSize,
        margins
      } : undefined;

      // Generate document
      const filePath = await generateDocument(
        tailoredCV,
        outputPath,
        fileName,
        outputFormat,
        pdfOptions
      );
      
      return {
        content: [
          {
            type: "text" as const,
            text: `CV successfully generated and saved as ${format.toUpperCase()}: ${filePath}\n\nTailored for: ${jobRequirements.jobTitle} at ${jobRequirements.company}\nUsing default output path: ${outputPath}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error generating CV: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

server.registerTool(
  "debug_cv_data",
  {
    description: "Debug tool to inspect the structure of CV data",
    inputSchema: {
      cvData: z.any().describe("Tailored CV data object to inspect")
    }
  },
  async (args) => {
    try {
      const { cvData } = args;
      
      const inspection = {
        dataType: typeof cvData,
        isNull: cvData === null,
        isUndefined: cvData === undefined,
        keys: cvData ? Object.keys(cvData) : null,
        personalInfoExists: cvData && cvData.personalInfo !== undefined,
        personalInfoKeys: cvData && cvData.personalInfo ? Object.keys(cvData.personalInfo) : null,
        fullStructure: JSON.stringify(cvData, null, 2)
      };
      
      return {
        content: [
          {
            type: "text" as const,
            text: `CV Data Structure Inspection:\n${JSON.stringify(inspection, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error inspecting CV data: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

/**
 * Format CV data as plain text
 */
function formatCVAsText(cvData: any): string {
  let text = "";
  
  // Header
  text += `${cvData.personalInfo.fullName}\n`;
  text += `${cvData.personalInfo.email}`;
  if (cvData.personalInfo.phone) text += ` | ${cvData.personalInfo.phone}`;
  if (cvData.personalInfo.location) text += ` | ${cvData.personalInfo.location}`;
  if (cvData.personalInfo.linkedIn) text += ` | ${cvData.personalInfo.linkedIn}`;
  if (cvData.personalInfo.github) text += ` | ${cvData.personalInfo.github}`;
  if (cvData.personalInfo.website) text += ` | ${cvData.personalInfo.website}`;
  text += "\n\n";
  
  // Summary
  text += "PROFESSIONAL SUMMARY\n";
  text += "===================\n";
  text += `${cvData.summary}\n\n`;
  
  // Skills
  text += "SKILLS\n";
  text += "======\n";
  if (cvData.skills.technical.length > 0) {
    text += `Technical Skills: ${cvData.skills.technical.join(", ")}\n`;
  }
  if (cvData.skills.soft && cvData.skills.soft.length > 0) {
    text += `Soft Skills: ${cvData.skills.soft.join(", ")}\n`;
  }
  if (cvData.skills.languages && cvData.skills.languages.length > 0) {
    text += `Languages: ${cvData.skills.languages.join(", ")}\n`;
  }
  if (cvData.skills.certifications && cvData.skills.certifications.length > 0) {
    text += `Certifications: ${cvData.skills.certifications.join(", ")}\n`;
  }
  text += "\n";
  
  // Experience
  text += "EXPERIENCE\n";
  text += "==========\n";
  cvData.experience.forEach((exp: any) => {
    text += `${exp.jobTitle} | ${exp.company}\n`;
    if (exp.location) text += `${exp.location} | `;
    text += `${exp.duration}\n`;
    if (exp.description) text += `${exp.description}\n`;
    exp.achievements.forEach((achievement: string) => {
      text += `• ${achievement.replace(/\*\*(.*?)\*\*/g, "$1")}\n`;
    });
    text += "\n";
  });
  
  // Education
  text += "EDUCATION\n";
  text += "=========\n";
  cvData.education.forEach((edu: any) => {
    text += `${edu.degree} | ${edu.institution}\n`;
    if (edu.location) text += `${edu.location} | `;
    text += `${edu.graduationYear}`;
    if (edu.gpa) text += ` | GPA: ${edu.gpa}`;
    text += "\n";
    if (edu.honors && edu.honors.length > 0) {
      text += `Honors: ${edu.honors.join(", ")}\n`;
    }
    text += "\n";
  });
  
  // Projects
  if (cvData.projects && cvData.projects.length > 0) {
    text += "PROJECTS\n";
    text += "========\n";
    cvData.projects.forEach((project: any) => {
      text += `${project.name}`;
      if (project.url) text += ` (${project.url})`;
      text += "\n";
      text += `${project.description}\n`;
      text += `Technologies: ${project.technologies.join(", ")}\n\n`;
    });
  }
  
  return text;
}

// Add a dedicated tool for drafting CVs that always generates PDF
server.registerTool(
  "draft_cv_pdf",
  {
    description: "Draft a tailored CV in PDF format for a specific job. This tool automatically generates a professional PDF CV without asking for format preferences.",
    inputSchema: {
      userProfile: UserProfileSchema,
      jobRequirements: JobRequirementsSchema,
      outputPath: z.string().optional().describe("Directory path where the CV should be saved (optional, uses DEFAULT_OUTPUT_PATH if not provided)"),
      fileName: z.string().optional().describe("Custom filename (without extension)")
    }
  },
  async (args) => {
    try {
      const { userProfile, jobRequirements, fileName = "professional_cv" } = args;
      
      // Use provided path or default path
      const outputPath = (args.outputPath && args.outputPath !== "./" && args.outputPath.trim() !== "") 
        ? args.outputPath 
        : getDefaultOutputPath();
      
      console.error(`[DEBUG draft_cv_pdf] Using outputPath: ${outputPath}`);
      
      // Parse job requirements
      const parsedJobReq = parseJobRequirements(jobRequirements);
      
      // Generate tailored CV
      const tailoredCV = generateTailoredCV(userProfile, parsedJobReq);
      
      // Generate PDF document
      const filePath = await generateDocument(
        tailoredCV,
        outputPath,
        fileName,
        OutputFormat.PDF
      );
      
      return {
        content: [
          {
            type: "text",
            text: `✅ CV successfully generated and saved to: ${filePath}\n\nThe CV has been tailored for the ${parsedJobReq.jobTitle} position at ${parsedJobReq.company} and saved as a professional PDF document.`
          }
        ]
      };
    } catch (error) {
      console.error("Error in draft_cv_pdf:", error);
      return {
        content: [
          {
            type: "text",
            text: `❌ Error generating CV: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

// Cover Letter Generation Tools
server.registerTool(
  "generate_cover_letter",
  {
    description: "Generate a tailored cover letter for a specific job application. Returns formatted text that can be displayed on screen or saved as PDF.",
    inputSchema: {
      userProfile: UserProfileSchema,
      jobRequirements: JobRequirementsSchema,
      hiringManagerName: z.string().optional().describe("Name of the hiring manager if known"),
      format: z.enum(["text", "html"]).optional().default("text").describe("Output format (text for on-screen display, html for styled viewing)")
    }
  },
  async (args) => {
    try {
      const { userProfile, jobRequirements, hiringManagerName, format = "text" } = args;
      
      // Parse job requirements to extract email addresses
      const parsedJobReq = parseJobRequirements(jobRequirements);
      
      // Use extracted hiring manager name if not provided
      const managerName = hiringManagerName || parsedJobReq.hiringManagerName;
      const emailAddress = parsedJobReq.contactEmails?.[0];
      
      // Generate cover letter
      const coverLetter = generateCoverLetter(userProfile, parsedJobReq, managerName, emailAddress);
      
      // Format based on requested format
      const formattedCoverLetter = format === "html" 
        ? formatCoverLetterAsHTML(coverLetter)
        : formatCoverLetterAsText(coverLetter);
      
      let successMessage = `✅ Cover letter successfully generated for ${parsedJobReq.jobTitle} position at ${parsedJobReq.company}`;
      
      if (emailAddress) {
        successMessage += `\n📧 Email address found: ${emailAddress}`;
      }
      if (managerName) {
        successMessage += `\n👤 Hiring manager: ${managerName}`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: `${successMessage}\n\n--- COVER LETTER ---\n\n${formattedCoverLetter}`
          }
        ]
      };
    } catch (error) {
      console.error("Error generating cover letter:", error);
      return {
        content: [
          {
            type: "text",
            text: `❌ Error generating cover letter: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

server.registerTool(
  "save_cover_letter_pdf",
  {
    description: "Generate and save a cover letter as PDF to specified location",
    inputSchema: {
      userProfile: UserProfileSchema,
      jobRequirements: JobRequirementsSchema,
      outputPath: z.string().optional().describe("Directory path where the cover letter should be saved (optional, uses DEFAULT_OUTPUT_PATH if not provided)"),
      fileName: z.string().optional().describe("Custom filename (without extension)"),
      hiringManagerName: z.string().optional().describe("Name of the hiring manager if known"),
      pageSize: z.string().optional().describe("PDF page size (e.g., 'A4', 'Letter', 'Legal') - uses PDF_PAGE_SIZE env var if not provided"),
      margins: z.object({
        top: z.string().optional().describe("Top margin (e.g., '10mm', '0.8in')"),
        right: z.string().optional().describe("Right margin (e.g., '10mm', '0.8in')"),
        bottom: z.string().optional().describe("Bottom margin (e.g., '10mm', '0.8in')"),
        left: z.string().optional().describe("Left margin (e.g., '10mm', '0.8in')")
      }).optional().describe("PDF margins - uses PDF_MARGIN_* env vars if not provided")
    }
  },
  async (args) => {
    try {
      const { userProfile, jobRequirements, fileName = "cover_letter", hiringManagerName, pageSize, margins } = args;
      
      // Use provided path or default path
      const outputPath = (args.outputPath && args.outputPath !== "./" && args.outputPath.trim() !== "") 
        ? args.outputPath 
        : getDefaultOutputPath();
      
      // Parse job requirements
      const parsedJobReq = parseJobRequirements(jobRequirements);
      
      // Use extracted hiring manager name if not provided
      const managerName = hiringManagerName || parsedJobReq.hiringManagerName;
      const emailAddress = parsedJobReq.contactEmails?.[0];
      
      // Generate cover letter
      const coverLetter = generateCoverLetter(userProfile, parsedJobReq, managerName, emailAddress);
      
      // Convert to HTML for PDF generation
      const htmlContent = formatCoverLetterAsHTML(coverLetter);

      // SECURITY: Create a temporary HTML file with cryptographically random name
      const randomSuffix = crypto.randomBytes(16).toString('hex');
      const tempHtmlPath = path.join(require('os').tmpdir(), `cover-letter-${randomSuffix}.html`);
      await fs.writeFile(tempHtmlPath, htmlContent, 'utf-8');
      
      // Prepare PDF options
      const pdfOptions: PDFOptions = {
        pageSize,
        margins
      };
      
      // Create a minimal cover letter data structure for the document generator
      const coverLetterForPdf = {
        personalInfo: coverLetter.personalInfo,
        summary: formatCoverLetterAsText(coverLetter),
        experience: [],
        education: [],
        skills: { technical: [] }
      };
      
      // Generate PDF using existing document generator with markdown content
      const markdownContent = `# Cover Letter\n\n${formatCoverLetterAsText(coverLetter)}`;
      const filePath = await generateDocument(
        { ...coverLetterForPdf, summary: markdownContent },
        outputPath,
        fileName,
        OutputFormat.PDF,
        pdfOptions
      );
      
      // Clean up temporary file
      try {
        await fs.unlink(tempHtmlPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      let successMessage = `✅ Cover letter successfully generated and saved to: ${filePath}`;
      if (emailAddress) {
        successMessage += `\n📧 Email address found in job posting: ${emailAddress}`;
      }
      if (managerName) {
        successMessage += `\n👤 Hiring manager identified: ${managerName}`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: successMessage
          }
        ]
      };
    } catch (error) {
      console.error("Error saving cover letter PDF:", error);
      return {
        content: [
          {
            type: "text",
            text: `❌ Error generating cover letter PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

// Email Template Generation Tools
server.registerTool(
  "generate_email_template",
  {
    description: "Generate a professional email template for job application. Automatically detects email addresses from job description.",
    inputSchema: {
      userProfile: UserProfileSchema,
      jobRequirements: JobRequirementsSchema,
      templateType: z.enum(["application", "follow_up", "inquiry", "thank_you"]).optional().default("application").describe("Type of email template"),
      recipientEmail: z.string().optional().describe("Recipient email address (optional, will use extracted email from job description if available)"),
      hiringManagerName: z.string().optional().describe("Name of the hiring manager if known")
    }
  },
  async (args) => {
    try {
      const { userProfile, jobRequirements, templateType = "application", recipientEmail, hiringManagerName } = args;
      
      // Parse job requirements to extract email addresses
      const parsedJobReq = parseJobRequirements(jobRequirements);
      
      // Use provided email or extracted email
      const targetEmail = recipientEmail || parsedJobReq.contactEmails?.[0];
      
      if (!targetEmail) {
        return {
          content: [
            {
              type: "text",
              text: `⚠️ No email address found in job description. Please provide recipient email address or check the job posting for contact information.\n\nTo generate an email template, you can either:\n1. Add recipientEmail parameter with the email address\n2. Include an email address in the job description`
            }
          ]
        };
      }
      
      // Use extracted hiring manager name if not provided
      const managerName = hiringManagerName || parsedJobReq.hiringManagerName;
      
      // Generate email template
      const emailTemplate = generateEmailTemplate(
        userProfile, 
        parsedJobReq, 
        targetEmail, 
        templateType as EmailTemplateType, 
        managerName
      );
      
      let successMessage = `✅ ${templateType.charAt(0).toUpperCase() + templateType.slice(1)} email template generated`;
      successMessage += `\n📧 To: ${targetEmail}`;
      if (managerName) {
        successMessage += `\n👤 Hiring manager: ${managerName}`;
      }
      
      const emailContent = `Subject: ${emailTemplate.subject}\n\n${emailTemplate.body}\n\n--- ATTACHMENTS ---\n${emailTemplate.attachments.join(', ')}`;
      
      return {
        content: [
          {
            type: "text",
            text: `${successMessage}\n\n--- EMAIL TEMPLATE ---\n\n${emailContent}`
          }
        ]
      };
    } catch (error) {
      console.error("Error generating email template:", error);
      return {
        content: [
          {
            type: "text",
            text: `❌ Error generating email template: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

server.registerTool(
  "draft_complete_application",
  {
    description: "Draft a complete job application package: CV, cover letter, and email template. Automatically generates PDF CV and cover letter, plus email template if email address is found.",
    inputSchema: {
      userProfile: UserProfileSchema,
      jobRequirements: JobRequirementsSchema,
      outputPath: z.string().optional().describe("Directory path where files should be saved (optional, uses DEFAULT_OUTPUT_PATH if not provided)"),
      baseFileName: z.string().optional().describe("Base filename for generated files (without extension)"),
      hiringManagerName: z.string().optional().describe("Name of the hiring manager if known")
    }
  },
  async (args) => {
    try {
      const { userProfile, jobRequirements, hiringManagerName } = args;

      // Sanitize baseFileName to prevent path traversal
      const baseFileName = sanitizeFileName(args.baseFileName || "job_application");

      // Use provided path or default path
      const rawOutputPath = (args.outputPath && args.outputPath !== "./" && args.outputPath.trim() !== "")
        ? args.outputPath
        : getDefaultOutputPath();

      // Validate output path to prevent path traversal
      const outputPath = validateAndNormalizePath(rawOutputPath);

      // Parse job requirements
      const parsedJobReq = parseJobRequirements(jobRequirements);

      // Use extracted hiring manager name if not provided
      const managerName = hiringManagerName || parsedJobReq.hiringManagerName;
      const emailAddress = parsedJobReq.contactEmails?.[0];

      const results: string[] = [];

      // 1. Generate CV PDF
      const tailoredCV = generateTailoredCV(userProfile, parsedJobReq);
      const cvFilePath = await generateDocument(
        tailoredCV,
        outputPath,
        `${baseFileName}_CV`,
        OutputFormat.PDF
      );
      results.push(`📄 CV saved to: ${cvFilePath}`);

      // 2. Generate Cover Letter PDF
      const coverLetter = generateCoverLetter(userProfile, parsedJobReq, managerName, emailAddress);
      const coverLetterMarkdown = `# Cover Letter\n\n${formatCoverLetterAsText(coverLetter)}`;
      const coverLetterData = {
        personalInfo: coverLetter.personalInfo,
        summary: coverLetterMarkdown,
        experience: [],
        education: [],
        skills: { technical: [] }
      };

      const coverLetterFilePath = await generateDocument(
        coverLetterData,
        outputPath,
        `${baseFileName}_Cover_Letter`,
        OutputFormat.PDF
      );
      results.push(`📝 Cover letter saved to: ${coverLetterFilePath}`);

      // 3. Generate Email Template (if email found)
      if (emailAddress) {
        const emailTemplate = generateEmailTemplate(
          userProfile,
          parsedJobReq,
          emailAddress,
          EmailTemplateType.APPLICATION,
          managerName
        );

        const emailContent = `Subject: ${emailTemplate.subject}\n\n${emailTemplate.body}\n\n--- ATTACHMENTS ---\n${emailTemplate.attachments.join(', ')}`;

        // Save email template as text file with safe path joining
        const emailFilePath = safeJoinPath(outputPath, `${baseFileName}_Email_Template.txt`);
        await fs.writeFile(emailFilePath, emailContent, 'utf-8');
        results.push(`📧 Email template saved to: ${emailFilePath}`);
        results.push(`   To: ${emailAddress}`);
      } else {
        results.push(`⚠️ No email address found in job description - email template not generated`);
      }
      
      let successMessage = `✅ Complete job application package generated for ${parsedJobReq.jobTitle} at ${parsedJobReq.company}`;
      if (managerName) {
        successMessage += `\n👤 Hiring manager: ${managerName}`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: `${successMessage}\n\n${results.join('\n')}`
          }
        ]
      };
    } catch (error) {
      console.error("Error drafting complete application:", error);
      return {
        content: [
          {
            type: "text",
            text: `❌ Error generating complete application: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

/**
 * Main function to start the MCP server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log to stderr since stdout is used for MCP communication
  console.error("CV Maker MCP Server running on stdio");
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.error('Shutting down CV Maker MCP Server...');
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});