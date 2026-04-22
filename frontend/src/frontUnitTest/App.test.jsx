import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock API module
jest.mock('../api', () => ({
    getTeacherProblems: jest.fn(),
    deleteProblem: jest.fn(),
}));

// Mock child pages to isolate App logic
jest.mock('../pages/LoginPage', () => ({ onLogin }) => (
    <div>
        <div>LoginPage</div>
        <button onClick={() => onLogin({ token: null, role: 'student', problem: { id: 1, title: 'Test Problem' }, studentName: 'Alice' })}>
            Login as Student
        </button>
        <button onClick={() => onLogin({ token: 'mock.eyJlbWFpbCI6InRlYWNoZXJAdGVzdC5jb20iLCJyb2xlIjoidGVhY2hlciIsInVzZXJfaWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig', role: 'teacher', email: 'teacher@test.com' })}>
            Login as Teacher
        </button>
    </div>
));

jest.mock('../pages/Dashboard', () => ({ onLogout, onCreateProblem }) => (
    <div>
        <div>Dashboard</div>
        <button onClick={onLogout}>Logout</button>
        <button onClick={onCreateProblem}>Create Problem</button>
    </div>
));

jest.mock('../pages/ProblemPage', () => ({ problem, studentName, onBack }) => (
    <div>
        <div>ProblemPage</div>
        <div>{problem?.title}</div>
        <div>{studentName}</div>
        <button onClick={onBack}>Back</button>
    </div>
));

jest.mock('../pages/CreateProblemPage', () => ({ onBack, onCreated }) => (
    <div>
        <div>CreateProblemPage</div>
        <button onClick={onBack}>Back</button>
        <button onClick={() => onCreated({ id: 99, title: 'New Problem' })}>Submit</button>
    </div>
));

jest.mock('../pages/ReviewPage', () => ({ onBack }) => (
    <div>
        <div>ReviewPage</div>
        <button onClick={onBack}>Back</button>
    </div>
));

// Helper: valid JWT with future expiry for a teacher
const makeTeacherToken = () => {
    const payload = btoa(JSON.stringify({ email: 'teacher@test.com', role: 'teacher', user_id: 1, exp: 9999999999 }));
    return `header.${payload}.sig`;
};

beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    const { getTeacherProblems } = require('../api');
    getTeacherProblems.mockResolvedValue([]);
});

// Rendering

test('renders without crashing', () => {
    render(<App />);
});

test('renders Login Page when there is no current session', () => {
    render(<App />);
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
});

test('renders Teacher Page when there is a teacher token in localStorage', () => {
    localStorage.setItem('teacher_token',makeTeacherToken());



    render(<App />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
});

//Session Token Storage
test('LoginPage is displayed and token is cleared when it expires', () => {
    const expiredPayload = btoa(JSON.stringify({ email: 'teacher@test.com', role: 'teacher', user_id: 1, exp: 1 }));
    localStorage.setItem('teacher_token',`header.${expiredPayload}.sig`);


    render(<App />);
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
    expect(localStorage.getItem('teacher_token')).toBeNull();
});

test('clears malformed token', () => {
    localStorage.setItem('teacher_token','not-a-valid-token');



    render(<App />);
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
});

// Login

test('Student login calls problemPage', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Login as Student'));
    expect(screen.getByText('ProblemPage')).toBeInTheDocument();
    expect(screen.getByText('Test Problem')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
});

test('Teacher login stores token and navigates to dashboard', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Login as Teacher'));
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(localStorage.getItem('teacher_token')).not.toBeNull();
});

// Logout

test('Teacher logout deletes token and navigates to loginPage', () => {
    localStorage.setItem('teacher_token',makeTeacherToken());
    render(<App />);
    fireEvent.click(screen.getByText('Logout'));
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
    expect(localStorage.getItem('teacher_token')).toBeNull();
});

// Navigation

test('Create Problem button to CreateProblemPage', () => {
    localStorage.setItem('teacher_token',makeTeacherToken());
    render(<App />);
    fireEvent.click(screen.getByText('Create Problem'));
    expect(screen.getByText('CreateProblemPage')).toBeInTheDocument();
    expect(localStorage.getItem('teacher_token')).not.toBeNull();
});

test('CreateProblemPage to Dashboard using back button', () => {
    localStorage.setItem('teacher_token',makeTeacherToken());
    render(<App />);
    fireEvent.click(screen.getByText('Create Problem'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(localStorage.getItem('teacher_token')).not.toBeNull();
});

test('CreateProblemPage to Dashboard using submit button', () => {
    localStorage.setItem('teacher_token',makeTeacherToken());
    render(<App />);
    fireEvent.click(screen.getByText('Create Problem'));
    fireEvent.click(screen.getByText('Submit'));
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(localStorage.getItem('teacher_token')).not.toBeNull();
});

test('Student ProblemPage to Dashboard using back button', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Login as Student'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
});

// API

test('Problems api loads when teacher accesses dashboard', async () => {
    const { getTeacherProblems } = require('../api');
    getTeacherProblems.mockResolvedValue([{ id: 1, title: 'Problem A' }]);
    localStorage.setItem('teacher_token', makeTeacherToken());
    render(<App />);
    await waitFor(() => expect(getTeacherProblems).toHaveBeenCalledTimes(1));
});

test('delete problem calls deleteProblems', async () => {
    const { deleteProblem, getTeacherProblems } = require('../api');
    deleteProblem.mockResolvedValue({});
    getTeacherProblems.mockResolvedValue([{ id: 5, title: 'Delete Me' }]);
    localStorage.setItem('teacher_token', makeTeacherToken());
    render(<App />);
    await waitFor(() => expect(getTeacherProblems).toHaveBeenCalledTimes(1));
});