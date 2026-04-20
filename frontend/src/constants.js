/**
 * @fileoverview Application-wide constants for the Auto Suggestion Quiz app.
 * @module constants
 */

/**
 * Maps difficulty levels to their display colors.
 * @constant {Object.<string, string>}
 */
export const DIFFICULTY_COLORS = {
  Easy: '#16825d',
  Medium: '#c08b30',
  Hard: '#e05555',
};

/**
 * Display configuration for each problem status.
 * @constant {Object.<string, {label: string, color: string, icon: string}>}
 */
export const STATUS_CONFIG = {
  completed: { label: 'Completed', color: '#16825d', icon: '✓' },
  'in-progress': { label: 'In Progress', color: '#569cd6', icon: '◐' },
  'not-started': { label: 'Not Started', color: '#666', icon: '○' },
};

/**
 * Maps app language keys to Monaco editor language identifiers.
 * @constant {Object.<string, string>}
 */
export const LANGUAGE_MAP = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  c: 'c',
};

export const AVAILABLE_LANGUAGES = [
  { key: 'python', label: 'Python' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'java', label: 'Java' },
  { key: 'c', label: 'C' },
];

export const LANGUAGE_COMMENT_PREFIX = {
  python: '#',
  javascript: '//',
  java: '//',
  c: '//',
};

export const DEFAULT_BOILERPLATE = {
  python: 'def solution():\n    # Write your solution here\n    pass\n',
  javascript: 'function solution() {\n    // Write your solution here\n\n}\n',
  java: 'class Solution {\n    public void solution() {\n        // Write your solution here\n    }\n}\n',
  c: '#include <stdio.h>\n\nvoid solution() {\n    // Write your solution here\n}\n',
};
