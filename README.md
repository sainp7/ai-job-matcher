# AI-Powered Resume & Job Match Platform MVP

This is an AI-powered platform that analyzes a resume against a job description to provide a match score, skill gap analysis, improved resume bullets, and ATS keyword suggestions.

## Architecture

- **Backend**: FastAPI (Python)
  - Uses OpenAI GPT-4o-mini for text analysis and rewriting.
  - Uses OpenAI text-embedding-3-small for deterministic skill matching.
  - Supports resume parsing from PDF, DOCX, and ODT files.
  - Prompts are stored as individual files in `backend/prompts/`.
- **Frontend**: React (TypeScript) + Tailwind CSS
  - Single-page application for uploading resume/job description and viewing results.

## Trade-offs & Decisions

- **Stateless**: No database or user accounts to keep the MVP simple.
- **Deterministic Scoring**: Scoring is computed using cosine similarity of embeddings between resume skills and job requirements, preventing LLM "hallucinations" in scoring.
- **Prompt Isolation**: Prompts are stored in text files for easy versioning and modification without touching the code.
- **Simplified UI**: Focused on functionality and data presentation over complex UI components or animations.

## Getting Started

### 1. Docker Setup (Recommended)

The easiest way to get the project running is using Docker Compose.

**Prerequisites:**
- Docker and Docker Compose installed.

1. Create a `.env` file in the root directory:
   ```bash
   OPENAI_API_KEY=your_api_key_here
   ```

2. Start the services:
   ```bash
   docker compose up --build
   ```

The application will be available at `http://localhost`.

---

### 2. Manual Setup (Alternative)

If you prefer to run the project without Docker, follow these steps.

**Prerequisites:**
- Python 3.9+
- Node.js 18+
- OpenAI API Key

#### Setup Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Setup virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the `backend` directory:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. Run the backend:
   ```bash
   python main.py
   ```
The API will be available at `http://localhost:8000`.

#### Setup Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```
The app will be available at `http://localhost:5173`.

## Usage

1. Paste your resume text into the "Resume Text" area **OR** upload a resume file (.pdf, .docx, .odt).
2. Paste the job description into the "Job Description" area **OR** upload a resume file (.pdf, .docx, .odt).
3. Click **Analyze Fit**.
4. View your match score and detailed analysis.
