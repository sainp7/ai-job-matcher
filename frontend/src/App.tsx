import { useState } from 'react';

interface AnalysisResult {
  match_score: number;
  skill_overlap: string[];
  missing_skills: string[];
  improved_bullets: string[];
  ats_keywords: {
    missing_keywords: string[];
    suggested_placements: {
      skills: string[];
      experience: string[];
    };
  };
  summary: string[];
}

function App() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Both resume and job description are required.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to analyze');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          AI Resume & Job Matcher
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resume Text</label>
            <textarea
              className="w-full h-64 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste your resume here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
            <textarea
              className="w-full h-64 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={`px-8 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Analyzing Fit...' : 'Analyze Fit'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Match Score</h2>
              <div className="flex items-center">
                <div className="text-5xl font-extrabold text-blue-600">{result.match_score}%</div>
                <div className="ml-4 text-gray-500">Overall compatibility with the role.</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4 text-green-700">Skill Overlap</h2>
                <ul className="list-disc list-inside space-y-1">
                  {result.skill_overlap.map((skill, i) => (
                    <li key={i} className="text-gray-700">{skill}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4 text-red-700">Missing Skills</h2>
                <ul className="list-disc list-inside space-y-1">
                  {result.missing_skills.map((skill, i) => (
                    <li key={i} className="text-gray-700">{skill}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Summary</h2>
              <ul className="list-disc list-inside space-y-2">
                {result.summary.map((point, i) => (
                  <li key={i} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Improved Resume Bullets</h2>
              <ul className="list-disc list-inside space-y-3">
                {result.improved_bullets.map((bullet, i) => (
                  <li key={i} className="text-gray-700 leading-relaxed">{bullet}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-purple-700">ATS Keyword Suggestions</h2>
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700">Missing Keywords:</h3>
                <p className="text-gray-600">{result.ats_keywords.missing_keywords.join(', ') || 'None identified'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Suggested for Skills:</h4>
                  <ul className="list-disc list-inside">
                    {result.ats_keywords.suggested_placements.skills.map((s, i) => <li key={i} className="text-sm text-gray-600">{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Suggested for Experience:</h4>
                  <ul className="list-disc list-inside">
                    {result.ats_keywords.suggested_placements.experience.map((e, i) => <li key={i} className="text-sm text-gray-600">{e}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
