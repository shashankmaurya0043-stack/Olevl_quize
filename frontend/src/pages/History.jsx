import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Award, TrendingUp, Clock } from "lucide-react";
import Navbar from "../components/Navbar";
import { loadHistory, clearHistory, getStats } from "../lib/history";

const SUBJECT_BG = {
  M1: "bg-m1",
  M2: "bg-m2",
  M3: "bg-m3",
  M4: "bg-m4",
  MOCK: "bg-black text-white",
};

const fmtDate = (ts) => {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ attempts: 0, avg: 0, best: 0 });

  useEffect(() => {
    setHistory(loadHistory());
    setStats(getStats());
  }, []);

  const onClear = () => {
    if (window.confirm("Saara history clear kar doon?")) {
      clearHistory();
      setHistory([]);
      setStats({ attempts: 0, avg: 0, best: 0 });
    }
  };

  return (
    <div data-testid="history-page" className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0A0A]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400">
              Your journey
            </div>
            <h1 className="font-heading font-black text-3xl sm:text-4xl tracking-tight mt-1">
              Score History
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              data-testid="history-back-btn"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 bg-white font-heading font-bold px-4 py-2 rounded-xl nb-border nb-shadow-sm nb-hover"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
              Back
            </button>
            {history.length > 0 && (
              <button
                data-testid="history-clear-btn"
                onClick={onClear}
                className="inline-flex items-center gap-2 bg-red-500 text-white font-heading font-bold px-4 py-2 rounded-xl nb-border nb-shadow-sm nb-hover"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-yellow-300 nb-border rounded-2xl p-4 nb-shadow-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
              <div className="text-[10px] font-bold uppercase tracking-widest">
                Attempts
              </div>
            </div>
            <div className="font-heading font-black text-3xl mt-2">
              {stats.attempts}
            </div>
          </div>
          <div className="bg-blue-300 nb-border rounded-2xl p-4 nb-shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" strokeWidth={2.5} />
              <div className="text-[10px] font-bold uppercase tracking-widest">
                Average
              </div>
            </div>
            <div className="font-heading font-black text-3xl mt-2">
              {stats.avg}%
            </div>
          </div>
          <div className="bg-green-300 nb-border rounded-2xl p-4 nb-shadow-sm">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" strokeWidth={2.5} />
              <div className="text-[10px] font-bold uppercase tracking-widest">
                Best
              </div>
            </div>
            <div className="font-heading font-black text-3xl mt-2">
              {stats.best}%
            </div>
          </div>
        </div>

        {/* List */}
        <div className="mt-8">
          {history.length === 0 ? (
            <div
              data-testid="history-empty"
              className="bg-white nb-border rounded-2xl p-8 text-center nb-shadow-sm"
            >
              <div className="font-heading font-black text-xl">
                Abhi tak koi attempt nahi 🕒
              </div>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Koi bhi subject select karo aur pehla quiz attempt karo.
              </p>
              <button
                data-testid="history-start-btn"
                onClick={() => navigate("/")}
                className="mt-5 bg-black text-white font-heading font-bold px-5 py-2 rounded-xl nb-border nb-shadow nb-hover"
              >
                Start First Quiz
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {history.map((h, i) => {
                const bg = SUBJECT_BG[h.subject_code] || "bg-white";
                return (
                  <li
                    key={h.id || i}
                    data-testid={`history-item-${i}`}
                    className={`${bg} nb-border rounded-2xl p-4 nb-shadow-sm flex items-center justify-between gap-4`}
                  >
                    <div className="min-w-0">
                      <div className="font-heading font-black text-base sm:text-lg truncate">
                        {h.subject_name}
                      </div>
                      <div className="text-xs font-semibold mt-1 opacity-80">
                        {fmtDate(h.at)} · {h.correct} correct · {h.wrong} wrong ·{" "}
                        {h.skipped} skipped
                      </div>
                    </div>
                    <div className="bg-white nb-border rounded-xl px-3 py-2 text-center min-w-[90px] nb-shadow-sm">
                      <div className="font-heading font-black text-xl leading-none">
                        {h.score}
                        <span className="text-zinc-400 text-sm">/{h.total}</span>
                      </div>
                      <div className="text-[11px] font-bold mt-1">
                        {h.percentage}%
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
