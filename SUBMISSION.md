# CV Forge - MCP Server Directory Submission

## Overview
CV Forge is an intelligent MCP server that analyzes job postings and crafts perfectly-matched, ATS-friendly CVs. It's designed to help users create tailored job applications with professional formatting.

## Key Features
- **Job Requirements Parsing**: Extract key skills, qualifications, and contact information from job postings
- **Tailored CV Generation**: Create customized CV content based on user profile and job requirements
- **Multiple Output Formats**: Generate documents in PDF (default), HTML, Markdown, and text formats
- **Cover Letter Generation**: Create personalized cover letters tailored to specific job applications
- **Email Template Creation**: Generate professional email templates with automatic contact detection
- **Complete Application Packages**: Generate CV, cover letter, and email template in one command
- **ATS-Friendly**: Optimized for Applicant Tracking Systems with proper keyword placement

## Installation
```bash
npm install -g cv-forge
```

## Claude Desktop Configuration
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cv-forge": {
      "command": "cv-forge",
      "env": {
        "DEFAULT_OUTPUT_PATH": "D:/CV",
        "PDF_BASE_FONT_SIZE": "12px",
        "PDF_LINE_HEIGHT": "1.4"
      }
    }
  }
}
```

## Available Tools

### 1. parse_job_requirements
Parse job requirements and extract key information for CV tailoring.

### 2. generate_cv_data
Generate tailored CV content based on user profile and job requirements.

### 3. generate_document
Generate CV document in various formats (PDF, HTML, Markdown, text).

### 4. generate_cover_letter  
Generate personalized cover letters tailored to specific job applications.

### 5. generate_email_template
Create professional email templates with automatic email address detection.

### 6. generate_complete_application
Generate CV, cover letter, and email template in one command.

## Repository
https://github.com/thechandanbhagat/cv-forge

## License
MIT

## Author
Chandan Bhagat (chandan.bhagat@outlook.com)