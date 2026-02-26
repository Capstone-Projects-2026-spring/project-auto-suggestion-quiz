import React, { useState } from 'react';
import { AVAILABLE_LANGUAGES, DEFAULT_BOILERPLATE, DEFAULT_SUGGESTIONS } from '../constants';

function CreateProblemPage({ onBack }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState(
    AVAILABLE_LANGUAGES.map(({ key }) => key)
  );
  const [boilerplateCode, setBoilerplateCode] = useState({ ...DEFAULT_BOILERPLATE });

  const [distractorMode, setDistractorMode] = useState('ai');
  const [numDistractors, setNumDistractors] = useState(4);
  const [maxGenerations, setMaxGenerations] = useState('');
  const [prewrittenSuggestions, setPrewrittenSuggestions] = useState(
    JSON.parse(JSON.stringify(DEFAULT_SUGGESTIONS))
  );

  const [maxAttempts, setMaxAttempts] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');

  const [allowCopyPaste, setAllowCopyPaste] = useState(true);
  const [trackTabSwitching, setTrackTabSwitching] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: null }));

  const toggleLanguage = (key) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((l) => l !== key);
      }
      return [...prev, key];
    });
    clearError('selectedLanguages');
  };

  const updateBoilerplate = (lang, code) => {
    setBoilerplateCode((prev) => ({ ...prev, [lang]: code }));
  };

  const updateCorrectSuggestion = (lang, value) => {
    setPrewrittenSuggestions((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], correct: value },
    }));
  };

  const updateDistractor = (lang, index, value) => {
    setPrewrittenSuggestions((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        distractors: prev[lang].distractors.map((d, i) => (i === index ? value : d)),
      },
    }));
  };

  const addDistractor = (lang) => {
    setPrewrittenSuggestions((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], distractors: [...prev[lang].distractors, ''] },
    }));
  };

  const removeDistractor = (lang, index) => {
    setPrewrittenSuggestions((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        distractors: prev[lang].distractors.filter((_, i) => i !== index),
      },
    }));
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!description.trim()) errs.description = 'Description is required.';
    if (selectedLanguages.length === 0)
      errs.selectedLanguages = 'At least one language must be selected.';

    if (distractorMode === 'ai') {
      if (!numDistractors || Number(numDistractors) < 1)
        errs.numDistractors = 'At least 1 distractor is required.';
    } else {
      const prewrittenErrs = {};
      selectedLanguages.forEach((lang) => {
        const { correct, distractors } = prewrittenSuggestions[lang];
        const langErrors = [];
        if (!correct.trim()) langErrors.push('Correct suggestion is required.');
        if (distractors.every((d) => !d.trim()))
          langErrors.push('At least one distractor is required.');
        if (langErrors.length > 0) prewrittenErrs[lang] = langErrors.join(' ');
      });
      if (Object.keys(prewrittenErrs).length > 0) errs.prewritten = prewrittenErrs;
    }

    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const starterCode = {};
    selectedLanguages.forEach((lang) => {
      starterCode[lang] = boilerplateCode[lang];
    });

    const problemData = {
      title: title.trim(),
      description: description.trim(),
      languages: selectedLanguages,
      starterCode,
      distractorMode,
      ...(distractorMode === 'ai'
        ? {
            numDistractors: Number(numDistractors),
            maxGenerations: maxGenerations !== '' ? Number(maxGenerations) : null,
          }
        : {
            suggestions: Object.fromEntries(
              selectedLanguages.map((lang) => [
                lang,
                {
                  correct: prewrittenSuggestions[lang].correct,
                  distractors: prewrittenSuggestions[lang].distractors.filter((d) => d.trim()),
                },
              ])
            ),
          }),
      maxAttempts: maxAttempts !== '' ? Number(maxAttempts) : null,
      timeLimitMinutes: timeLimitMinutes !== '' ? Number(timeLimitMinutes) : null,
      allowCopyPaste,
      trackTabSwitching,
    };
    console.log('Creating problem:', problemData);
    setSubmitted(true);
    setTimeout(() => onBack(), 1500);
  };

  const activeLanguages = AVAILABLE_LANGUAGES.filter(({ key }) => selectedLanguages.includes(key));

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="logo">AutoSuggestion Quiz</h1>
        </div>
        <div className="header-right">
          <button className="btn-back" onClick={onBack}>
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="create-problem-page">
        <div className="create-problem-container">
          <div className="create-problem-header">
            <h2 className="create-problem-title">Create New Problem</h2>
            <p className="create-problem-subtitle">
              Configure a coding problem for your students
            </p>
          </div>

          {submitted ? (
            <div className="submit-success">
              <span className="submit-success-icon">✓</span>
              <span>Problem created successfully! Returning to dashboard...</span>
            </div>
          ) : (
            <form className="create-problem-form" onSubmit={handleSubmit}>

              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-title">Problem Details</span>
                  <span className="form-section-badge badge-required">Required</span>
                </div>

                <div className="form-field">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className={`form-input${errors.title ? ' form-input-error' : ''}`}
                    placeholder="e.g. Two Sum, Reverse a Linked List..."
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); clearError('title'); }}
                  />
                  {errors.title && <span className="form-error">{errors.title}</span>}
                </div>

                <div className="form-field">
                  <label className="form-label">Description</label>
                  <textarea
                    className={`form-input form-textarea${errors.description ? ' form-input-error' : ''}`}
                    placeholder="Describe the problem statement, constraints, and expected behavior..."
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); clearError('description'); }}
                    rows={5}
                  />
                  {errors.description && (
                    <span className="form-error">{errors.description}</span>
                  )}
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-title">Languages &amp; Boilerplate</span>
                  <span className="form-section-badge badge-required">Required</span>
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
                  {errors.selectedLanguages && (
                    <span className="form-error">{errors.selectedLanguages}</span>
                  )}
                  <span className="form-hint">
                    Select which languages students can use. At least one required.
                  </span>
                </div>

                {activeLanguages.map(({ key, label }) => (
                  <div key={key} className="form-field">
                    <label className="form-label">{label} Boilerplate</label>
                    <textarea
                      className="form-input form-textarea code-textarea"
                      value={boilerplateCode[key]}
                      onChange={(e) => updateBoilerplate(key, e.target.value)}
                      rows={6}
                      spellCheck={false}
                    />
                    <span className="form-hint">
                      Starter code shown to students when they select {label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-title">Code Suggestions</span>
                </div>

                <div className="form-field">
                  <label className="form-label">Suggestion Source</label>
                  <div className="distractor-mode-selector">
                    <button
                      type="button"
                      className={`distractor-mode-btn${distractorMode === 'ai' ? ' distractor-mode-active' : ''}`}
                      onClick={() => setDistractorMode('ai')}
                    >
                      AI Generated
                    </button>
                    <button
                      type="button"
                      className={`distractor-mode-btn${distractorMode === 'prewritten' ? ' distractor-mode-active' : ''}`}
                      onClick={() => setDistractorMode('prewritten')}
                    >
                      Pre-written
                    </button>
                  </div>
                  <span className="form-hint">
                    {distractorMode === 'ai'
                      ? 'The AI generates code completion suggestions and distractors at quiz time.'
                      : 'You write the correct completion and incorrect distractors for each language.'}
                  </span>
                </div>

                {distractorMode === 'ai' ? (
                  <div className="form-row">
                    <div className="form-field form-field-half">
                      <label className="form-label">
                        Number of Distractors
                        <span className="field-required"> *</span>
                      </label>
                      <input
                        type="number"
                        className={`form-input${errors.numDistractors ? ' form-input-error' : ''}`}
                        value={numDistractors}
                        min={1}
                        max={10}
                        onChange={(e) => { setNumDistractors(e.target.value); clearError('numDistractors'); }}
                      />
                      <span className="form-hint">Incorrect options shown alongside the correct answer</span>
                      {errors.numDistractors && (
                        <span className="form-error">{errors.numDistractors}</span>
                      )}
                    </div>

                    <div className="form-field form-field-half">
                      <label className="form-label">Max Regenerations</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Unlimited"
                        value={maxGenerations}
                        min={1}
                        onChange={(e) => setMaxGenerations(e.target.value)}
                      />
                      <span className="form-hint">How many times students can regenerate AI suggestions</span>
                    </div>
                  </div>
                ) : (
                  <div className="prewritten-suggestions">
                    {activeLanguages.map(({ key, label }) => (
                      <div key={key} className="prewritten-lang-block">
                        <div className="prewritten-lang-header">
                          <span className="prewritten-lang-name">{label}</span>
                        </div>

                        <div className="form-field">
                          <label className="form-label">Correct Suggestion</label>
                          <textarea
                            className={`form-input form-textarea code-textarea${
                              errors.prewritten?.[key] ? ' form-input-error' : ''
                            }`}
                            value={prewrittenSuggestions[key].correct}
                            onChange={(e) => updateCorrectSuggestion(key, e.target.value)}
                            rows={3}
                            spellCheck={false}
                            placeholder={`// The correct code completion for ${label}`}
                          />
                          {errors.prewritten?.[key] && (
                            <span className="form-error">{errors.prewritten[key]}</span>
                          )}
                          <span className="form-hint">The completion students should identify as correct</span>
                        </div>

                        <div className="form-field">
                          <label className="form-label">Distractors</label>
                          <div className="distractor-list">
                            {prewrittenSuggestions[key].distractors.map((distractor, idx) => (
                              <div key={idx} className="distractor-entry">
                                <textarea
                                  className="form-input form-textarea code-textarea"
                                  value={distractor}
                                  onChange={(e) => updateDistractor(key, idx, e.target.value)}
                                  rows={2}
                                  spellCheck={false}
                                  placeholder={`// Incorrect option ${idx + 1}`}
                                />
                                {prewrittenSuggestions[key].distractors.length > 1 && (
                                  <button
                                    type="button"
                                    className="btn-remove-distractor"
                                    onClick={() => removeDistractor(key, idx)}
                                    aria-label="Remove distractor"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="btn-add-distractor"
                            onClick={() => addDistractor(key)}
                          >
                            + Add Distractor
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-title">Quiz Settings</span>
                  <span className="form-section-badge badge-optional">Optional</span>
                </div>

                <div className="form-row">
                  <div className="form-field form-field-half">
                    <label className="form-label">Max Code Attempts</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Unlimited"
                      value={maxAttempts}
                      min={1}
                      onChange={(e) => setMaxAttempts(e.target.value)}
                    />
                    <span className="form-hint">Leave blank for unlimited attempts</span>
                  </div>

                  <div className="form-field form-field-half">
                    <label className="form-label">Time Limit</label>
                    <div className="time-limit-wrapper">
                      <input
                        type="number"
                        className="form-input"
                        placeholder="None"
                        value={timeLimitMinutes}
                        min={1}
                        onChange={(e) => setTimeLimitMinutes(e.target.value)}
                      />
                      <span className="time-limit-unit">minutes</span>
                    </div>
                    <span className="form-hint">Leave blank for no time limit</span>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-title">Student Behavior Settings</span>
                  <span className="form-section-badge badge-optional">Optional</span>
                </div>

                <div className="toggle-field">
                  <div className="toggle-field-info">
                    <span className="toggle-field-label">Allow Copy &amp; Paste</span>
                    <span className="toggle-field-desc">
                      {allowCopyPaste
                        ? 'Students can freely copy and paste code.'
                        : 'Copy & paste is disabled. Paste attempts will be tracked and recorded.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`toggle-switch${allowCopyPaste ? ' toggle-on' : ' toggle-off'}`}
                    onClick={() => setAllowCopyPaste((v) => !v)}
                    aria-label="Toggle copy and paste"
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>

                <div className="toggle-field">
                  <div className="toggle-field-info">
                    <span className="toggle-field-label">Track Tab / Window Switching</span>
                    <span className="toggle-field-desc">
                      {trackTabSwitching
                        ? 'Tab and window focus changes will be logged during the problem.'
                        : 'Tab switching will not be monitored.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`toggle-switch${trackTabSwitching ? ' toggle-on' : ' toggle-off'}`}
                    onClick={() => setTrackTabSwitching((v) => !v)}
                    aria-label="Toggle tab switching tracking"
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={onBack}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-run">
                  Create Problem
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateProblemPage;
