import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AnalyzePage.css';

const API_BASE = 'http://localhost:3000/api';

function AnalyzePage() {
  const { resumeId } = useParams();
  const navigate = useNavigate();

  // Resume metadata
  const [resume, setResume] = useState(null);
  const [loadingResume, setLoadingResume] = useState(true);

  // Form state
  const [jobDescription, setJobDescription] = useState('');

  // Analysis state: 'input' | 'loading' | 'report'
  const [stage, setStage] = useState('input');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  // Fetch resume info on mount
  useEffect(() => {
    async function fetchResume() {
      try {
        const res = await fetch(`${API_BASE}/resume/user`, {
          credentials: 'include',
        });
        if (!res.ok) {
          navigate('/dashboard', { replace: true });
          return;
        }
        const data = await res.json();
        const found = data.resumes.find((r) => r._id === resumeId);
        if (!found) {
          navigate('/dashboard', { replace: true });
          return;
        }
        setResume(found);
      } catch {
        navigate('/dashboard', { replace: true });
      } finally {
        setLoadingResume(false);
      }
    }
    fetchResume();
  }, [resumeId, navigate]);

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setError('');
    setStage('loading');

    try {
      const res = await fetch(`${API_BASE}/report/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, jobDescription }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Analysis failed.');
        setStage('input');
        return;
      }

      setReport(data.report);
      setStage('report');
    } catch {
      setError('Network error — could not reach the server.');
      setStage('input');
    }
  }

  // Score color helper
  function getScoreColor(score) {
    if (score >= 70) return '#51cf66';
    if (score >= 40) return '#ffbe0b';
    return '#ff6b6b';
  }

  function getCategoryClass(cat) {
    const lower = cat.toLowerCase();
    if (lower.includes('technical')) return 'cat-technical';
    if (lower.includes('behavioral')) return 'cat-behavioral';
    return 'cat-situational';
  }

  // ── Loading spinner ──
  if (loadingResume) {
    return (
      <div className="analyze-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="analyze-bg-grid" />
        <span className="az-spinner" />
      </div>
    );
  }

  return (
    <div className="analyze-page">
      <div className="analyze-bg-grid" />

      {/* ─── Top Bar ─── */}
      <header className="az-topbar">
        <button className="az-back-btn" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Dashboard
        </button>
        <div className="az-brand">
          <div className="az-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2>ResumeAI</h2>
        </div>
      </header>

      <main className="az-content">
        {/* ─── Resume Info Bar ─── */}
        <div className="az-resume-info">
          <div className="az-resume-info-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <h3>{resume?.originalName}</h3>
            <p>Uploaded {new Date(resume?.uploadedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* ═══════ STAGE: INPUT ═══════ */}
        {stage === 'input' && (
          <form className="az-input-form" onSubmit={handleAnalyze}>
            <div className="az-form-header">
              <div className="az-form-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <h2>Paste the Job Description</h2>
                <p>Paste the full job posting — the AI will compare your resume against it and generate an ATS analysis report.</p>
              </div>
            </div>

            {error && (
              <div className="az-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            <textarea
              id="jd-input"
              className="az-textarea"
              placeholder="Paste the complete job description here…&#10;&#10;Example:&#10;We are looking for a Full Stack Developer with 3+ years of experience in React, Node.js, and MongoDB…"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={12}
              required
            />

            <div className="az-form-footer">
              <span className="az-char-count">{jobDescription.length} characters</span>
              <button
                type="submit"
                id="btn-analyze"
                className="az-analyze-btn"
                disabled={!jobDescription.trim()}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Analyze with AI
              </button>
            </div>
          </form>
        )}

        {/* ═══════ STAGE: LOADING ═══════ */}
        {stage === 'loading' && (
          <div className="az-loading-state">
            <div className="az-loading-orb">
              <div className="az-loading-ring" />
              <svg className="az-loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h2>Analyzing your resume…</h2>
            <p>Our AI is comparing your resume against the job description. This usually takes 10–20 seconds.</p>
            <div className="az-loading-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* ═══════ STAGE: REPORT ═══════ */}
        {stage === 'report' && report && (
          <div className="az-report">
            {/* ── Score Section ── */}
            <div className="az-score-section">
              <div className="az-score-ring" style={{ '--score-color': getScoreColor(report.analysis.matchScore) }}>
                <svg viewBox="0 0 120 120">
                  <circle className="az-score-track" cx="60" cy="60" r="52" />
                  <circle
                    className="az-score-fill"
                    cx="60" cy="60" r="52"
                    style={{
                      strokeDasharray: `${(report.analysis.matchScore / 100) * 326.73} 326.73`,
                      stroke: getScoreColor(report.analysis.matchScore)
                    }}
                  />
                </svg>
                <div className="az-score-value">
                  <span className="az-score-number">{report.analysis.matchScore}</span>
                  <span className="az-score-label">ATS Score</span>
                </div>
              </div>
              <div className="az-score-text">
                <h2>ATS Match Score</h2>
                <p>
                  {report.analysis.matchScore >= 70
                    ? 'Great match! Your resume aligns well with this role.'
                    : report.analysis.matchScore >= 40
                    ? 'Decent match, but there are gaps to address.'
                    : 'Low match — consider tailoring your resume for this role.'}
                </p>
              </div>
            </div>

            {/* ── Summary ── */}
            <div className="az-card az-summary-card">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Summary
              </h3>
              <p>{report.analysis.summary}</p>
            </div>

            {/* ── Skills Found ── */}
            <div className="az-card">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Skills Found
              </h3>
              <div className="az-chips">
                {report.analysis.skillsFound.map((skill, i) => (
                  <span key={i} className="az-chip az-chip-found">{skill}</span>
                ))}
              </div>
            </div>

            {/* ── Skills Gap ── */}
            <div className="az-card">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Skills Gap — Missing from your resume
              </h3>
              <div className="az-chips">
                {report.analysis.skillsGap.map((skill, i) => (
                  <span key={i} className="az-chip az-chip-gap">{skill}</span>
                ))}
              </div>
            </div>

            {/* ── Interview Questions ── */}
            <div className="az-card">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Likely Interview Questions
              </h3>
              <div className="az-questions">
                {report.analysis.interviewQuestions.map((iq, i) => (
                  <div key={i} className="az-question-card">
                    <span className={`az-question-cat ${getCategoryClass(iq.category)}`}>
                      {iq.category}
                    </span>
                    <p>{iq.question}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="az-report-actions">
              <button className="az-btn-secondary" onClick={() => { setStage('input'); setJobDescription(''); setReport(null); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Analyze Again
              </button>
              <button className="az-btn-primary" onClick={() => navigate('/dashboard')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AnalyzePage;
