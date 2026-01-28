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
  pitch?: string | null;
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
  
  const [pitch, setPitch] = useState('');
  const [pitchLength, setPitchLength] = useState<'short' | 'extended'>('short');
  const [pitchTone, setPitchTone] = useState<'formal' | 'casual'>('formal');
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchError, setPitchError] = useState('');

  const handlePitchLengthChange = (length: 'short' | 'extended') => {
    setPitchLength(length);
    if (length === 'extended') {
      setPitchTone('formal');
    }
  };

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
    setPitch('');
    setPitchError('');

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

  const handleGeneratePitch = async () => {
    if (!result) return;

    setGeneratingPitch(true);
    setPitchError('');
    
    try {
      const response = await fetch('http://localhost:8000/generate-pitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
          match_score: result.match_score,
          skill_overlap: result.skill_overlap,
          length: pitchLength,
          tone: pitchTone,
          job_role: result.job_role,
          company_name: result.company_name,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to generate pitch');
      }

      const data = await response.json();
      setPitch(data.pitch);
    } catch (err: unknown) {
      setPitchError(err instanceof Error ? err.message : 'An error occurred during pitch generation.');
    } finally {
      setGeneratingPitch(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;

    setGeneratingPdf(true);
    setError('');

    try {
      const reportWithPitch = {
        ...result,
        pitch: pitch || null
      };
      const blob = await pdf(<AnalysisReportPDF result={reportWithPitch} />).toBlob();
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

  const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderList = (items: string[]) => (
    <ul className="list-disc list-inside space-y-2">
      {items.map((item, i) => (
        <li key={i} className="text-gray-700">{formatText(item)}</li>
      ))}
    </ul>
  );

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
              {renderList(result.summary)}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Improved Resume Bullets</h2>
              {renderList(result.improved_bullets)}
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

          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Job-Specific Personal Pitch</h2>
            
            <div className="flex flex-wrap items-center gap-x-12 gap-y-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Message Length</label>
                <div className="flex items-center space-x-3">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${pitchLength === 'short' ? 'text-blue-600' : 'text-gray-400'}`}>Short</span>
                  <button
                    onClick={() => handlePitchLengthChange(pitchLength === 'short' ? 'extended' : 'short')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${pitchLength === 'extended' ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pitchLength === 'extended' ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${pitchLength === 'extended' ? 'text-blue-600' : 'text-gray-400'}`}>Extended</span>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-3">Tone</label>
                <div className={`flex items-center space-x-3 ${pitchLength === 'extended' ? 'opacity-50' : ''}`}>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${pitchTone === 'formal' ? 'text-blue-600' : 'text-gray-400'}`}>Formal</span>
                  <button
                    onClick={() => setPitchTone(pitchTone === 'formal' ? 'casual' : 'formal')}
                    disabled={pitchLength === 'extended'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${pitchTone === 'casual' ? 'bg-blue-600' : 'bg-gray-200'} ${pitchLength === 'extended' ? 'cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pitchTone === 'casual' ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${pitchTone === 'casual' ? 'text-blue-600' : 'text-gray-400'}`}>Casual</span>
                </div>
                {pitchLength === 'extended' && (
                  <p className="absolute top-full mt-1 text-[10px] text-amber-600 font-medium italic whitespace-nowrap">
                    Extended messages use a professional tone.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-start mb-8">
              <button
                onClick={handleGeneratePitch}
                disabled={generatingPitch}
                className={`px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${generatingPitch ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {generatingPitch ? 'Generating Pitch...' : pitch ? 'Regenerate Pitch' : 'Generate Pitch'}
              </button>
            </div>

            {pitchError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <p className="text-red-700 text-sm">{pitchError}</p>
              </div>
            )}

            {pitch && (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm leading-relaxed">
                  {pitch}
                </pre>
              </div>
            )}
          </div>

          <div className="flex justify-center mt-8 pb-12">
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className={`px-6 py-2 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${generatingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {generatingPdf ? 'Generating PDF...' : 'Download PDF Report'}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
