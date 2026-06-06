import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const API_BASE = 'http://localhost:3000/api/auth';
const RESUME_API = 'http://localhost:3000/api/resume';
const REPORT_API = 'http://localhost:3000/api/report';

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [reports, setReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Fetch logged-in user on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${API_BASE}/get-me`, {
          credentials: 'include',
        });
        if (!res.ok) {
          navigate('/auth', { replace: true });
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        navigate('/auth', { replace: true });
      }
    }
    fetchUser();
  }, [navigate]);

  // Load resumes and reports from API once user is available
  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const [resumeRes, reportRes] = await Promise.all([
          fetch(`${RESUME_API}/user`, { credentials: 'include' }),
          fetch(`${REPORT_API}/user`, { credentials: 'include' }),
        ]);

        if (resumeRes.ok) {
          const resumeData = await resumeRes.json();
          setResumes(resumeData.resumes);
        }

        if (reportRes.ok) {
          const reportData = await reportRes.json();
          setReports(reportData.reports);
        }
      } catch {
        /* silently fail — user still sees dashboard */
      }
    }
    fetchData();
  }, [user]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch(`${API_BASE}/logout`, {
        credentials: 'include',
      });
    } catch {
      /* ignore */
    }
    navigate('/auth', { replace: true });
  }

  function triggerFileInput() {
    setUploadError('');
    fileInputRef.current?.click();
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch(`${RESUME_API}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.message || 'Upload failed.');
        return;
      }

      // Prepend the new resume and navigate to analyze
      setResumes((prev) => [data.resume, ...prev]);
      navigate(`/analyze/${data.resume._id}`);
    } catch {
      setUploadError('Network error — could not upload resume.');
    } finally {
      setUploading(false);
    }
  }

  function getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2);
  }

  function getScoreColor(score) {
    if (score >= 70) return '#51cf66';
    if (score >= 40) return '#ffbe0b';
    return '#ff6b6b';
  }

  function truncate(text, max = 80) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  if (!user) {
    return (
      <div className="dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="dash-bg-grid" />
        <span className="spinner" style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--accent-secondary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dash-bg-grid" />

      {/* ─── Top Bar ─── */}
      <header className="dash-topbar">
        <div className="dash-brand">
          <div className="dash-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2>ResumeAI</h2>
        </div>

        <button
          id="btn-profile"
          className="dash-profile-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open profile"
        >
          {getInitials(user.username)}
        </button>
      </header>

      {/* ─── Profile Sidebar ─── */}
      {sidebarOpen && (
        <>
          <div
            className="dash-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="dash-sidebar" role="complementary" aria-label="Profile sidebar">
            <div className="dash-sidebar-header">
              <h3>Profile</h3>
              <button
                className="dash-sidebar-close"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="dash-sidebar-profile">
              <div className="dash-sidebar-avatar">
                {getInitials(user.username)}
              </div>
              <div className="dash-sidebar-user-info">
                <h4>{user.username}</h4>
                <p>{user.email}</p>
              </div>
            </div>

            <div className="dash-sidebar-body">
              <div className="dash-sidebar-info-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <div>
                  <div className="info-label">Username</div>
                  <div className="info-value">{user.username}</div>
                </div>
              </div>

              <div className="dash-sidebar-info-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <div>
                  <div className="info-label">Email</div>
                  <div className="info-value">{user.email}</div>
                </div>
              </div>

              <div className="dash-sidebar-info-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div>
                  <div className="info-label">Resumes Uploaded</div>
                  <div className="info-value">{resumes.length}</div>
                </div>
              </div>

              <div className="dash-sidebar-info-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <div>
                  <div className="info-label">Reports Generated</div>
                  <div className="info-value">{reports.length}</div>
                </div>
              </div>
            </div>

            <div className="dash-sidebar-footer">
              <button
                id="btn-logout"
                className="dash-logout-btn"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {loggingOut ? 'Logging out…' : 'Log Out'}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ─── Main Content ─── */}
      <main className="dash-content">
        {/* Hidden file input */}
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <div className="dash-welcome">
          <h1>Welcome, {user.username} 👋</h1>
          <p>Upload your resume to get AI-powered insights and analysis.</p>
        </div>

        {uploadError && (
          <div className="dash-upload-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {uploadError}
          </div>
        )}

        {/* ── Your Resumes ── */}
        <div className="dash-section-header">
          <h2>Your Resumes</h2>
          <button
            id="btn-upload-resume"
            className="dash-upload-btn"
            onClick={triggerFileInput}
            disabled={uploading}
          >
            {uploading ? (
              <span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
            {uploading ? 'Uploading…' : 'Upload Resume'}
          </button>
        </div>

        <div className="dash-resume-list">
          {resumes.length === 0 ? (
            <div className="dash-empty-state">
              <div className="dash-empty-illustration">
                <div className="doc-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
              <h3>No resumes yet</h3>
              <p>Upload your first resume to get started with AI-powered analysis and feedback.</p>
              <button
                id="btn-upload-resume-empty"
                className="dash-empty-upload-btn"
                onClick={triggerFileInput}
                disabled={uploading}
              >
                {uploading ? (
                  <span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
                {uploading ? 'Uploading…' : 'Upload Resume to Analyze'}
              </button>
            </div>
          ) : (
            resumes.map((r) => (
              <div
                key={r._id}
                className="dash-resume-card"
                onClick={() => navigate(`/analyze/${r._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/analyze/${r._id}`)}
              >
                <div className="dash-resume-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="dash-resume-card-info">
                  <h4>{r.originalName}</h4>
                  <p>{new Date(r.uploadedAt).toLocaleDateString()}</p>
                </div>
                <span className="dash-resume-card-action">
                  Analyze
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            ))
          )}
        </div>

        {/* ── Recent Reports ── */}
        {reports.length > 0 && (
          <>
            <div className="dash-section-header" style={{ marginTop: '2.5rem' }}>
              <h2>Recent Reports</h2>
            </div>
            <div className="dash-report-list">
              {reports.map((rpt) => (
                <div
                  key={rpt._id}
                  className="dash-report-card"
                  onClick={() => navigate(`/analyze/${rpt.resumeId?._id || rpt.resumeId}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/analyze/${rpt.resumeId?._id || rpt.resumeId}`)}
                >
                  <div className="dash-report-score" style={{ '--score-clr': getScoreColor(rpt.analysis.matchScore) }}>
                    {rpt.analysis.matchScore}
                  </div>
                  <div className="dash-report-card-info">
                    <h4>{rpt.resumeId?.originalName || 'Resume'}</h4>
                    <p>{truncate(rpt.jobDescription)}</p>
                  </div>
                  <div className="dash-report-meta">
                    <span className="dash-report-date">
                      {new Date(rpt.createdAt).toLocaleDateString()}
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
