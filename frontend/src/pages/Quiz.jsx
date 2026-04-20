import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { startQuiz, submitQuiz } from "../lib/api";

const formatTime = (sec) => {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const Quiz = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const startTsRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    startQuiz(code)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setTimeLeft(d.duration_min * 60);
        startTsRef.current = Date.now();
      })
      .catch((e) => {
        if (!alive) return;
        setError(
          e?.response?.data?.detail || "Quiz start karne mein error aagaya."
        );
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [code]);

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (submitting || !data) return;
      setSubmitting(true);
      const timeTaken = startTsRef.current
        ? Math.floor((Date.now() - startTsRef.current) / 1000)
        : 0;
      try {
        const res = await submitQuiz({
          session_id: data.session_id,
          answers,
          time_taken_sec: timeTaken,
        });
        navigate("/results", { state: { result: res, auto } });
      } catch (e) {
        setError(e?.response?.data?.detail || "Submit failed. Try again.");
        setSubmitting(false);
      }
    },
    [submitting, data, answers, navigate]
  );

  // Timer
  useEffect(() => {
    if (!data) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, data, handleSubmit]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v !== null && v !== undefined).length,
    [answers]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="bg-white nb-border rounded-2xl px-6 py-8 nb-shadow text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin" strokeWidth={2.5} />
          <div className="font-heading font-bold mt-3">Questions load ho rahe hain...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
        <div
          data-testid="quiz-error"
          className="max-w-md bg-white nb-border rounded-2xl p-6 nb-shadow text-center"
        >
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" strokeWidth={2.5} />
          <h2 className="font-heading font-black text-xl mt-3">Oops!</h2>
          <p className="font-body mt-2 text-zinc-700">{error}</p>
          <button
            data-testid="quiz-error-home-btn"
            onClick={() => navigate("/")}
            className="mt-5 bg-black text-white font-heading font-bold px-5 py-2 rounded-xl nb-border nb-shadow nb-hover"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const q = data.questions[current];
  const selected = answers[q.id];
  const progress = ((current + 1) / data.questions.length) * 100;
  const lowTime = timeLeft <= 30;

  return (
    <div data-testid="quiz-page" className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FDFBF7] border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              {data.subject_code === "MOCK" ? "Mock Test" : data.subject_code}
            </div>
            <div className="font-heading font-black text-base sm:text-lg truncate">
              {data.subject_name}
            </div>
          </div>

          <div
            data-testid="quiz-timer"
            className={`flex items-center gap-2 ${lowTime ? "bg-red-200" : "bg-yellow-300"} nb-border rounded-xl px-3 py-2 nb-shadow-sm ${lowTime ? "pulse-timer" : ""}`}
          >
            <Clock className="w-4 h-4" strokeWidth={2.5} />
            <span className="font-mono-timer font-bold text-lg">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-3">
          <div className="nb-progress-track">
            <div
              className="nb-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs font-semibold text-zinc-600">
            <span data-testid="quiz-progress">
              Q {current + 1} / {data.questions.length}
            </span>
            <span>
              Attempted: {answeredCount}/{data.questions.length}
            </span>
          </div>
        </div>
      </header>

      {/* Question */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div
          key={q.id}
          className="bg-white nb-border rounded-2xl p-6 sm:p-8 nb-shadow animate-pop"
        >
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Question {current + 1}
          </div>
          <h2 className="font-heading font-bold text-xl sm:text-2xl leading-snug mt-2">
            {q.q}
          </h2>

          <div className="mt-6 space-y-3">
            {q.options.map((opt, idx) => {
              const isSel = selected === idx;
              return (
                <button
                  key={idx}
                  data-testid={`quiz-option-${idx}`}
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [q.id]: idx }))
                  }
                  className={`w-full text-left px-4 py-3 sm:py-4 rounded-xl nb-border transition-all flex items-start gap-3 ${
                    isSel
                      ? "bg-blue-100 border-blue-600 nb-shadow"
                      : "bg-white hover:bg-zinc-50 nb-shadow-sm nb-hover"
                  }`}
                >
                  <div
                    className={`shrink-0 w-8 h-8 rounded-lg nb-border flex items-center justify-center font-heading font-black ${
                      isSel ? "bg-blue-600 text-white" : "bg-white"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="font-body font-medium text-base leading-snug pt-1">
                    {opt}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-zinc-500">
            <button
              data-testid="quiz-clear-btn"
              onClick={() =>
                setAnswers((prev) => {
                  const { [q.id]: _drop, ...rest } = prev;
                  return rest;
                })
              }
              className="underline hover:text-black disabled:opacity-40"
              disabled={selected === undefined}
            >
              Clear selection
            </button>
            {selected !== undefined && (
              <span className="inline-flex items-center gap-1 text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                Answered
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            data-testid="quiz-prev-btn"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="inline-flex items-center gap-2 bg-white font-heading font-bold px-4 py-2.5 rounded-xl nb-border nb-shadow-sm nb-hover disabled:opacity-40 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
            Prev
          </button>

          {current < data.questions.length - 1 ? (
            <button
              data-testid="quiz-next-btn"
              onClick={() => setCurrent((c) => c + 1)}
              className="inline-flex items-center gap-2 bg-blue-500 text-white font-heading font-bold px-5 py-2.5 rounded-xl nb-border nb-shadow nb-hover"
            >
              Next
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          ) : (
            <button
              data-testid="quiz-submit-btn"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 bg-black text-white font-heading font-bold px-5 py-2.5 rounded-xl nb-border nb-shadow nb-hover"
            >
              Submit Quiz
              <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Question grid */}
        <div className="mt-10 bg-white nb-border rounded-2xl p-5 nb-shadow-sm">
          <div className="font-heading font-bold text-sm mb-3">
            Jump to question
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {data.questions.map((qq, i) => {
              const ans = answers[qq.id];
              const isAnswered = ans !== undefined && ans !== null;
              const isCurrent = i === current;
              return (
                <button
                  key={qq.id}
                  data-testid={`quiz-jump-${i}`}
                  onClick={() => setCurrent(i)}
                  className={`h-9 rounded-md nb-border font-heading font-black text-sm ${
                    isCurrent
                      ? "bg-blue-500 text-white"
                      : isAnswered
                      ? "bg-green-200"
                      : "bg-white"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            data-testid="quiz-confirm-modal"
            className="bg-white nb-border rounded-2xl p-6 max-w-md w-full nb-shadow-lg animate-pop"
          >
            <h3 className="font-heading font-black text-2xl">Submit karein?</h3>
            <p className="mt-2 text-zinc-700">
              Tumne {answeredCount} out of {data.questions.length} questions
              attempt kiye hain. Submit karne ke baad change nahi kar sakte.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                data-testid="quiz-confirm-cancel"
                onClick={() => setConfirmOpen(false)}
                className="bg-white font-heading font-bold px-4 py-2 rounded-xl nb-border nb-shadow-sm nb-hover"
              >
                Cancel
              </button>
              <button
                data-testid="quiz-confirm-submit"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="bg-black text-white font-heading font-bold px-4 py-2 rounded-xl nb-border nb-shadow nb-hover inline-flex items-center gap-2 disabled:opacity-60"
              >
                {submitting && (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                )}
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
