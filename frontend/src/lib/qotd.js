const KEY = "olevel_qotd_v1";

export function getQotdState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveQotdAttempt({ date, qid, selected, isCorrect, snapshot }) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        date,
        qid,
        selected,
        isCorrect,
        snapshot, // full question payload so we can render after refresh even if pool shifts
        at: Date.now(),
      })
    );
  } catch {
    /* ignore */
  }
}
