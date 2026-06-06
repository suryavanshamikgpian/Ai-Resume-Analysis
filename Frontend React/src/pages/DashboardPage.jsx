import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const API_BASE = 'http://localhost:3000/api/auth';

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [resumes, setResumes] = useState([]); // Initially empty

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

  function getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2);
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
        <div className="dash-welcome">
          <h1>Welcome, {user.username} 👋</h1>
          <p>Upload your resume to get AI-powered insights and analysis.</p>
        </div>

        <div className="dash-section-header">
          <h2>Your Resumes</h2>
          <button id="btn-upload-resume" className="dash-upload-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Upload Resume
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
              <button id="btn-upload-resume-empty" className="dash-empty-upload-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Upload Resume to Analyze
              </button>
            </div>
          ) : (
            resumes.map((r, i) => (
              <div key={i} className="dash-resume-card">
                <div className="dash-resume-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="dash-resume-card-info">
                  <h4>{r.name}</h4>
                  <p>{r.date}</p>
                </div>
                <span className={`dash-resume-card-status ${r.status}`}>{r.status}</span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
