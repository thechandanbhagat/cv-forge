#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";

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
  type CVData 
} from "./lib/document-generator.js";

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
  console.error(`[DEBUG] All env vars: ${JSON.stringify(process.env, null, 2)}`);
  
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
      return {
        content: [
          {
            type: "text" as const,
            text: `Error parsing job requirements: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
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
      return {
        content: [
          {
            type: "text" as const,
            text: `Error generating CV data: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
);

server.registerTool(
  "generate_and_save_cv_pdf",
  {
    description: "Generate tailored CV and save directly as PDF (combines CV generation and PDF creation in one step). If outputPath is not provided, uses DEFAULT_OUTPUT_PATH from environment.",
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
      
      // Generate PDF directly
      const filePath = await generateDocument(
        tailoredCV,
        outputPath,
        fileName,
        OutputFormat.PDF
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
      return {
        content: [
          {
            type: "text" as const,
            text: `Error generating and saving PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
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
      const { cvData, outputPath, fileName = "generated_cv" } = args;
      
      // Ensure output directory exists
      await fs.mkdir(outputPath, { recursive: true });
      
      // Create text format CV
      const cvText = formatCVAsText(cvData);
      
      // Full file path
      const fullPath = path.join(outputPath, `${fileName}.txt`);
      
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
      return {
        content: [
          {
            type: "text" as const,
            text: `Error saving CV: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
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
      fileName: z.string().optional().describe("Custom filename (without extension)")
    }
  },
  async (args) => {
    try {
      const { cvData, outputPath, fileName = "professional_cv" } = args;
      
      const filePath = await generateDocument(
        cvData,
        outputPath,
        fileName,
        OutputFormat.PDF
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

server.registerTool(
  "generate_cv_to_default_folder",
  {
    description: "Generate tailored CV and save to default folder (uses .env DEFAULT_OUTPUT_PATH)",
    inputSchema: {
      userProfile: UserProfileSchema,
      jobRequirements: JobRequirementsSchema,
      fileName: z.string().optional().describe("Custom filename (without extension)"),
      format: z.enum(["pdf", "html", "markdown"]).optional().default("pdf").describe("Output format")
    }
  },
  async (args) => {
    try {
      const { userProfile, jobRequirements, fileName = "professional_cv", format = "pdf" } = args;
      
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
      
      // Generate document
      const filePath = await generateDocument(
        tailoredCV,
        outputPath,
        fileName,
        outputFormat
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