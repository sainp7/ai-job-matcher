# AI-Powered Resume & Job Match Platform MVP

This is an AI-powered platform that analyzes a resume against a job description to provide a match score, skill gap analysis, improved resume bullets, and ATS keyword suggestions.

## Architecture

- **Backend**: FastAPI (Python)
  - Uses OpenAI GPT-4o-mini for text analysis and rewriting.
  - Uses OpenAI text-embedding-3-small for deterministic skill matching.
  - Prompts are stored as individual files in `backend/prompts/`.
- **Frontend**: React (TypeScript) + Tailwind CSS
  - Single-page application for uploading resume/job description and viewing results.

## Trade-offs & Decisions

- **Stateless**: No database or user accounts to keep the MVP simple.
- **Deterministic Scoring**: Scoring is computed using cosine similarity of embeddings between resume skills and job requirements, preventing LLM "hallucinations" in scoring.
- **Prompt Isolation**: Prompts are stored in text files for easy versioning and modification without touching the code.
- **Simplified UI**: Focused on functionality and data presentation over complex UI components or animations.

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API Key

### 1. Setup Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```
OPENAI_API_KEY=your_api_key_here
```

Run the backend:
```bash
python main.py
```
The API will be available at `http://localhost:8000`.

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

## Usage

1. Paste your resume text into the "Resume Text" area.
2. Paste the job description into the "Job Description" area.
3. Click **Analyze Fit**.
4. View your match score and detailed analysis.
