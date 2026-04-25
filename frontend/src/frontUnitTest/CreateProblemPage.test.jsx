import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateProblemPage from '../pages/CreateProblemPage';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../api', () => ({
    createProblem: jest.fn(),
}));

jest.mock('../constants', () => ({
    AVAILABLE_LANGUAGES: [
        { key: 'python', label: 'Python' },
        { key: 'javascript', label: 'Javascript' },
    ],
}));

const mockOnBack = jest.fn();
const mockOnCreated = jest.fn();
const mockOnAutofillConsumed = jest.fn();
const mockOnAutofillReady = jest.fn();

const defaultProps = {
    onBack: mockOnBack,
    onCreated: mockOnCreated,
    autofillResult: null,
    onAutofillConsumed: mockOnAutofillConsumed,
    onAutofillReady: mockOnAutofillReady,
};

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
});

// Rendering
test('renders without crashing', () => {
    render(<CreateProblemPage {...defaultProps} />);
});

test('renders the logo', () => {
    render(<CreateProblemPage {...defaultProps} />);
    expect(screen.getByText('AutoSuggestion Quiz')).toBeInTheDocument();
});

test('renders Create New Problem heading', () => {
    render(<CreateProblemPage {...defaultProps} />);
    expect(screen.getByText('Create New Problem')).toBeInTheDocument();
});

test('renders back to dashboard button', () => {
    render(<CreateProblemPage {...defaultProps} />);
    expect(screen.getByText('← Dashboard')).toBeInTheDocument();
});

test('calls onBack when Dashboard button is clicked', () => {
    render(<CreateProblemPage {...defaultProps} />);
    fireEvent.click(screen.getByText('← Dashboard'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
});

// Step indicator

test('renders all step labels in indicator', () => {
    render(<CreateProblemPage {...defaultProps} />);
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Languages')).toBeInTheDocument();
    expect(screen.getByText('Sections')).toBeInTheDocument();
    expect(screen.getByText('Test Cases')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
});

// Step 1 Details

test('renders title and description fields on step 1', () => {
    render(<CreateProblemPage {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Two Sum/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe the problem/)).toBeInTheDocument();
});

test('shows error when Next is clicked with no title', async () => {
    render(<CreateProblemPage {...defaultProps} />);
    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
});

test('shows error when Next is clicked with no description', async () => {
    render(<CreateProblemPage {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Two Sum/), { target: { value: 'My Problem' } });
    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText('Description is required.')).toBeInTheDocument();
});

test('advances to step 2 when Details are valid', () => {
    render(<CreateProblemPage {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Two Sum/), { target: { value: 'My Problem' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe the problem/), { target: { value: 'A description' } });
    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText('Allowed Languages')).toBeInTheDocument();
});

//Step 2 Languages

const goToStep2 = () => {
    fireEvent.change(screen.getByPlaceholderText(/Two Sum/), { target: { value: 'My Problem' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe the problem/), { target: { value: 'A description' } });
    fireEvent.click(screen.getByText('Next →'));
};

test('renders language checkboxes on step 2', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep2();
    expect(screen.getByLabelText('Python')).toBeInTheDocument();
    expect(screen.getByLabelText('Javascript')).toBeInTheDocument();
});

test('all languages are selected by default', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep2();
    expect(screen.getByLabelText('Python')).toBeChecked();
    expect(screen.getByLabelText('Javascript')).toBeChecked();
});

test('can deselect a language', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep2();
    fireEvent.click(screen.getByLabelText('Javascript'));
    expect(screen.getByLabelText('Javascript')).not.toBeChecked();
});

test('cannot deselect last remaining language', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep2();
    fireEvent.click(screen.getByLabelText('Javascript'));
    fireEvent.click(screen.getByLabelText('Python'));
    expect(screen.getByLabelText('Python')).toBeChecked();
});

test('Back button on step 2 returns to step 1', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep2();
    fireEvent.click(screen.getByText('← Back'));
    expect(screen.getByText('Problem Details')).toBeInTheDocument();
});

// Step 3 sections

const goToStep3 = () => {
    goToStep2();
    fireEvent.click(screen.getByText('Next →'));
};

test('renders sections step', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep3();
    expect(screen.getByText('+ Add Section')).toBeInTheDocument();
});

test('starts with one blank section', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep3();
    expect(screen.getAllByPlaceholderText(/Section label/).length).toBe(1);
});

test('can add a new section', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep3();
    fireEvent.click(screen.getByText('+ Add Section'));
    expect(screen.getAllByPlaceholderText(/Section label/).length).toBe(2);
});

test('can remove a section when more than one exists', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep3();
    fireEvent.click(screen.getByText('+ Add Section'));
    const removeBtns = screen.getAllByTitle('Remove section');
    fireEvent.click(removeBtns[0]);
    expect(screen.getAllByPlaceholderText(/Section label/).length).toBe(1);
});

test('shows error when section label is empty on Next', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep3();
    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText('Every section needs a label.')).toBeInTheDocument();
});

test('advances to step 4 when sections are valid', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep3();
    fireEvent.change(screen.getByPlaceholderText(/Section label/), { target: { value: 'Solution' } });
    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText('+ Add Test Case')).toBeInTheDocument();
});

//Step 4 Test Cases

const goToStep4 = () => {
    goToStep3();
    fireEvent.change(screen.getByPlaceholderText(/Section label/), { target: { value: 'Solution' } });
    fireEvent.click(screen.getByText('Next →'));
};

test('renders test cases step', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep4();
    expect(screen.getByText('+ Add Test Case')).toBeInTheDocument();
});

test('starts with one blank test case', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep4();
    expect(screen.getAllByPlaceholderText('Input').length).toBe(1);
});

test('can add a test case', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep4();
    fireEvent.click(screen.getByText('+ Add Test Case'));
    expect(screen.getAllByPlaceholderText('Input').length).toBe(2);
});

test('can remove a test case when more than one exists', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep4();
    fireEvent.click(screen.getByText('+ Add Test Case'));
    fireEvent.click(screen.getAllByText('×')[0]);
    expect(screen.getAllByPlaceholderText('Input').length).toBe(1);
});

//Step 5 Settings

const goToStep5 = () => {
    goToStep4();
    fireEvent.click(screen.getByText('Next →'));
};

test('renders settings step', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep5();
    expect(screen.getByText('Allow Copy & Paste')).toBeInTheDocument();
    expect(screen.getByText('Track Tab Switching')).toBeInTheDocument();
});

test('Allow Copy and Paste toggle is on by default', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep5();
    expect(screen.getByLabelText('Toggle copy and paste')).toHaveClass('toggle-on');
});

test('Track Tab Switching toggle is off by default', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep5();
    expect(screen.getByLabelText('Toggle tab switching tracking')).toHaveClass('toggle-off');
});

test('can toggle Allow Copy and Paste off', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep5();
    fireEvent.click(screen.getByLabelText('Toggle copy and paste'));
    expect(screen.getByLabelText('Toggle copy and paste')).toHaveClass('toggle-off');
});

test('can toggle Track Tab Switching on', () => {
    render(<CreateProblemPage {...defaultProps} />);
    goToStep5();
    fireEvent.click(screen.getByLabelText('Toggle tab switching tracking'));
    expect(screen.getByLabelText('Toggle tab switching tracking')).toHaveClass('toggle-on');
});

// Submission

test('calls createProblem and shows success on Create Problem', async () => {
    const { createProblem } = require('../api');
    createProblem.mockResolvedValue({ access_code: '123456' });

    render(<CreateProblemPage {...defaultProps} />);
    goToStep5();
    fireEvent.click(screen.getByText('Create Problem'));

    await waitFor(() => expect(screen.getByText('Problem created successfully!')).toBeInTheDocument());
    expect(screen.getByText('123456')).toBeInTheDocument();
    expect(mockOnCreated).toHaveBeenCalledTimes(1);
});

test('shows error when createProblem API fails', async () => {
    const { createProblem } = require('../api');
    createProblem.mockRejectedValue(new Error('Server error'));

    render(<CreateProblemPage {...defaultProps} />);
    goToStep5();
    fireEvent.click(screen.getByText('Create Problem'));

    await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument());
});

test('Back to Dashboard button shown after successful creation', async () => {
    const { createProblem } = require('../api');
    createProblem.mockResolvedValue({ access_code: '123456' });

    render(<CreateProblemPage {...defaultProps} />);
    goToStep5();
    fireEvent.click(screen.getByText('Create Problem'));

    await waitFor(() => screen.getByText('Back to Dashboard'));
    fireEvent.click(screen.getByText('Back to Dashboard'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
});

//Autofill

test('renders Auto-fill button', () => {
    render(<CreateProblemPage {...defaultProps} />);
    expect(screen.getByText('Auto-fill from notes')).toBeInTheDocument();
});

test('opens autofill modal when Auto-fill button is clicked', () => {
    render(<CreateProblemPage {...defaultProps} />);
    fireEvent.click(screen.getByText('Auto-fill from notes'));
    expect(screen.getByText('Auto-fill from notes', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('Generate in Background')).toBeInTheDocument();
});

test('closes autofill modal when Cancel is clicked', () => {
    render(<CreateProblemPage {...defaultProps} />);
    fireEvent.click(screen.getByText('Auto-fill from notes'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Generate in Background')).not.toBeInTheDocument();
});

test('shows error in autofill modal when text is too short', () => {
    render(<CreateProblemPage {...defaultProps} />);
    fireEvent.click(screen.getByText('Auto-fill from notes'));
    fireEvent.click(screen.getByText('Generate in Background'));
    expect(screen.getByText('Please provide more detail before generating.')).toBeInTheDocument();
});

test('applies autofillResult when provided as prop', () => {
    const autofillResult = {
        title: 'Autofilled Title',
        description: 'Autofilled Description',
        languages: ['python'],
        sections: [{ label: 'Solution', code: { python: 'pass' }, suggestions: [], order: 1 }],
        testCases: [],
    };
    render(<CreateProblemPage {...defaultProps} autofillResult={autofillResult} />);
    expect(screen.getByDisplayValue('Autofilled Title')).toBeInTheDocument();
    expect(mockOnAutofillConsumed).toHaveBeenCalledTimes(1);
});