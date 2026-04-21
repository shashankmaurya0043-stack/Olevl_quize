import { useEffect, useMemo, useState } from "react";
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
  Share2,
} from "lucide-react";
import { saveAttempt } from "../lib/history";
import { useLang, t } from "../lib/lang";

const tierFor = (pct, isHi) => {
  if (pct >= 90) return { label: isHi ? "शानदार! 🏆" : "Ek number! 🏆", color: "bg-yellow-300" };
  if (pct >= 75) return { label: isHi ? "बहुत अच्छे!" : "Badhiya!", color: "bg-green-300" };
  if (pct >= 50) return { label: isHi ? "थोड़ी और मेहनत!" : "Not bad — thoda aur!", color: "bg-blue-300" };
  if (pct >= 35) return { label: isHi ? "लगे रहो!" : "Keep going — tu karega!", color: "bg-orange-300" };
  return { label: isHi ? "और अभ्यास चाहिए!" : "Aur practice chahiye!", color: "bg-pink-300" };
};

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, isHi } = useLang();
  const result = location.state?.result;
  const auto = location.state?.auto;
  const [filter, setFilter] = useState("all");
  const [openIdx, setOpenIdx] = useState(0);
  const savedRef = useState({ saved: false })[0];

  // Save to history once per mount
  useEffect(() => {
    if (result && !savedRef.saved) {
      saveAttempt(result);
      savedRef.saved = true;
    }
  }, [result, savedRef]);

  const tier = useMemo(
    () => (result ? tierFor(result.percentage, isHi) : null),
    [result, isHi]
  );

  const filteredReview = useMemo(() => {
    if (!result) return [];
    if (filter === "correct") return result.review.filter((r) => r.is_correct);
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

  const subjectName = isHi ? result.subject_name_hi : result.subject_name;

  const shareOnWhatsApp = () => {
    const title = isHi ? "मेरा O Level क्विज़ स्कोर" : "My O Level Quiz Score";
    const subj = isHi ? result.subject_name_hi : result.subject_name;
    const msg = isHi
      ? `${title} 🎓\n\n📚 ${subj}\n🎯 स्कोर: ${result.score}/${result.total} (${result.percentage}%)\n✅ सही: ${result.correct_count}  ❌ गलत: ${result.wrong_count}  ⏭️ छूटे: ${result.unattempted}\n\n${tier.label}\n\nआप भी अभ्यास करें — OLevel.Quiz पर!`
      : `${title} 🎓\n\n📚 ${subj}\n🎯 Score: ${result.score}/${result.total} (${result.percentage}%)\n✅ Correct: ${result.correct_count}  ❌ Wrong: ${result.wrong_count}  ⏭️ Skipped: ${result.unattempted}\n\n${tier.label}\n\nTry it yourself on OLevel.Quiz!`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div data-testid="results-page" className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b-2 border-black bg-[#FDFBF7] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            data-testid="results-home-btn"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 bg-white font-heading font-bold px-3 py-1.5 rounded-lg nb-border nb-shadow-sm nb-hover text-sm"
          >
            <Home className="w-4 h-4" strokeWidth={2.5} />
            {t(lang, "home")}
          </button>
          <div className="font-heading font-black text-lg truncate">
            {isHi ? "परिणाम" : "Your Result"}
          </div>
          <button
            data-testid="results-retry-btn"
            onClick={() => navigate(`/quiz/${result.subject_code}`)}
            className="inline-flex items-center gap-2 bg-black text-white font-heading font-bold px-3 py-1.5 rounded-lg nb-border nb-shadow-sm nb-hover text-sm"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
            {t(lang, "retry")}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className={`${tier.color} nb-border rounded-3xl p-6 sm:p-10 nb-shadow-lg animate-pop`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
            <div>
              {auto && (
                <div className="inline-block bg-black text-white font-heading font-bold text-xs px-2 py-1 rounded-md mb-3">
                  {t(lang, "time_up")}
                </div>
              )}
              <div className="text-xs font-bold uppercase tracking-widest text-black/70">
                {result.subject_code === "MOCK" ? (isHi ? "मॉक टेस्ट" : "Mock Test") : result.subject_code}
              </div>
              <h1 className="font-heading font-black text-4xl sm:text-5xl leading-tight mt-1">{tier.label}</h1>
              <p className="font-body text-black/80 mt-2 max-w-md">{subjectName}</p>
            </div>

            <div data-testid="results-score" className="bg-white nb-border rounded-2xl px-6 py-4 nb-shadow text-center min-w-[160px]">
              <div className="font-heading font-black text-5xl tracking-tight">
                {result.score}<span className="text-zinc-400 text-3xl">/{result.total}</span>
              </div>
              <div className="text-sm font-bold mt-1">{result.percentage}%</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8">
            <div className="bg-white nb-border rounded-xl p-3 text-center nb-shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t(lang, "correct")}</div>
              <div className="font-heading font-black text-2xl text-green-600 mt-1">{result.correct_count}</div>
            </div>
            <div className="bg-white nb-border rounded-xl p-3 text-center nb-shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t(lang, "wrong")}</div>
              <div className="font-heading font-black text-2xl text-red-500 mt-1">{result.wrong_count}</div>
            </div>
            <div className="bg-white nb-border rounded-xl p-3 text-center nb-shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t(lang, "skipped")}</div>
              <div className="font-heading font-black text-2xl text-zinc-700 mt-1">{result.unattempted}</div>
            </div>
          </div>

          <div className="mt-6">
            <button
              data-testid="results-share-whatsapp-btn"
              onClick={shareOnWhatsApp}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-500 text-white font-heading font-black px-5 py-3 rounded-xl nb-border nb-shadow nb-hover"
            >
              <Share2 className="w-4 h-4" strokeWidth={2.5} />
              {t(lang, "share_whatsapp")}
            </button>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-heading font-black text-2xl">{t(lang, "detailed_review")}</h2>
          <div className="inline-flex items-center gap-2 flex-wrap">
            {[
              { k: "all", l: t(lang, "all") },
              { k: "correct", l: t(lang, "correct") },
              { k: "wrong", l: t(lang, "wrong") },
              { k: "skipped", l: t(lang, "skipped") },
            ].map((opt) => (
              <button
                key={opt.k}
                data-testid={`filter-${opt.k}`}
                onClick={() => { setFilter(opt.k); setOpenIdx(0); }}
                className={`font-heading font-bold text-sm px-3 py-1.5 rounded-lg nb-border transition-all ${
                  filter === opt.k ? "bg-black text-white nb-shadow-sm" : "bg-white nb-shadow-sm nb-hover"
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
              {t(lang, "no_in_filter")}
            </div>
          )}
          {filteredReview.map((r, idx) => {
            const isOpen = idx === openIdx;
            const status = r.is_correct
              ? "correct"
              : r.selected === null || r.selected === undefined
              ? "skipped"
              : "wrong";
            const questionText = isHi ? r.q_hi : r.q_en;
            const optionTexts = isHi ? r.options_hi : r.options_en;
            const explanation = isHi ? r.explanation_hi : r.explanation_en;
            return (
              <div key={r.id} data-testid={`review-item-${idx}`} className="bg-white nb-border rounded-xl nb-shadow-sm overflow-hidden">
                <button onClick={() => setOpenIdx(isOpen ? -1 : idx)} className="w-full text-left px-4 py-3 flex items-start gap-3">
                  <div className={`shrink-0 w-8 h-8 rounded-lg nb-border flex items-center justify-center ${
                    status === "correct" ? "bg-green-300" : status === "wrong" ? "bg-red-300" : "bg-zinc-200"
                  }`}>
                    {status === "correct" && <Check className="w-4 h-4" strokeWidth={3} />}
                    {status === "wrong" && <X className="w-4 h-4" strokeWidth={3} />}
                    {status === "skipped" && <Circle className="w-4 h-4" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-sm sm:text-base leading-snug">
                      Q{idx + 1}. {questionText}
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 mt-1 transition-transform ${isOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t-2 border-black/10">
                    <div className="mt-3 space-y-2">
                      {optionTexts.map((opt, i) => {
                        const isCorrect = i === r.correct;
                        const isSelected = i === r.selected;
                        let cls = "bg-white border-zinc-300 text-zinc-700";
                        if (isCorrect) cls = "bg-green-100 border-green-600 text-black";
                        else if (isSelected && !isCorrect) cls = "bg-red-100 border-red-600 text-black";
                        return (
                          <div key={i} className={`flex items-start gap-3 px-3 py-2 rounded-lg border-2 ${cls}`}>
                            <div className="font-heading font-black">{String.fromCharCode(65 + i)}.</div>
                            <div className="font-body text-sm flex-1">{opt}</div>
                            {isCorrect && (
                              <span className="text-xs font-bold text-green-700">{t(lang, "correct")}</span>
                            )}
                            {isSelected && !isCorrect && (
                              <span className="text-xs font-bold text-red-700">{t(lang, "your_answer")}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {explanation && (
                      <div className="mt-3 bg-yellow-100 nb-border rounded-lg p-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">
                          {t(lang, "explanation")}
                        </div>
                        <p className="text-sm font-body leading-relaxed">{explanation}</p>
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
            {t(lang, "back_to_home")}
          </button>
          <button
            data-testid="results-again-btn"
            onClick={() => navigate(`/quiz/${result.subject_code}`)}
            className="inline-flex items-center gap-2 bg-blue-500 text-white font-heading font-bold px-5 py-2.5 rounded-xl nb-border nb-shadow nb-hover"
          >
            <Trophy className="w-4 h-4" strokeWidth={2.5} />
            {t(lang, "attempt_again")}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Results;
