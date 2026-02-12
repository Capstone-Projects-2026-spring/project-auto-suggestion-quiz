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

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(problem.starterCode[newLang] || '');

    if (monacoRef.current) {
      registerCompletionProvider(monacoRef.current, LANGUAGE_MAP[newLang]);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveTab('output');
    setOutput('Running code...\n');

    setTimeout(() => {
      if (problem.examples.length > 0) {
        let result = `$ Running ${language} code...\n\n`;
        problem.examples.forEach((ex, i) => {
          result += `> Test Case ${i + 1}: ${ex.input}\n`;
          result += `  Expected: ${ex.output}\n\n`;
        });
        result += 'Execution complete.\n';
        setOutput(result);
      } else {
        setOutput(
          `$ Running ${language} code...\n\nNo test cases available.\n`
        );
      }
      setIsRunning(false);
    }, 1500);
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
                disabled={isRunning}
              >
                {isRunning ? '⏳ Running...' : '▶ Run Code'}
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
