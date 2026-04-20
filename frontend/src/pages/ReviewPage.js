import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { LANGUAGE_MAP } from '../constants';
import { saveSessionFeedback } from '../api';

/**
 * @fileoverview Teacher review page — read-only view of a student's submission.
 * @module ReviewPage
 */

function parseSuggestionLog(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

const parseTabSwitchLog = parseSuggestionLog;
const parsePasteLog = parseSuggestionLog;

function parseTestResults(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getHighlightedLines(code, suggestionLog) {
  if (!code || !suggestionLog.length) return new Set();
  const lines = code.split('\n');
  const highlighted = new Set();
  suggestionLog.forEach(({ label }) => {
    if (!label) return;
    const needle = label.trim().toLowerCase();
    lines.forEach((line, idx) => {
      if (line.trim().toLowerCase().includes(needle)) {
        highlighted.add(idx + 1);
      }
    });
  });
  return highlighted;
}

function getPasteHighlightedLines(code, pasteLog) {
  if (!code || !pasteLog.length) return new Set();
  const lines = code.split('\n');
  const highlighted = new Set();
  pasteLog.forEach(({ preview }) => {
    if (!preview) return;
    const needle = preview.trim().toLowerCase();
    if (needle.length < 4) return;
    lines.forEach((line, idx) => {
      if (line.trim().toLowerCase().includes(needle)) {
        highlighted.add(idx + 1);
      }
    });
  });
  return highlighted;
}

function ReviewPage({ submission, allSubmissions = [], problem, onBack, token }) {
  const language = problem.language || 'python';

  // Default to the newest submission (allSubmissions is pre-sorted newest-first)
  const sorted = allSubmissions.length > 0 ? allSubmissions : [submission];
  const [activeSubmission, setActiveSubmission] = useState(sorted[0]);

  const { student_name, submitted_at, code = '', suggestion_log: rawLog, tab_switch_log: rawTabLog, test_results: rawTestResults, paste_log: rawPasteLog } = activeSubmission;
  const suggestionLog = parseSuggestionLog(rawLog);
  const tabSwitchLog = parseTabSwitchLog(rawTabLog);
  const testResults = parseTestResults(rawTestResults);
  const pasteLog = parsePasteLog(rawPasteLog);
  const externalPastes = pasteLog.filter(e => e.type === 'external_paste').length;
  const totalPastes = pasteLog.length;
  const passedCount = testResults.filter(r => r.passed).length;

  const [activeTab, setActiveTab] = useState('log');
  const [feedbackText, setFeedbackText] = useState(activeSubmission.feedback || '');
  const [feedbackStatus, setFeedbackStatus] = useState('idle'); // idle | saving | saved | error
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const applyDecorations = useCallback((editor, monaco, currentCode, currentLog, currentPasteLog) => {
    const aiLines = getHighlightedLines(currentCode, currentLog);
    const pasteLines = getPasteHighlightedLines(currentCode, currentPasteLog);
    const decorations = [
      ...Array.from(aiLines).map((lineNumber) => ({
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'ai-highlight-line',
          glyphMarginClassName: 'ai-highlight-glyph',
          overviewRuler: {
            color: 'rgba(192, 139, 48, 0.6)',
            position: monaco.editor.OverviewRulerLane.Right,
          },
        },
      })),
      ...Array.from(pasteLines).map((lineNumber) => ({
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'paste-highlight-line',
          overviewRuler: {
            color: 'rgba(86, 156, 214, 0.6)',
            position: monaco.editor.OverviewRulerLane.Left,
          },
        },
      })),
    ];
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);
  }, []);

  const handleEditorDidMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      applyDecorations(editor, monaco, code, suggestionLog, pasteLog);
    },
    [applyDecorations, code, suggestionLog]
  );

  // Re-apply decorations whenever the active submission changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      applyDecorations(editorRef.current, monacoRef.current, code, suggestionLog, pasteLog);
    }
  }, [activeSubmission, applyDecorations, code, suggestionLog]);

  // Reset feedback state when switching submissions
  useEffect(() => {
    setFeedbackText(activeSubmission.feedback || '');
    setFeedbackStatus('idle');
  }, [activeSubmission]);

  const handleSaveFeedback = async () => {
    setFeedbackStatus('saving');
    try {
      await saveSessionFeedback(activeSubmission.session_id, feedbackText, token);
      setFeedbackStatus('saved');
    } catch {
      setFeedbackStatus('error');
    }
  };

  const formattedDate = submitted_at
    ? new Date(submitted_at).toLocaleString()
    : 'Unknown';

  const testCases = problem.test_cases || [];
  const multipleSubmissions = sorted.length > 1;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button className="btn-back" onClick={onBack}>← Back</button>
          <h1 className="logo">AutoSuggestion Quiz</h1>
        </div>
        <div className="header-right">
          {multipleSubmissions && (
            <select
              className="review-submission-select"
              value={activeSubmission.session_id}
              onChange={(e) => {
                const selected = sorted.find(s => s.session_id === Number(e.target.value));
                if (selected) setActiveSubmission(selected);
              }}
            >
              {sorted.map((s, i) => (
                <option key={s.session_id} value={s.session_id}>
                  Submission {sorted.length - i} — {new Date(s.submitted_at).toLocaleString()}
                </option>
              ))}
            </select>
          )}
          <span className="review-meta">
            <span className="review-student">{student_name}</span>
            <span className="review-sep">·</span>
            <span className="review-date">Submitted {formattedDate}</span>
          </span>
          <span className="problem-title">{problem.title}</span>
        </div>
      </header>

      <div className="main-layout">
        {/* Left: problem description */}
        <div className="panel problem-panel">
          <div className="panel-header">
            <span className="panel-title">Problem</span>
          </div>
          <div className="panel-body problem-body">
            <h2 className="problem-heading">{problem.title}</h2>
            <p className="problem-description">{problem.description}</p>

            {/* Student info card */}
            <div className="review-info-card">
              <div className="review-info-row">
                <span className="review-info-label">Student</span>
                <span className="review-info-value">{student_name}</span>
              </div>
              <div className="review-info-row">
                <span className="review-info-label">Submitted</span>
                <span className="review-info-value">{formattedDate}</span>
              </div>
              <div className="review-info-row">
                <span className="review-info-label">AI Suggestions Used</span>
                <span className="review-info-value" style={{ color: suggestionLog.length > 0 ? '#c08b30' : '#16825d' }}>
                  {suggestionLog.length}
                </span>
              </div>
              <div className="review-info-row">
                <span className="review-info-label">Pastes</span>
                <span className="review-info-value" style={{ color: externalPastes > 0 ? '#c08b30' : totalPastes > 0 ? '#569cd6' : '#16825d' }}>
                  {totalPastes}{externalPastes > 0 ? ` (${externalPastes} external)` : ''}
                </span>
              </div>
              <div className="review-info-row">
                <span className="review-info-label">Tab Switches</span>
                <span className="review-info-value" style={{ color: tabSwitchLog.length > 0 ? '#c0392b' : '#16825d' }}>
                  {tabSwitchLog.length}
                </span>
              </div>
              {testResults.length > 0 && (
                <div className="review-info-row">
                  <span className="review-info-label">Tests Passed</span>
                  <span className="review-info-value" style={{ color: passedCount === testResults.length ? '#16825d' : '#c0392b' }}>
                    {passedCount} / {testResults.length}
                  </span>
                </div>
              )}
              {submission.grade != null && (
                <div className="review-info-row">
                  <span className="review-info-label">Grade</span>
                  <span className="review-info-value">
                    <span className="grade-badge">{submission.grade}%</span>
                  </span>
                </div>
              )}
            </div>

            {/* AI highlight legend */}
            {suggestionLog.length > 0 && (
              <div className="review-legend">
                <span className="review-legend-swatch" />
                <span className="review-legend-text">
                  Lines highlighted in amber contain accepted AI suggestions
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: read-only editor + tabs */}
        <div className="panel editor-panel">
          <div className="panel-header editor-header">
            <div className="language-selector">
              <span className="lang-btn active">
                {language.charAt(0).toUpperCase() + language.slice(1)}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
              Read-only
            </span>
          </div>

          <div className="editor-container">
            <Editor
              height="100%"
              language={LANGUAGE_MAP[language] || 'python'}
              value={code || '# No code submitted'}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                readOnly: true,
                fontSize: 14,
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                padding: { top: 12 },
                renderLineHighlight: 'none',
                cursorStyle: 'line',
                hideCursorInOverviewRuler: true,
                contextmenu: false,
                folding: true,
                domReadOnly: true,
              }}
            />
          </div>

          {/* Bottom tabs */}
          <div className="bottom-panel">
            <div className="bottom-tabs">
              <button
                className={`tab-btn ${activeTab === 'log' ? 'active' : ''}`}
                onClick={() => setActiveTab('log')}
              >
                Suggestion Log
                {suggestionLog.length > 0 && (
                  <span className="log-count">{suggestionLog.length}</span>
                )}
              </button>
              <button
                className={`tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
                onClick={() => setActiveTab('paste')}
              >
                Paste Log
                {pasteLog.length > 0 && (
                  <span className="log-count" style={{ backgroundColor: externalPastes > 0 ? '#c08b30' : '#569cd6' }}>
                    {pasteLog.length}
                  </span>
                )}
              </button>
              <button
                className={`tab-btn ${activeTab === 'tabs' ? 'active' : ''}`}
                onClick={() => setActiveTab('tabs')}
              >
                Tab Switches
                {tabSwitchLog.length > 0 && (
                  <span className="log-count" style={{ backgroundColor: '#c0392b' }}>
                    {tabSwitchLog.length}
                  </span>
                )}
              </button>
              <button
                className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
                onClick={() => setActiveTab('tests')}
              >
                Test Results
                {testResults.length > 0 && (
                  <span className="log-count" style={{ backgroundColor: passedCount === testResults.length ? '#16825d' : '#c0392b' }}>
                    {passedCount}/{testResults.length}
                  </span>
                )}
              </button>
              <button
                className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
                onClick={() => setActiveTab('feedback')}
              >
                Feedback
                {activeSubmission.feedback && (
                  <span className="log-count" style={{ backgroundColor: '#16825d' }}>&#10003;</span>
                )}
              </button>
            </div>

            <div className="bottom-content">
              {activeTab === 'paste' ? (
                <div className="suggestion-log">
                  {pasteLog.length === 0 ? (
                    <p className="log-empty">No paste events were recorded during this submission.</p>
                  ) : (
                    pasteLog.map((entry, i) => (
                      <div key={i} className="log-entry">
                        <span className="log-time">{entry.time}</span>
                        <span className="log-action" style={{ color: entry.type === 'external_paste' ? '#c08b30' : '#569cd6' }}>
                          {entry.type === 'external_paste' ? 'external paste' : 'internal paste'}
                        </span>
                        <span className="log-label" style={{ color: '#888', fontFamily: 'monospace', fontSize: '11px' }}>
                          {entry.charCount} chars{entry.preview ? ` · "${entry.preview}${entry.preview.length >= 60 ? '…' : ''}"` : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ) : activeTab === 'log' ? (
                <div className="suggestion-log">
                  {suggestionLog.length === 0 ? (
                    <p className="log-empty">No AI suggestions were accepted during this submission.</p>
                  ) : (
                    suggestionLog.map((entry, i) => (
                      <div key={i} className="log-entry">
                        <span className="log-time">{entry.time}</span>
                        <span className="log-action">{entry.action}</span>
                        <span className="log-label">{entry.label}</span>
                      </div>
                    ))
                  )}
                </div>
              ) : activeTab === 'tabs' ? (
                <div className="suggestion-log">
                  {tabSwitchLog.length === 0 ? (
                    <p className="log-empty">No tab switches were recorded during this submission.</p>
                  ) : (
                    tabSwitchLog.map((entry, i) => (
                      <div key={i} className="log-entry">
                        <span className="log-time">{entry.time}</span>
                        <span className="log-action" style={{ color: '#c0392b' }}>switched away</span>
                        <span className="log-label">Tab switch {i + 1} of {tabSwitchLog.length}</span>
                      </div>
                    ))
                  )}
                </div>
              ) : activeTab === 'tests' ? (
                <div className="suggestion-log">
                  {testResults.length === 0 ? (
                    <p className="log-empty">No test results were recorded for this submission.</p>
                  ) : (
                    testResults.map((r, i) => (
                      <div key={i} className="review-test-case">
                        <div className="review-test-header">
                          <span className="review-test-label">Test {i + 1}</span>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: r.passed ? '#4caf50' : '#f44336' }}>
                            {r.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        <div className="review-test-body">
                          <div className="review-test-row">
                            <span className="review-test-key">Call</span>
                            <code className="review-test-val">{r.input}</code>
                          </div>
                          <div className="review-test-row">
                            <span className="review-test-key">Expected</span>
                            <code className="review-test-val">{r.expected}</code>
                          </div>
                          <div className="review-test-row">
                            <span className="review-test-key">Actual</span>
                            <code className="review-test-val" style={{ color: r.passed ? '#4caf50' : '#f44336' }}>
                              {r.actual}
                            </code>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="suggestion-log" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => { setFeedbackText(e.target.value); setFeedbackStatus('idle'); }}
                    placeholder="Leave feedback for this student..."
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      background: '#2d2d2d',
                      color: '#d4d4d4',
                      border: '1px solid #3c3c3c',
                      borderRadius: '4px',
                      padding: '10px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={handleSaveFeedback}
                      disabled={feedbackStatus === 'saving'}
                      style={{
                        padding: '6px 16px',
                        background: '#0e639c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: feedbackStatus === 'saving' ? 'not-allowed' : 'pointer',
                        opacity: feedbackStatus === 'saving' ? 0.7 : 1,
                      }}
                    >
                      {feedbackStatus === 'saving' ? 'Saving...' : 'Save Feedback'}
                    </button>
                    {feedbackStatus === 'saved' && (
                      <span style={{ fontSize: '12px', color: '#16825d' }}>Saved</span>
                    )}
                    {feedbackStatus === 'error' && (
                      <span style={{ fontSize: '12px', color: '#c0392b' }}>Failed to save</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewPage;
