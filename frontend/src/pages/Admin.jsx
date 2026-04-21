import { useEffect, useState, useCallback } from "react";
import {
  Lock,
  LogOut,
  Upload,
  Type,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ListChecks,
  ImageIcon,
  Save,
} from "lucide-react";
import {
  adminAuth,
  adminParse,
  adminSave,
  adminList,
  adminDelete,
  adminStats,
  getAdminPwd,
  setAdminPwd,
  clearAdminPwd,
  fileToBase64,
} from "../lib/admin";

const SUBJECTS = [
  { code: "M1", label: "M1 — IT Tools" },
  { code: "M2", label: "M2 — Web Design" },
  { code: "M3", label: "M3 — Python" },
  { code: "M4", label: "M4 — IoT" },
];

const Toast = ({ kind, msg, onClose }) => {
  if (!msg) return null;
  const bg = kind === "error" ? "bg-red-500" : "bg-green-500";
  return (
    <div
      data-testid="admin-toast"
      className={`${bg} text-white font-heading font-bold nb-border rounded-xl px-4 py-2 nb-shadow-sm fixed bottom-5 right-5 z-[60] flex items-center gap-2`}
    >
      {kind === "error" ? (
        <AlertCircle className="w-4 h-4" strokeWidth={2.5} />
      ) : (
        <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
      )}
      {msg}
      <button
        onClick={onClose}
        className="ml-2 text-white/80 hover:text-white"
        aria-label="Close toast"
      >
        ×
      </button>
    </div>
  );
};

const QuestionEditor = ({ q, idx, onChange, onRemove }) => {
  const update = (patch) => onChange(idx, { ...q, ...patch });
  const setOption = (lang, i, val) => {
    const key = lang === "en" ? "options_en" : "options_hi";
    const next = [...q[key]];
    next[i] = val;
    update({ [key]: next });
  };
  return (
    <div
      data-testid={`admin-q-editor-${idx}`}
      className="bg-white nb-border rounded-2xl p-5 nb-shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="font-heading font-black text-sm uppercase tracking-widest text-zinc-500">
          Question {idx + 1}
        </div>
        <button
          data-testid={`admin-q-remove-${idx}`}
          onClick={() => onRemove(idx)}
          className="inline-flex items-center gap-1 bg-red-100 text-red-700 font-heading font-bold text-xs px-2 py-1 rounded-lg nb-border nb-shadow-sm nb-hover"
        >
          <Trash2 className="w-3 h-3" strokeWidth={2.5} />
          Remove
        </button>
      </div>

      <label className="block text-xs font-bold uppercase tracking-widest mb-1">
        Question (EN)
      </label>
      <textarea
        data-testid={`admin-q-en-${idx}`}
        value={q.q_en}
        onChange={(e) => update({ q_en: e.target.value })}
        rows={2}
        className="w-full font-body nb-border rounded-lg p-2 bg-white"
      />

      <label className="block text-xs font-bold uppercase tracking-widest mt-3 mb-1">
        प्रश्न (हिंदी)
      </label>
      <textarea
        data-testid={`admin-q-hi-${idx}`}
        value={q.q_hi}
        onChange={(e) => update({ q_hi: e.target.value })}
        rows={2}
        className="w-full font-body nb-border rounded-lg p-2 bg-white"
      />

      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-2">
            Options (EN)
          </div>
          <div className="space-y-2">
            {q.options_en.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${idx}`}
                  checked={q.a === i}
                  onChange={() => update({ a: i })}
                  data-testid={`admin-q-correct-${idx}-${i}`}
                />
                <span className="font-heading font-black w-5">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  data-testid={`admin-q-opt-en-${idx}-${i}`}
                  value={opt}
                  onChange={(e) => setOption("en", i, e.target.value)}
                  className="flex-1 nb-border rounded-lg px-2 py-1 bg-white"
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-2">
            विकल्प (हिंदी)
          </div>
          <div className="space-y-2">
            {q.options_hi.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-heading font-black w-5">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  data-testid={`admin-q-opt-hi-${idx}-${i}`}
                  value={opt}
                  onChange={(e) => setOption("hi", i, e.target.value)}
                  className="flex-1 nb-border rounded-lg px-2 py-1 bg-white"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-1">
            Explanation (EN)
          </label>
          <input
            data-testid={`admin-exp-en-${idx}`}
            value={q.exp_en}
            onChange={(e) => update({ exp_en: e.target.value })}
            className="w-full nb-border rounded-lg px-2 py-1 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-1">
            व्याख्या (हिंदी)
          </label>
          <input
            data-testid={`admin-exp-hi-${idx}`}
            value={q.exp_hi}
            onChange={(e) => update({ exp_hi: e.target.value })}
            className="w-full nb-border rounded-lg px-2 py-1 bg-white"
          />
        </div>
      </div>

      <div className="mt-3 text-xs font-bold text-zinc-500">
        Correct: <span className="text-green-700">{String.fromCharCode(65 + q.a)}</span>
      </div>
    </div>
  );
};

const Admin = () => {
  const [authed, setAuthed] = useState(!!getAdminPwd());
  const [pwdInput, setPwdInput] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [mode, setMode] = useState("text"); // text | image
  const [rawText, setRawText] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [subject, setSubject] = useState("M1");

  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState([]);

  const [toast, setToast] = useState({ kind: "success", msg: "" });
  const [stats, setStats] = useState({ counts: {}, total: 0 });
  const [existing, setExisting] = useState([]);

  const showToast = (kind, msg) => {
    setToast({ kind, msg });
    setTimeout(() => setToast({ kind, msg: "" }), 3500);
  };

  const refresh = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([adminStats(), adminList()]);
      setStats(s);
      setExisting(l.questions || []);
    } catch (e) {
      if (e?.response?.status === 401) {
        clearAdminPwd();
        setAuthed(false);
      }
    }
  }, []);

  useEffect(() => {
    if (authed) refresh();
  }, [authed, refresh]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!pwdInput) return;
    setAuthLoading(true);
    try {
      await adminAuth(pwdInput);
      setAdminPwd(pwdInput);
      setAuthed(true);
      setPwdInput("");
    } catch {
      showToast("error", "Invalid password");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminPwd();
    setAuthed(false);
    setQuestions([]);
  };

  const handleImageChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(f.type)) {
      showToast("error", "Only PNG / JPEG / WEBP images supported");
      return;
    }
    const dataUrl = await fileToBase64(f);
    setImageDataUrl(dataUrl);
  };

  const handleParse = async () => {
    const content = mode === "text" ? rawText.trim() : imageDataUrl;
    if (!content) {
      showToast("error", mode === "text" ? "Paste some text first" : "Upload an image first");
      return;
    }
    setParsing(true);
    try {
      const res = await adminParse(mode, content);
      const parsed = res.questions || [];
      if (parsed.length === 0) {
        showToast("error", "No questions detected");
      } else {
        setQuestions(parsed);
        showToast("success", `${parsed.length} question(s) parsed — review and save`);
      }
    } catch (e) {
      if (e?.response?.status === 401) {
        clearAdminPwd();
        setAuthed(false);
      }
      showToast("error", e?.response?.data?.detail || "Parse failed");
    } finally {
      setParsing(false);
    }
  };

  const updateQuestion = (i, next) => {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? next : q)));
  };
  const removeQuestion = (i) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  };
  const addBlank = () => {
    setQuestions((prev) => [
      ...prev,
      {
        q_en: "",
        q_hi: "",
        options_en: ["", "", "", ""],
        options_hi: ["", "", "", ""],
        a: 0,
        exp_en: "",
        exp_hi: "",
      },
    ]);
  };

  const handleSaveAll = async () => {
    if (questions.length === 0) return;
    // basic validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.q_en.trim() || !q.q_hi.trim()) {
        showToast("error", `Q${i + 1}: both EN and HI question required`);
        return;
      }
      if (q.options_en.some((o) => !o.trim()) || q.options_hi.some((o) => !o.trim())) {
        showToast("error", `Q${i + 1}: all 4 options required in both languages`);
        return;
      }
    }
    setSaving(true);
    try {
      const res = await adminSave(subject, questions);
      showToast("success", `Saved ${res.saved} question(s) to ${subject}`);
      setQuestions([]);
      setRawText("");
      setImageDataUrl("");
      refresh();
    } catch (e) {
      showToast("error", e?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (qid) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await adminDelete(qid);
      showToast("success", "Deleted");
      refresh();
    } catch (e) {
      showToast("error", e?.response?.data?.detail || "Delete failed");
    }
  };

  // ---- Login Screen ----
  if (!authed) {
    return (
      <div
        data-testid="admin-login"
        className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4"
      >
        <form
          onSubmit={handleLogin}
          className="bg-white nb-border rounded-2xl p-8 max-w-md w-full nb-shadow-lg"
        >
          <div className="w-12 h-12 bg-black text-white rounded-xl nb-border flex items-center justify-center mb-4">
            <Lock className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <h1 className="font-heading font-black text-3xl">Admin Panel</h1>
          <p className="text-zinc-600 mt-1 font-body">
            Enter password to continue.
          </p>
          <input
            data-testid="admin-password-input"
            type="password"
            value={pwdInput}
            onChange={(e) => setPwdInput(e.target.value)}
            placeholder="Admin password"
            autoFocus
            className="mt-5 w-full nb-border rounded-xl px-4 py-3 bg-white font-body"
          />
          <button
            data-testid="admin-login-btn"
            type="submit"
            disabled={authLoading}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-black text-white font-heading font-black px-5 py-3 rounded-xl nb-border nb-shadow nb-hover disabled:opacity-60"
          >
            {authLoading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />}
            Unlock
          </button>
        </form>
        <Toast
          kind={toast.kind}
          msg={toast.msg}
          onClose={() => setToast({ ...toast, msg: "" })}
        />
      </div>
    );
  }

  // ---- Main Admin UI ----
  return (
    <div data-testid="admin-page" className="min-h-screen bg-[#FDFBF7]">
      <header className="sticky top-0 z-30 bg-[#FDFBF7] border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-black text-white rounded-lg nb-border flex items-center justify-center">
              <Lock className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div className="font-heading font-black text-lg">
              Admin Panel
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              data-testid="admin-total-count"
              className="hidden sm:inline-flex items-center gap-2 bg-yellow-300 nb-border rounded-lg px-3 py-1.5 font-heading font-black text-xs nb-shadow-sm"
            >
              <ListChecks className="w-3.5 h-3.5" strokeWidth={2.5} />
              {stats.total} saved
            </span>
            <button
              data-testid="admin-logout-btn"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-white font-heading font-bold px-3 py-2 rounded-lg nb-border nb-shadow-sm nb-hover text-sm"
            >
              <LogOut className="w-4 h-4" strokeWidth={2.5} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SUBJECTS.map((s) => (
            <div
              key={s.code}
              className="bg-white nb-border rounded-xl p-3 nb-shadow-sm"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {s.label}
              </div>
              <div className="font-heading font-black text-2xl mt-1">
                {stats.counts?.[s.code] ?? 0}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="bg-white nb-border rounded-2xl p-5 nb-shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <button
              data-testid="admin-mode-text"
              onClick={() => setMode("text")}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg nb-border font-heading font-bold text-sm ${
                mode === "text" ? "bg-black text-white" : "bg-white"
              }`}
            >
              <Type className="w-4 h-4" strokeWidth={2.5} />
              Paste Text
            </button>
            <button
              data-testid="admin-mode-image"
              onClick={() => setMode("image")}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg nb-border font-heading font-bold text-sm ${
                mode === "image" ? "bg-black text-white" : "bg-white"
              }`}
            >
              <ImageIcon className="w-4 h-4" strokeWidth={2.5} />
              Upload Image
            </button>
          </div>

          {mode === "text" ? (
            <textarea
              data-testid="admin-text-input"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
              placeholder="Paste one or more MCQs (any format)... e.g., 'Q. What is 2+2? A) 3 B) 4 C) 5 D) 6 Ans: B'"
              className="w-full nb-border rounded-lg p-3 bg-white font-body"
            />
          ) : (
            <div>
              <label
                htmlFor="admin-image-file"
                className="inline-flex items-center gap-2 bg-white font-heading font-bold px-4 py-2 rounded-xl nb-border nb-shadow-sm nb-hover cursor-pointer text-sm"
              >
                <Upload className="w-4 h-4" strokeWidth={2.5} />
                {imageDataUrl ? "Change image" : "Choose image"}
              </label>
              <input
                id="admin-image-file"
                data-testid="admin-image-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
              {imageDataUrl && (
                <img
                  src={imageDataUrl}
                  alt="Uploaded preview"
                  className="mt-3 max-h-64 rounded-lg nb-border"
                />
              )}
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest">
                Subject
              </span>
              <select
                data-testid="admin-subject-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="nb-border rounded-lg px-2 py-1.5 bg-white font-heading font-bold text-sm"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              data-testid="admin-parse-btn"
              onClick={handleParse}
              disabled={parsing}
              className="inline-flex items-center gap-2 bg-blue-500 text-white font-heading font-black px-5 py-2 rounded-xl nb-border nb-shadow nb-hover disabled:opacity-60"
            >
              {parsing ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
              ) : (
                <Sparkles className="w-4 h-4" strokeWidth={2.5} />
              )}
              Parse with AI
            </button>
            <button
              data-testid="admin-add-blank-btn"
              onClick={addBlank}
              className="inline-flex items-center gap-2 bg-white font-heading font-bold px-4 py-2 rounded-xl nb-border nb-shadow-sm nb-hover text-sm"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Add blank
            </button>
          </div>
        </div>

        {/* Editable preview */}
        {questions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-black text-2xl">
                Preview ({questions.length})
              </h2>
              <button
                data-testid="admin-save-all-btn"
                onClick={handleSaveAll}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-black text-white font-heading font-black px-5 py-2 rounded-xl nb-border nb-shadow nb-hover disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Save className="w-4 h-4" strokeWidth={2.5} />
                )}
                Save All to {subject}
              </button>
            </div>
            {questions.map((q, i) => (
              <QuestionEditor
                key={i}
                q={q}
                idx={i}
                onChange={updateQuestion}
                onRemove={removeQuestion}
              />
            ))}
          </div>
        )}

        {/* Existing admin questions */}
        <div className="bg-white nb-border rounded-2xl p-5 nb-shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-xl">
              Admin-saved Questions
            </h2>
            <span className="text-xs font-bold text-zinc-500">
              Total: {existing.length}
            </span>
          </div>
          <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
            {existing.length === 0 && (
              <div className="text-sm font-body text-zinc-600">
                Nothing yet. Upload some questions above!
              </div>
            )}
            {existing.map((q) => (
              <div
                key={q.id}
                data-testid={`admin-existing-${q.id}`}
                className="flex items-start justify-between gap-3 py-2 border-b border-zinc-200 last:border-0"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {q.subject_code} · {q.id}
                  </div>
                  <div className="font-heading font-bold text-sm truncate">
                    {q.q_en}
                  </div>
                  <div className="font-body text-sm text-zinc-600 truncate">
                    {q.q_hi}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(q.id)}
                  data-testid={`admin-delete-${q.id}`}
                  className="inline-flex items-center gap-1 bg-red-100 text-red-700 font-heading font-bold text-xs px-2 py-1 rounded-lg nb-border nb-shadow-sm nb-hover shrink-0"
                >
                  <Trash2 className="w-3 h-3" strokeWidth={2.5} />
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Toast
        kind={toast.kind}
        msg={toast.msg}
        onClose={() => setToast({ ...toast, msg: "" })}
      />
    </div>
  );
};

export default Admin;
