import { useMemo, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  Trophy,
  ArrowLeft,
  Home,
  RefreshCw,
  ChevronDown,
  Check,
  X,
  Circle,
} from "lucide-react";

const tierFor = (pct) => {
  if (pct >= 90) return { label: "Ek number! 🏆", emoji: "🏆", color: "bg-yellow-300" };
  if (pct >= 75) return { label: "Badhiya!", emoji: "🔥", color: "bg-green-300" };
  if (pct >= 50) return { label: "Not bad — thoda aur!", emoji: "💪", color: "bg-blue-300" };
  if (pct >= 35) return { label: "Keep going — tu karega!", emoji: "📚", color: "bg-orange-300" };
  return { label: "Aur practice chahiye!", emoji: "🧠", color: "bg-pink-300" };
};

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;
  const auto = location.state?.auto;
  const [filter, setFilter] = useState("all");
  const [openIdx, setOpenIdx] = useState(0);

  const tier = useMemo(
    () => (result ? tierFor(result.percentage) : null),
    [result]
  );

  const filteredReview = useMemo(() => {
    if (!result) return [];
    if (filter === "correct")
      return result.review.filter((r) => r.is_correct);
    if (filter === "wrong")
      return result.review.filter(
        (r) => !r.is_correct && r.selected !== null && r.selected !== undefined
      );
    if (filter === "skipped")
      return result.review.filter(
        (r) => r.selected === null || r.selected === undefined
      );
    return result.review;
  }, [filter, result]);

  if (!result) return <Navigate to="/" replace />;

  return (
    <div data-testid="results-page" className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="border-b-2 border-black bg-[#FDFBF7] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            data-testid="results-home-btn"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 bg-white font-heading font-bold px-3 py-1.5 rounded-lg nb-border nb-shadow-sm nb-hover text-sm"
          >
            <Home className="w-4 h-4" strokeWidth={2.5} />
            Home
          </button>
          <div className="font-heading font-black text-lg">
            Your Result
          </div>
          <button
            data-testid="results-retry-btn"
            onClick={() => navigate(`/quiz/${result.subject_code}`)}
            className="inline-flex items-center gap-2 bg-black text-white font-heading font-bold px-3 py-1.5 rounded-lg nb-border nb-shadow-sm nb-hover text-sm"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
            Retry
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Score hero */}
        <div
          className={`${tier.color} nb-border rounded-3xl p-6 sm:p-10 nb-shadow-lg animate-pop`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
            <div>
              {auto && (
                <div className="inline-block bg-black text-white font-heading font-bold text-xs px-2 py-1 rounded-md mb-3">
                  Time up — auto submitted
                </div>
              )}
              <div className="text-xs font-bold uppercase tracking-widest text-black/70">
                {result.subject_code === "MOCK" ? "Mock Test" : result.subject_code}
              </div>
              <h1 className="font-heading font-black text-4xl sm:text-5xl leading-tight mt-1">
                {tier.label}
              </h1>
              <p className="font-body text-black/80 mt-2 max-w-md">
                {result.subject_name}
              </p>
            </div>

            <div
              data-testid="results-score"
              className="bg-white nb-border rounded-2xl px-6 py-4 nb-shadow text-center min-w-[160px]"
            >
              <div className="font-heading font-black text-5xl tracking-tight">
                {result.score}
                <span className="text-zinc-400 text-3xl">/{result.total}</span>
              </div>
              <div className="text-sm font-bold mt-1">{result.percentage}%</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8">
            <div className="bg-white nb-border rounded-xl p-3 text-center nb-shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Correct
              </div>
              <div className="font-heading font-black text-2xl text-green-600 mt-1">
                {result.correct_count}
              </div>
            </div>
            <div className="bg-white nb-border rounded-xl p-3 text-center nb-shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Wrong
              </div>
              <div className="font-heading font-black text-2xl text-red-500 mt-1">
                {result.wrong_count}
              </div>
            </div>
            <div className="bg-white nb-border rounded-xl p-3 text-center nb-shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Skipped
              </div>
              <div className="font-heading font-black text-2xl text-zinc-700 mt-1">
                {result.unattempted}
              </div>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mt-10 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-heading font-black text-2xl">Detailed Review</h2>
          <div className="inline-flex items-center gap-2 flex-wrap">
            {[
              { k: "all", l: "All" },
              { k: "correct", l: "Correct" },
              { k: "wrong", l: "Wrong" },
              { k: "skipped", l: "Skipped" },
            ].map((opt) => (
              <button
                key={opt.k}
                data-testid={`filter-${opt.k}`}
                onClick={() => {
                  setFilter(opt.k);
                  setOpenIdx(0);
                }}
                className={`font-heading font-bold text-sm px-3 py-1.5 rounded-lg nb-border transition-all ${
                  filter === opt.k
                    ? "bg-black text-white nb-shadow-sm"
                    : "bg-white nb-shadow-sm nb-hover"
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredReview.length === 0 && (
            <div className="bg-white nb-border rounded-xl p-6 text-center font-body">
              Is filter mein koi question nahi hai.
            </div>
          )}
          {filteredReview.map((r, idx) => {
            const isOpen = idx === openIdx;
            const status = r.is_correct
              ? "correct"
              : r.selected === null || r.selected === undefined
              ? "skipped"
              : "wrong";
            return (
              <div
                key={r.id}
                data-testid={`review-item-${idx}`}
                className="bg-white nb-border rounded-xl nb-shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3"
                >
                  <div
                    className={`shrink-0 w-8 h-8 rounded-lg nb-border flex items-center justify-center ${
                      status === "correct"
                        ? "bg-green-300"
                        : status === "wrong"
                        ? "bg-red-300"
                        : "bg-zinc-200"
                    }`}
                  >
                    {status === "correct" && (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    )}
                    {status === "wrong" && (
                      <X className="w-4 h-4" strokeWidth={3} />
                    )}
                    {status === "skipped" && (
                      <Circle className="w-4 h-4" strokeWidth={3} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-sm sm:text-base leading-snug">
                      Q{idx + 1}. {r.q}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 mt-1 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    strokeWidth={2.5}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t-2 border-black/10">
                    <div className="mt-3 space-y-2">
                      {r.options.map((opt, i) => {
                        const isCorrect = i === r.correct;
                        const isSelected = i === r.selected;
                        let cls =
                          "bg-white border-zinc-300 text-zinc-700";
                        if (isCorrect)
                          cls = "bg-green-100 border-green-600 text-black";
                        else if (isSelected && !isCorrect)
                          cls = "bg-red-100 border-red-600 text-black";
                        return (
                          <div
                            key={i}
                            className={`flex items-start gap-3 px-3 py-2 rounded-lg border-2 ${cls}`}
                          >
                            <div className="font-heading font-black">
                              {String.fromCharCode(65 + i)}.
                            </div>
                            <div className="font-body text-sm flex-1">{opt}</div>
                            {isCorrect && (
                              <span className="text-xs font-bold text-green-700">
                                Correct
                              </span>
                            )}
                            {isSelected && !isCorrect && (
                              <span className="text-xs font-bold text-red-700">
                                Your answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {r.explanation && (
                      <div className="mt-3 bg-yellow-100 nb-border rounded-lg p-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">
                          Explanation
                        </div>
                        <p className="text-sm font-body leading-relaxed">
                          {r.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <button
            data-testid="results-back-home-btn"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 bg-white font-heading font-bold px-5 py-2.5 rounded-xl nb-border nb-shadow nb-hover"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
            Back to Home
          </button>
          <button
            data-testid="results-again-btn"
            onClick={() => navigate(`/quiz/${result.subject_code}`)}
            className="inline-flex items-center gap-2 bg-blue-500 text-white font-heading font-bold px-5 py-2.5 rounded-xl nb-border nb-shadow nb-hover"
          >
            <Trophy className="w-4 h-4" strokeWidth={2.5} />
            Attempt Again
          </button>
        </div>
      </main>
    </div>
  );
};

export default Results;
