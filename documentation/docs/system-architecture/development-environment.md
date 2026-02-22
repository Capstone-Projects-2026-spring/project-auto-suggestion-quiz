---
sidebar_position: 8
---

# Development Environment

This section describes the hardware and software requirements necessary for developing the Auto-Suggestion Quiz application. The development environment is designed to support cross-platform development while maintaining consistency across team members.

## Hardware Requirements

### Minimum Requirements
- **Storage**: 10 GB of free disk space for development tools, dependencies, and project files
- **Internet Connection**: Broadband internet connection for package downloads and API testing

### Recommended Requirements
- **Storage**: 20+ GB of free storage space
- **Internet Connection**: Broadband internet connection for package downloads and API testing

## Operating System

The application is a web-based project and can be developed on any modern operating system:
- **Windows**: Windows 10 or later
- **macOS**: macOS 10.15 (Catalina) or later
- **Linux**: Ubuntu 20.04 LTS or equivalent distributions

## Software Requirements

### Required Software

#### 1. Integrated Development Environment (IDE)

**Primary IDE: Visual Studio Code**
- **Version**: Latest stable release (1.85+)
- **Purpose**: Primary code editor for both frontend and backend development
- **Download**: https://code.visualstudio.com/

**Recommended VS Code Extensions**:
- Python - Python language support and IntelliSense
- React Developer Tools - React component debugging
- SQLite Viewer - Database inspection

**Alternative IDE: PyCharm**
- **Version**: PyCharm Community Edition 2023.2+
- **Purpose**: Optional IDE specifically for backend Python development
- **Download**: https://www.jetbrains.com/pycharm/
- **Note**: Some team members may prefer PyCharm for backend development

#### 2. Runtime Environments

**Node.js**
- **Version**: v18.x LTS or later
- **Purpose**: JavaScript runtime for React frontend development
- **Download**: https://nodejs.org/
- **Verification**: Run `node --version` and `npm --version` after installation

**Python**
- **Version**: Python 3.10 or later
- **Purpose**: Backend application runtime
- **Download**: https://www.python.org/downloads/
- **Verification**: Run `python --version` or `python3 --version` after installation

#### 3. Package Managers

**npm (Node Package Manager)**
- **Version**: Comes bundled with Node.js (v9.x or later)
- **Purpose**: Frontend dependency management
- **Usage**: 
  ```bash
  npm install          # Install dependencies
  npm start           # Start development server
  ```

**pip (Python Package Installer)**
- **Version**: Comes bundled with Python (v23.x or later)
- **Purpose**: Backend dependency management
- **Usage**:
  ```bash
  pip install -r requirements.txt    # Install dependencies
  pip install --break-system-packages <package>  # Install individual package
  ```

#### 4. Web Browsers

**Development Browsers**:
- **Google Chrome** (latest stable) - Primary development and testing browser
- **Mozilla Firefox** (latest stable) - Secondary testing browser
- **Safari** (latest stable, macOS only) - Cross-browser compatibility testing

**Browser Extensions for Development**:
- React Developer Tools

#### 5. Version Control

**Git**
- **Version**: 2.40 or later
- **Purpose**: Source code version control
- **Download**: https://git-scm.com/
- **Verification**: Run `git --version` after installation

#### 6. Database Tools

**SQLite**
- **Version**: 3.40 or later
- **Purpose**: Development and production database
- **Included**: SQLite support is built into Python

**Database Management Tool**:
- **DB Browser for SQLite**
  - **Download**: https://sqlitebrowser.org/
  - **Purpose**: Visual database inspection and management
- **SQLite Viewer VS Code Extension**
  - **Purpose**: In-editor database inspection

### Frontend Dependencies

The frontend uses the following key dependencies (managed via npm):

```json
{
  "dependencies": {
    "@monaco-editor/react": "^4.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  }
}
```

**Key Libraries**:
- **React**: v18.2.0 - UI component library
- **Monaco Editor**: v4.6.0 - Code editor component (VS Code's editor)
- **React Scripts**: v5.0.1 - Build and development tooling

### Backend Dependencies

The backend uses the following frameworks and libraries (managed via pip):

**Core Framework**:
- **FastAPI**: Latest stable version
  - Modern, high-performance web framework for building APIs
  - Built-in data validation with Pydantic
  - Automatic interactive API documentation (Swagger UI)

**Database**:
- **SQLite**: Database engine (built into Python)

**Development Tools** (TBD):
- **pytest**: Testing framework (to be confirmed)

## Development Tools Setup

### Initial Environment Setup Tasks

The following tasks should be completed as part of the initial development environment setup:

| Task | Description | Responsible | Status |
|------|-------------|------------|---------|
| Install Node.js and npm | Download and install Node.js LTS | All developers | ☐ |
| Install Python | Download and install Python 3.10+ | All developers | ☐ |
| Install Visual Studio Code | Download and install VS Code | All developers | ☐ |
| Install Git | Download and install Git | All developers | ☐ |
| Clone Repository | Clone project from GitHub | All developers | ☐ |
| Install Frontend Dependencies | Run `npm install` in frontend directory | All developers | ☐ |
| Install Backend Dependencies | Run `pip install` for backend packages | All developers | ☐ |
| Install VS Code Extensions | Install recommended extensions | All developers | ☐ |
| Install DB Browser for SQLite | Download and install database tool | All developers | ☐ |
| Verify Development Server | Run frontend and backend locally | All developers | ☐ |
| Configure Environment Variables | Set up .env files for local development | All developers | ☐ |

### Environment Configuration

**Frontend Environment Variables** (`.env` in frontend directory):
```
REACT_APP_API_URL=http://localhost:8000
```

**Backend Environment Variables** (`.env` in backend directory):
```
DATABASE_URL=sqlite:///./quiz.db
CORS_ORIGINS=http://localhost:3000
```

## Testing Tools

**Frontend Testing** (TBD):
- React Testing Library

**Backend Testing**:
- **pytest**: Python testing framework (to be confirmed and configured)

## Development Workflow

### Starting the Development Environment

**Frontend**:
```bash
cd frontend
npm install          # First time only
npm start           # Starts dev server on http://localhost:3000
```

**Backend**:
```bash
cd backend
pip install -r requirements.txt    # First time only
uvicorn main:app --reload         # Starts API server on http://localhost:8000
```

### Building for Production

**Frontend**:
```bash
cd frontend
npm run build       # Creates optimized production build in /build
```

**Backend**:
```bash
# Production deployment configuration TBD
```

### Communication and Project Management
- **Jira**: Issue tracking and project management
- **GitHub**: Code hosting and version control
- **Discord**: Team communication

## Environment Validation

To verify your development environment is properly configured, run the following checks:

```bash
# Check Node.js and npm
node --version    # Should show v18.x or later
npm --version     # Should show v9.x or later

# Check Python and pip
python --version  # Should show 3.10 or later
pip --version     # Should show 23.x or later

# Check Git
git --version     # Should show 2.40 or later

# Verify frontend dependencies
cd frontend
npm list --depth=0

# Verify backend dependencies
cd backend
pip list
```

## Troubleshooting

### Common Issues

**Port Conflicts**:
- Frontend default port: 3000
- Backend default port: 8000
- If ports are in use, modify the start scripts or kill the conflicting processes

**Dependency Installation Failures**:
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- For Python, use virtual environments to avoid conflicts

**Permission Issues**:
- On macOS/Linux, avoid using `sudo` with npm
- Use `pip install --user` or virtual environments for Python packages
