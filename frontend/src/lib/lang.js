import { useEffect, useState } from "react";

const KEY = "olevel_quiz_lang_v1";

export function getInitialLang() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "hi") return saved;
  } catch {
    /* ignore */
  }
  return "en";
}

export function setLangPref(lang) {
  try {
    localStorage.setItem(KEY, lang);
    window.dispatchEvent(new CustomEvent("lang-changed", { detail: lang }));
  } catch {
    /* ignore */
  }
}

export function useLang() {
  const [lang, setLang] = useState(() => getInitialLang());

  useEffect(() => {
    const onChange = (e) => setLang(e.detail);
    window.addEventListener("lang-changed", onChange);
    return () => window.removeEventListener("lang-changed", onChange);
  }, []);

  const toggle = () => {
    const next = lang === "hi" ? "en" : "hi";
    setLang(next);
    setLangPref(next);
  };

  const set = (l) => {
    setLang(l);
    setLangPref(l);
  };

  return { lang, toggle, setLang: set, isHi: lang === "hi" };
}

// Translate a common UI string
const STRINGS = {
  en: {
    start_mock: "Start Mock Test",
    mock_test: "Mock Test",
    history: "History",
    back: "Back",
    home: "Home",
    retry: "Retry",
    next: "Next",
    prev: "Prev",
    submit_quiz: "Submit Quiz",
    answered: "Answered",
    clear_selection: "Clear selection",
    jump_to_question: "Jump to question",
    question: "Question",
    attempted: "Attempted",
    submit_confirm_title: "Submit karein?",
    submit_confirm_title_en: "Submit the quiz?",
    yes_submit: "Yes, Submit",
    cancel: "Cancel",
    loading_questions: "Loading questions...",
    time_up: "Time up — auto submitted",
    correct: "Correct",
    wrong: "Wrong",
    skipped: "Skipped",
    detailed_review: "Detailed Review",
    all: "All",
    your_answer: "Your answer",
    explanation: "Explanation",
    no_in_filter: "No questions in this filter.",
    attempt_again: "Attempt Again",
    back_to_home: "Back to Home",
    share_whatsapp: "Share on WhatsApp",
    score_history: "Score History",
    your_journey: "Your journey",
    attempts: "Attempts",
    average: "Average",
    best: "Best",
    no_attempts: "No attempts yet",
    no_attempts_desc: "Pick any subject and take your first quiz.",
    start_first: "Start First Quiz",
    clear: "Clear",
    confirm_clear: "Clear the entire history?",
    padhai: "Padhai with Passion",
  },
  hi: {
    start_mock: "मॉक टेस्ट शुरू करें",
    mock_test: "मॉक टेस्ट",
    history: "इतिहास",
    back: "वापस",
    home: "होम",
    retry: "पुनः प्रयास",
    next: "अगला",
    prev: "पिछला",
    submit_quiz: "क्विज़ जमा करें",
    answered: "उत्तर दिया",
    clear_selection: "चयन हटाएँ",
    jump_to_question: "प्रश्न पर जाएँ",
    question: "प्रश्न",
    attempted: "उत्तरित",
    submit_confirm_title: "क्विज़ जमा करें?",
    submit_confirm_title_en: "Submit the quiz?",
    yes_submit: "हाँ, जमा करें",
    cancel: "रद्द करें",
    loading_questions: "प्रश्न लोड हो रहे हैं...",
    time_up: "समय समाप्त — स्वतः जमा हो गया",
    correct: "सही",
    wrong: "गलत",
    skipped: "छोड़े गए",
    detailed_review: "विस्तृत समीक्षा",
    all: "सभी",
    your_answer: "आपका उत्तर",
    explanation: "व्याख्या",
    no_in_filter: "इस फ़िल्टर में कोई प्रश्न नहीं है।",
    attempt_again: "पुनः प्रयास करें",
    back_to_home: "होम पर वापस",
    share_whatsapp: "व्हाट्सएप पर साझा करें",
    score_history: "स्कोर इतिहास",
    your_journey: "आपकी यात्रा",
    attempts: "प्रयास",
    average: "औसत",
    best: "सर्वश्रेष्ठ",
    no_attempts: "अभी तक कोई प्रयास नहीं",
    no_attempts_desc: "कोई भी विषय चुनें और अपना पहला क्विज़ शुरू करें।",
    start_first: "पहला क्विज़ शुरू करें",
    clear: "साफ़ करें",
    confirm_clear: "पूरा इतिहास मिटाएँ?",
    padhai: "Padhai with Passion",
  },
};

export function t(lang, key) {
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
}
