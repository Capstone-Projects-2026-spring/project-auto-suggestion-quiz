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
 * @property {Object.<string, string>} starterCode - Map of language key to starter code string (e.g. `{ python: '...', javascript: '...' }`).
 * @property {Example[]} examples - List of input/output examples shown in the problem panel.
 */

/**
 * @typedef {Object} SuggestionLogEntry
 * @property {string} time - Locale time string of when the suggestion was accepted.
 * @property {'accepted'} action - The action taken on the suggestion.
 * @property {string} label - The label of the accepted suggestion.
 */

/**
 * A full-page coding environment that presents a problem description alongside
 * a Monaco editor. Features include:
 * - Per-problem AI autocompletion suggestions that trigger after 2 seconds of idle typing.
 * - In-browser Python execution via Pyodide.
 * - Mock execution for non-Python languages.
 * - A suggestion log that records every accepted AI suggestion.
 *
 * @component
 * @param {Object} props
 * @param {Problem} props.problem - The problem data to display and solve.
 * @param {function(): void} props.onBack - Callback invoked when the user navigates back or submits.
 * @returns {React.ReactElement} The rendered problem page.
 *
 * @example
 * <ProblemPage problem={selectedProblem} onBack={() => setPage('home')} />
 */
function ProblemPage({ problem, onBack }) {
  /** @type {[string, function(string): void]} Currently selected language key (e.g. `'python'`). */
  const [language, setLanguage] = useState('python');

  /** @type {[string, function(string): void]} Current contents of the code editor. */
  const [code, setCode] = useState(problem.starterCode.python);

  /** @type {[string, function(string): void]} Output text displayed in the output tab. */
  const [output, setOutput] = useState('');

  /** @type {[boolean, function(boolean): void]} Whether code is currently being executed. */
  const [isRunning, setIsRunning] = useState(false);

  /** @type {['output'|'log', function(string): void]} Which bottom panel tab is active. */
  const [activeTab, setActiveTab] = useState('output');

  /** @type {[SuggestionLogEntry[], function(SuggestionLogEntry[]): void]} Log of accepted AI suggestions. */
  const [suggestionLog, setSuggestionLog] = useState([]);

  /** @type {React.MutableRefObject<import('monaco-editor').editor.IStandaloneCodeEditor|null>} Reference to the Monaco editor instance. */
  const editorRef = useRef(null);

  /** @type {React.MutableRefObject<typeof import('monaco-editor')|null>} Reference to the Monaco namespace. */
  const monacoRef = useRef(null);

  /** @type {React.MutableRefObject<ReturnType<typeof setTimeout>|null>} Timer ref for the idle-trigger debounce. */
  const idleTimerRef = useRef(null);

  /** @type {React.MutableRefObject<{dispose: function(): void}|null>} Disposable returned by `registerCompletionItemProvider`. */
  const completionProviderRef = useRef(null);

  /** @type {[Object|null, function(Object|null): void]} The loaded Pyodide instance, or null if not yet ready. */
  const [pyodide, setPyodide] = useState(null);

  /** @type {[boolean, function(boolean): void]} Whether Pyodide is still initializing. */
  const [pyodideLoading, setPyodideLoading] = useState(true);

  /**
   * Registers (or re-registers) the AI completion item provider for the given language.
   * Disposes of any previously registered provider before creating a new one.
   * Suggestions are sourced from {@link AI_SUGGESTIONS_BY_PROBLEM} keyed by problem ID,
   * falling back to {@link DEFAULT_SUGGESTIONS}.
   *
   * @function
   * @param {typeof import('monaco-editor')} monaco - The Monaco namespace.
   * @param {string} lang - The Monaco language identifier (e.g. `'python'`, `'javascript'`).
   * @returns {void}
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

          /**
           * Provides AI completion items at the current cursor position.
           *
           * @param {import('monaco-editor').editor.ITextModel} model - The current text model.
           * @param {import('monaco-editor').Position} position - The current cursor position.
           * @returns {{ suggestions: import('monaco-editor').languages.CompletionItem[] }}
           */
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
   * Callback fired when the Monaco editor finishes mounting.
   * Attaches the AI suggestion acceptance action, an optional paste interceptor,
   * an idle-trigger for autocomplete, and registers the initial completion provider.
   *
   * @function
   * @param {import('monaco-editor').editor.IStandaloneCodeEditor} editor - The mounted editor instance.
   * @param {typeof import('monaco-editor')} monaco - The Monaco namespace.
   * @returns {void}
   */
  const handleEditorDidMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      editor.addCommand(0, () => {}, '');

      /**
       * Editor action that records an accepted AI suggestion to the suggestion log.
       * Triggered via the `'ai-suggestion-accepted'` command attached to each completion item.
       */
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

      /**
       * After each content change, reset the idle timer.
       * When the editor has been idle for 2 seconds and still has focus,
       * the suggestion dropdown is triggered programmatically.
       */
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

  /**
   * Cleanup effect: clears the idle timer and disposes the completion provider
   * when the component unmounts to prevent memory leaks.
   */
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (completionProviderRef.current) completionProviderRef.current.dispose();
    };
  }, []);

  /**
   * Initialization effect: dynamically loads the Pyodide script and initializes
   * the Python runtime on mount. Handles three scenarios:
   * 1. `window.loadPyodide` is already available (e.g. cached).
   * 2. The script tag is already in the DOM but still loading.
   * 3. The script needs to be injected fresh into `document.head`.
   *
   * On failure, sets an error message in the output panel.
   *
   * @see {@link https://pyodide.org/en/stable/}
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

  /**
   * Handles switching the active editor language.
   * Updates the language state, swaps the editor content to the appropriate
   * starter code, and re-registers the completion provider for the new language.
   *
   * @function
   * @param {string} newLang - The language key to switch to (must be a key of {@link LANGUAGE_MAP}).
   * @returns {void}
   */
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(problem.starterCode[newLang] || '');

    if (monacoRef.current) {
      registerCompletionProvider(monacoRef.current, LANGUAGE_MAP[newLang]);
    }
  };

  /**
   * Executes the current editor code.
   * - For Python: runs code in-browser via Pyodide, capturing stdout and stderr.
   *   The code is wrapped in a StringIO redirect so `print()` output is captured.
   * - For other languages: simulates execution with a short timeout and a mock result.
   *
   * @async
   * @function
   * @returns {Promise<void>}
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
   * Handles solution submission.
   * Displays a submission confirmation message in the output panel,
   * then redirects to the dashboard via `onBack` after a short delay.
   *
   * @function
   * @returns {void}
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
                onClick={handleRunCode}
                disabled={isRunning || (language === 'python' && pyodideLoading)}
              >
                {isRunning
                  ? '⏳ Running...'
                  : language === 'python' && pyodideLoading
                  ? '⏳ Loading Python...'
                  : '▶ Run Code'}
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