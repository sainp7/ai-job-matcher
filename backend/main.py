import os
import json
import numpy as np
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Models
class AnalyzeRequest(BaseModel):
    resume_text: str
    job_description: str

class ResumeData(BaseModel):
    skills: List[str]
    experience: List[str]
    education: List[str]

class JobData(BaseModel):
    required_skills: List[str]
    preferred_skills: List[str]
    responsibilities: List[str]

class AnalyzeResponse(BaseModel):
    match_score: int
    skill_overlap: List[str]
    missing_skills: List[str]
    improved_bullets: List[str]
    ats_keywords: Dict[str, Any]
    summary: List[str]

# Utils
def load_prompt(filename: str, **kwargs) -> str:
    path = os.path.join("backend/prompts", filename)
    if not os.path.exists(path):
        # Fallback for if we are running from inside backend dir
        path = os.path.join("prompts", filename)
    with open(path, "r") as f:
        prompt = f.read()
    for key, value in kwargs.items():
        prompt = prompt.replace(f"{{{{{key}}}}}", str(value))
    return prompt

def get_completion(prompt: str, json_mode: bool = False) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        response_format={"type": "json_object"} if json_mode else None
    )
    return response.choices[0].message.content

def get_embedding(text: str) -> List[float]:
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def calculate_score(resume_skills: List[str], job_data: JobData) -> int:
    if not job_data.required_skills and not job_data.preferred_skills:
        return 0
    
    if not resume_skills:
        return 0

    # Get embeddings for all resume skills combined and individual job skills
    # To keep it simple and deterministic as per spec, we'll average similarities
    
    res_text = ", ".join(resume_skills)
    res_emb = get_embedding(res_text)
    
    def get_avg_sim(job_skills):
        if not job_skills: return 1.0
        sims = []
        for s in job_skills:
            s_emb = get_embedding(s)
            sims.append(cosine_similarity(res_emb, s_emb))
        return np.mean(sims)

    req_sim = get_avg_sim(job_data.required_skills)
    pref_sim = get_avg_sim(job_data.preferred_skills)
    
    # Weighting: Required 70%, Preferred 30%
    if not job_data.preferred_skills:
        score = req_sim * 100
    elif not job_data.required_skills:
        score = pref_sim * 100
    else:
        score = (req_sim * 0.7 + pref_sim * 0.3) * 100
    
    return int(min(max(score, 0), 100))

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    if not request.resume_text.strip() or not request.job_description.strip():
        raise HTTPException(status_code=400, detail="Resume and Job Description are required")

    try:
        # 1. Parse Data
        resume_prompt = load_prompt("parse_resume.txt", resume_text=request.resume_text)
        resume_json = json.loads(get_completion(resume_prompt, json_mode=True))
        resume_data = ResumeData(**resume_json)

        job_prompt = load_prompt("parse_job.txt", job_description=request.job_description)
        job_json = json.loads(get_completion(job_prompt, json_mode=True))
        job_data = JobData(**job_json)

        # 2. Match Score (Deterministic via Embeddings)
        match_score = calculate_score(resume_data.skills, job_data)

        # 3. Skill Gap Analysis
        gap_prompt = load_prompt("skill_gap.txt", skills=resume_data.skills, job_requirements=job_data.required_skills)
        gap_data = json.loads(get_completion(gap_prompt, json_mode=True))

        # 4. Resume Rewrite
        rewrite_prompt = load_prompt("resume_rewrite.txt", bullets=resume_data.experience, job_description=request.job_description)
        improved_bullets_raw = get_completion(rewrite_prompt)
        # Expecting a list from the prompt instruction
        try:
            improved_bullets = json.loads(improved_bullets_raw)
            if not isinstance(improved_bullets, list):
                improved_bullets = [improved_bullets_raw]
        except:
            improved_bullets = [b.strip("- ") for b in improved_bullets_raw.split("\n") if b.strip()]

        # 5. ATS Keywords
        ats_prompt = load_prompt("ats_keywords.txt", job_description=request.job_description, resume_text=request.resume_text)
        ats_keywords = json.loads(get_completion(ats_prompt, json_mode=True))

        # 6. Final Summary
        summary_prompt = load_prompt("final_summary.txt", resume_text=request.resume_text, job_description=request.job_description)
        summary_raw = get_completion(summary_prompt)
        summary = [s.strip("- ") for s in summary_raw.split("\n") if s.strip()]

        return AnalyzeResponse(
            match_score=match_score,
            skill_overlap=gap_data.get("strong_matches", []) + gap_data.get("partial_matches", []),
            missing_skills=gap_data.get("missing_skills", []),
            improved_bullets=improved_bullets,
            ats_keywords=ats_keywords,
            summary=summary[:4] # Strictly 4 points
        )

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
