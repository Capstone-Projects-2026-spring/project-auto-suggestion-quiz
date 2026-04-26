import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../pages/LoginPage';

jest.mock('../api', () => ({
    requestOTP: jest.fn(),
    verifyOTP: jest.fn(),
    getProblemByCode: jest.fn(),
}));

const mockOnLogin = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── Rendering ───────────────────────────────────────────────────────────────

test('renders without crashing', () => {
    render(<LoginPage onLogin={mockOnLogin} />);
});

test('renders student by default', () => {
    render(<LoginPage onLogin={mockOnLogin} />);
    expect(screen.getByText('Enter Problem')).toBeInTheDocument();
    expect(screen.getByText('Your Name')).toBeInTheDocument();
    expect(screen.getByText('Problem Key')).toBeInTheDocument();
    expect(screen.getByText('Enter')).toBeInTheDocument();
});

test('renders role toggle button', () => {
    render(<LoginPage onLogin={mockOnLogin} />);
    expect(screen.getByText('Teacher Login →')).toBeInTheDocument();
});

// Mode Switching

test('switches to Teacher mode when toggle button is pressed in student mode', () => {
    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText('Teacher Login →'));
    expect(screen.getByText('Teacher Sign In')).toBeInTheDocument();
    expect(screen.getByText('Send Code')).toBeInTheDocument();
});

test('switches back to Student mode when toggle button is clicked in Teacher mode', () => {
    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText('Teacher Login →'));
    fireEvent.click(screen.getByText('← Student Login'));
    expect(screen.getByText('Enter Problem')).toBeInTheDocument();
    expect(screen.getByText('Your Name')).toBeInTheDocument();
    expect(screen.getByText('Problem Key')).toBeInTheDocument();
    expect(screen.getByText('Enter')).toBeInTheDocument();
});

test('clears error when switching modes', async () => {
    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText('Enter'));
    await waitFor(() => expect(screen.getByText('Please enter your name.')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Teacher Login →'));
    expect(screen.queryByText('Please enter your name.')).not.toBeInTheDocument();
});

// Student Validation

test('Error when student hits enter with no name', async () => {
    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText('Enter'));
    await waitFor(() => expect(screen.getByText('Please enter your name.')).toBeInTheDocument());
});

test('Error when student hits enter with no problem Key', async () => {
    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Enter'));
    await waitFor(() => expect(screen.getByText('Please enter a valid 6-digit problem key.')).toBeInTheDocument());
});

test('Error when problem key is not 6 digits', async () => {
    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Problem Key'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Enter'));
    await waitFor(() => expect(screen.getByText('Please enter a valid 6-digit problem key.')).toBeInTheDocument());
});

test('Error when problem key contains letters', async () => {
    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Problem Key'), { target: { value: '123abc' } });
    fireEvent.click(screen.getByText('Enter'));
    await waitFor(() => expect(screen.getByText('Please enter a valid 6-digit problem key.')).toBeInTheDocument());
});

// Student Login Flow

test('calls onLogin with correct data on successful student login', async () => {
    const { getProblemByCode } = require('../api');
    getProblemByCode.mockResolvedValue({ id: 1, title: 'Test Problem' });

    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Problem Key'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Enter'));

    await waitFor(() => expect(mockOnLogin).toHaveBeenCalledWith({
        name: 'Alice',
        role: 'student',
        problem: { id: 1, title: 'Test Problem' },
        studentName: 'Alice',
    }));
});

test('shows error when problem code is not found', async () => {
    const { getProblemByCode } = require('../api');
    getProblemByCode.mockRejectedValue(new Error('Not found'));

    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Problem Key'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Enter'));

    await waitFor(() => expect(screen.getByText('No problem found with that code. Please check with your teacher and try again.')).toBeInTheDocument());
});

test('shows loading state while fetching problem', async () => {
    const { getProblemByCode } = require('../api');
    getProblemByCode.mockImplementation(() => new Promise(() => {}));

    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Problem Key'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Enter'));

    await waitFor(() => expect(screen.getByText('Looking up...')).toBeInTheDocument());
});

// Teacher Validation

test('Error when Teacher logs in with no email', async () => {
    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText('Teacher Login →'));
    fireEvent.click(screen.getByText('Send Code'));
    await waitFor(() => expect(screen.getByText('Please enter your email.')).toBeInTheDocument());
});

test('Error when Teacher submits no OTP code', async () => {
    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText('Teacher Login →'));
    fireEvent.change(screen.getByPlaceholderText('you@school.edu'), { target: { value: 'teacher@test.com' } });
    fireEvent.click(screen.getByText('Send Code'));

    await waitFor(() => expect(screen.getByText('Verify Code')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Verify Code'));
    await waitFor(() => expect(screen.getByText('Please enter the code.')).toBeInTheDocument());
});

//Teacher Login Flow

test('advances to OTP step after successful email submission', async () => {
    const { requestOTP } = require('../api');
    requestOTP.mockResolvedValue({});

    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText('Teacher Login →'));
    fireEvent.change(screen.getByPlaceholderText('you@school.edu'), { target: { value: 'teacher@test.com' } });
    fireEvent.click(screen.getByText('Send Code'));

    await waitFor(() => expect(screen.getByText('Verify Code')).toBeInTheDocument());
    expect(screen.getByText('Enter the code sent to your email.')).toBeInTheDocument();
    expect(screen.getByText('Resend Code')).toBeInTheDocument();
});

test('calls onLogin with token after successful OTP verification', async () => {
    const { requestOTP, verifyOTP } = require('../api');
    requestOTP.mockResolvedValue({});
    verifyOTP.mockResolvedValue({ user: { email: 'teacher@test.com' }, token: 'abc123' });

    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText('Teacher Login →'));
    fireEvent.change(screen.getByPlaceholderText('you@school.edu'), { target: { value: 'teacher@test.com' } });
    fireEvent.click(screen.getByText('Send Code'));

    await waitFor(() => expect(screen.getByText('Verify Code')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '654321' } });
    fireEvent.click(screen.getByText('Verify Code'));

    await waitFor(() => expect(mockOnLogin).toHaveBeenCalledWith({
        email: 'teacher@test.com',
        token: 'abc123',
    }));
});

test('shows error when OTP verification fails', async () => {
    const { requestOTP, verifyOTP } = require('../api');
    requestOTP.mockResolvedValue({});
    verifyOTP.mockRejectedValue(new Error('Invalid code'));

    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText('Teacher Login →'));
    fireEvent.change(screen.getByPlaceholderText('you@school.edu'), { target: { value: 'teacher@test.com' } });
    fireEvent.click(screen.getByText('Send Code'));

    await waitFor(() => expect(screen.getByText('Verify Code')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '000000' } });
    fireEvent.click(screen.getByText('Verify Code'));

    await waitFor(() => expect(screen.getByText('Invalid code')).toBeInTheDocument());
});

test('shows error when requestOTP fails', async () => {
    const { requestOTP } = require('../api');
    requestOTP.mockRejectedValue(new Error('Email not found'));

    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText('Teacher Login →'));
    fireEvent.change(screen.getByPlaceholderText('you@school.edu'), { target: { value: 'unknown@test.com' } });
    fireEvent.click(screen.getByText('Send Code'));

    await waitFor(() => expect(screen.getByText('Email not found')).toBeInTheDocument());
});

test('shows loading state while requesting OTP', async () => {
    const { requestOTP } = require('../api');
    requestOTP.mockImplementation(() => new Promise(() => {}));

    render(<LoginPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText('Teacher Login →'));
    fireEvent.change(screen.getByPlaceholderText('you@school.edu'), { target: { value: 'teacher@test.com' } });
    fireEvent.click(screen.getByText('Send Code'));

    await waitFor(() => expect(screen.getByText('Please wait...')).toBeInTheDocument());
});
