import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Sparkles, Check, X, Share2, Loader2, Trophy } from "lucide-react";
import { getQotd } from "../lib/api";
import { getQotdState, saveQotdAttempt } from "../lib/qotd";
import { useLang } from "../lib/lang";

const SUBJECT_LABELS = {
  M1: { en: "M1 · IT Tools", hi: "M1 · आई.टी. टूल्स" },
  M2: { en: "M2 · Web Design", hi: "M2 · वेब डिज़ाइन" },
  M3: { en: "M3 · Python", hi: "M3 · पायथन" },
  M4: { en: "M4 · IoT", hi: "M4 · IoT" },
};

const fmtDate = (iso, isHi) => {
  if (!iso) return "";
  try {
    const d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString(isHi ? "hi-IN" : "en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  } catch {
    return iso;
  }
};

const QuestionOfTheDay = () => {
  const { isHi, lang } = useLang();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [state, setState] = useState(() => getQotdState());

  useEffect(() => {
    let alive = true;
    getQotd()
      .then((d) => {
        if (!alive) return;
        setData(d);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.response?.data?.detail || "Could not load today's question");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Determine effective view: if user already attempted today, prefer their snapshot
  const attemptedToday = useMemo(() => {
    if (!state || !state.date) return false;
    if (data && state.date === data.date) return true;
    return false;
  }, [state, data]);

  const view = attemptedToday && state?.snapshot ? state.snapshot : data;

  const handlePick = (idx) => {
    if (!data || attemptedToday) return;
    const isCorrect = idx === data.a;
    const snapshot = { ...data };
    saveQotdAttempt({
      date: data.date,
      qid: data.id,
      selected: idx,
      isCorrect,
      snapshot,
    });
    setState({ date: data.date, qid: data.id, selected: idx, isCorrect, snapshot });
  };

  const handleShare = () => {
    if (!view) return;
    const subjLabel = SUBJECT_LABELS[view.subject_code]?.[isHi ? "hi" : "en"] || view.subject_code;
    const qText = isHi ? view.q_hi : view.q_en;
    const correctOpt = (isHi ? view.options_hi : view.options_en)[view.a];
    const verdict = state?.isCorrect
      ? isHi ? "मेरा जवाब सही था ✅" : "I got it right ✅"
      : isHi ? "मेरा जवाब गलत था ❌" : "I got it wrong ❌";
    const msg = isHi
      ? `\uD83D\uDCC5 आज का प्रश्न (${subjLabel})\n\n${qText}\n\nसही उत्तर: ${correctOpt}\n${verdict}\n\nआप भी कोशिश करें — OLevel.Quiz`
      : `\uD83D\uDCC5 Question of the Day (${subjLabel})\n\n${qText}\n\nCorrect: ${correctOpt}\n${verdict}\n\nTry it yourself — OLevel.Quiz`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div
        data-testid="qotd-loading"
        className="bg-white nb-border rounded-2xl p-6 nb-shadow-sm flex items-center gap-3"
      >
        <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
        <div className="font-heading font-bold">
          {isHi ? "आज का प्रश्न आ रहा है..." : "Loading today's question..."}
        </div>
      </div>
    );
  }

  if (error || !view) {
    return null;
  }

  const subjLabel = SUBJECT_LABELS[view.subject_code]?.[isHi ? "hi" : "en"] || view.subject_code;
  const questionText = isHi ? view.q_hi : view.q_en;
  const optionTexts = isHi ? view.options_hi : view.options_en;

  return (
    <section
      data-testid="qotd-card"
      className="bg-yellow-200 nb-border rounded-3xl p-6 sm:p-8 nb-shadow-lg animate-slide-up"
    >
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="inline-flex items-center gap-2 bg-white nb-border rounded-full px-3 py-1.5 nb-shadow-sm">
          <Sparkles className="w-4 h-4" strokeWidth={2.5} />
          <span className="font-heading font-black text-xs uppercase tracking-widest">
            {isHi ? "आज का प्रश्न" : "Question of the Day"}
          </span>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700">
          <CalendarDays className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span data-testid="qotd-date">{fmtDate(view.date || data?.date, isHi)}</span>
          <span className="bg-white nb-border rounded-md px-2 py-0.5 ml-1">{subjLabel}</span>
        </div>
      </div>

      <h3
        data-testid="qotd-question"
        className="font-heading font-black text-xl sm:text-2xl leading-snug mt-4"
      >
        {questionText}
      </h3>

      <div className="mt-5 space-y-2">
        {optionTexts.map((opt, idx) => {
          const isCorrect = idx === view.a;
          const isSelected = attemptedToday && state?.selected === idx;
          let cls =
            "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50";
          if (attemptedToday) {
            if (isCorrect) cls = "bg-green-100 border-green-600 text-black";
            else if (isSelected && !isCorrect) cls = "bg-red-100 border-red-600 text-black";
            else cls = "bg-white border-zinc-300 text-zinc-700 opacity-80";
          }
          return (
            <button
              key={idx}
              data-testid={`qotd-option-${idx}`}
              onClick={() => handlePick(idx)}
              disabled={attemptedToday}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 nb-shadow-sm transition-all flex items-center gap-3 ${cls} ${
                attemptedToday ? "cursor-default" : "nb-hover"
              }`}
            >
              <span className="font-heading font-black w-7 h-7 inline-flex items-center justify-center rounded-md nb-border bg-white shrink-0">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="font-body font-medium flex-1">{opt}</span>
              {attemptedToday && isCorrect && (
                <Check className="w-4 h-4 text-green-700" strokeWidth={3} />
              )}
              {attemptedToday && isSelected && !isCorrect && (
                <X className="w-4 h-4 text-red-700" strokeWidth={3} />
              )}
            </button>
          );
        })}
      </div>

      {attemptedToday && (
        <div data-testid="qotd-feedback" className="mt-5 space-y-3">
          <div
            className={`inline-flex items-center gap-2 ${
              state?.isCorrect ? "bg-green-300" : "bg-pink-300"
            } nb-border rounded-xl px-4 py-2 nb-shadow-sm font-heading font-black`}
          >
            {state?.isCorrect ? (
              <>
                <Trophy className="w-4 h-4" strokeWidth={2.5} />
                {isHi ? "सही जवाब! बढ़िया!" : "Correct — nailed it!"}
              </>
            ) : (
              <>
                <X className="w-4 h-4" strokeWidth={3} />
                {isHi ? "गलत जवाब — अगली बार सही करना!" : "Not quite — get it next time!"}
              </>
            )}
          </div>

          {(isHi ? view.exp_hi : view.exp_en) && (
            <div className="bg-white nb-border rounded-xl p-3 nb-shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">
                {isHi ? "व्याख्या" : "Explanation"}
              </div>
              <p className="text-sm font-body leading-relaxed">
                {isHi ? view.exp_hi : view.exp_en}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              data-testid="qotd-share-btn"
              onClick={handleShare}
              className="inline-flex items-center gap-2 bg-green-500 text-white font-heading font-black px-4 py-2 rounded-xl nb-border nb-shadow nb-hover"
            >
              <Share2 className="w-4 h-4" strokeWidth={2.5} />
              {isHi ? "व्हाट्सएप पर साझा करें" : "Share on WhatsApp"}
            </button>
            <span className="text-xs font-semibold text-zinc-700">
              {isHi
                ? "कल नया प्रश्न मिलेगा — मिलते हैं!"
                : "New question tomorrow — see you then!"}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default QuestionOfTheDay;
