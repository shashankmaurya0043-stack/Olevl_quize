const KEY = "olevel_quiz_history_v1";
const MAX = 50;

export function saveAttempt(result) {
  try {
    const existing = loadHistory();
    const entry = {
      id: result.session_id,
      subject_code: result.subject_code,
      subject_name: result.subject_name,
      score: result.score,
      total: result.total,
      percentage: result.percentage,
      correct: result.correct_count,
      wrong: result.wrong_count,
      skipped: result.unattempted,
      time_taken_sec: result.time_taken_sec,
      at: Date.now(),
    };
    const next = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(
      0,
      MAX
    );
    localStorage.setItem(KEY, JSON.stringify(next));
    return entry;
  } catch {
    return null;
  }
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
}

export function getStats() {
  const hist = loadHistory();
  if (hist.length === 0) {
    return { attempts: 0, avg: 0, best: 0, last: null };
  }
  const sum = hist.reduce((a, b) => a + b.percentage, 0);
  const best = hist.reduce((a, b) => (b.percentage > a ? b.percentage : a), 0);
  return {
    attempts: hist.length,
    avg: Math.round(sum / hist.length),
    best: Math.round(best),
    last: hist[0],
  };
}
