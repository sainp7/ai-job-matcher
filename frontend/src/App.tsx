import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { AnalysisReportPDF } from './AnalysisReportPDF';

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
  candidate_name?: string | null;
  company_name?: string | null;
  job_role?: string | null;
}

function App() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [jdFileName, setJdFileName] = useState('');
  const [parsingJD, setParsingJD] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsing(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to parse resume');
      }

      const data = await response.json();
      setResumeText(data.text);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error parsing file.');
      setFileName('');
      // Reset the input value so the same file can be selected again
      e.target.value = '';
    } finally {
      setParsing(false);
    }
  };

  const handleJDUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJdFileName(file.name);
    setParsingJD(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/parse-jd', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to parse job description');
      }

      const data = await response.json();
      setJobDescription(data.text);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error parsing JD file.');
      setJdFileName('');
      // Reset the input value so the same file can be selected again
      e.target.value = '';
    } finally {
      setParsingJD(false);
    }
  };

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;

    setGeneratingPdf(true);
    setError('');

    try {
      const blob = await pdf(<AnalysisReportPDF result={result} />).toBlob();
      const url = URL.createObjectURL(blob);
      
      const websiteName = 'ai-resume-job-matcher';
      const sanitize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '');

      let baseName = '';
      if (result?.candidate_name) {
        const parts = [result.candidate_name, result.company_name, result.job_role]
          .filter((p): p is string => !!p)
          .map(sanitize)
          .filter(p => p !== '');
        baseName = parts.join('-');
      }

      if (!baseName) {
        const randomStr = Math.random().toString(36).substring(2, 8);
        baseName = `${websiteName}-${randomStr}`;
      }

      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseName}.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          AI Resume & Job Matcher
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-medium text-gray-700">Resume Text</label>
              <div className="text-xs text-gray-500">Paste text or upload PDF/DOCX/ODT</div>
            </div>
            <textarea
              className={`w-full h-96 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${parsing ? 'bg-gray-50 opacity-50' : ''}`}
              placeholder="Paste your resume here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              disabled={parsing}
            />
            <div className="mt-2">
              <input
                type="file"
                accept=".pdf,.docx,.odt"
                onChange={handleFileUpload}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${parsing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {parsing ? 'Parsing...' : fileName ? `Change File (${fileName})` : 'Upload Resume File'}
              </label>
              {fileName && !parsing && (
                <button 
                  onClick={() => { setFileName(''); setResumeText(''); }}
                  className="ml-3 text-sm text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2 mt-7 md:mt-0">
              <label className="block text-sm font-medium text-gray-700">Job Description</label>
              <div className="text-xs text-gray-500">Paste text or upload PDF/DOCX/ODT</div>
            </div>
            <textarea
              className={`w-full h-96 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${parsingJD ? 'bg-gray-50 opacity-50' : ''}`}
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={parsingJD}
            />
            <div className="mt-2">
              <input
                type="file"
                accept=".pdf,.docx,.odt"
                onChange={handleJDUpload}
                className="hidden"
                id="jd-upload"
              />
              <label
                htmlFor="jd-upload"
                className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${parsingJD ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {parsingJD ? 'Parsing...' : jdFileName ? `Change File (${jdFileName})` : 'Upload JD File'}
              </label>
              {jdFileName && !parsingJD && (
                <button 
                  onClick={() => { setJdFileName(''); setJobDescription(''); }}
                  className="ml-3 text-sm text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              )}
            </div>
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
            <div className="flex justify-end">
              <button
                onClick={handleDownloadPdf}
                disabled={generatingPdf}
                className={`px-6 py-2 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${generatingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {generatingPdf ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>

            <div id="report-root" className="space-y-8 bg-gray-50 p-4 rounded-lg">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Analysis Report</h2>
              {(result.candidate_name || result.company_name || result.job_role) && (
                <div className="text-center mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  {result.candidate_name && <h2 className="text-2xl font-bold text-gray-900">{result.candidate_name}</h2>}
                  <p className="text-gray-600">
                    {result.job_role} {result.job_role && result.company_name && 'at'} {result.company_name}
                  </p>
                </div>
              )}
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
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
