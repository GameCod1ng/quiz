@echo off
rem ============================================================
rem  D:\quiz Git setup (double-click to run)
rem  Flow: check git -> git init -> make 5 commits, one per file
rem ============================================================
cd /d "%~dp0"

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git is not installed. Install it from https://git-scm.com and run again.
  pause
  exit /b 1
)

if exist ".git" (
  echo [INFO] .git already exists. Nothing to do.
  pause
  exit /b 0
)

git init -b main

git add questions.json
git commit -m "Add questions.json with 10 quiz questions"

git add index.html
git commit -m "Add index.html: start, quiz and result screens"

git add style.css
git commit -m "Add style.css: card layout and answer colors"

git add app.js
git commit -m "Add app.js: fetch, scoring, wrong-answer notes, retry"

git add README.md .gitignore
git commit -m "Add README and .gitignore"

echo.
echo [DONE] Git setup finished. Commit history:
git log --oneline
echo.
pause
