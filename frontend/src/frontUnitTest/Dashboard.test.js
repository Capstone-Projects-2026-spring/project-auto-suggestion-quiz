import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import ProblemPage from '../pages/ProblemPage';
import '@testing-library/jest-dom';
import * as api from '../api';

jest.mock('../api');

// Mock Monaco Editor since it won't load in test environment
jest.mock('@monaco-editor/react', () => ({
    __esModule: true,
    default: ({ value, onChange }) => (
        <textarea
            data-testid="monaco-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));

const mockUser = {
    token: 'fake-token',
    email: 'teacher@school.edu',
    name: 'Mr Teacher',
    role: 'teacher'
};

const mockProblems = [
    {
        id: 1,
        title: 'Add Two Numbers',
        description: 'Write a function that adds two numbers',
        difficulty: 'Easy',
        access_code: '123456',
        submissions: []
    },
    {
        id: 2,
        title: 'Reverse a String',
        description: 'Write a function that reverses a string',
        difficulty: 'Medium',
        access_code: '654321',
        submissions: [
            { session_id: 1, student_name: 'John', grade: null, submitted_at: new Date().toISOString() }
        ]
    }
];

describe('Dashboard', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders dashboard with problems', () => {
        render(
            <Dashboard
                problems={mockProblems}
                onCreateProblem={jest.fn()}
                onDeleteProblem={jest.fn()}
                onLogout={jest.fn()}
                onProblemsUpdate={jest.fn()}
                user={mockUser}
            />
        );

        expect(screen.getAllByText('Add Two Numbers')[0]).toBeInTheDocument();
        expect(screen.getByText('Reverse a String')).toBeInTheDocument();
    });

    test('shows correct problem count in stats', () => {
        render(
            <Dashboard
                problems={mockProblems}
                onCreateProblem={jest.fn()}
                onDeleteProblem={jest.fn()}
                onLogout={jest.fn()}
                onProblemsUpdate={jest.fn()}
                user={mockUser}
            />
        );

        expect(screen.getByText('2')).toBeInTheDocument(); // Problems count
    });

    test('shows empty state when no problems', () => {
        render(
            <Dashboard
                problems={[]}
                onCreateProblem={jest.fn()}
                onDeleteProblem={jest.fn()}
                onLogout={jest.fn()}
                onProblemsUpdate={jest.fn()}
                user={mockUser}
            />
        );

        expect(screen.getByText(/No problems yet/i)).toBeInTheDocument();
    });

    test('search filters problems by title', () => {
        render(
            <Dashboard
                problems={mockProblems}
                onCreateProblem={jest.fn()}
                onDeleteProblem={jest.fn()}
                onLogout={jest.fn()}
                onProblemsUpdate={jest.fn()}
                user={mockUser}
            />
        );

        fireEvent.change(screen.getByPlaceholderText('Search problems or access codes...'), {
            target: { value: 'reverse' }
        });

        expect(screen.getByText('Reverse a String')).toBeInTheDocument();
        expect(screen.queryByText('Add Two Numbers')).not.toBeInTheDocument();
    });

    test('search filters problems by access code', () => {
        render(
            <Dashboard
                problems={mockProblems}
                onCreateProblem={jest.fn()}
                onDeleteProblem={jest.fn()}
                onLogout={jest.fn()}
                onProblemsUpdate={jest.fn()}
                user={mockUser}
            />
        );

        fireEvent.change(screen.getByPlaceholderText('Search problems or access codes...'), {
            target: { value: '123456' }
        });

        expect(screen.getAllByText('Add Two Numbers')[0]).toBeInTheDocument();
        expect(screen.queryByText('Reverse a String')).not.toBeInTheDocument();
    });

    test('shows share modal when share button clicked', () => {
        render(
            <Dashboard
                problems={mockProblems}
                onCreateProblem={jest.fn()}
                onDeleteProblem={jest.fn()}
                onLogout={jest.fn()}
                onProblemsUpdate={jest.fn()}
                user={mockUser}
            />
        );

        fireEvent.click(screen.getAllByText('Share')[0]);
        expect(screen.getByText('Share Problem')).toBeInTheDocument();
        expect(screen.getByText('Student Access Code')).toBeInTheDocument();
    });

    test('shows delete confirmation modal when delete clicked', () => {
        render(
            <Dashboard
                problems={mockProblems}
                onCreateProblem={jest.fn()}
                onDeleteProblem={jest.fn()}
                onLogout={jest.fn()}
                onProblemsUpdate={jest.fn()}
                user={mockUser}
            />
        );

        fireEvent.click(screen.getAllByText('Delete')[0]);
        expect(screen.getAllByText('Delete Problem')[0]).toBeInTheDocument();
        expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    test('calls onDeleteProblem when delete confirmed', () => {
        const onDeleteProblem = jest.fn();

        render(
            <Dashboard
                problems={mockProblems}
                onCreateProblem={jest.fn()}
                onDeleteProblem={onDeleteProblem}
                onLogout={jest.fn()}
                onProblemsUpdate={jest.fn()}
                user={mockUser}
            />
        );

        fireEvent.click(screen.getAllByText('Delete')[0]);
        fireEvent.click(screen.getByRole('button', { name: 'Delete Problem' }));

        expect(onDeleteProblem).toHaveBeenCalledWith(1);
    });

    test('shows submissions modal when submissions clicked', () => {
        render(
            <Dashboard
                problems={mockProblems}
                onCreateProblem={jest.fn()}
                onDeleteProblem={jest.fn()}
                onLogout={jest.fn()}
                onProblemsUpdate={jest.fn()}
                user={mockUser}
            />
        );

        fireEvent.click(screen.getAllByText('Submissions')[1]); // Second problem
        expect(screen.getByText((content) => content.includes('Reverse a String'))).toBeInTheDocument();    
    });

    test('calls onLogout when log out clicked', () => {
        const onLogout = jest.fn();

        render(
            <Dashboard
                problems={mockProblems}
                onCreateProblem={jest.fn()}
                onDeleteProblem={jest.fn()}
                onLogout={onLogout}
                onProblemsUpdate={jest.fn()}
                user={mockUser}
            />
        );

        fireEvent.click(screen.getByText('Log Out'));
        expect(onLogout).toHaveBeenCalled();
    });

});

describe('ProblemPage', () => {

    const mockProblem = {
        id: 1,
        title: 'Add Two Numbers',
        description: 'Write a function that adds two numbers',
        language: 'python',
        sections: [
            { label: 'Starter', code: 'def add(a, b):', order_index: 0 }
        ]
    };

    test('renders problem title and description', () => {
        render(<ProblemPage problem={mockProblem} onBack={jest.fn()} />);

        expect(screen.getAllByText('Add Two Numbers')[0]).toBeInTheDocument();
        expect(screen.getByText('Write a function that adds two numbers')).toBeInTheDocument();
    });

    test('renders editor with starter code', () => {
        render(<ProblemPage problem={mockProblem} onBack={jest.fn()} />);

        const editor = screen.getByTestId('monaco-editor');
        expect(editor.value).toContain('def add(a, b):');
    });

    test('calls onBack when back button clicked', () => {
        const onBack = jest.fn();
        render(<ProblemPage problem={mockProblem} onBack={onBack} />);

        fireEvent.click(screen.getByText('← Back'));
        expect(onBack).toHaveBeenCalled();
    });

    test('shows output tab by default', () => {
        render(<ProblemPage problem={mockProblem} onBack={jest.fn()} />);

        expect(screen.getByText(/Click "Run Code" to see output here./i)).toBeInTheDocument();
    });

    test('switches to suggestion log tab', () => {
        render(<ProblemPage problem={mockProblem} onBack={jest.fn()} />);

        fireEvent.click(screen.getByText('Suggestion Log'));
        expect(screen.getByText(/No suggestions accepted yet/i)).toBeInTheDocument();
    });

});