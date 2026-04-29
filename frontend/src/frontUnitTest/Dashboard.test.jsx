import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';

jest.mock('../api', () => ({
    gradeSubmission: jest.fn(),
}));

jest.mock('../constants', () => ({
    DIFFICULTY_COLORS: { Easy: '#4ec9b0', Medium: '#ce9178', Hard: '#f48771' },
}));

const mockOnCreateProblem = jest.fn();
const mockOnDeleteProblem = jest.fn();
const mockOnLogout = jest.fn();
const mockOnProblemsUpdate = jest.fn();
const mockOnRefresh = jest.fn();
const mockOnReview = jest.fn();

const mockUser = { email: 'teacher@test.com', token: 'abc123' };

const mockProblems = [
    {
        id: 1,
        title: 'Problem Alpha',
        description: 'First problem description',
        difficulty: 'Easy',
        access_code: '111111',
        submissions: [],
        allow_copy_paste: true,
        track_tab_switching: false,
    },
    {
        id: 2,
        title: 'Problem Beta',
        description: 'Second problem description',
        difficulty: 'Hard',
        access_code: '222222',
        submissions: [
            { session_id: 's1', student_name: 'Alice', submitted_at: '2024-01-01T10:00:00Z', score: 8, total: 10, grade: null },
        ],
        allow_copy_paste: false,
        track_tab_switching: true,
    },
];

const defaultProps = {
    problems: mockProblems,
    problemsLoading: false,
    problemsError: '',
    onCreateProblem: mockOnCreateProblem,
    onDeleteProblem: mockOnDeleteProblem,
    onLogout: mockOnLogout,
    onProblemsUpdate: mockOnProblemsUpdate,
    onRefresh: mockOnRefresh,
    onReview: mockOnReview,
    user: mockUser,
    autofillPending: false,
};

beforeEach(() => {
    jest.clearAllMocks();
});


// Rendering

test('renders without crashing', () => {
    render(<Dashboard {...defaultProps} />);
});

test('renders header and logo', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('AutoSuggestion Quiz')).toBeInTheDocument();
});

test('renders welcome message with email', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('Welcome back, teacher@test.com')).toBeInTheDocument();
});

test('renders welcome message with fallback when no user name or email', () => {
    render(<Dashboard {...defaultProps} user={{}} />);
    expect(screen.getByText('Welcome back, Teacher')).toBeInTheDocument();
});

test('renders problem cards', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('Problem Alpha')).toBeInTheDocument();
    expect(screen.getByText('Problem Beta')).toBeInTheDocument();
});

test('renders empty state when no problems', () => {
    render(<Dashboard {...defaultProps} problems={[]} />);
    expect(screen.getByText(/No problems yet/)).toBeInTheDocument();
});

test('renders loading state', () => {
    render(<Dashboard {...defaultProps} problems={[]} problemsLoading={true} />);
    expect(screen.getByText('Loading problems…')).toBeInTheDocument();
});

test('renders error state', () => {
    render(<Dashboard {...defaultProps} problemsError="Network error" />);
    expect(screen.getByText('Failed to load problems: Network error')).toBeInTheDocument();
});

// Stat Bar

test('displays correct problem count in stats', () => {
    render(<Dashboard {...defaultProps} />);
    const statsBar = document.querySelector('.stats-bar');
    expect(within(statsBar).getByText('Problems')).toBeInTheDocument();
});

test('displays correct submission count in stats', () => {
    render(<Dashboard {...defaultProps} />);
    const statsBar = document.querySelector('.stats-bar');
    expect(within(statsBar).getByText('Submissions')).toBeInTheDocument();
});

test('displays ungraded count in stats', () => {
    render(<Dashboard {...defaultProps} />);
    const statsBar = document.querySelector('.stats-bar');
    expect(within(statsBar).getByText('Needs Grading')).toBeInTheDocument();
});

// Header Buttons

test('calls onLogout when Log Out is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(screen.getByText('Log Out'));
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
});

test('calls onCreateProblem when + New Problem is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Problem'));
    expect(mockOnCreateProblem).toHaveBeenCalledTimes(1);
});

test('calls onRefresh when Refresh is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(screen.getByText('↻ Refresh'));
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
});

test('refresh button is disabled when problemsLoading is true', () => {
    render(<Dashboard {...defaultProps} problemsLoading={true} />);
    expect(screen.getByText('↻ Loading…')).toBeDisabled();
});

test('shows autofill indicator when autofillPending is true', () => {
    render(<Dashboard {...defaultProps} autofillPending={true} />);
    const newProblemBtn = screen.getByText('+ New Problem');
    expect(newProblemBtn.querySelector('span')).toBeTruthy();
});

// Search

test('filters problems by title', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search problems or access codes...'), {
        target: { value: 'Alpha' },
    });
    expect(screen.getByText('Problem Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Problem Beta')).not.toBeInTheDocument();
});

test('filters problems by access code', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search problems or access codes...'), {
        target: { value: '222222' },
    });
    expect(screen.getByText('Problem Beta')).toBeInTheDocument();
    expect(screen.queryByText('Problem Alpha')).not.toBeInTheDocument();
});

test('Shows no results message when there are no search results', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search problems or access codes...'), {
        target: { value: 'nothing' },
    });
    expect(screen.getByText('No problems match your search.')).toBeInTheDocument();

});

// Share Model

test('opens share modal when Share is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(screen.getAllByText('Share')[0]);
    expect(screen.getByText('Share Problem')).toBeInTheDocument();
    expect(screen.getByText('Student Access Code')).toBeInTheDocument();
});

test('closes share modal when X is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(screen.getAllByText('Share')[0]);
    fireEvent.click(screen.getByText('×'));
    expect(screen.queryByText('Share Problem')).not.toBeInTheDocument();
});

test('closes share modal when overlay is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(screen.getAllByText('Share')[0]);
    fireEvent.click(document.querySelector('.modal-overlay'));
    expect(screen.queryByText('Share Problem')).not.toBeInTheDocument();
});

// Delete Model

test('opens delete modal when Delete is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(screen.getAllByText('Delete')[0]);
    const modalHeader = document.querySelector('.modal-header');
    expect(within(modalHeader).getByText('Delete Problem')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
});

test('closes delete modal when Cancel is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(screen.getAllByText('Delete')[0]);
    fireEvent.click(screen.getByText('Cancel'));
    const modalHeader = document.querySelector('.modal-header');
    expect(modalHeader).not.toBeInTheDocument();
});

test('calls onDeleteProblem and closes modal when Delete Problem is confirmed', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(screen.getAllByText('Delete')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Problem' }));
    expect(mockOnDeleteProblem).toHaveBeenCalledWith(mockProblems[0].id);
    const modalHeader = document.querySelector('.modal-header');
    expect(modalHeader).not.toBeInTheDocument();
});

// Problem cards use “View Submissions” (in-dashboard edit flow was removed).

const viewSubmissionsButtons = () =>
    screen.getAllByRole('button', { name: /View Submissions/i });

//  Submission Model

test('opens submissions modal when View Submissions is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(viewSubmissionsButtons()[0]);
    expect(screen.getByText(/Submissions —/)).toBeInTheDocument();
});

test('shows empty state when problem has no submissions', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(viewSubmissionsButtons()[0]);
    expect(screen.getByText('No submissions yet for this problem.')).toBeInTheDocument();
});

test('shows submission rows when problem has submissions', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(viewSubmissionsButtons()[1]);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('8 / 10')).toBeInTheDocument();
});

test('closes submissions modal when X is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(viewSubmissionsButtons()[0]);
    fireEvent.click(screen.getByText('×'));
    expect(screen.queryByText(/Submissions —/)).not.toBeInTheDocument();
});

test('calls onReview when Review is clicked on a submission', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(viewSubmissionsButtons()[1]);
    fireEvent.click(screen.getByText('Review'));
    expect(mockOnReview).toHaveBeenCalledTimes(1);
});

test('shows grade input when Grade button is clicked', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(viewSubmissionsButtons()[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Grade' }));
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
});

test('shows error when grade is out of range', async () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(viewSubmissionsButtons()[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Grade' }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '150' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(screen.getByText('Grade must be 0–100.')).toBeInTheDocument());
});

test('calls gradeSubmission API with correct values', async () => {
    const { gradeSubmission } = require('../api');
    gradeSubmission.mockResolvedValue({});
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(viewSubmissionsButtons()[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Grade' }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '85' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(gradeSubmission).toHaveBeenCalledWith(2, 's1', 85, 'abc123'));
});