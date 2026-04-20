import React, { useState } from 'react';
import { AVAILABLE_LANGUAGES } from '../constants';
import { createProblem } from '../api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';


const STEPS = ['Details', 'Languages', 'Sections', 'Test Cases','Settings'];


/**
 * Creates a blank suggestion object.
 * @returns {{ id: number, type: 'ai'|'manual', content: string, isCorrect: boolean }}
 */
const makeSuggestion = () => ({
  id: Date.now() + Math.random(),
  type: 'ai',
  content: '',
  isCorrect: true,
});

/**
 * Creates a blank section object.
 * @returns {{ id: number, label: string, code: string, suggestions: Object[] }}
 */
const makeSection = () => ({
  id: Date.now() + Math.random(),
  label: '',
  code: '',
  suggestions: [makeSuggestion()],
});


function StepDetails({ title, setTitle, description, setDescription, errors }) {
  return (
    <div className="cp-step">
      <div className="cp-step-intro">
        <h3 className="cp-step-title">Problem Details</h3>
        <p className="cp-step-subtitle">Give your problem a title and a clear description for students.</p>
      </div>

      <div className="form-field">
        <label className="form-label">Title</label>
        <input
          type="text"
          className={`form-input${errors.title ? ' form-input-error' : ''}`}
          placeholder="e.g. Two Sum, Reverse a String..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />
        {errors.title && <span className="form-error">{errors.title}</span>}
      </div>

      <div className="form-field">
        <label className="form-label">Description</label>
        <textarea
          className={`form-input form-textarea${errors.description ? ' form-input-error' : ''}`}
          placeholder="Describe the problem, constraints, and what the student needs to solve..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={6}
        />
        {errors.description && <span className="form-error">{errors.description}</span>}
      </div>
    </div>
  );
}

function StepLanguages({ selectedLanguages, toggleLanguage, errors }) {
  return (
    <div className="cp-step">
      <div className="cp-step-intro">
        <h3 className="cp-step-title">Languages</h3>
        <p className="cp-step-subtitle">Select which languages students can use to solve this problem.</p>
      </div>

      <div className="form-field">
        <label className="form-label">Allowed Languages</label>
        <div className="language-checkboxes">
          {AVAILABLE_LANGUAGES.map(({ key, label }) => (
            <label
              key={key}
              className={`lang-checkbox-item${selectedLanguages.includes(key) ? ' lang-checkbox-active' : ''}`}
            >
              <input
                type="checkbox"
                className="lang-checkbox-input"
                checked={selectedLanguages.includes(key)}
                onChange={() => toggleLanguage(key)}
              />
              {label}
            </label>
          ))}
        </div>
        {errors.languages && <span className="form-error">{errors.languages}</span>}
        <span className="form-hint">At least one language is required.</span>
      </div>
    </div>
  );
}
function SuggestionRow({ suggestion, onChange, onRemove, canRemove }) {
  return (
    <div className="cp-suggestion-row">
      <div className="cp-suggestion-controls">
        <div className="cp-suggestion-type-toggle">
          <button
            type="button"
            className={`cp-type-btn${suggestion.type === 'ai' ? ' active' : ''}`}
            onClick={() => onChange({ ...suggestion, type: 'ai', content: '' })}
          >
            AI
          </button>
          <button
            type="button"
            className={`cp-type-btn${suggestion.type === 'manual' ? ' active' : ''}`}
            onClick={() => onChange({ ...suggestion, type: 'manual' })}
          >
            Manual
          </button>
        </div>

        <div className="cp-suggestion-correctness">
          <button
            type="button"
            className={`cp-correct-btn${suggestion.isCorrect ? ' correct' : ' distractor'}`}
            onClick={() => onChange({ ...suggestion, isCorrect: !suggestion.isCorrect })}
          >
            {suggestion.isCorrect ? '✓ Correct' : '✗ Distractor'}
          </button>
        </div>

        {canRemove && (
          <button type="button" className="cp-remove-btn" onClick={onRemove} title="Remove suggestion">
            ×
          </button>
        )}
      </div>

      {suggestion.type === 'manual' ? (
        <textarea
          className="form-input form-textarea code-textarea cp-suggestion-code"
          placeholder="Write the code suggestion here..."
          value={suggestion.content}
          onChange={e => onChange({ ...suggestion, content: e.target.value })}
          rows={3}
          spellCheck={false}
        />
      ) : (
        <div className="cp-ai-note">
          The AI will generate this suggestion at runtime using this section's label and code as context.
        </div>
      )}
    </div>
  );
}

function SectionCard({ section, index, onChange, onRemove, canRemove, selectedLanguages }) {
  const [activeLanguage, setActiveLanguage] = useState(selectedLanguages[0] || 'python');

  const updateSuggestion = (suggId, updated) => {
    onChange({
      ...section,
      suggestions: section.suggestions.map(s => s.id === suggId ? updated : s),
    });
  };

  const removeSuggestion = (suggId) => {
    onChange({
      ...section,
      suggestions: section.suggestions.filter(s => s.id !== suggId),
    });
  };

  const addSuggestion = () => {
    onChange({
      ...section,
      suggestions: [...section.suggestions, makeSuggestion()],
    });
  };

  const updateCode = (lang, value) => {
    onChange({
      ...section,
      code: { ...section.code, [lang]: value },
    });
  };

  return (
    <div className="cp-section-card">
      <div className="cp-section-header">
        <div className="cp-section-number">{index + 1}</div>
        <input
          type="text"
          className="cp-section-label-input"
          placeholder="Section label (e.g. Initialize data structure)"
          value={section.label}
          onChange={e => onChange({ ...section, label: e.target.value })}
        />
        {canRemove && (
          <button type="button" className="cp-remove-section-btn" onClick={onRemove} title="Remove section">
            ×
          </button>
        )}
      </div>

      <div className="cp-section-body">
        <div className="cp-code-area">
          <div className="cp-lang-tabs">
            {selectedLanguages.map(lang => (
              <button
                key={lang}
                type="button"
                className={`cp-lang-tab${activeLanguage === lang ? ' active' : ''}`}
                onClick={() => setActiveLanguage(lang)}
              >
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            ))}
          </div>
          <textarea
            className="form-input form-textarea code-textarea cp-code-block"
            placeholder={`Write the code for this section in ${activeLanguage}...`}
            value={(section.code && section.code[activeLanguage]) || ''}
            onChange={e => updateCode(activeLanguage, e.target.value)}
            rows={6}
            spellCheck={false}
          />
          <span className="form-hint">
            Use comments to describe what students should write in this section. The AI uses them to generate better suggestions.
          </span>
        </div>

        <div className="cp-suggestions-area">
          <div className="cp-suggestions-label">Suggestions for this section</div>
          {section.suggestions.map(s => (
            <SuggestionRow
              key={s.id}
              suggestion={s}
              onChange={updated => updateSuggestion(s.id, updated)}
              onRemove={() => removeSuggestion(s.id)}
              canRemove={section.suggestions.length > 1}
            />
          ))}
          <button type="button" className="btn-add-distractor" onClick={addSuggestion}>
            + Add Suggestion
          </button>
        </div>
      </div>
    </div>
  );
}


function StepSections({ sections, setSections, selectedLanguages, boilerplate, errors }) {
  const addSection = () => {
    const newSection = makeSection();
    // Initialise code map for each selected language
    newSection.code = Object.fromEntries(selectedLanguages.map(l => [l, '']));
    setSections(prev => [...prev, newSection]);
  };

  const updateSection = (id, updated) => {
    setSections(prev => prev.map(s => s.id === id ? updated : s));
  };

  const removeSection = (id) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="cp-step">
      <div className="cp-step-intro">
        <h3 className="cp-step-title">Sections</h3>
        <p className="cp-step-subtitle">
          Break the problem into sections. Each section becomes a block of code the student works through in order.
          Attach suggestions or distractors to each section, either written by you or generated by AI at runtime.
        </p>

      </div>

      {errors.sections && <p className="form-error">{errors.sections}</p>}

      <div className="cp-sections-list">
        {sections.map((section, index) => (
          <SectionCard
            key={section.id}
            section={section}
            index={index}
            onChange={updated => updateSection(section.id, updated)}
            onRemove={() => removeSection(section.id)}
            canRemove={sections.length > 1}
            selectedLanguages={selectedLanguages}
          />
        ))}
      </div>

      <button type="button" className="cp-add-section-btn" onClick={addSection}>
        + Add Section
      </button>

      <div className="cp-compiled-preview">
        <div className="cp-preview-label">Boilerplate Preview (what students will see)</div>
        <pre className="cp-preview-code">
          {selectedLanguages.length > 0
            ? (() => {
                const lang = selectedLanguages[0];
                const bp = boilerplate && boilerplate[lang] ? boilerplate[lang] + '\n' : '';
                const sectionCode = sections.map((s, i) => {
                  const commentChar = lang === 'python' ? '#' : '//';
                  const label = s.label.trim() || `Section ${i + 1}`;
                const header = `${commentChar} ${label}`;
                  const code = (s.code && s.code[lang]) || '';
                  return `${header}\n${code}`;
                }).join('\n');
                return bp + sectionCode;
              })()
            : '- select a language to preview -'
          }
        </pre>
      </div>
    </div>
  );
}


// ─── Step 4: Settings ────────────────────────────────────────────────────────

function StepSettings({
  timeLimitMins, setTimeLimitMins,
  timeLimitSecs, setTimeLimitSecs,
  maxSubmissions, setMaxSubmissions,
  allowCopyPaste, setAllowCopyPaste,
  trackTabSwitching, setTrackTabSwitching,
  errors,
}) {
  return (
    <div className="cp-step">
      <div className="cp-step-intro">
        <h3 className="cp-step-title">Settings</h3>
        <p className="cp-step-subtitle">Configure constraints and monitoring options for this problem.</p>
      </div>

      <div className="form-row">
        <div className="form-field form-field-half">
          <label className="form-label">Time Limit</label>
          <div className="time-limit-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              className="form-input"
              placeholder="0"
              value={timeLimitMins}
              min={0}
              style={{ width: '72px' }}
              onChange={e => setTimeLimitMins(e.target.value)}
            />
            <span className="time-limit-unit">min</span>
            <input
              type="number"
              className="form-input"
              placeholder="0"
              value={timeLimitSecs}
              min={0}
              max={59}
              style={{ width: '72px' }}
              onChange={e => setTimeLimitSecs(e.target.value)}
            />
            <span className="time-limit-unit">sec</span>
          </div>
          <span className="form-hint">Leave blank for no time limit.</span>
        </div>

        <div className="form-field form-field-half">
          <label className="form-label">Max Submissions</label>
          <input
            type="number"
            className={`form-input${errors && errors.maxSubmissions ? ' form-input-error' : ''}`}
            placeholder="Unlimited"
            value={maxSubmissions}
            min={1}
            onChange={e => setMaxSubmissions(e.target.value)}
          />
          {errors && errors.maxSubmissions && <span className="form-error">{errors.maxSubmissions}</span>}
          <span className="form-hint">Leave blank for unlimited submissions.</span>
        </div>
      </div>

      <div className="cp-toggles">
        <div className="toggle-field">
          <div className="toggle-field-info">
            <span className="toggle-field-label">Allow Copy &amp; Paste</span>
            <span className="toggle-field-desc">
              {allowCopyPaste
                ? 'Students can freely copy and paste code.'
                : 'Copy and paste is disabled in the editor.'}
            </span>
          </div>
          <button
            type="button"
            className={`toggle-switch${allowCopyPaste ? ' toggle-on' : ' toggle-off'}`}
            onClick={() => setAllowCopyPaste(v => !v)}
            aria-label="Toggle copy and paste"
          >
            <span className="toggle-thumb" />
          </button>
        </div>

        <div className="toggle-field">
          <div className="toggle-field-info">
            <span className="toggle-field-label">Track Tab Switching</span>
            <span className="toggle-field-desc">
              {trackTabSwitching
                ? 'Tab and window focus changes will be logged during the problem.'
                : 'Tab switching will not be monitored.'}
            </span>
          </div>
          <button
            type="button"
            className={`toggle-switch${trackTabSwitching ? ' toggle-on' : ' toggle-off'}`}
            onClick={() => setTrackTabSwitching(v => !v)}
            aria-label="Toggle tab switching tracking"
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ currentStep }) {
  return (
    <div className="cp-step-indicator">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className={`cp-step-dot ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}>
            <span className="cp-step-dot-num">{i < currentStep ? '✓' : i + 1}</span>
            <span className="cp-step-dot-label">{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`cp-step-line${i < currentStep ? ' done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function StepTestCases({ testCases, setTestCases }) {

  const updateTestCase = (index, field, value) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      { input: '', expected: '', explanation: '' }
    ]);
  };

  const removeTestCase = (index) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  return (
    <div className="cp-step">
      <div className="cp-step-intro">
        <h3 className="cp-step-title">Test Cases</h3>
      </div>

      {testCases.map((tc, index) => (
        <div key={index} className="cp-testcase-row">
          <textarea
            placeholder="Input"
            value={tc.input}
            onChange={(e) => updateTestCase(index, 'input', e.target.value)}
          />

          <textarea
            placeholder="Expected Output"
            value={tc.expected}
            onChange={(e) => updateTestCase(index, 'expected', e.target.value)}
          />

          <textarea
            placeholder="Explanation (optional)"
            value={tc.explanation}
            onChange={(e) => updateTestCase(index, 'explanation', e.target.value)}
          />

          {testCases.length > 1 && (
            <button onClick={() => removeTestCase(index)}>×</button>
          )}
        </div>
      ))}

      <button onClick={addTestCase}>
        + Add Test Case
      </button>
    </div>
  );
}

// ─── Autofill Modal ──────────────────────────────────────────────────────────

function AutofillModal({ onClose, onStartBackgroundGenerate }) {
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = () => {
    if (rawText.trim().length < 30) {
      setError('Please provide more detail before generating.');
      return;
    }
    onStartBackgroundGenerate(rawText);
  };

  return (
    <div className="restore-overlay">
      <div className="restore-dialog" style={{ maxWidth: '560px', width: '90%', textAlign: 'left' }}>
        <h3 style={{ margin: '0 0 0.5rem' }}>Auto-fill from notes</h3>
        <p style={{ color: '#888', fontSize: '13px', margin: '0 0 1rem' }}>
          Paste anything you have about the problem: a description, function signature, example inputs/outputs, or existing code. The more detail you provide, the better the result.
        </p>
        <textarea
          className="form-input form-textarea"
          rows={10}
          placeholder="e.g. Write a function add(x, y) that returns the sum of two numbers. add(1, 2) should return 3."
          value={rawText}
          onChange={e => { setRawText(e.target.value); setError(''); }}
          style={{ fontFamily: 'monospace', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
          autoFocus
        />
        {error && (
          <p style={{ color: '#f44336', fontSize: '13px', margin: '0.5rem 0 0' }}>{error}</p>
        )}
        <div className="restore-actions" style={{ marginTop: '1.25rem' }}>
          <button className="btn btn-run" onClick={handleGenerate}>
            Generate in Background
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function CreateProblemPage({ onBack, onCreated, autofillResult, onAutofillConsumed, onAutofillReady }) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showAutofill, setShowAutofill] = useState(false);
  const autofillAppliedRef = React.useRef(false);
  // Step 1
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Step 2
  const [selectedLanguages, setSelectedLanguages] = useState(
    AVAILABLE_LANGUAGES.map(({ key }) => key)
  );

  // Step 3 — start with one blank section
  const initSection = () => {
    const s = makeSection();
    s.code = Object.fromEntries(AVAILABLE_LANGUAGES.map(({ key }) => [key, '']));
    return s;
  };
  const [sections, setSections] = useState([initSection()]);
  const [boilerplate, setBoilerplate] = useState({});

  // Step 4
  const [testCases, setTestCases] = useState([{ input: '', expected: '', explanation: '' }]);
  
  //Step 5
  const [timeLimitMins, setTimeLimitMins] = useState('');
  const [timeLimitSecs, setTimeLimitSecs] = useState('');
  const [maxSubmissions, setMaxSubmissions] = useState('');
  const [allowCopyPaste, setAllowCopyPaste] = useState(true);
  const [trackTabSwitching, setTrackTabSwitching] = useState(false);

  React.useEffect(() => {
    if (autofillResult && !autofillAppliedRef.current) {
      autofillAppliedRef.current = true;
      applyAutofill(autofillResult);
      if (onAutofillConsumed) onAutofillConsumed();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autofillResult]);

  // ── Autofill handler — maps OpenAI response into all form state ──
  const applyAutofill = (data) => {
    if (data.title) setTitle(data.title);
    if (data.description) setDescription(data.description);

    const langs = Array.isArray(data.languages) && data.languages.length > 0
      ? data.languages
      : ['python'];
    setSelectedLanguages(langs);

    if (data.boilerplate && typeof data.boilerplate === 'object') {
      setBoilerplate(data.boilerplate);
    }

    if (Array.isArray(data.sections) && data.sections.length > 0) {
      const mapped = data.sections
        .sort((a, b) => a.order - b.order)
        .map((s) => {
          const codeMap = typeof s.code === 'object' ? s.code : {};
          // Ensure every selected language has an entry
          langs.forEach(l => { if (!codeMap[l]) codeMap[l] = ''; });

          const suggestions = Array.isArray(s.suggestions) && s.suggestions.length > 0
            ? s.suggestions.map(sg => ({
                id: Date.now() + Math.random(),
                type: sg.type || 'ai',
                content: sg.content || '',
                isCorrect: sg.isCorrect !== undefined ? sg.isCorrect : true,
              }))
            : [makeSuggestion()];

          return {
            id: Date.now() + Math.random(),
            label: s.label || '',
            code: codeMap,
            suggestions,
          };
        });
      setSections(mapped);
    }

    if (Array.isArray(data.testCases) && data.testCases.length > 0) {
      setTestCases(data.testCases.map(tc => ({
        input: tc.input || '',
        expected: tc.expected || '',
        explanation: tc.explanation || '',
      })));
    }

    setShowAutofill(false);
    setStep(0);
  };

  const toggleLanguage = (key) => {    setSelectedLanguages(prev => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter(l => l !== key);
      }
      return [...prev, key];
    });
  };

  // ── Validation ──
  const validate = () => {
    const errs = {};
    if (step === 0) {
      if (!title.trim()) errs.title = 'Title is required.';
      if (!description.trim()) errs.description = 'Description is required.';
    }
    if (step === 1) {
      if (selectedLanguages.length === 0) errs.languages = 'Select at least one language.';
    }
    if (step === 2) {
      const hasEmpty = sections.some(s => !s.label.trim());
      if (hasEmpty) errs.sections = 'Every section needs a label.';
    }
    if (step === 3) {
      if (maxSubmissions !== '' && Number(maxSubmissions) < 1)
        errs.maxSubmissions = 'Must be at least 1.';
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep(s => s - 1);
  };


  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    // Use autofill boilerplate if available, otherwise compile from section code
    const compiledBoilerplate = Object.keys(boilerplate).length > 0
      ? boilerplate
      : Object.fromEntries(
          selectedLanguages.map(lang => [
            lang,
            sections.map(s => (s.code && s.code[lang]) || '').join('\n'),
          ])
        );

    const problemData = {
      title: title.trim(),
      description: description.trim(),
      languages: selectedLanguages,
      boilerplate: compiledBoilerplate,
      sections: sections.map((s, i) => ({
        order: i + 1,
        label: s.label.trim(),
        code: s.code,
        suggestions: s.suggestions.map(sg => ({
          type: sg.type,
          isCorrect: sg.isCorrect,
          content: sg.type === 'manual' ? sg.content : '',
        })),
      })),
      testCases: testCases,
      timeLimitSeconds: (timeLimitMins !== '' || timeLimitSecs !== '')
        ? (Number(timeLimitMins || 0) * 60 + Number(timeLimitSecs || 0)) || null
        : null,
      maxSubmissions: maxSubmissions !== '' ? Number(maxSubmissions) : null,
      allowCopyPaste,
      trackTabSwitching,
    };

    console.log(JSON.stringify(problemData.testCases, null, 2));

    try {
      const result = await createProblem(problemData, localStorage.getItem('teacher_token'));
      setAccessCode(result.access_code);
      setSubmitted(true);
      if (onCreated) onCreated(result);
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  // ── Render ──
  return (
    <div className="app">
      {showAutofill && (
        <AutofillModal
          onClose={() => setShowAutofill(false)}
          onStartBackgroundGenerate={(rawText) => {
            setShowAutofill(false);
            onBack();
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
            fetch(`${apiUrl}/ai/autofill`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ raw_text: rawText }),
            })
              .then(res => res.json())
              .then(data => {
                if (data && !data.error && onAutofillReady) onAutofillReady(data);
              })
              .catch(() => {});
          }}
        />
      )}
      <header className="app-header">
        <div className="header-left">
          <h1 className="logo">AutoSuggestion Quiz</h1>
        </div>
        <div className="header-right">
          <button className="btn-back" onClick={onBack}>← Dashboard</button>
        </div>
      </header>

      <div className="create-problem-page">
        <div className="create-problem-container">
          <div className="create-problem-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 className="create-problem-title" style={{ margin: 0 }}>Create New Problem</h2>
              {!submitted && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '13px' }}
                  onClick={() => setShowAutofill(true)}
                >
                  Auto-fill from notes
                </button>
              )}
            </div>
            <StepIndicator currentStep={step} />
          </div>

          {submitted ? (
            <div className="submit-success">
              <span className="submit-success-icon">✓</span>
              <span>Problem created successfully!</span>
              <div className="access-code-display">
                <p className="access-code-label">Share this code with your students:</p>
                <span className="access-code-value">{accessCode}</span>
              </div>
              <button className="btn btn-outline" onClick={onBack}>Back to Dashboard</button>
            </div>
          ) : (
            <>
              {step === 0 && (
                <StepDetails
                  title={title} setTitle={setTitle}
                  description={description} setDescription={setDescription}
                  errors={errors}
                />
              )}
              {step === 1 && (
                <StepLanguages
                  selectedLanguages={selectedLanguages}
                  toggleLanguage={toggleLanguage}
                  errors={errors}
                />
              )}
              {step === 2 && (
                <StepSections
                  sections={sections}
                  setSections={setSections}
                  selectedLanguages={selectedLanguages}
                  boilerplate={boilerplate}
                  errors={errors}
                />
              )}
              {step === 3 && (
                <StepTestCases
                  testCases={testCases}
                  setTestCases={setTestCases}
                />
              )}
              {step === 4 && (
                <StepSettings
                  timeLimitMins={timeLimitMins} setTimeLimitMins={setTimeLimitMins}
                  timeLimitSecs={timeLimitSecs} setTimeLimitSecs={setTimeLimitSecs}
                  maxSubmissions={maxSubmissions} setMaxSubmissions={setMaxSubmissions}
                  allowCopyPaste={allowCopyPaste} setAllowCopyPaste={setAllowCopyPaste}
                  trackTabSwitching={trackTabSwitching} setTrackTabSwitching={setTrackTabSwitching}
                  errors={errors}
                />
              )}

              {submitError && <p className="form-error">{submitError}</p>}

              <div className="cp-nav-buttons">
                {step > 0 && (
                  <button type="button" className="btn btn-outline" onClick={handleBack}>
                    ← Back
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button type="button" className="btn btn-run" onClick={handleNext}>
                    Next →
                  </button>
                ) : (
                  <button type="button" className="btn btn-run" onClick={handleSubmit}>
                    Create Problem
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateProblemPage;
