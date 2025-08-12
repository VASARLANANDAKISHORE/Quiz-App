# QuizMaster – Static Quiz App

A responsive, accessible quiz app built with vanilla HTML, CSS, and JavaScript. No build tools required. Designed to work perfectly on GitHub Pages.

## Quick start

1. Open `index.html` in your browser, or
2. Serve locally:

```bash
cd /home/chiru/Desktop/Quiz_App
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Features

- Responsive glassmorphism UI with light/dark themes
- Keyboard navigation and ARIA live announcements
- Progress bar, instant feedback, final review
- LocalStorage best score tracking
- Share button with Web Share API or clipboard fallback

## Deploy to GitHub Pages

1. Create a new GitHub repository and push this folder's contents.
2. In your repo settings, enable GitHub Pages:
   - Source: `Deploy from a branch`
   - Branch: `main` (or `master`), folder: `/ (root)`
3. Your site will be available at: `https://<username>.github.io/<repo>/`

No additional configuration is needed because this is a static site using only relative paths. 