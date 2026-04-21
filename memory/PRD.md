# O Level Quiz — PRD

## Original Problem Statement
Create a quiz website for O Level exam preparation. Subjects: M1, M2, M3 (Python), M4 (IoT). MCQ questions, timer, score + correct answers after submission. Subject-wise quizzes + full Mock Test (50 Qs). Clean, mobile-friendly, attractive design for students.

## User Choices
- Hinglish (Hindi + English mix) copy
- Seeded sample questions (no admin panel)
- No login / no accounts
- Subject quiz: 20 Qs / 20 min
- Mock test: 50 Qs / 60 min
- Modern neo-brutalist design

## Architecture
- **Backend**: FastAPI + Motor (MongoDB) storing quiz sessions. Questions stored in `questions.py`.
- **Frontend**: React Router, Tailwind, lucide-react icons. Neo-brutalist pastel palette with Outfit + DM Sans.

## APIs
- `GET /api/subjects` — list subjects
- `GET /api/mock-test-info` — mock test meta
- `GET /api/quiz/start/{code}` — start session, returns questions without correct answers
- `POST /api/quiz/submit` — submit answers, returns score + full review with explanations

## Pages
- `/` Home — hero, subject bento grid, mock test banner
- `/quiz/:code` Quiz — sticky timer, one Q per screen, Next/Prev/Jump, submit confirm modal, auto-submit on time up
- `/results` Results — score hero, summary (correct/wrong/skipped), filterable review with explanations

## Implemented (2026-02)
- 4 subjects with ~25 questions each (100 total)
- Mock test pulls 50 mixed questions
- Timer with pulse animation in final 30s; auto-submit on 0
- Detailed review with correct answer + user answer highlighting + explanation per question
- Mobile-first neo-brutalist UI with hard shadows, pastel subject colors, hover press effect
- All data-testid attributes applied; backend + frontend tests pass 100%

## Implemented (Feature wave 3 — Admin tool)
- **Hidden admin panel** at `/admin-u7k2` (not linked from nav); password-gated via `ADMIN_PASSWORD` in `backend/.env`
- **Admin password**: `olevel-admin-7dc75d34` (stored only in `backend/.env`)
- **Gemini 3 Flash integration** (`gemini-3-flash-preview` via Emergent Universal Key) for OCR + MCQ parsing + Hindi translation
- **Two input modes**: paste text / upload image (PNG/JPEG/WEBP)
- **Bulk parsing + editable preview**: parses multiple MCQs at once, admin can edit every field (q, options, correct answer radio, Hindi translation, explanation) before saving
- **MongoDB storage** in `admin_questions` collection; admin questions **merged** into the quiz pool so users see them immediately
- **Admin UI extras**: stats per subject, existing-questions list, delete, add-blank, logout
- **Graceful LLM error handling**: 502 with friendly message on budget/rate-limit failures
- **Bilingual question bank**: 100+ Qs × 4 subjects (405 total) — full English + proper Hindi (Devanagari) for every question, option, and explanation
- **Live language toggle** (EN / हिं) in navbar + quiz header — switches any time, even mid-quiz
- **Dark mode** with inverted neo-brutalist shadows, persisted in localStorage
- **Local score history** via localStorage (up to last 50 attempts); /history page with stats (attempts, average, best)
- **WhatsApp share** on results page — one-tap share card with score and tier in current language
- **Navbar on Results page** — lang/theme/history/mock-test accessible directly from results

## Backlog (P1 / P2)
- P1: Admin/content UI to add more questions (grow beyond seed pool)
- P1: LocalStorage score history + streak
- P2: Subject-wise analytics (weak areas)
- P2: Share result card image
- P2: Dark mode
- P2: Question bookmarking / notes
- P2: Question difficulty tags + filters

## Next Actions
- Ask user to expand question bank (currently ~25 per subject)
- Optional: Add share-result card for viral reach among students
