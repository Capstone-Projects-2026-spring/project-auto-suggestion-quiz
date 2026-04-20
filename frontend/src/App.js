import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProblemPage from './pages/ProblemPage';
import CreateProblemPage from './pages/CreateProblemPage';
import ReviewPage from './pages/ReviewPage';
import { getTeacherProblems, deleteProblem } from './api';

function restoreSession() {
    try {
        const token = localStorage.getItem('teacher_token');
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('teacher_token');
            return null;
        }
        return { token, email: payload.email, role: payload.role, id: payload.user_id };
    } catch {
        return null;
    }
}

function App() {
    const restoredUser = restoreSession();

    const [currentPage, setCurrentPage] = useState(restoredUser ? 'dashboard' : 'login');
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [studentName, setStudentName] = useState(null);
    const [user, setUser] = useState(restoredUser);
    const [problems, setProblems] = useState([]);
    const [problemsLoading, setProblemsLoading] = useState(false);
    const [problemsError, setProblemsError] = useState('');
    const [reviewTarget, setReviewTarget] = useState(null);
    const [autofillResult, setAutofillResult] = useState(null);

    const loadProblems = (token) => {
        setProblemsLoading(true);
        setProblemsError('');
        getTeacherProblems(token)
            .then((data) => { setProblems(data); setProblemsLoading(false); })
            .catch((err) => { setProblemsError(err.message); setProblemsLoading(false); });
    };

    useEffect(() => {
        if (user?.token && currentPage === 'dashboard') {
            loadProblems(user.token);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, currentPage]);

    const handleLogin = (userData) => {
        setUser(userData);
        if (userData.token) {
            localStorage.setItem('teacher_token', userData.token);
        }
        if (userData.role === 'student') {
            setSelectedProblem(userData.problem);
            setStudentName(userData.studentName);
            setCurrentPage('problem');
        } else {
            setCurrentPage('dashboard');
        }
    };

    const handleBackToDashboard = () => {
        if (!user?.token) {
            // Student — no teacher session, return to login
            setSelectedProblem(null);
            setStudentName(null);
            setCurrentPage('login');
        } else {
            setCurrentPage('dashboard');
            setSelectedProblem(null);
            loadProblems(user.token);
        }
    };

    const handleCreateProblem = () => {
        setCurrentPage('createProblem');
    };

    const handleProblemCreated = (newProblem) => {
        setProblems((prev) => [newProblem, ...prev]);
        setCurrentPage('dashboard');
    };

    const handleDeleteProblem = async (problemId) => {
        try {
            await deleteProblem(problemId, user.token);
            setProblems((prev) => prev.filter((p) => p.id !== problemId));
        } catch (err) {
            console.error('Failed to delete problem:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('teacher_token');
        setUser(null);
        setSelectedProblem(null);
        setStudentName(null);
        setProblems([]);
        setCurrentPage('login');
    };

    if (currentPage === 'login') {
        return <LoginPage onLogin={handleLogin} />;
    }

    if (reviewTarget) {
        return (
            <ReviewPage
                submission={reviewTarget.submission}
                allSubmissions={reviewTarget.allSubmissions}
                problem={reviewTarget.problem}
                onBack={() => setReviewTarget(null)}
                token={user?.token}
            />
        );
    }

    if (currentPage === 'problem' && selectedProblem) {
        return (
            <ProblemPage
                problem={selectedProblem}
                studentName={studentName}
                onBack={handleBackToDashboard}
            />
        );
    }

    if (currentPage === 'createProblem') {
        return (
            <CreateProblemPage
                onBack={handleBackToDashboard}
                onCreated={handleProblemCreated}
                autofillResult={autofillResult}
                onAutofillConsumed={() => setAutofillResult(null)}
                onAutofillReady={(data) => setAutofillResult(data)}
            />
        );
    }

    return (
        <Dashboard
            problems={problems}
            problemsLoading={problemsLoading}
            problemsError={problemsError}
            onCreateProblem={handleCreateProblem}
            onDeleteProblem={handleDeleteProblem}
            onProblemsUpdate={setProblems}
            onRefresh={() => loadProblems(user.token)}
            onReview={(submission, problem, allSubmissions) => setReviewTarget({ submission, problem, allSubmissions })}
            onLogout={handleLogout}
            user={user}
            autofillPending={autofillResult !== null}
        />
    );
}

export default App;