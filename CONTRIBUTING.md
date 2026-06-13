# Contributing to SwarmAnalyst

Thank you for your interest in contributing to SwarmAnalyst! This is an open-source project designed to provide an enterprise-grade multi-agent SQL data analyst workspace and investigation environment. We welcome contributions from the community to improve features, fix bugs, optimize performance, and expand documentation.

---

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Development Environment Setup](#development-environment-setup)
   - [Prerequisites](#prerequisites)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
   - [Tauri Desktop App Setup](#tauri-desktop-app-setup)
3. [Our Workflow](#our-workflow)
   - [1. Find or Create an Issue](#1-find-or-create-an-issue)
   - [2. Fork & Create a Branch](#2-fork--create-a-branch)
   - [3. Implementing Changes](#3-implementing-changes)
   - [4. Testing Your Changes](#4-testing-your-changes)
   - [5. Submit a Pull Request](#5-submit-a-pull-request)
4. [Coding Standards](#coding-standards)

---

## Development Environment Setup

### Prerequisites
To build and run the entire application (including the Tauri desktop wrapper), you will need:
- **Python 3.10+**
- **Node.js 18+** & `npm`
- **Rust/Cargo** (via `rustup`)
- **Windows Build Tools** (C++ Build Tools / MSVC Compiler) — *Required for building the Tauri app on Windows*

---

### Backend Setup (FastAPI)

1. Clone your fork and navigate to the project directory:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sql_data_analyst.git
   cd sql_data_analyst
   ```

2. Create a Python virtual environment:
   ```bash
   python -m venv .venv
   ```

3. Activate the virtual environment:
   - **Windows (PowerShell)**: `.venv\Scripts\Activate.ps1`
   - **Windows (CMD)**: `.venv\Scripts\activate.bat`
   - **Linux/macOS**: `source .venv/bin/activate`

4. Install the backend in editable mode with development dependencies:
   ```bash
   pip install -e .[dev]
   ```

5. Run the FastAPI development server:
   ```bash
   uvicorn server.app:app --reload --port 8000
   ```

---

### Frontend Setup (Vite + React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

### Tauri Desktop App Setup

1. Make sure you are in the project root (`sql_data_analyst/`).
2. Package the Python backend as a sidecar binary executable:
   ```bash
   python backend/package_app.py
   ```
   *Note: This generates a PyInstaller standalone executable inside `src-tauri/binaries/` suitable for your current platform.*

3. Start the Tauri app in development mode:
   ```bash
   npx @tauri-apps/cli dev
   ```

4. Build production installer setups (`.msi` / `.exe`):
   ```bash
   npx @tauri-apps/cli build
   ```

---

## Our Workflow

### 1. Find or Create an Issue
Before writing code, please search the open issues to see if someone is already working on it. If not, open a new issue detailing the bug or feature request.

### 2. Fork & Create a Branch
Fork the repository on GitHub and clone it locally. Create a branch for your feature or bug fix:
```bash
git checkout -b feature/my-cool-feature
# or
git checkout -b bugfix/fix-broken-query
```

### 3. Implementing Changes
- Keep changes minimal and focused on the target issue.
- Maintain formatting and style conventions.
- If you're adding python dependencies, update `pyproject.toml` and rebuild/test.

### 4. Testing Your Changes
Make sure the existing test suite passes before submitting your changes.
- **Python Tests**: Run `python run_tests.py` or `python test_local.py`.
- **Lints**: Check for lint errors or static analyzer warnings.

### 5. Submit a Pull Request
1. Push your branch to GitHub:
   ```bash
   git push origin feature/my-cool-feature
   ```
2. Open a Pull Request (PR) from your fork to our `master` branch.
3. Fill out the PR template, referencing the target issue number.
4. Wait for review and approval from the maintainers.

---

## Coding Standards

- **Python**: Follow [PEP 8](https://peps.python.org/pep-0008/) style guidelines. Use typing hints where applicable.
- **Frontend**: Use TypeScript and React functional components. Keep component styling clean, utilizing Tailwind CSS classes.
- **Commits**: Write clear, descriptive commit messages (e.g. `feat: add Google Auth gate`, `fix: resolve DuckDB quantile float cast issue`).
