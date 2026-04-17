import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { AI_SUGGESTIONS_BY_PROBLEM, DEFAULT_AI_SUGGESTIONS, LANGUAGE_MAP } from '../constants';

/**
 * @fileoverview Problem page component for the AutoSuggestion Quiz application.
 * @module ProblemPage
 */

/**
 * @typedef {Object} Example
 * @property {string} input - The example input value.
 * @property {string} output - The expected output for the given input.
 * @property {string} [explanation] - Optional explanation of why the output is correct.
 */

/**
 * @typedef {Object} Problem
 * @property {string} id - Unique identifier used to look up AI suggestions.
 * @property {string} title - Display title of the problem.
 * @property {string} description - Full problem description shown to the user.
 * @property {Object.<string, string>} starterCode - Map of language key to starter code string.
 * @property {Example[]} examples - List of input/output examples shown in the problem panel.
 */

/**
 * @typedef {Object} SuggestionLogEntry
 * @property {string} time - Locale time string of when the suggestion was accepted.
 * @property {'accepted'} action - The action taken on the suggestion.
 * @property {string} label - The label of the accepted suggestion.
 */

function ProblemPage({ problem, onBack }) {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(problem.starterCode.python || '');
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('output');
  const [suggestionLog, setSuggestionLog] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [suggestionQueue, setSuggestionQueue] = useState([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const idleTimerRef = useRef(null);
  const completionProviderRef = useRef(null);

  const [pyodide, setPyodide] = useState(null);
  const [pyodideLoading, setPyodideLoading] = useState(true);

  /**
   * Fetches one AI suggestion from the backend.
   */
  const fetchSuggestionFromBackend = useCallback(
    async (currentCode) => {
      const response = await fetch('http://localhost:8000/ai/suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem_id: problem.id,
          current_code: currentCode,
          problem_prompt: problem.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI suggestion');
      }

      const data = await response.json();

      return {
        label: data.label || 'AI Suggestion',
        detail: data.detail || 'AI Suggestion',
        insertText: data.insertText || '',
        explanation: data.explanation || '',
      };
    },
    [problem.id, problem.description]
  );

  /**
   * Preloads multiple suggestions to reduce visible wait time.
   */
  const preloadSuggestions = useCallback(
    async (currentCode, count = 3) => {
      if (isFetchingSuggestions) return;

      try {
        setIsFetchingSuggestions(true);

        const requests = Array.from({ length: count }, () =>
          fetchSuggestionFromBackend(currentCode)
        );

        const results = await Promise.allSettled(requests);

        const validSuggestions = results
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value)
          .filter((item) => item.insertText && item.insertText.trim() !== '');

        if (validSuggestions.length > 0) {
          setSuggestionQueue(validSuggestions);
          setAiSuggestions(validSuggestions.slice(0, 3));
        } else {
          setSuggestionQueue([]);
          setAiSuggestions([]);
        }
      } catch (err) {
        console.error('Failed to preload AI suggestions', err);
        setSuggestionQueue([]);
        setAiSuggestions([]);
      } finally {
        setIsFetchingSuggestions(false);
      }
    },
    [fetchSuggestionFromBackend, isFetchingSuggestions]
  );

  /**
   * Registers the AI completion item provider for Monaco.
   */
  const registerCompletionProvider = useCallback(
    (monaco, lang) => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
        completionProviderRef.current = null;
      }

      const suggestions =
        AI_SUGGESTIONS_BY_PROBLEM[problem.id] || DEFAULT_AI_SUGGESTIONS;

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

  /**
   * When the page first loads or language changes, preload suggestions.
   */
  useEffect(() => {
    const initialCode = problem.starterCode[language] || '';
    preloadSuggestions(initialCode, 3);
  }, [preloadSuggestions, problem, language]);

  /**
   * Cleanup effect.
   */
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (completionProviderRef.current) completionProviderRef.current.dispose();
    };
  }, []);

  /**
   * Initialize Pyodide.
   */
  useEffect(() => {
    const initPyodide = async () => {
      try {
        setPyodideLoading(true);

        if (window.loadPyodide) {
          const pyodideInstance = await window.loadPyodide();
          setPyodide(pyodideInstance);
          setPyodideLoading(false);
          return;
        }

        const existingScript = document.querySelector('script[src*="pyodide.js"]');
        if (existingScript) {
          existingScript.onload = async () => {
            const pyodideInstance = await window.loadPyodide();
            setPyodide(pyodideInstance);
            setPyodideLoading(false);
          };
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/pyodide@0.26.4/pyodide.js';
        script.async = true;

        script.onload = async () => {
          try {
            const pyodideInstance = await window.loadPyodide({
              indexURL: 'https://unpkg.com/pyodide@0.26.4/',
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

  /**
   * Handles Monaco editor mount.
   */
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
          // Uncomment if you want to block paste:
          // e.preventDefault();
          // e.stopPropagation();
        }
      });

      editor.onDidChangeModelContent(() => {
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }

        idleTimerRef.current = setTimeout(() => {
          if (!editor.hasTextFocus()) return;

          (async () => {
            try {
              const currentCode = editor.getValue();

              if (suggestionQueue.length > 0) {
                setAiSuggestions(suggestionQueue.slice(0, 3));

                const remaining = suggestionQueue.slice(1);
                setSuggestionQueue(remaining);

                if (remaining.length < 2) {
                  preloadSuggestions(currentCode, 3);
                }
              } else {
                await preloadSuggestions(currentCode, 3);
              }

              editor.trigger('ai-idle', 'editor.action.triggerSuggest', {});
            } catch (err) {
              console.error('Failed to update AI suggestions', err);
              setAiSuggestions([]);
            }
          })();
        }, 2000);
      });

      registerCompletionProvider(monaco, LANGUAGE_MAP[language]);
    },
    [language, preloadSuggestions, registerCompletionProvider, suggestionQueue]
  );

  /**
   * Handles switching languages.
   */
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const nextCode = problem.starterCode[newLang] || '';
    setCode(nextCode);

    if (monacoRef.current) {
      registerCompletionProvider(monacoRef.current, LANGUAGE_MAP[newLang]);
    }

    preloadSuggestions(nextCode, 3);
  };

  /**
   * Inserts a clicked suggestion into the editor and logs it.
   */
  const handleSuggestionClick = (suggestion) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const position = editor.getPosition();

    editor.executeEdits('ai-suggestion', [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        text: suggestion.insertText,
      },
    ]);

    setSuggestionLog((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        action: 'accepted',
        label: suggestion.label,
      },
    ]);

    const remainingSuggestions = aiSuggestions.filter(
      (item) =>
        !(
          item.label === suggestion.label &&
          item.insertText === suggestion.insertText
        )
    );

    setAiSuggestions(remainingSuggestions);

    if (remainingSuggestions.length < 2) {
      preloadSuggestions(editor.getValue(), 3);
    }

    editor.focus();
  };

  /**
   * Runs the code.
   */
  const handleRunCode = async () => {
    if (!pyodide) {
      setOutput('Error: Python runtime not loaded yet. Please wait...\n');
      return;
    }

    if (language !== 'python') {
      setIsRunning(true);
      setActiveTab('output');
      setOutput('Running code...\n');
      setTestResults([]);

      setTimeout(() => {
        setOutput(`$ Running ${language} code...\n\nExecution complete.\n`);
        setIsRunning(false);
      }, 1500);
      return;
    }

    setIsRunning(true);
    setActiveTab('output');
    setOutput('');
    setTestResults([]);

    try {
      const fullCode = `
import sys
from io import StringIO

sys.stdout = StringIO()
sys.stderr = StringIO()

${code}

_stdout = sys.stdout.getvalue()
_stderr = sys.stderr.getvalue()
`;

      await pyodide.runPythonAsync(fullCode);

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

  /**
   * Runs the code against test cases.
   */
 const handleRunAndTest = async () => {
  if (!pyodide) {
    setOutput('Error: Python runtime not loaded yet.\n');
    return;
  }

  if (language !== 'python') {
    setActiveTab('output');
    setOutput('Run & Test currently supports Python only.\n');
    setTestResults([]);
    return;
  }

  setIsRunning(true);
  setActiveTab('output');
  setOutput('');
  setTestResults([]);

  try {
    const testCases =
      problem.examples && problem.examples.length > 0
        ? problem.examples.map((ex) => ({
            input: ex.input,
            expected: ex.output,
          }))
        : [
            { input: 's = "()"', expected: 'true' },
            { input: 's = "()[]{}"', expected: 'true' },
            { input: 's = "(]"', expected: 'false' },
          ];

    const results = [];

    for (const test of testCases) {
      let actualInput = String(test.input).trim();

      if (actualInput.includes('=')) {
        actualInput = actualInput.split('=').slice(1).join('=').trim();
      }

      if (
        (actualInput.startsWith('"') && actualInput.endsWith('"')) ||
        (actualInput.startsWith("'") && actualInput.endsWith("'"))
      ) {
        actualInput = actualInput.slice(1, -1);
      }

      const fullCode = `
${code}

result = is_valid(${JSON.stringify(actualInput)})
print(str(result).lower())
`;

      await pyodide.runPythonAsync(fullCode);

      const actual = pyodide.globals.get('result');
      const cleanedActual = String(actual).toLowerCase().trim();
      const cleanedExpected = String(test.expected).toLowerCase().trim();

      results.push({
        input: test.input,
        expected: cleanedExpected,
        actual: cleanedActual,
        passed: cleanedActual === cleanedExpected,
      });
    }

    setTestResults(results);

    const allPassed = results.length > 0 && results.every((t) => t.passed);
    setOutput(
      allPassed
        ? '🎉 All tests passed!\n'
        : 'Tests completed. Some tests failed.\n'
    );
  } catch (err) {
    setOutput(`Error running tests:\n${err.message}\n`);
  } finally {
    setIsRunning(false);
  }
};

  /**
   * Handles submission.
   */
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
                onClick={handleRunAndTest}
                disabled={isRunning || pyodideLoading}
              >
                🚀 Run & Test
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
                <div>
                  <pre className="output-text">
                    {output || 'Click "Run Code" to see output here.'}
                  </pre>

                  <h3>Test Results</h3>

                  {testResults.length === 0 ? (
                    <p>No test results yet.</p>
                  ) : (
                    testResults.map((t, i) => (
                      <div key={i} style={{ marginBottom: '10px' }}>
                        <p>
                          <strong>Input:</strong> {t.input}
                        </p>
                        <p>
                          <strong>Expected:</strong> {t.expected}
                        </p>
                        <p>
                          <strong>Actual:</strong> {t.actual}
                        </p>
                        <p>{t.passed ? '✅ Pass' : '❌ Fail'}</p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="suggestion-log">
                  {suggestionLog.length === 0 ? (
                    <p className="log-empty">
                      No suggestions accepted yet. Click a suggestion from the
                      panel on the right, or start typing and pause for 2 seconds
                      to see autocomplete suggestions.
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

        <div className="suggestions-panel">
          <div className="panel-header">
            <span className="panel-title">AI Suggestions</span>
          </div>
          <div className="suggestions-list">
            {aiSuggestions.length === 0 ? (
              <p className="log-empty">
                {isFetchingSuggestions
                  ? 'Loading AI suggestions...'
                  : 'Pause typing for 2 seconds to fetch AI suggestions.'}
              </p>
            ) : (
              aiSuggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-card"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="suggestion-header">
                    <span className="suggestion-number">{index + 1}</span>
                    <span className="suggestion-label">{suggestion.label}</span>
                  </div>
                  <pre className="suggestion-code">{suggestion.insertText}</pre>
                  {suggestion.explanation && (
                    <div className="suggestion-explanation">
                      <div className="suggestion-explanation-title">
                        Why this suggestion
                      </div>
                      <p className="suggestion-explanation-body">
                        {suggestion.explanation}
                      </p>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemPage;