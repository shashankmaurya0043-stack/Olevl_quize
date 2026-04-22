# O Level Quiz — PRD

## Original Problem Statement
Create a quiz website for O Level exam preparation. Subjects: M1, M2, M3 (Python), M4 (IoT). MCQ questions, timer, score + correct answers after submission. Subject-wise quizzes + full Mock Test (50 Qs). Clean, mobile-friendly, attractive design for students.

## User Choices
- Bilingual English + Hindi (Devanagari) content
- Seeded sample questions + hidden admin panel to grow bank
- No login / no accounts
- Subject quiz: 20 Qs / 20 min
- Mock test: 50 Qs / 60 min
- Modern neo-brutalist design

## Architecture
- **Backend**: FastAPI + Motor (MongoDB). Static questions in `questions.py`, admin additions in `admin_questions` collection, merged at runtime.
- **Frontend**: React Router, Tailwind, lucide-react. Neo-brutalist pastel palette with Outfit + DM Sans.
- **LLM**: Gemini 3 Flash (`gemini-3-flash-preview`) via Emergent Universal Key for admin OCR/parsing.

## APIs
- `GET /api/subjects` — list subjects
- `GET /api/mock-test-info` — mock test meta
- `GET /api/quiz/start/{code}` — start session, returns questions (no answers)
- `POST /api/quiz/submit` — submit answers, returns score + full review
- `GET /api/qotd` — today's Question of the Day (cached, no answer key)
- `POST /api/qotd/submit` — server-side QotD evaluation
- `POST /api/admin/parse-image` — OCR + parse (Gemini 3 Flash)
- `POST /api/admin/questions` — save new question with dedup
- `GET /api/admin/questions` — list admin questions
- `DELETE /api/admin/questions/{id}` — delete admin question

## Pages
- `/` Home — hero, subject grid, mock test banner, Question of the Day
- `/quiz/:code` Quiz — sticky timer, one Q per screen, jump/nav, submit confirm, auto-submit on timeout
- `/results` Results — score hero, filterable review with explanations, WhatsApp share
- `/history` History — local attempts list + stats
- `/admin-u7k2` Hidden admin panel (password-gated)

## Implemented (2026-02)
- 4 subjects, ~405 bilingual questions total (EN + Hindi Devanagari)
- Mock test pulls 50 mixed questions
- Timer with pulse animation in final 30s; auto-submit on 0
- Detailed review with correct/user answer highlight + explanation
- Mobile-first neo-brutalist UI (hard shadows, pastel subject colors, hover press)
- All data-testid attributes applied; backend + frontend tests pass 100%
- **Hidden admin panel** at `/admin-u7k2`, password in `backend/.env` (`ADMIN_PASSWORD`)
- **Gemini 3 Flash** admin: paste text or upload PNG/JPEG/WEBP → parsed + translated bilingual MCQs
- **Bulk parse + editable preview** before save
- **Dedup** via compound index `subject_code + q_en_norm`
- **Live language toggle** (EN / हिं) in navbar + quiz header (switch mid-quiz)
- **Dark mode** with inverted neo-brutalist shadows, persisted in localStorage
- **Local score history** (last 50 attempts), `/history` page with stats
- **WhatsApp share** on results — one-tap share card with score/tier
- **Question of the Day** with server-side caching (`qotd_daily` collection, unique date index) and server-side scoring to prevent cheating
- **Vercel deploy config** (`vercel.json`, node 18.x pin in package.json)

## Deployment (2026-02)
- Emergent native deployment health check: **PASS (warn, no blockers)**
  - All critical gates pass: compilation, env, URL hygiene, CORS, supervisor
  - Non-blocking advisories: DB query projections could be tightened (current dataset small, no impact)
- Vercel frontend deploy config validated

## Backlog
### P1
- Expand question bank to 200+ Qs per subject (deferred)
- Subject-wise analytics / weak areas
### P2
- Replace `window.confirm` in admin with themed modal (deferred)
- Migrate deprecated `@app.on_event("startup")` → FastAPI `lifespan` + MongoDB TTL index (deferred)
- Tighten DB query projections on large endpoints (non-blocking perf)
- Question bookmarking / notes
- Difficulty tags + filters
- Share result card as image

## Next Actions
- Proceed to deploy via Emergent native deployment when user is ready
- Optionally pick a P1/P2 backlog item to work on next
