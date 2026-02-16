import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { AI_SUGGESTIONS_BY_PROBLEM, DEFAULT_SUGGESTIONS, LANGUAGE_MAP } from '../constants';

function ProblemPage({ problem, onBack }) {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(problem.starterCode.python);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('output');
  const [suggestionLog, setSuggestionLog] = useState([]);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const idleTimerRef = useRef(null);
  const completionProviderRef = useRef(null);
  const [pyodide, setPyodide] = useState(null);
  const [pyodideLoading, setPyodideLoading] = useState(true);

  const registerCompletionProvider = useCallback(
    (monaco, lang) => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
        completionProviderRef.current = null;
      }

      const suggestions =
        AI_SUGGESTIONS_BY_PROBLEM[problem.id] || DEFAULT_SUGGESTIONS;

      completionProviderRef.current =
        monaco.languages.registerCompletionItemProvider(lang, {
          triggerCharacters: [],

          provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endLineNumber: position.lineNumber,
              endColumn: word.endColumn,
            };

            return {
              suggestions: suggestions.map((s, idx) => ({
                label: s.label,
                kind: monaco.languages.CompletionItemKind.Snippet,
                detail: s.detail || 'AI Suggestion',
                documentation: {
                  value: '```' + lang + '\n' + s.insertText + '\n```',
                },
                insertText: s.insertText,
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range,
                sortText: `0${idx}`,
                command: {
                  id: 'ai-suggestion-accepted',
                  title: 'AI Suggestion Accepted',
                  arguments: [s.label],
                },
              })),
            };
          },
        });
    },
    [problem.id]
  );

  const handleEditorDidMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      editor.addCommand(0, () => {}, '');
      editor.addAction({
        id: 'ai-suggestion-accepted',
        label: 'AI Suggestion Accepted',
        run: (_ed, label) => {
          setSuggestionLog((prev) => [
            ...prev,
            {
              time: new Date().toLocaleTimeString(),
              action: 'accepted',
              label: label || 'unknown',
            },
          ]);
        },
      });

      editor.onKeyDown((e) => {
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV') {
          // Uncomment to enable anti-paste:
          // e.preventDefault();
          // e.stopPropagation();
        }
      });

      editor.onDidChangeModelContent(() => {
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }

        idleTimerRef.current = setTimeout(() => {
          if (editor.hasTextFocus()) {
            editor.trigger('ai-idle', 'editor.action.triggerSuggest', {});
          }
        }, 2000);
      });

      registerCompletionProvider(monaco, LANGUAGE_MAP[language]);
    },
    [registerCompletionProvider, language]
  );

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (completionProviderRef.current) completionProviderRef.current.dispose();
    };
  }, []);

useEffect(() => {
  const initPyodide = async () => {
    try {
      setPyodideLoading(true);

      // Check if Pyodide is already loaded
      if (window.loadPyodide) {
        const pyodideInstance = await window.loadPyodide();
        setPyodide(pyodideInstance);
        setPyodideLoading(false);
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="pyodide.js"]');
      if (existingScript) {
        // Wait for it to load
        existingScript.onload = async () => {
          const pyodideInstance = await window.loadPyodide();
          setPyodide(pyodideInstance);
          setPyodideLoading(false);
        };
        return;
      }

      // Load Pyodide script dynamically
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/pyodide@0.26.4/pyodide.js';
      script.async = true;

      script.onload = async () => {
        try {
          const pyodideInstance = await window.loadPyodide({
            indexURL: 'https://unpkg.com/pyodide@0.26.4/'
          });
          setPyodide(pyodideInstance);
          setPyodideLoading(false);
        } catch (err) {
          console.error('Pyodide init failed:', err);
          setOutput('Error: Failed to initialize Python runtime\n');
          setPyodideLoading(false);
        }
      };

      script.onerror = () => {
        console.error('Failed to load Pyodide script');
        setOutput('Error: Failed to initialize Python runtime\n');
        setPyodideLoading(false);
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('Failed to load Pyodide:', error);
      setOutput('Error: Failed to initialize Python runtime\n');
      setPyodideLoading(false);
    }
  };

  initPyodide();
}, []);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(problem.starterCode[newLang] || '');

    if (monacoRef.current) {
      registerCompletionProvider(monacoRef.current, LANGUAGE_MAP[newLang]);
    }
  };

  const handleRunCode = async () => {
    if (!pyodide) {
      setOutput('Error: Python runtime not loaded yet. Please wait...\n');
      return;
    }

    if (language !== 'python') {
      // Keep the mock execution for other languages
      setIsRunning(true);
      setActiveTab('output');
      setOutput('Running code...\n');

      setTimeout(() => {
        setOutput(`$ Running ${language} code...\n\nExecution complete.\n`);
        setIsRunning(false);
      }, 1500);
      return;
    }

    setIsRunning(true);
    setActiveTab('output');
    setOutput('');

    try {
        // Run everything in a single Python execution context
        const fullCode = `
import sys
from io import StringIO

# Redirect stdout and stderr
sys.stdout = StringIO()
sys.stderr = StringIO()

${code}

# Get the output
_stdout = sys.stdout.getvalue()
_stderr = sys.stderr.getvalue()
`;

        await pyodide.runPythonAsync(fullCode);

        // Get the captured output from Python globals
        const stdout = pyodide.globals.get('_stdout');
        const stderr = pyodide.globals.get('_stderr');

        let result = '';
        if (stdout) result += stdout;
        if (stderr) result += 'Error: ' + stderr;

        setOutput(result || 'Code executed successfully (no output)\n');

      } catch (error) {
        setOutput(`Error executing Python code:\n${error.message}\n`);
      } finally {
        setIsRunning(false);
      }
  };

  const handleSubmit = () => {
    setActiveTab('output');
    setOutput(
      'Submitting solution...\n\n' +
        'Your solution has been submitted successfully.\n' +
        'Redirecting to dashboard...'
    );
    setTimeout(() => onBack(), 2000);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button className="btn-back" onClick={onBack}>
            ← Back
          </button>
          <h1 className="logo">AutoSuggestion Quiz</h1>
        </div>
        <div className="header-right">
          <span className="problem-title">{problem.title}</span>
          <button className="btn btn-outline" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </header>

      <div className="main-layout">
        <div className="panel problem-panel">
          <div className="panel-header">
            <span className="panel-title">Problem</span>
          </div>
          <div className="panel-body problem-body">
            <h2 className="problem-heading">{problem.title}</h2>
            <p className="problem-description">{problem.description}</p>

            <div className="examples">
              {problem.examples.map((ex, i) => (
                <div key={i} className="example">
                  <h4>Example {i + 1}:</h4>
                  <pre className="example-block">
                    <strong>Input:</strong> {ex.input}
                    {'\n'}
                    <strong>Output:</strong> {ex.output}
                    {ex.explanation && (
                      <>
                        {'\n'}
                        <strong>Explanation:</strong> {ex.explanation}
                      </>
                    )}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel editor-panel">
          <div className="panel-header editor-header">
            <div className="language-selector">
              {Object.keys(LANGUAGE_MAP).map((lang) => (
                <button
                  key={lang}
                  className={`lang-btn ${language === lang ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lang)}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
            <div className="editor-actions">
              <button
                className="btn btn-run"
                onClick={handleRunCode}
                disabled={isRunning || (language === 'python' && pyodideLoading)}
              >
                {isRunning
                ? '⏳ Running...'
                : (language === 'python' && pyodideLoading)
                ? '⏳ Loading Python...'
                :'▶ Run Code'}
              </button>
            </div>
          </div>

          <div className="editor-container">
            <Editor
              height="100%"
              language={LANGUAGE_MAP[language]}
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                wordWrap: 'on',
                padding: { top: 12 },
                quickSuggestions: false,
                suggestOnTriggerCharacters: false,
                wordBasedSuggestions: 'off',
                suggest: {
                  showIcons: true,
                  showStatusBar: true,
                  preview: true,
                  previewMode: 'subwordSmart',
                  shareSuggestSelections: false,
                  showInlineDetails: true,
                  filterGraceful: false,
                },
                folding: true,
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          <div className="bottom-panel">
            <div className="bottom-tabs">
              <button
                className={`tab-btn ${activeTab === 'output' ? 'active' : ''}`}
                onClick={() => setActiveTab('output')}
              >
                Output
              </button>
              <button
                className={`tab-btn ${activeTab === 'log' ? 'active' : ''}`}
                onClick={() => setActiveTab('log')}
              >
                Suggestion Log
                {suggestionLog.length > 0 && (
                  <span className="log-count">{suggestionLog.length}</span>
                )}
              </button>
            </div>
            <div className="bottom-content">
              {activeTab === 'output' ? (
                <pre className="output-text">
                  {output || 'Click "Run Code" to see output here.'}
                </pre>
              ) : (
                <div className="suggestion-log">
                  {suggestionLog.length === 0 ? (
                    <p className="log-empty">
                      No suggestions accepted yet. Start typing in the editor
                      and pause for 2 seconds — AI suggestions will appear as an
                      autocomplete dropdown. Select one to see it logged here.
                    </p>
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemPage;
