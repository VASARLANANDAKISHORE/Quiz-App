(function () {
  "use strict";

  // ---------- Quiz Data ----------
  /**
   * Each question uses:
   * - id: string
   * - text: string
   * - choices: string[]
   * - answerIndex: number
   * - explanation?: string
   */
  const QUESTIONS = [
    {
      id: "q1",
      text: "Which language runs in a web browser?",
      choices: ["Java", "C", "Python", "JavaScript"],
      answerIndex: 3,
      explanation: "JavaScript is the native language of modern web browsers.",
    },
    {
      id: "q2",
      text: "What does CSS stand for?",
      choices: [
        "Computer Style Sheets",
        "Cascading Style Sheets",
        "Creative Style System",
        "Colorful Style Syntax",
      ],
      answerIndex: 1,
    },
    {
      id: "q3",
      text: "Inside which HTML element do we put the JavaScript?",
      choices: ["<javascript>", "<script>", "<js>", "<code>"],
      answerIndex: 1,
    },
    {
      id: "q4",
      text: "What keyword creates a constant in JavaScript?",
      choices: ["var", "let", "const", "constant"],
      answerIndex: 2,
    },
    {
      id: "q5",
      text: "Which HTML attribute is used to define inline styles?",
      choices: ["font", "style", "class", "styles"],
      answerIndex: 1,
    },
    {
      id: "q6",
      text: "Which of the following is NOT a JavaScript data type?",
      choices: ["String", "Boolean", "Float", "Undefined"],
      answerIndex: 2,
      explanation: 'JavaScript uses the Number type for both integers and floats.',
    },
    {
      id: "q7",
      text: "Which method converts a JSON string to an object?",
      choices: ["JSON.object()", "JSON.parse()", "JSON.stringify()", "JSON.toObject()"],
      answerIndex: 1,
    },
    {
      id: "q8",
      text: "Which CSS property controls text size?",
      choices: ["font-weight", "text-style", "font-size", "text-size"],
      answerIndex: 2,
    },
    {
      id: "q9",
      text: "What does DOM stand for?",
      choices: [
        "Document Object Model",
        "Display Object Management",
        "Digital Ordinance Model",
        "Desktop Oriented Mode",
      ],
      answerIndex: 0,
    },
    {
      id: "q10",
      text: "Which symbol is used for comments in CSS?",
      choices: ["// comment", "<!-- comment -->", "/* comment */", "# comment"],
      answerIndex: 2,
    },
  ];

  // ---------- DOM Elements ----------
  const htmlEl = document.documentElement;
  const appEl = document.getElementById("app");

  const startScreenEl = document.getElementById("start-screen");
  const quizScreenEl = document.getElementById("quiz-screen");
  const resultScreenEl = document.getElementById("result-screen");

  const startBtn = document.getElementById("startBtn");
  const nextBtn = document.getElementById("nextBtn");
  const retryBtn = document.getElementById("retryBtn");
  const shareBtn = document.getElementById("shareBtn");
  const themeToggleBtn = document.getElementById("themeToggle");

  const bestScoreEl = document.getElementById("bestScore");
  const progressFillEl = document.getElementById("progressFill");
  const questionIndexEl = document.getElementById("questionIndex");
  const questionTotalEl = document.getElementById("questionTotal");
  const questionTextEl = document.getElementById("questionText");
  const choicesListEl = document.getElementById("choicesList");
  const feedbackEl = document.getElementById("feedback");
  const liveRegionEl = document.getElementById("liveRegion");

  const finalScoreEl = document.getElementById("finalScore");
  const scoreRemarkEl = document.getElementById("scoreRemark");
  const reviewListEl = document.getElementById("reviewList");
  const confettiContainerEl = document.getElementById("confetti");

  // ---------- App State ----------
  const TOTAL_QUESTIONS = 10;
  let shuffledQuestions = [];
  let currentQuestionIndex = 0;
  let selectedChoiceIndex = null;
  let numCorrect = 0;
  const userAnswers = [];

  // ---------- Utilities ----------
  function shuffleArray(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function setScreen(screenId) {
    for (const section of appEl.querySelectorAll(".screen")) {
      section.classList.remove("is-active");
    }
    const target = document.getElementById(screenId);
    target.classList.add("is-active");
  }

  function speakLive(message) {
    liveRegionEl.textContent = "";
    // Force update
    setTimeout(() => {
      liveRegionEl.textContent = message;
    }, 10);
  }

  function saveBestScoreIfHigher(score, total) {
    try {
      const key = "quizmaster_best";
      const current = localStorage.getItem(key);
      const best = current ? Number(current) : 0;
      const percent = Math.round((score / total) * 100);
      if (percent > best) {
        localStorage.setItem(key, String(percent));
      }
    } catch {}
  }

  function readBestScore() {
    try {
      const key = "quizmaster_best";
      const current = localStorage.getItem(key);
      return current ? Number(current) : null;
    } catch {
      return null;
    }
  }

  function setTheme(theme) {
    htmlEl.setAttribute("data-theme", theme);
    themeToggleBtn.querySelector(".icon").textContent = theme === "dark" ? "☀️" : "🌙";
    try { localStorage.setItem("quizmaster_theme", theme); } catch {}
  }

  function initTheme() {
    let theme = "light";
    try {
      theme = localStorage.getItem("quizmaster_theme") || theme;
    } catch {}
    // Respect prefers-color-scheme if nothing saved
    if (!localStorage.getItem("quizmaster_theme") && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
    setTheme(theme);
  }

  function createChoiceElement(index, text) {
    const li = document.createElement("li");
    li.className = "choice";
    li.setAttribute("role", "option");
    li.setAttribute("tabindex", "0");
    li.setAttribute("aria-selected", "false");
    li.dataset.index = String(index);

    const key = document.createElement("span");
    key.className = "choice-key";
    key.textContent = String.fromCharCode(65 + index);

    const label = document.createElement("span");
    label.className = "choice-label";
    label.textContent = text;

    li.appendChild(key);
    li.appendChild(label);

    li.addEventListener("click", onChoiceClick);
    li.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        onChoiceClick.call(li, ev);
      }
      if (ev.key === "ArrowDown" || ev.key === "ArrowRight") {
        ev.preventDefault();
        moveChoiceFocus(1);
      }
      if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") {
        ev.preventDefault();
        moveChoiceFocus(-1);
      }
    });

    return li;
  }

  function moveChoiceFocus(direction) {
    const items = Array.from(choicesListEl.querySelectorAll(".choice"));
    if (!items.length) return;
    const current = document.activeElement && items.indexOf(document.activeElement);
    const nextIndex = current >= 0 ? (current + direction + items.length) % items.length : 0;
    items[nextIndex].focus();
  }

  function onChoiceClick(ev) {
    const li = this instanceof HTMLElement ? this : ev.currentTarget;
    if (!(li instanceof HTMLElement)) return;
    const index = Number(li.dataset.index);
    selectedChoiceIndex = index;

    for (const item of choicesListEl.children) {
      item.setAttribute("aria-selected", "false");
    }
    li.setAttribute("aria-selected", "true");

    nextBtn.disabled = false;
    feedbackEl.innerHTML = "";
  }

  function renderQuestion() {
    const q = shuffledQuestions[currentQuestionIndex];
    questionIndexEl.textContent = String(currentQuestionIndex + 1);
    questionTotalEl.textContent = String(shuffledQuestions.length);
    questionTextEl.textContent = q.text;

    const progress = Math.round(((currentQuestionIndex) / shuffledQuestions.length) * 100);
    progressFillEl.style.width = `${progress}%`;

    choicesListEl.innerHTML = "";
    selectedChoiceIndex = null;
    nextBtn.disabled = true;
    feedbackEl.innerHTML = "";

    q.choices.forEach((choiceText, i) => {
      const li = createChoiceElement(i, choiceText);
      choicesListEl.appendChild(li);
    });

    // Announce question
    speakLive(`Question ${currentQuestionIndex + 1} of ${shuffledQuestions.length}`);
  }

  function gradeCurrentQuestion() {
    const q = shuffledQuestions[currentQuestionIndex];
    const isCorrect = selectedChoiceIndex === q.answerIndex;

    // Mark choices
    const items = choicesListEl.querySelectorAll(".choice");
    items.forEach((el, idx) => {
      if (idx === q.answerIndex) el.classList.add("correct");
      if (selectedChoiceIndex != null && idx === selectedChoiceIndex && idx !== q.answerIndex) {
        el.classList.add("incorrect");
      }
      el.setAttribute("tabindex", "-1");
      el.style.cursor = "default";
      el.onclick = null;
    });

    if (isCorrect) {
      numCorrect += 1;
      feedbackEl.innerHTML = `<span class="good">Correct!</span> ${q.explanation ? q.explanation : ""}`;
    } else {
      const correctText = q.choices[q.answerIndex];
      feedbackEl.innerHTML = `<span class="bad">Incorrect.</span> Correct answer: <strong>${correctText}</strong>${q.explanation ? ` — ${q.explanation}` : ""}`;
    }

    userAnswers.push({ questionId: q.id, selectedIndex: selectedChoiceIndex, correctIndex: q.answerIndex, text: q.text, choices: q.choices });
  }

  function finishQuiz() {
    setScreen("result-screen");

    const total = shuffledQuestions.length;
    finalScoreEl.textContent = `${numCorrect}/${total}`;

    const percent = Math.round((numCorrect / total) * 100);
    let remark = "Nice try! Keep practicing.";
    if (percent === 100) remark = "Perfect score! You're unstoppable.";
    else if (percent >= 80) remark = "Excellent work!";
    else if (percent >= 60) remark = "Good job! Almost there.";
    scoreRemarkEl.textContent = remark;

    reviewListEl.innerHTML = "";
    userAnswers.forEach((ua, i) => {
      const wrapper = document.createElement("div");
      wrapper.className = "review-item";

      const q = document.createElement("p");
      q.className = "review-q";
      q.textContent = `${i + 1}. ${ua.text}`;

      const a = document.createElement("p");
      a.className = "review-a";
      const your = ua.selectedIndex === ua.correctIndex ? "<span class=\"correct\">Your answer was correct</span>" : `Your answer: <span class=\"you\">${ua.choices[ua.selectedIndex] ?? "—"}</span>`;
      const correct = `Correct answer: <span class=\"correct\">${ua.choices[ua.correctIndex]}</span>`;
      a.innerHTML = `${your} • ${correct}`;

      wrapper.appendChild(q);
      wrapper.appendChild(a);
      reviewListEl.appendChild(wrapper);
    });

    saveBestScoreIfHigher(numCorrect, total);
    renderBestScore();

    // Confetti celebration for >= 60%
    if (percent >= 60) launchConfetti();
  }

  function renderBestScore() {
    const best = readBestScore();
    bestScoreEl.textContent = best != null ? `${best}%` : "—";
  }

  function startQuiz() {
    shuffledQuestions = shuffleArray(QUESTIONS).slice(0, TOTAL_QUESTIONS);
    currentQuestionIndex = 0;
    selectedChoiceIndex = null;
    numCorrect = 0;
    userAnswers.length = 0;

    setScreen("quiz-screen");
    renderQuestion();
  }

  function handleNext() {
    if (selectedChoiceIndex == null) return;

    // If already graded, go next; else grade
    const alreadyGraded = choicesListEl.querySelector(".correct, .incorrect");
    if (!alreadyGraded) {
      gradeCurrentQuestion();
      nextBtn.textContent = currentQuestionIndex === shuffledQuestions.length - 1 ? "Finish" : "Next";
      speakLive("Answer submitted.");
      return;
    }

    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      currentQuestionIndex += 1;
      nextBtn.textContent = "Next";
      renderQuestion();
    } else {
      finishQuiz();
    }
  }

  function retry() {
    startQuiz();
  }

  function share() {
    const percent = Math.round((numCorrect / shuffledQuestions.length) * 100);
    const text = `I scored ${percent}% on QuizMaster! Can you beat me?`;
    const url = location.href;

    if (navigator.share) {
      navigator.share({ text, url }).catch(() => {
        // fallback to clipboard
        copyToClipboard(`${text} ${url}`);
      });
    } else {
      copyToClipboard(`${text} ${url}`);
    }
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => speakLive("Link copied to clipboard"));
      return;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); speakLive("Link copied to clipboard"); } catch {}
    document.body.removeChild(ta);
  }

  function launchConfetti() {
    confettiContainerEl.innerHTML = "";
    const colors = ["#7c5cff", "#3ddc97", "#ffd166", "#ef476f", "#06d6a0", "#118ab2"]; 
    const pieces = 80;
    for (let i = 0; i < pieces; i += 1) {
      const div = document.createElement("div");
      div.className = "confetti";
      const size = 8 + Math.random() * 8;
      const left = Math.random() * 100; // vw
      const delay = Math.random() * 0.6;
      const duration = 3 + Math.random() * 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      div.style.left = `${left}vw`;
      div.style.top = `${-10 - Math.random() * 20}vh`;
      div.style.width = `${size}px`;
      div.style.height = `${size * 1.4}px`;
      div.style.background = color;
      div.style.opacity = "0.9";
      div.style.transform = `rotate(${Math.random() * 360}deg)`;
      div.style.animation = `confettiFall ${duration}s ease-in ${delay}s forwards`;
      confettiContainerEl.appendChild(div);
    }

    // cleanup after animations
    setTimeout(() => { confettiContainerEl.innerHTML = ""; }, 7000);
  }

  // ---------- Event Listeners ----------
  startBtn.addEventListener("click", startQuiz);
  nextBtn.addEventListener("click", handleNext);
  retryBtn.addEventListener("click", retry);
  shareBtn.addEventListener("click", share);
  themeToggleBtn.addEventListener("click", () => {
    const current = htmlEl.getAttribute("data-theme") === "dark" ? "dark" : "light";
    setTheme(current === "dark" ? "light" : "dark");
  });

  // Keyboard shortcut: N to proceed, R to retry
  document.addEventListener("keydown", (ev) => {
    if (ev.key.toLowerCase() === "n") {
      if (quizScreenEl.classList.contains("is-active")) handleNext();
    }
    if (ev.key.toLowerCase() === "r") {
      if (resultScreenEl.classList.contains("is-active")) retry();
    }
  });

  // ---------- Init ----------
  (function init() {
    initTheme();
    renderBestScore();
    questionTotalEl.textContent = String(TOTAL_QUESTIONS);
  })();
})(); 