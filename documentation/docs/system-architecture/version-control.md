---
sidebar_position: 5
---

# Version Control

This section describes the version control strategy, tools, and procedures used to maintain the Auto-Suggestion Quiz project codebase and ensure effective collaboration among team members.

## Version Control System

### Git
- **Version**: 2.40 or later
- **Purpose**: Distributed version control system for tracking code changes
- **Download**: https://git-scm.com/

## Repository Structure

The project follows a monorepo structure with separate directories for different components:

```
project-auto-suggestion-quiz/
├── .devcontainer/            # Development container configuration
├── .git/                     # Git repository data
├── .github/                  # GitHub-specific configurations
│   └── workflows/           # GitHub Actions CI/CD workflows
├── frontend/                 # React frontend application
│   ├── node_modules/        # Frontend dependencies (not in git)
│   ├── public/              # Static assets
│   ├── src/                 # Source code
│   ├── package-lock.json    # Locked dependency versions
│   └── package.json         # Frontend dependencies and scripts
├── backend/                  # Python FastAPI backend 
│   ├── src/                 # Source code (Python files)
│   ├── requirements.txt     # Backend dependencies
│   └── venv/                # Virtual environment (not in git)
├── documentation/            # Project documentation (Docusaurus)
│   ├── docs/                # Documentation source files
│   ├── src/                 # Custom documentation components
│   ├── static/              # Static documentation assets
│   ├── package.json         # Documentation dependencies
│   └── docusaurus.config.js # Documentation configuration
├── .gitignore               # Root-level ignore rules
└── README.md                # Project overview
```

## Git Configuration

### Repository Clone

```bash
# Clone the repository
git clone https://github.com/[organization]/project-auto-suggestion-quiz.git

# Navigate to project directory
cd project-auto-suggestion-quiz

# Verify remote configuration
git remote -v
```

## Branching Strategy

The project follows a **Feature Branch Workflow** with protected main branch:

### Branch Types

1. **`main` Branch**
   - **Purpose**: Production-ready code
   - **Protection**: Protected branch, requires pull request reviews
   - **Naming**: `main`
   - **Merging**: Only through approved pull requests

2. **Feature Branches**
   - **Purpose**: New features and enhancements
   - **Naming Convention**: `feature/<brief-description>`
   - **Example**: `feature/user-authentication`
   - **Base Branch**: Created from `main`
   - **Lifespan**: Deleted after merging

3. **Bugfix Branches**
   - **Purpose**: Bug fixes
   - **Naming Convention**: `bugfix/<brief-description>`
   - **Example**: `bugfix/fix-quiz-popup`
   - **Base Branch**: Created from `main`

4. **Documentation Branches**
   - **Purpose**: Documentation updates
   - **Naming Convention**: `docs/<brief-description>`
   - **Example**: `docs/update-api-docs`

## Workflow Procedures

### Creating a New Feature

1. **Create and Switch to Feature Branch**
   ```bash
   # Update main branch
   git checkout main
   git pull origin main
   
   # Create new feature branch
   git checkout -b feature/add-quiz-module
   ```

2. **Make Changes and Commit**
   ```bash
   # Stage specific files
   git add frontend/src/components/Quiz.js
   
   # Or stage all changes
   git add .
   
   # Commit with descriptive message
   git commit -m "Add AI suggestion prompt to quiz"
   ```

3. **Push Branch to Remote**
   ```bash
   # First push of new branch
   git push -u origin feature/add-quiz-module
   
   # Subsequent pushes
   git push
   ```

4. **Create Pull Request**
   - Navigate to GitHub repository
   - Click "Pull Requests" → "New Pull Request"
   - Select your feature branch
   - Assign reviewers
   - Add appropriate labels

### Pull Request Requirements

**Before Creating a Pull Request**:
- [ ] Code builds successfully without errors
- [ ] All tests pass (when testing framework is established)
- [ ] Code follows project style guidelines
- [ ] No console errors or warnings
- [ ] Documentation updated if needed

**Pull Request Template**:
```markdown
## Description
Brief description of changes

## Testing
Describe testing performed

## Screenshots (if applicable)
Add screenshots of UI changes

## Checklist
- [ ] Code builds successfully
- [ ] No console errors
- [ ] Documentation updated
```

### Code Review Process

**Review Requirements**:
- Minimum **1 peer review** required before merging
- Reviewers should check:
  - Code quality and style consistency
  - Functionality matches requirements
  - No introduction of bugs or security issues
  - Appropriate test coverage
  - Clear and maintainable code

**Reviewer Responsibilities**:
```bash
# Fetch all branches
git fetch origin

# Checkout PR branch locally for testing
git checkout feature/add-quiz-module

# Test the changes
cd frontend
npm start  # For frontend changes

cd backend
python -m uvicorn main:app --reload  # For backend changes

# Return to main branch
git checkout main
```

**Review Outcomes**:
- **Approve**: Changes look good, ready to merge
- **Request Changes**: Issues found, needs revision
- **Comment**: Questions or suggestions without blocking merge

### Merging Pull Requests

**Steps**:
1. Ensure all review requirements are met
2. Resolve any merge conflicts
3. Click "Squash and Merge" on GitHub
4. Edit commit message if needed
5. Confirm merge
6. Delete feature branch (GitHub will prompt)

**Post-Merge**:
```bash
# Update local main branch
git checkout main
git pull origin main

# Delete local feature branch
git branch -d feature/add-quiz-module
```

## Commit Message Guidelines

### Format
```
<type>: <subject>

<optional body>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **test**: Adding or updating tests

## Protected Branch Rules

### Main Branch Protection

The `main` branch has the following protections enabled on GitHub:

- **Require pull request reviews before merging**
  - Minimum 1 approval required
  - Dismiss stale reviews when new commits are pushed
  
- **Require status checks to pass**
  - All tests must pass (when implemented)
  - Branch must be up to date with main before merging

- **Require conversation resolution**
  - All PR comments must be resolved

- **No direct pushes**
  - All changes must go through pull requests
  - Protects against accidental overwrites

- **No force pushes**
  - Prevents history rewriting on main branch

## .gitignore Configuration

The project uses `.gitignore` files to exclude unnecessary files from version control:

### Root .gitignore
```gitignore
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Generated files
.docusaurus

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
Thumbs.db

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/

# Database
*.db
*.sqlite
*.sqlite3
```

## GitHub Integration

### GitHub Actions (CI/CD)

The project uses GitHub Actions for continuous integration (configuration in `.github/workflows/`):

**Existing Workflows**:
- **Documentation Deploy** (`deploy.yml`): Auto-deploy documentation on merge to main
- **Unlighthouse**: Automated documentation quality checks

**Potential Future Workflows**:
- **Build and Test**: Run on every push and PR
- **Code Quality**: Linting and formatting checks