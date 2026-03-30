import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../pages/LoginPage';
import * as api from '../api';
import '@testing-library/jest-dom';


//Mock set up
jest.mock('../api');

describe('LoginPage', () => {


    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Expects to see the login inputs.
    test('renders student login by default', () => {
        render(<LoginPage onLogin={jest.fn()} />);
        //Expect command, expects the screen to have these texts within the document of login
        expect(screen.getByText('Enter Problem')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('First Last')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('6-digit code')).toBeInTheDocument();
    });

    test('shows error if student name is empty', async () => {
        render(<LoginPage onLogin={jest.fn()} />);
        //Mock fire event where a click is done.
        fireEvent.click(screen.getByText('Enter'));
        await waitFor(() => {
            expect(screen.getByText('Please enter your name.')).toBeInTheDocument();
        });
    });

    test('shows error if problem key is not 6 digits', async () => {
        render(<LoginPage onLogin={jest.fn()} />);
        fireEvent.change(screen.getByPlaceholderText('First Last'), {
            target: { value: 'John' }
        });
        fireEvent.change(screen.getByPlaceholderText('6-digit code'), {
            target: { value: '123' }  // invalid, only 3 digits
        });
        fireEvent.click(screen.getByText('Enter'));
        await waitFor(() => {
            expect(screen.getByText('Please enter a valid 6-digit problem key.')).toBeInTheDocument();
        });
    });

    test('student login success', async () => {
        const mockProblem = { id: 1, title: 'Add Two Numbers' };
        api.getProblemByCode.mockResolvedValue(mockProblem);
        const onLogin = jest.fn();

        render(<LoginPage onLogin={onLogin} />);
        fireEvent.change(screen.getByPlaceholderText('First Last'), {
            target: { value: 'John Student' }
        });
        fireEvent.change(screen.getByPlaceholderText('6-digit code'), {
            target: { value: '123456' }
        });
        fireEvent.click(screen.getByText('Enter'));

        await waitFor(() => {
            expect(onLogin).toHaveBeenCalledWith({
                name: 'John Student',
                role: 'student',
                problem: mockProblem
            });
        });
    });

    test('student login fails with bad problem code', async () => {
        api.getProblemByCode.mockRejectedValue(new Error('Problem not found'));

        render(<LoginPage onLogin={jest.fn()} />);
        fireEvent.change(screen.getByPlaceholderText('First Last'), {
            target: { value: 'John Student' }
        });
        fireEvent.change(screen.getByPlaceholderText('6-digit code'), {
            target: { value: '999999' }
        });
        fireEvent.click(screen.getByText('Enter'));

        await waitFor(() => {
            expect(screen.getByText('No problem found with that code. Please check with your teacher and try again.')).toBeInTheDocument();
        });
    });

    test('switches to teacher login mode', () => {
        render(<LoginPage onLogin={jest.fn()} />);
        fireEvent.click(screen.getByText('Teacher Login →'));
        expect(screen.getByText('Teacher Sign In')).toBeInTheDocument();
    });

    test('teacher requests OTP successfully', async () => {
        api.requestOTP.mockResolvedValue();

        render(<LoginPage onLogin={jest.fn()} />);
        fireEvent.click(screen.getByText('Teacher Login →'));
        fireEvent.change(screen.getByPlaceholderText('you@school.edu'), {
            target: { value: 'teacher@school.edu' }
        });
        fireEvent.click(screen.getByText('Send Code'));

        await waitFor(() => {
            expect(screen.getByText('Enter the code sent to your email.')).toBeInTheDocument();
        });
    });

    test('teacher OTP verification success', async () => {
        api.requestOTP.mockResolvedValue();
        api.verifyOTP.mockResolvedValue({ token: 'abc123', role: 'teacher', email: 'teacher@school.edu' });
        const onLogin = jest.fn();

        render(<LoginPage onLogin={onLogin} />);
        fireEvent.click(screen.getByText('Teacher Login →'));
        fireEvent.change(screen.getByPlaceholderText('you@school.edu'), {
            target: { value: 'teacher@school.edu' }
        });
        fireEvent.click(screen.getByText('Send Code'));

        await waitFor(() => screen.getByText('Enter Code'));

        fireEvent.change(screen.getAllByRole('textbox')[0], {
            target: { value: '654321' }
        });
        fireEvent.click(screen.getByText('Verify Code'));

        await waitFor(() => {
            expect(onLogin).toHaveBeenCalled();
        });
    });

});