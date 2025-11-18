# CV Forge

Forge powerful, ATS-friendly CVs tailored to any job requirement.

An intelligent MCP (Model Context Protocol) server that analyzes job postings and crafts perfectly-matched CVs.

## Features

- **Parse Job Requirements**: Extract key skills, qualifications, email addresses, and hiring manager names from job postings
- **Generate Tailored CVs**: Create customized CV content based on user profile and job requirements
- **Cover Letter Generation**: Generate personalized cover letters tailored to specific job applications
- **Email Template Creation**: Create professional email templates with automatic email address detection
- **Complete Application Packages**: Generate CV, cover letter, and email template in one command
- **PDF by Default**: Automatically generates professional PDF documents when no format is specified
- **Multiple Output Formats**: Generate documents in PDF (default), HTML, Markdown, and text formats
- **Professional PDF Generation**: Create publication-ready PDF documents with professional styling
- **ATS-Friendly**: Optimized for Applicant Tracking Systems with proper keyword placement
- **Smart Contact Extraction**: Automatically extracts email addresses and hiring manager names from job descriptions

## Security Features

CV Forge implements comprehensive security measures to protect your sensitive data and prevent common vulnerabilities:

### Input Validation and Sanitization
- **Comprehensive Input Validation**: All user inputs are validated using Zod schemas with strict length limits and format requirements
- **Email Validation**: Proper email format validation to prevent malformed addresses
- **URL Validation**: LinkedIn, GitHub, and website URLs are validated for correct format
- **Phone Number Validation**: Phone numbers are validated against allowed character patterns
- **Length Constraints**: Maximum lengths enforced on all string inputs to prevent denial-of-service attacks
- **Array Size Limits**: Maximum array sizes enforced to prevent resource exhaustion

### Output Security
- **XSS Prevention**: All user-controlled data is properly escaped before HTML rendering using industry-standard escaping libraries
- **Path Traversal Protection**: File paths are validated and sanitized to prevent unauthorized file system access
- **Filename Sanitization**: Filenames are sanitized to remove directory traversal sequences and invalid characters
- **Safe Path Joining**: All file path operations use secure path joining to prevent directory escape

### Data Protection
- **CRLF Injection Prevention**: Email addresses and contact information are sanitized to prevent email header injection attacks
- **HTML Injection Prevention**: Markdown parser configured to disable raw HTML pass-through
- **ReDoS Protection**: Regular expressions are constructed with escaped special characters to prevent regex denial-of-service attacks
- **Secure Temporary Files**: Temporary files use cryptographically random names to prevent race condition attacks

### PDF Generation Security
- **Page Size Whitelist**: PDF page sizes are restricted to a whitelist of safe values (A4, A3, A5, Letter, Legal, Tabloid)
- **Margin Validation**: PDF margins are validated for proper format and reasonable bounds
- **Parameter Sanitization**: All PDF generation parameters are validated to prevent injection attacks

### Error Handling
- **Sanitized Error Messages**: Error messages are sanitized to prevent information disclosure
- **Internal Logging**: Detailed errors are logged server-side while generic messages are shown to users
- **No Path Exposure**: File paths and system information are never exposed in user-facing error messages

### Best Practices
- **No Sensitive Data Logging**: Environment variables and sensitive configuration are never logged
- **Secure Defaults**: All security features are enabled by default with no configuration required
- **Defense in Depth**: Multiple layers of security validation are applied throughout the application

## Installation

### Via npm (Recommended)

Install globally:
```bash
npm install -g cv-forge
```

Or install locally in your project:
```bash
npm install cv-forge
```

### From Source

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Connecting to Claude Desktop

To use this MCP server with Claude Desktop, you need to add it to your Claude configuration file.

**Step 1: Install cv-forge**
```bash
npm install -g cv-forge
```

**Step 2: Find your Claude Desktop config file**
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Step 3: Add the MCP server to your config**

For global installation, add this to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "cv-forge": {
      "command": "cv-forge"
    }
  }
}
```

Or if installed locally, specify the full path:

```json
{
  "mcpServers": {
    "cv-forge": {
      "command": "node",
      "args": ["d:/TopSecret/cv-forge/build/index.js"],
      "cwd": "d:/TopSecret/cv-forge"
    }
  }
}
```

**Step 4: (Optional) Add environment configuration**

You can customize the server with environment variables:

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

**Step 5: Restart Claude Desktop**
After adding the configuration, restart Claude Desktop application.

**Step 6: Verify Connection**
In Claude Desktop, you should see the CV Forge tools available. You can ask Claude to use tools like:
- "Parse this job posting for me"
- "Generate a tailored CV based on my profile and this job"
- "Save my CV as a PDF file"

### Running the MCP Server Standalone (for testing)

You can also run the server directly for testing:
```bash
npm start
```

The server runs on stdio and communicates via the Model Context Protocol.

### Available Tools

#### 1. `parse_job_requirements`
Parses job requirements and extracts key information for CV tailoring.

**Parameters:**
- `jobTitle` (string, required): The job title/position
- `company` (string, required): Company name
- `jobDescription` (string, required): Full job description text
- `requirements` (array, optional): Specific requirements if separated
- `preferredSkills` (array, optional): Preferred skills if separated
- `location` (string, optional): Job location
- `salaryRange` (string, optional): Salary range if provided

#### 2. `generate_cv_data`
Generates tailored CV content based on user profile and job requirements.

**Parameters:**
- `userProfile` (object, required): Complete user profile information
- `jobRequirements` (object, required): Job requirements object

**User Profile Structure:**
```json
{
  "personalInfo": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123",
    "location": "City, State",
    "linkedIn": "linkedin.com/in/johndoe",
    "github": "github.com/johndoe",
    "website": "johndoe.com"
  },
  "summary": "Professional summary text...",
  "experience": [
    {
      "jobTitle": "Software Engineer",
      "company": "Tech Corp",
      "location": "City, State",
      "startDate": "2020-01",
      "endDate": "2023-12",
      "description": "Job description...",
      "achievements": [
        "Achievement 1",
        "Achievement 2"
      ]
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University Name",
      "location": "City, State",
      "graduationYear": "2020",
      "gpa": "3.8",
      "honors": ["Magna Cum Laude"]
    }
  ],
  "skills": {
    "technical": ["JavaScript", "Python", "React"],
    "soft": ["Leadership", "Communication"],
    "languages": ["English", "Spanish"],
    "certifications": ["AWS Certified"]
  },
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description...",
      "technologies": ["React", "Node.js"],
      "url": "github.com/johndoe/project"
    }
  ]
}
```

#### 3. `save_cv_text`
Saves CV content as a formatted text file.

**Parameters:**
- `cvData` (object, required): Tailored CV data object (from generate_cv_data)
- `outputPath` (string, required): Directory path where the CV should be saved
- `fileName` (string, optional): Custom filename (without extension), defaults to "generated_cv"

#### 4. `generate_cv` (Recommended - Main CV Generation Tool)
Generate tailored CV and save to specified location or default folder. **Defaults to PDF format** if no format is specified.

**Parameters:**
- `userProfile` (object, required): Complete user profile information
- `jobRequirements` (object, required): Job requirements object
- `outputPath` (string, optional): Directory path where the CV should be saved (uses DEFAULT_OUTPUT_PATH if not provided)
- `fileName` (string, optional): Custom filename (without extension), defaults to "professional_cv"
- `format` (string, optional): Output format - "pdf" (default), "html", or "markdown"
- `pageSize` (string, optional): PDF page size (e.g., 'A4', 'Letter', 'Legal') - uses PDF_PAGE_SIZE env var if not provided
- `margins` (object, optional): PDF margins with top, right, bottom, left properties (e.g., '10mm', '0.8in') - uses PDF_MARGIN_* env vars if not provided

#### 5. `generate_and_save_cv_pdf` (Legacy - Use generate_cv instead)
Generate tailored CV and save directly as professional PDF (combines CV generation and PDF creation in one step).

**Parameters:**
- `userProfile` (object, required): Complete user profile information
- `jobRequirements` (object, required): Job requirements object
- `outputPath` (string, optional): Directory path where the CV should be saved (uses DEFAULT_OUTPUT_PATH if not provided)
- `fileName` (string, optional): Custom filename (without extension), defaults to "professional_cv"

#### 6. `generate_and_save_cv_markdown` (Recommended)
Generate tailored CV and save directly as Markdown (combines CV generation and Markdown creation in one step).

**Parameters:**
- `userProfile` (object, required): Complete user profile information
- `jobRequirements` (object, required): Job requirements object
- `outputPath` (string, required): Directory path where the CV should be saved
- `fileName` (string, optional): Custom filename (without extension), defaults to "cv_markdown"

#### 7. `generate_and_save_cv_html` (Recommended)
Generate tailored CV and save directly as HTML (combines CV generation and HTML creation in one step).

**Parameters:**
- `userProfile` (object, required): Complete user profile information
- `jobRequirements` (object, required): Job requirements object
- `outputPath` (string, required): Directory path where the CV should be saved
- `fileName` (string, optional): Custom filename (without extension), defaults to "cv_html"

#### 8. `generate_cv_pdf` (Advanced)
Generate and save CV as a professional PDF document from pre-generated CV data.

**Parameters:**
- `cvData` (object, required): Tailored CV data object (from generate_cv_data)
- `outputPath` (string, required): Directory path where the CV should be saved
- `fileName` (string, optional): Custom filename (without extension), defaults to "professional_cv"

#### 9. `generate_cv_markdown` (Advanced)
Generate CV as Markdown format from pre-generated CV data.

**Parameters:**
- `cvData` (object, required): Tailored CV data object (from generate_cv_data)
- `outputPath` (string, required): Directory path where the CV should be saved
- `fileName` (string, optional): Custom filename (without extension), defaults to "cv_markdown"

#### 10. `generate_cv_html` (Advanced)
Generate CV as styled HTML document from pre-generated CV data.

**Parameters:**
- `cvData` (object, required): Tailored CV data object (from generate_cv_data)
- `outputPath` (string, required): Directory path where the CV should be saved
- `fileName` (string, optional): Custom filename (without extension), defaults to "cv_web"

### Cover Letter and Email Template Tools

#### 11. `generate_cover_letter` (Recommended)
Generate a tailored cover letter for a specific job application. Returns formatted text that can be displayed on screen or saved as PDF.

**Parameters:**
- `userProfile` (object, required): Complete user profile information
- `jobRequirements` (object, required): Job requirements object
- `hiringManagerName` (string, optional): Name of the hiring manager if known
- `format` (string, optional): Output format - "text" (default) for on-screen display, "html" for styled viewing

#### 12. `save_cover_letter_pdf`
Generate and save a cover letter as PDF to specified location. Automatically extracts email addresses and hiring manager names from job descriptions.

**Parameters:**
- `userProfile` (object, required): Complete user profile information
- `jobRequirements` (object, required): Job requirements object
- `outputPath` (string, optional): Directory path where the cover letter should be saved
- `fileName` (string, optional): Custom filename (without extension), defaults to "cover_letter"
- `hiringManagerName` (string, optional): Name of the hiring manager if known
- `pageSize` (string, optional): PDF page size (e.g., 'A4', 'Letter', 'Legal')
- `margins` (object, optional): PDF margins with top, right, bottom, left properties

#### 13. `generate_email_template`
Generate a professional email template for job application. Automatically detects email addresses from job description.

**Parameters:**
- `userProfile` (object, required): Complete user profile information
- `jobRequirements` (object, required): Job requirements object
- `templateType` (string, optional): Type of email template - "application" (default), "follow_up", "inquiry", "thank_you"
- `recipientEmail` (string, optional): Recipient email address (optional, will use extracted email from job description if available)
- `hiringManagerName` (string, optional): Name of the hiring manager if known

#### 14. `draft_complete_application` (Recommended - One-Stop Solution)
Draft a complete job application package: CV, cover letter, and email template. Automatically generates PDF CV and cover letter, plus email template if email address is found in the job description.

**Parameters:**
- `userProfile` (object, required): Complete user profile information
- `jobRequirements` (object, required): Job requirements object
- `outputPath` (string, optional): Directory path where files should be saved
- `baseFileName` (string, optional): Base filename for generated files (without extension), defaults to "job_application"
- `hiringManagerName` (string, optional): Name of the hiring manager if known

## Configuration

### Environment Variables

The MCP server supports various configuration options via environment variables in the Claude Desktop config:

```json
{
  "mcpServers": {
    "cv-forge": {
      "command": "node",
      "args": ["path/to/cv-forge/build/index.js"],
      "cwd": "path/to/cv-forge",
      "env": {
        "DEFAULT_OUTPUT_PATH": "D:/CV",
        "TEMP_DIR": "C:/Users/YourName/AppData/Local/Temp/cv-maker",
        "PDF_TIMEOUT": "300000",
        "PDF_PAGE_SIZE": "A4",
        "PDF_MARGIN_TOP": "10mm",
        "PDF_MARGIN_RIGHT": "10mm",
        "PDF_MARGIN_BOTTOM": "10mm",
        "PDF_MARGIN_LEFT": "10mm",
        "PDF_BASE_FONT_SIZE": "12px",
        "PDF_LINE_HEIGHT": "1.4",
        "PDF_H1_FONT_SIZE": "20px",
        "PDF_H2_FONT_SIZE": "15px",
        "PDF_H3_FONT_SIZE": "13px",
        "PDF_PARAGRAPH_SPACING": "8px",
        "PDF_SECTION_SPACING": "12px"
      }
    }
  }
}
```

**Configuration Options:**

- `DEFAULT_OUTPUT_PATH`: Default directory for saving CV files (when outputPath is not provided or is "./")
- `TEMP_DIR`: Directory for temporary files during PDF generation
- `PDF_TIMEOUT`: Timeout for PDF generation in milliseconds
- `PDF_PAGE_SIZE`: Default PDF page size - defaults to 'A4'
  - Common sizes: 'A4' (210×297mm), 'Letter' (8.5×11in), 'Legal' (8.5×14in)
- `PDF_MARGIN_*`: PDF page margins (top, right, bottom, left) - defaults to '10mm'
- `PDF_BASE_FONT_SIZE`: Base font size for CV body text (12px ≈ MS Word 9pt, 13px ≈ 10pt)
- `PDF_LINE_HEIGHT`: Line height for text (1.4 recommended for compact layout)
- `PDF_H1_FONT_SIZE`: Font size for name/title heading
- `PDF_H2_FONT_SIZE`: Font size for section headings
- `PDF_H3_FONT_SIZE`: Font size for job titles and subsections
- `PDF_PARAGRAPH_SPACING`: Spacing between paragraphs
- `PDF_SECTION_SPACING`: Spacing between major sections

## Example Usage with Claude Desktop

Once connected to Claude Desktop, you can use natural language to interact with the CV maker:

### 1. Parse Job Requirements
```
"Can you parse this job posting for me:

Job Title: Senior Software Engineer
Company: TechCorp Inc
Description: We are looking for a Senior Software Engineer with 5+ years of experience in JavaScript, React, and Node.js. Must have experience with cloud platforms and agile methodologies. Strong communication skills required."
```

### 2. Generate Tailored CV (Simple One-Step Process - PDF by Default)
```
"Generate a tailored CV for me based on this job posting:

Job Title: Senior Software Engineer
Company: TechCorp Inc
Job Description: We are looking for a Senior Software Engineer with 5+ years of experience in JavaScript, React, and Node.js. Must have experience with cloud platforms and agile methodologies.

My Profile:
- Full Name: John Doe
- Email: john@example.com
- Phone: +1-555-0123
- Experience: 6 years as Software Engineer at various companies
- Skills: JavaScript, Python, React, Node.js, AWS, Docker
- Education: BS Computer Science from State University

Please save it to C:\Users\John\Documents\CVs with filename 'john_doe_senior_engineer_techcorp'"
```

**Note:** This will automatically generate a PDF file (default format) unless you specify a different format.

### 3. Generate Different Formats
```
"Can you generate my CV in multiple formats? I need:
1. A professional PDF for applications (default format)
2. A Markdown version for my GitHub  
3. An HTML version for my website

Save them all to C:\Users\John\Documents\CVs with the base filename 'john_doe_cv'"
```

**Or specify format explicitly:**
```
"Generate my CV in HTML format and save it to C:\Users\John\Documents\CVs"
```

**Or specify custom page size and margins for PDF:**
```
"Generate my CV as a PDF with Letter page size and 1 inch margins on all sides, save it to C:\Users\John\Documents\CVs"
```

### 3. Generate Cover Letters
```
"Generate a cover letter for the Senior Software Engineer position at TechCorp Inc. The job description mentions the hiring manager is Sarah Johnson and applications should be sent to careers@techcorp.com."
```

### 4. Generate Email Templates
```
"Create an email template for applying to the Senior Software Engineer position at TechCorp Inc. The job posting includes the email careers@techcorp.com and mentions Sarah Johnson as the hiring manager."
```

### 5. Draft Complete Application Package (Recommended)
```
"Draft a complete job application package for the Senior Software Engineer position at TechCorp Inc. Include CV, cover letter, and email template. Save everything to C:\Users\John\Documents\Applications with the base filename 'techcorp_application'."
```

**This will generate:**
- `techcorp_application_CV.pdf` - Tailored CV
- `techcorp_application_Cover_Letter.pdf` - Professional cover letter
- `techcorp_application_Email_Template.txt` - Email template (if email address found in job description)

### 6. Generate Follow-up Email Template
```
"Generate a follow-up email template for the Senior Software Engineer position I applied to at TechCorp Inc last week."
```

### 7. Direct Tool Usage Examples
If you want to use the tools directly (advanced usage):

1. **Parse a job posting:**
   ```json
   {
     "tool": "parse_job_requirements",
     "args": {
       "jobTitle": "Senior Software Engineer",
       "company": "TechCorp Inc",
       "jobDescription": "We are looking for a Senior Software Engineer with 5+ years of experience in JavaScript, React, and Node.js. Must have experience with cloud platforms and agile methodologies."
     }
   }
   ```

2. **Generate tailored CV:**
   ```json
   {
     "tool": "generate_cv_data", 
     "args": {
       "userProfile": { /* user profile object */ },
       "jobRequirements": { /* job requirements object */ }
     }
   }
   ```

3. **Generate PDF CV:**
   ```json
   {
     "tool": "generate_cv_pdf",
     "args": {
       "cvData": { /* tailored CV data */ },
       "outputPath": "C:\\Users\\YourName\\Documents\\CVs",
       "fileName": "senior_engineer_techcorp_cv"
     }
   }
   ```

4. **Generate Markdown CV:**
   ```json
   {
     "tool": "generate_cv_markdown",
     "args": {
       "cvData": { /* tailored CV data */ },
       "outputPath": "C:\\Users\\YourName\\Documents\\CVs",
       "fileName": "cv_for_github"
     }
   }
   ```

5. **Generate HTML CV:**
   ```json
   {
     "tool": "generate_cv_html",
     "args": {
       "cvData": { /* tailored CV data */ },
       "outputPath": "C:\\Users\\YourName\\Documents\\CVs",
       "fileName": "web_resume"
     }
   }
   ```

6. **Save CV as text file:**
   ```json
   {
     "tool": "save_cv_text",
     "args": {
       "cvData": { /* tailored CV data */ },
       "outputPath": "C:\\Users\\YourName\\Documents\\CVs",
       "fileName": "senior_engineer_techcorp_cv"
     }
   }
   ```

## How It Works

1. **Job Analysis**: The server parses job descriptions to extract:
   - Required technical skills
   - Preferred qualifications
   - Company industry and size
   - Experience level requirements

2. **CV Tailoring**: Based on the analysis, it:
   - Prioritizes relevant skills and experience
   - Adjusts the professional summary
   - Reorders and emphasizes matching achievements
   - Incorporates job-specific keywords for ATS optimization

3. **Output Generation**: Creates a well-formatted text CV that:
   - Uses ATS-friendly formatting
   - Includes relevant keywords
   - Maintains professional structure
   - Highlights the most relevant qualifications

## File Structure

```
cv-forge/
├── src/
│   ├── index.ts                    # Main MCP server
│   └── lib/
│       ├── job-parser.ts           # Job requirement parsing logic
│       ├── cv-generator.ts         # CV tailoring algorithms
│       ├── document-generator.ts   # Multi-format document generation
│       └── word-generator.ts       # Word document generation (future)
├── build/                          # Compiled JavaScript files
├── package.json                    # Project configuration
├── tsconfig.json                   # TypeScript configuration
├── claude_desktop_config.example.json  # Example configuration
└── README.md                       # This file
```

## Development

### Building
```bash
npm run build
```

### Starting Development Server
```bash
npm run dev
```

### Project Structure
- `src/index.ts`: Main MCP server with tool registration
- `src/lib/job-parser.ts`: Parses job requirements, extracts key information, emails, and hiring manager names
- `src/lib/cv-generator.ts`: Generates tailored CV content based on job requirements
- `src/lib/cover-letter-generator.ts`: Generates personalized cover letters for job applications
- `src/lib/email-template-generator.ts`: Creates professional email templates for various application scenarios
- `src/lib/document-generator.ts`: Multi-format document generation (PDF, HTML, Markdown)
- `src/lib/word-generator.ts`: (Future) Word document generation functionality

## Troubleshooting

### PDF not saving to configured location
- Ensure `DEFAULT_OUTPUT_PATH` is set in your Claude Desktop config
- Restart Claude Desktop after changing configuration
- Check that the path exists or the application has permission to create it

### Font size too large or small
- Adjust `PDF_BASE_FONT_SIZE` in environment variables (12px ≈ 9pt, 13px ≈ 10pt MS Word)
- Modify `PDF_LINE_HEIGHT` for tighter/looser spacing
- Restart Claude Desktop after changes

### PDF generation fails
- Check that output directory exists and is writable
- Verify `TEMP_DIR` path is valid
- Ensure sufficient disk space

### Custom page size not working
- Ensure page size is a valid format (A4, Letter, Legal, A3, A5, etc.)
- Check that the page size is supported by the PDF generator
- Use standard page size names (case-sensitive)

### Custom margins not applied
- Use proper units: 'mm', 'cm', 'in', 'px', 'pt'
- Example: '10mm', '0.8in', '72pt'
- Restart Claude Desktop after changing environment variables

## Future Enhancements

- Enhanced Word document generation with advanced formatting
- Multiple CV and cover letter templates (modern, classic, minimal)
- Advanced keyword optimization algorithms
- Integration with job boards for automatic job parsing
- LinkedIn profile integration for automatic profile data
- Interview preparation questions based on job requirements
- Salary negotiation guidance based on market data
- Multi-language support for international applications
- AI-powered writing suggestions and improvements

## Dependencies

- `@modelcontextprotocol/sdk`: Core MCP functionality
- `zod`: Schema validation and type safety
- `typescript`: TypeScript compiler
- `md-to-pdf`: PDF generation from Markdown
- `markdown-it`: Markdown parsing and HTML conversion
- `docx`: Word document generation (for future Word output)

## License

This project is available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.