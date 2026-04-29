import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProblemPage from '../pages/ProblemPage';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@monaco-editor/react', () => ({ value, onChange }) => (
    <textarea
        data-testid="monaco-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
    />
));

jest.mock('../api', () => ({
    executeCode: jest.fn(),
    startSubmission: jest.fn(),
    saveDraft: jest.fn(),
    submitCode: jest.fn(),
}));

jest.mock('../constants', () => ({
    LANGUAGE_MAP: { python: 'python', javascript: 'javascript' },
    AVAILABLE_LANGUAGES: [
        { key: 'python', label: 'Python' },
        { key: 'javascript', label: 'Javascript' },
    ],
    LANGUAGE_COMMENT_PREFIX: { python: '#', javascript: '//' },
}));

// ─── Test Data ────────────────────────────────────────────────────────────────

const mockProblem = {
    id: 1,
    title: 'Test Problem',
    description: 'Write a function that adds two numbers.',
    language: 'python',
    languages: ['python'],
    sections: [
        { label: 'Solution', code: 'def add(a, b):\n    pass', order_index: 0 },
    ],
    test_cases: [
        { input: 'add(1, 2)', expected: '3' },
    ],
    time_limit_seconds: null,
    allow_copy_paste: true,
    track_tab_switching: false,
};

const mockOnBack = jest.fn();

const defaultProps = {
    problem: mockProblem,
    studentName: 'Alice',
    onBack: mockOnBack,
};

beforeEach(() => {
    jest.clearAllMocks();
    const { startSubmission } = require('../api');
    startSubmission.mockResolvedValue({ session_id: 'sess1', started_at: null, has_draft: false });
});

// ─── Rendering ───────────────────────────────────────────────────────────────

test('renders without crashing', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
});

test('renders problem title', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    expect(screen.getAllByText('Test Problem').length).toBeGreaterThan(0);
});

test('renders problem description', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    expect(screen.getByText('Write a function that adds two numbers.')).toBeInTheDocument();
});

test('renders the code editor', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
});

test('renders back button', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    expect(screen.getByText('← Back')).toBeInTheDocument();
});

test('renders Run Code button', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    expect(screen.getByText('⏳ Loading Python...')).toBeInTheDocument();
});

test('renders Submit button', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    expect(screen.getByText('Submit')).toBeInTheDocument();
});

// ─── Navigation ───────────────────────────────────────────────────────────────

test('calls onBack when back button is clicked', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    fireEvent.click(screen.getByText('← Back'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
});

// ─── Session ─────────────────────────────────────────────────────────────────

test('calls startSubmission with problem id and student name on mount', async () => {
    const { startSubmission } = require('../api');
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    await waitFor(() => expect(startSubmission).toHaveBeenCalledWith(1, 'Alice'));
});

test('Submit button is disabled before session is ready', async () => {
    const { startSubmission } = require('../api');
    startSubmission.mockImplementation(() => new Promise(() => {}));
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    expect(screen.getByText('Submit')).toBeDisabled();
});

test('Submit button is enabled after session starts', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    await waitFor(() => expect(screen.getByText('Submit')).not.toBeDisabled());
});

// ─── Draft Restore ────────────────────────────────────────────────────────────

test('shows restore prompt when draft exists', async () => {
    const { startSubmission } = require('../api');
    startSubmission.mockResolvedValue({
        session_id: 'sess1',
        started_at: null,
        has_draft: true,
        code: 'def add(a, b): return a + b',
    });
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    await waitFor(() => expect(screen.getByText('Resume your work?')).toBeInTheDocument());
});

test('restores draft code when Restore Draft is clicked', async () => {
    const { startSubmission } = require('../api');
    startSubmission.mockResolvedValue({
        session_id: 'sess1',
        started_at: null,
        has_draft: true,
        code: 'def add(a, b): return a + b',
    });
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    await waitFor(() => screen.getByText('Restore Draft'));
    fireEvent.click(screen.getByText('Restore Draft'));
    expect(screen.queryByText('Resume your work?')).not.toBeInTheDocument();
    expect(screen.getByTestId('monaco-editor').value).toBe('def add(a, b): return a + b');
});

test('dismisses restore prompt when Start Fresh is clicked', async () => {
    const { startSubmission } = require('../api');
    startSubmission.mockResolvedValue({
        session_id: 'sess1',
        started_at: null,
        has_draft: true,
        code: 'def add(a, b): return a + b',
    });
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    await waitFor(() => screen.getByText('Start Fresh'));
    fireEvent.click(screen.getByText('Start Fresh'));
    expect(screen.queryByText('Resume your work?')).not.toBeInTheDocument();
});

// ─── Submit Confirm Dialog ────────────────────────────────────────────────────

test('shows confirm dialog when Submit is clicked', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    await waitFor(() => expect(screen.getByText('Submit')).not.toBeDisabled());
    fireEvent.click(screen.getByText('Submit'));
    expect(screen.getByText('Submit your solution?')).toBeInTheDocument();
});

test('closes confirm dialog when Cancel is clicked', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    await waitFor(() => expect(screen.getByText('Submit')).not.toBeDisabled());
    fireEvent.click(screen.getByText('Submit'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Submit your solution?')).not.toBeInTheDocument();
});

test('calls submitCode and then onBack after confirm submit', async () => {
    jest.useFakeTimers();
    const { submitCode } = require('../api');
    submitCode.mockResolvedValue({});

    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    await waitFor(() => expect(screen.getByText('Submit')).not.toBeDisabled());
    fireEvent.click(screen.getByText('Submit'));
    fireEvent.click(screen.getByText('Confirm Submit'));

    await waitFor(() => expect(submitCode).toHaveBeenCalledTimes(1));
    await act(async () => { jest.advanceTimersByTime(2000); });
    expect(mockOnBack).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
});

test('shows error when submitCode fails', async () => {
    const { submitCode } = require('../api');
    submitCode.mockRejectedValue(new Error('Submission failed'));

    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    await waitFor(() => expect(screen.getByText('Submit')).not.toBeDisabled());
    fireEvent.click(screen.getByText('Submit'));
    fireEvent.click(screen.getByText('Confirm Submit'));

    await waitFor(() => expect(screen.getByText('Submission failed')).toBeInTheDocument());
});

// ─── Tabs ─────────────────────────────────────────────────────────────────────

test('renders Output tab by default', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    expect(screen.getByText('Click "Run Code" to see output here.')).toBeInTheDocument();
});

test('switches to Suggestion Log tab', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    fireEvent.click(screen.getByText('Suggestion Log'));
    expect(screen.getByText(/No suggestions accepted yet/)).toBeInTheDocument();
});

test('renders Test Cases tab when test cases exist', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    expect(screen.getByText('Test Cases')).toBeInTheDocument();
});

test('does not render Test Cases tab when no test cases', async () => {
    await act(async () => {
        render(<ProblemPage {...defaultProps} problem={{ ...mockProblem, test_cases: [] }} />);
    });
    expect(screen.queryByText('Test Cases')).not.toBeInTheDocument();
});

// ─── Language Selector ────────────────────────────────────────────────────────

test('renders language selector', async () => {
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    expect(screen.getByRole('combobox')).toBeInTheDocument();
});

test('shows only available languages', async () => {
    await act(async () => {
        render(<ProblemPage {...defaultProps} problem={{ ...mockProblem, languages: ['python'] }} />);
    });
    const select = screen.getByRole('combobox');
    expect(select.options.length).toBe(1);
    expect(select.options[0].text).toBe('Python');
});

// ─── startSubmission Error ───────────────────────────────────────────────────

test('shows error when startSubmission fails', async () => {
    const { startSubmission } = require('../api');
    startSubmission.mockRejectedValue(new Error('Session error'));
    await act(async () => { render(<ProblemPage {...defaultProps} />); });
    await waitFor(() => expect(screen.getByText('Session error')).toBeInTheDocument());
});