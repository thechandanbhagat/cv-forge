# CV Maker MCP Server

A Node.js MCP (Model Context Protocol) server for generating ATS-friendly CV documents based on job requirements.

## Features

- **Parse Job Requirements**: Extract key skills and qualifications from job postings
- **Generate Tailored CVs**: Create customized CV content based on user profile and job requirements
- **Multiple Output Formats**: Generate CVs in PDF, HTML, Markdown, and text formats
- **Professional PDF Generation**: Create publication-ready PDF documents with professional styling
- **ATS-Friendly**: Optimized for Applicant Tracking Systems with proper keyword placement
- **Markdown Support**: Generate CVs in Markdown for easy editing and version control

## Installation

1. Clone or download this repository
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

**Step 1: Build the project**
```bash
npm run build
```

**Step 2: Find your Claude Desktop config file**
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Step 3: Add the MCP server to your config**
Add this to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "cv-maker": {
      "command": "node",
      "args": ["d:/TopSecret/cv-maker/build/index.js"],
      "cwd": "d:/TopSecret/cv-maker"
    }
  }
}
```

**Note**: Update the path `d:/TopSecret/cv-maker` to match your actual project location.

**Step 4: Restart Claude Desktop**
After adding the configuration, restart Claude Desktop application.

**Step 5: Verify Connection**
In Claude Desktop, you should see the CV maker tools available. You can ask Claude to use tools like:
- "Parse this job posting for me"
- "Generate a tailored CV based on my profile and this job"
- "Save my CV as a text file"

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

#### 4. `generate_and_save_cv_pdf` (Recommended)
Generate tailored CV and save directly as professional PDF (combines CV generation and PDF creation in one step).

**Parameters:**
- `userProfile` (object, required): Complete user profile information
- `jobRequirements` (object, required): Job requirements object
- `outputPath` (string, optional): Directory path where the CV should be saved (uses DEFAULT_OUTPUT_PATH if not provided)
- `fileName` (string, optional): Custom filename (without extension), defaults to "professional_cv"

#### 5. `generate_and_save_cv_markdown` (Recommended)
Generate tailored CV and save directly as Markdown (combines CV generation and Markdown creation in one step).

**Parameters:**
- `userProfile` (object, required): Complete user profile information
- `jobRequirements` (object, required): Job requirements object
- `outputPath` (string, required): Directory path where the CV should be saved
- `fileName` (string, optional): Custom filename (without extension), defaults to "cv_markdown"

#### 6. `generate_and_save_cv_html` (Recommended)
Generate tailored CV and save directly as HTML (combines CV generation and HTML creation in one step).

**Parameters:**
- `userProfile` (object, required): Complete user profile information
- `jobRequirements` (object, required): Job requirements object
- `outputPath` (string, required): Directory path where the CV should be saved
- `fileName` (string, optional): Custom filename (without extension), defaults to "cv_html"

#### 7. `generate_cv_pdf` (Advanced)
Generate and save CV as a professional PDF document from pre-generated CV data.

**Parameters:**
- `cvData` (object, required): Tailored CV data object (from generate_cv_data)
- `outputPath` (string, required): Directory path where the CV should be saved
- `fileName` (string, optional): Custom filename (without extension), defaults to "professional_cv"

#### 8. `generate_cv_markdown` (Advanced)
Generate CV as Markdown format from pre-generated CV data.

**Parameters:**
- `cvData` (object, required): Tailored CV data object (from generate_cv_data)
- `outputPath` (string, required): Directory path where the CV should be saved
- `fileName` (string, optional): Custom filename (without extension), defaults to "cv_markdown"

#### 9. `generate_cv_html` (Advanced)
Generate CV as styled HTML document from pre-generated CV data.

**Parameters:**
- `cvData` (object, required): Tailored CV data object (from generate_cv_data)
- `outputPath` (string, required): Directory path where the CV should be saved
- `fileName` (string, optional): Custom filename (without extension), defaults to "cv_web"

## Configuration

### Environment Variables

The MCP server supports various configuration options via environment variables in the Claude Desktop config:

```json
{
  "mcpServers": {
    "cv-maker": {
      "command": "node",
      "args": ["path/to/cv-maker/build/index.js"],
      "cwd": "path/to/cv-maker",
      "env": {
        "DEFAULT_OUTPUT_PATH": "D:/CV",
        "TEMP_DIR": "C:/Users/YourName/AppData/Local/Temp/cv-maker",
        "PDF_TIMEOUT": "300000",
        "PDF_MARGIN_TOP": "20mm",
        "PDF_MARGIN_RIGHT": "20mm",
        "PDF_MARGIN_BOTTOM": "20mm",
        "PDF_MARGIN_LEFT": "20mm",
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
- `PDF_MARGIN_*`: PDF page margins (top, right, bottom, left)
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

### 2. Generate Tailored CV (Simple One-Step Process)
```
"Generate a tailored CV for me and save it as a PDF based on this job posting:

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

### 3. Generate Different Formats
```
"Can you generate my CV in multiple formats? I need:
1. A professional PDF for applications
2. A Markdown version for my GitHub
3. An HTML version for my website

Save them all to C:\Users\John\Documents\CVs with the base filename 'john_doe_cv'"
```

### 3. Direct Tool Usage Examples
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
cv-maker/
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
- `src/lib/job-parser.ts`: Parses job requirements and extracts key information
- `src/lib/cv-generator.ts`: Generates tailored CV content based on job requirements
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

## Future Enhancements

- Enhanced Word document generation with advanced formatting
- Multiple CV templates (modern, classic, minimal)
- Advanced keyword optimization algorithms
- Integration with job boards for automatic job parsing
- Template customization options
- Cover letter generation
- Multi-language support

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