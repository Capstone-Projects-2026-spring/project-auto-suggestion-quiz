import { render, screen, fireEvent, within } from '@testing-library/react';
import ReviewPage from '../pages/ReviewPage';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@monaco-editor/react', () => ({ value }) => (
    <textarea data-testid="monaco-editor" defaultValue={value} readOnly />
));

jest.mock('../constants', () => ({
    LANGUAGE_MAP: { python: 'python', javascript: 'javascript' },
}));

// ─── Test Data ────────────────────────────────────────────────────────────────

const mockProblem = {
    id: 1,
    title: 'Add Two Numbers',
    description: 'Write a function that adds two numbers.',
    language: 'python',
    test_cases: [
        { input: 'add(1, 2)', expected: '3' },
    ],
};

const mockSubmission = {
    session_id: 1,
    student_name: 'Alice',
    submitted_at: '2024-01-01T10:00:00Z',
    code: 'def add(a, b):\n    return a + b',
    suggestion_log: [],
    tab_switch_log: [],
    test_results: [],
    paste_log: [],
    grade: null,
};

const mockOnBack = jest.fn();

const defaultProps = {
    submission: mockSubmission,
    allSubmissions: [mockSubmission],
    problem: mockProblem,
    onBack: mockOnBack,
};

beforeEach(() => {
    jest.clearAllMocks();
});

// Rendering

test('renders without crashing', () => {
    render(<ReviewPage {...defaultProps} />);
});

test('renders the logo', () => {
    render(<ReviewPage {...defaultProps} />);
    expect(screen.getByText('AutoSuggestion Quiz')).toBeInTheDocument();
});

test('renders back button', () => {
    render(<ReviewPage {...defaultProps} />);
    expect(screen.getByText('← Back')).toBeInTheDocument();
});

test('renders problem title', () => {
    render(<ReviewPage {...defaultProps} />);
    expect(screen.getAllByText('Add Two Numbers').length).toBeGreaterThan(0);
});

test('renders problem description', () => {
    render(<ReviewPage {...defaultProps} />);
    expect(screen.getByText('Write a function that adds two numbers.')).toBeInTheDocument();
});

test('renders the code editor', () => {
    render(<ReviewPage {...defaultProps} />);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
});

test('renders read-only label', () => {
    render(<ReviewPage {...defaultProps} />);
    expect(screen.getByText('Read-only')).toBeInTheDocument();
});

// Student Info card

test('renders student name in info card', () => {
    render(<ReviewPage {...defaultProps} />);
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
});

test('renders submitted date in info card', () => {
    render(<ReviewPage {...defaultProps} />);
    expect(screen.getAllByText(/Submitted/).length).toBeGreaterThan(0);
});

test('renders AI suggestions count', () => {
    render(<ReviewPage {...defaultProps} />);
    expect(screen.getByText('AI Suggestions Used')).toBeInTheDocument();
});

test('renders tab switches count', () => {
    render(<ReviewPage {...defaultProps} />);
    const infoCard = document.querySelector('.review-info-card');
    expect(within(infoCard).getByText('Tab Switches')).toBeInTheDocument();
});

test('renders pastes count', () => {
    render(<ReviewPage {...defaultProps} />);
    expect(screen.getByText('Pastes')).toBeInTheDocument();
});

test('renders grade when present', () => {
    render(<ReviewPage {...defaultProps} submission={{ ...mockSubmission, grade: 92 }} />);
    expect(screen.getByText('92%')).toBeInTheDocument();
});

test('does not render grade row when grade is null', () => {
    render(<ReviewPage {...defaultProps} />);
    expect(screen.queryByText('Grade')).not.toBeInTheDocument();
});

test('renders test results count when test results exist', () => {
    const submissionWithResults = {
        ...mockSubmission,
        test_results: [{ input: 'add(1,2)', expected: '3', actual: '3', passed: true }],
    };
    render(<ReviewPage {...defaultProps} submission={submissionWithResults} allSubmissions={[submissionWithResults]} />);
    expect(screen.getByText('Tests Passed')).toBeInTheDocument();
});

// Navigation

test('calls onBack when back button is clicked', () => {
    render(<ReviewPage {...defaultProps} />);
    fireEvent.click(screen.getByText('← Back'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
});

// Tabs

test('renders Suggestion Log tab as default', () => {
    render(<ReviewPage {...defaultProps} />);
    expect(screen.getByText('No AI suggestions were accepted during this submission.')).toBeInTheDocument();
});

test('switches to Paste Log tab', () => {
    render(<ReviewPage {...defaultProps} />);
    fireEvent.click(screen.getByText('Paste Log'));
    expect(screen.getByText('No paste events were recorded during this submission.')).toBeInTheDocument();
});

test('switches to Tab Switches tab', () => {
    render(<ReviewPage {...defaultProps} />);
    const bottomTabs = document.querySelector('.bottom-tabs');
    fireEvent.click(within(bottomTabs).getByText('Tab Switches'));
    expect(screen.getByText('No tab switches were recorded during this submission.')).toBeInTheDocument();
});

test('switches to Test Results tab', () => {
    render(<ReviewPage {...defaultProps} />);
    fireEvent.click(screen.getByText('Test Results'));
    expect(screen.getByText('No test results were recorded for this submission.')).toBeInTheDocument();
});

// Suggestion Log

test('renders suggestion log entries', () => {
    const submissionWithLog = {
        ...mockSubmission,
        suggestion_log: [{ time: '10:00:00', action: 'accepted', label: 'return a + b' }],
    };
    render(<ReviewPage {...defaultProps} submission={submissionWithLog} allSubmissions={[submissionWithLog]} />);
    expect(screen.getByText('accepted')).toBeInTheDocument();
    expect(screen.getByText('return a + b')).toBeInTheDocument();
});

test('shows suggestion count badge when suggestions exist', () => {
    const submissionWithLog = {
        ...mockSubmission,
        suggestion_log: [{ time: '10:00:00', action: 'accepted', label: 'return a + b' }],
    };
    render(<ReviewPage {...defaultProps} submission={submissionWithLog} allSubmissions={[submissionWithLog]} />);
    const badge = document.querySelector('.log-count');
    expect(within(badge).getByText('1')).toBeInTheDocument();
});

test('renders AI highlight legend when suggestions exist', () => {
    const submissionWithLog = {
        ...mockSubmission,
        suggestion_log: [{ time: '10:00:00', action: 'accepted', label: 'return a + b' }],
    };
    render(<ReviewPage {...defaultProps} submission={submissionWithLog} allSubmissions={[submissionWithLog]} />);
    expect(screen.getByText(/Lines highlighted in amber/)).toBeInTheDocument();
});

// Paste Log

test('renders paste log entries', () => {
    const submissionWithPaste = {
        ...mockSubmission,
        paste_log: [{ time: '10:01:00', type: 'external_paste', charCount: 42, preview: 'return a + b' }],
    };
    render(<ReviewPage {...defaultProps} submission={submissionWithPaste} allSubmissions={[submissionWithPaste]} />);
    fireEvent.click(screen.getByText('Paste Log'));
    expect(screen.getByText('external paste')).toBeInTheDocument();
    expect(screen.getByText(/42 chars/)).toBeInTheDocument();
});

test('renders internal paste entries', () => {
    const submissionWithPaste = {
        ...mockSubmission,
        paste_log: [{ time: '10:01:00', type: 'internal_paste', charCount: 10, preview: 'pass' }],
    };
    render(<ReviewPage {...defaultProps} submission={submissionWithPaste} allSubmissions={[submissionWithPaste]} />);
    fireEvent.click(screen.getByText('Paste Log'));
    expect(screen.getByText('internal paste')).toBeInTheDocument();
});

// Tab Switching Log

test('renders tab switch entries', () => {
    const submissionWithTabs = {
        ...mockSubmission,
        tab_switch_log: [{ time: '10:02:00' }],
    };
    render(<ReviewPage {...defaultProps} submission={submissionWithTabs} allSubmissions={[submissionWithTabs]} />);
    const bottomTabs = document.querySelector('.bottom-tabs');
    fireEvent.click(within(bottomTabs).getByText('Tab Switches'));
    expect(screen.getByText('switched away')).toBeInTheDocument();
    expect(screen.getByText('Tab switch 1 of 1')).toBeInTheDocument();
});

// Test Results

test('renders passed test result', () => {
    const submissionWithResults = {
        ...mockSubmission,
        test_results: [{ input: 'add(1, 2)', expected: '3', actual: '3', passed: true }],
    };
    render(<ReviewPage {...defaultProps} submission={submissionWithResults} allSubmissions={[submissionWithResults]} />);
    fireEvent.click(screen.getByText('Test Results'));
    expect(screen.getByText('PASSED')).toBeInTheDocument();
    expect(screen.getByText('add(1, 2)')).toBeInTheDocument();
});

test('renders failed test result', () => {
    const submissionWithResults = {
        ...mockSubmission,
        test_results: [{ input: 'add(1, 2)', expected: '3', actual: '0', passed: false }],
    };
    render(<ReviewPage {...defaultProps} submission={submissionWithResults} allSubmissions={[submissionWithResults]} />);
    fireEvent.click(screen.getByText('Test Results'));
    expect(screen.getByText('FAILED')).toBeInTheDocument();
});

// Multiple Submissions

test('does not render submission selector for single submission', () => {
    render(<ReviewPage {...defaultProps} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});

test('renders submission selector when multiple submissions exist', () => {
    const submission2 = { ...mockSubmission, session_id: 2, submitted_at: '2024-01-02T10:00:00Z' };
    render(<ReviewPage {...defaultProps} allSubmissions={[submission2, mockSubmission]} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
});

test('switches active submission when selector changes', () => {
    const submission2 = {
        ...mockSubmission,
        session_id: 2,
        student_name: 'Alice',
        submitted_at: '2024-01-02T10:00:00Z',
        suggestion_log: [{ time: '10:00:00', action: 'accepted', label: 'some suggestion' }],
    };
    render(<ReviewPage {...defaultProps} allSubmissions={[submission2, mockSubmission]} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });
    expect(screen.getByText('No AI suggestions were accepted during this submission.')).toBeInTheDocument();
});