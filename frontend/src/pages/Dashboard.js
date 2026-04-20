import React, { useState } from 'react';
import { DIFFICULTY_COLORS } from '../constants';
import { editProblem, gradeSubmission } from '../api';

// ─── Share Modal ──────────────────────────────────────────────────────────────

function AccessCodeModal({ problem, onClose }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(problem.access_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">Share Problem</span>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <p className="modal-problem-title">{problem.title}</p>
                    <p className="modal-label">Student Access Code</p>
                    <div className="access-code-row">
                        <span className="access-code-value">{problem.access_code || '------'}</span>
                        <button className="btn btn-outline" onClick={handleCopy}>
                            {copied ? '✓ Copied' : 'Copy'}
                        </button>
                    </div>
                    <p className="modal-hint">
                        Share this 6-digit code with your students. They enter it on the login screen to access this problem directly — no account needed.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ problem, onConfirm, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">Delete Problem</span>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <p className="modal-delete-warning">
                        Are you sure you want to delete{' '}
                        <strong style={{ color: '#e0e0e0' }}>{problem.title}</strong>?
                        This will remove all student submissions and cannot be undone.
                    </p>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button className="btn btn-danger" onClick={() => onConfirm(problem.id)}>
                            Delete Problem
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ problem, token, onSaved, onClose }) {
    const [title, setTitle] = useState(problem.title);
    const [description, setDescription] = useState(problem.description);
    const totalSecs = problem.time_limit_seconds ?? null;
    const [timeLimitMins, setTimeLimitMins] = useState(totalSecs !== null ? Math.floor(totalSecs / 60) : '');
    const [timeLimitSecs, setTimeLimitSecs] = useState(totalSecs !== null ? totalSecs % 60 : '');
    const [maxSubmissions, setMaxSubmissions] = useState(problem.max_attempts ?? '');
    const [allowCopyPaste, setAllowCopyPaste] = useState(problem.allow_copy_paste);
    const [trackTabSwitching, setTrackTabSwitching] = useState(problem.track_tab_switching);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!title.trim()) { setError('Title is required.'); return; }
        setSaving(true);
        setError('');
        try {
            const updated = await editProblem(problem.id, {
                title: title.trim(),
                description: description.trim(),
                timeLimitSeconds: (timeLimitMins !== '' || timeLimitSecs !== '')
                    ? (Number(timeLimitMins || 0) * 60 + Number(timeLimitSecs || 0)) || null
                    : null,
                maxSubmissions: maxSubmissions !== '' ? Number(maxSubmissions) : null,
                allowCopyPaste,
                trackTabSwitching,
            }, token);
            onSaved(updated);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">Edit Problem</span>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <div className="form-field">
                        <label className="form-label">Title</label>
                        <input
                            type="text"
                            className="form-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input form-textarea"
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div className="form-field" style={{ flex: 1 }}>
                        <label className="form-label">Time Limit</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="0"
                                    value={timeLimitMins}
                                    min={0}
                                    style={{ width: '80px' }}
                                    onChange={(e) => setTimeLimitMins(e.target.value)}
                                />
                                <span style={{ color: '#aaa', fontSize: '13px' }}>min</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="0"
                                    value={timeLimitSecs}
                                    min={0}
                                    max={59}
                                    style={{ width: '72px' }}
                                    onChange={(e) => setTimeLimitSecs(e.target.value)}
                                />
                                <span style={{ color: '#aaa', fontSize: '13px' }}>sec</span>
                            </div>
                        </div>
                        <div className="form-field" style={{ flex: 1 }}>
                            <label className="form-label">Max Submissions</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="Unlimited"
                                value={maxSubmissions}
                                min={1}
                                onChange={(e) => setMaxSubmissions(e.target.value)}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#ccc', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={allowCopyPaste}
                                onChange={(e) => setAllowCopyPaste(e.target.checked)}
                            />
                            Allow Copy &amp; Paste
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#ccc', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={trackTabSwitching}
                                onChange={(e) => setTrackTabSwitching(e.target.checked)}
                            />
                            Track Tab Switching
                        </label>
                    </div>
                    {error && <p className="form-error">{error}</p>}
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button className="btn btn-run" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Submissions / Grade Modal ────────────────────────────────────────────────

function SubmissionsModal({ problem, token, onGraded, onReview, onClose }) {
    const submissions = problem.submissions || [];
    const [gradingId, setGradingId] = useState(null);
    const [gradeInput, setGradeInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleGradeSave = async (sessionId) => {
        const g = Number(gradeInput);
        if (isNaN(g) || g < 0 || g > 100) { setError('Grade must be 0–100.'); return; }
        setSaving(true);
        setError('');
        try {
            await gradeSubmission(problem.id, sessionId, g, token);
            onGraded(problem.id, sessionId, g);
            setGradingId(null);
            setGradeInput('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">Submissions — {problem.title}</span>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {submissions.length === 0 ? (
                        <p className="modal-empty">No submissions yet for this problem.</p>
                    ) : (
                        <>
                            {error && <p className="form-error">{error}</p>}
                            <table className="submissions-table">
                                <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Submitted</th>
                                    <th>Score</th>
                                    <th>Grade</th>
                                    <th>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {submissions.map((s, i) => (
                                    <tr key={i}>
                                        <td>{s.student_name || 'Unknown'}</td>
                                        <td>{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}</td>
                                        <td>
                                            {s.score != null && s.total != null
                                                ? `${s.score} / ${s.total}`
                                                : '—'}
                                        </td>
                                        <td>
                                            {s.grade != null
                                                ? <span className="grade-badge">{s.grade}%</span>
                                                : <span style={{ color: '#666', fontSize: '12px' }}>Ungraded</span>}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ fontSize: '11px', padding: '3px 8px' }}
                                                    onClick={() => {
                                                        const studentSubs = submissions
                                                            .filter(sub => sub.student_name === s.student_name)
                                                            .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
                                                        onReview(s, problem, studentSubs);
                                                    }}
                                                >
                                                    Review
                                                </button>
                                                {gradingId === s.session_id ? (
                                                    <>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={gradeInput}
                                                            onChange={(e) => setGradeInput(e.target.value)}
                                                            style={{ width: '60px', background: '#1e1e1e', border: '1px solid #3c3c3c', borderRadius: '4px', color: '#ccc', padding: '2px 6px', fontSize: '12px' }}
                                                        />
                                                        <button className="btn btn-run" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => handleGradeSave(s.session_id)} disabled={saving}>
                                                            {saving ? '...' : 'Save'}
                                                        </button>
                                                        <button className="btn btn-outline" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => { setGradingId(null); setGradeInput(''); setError(''); }}>
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ fontSize: '11px', padding: '3px 8px' }}
                                                        onClick={() => { setGradingId(s.session_id); setGradeInput(s.grade ?? ''); setError(''); }}
                                                    >
                                                        {s.grade != null ? 'Edit Grade' : 'Grade'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Problem Card ─────────────────────────────────────────────────────────────

function ProblemCard({ problem, onShare, onDelete, onEdit, onViewSubmissions }) {
    const submissionCount = (problem.submissions || []).length;
    const gradedCount = (problem.submissions || []).filter(s => s.grade != null).length;

    return (
        <div className="problem-card" style={{ cursor: 'default' }}>
            <div className="card-top">
                <span
                    className="difficulty-badge"
                    style={{ color: DIFFICULTY_COLORS[problem.difficulty] || '#888' }}
                >
                    {problem.difficulty || 'N/A'}
                </span>
                <span style={{ fontSize: '11px', color: '#569cd6', fontWeight: 500 }}>
                    {submissionCount} {submissionCount === 1 ? 'submission' : 'submissions'}
                </span>
            </div>

            <h3 className="card-title">{problem.title}</h3>

            <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.5, flex: 1 }}>
                {problem.description?.slice(0, 80)}{problem.description?.length > 80 ? '...' : ''}
            </p>

            {problem.access_code && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #333',
                    borderRadius: '5px',
                }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#666' }}>
                        Code
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#9cdcfe', letterSpacing: '3px', flex: 1 }}>
                        {problem.access_code}
                    </span>
                    {submissionCount > 0 && (
                        <span style={{ fontSize: '10px', color: gradedCount === submissionCount ? '#16825d' : '#c08b30' }}>
                            {gradedCount}/{submissionCount} graded
                        </span>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #333' }}>
                <button
                    className="btn btn-outline"
                    style={{ flex: 1, fontSize: '11px', padding: '4px 8px' }}
                    onClick={() => onViewSubmissions(problem)}
                >
                    Submissions
                </button>
                <button
                    className="btn btn-outline"
                    style={{ flex: 1, fontSize: '11px', padding: '4px 8px' }}
                    onClick={() => onEdit(problem)}
                >
                    Edit
                </button>
                <button
                    className="btn btn-outline"
                    style={{ flex: 1, fontSize: '11px', padding: '4px 8px' }}
                    onClick={() => onShare(problem)}
                >
                    Share
                </button>
                <button
                    className="btn btn-outline"
                    style={{ flex: 1, fontSize: '11px', padding: '4px 8px', borderColor: '#3c3c3c', color: '#888' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#f48771'; e.currentTarget.style.borderColor = '#f48771'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#3c3c3c'; }}
                    onClick={() => onDelete(problem)}
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ problems = [], problemsLoading = false, problemsError = '', onCreateProblem, onDeleteProblem, onLogout, user, onProblemsUpdate, onRefresh, onReview, autofillPending = false }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [shareModal, setShareModal] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);
    const [editModal, setEditModal] = useState(null);
    const [submissionsModal, setSubmissionsModal] = useState(null);

    const totalSubmissions = problems.reduce((acc, p) => acc + (p.submissions?.length || 0), 0);
    const activeCount = problems.filter((p) => (p.submissions?.length || 0) > 0).length;
    const ungradedCount = problems.reduce((acc, p) =>
        acc + (p.submissions || []).filter(s => s.grade == null).length, 0
    );

    const filtered = problems.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
            q === '' ||
            p.title.toLowerCase().includes(q) ||
            (p.access_code || '').includes(q)
        );
    });

    const handleConfirmDelete = (problemId) => {
        if (onDeleteProblem) onDeleteProblem(problemId);
        setDeleteModal(null);
    };

    const handleProblemSaved = (updatedProblem) => {
        if (onProblemsUpdate) {
            onProblemsUpdate((prev) =>
                prev.map((p) => p.id === updatedProblem.id ? updatedProblem : p)
            );
        }
        setEditModal(null);
    };

    const handleGraded = (problemId, sessionId, grade) => {
        if (onProblemsUpdate) {
            onProblemsUpdate((prev) =>
                prev.map((p) => {
                    if (p.id !== problemId) return p;
                    return {
                        ...p,
                        submissions: p.submissions.map((s) =>
                            s.session_id === sessionId ? { ...s, grade } : s
                        ),
                    };
                })
            );
        }
        // Keep modal open so teacher can continue grading other students
        setSubmissionsModal((prev) => ({
            ...prev,
            submissions: prev.submissions.map((s) =>
                s.session_id === sessionId ? { ...s, grade } : s
            ),
        }));
    };

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-left">
                    <h1 className="logo">AutoSuggestion Quiz</h1>
                </div>
                <div className="header-right">
                    <span className="dashboard-greeting">
                        Welcome back, {user?.name || user?.email || 'Teacher'}
                    </span>
                    <button className="btn btn-outline" onClick={onRefresh} disabled={problemsLoading} title="Refresh problems">
                        {problemsLoading ? '↻ Loading…' : '↻ Refresh'}
                    </button>
                    <button className="btn btn-outline" onClick={onCreateProblem} style={{ position: 'relative' }}>
                        + New Problem
                        {autofillPending && (
                            <span style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: '#569cd6',
                                boxShadow: '0 0 0 2px #1e1e1e',
                                animation: 'pulse 1.5s ease-in-out infinite',
                            }} />
                        )}
                    </button>
                    <button className="btn btn-outline" onClick={onLogout}>
                        Log Out
                    </button>
                </div>
            </header>

            <div className="dashboard">

                {/* Stats */}
                <div className="stats-bar">
                    <div className="stat-card">
                        <span className="stat-value">{problems.length}</span>
                        <span className="stat-label">Problems</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: '#569cd6' }}>{totalSubmissions}</span>
                        <span className="stat-label">Submissions</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: '#16825d' }}>{activeCount}</span>
                        <span className="stat-label">Active Problems</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: ungradedCount > 0 ? '#c08b30' : '#888' }}>
                            {ungradedCount}
                        </span>
                        <span className="stat-label">Needs Grading</span>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="dashboard-toolbar">
                    <div className="search-box">
                        <span className="search-icon">⌕</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search problems or access codes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid */}
                {problemsError && (
                    <div className="empty-state">
                        <p style={{ color: '#f48771' }}>Failed to load problems: {problemsError}</p>
                        <button className="btn btn-outline" style={{ marginTop: '12px' }} onClick={onRefresh}>Try Again</button>
                    </div>
                )}
                {!problemsError && filtered.length === 0 ? (
                    <div className="empty-state">
                        {problemsLoading
                            ? <p style={{ color: '#666' }}>Loading problems…</p>
                            : problems.length === 0
                                ? <p>No problems yet. Click <strong style={{ color: '#569cd6' }}>+ New Problem</strong> to create your first one.</p>
                                : <p>No problems match your search.</p>
                        }
                    </div>
                ) : !problemsError && (
                    <div className="problem-grid">
                        {filtered.map((problem) => (
                            <ProblemCard
                                key={problem.id}
                                problem={problem}
                                onShare={(p) => setShareModal(p)}
                                onDelete={(p) => setDeleteModal(p)}
                                onEdit={(p) => setEditModal(p)}
                                onViewSubmissions={(p) => setSubmissionsModal(p)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {shareModal && (
                <AccessCodeModal problem={shareModal} onClose={() => setShareModal(null)} />
            )}
            {deleteModal && (
                <DeleteModal
                    problem={deleteModal}
                    onConfirm={handleConfirmDelete}
                    onClose={() => setDeleteModal(null)}
                />
            )}
            {editModal && (
                <EditModal
                    problem={editModal}
                    token={user?.token}
                    onSaved={handleProblemSaved}
                    onClose={() => setEditModal(null)}
                />
            )}
            {submissionsModal && (
                <SubmissionsModal
                    problem={submissionsModal}
                    token={user?.token}
                    onGraded={handleGraded}
                    onReview={onReview}
                    onClose={() => setSubmissionsModal(null)}
                />
            )}
        </div>
    );
}

export default Dashboard;