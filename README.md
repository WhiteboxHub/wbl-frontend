# Whitebox Learning

This repository contains the code for client of the Whitebox Learning.

## Live Demo

You can check out the live demo of this project [here](https://whiteboxhub.github.io/whiteboxLearning-wbl/).

## Installation and Usage

To run the project, follow these steps:

### Prerequisites

Before getting started, ensure you have the following installed on your system:

- Node.js (v12 or higher)
- npm (Node Package Manager)
- Git

# Clone the repository

```
git clone https://github.com/WhiteboxHub/whiteboxLearning-wbl.git
```

Navigate to the client directory

```bash
cd whiteboxLearning-wbl
```

# Install the dependencies

```bash
npm install
```

# Start the client

```bash
npm run dev
```

The client application will now be accessible in your web browser at `http://localhost:3000`.



#testing cicd 

# playwright install dependences

# 1. Install Playwright browsers and system dependencies (required for UI tests)--regression tests
npx playwright install --with-deps   

# 2. Start the Next.js local development server  (Terminal 1 start the app)
npm run dev  

# 3. Run all Playwright tests silently in the terminal  (Terminal 2  run the test)
npx playwright test 

# (Optional) If you want to see the browser actually open while testing:
npx playwright test --headed 

" we want check ui how it works use these commend " 

# 1. PERCOMMIT - HOOK  FOR (For macOS (Recommended):)
brew install pre-commit  

# 2. For Linux (or macOS without Homebrew):
pip3 install pre-commit

# PERCOMMIT - HOOK  FOR (windows)
1. Install the pre-commit framework globally (wbl-frontend) 
pip install pre-commit 

2. Install the pre-commit hooks into your local (wbl-frontend) 
pre-commit install   

note - Now, every time you run git commit, it will automatically format your code and run your Playwright pre-commit UI checks.

⚠️ CRITICAL REQUIREMENT FOR COMMITTING 
Because the pre-commit hook runs the UI tests, both your frontend (npm run dev) and your backend terminals must be actively running when you type git commit. If they are offline, the tests will fail and the commit will be blocked

### Git Commit & Push Workflow

The repository uses pre-commit hooks to check configuration sanity and run tests before allowing commits.

* *Standard Commit (Runs local tests and checks)*:
  bash
  git commit -m "your commit message"
  
* *Bypass / Skip tests in urgent situations*:
  bash
  git commit --no-verify -m "your commit message"
<!-- Triggering CI for benign run test -->
