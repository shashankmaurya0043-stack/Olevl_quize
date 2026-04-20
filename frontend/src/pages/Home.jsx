import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  FileText,
  Trophy,
  Sparkles,
  Code2,
  Cpu,
  Globe,
  Wrench,
  Zap,
  Target,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { getSubjects, getMockInfo } from "../lib/api";

const SUBJECT_VISUALS = {
  M1: { bg: "bg-m1", Icon: Wrench, emoji: "IT" },
  M2: { bg: "bg-m2", Icon: Globe, emoji: "WEB" },
  M3: { bg: "bg-m3", Icon: Code2, emoji: "PY" },
  M4: { bg: "bg-m4", Icon: Cpu, emoji: "IoT" },
};

const Home = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [mock, setMock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSubjects(), getMockInfo()])
      .then(([subs, m]) => {
        setSubjects(subs);
        setMock(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div data-testid="home-page" className="min-h-screen bg-[#FDFBF7]">
      <Navbar />

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-14">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-yellow-300 nb-border rounded-full px-4 py-1.5 nb-shadow-sm mb-6">
              <Sparkles className="w-4 h-4" strokeWidth={2.5} />
              <span className="font-heading font-bold text-sm">
                NIELIT O Level Preparation
              </span>
            </div>

            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
              Crack O Level Exams
              <br />
              like a <span className="bg-blue-500 text-white px-3 py-0.5 rounded-xl nb-border nb-shadow inline-block rotate-[-2deg]">Pro</span>
              <span className="text-blue-600">.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg font-body text-zinc-700 max-w-xl leading-relaxed">
              MCQs, timed quizzes, full mock tests aur instant explanations — sab kuch
              free mein. Bas topic choose karo, timer start karo, aur apna score
              dekho. <span className="font-bold text-black">Easy aur fun!</span>
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                data-testid="hero-start-mock-btn"
                onClick={() => navigate("/quiz/MOCK")}
                className="inline-flex items-center gap-2 bg-black text-white font-heading font-bold px-6 py-3 rounded-xl nb-border nb-shadow-lg nb-hover-lg"
              >
                Start Mock Test
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <a
                href="#subjects"
                data-testid="hero-browse-subjects-btn"
                className="inline-flex items-center gap-2 bg-white font-heading font-bold px-6 py-3 rounded-xl nb-border nb-shadow nb-hover"
              >
                Browse Subjects
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
              {[
                { n: "100+", l: "Questions" },
                { n: "4", l: "Subjects" },
                { n: "Free", l: "Forever" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="bg-white nb-border rounded-xl px-3 py-3 text-center nb-shadow-sm"
                >
                  <div className="font-heading font-black text-xl sm:text-2xl">
                    {s.n}
                  </div>
                  <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative bg-white nb-border rounded-2xl overflow-hidden nb-shadow-lg aspect-[4/5] max-w-md mx-auto">
              <img
                src="https://images.unsplash.com/photo-1637589308599-3478cc55510d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2ODl8MHwxfHNlYXJjaHwyfHxpbmRpYW4lMjBzdHVkZW50JTIwc3R1ZHlpbmclMjB3aXRoJTIwbGFwdG9wJTIwYW5kJTIwc21pbGluZ3xlbnwwfHx8fDE3NzY3MTA0ODB8MA&ixlib=rb-4.1.0&q=85"
                alt="Student studying"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white nb-border rounded-xl p-3 nb-shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-green-300 nb-border rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-heading font-bold text-sm">
                    Badhiya score laa!
                  </div>
                  <div className="text-xs text-zinc-600">
                    Instant results + full review
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -top-6 -right-2 bg-yellow-300 nb-border rounded-xl px-3 py-2 nb-shadow rotate-[6deg]">
              <div className="font-heading font-black text-sm">20 min ⏱</div>
            </div>
            <div className="hidden lg:block absolute -bottom-4 -left-4 bg-pink-300 nb-border rounded-xl px-3 py-2 nb-shadow -rotate-[4deg]">
              <div className="font-heading font-black text-sm">Instant scoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section
        id="subjects"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-10 scroll-mt-20"
      >
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">
              Pick your paper
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight mt-1">
              Subject-wise Quizzes
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 bg-white nb-border rounded-full px-4 py-2 nb-shadow-sm">
            <Clock className="w-4 h-4" strokeWidth={2.5} />
            <span className="font-heading font-bold text-sm">
              20 Qs / 20 min each
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white nb-border rounded-2xl h-56 nb-shadow animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {subjects.map((s, i) => {
              const visual = SUBJECT_VISUALS[s.code] || SUBJECT_VISUALS.M1;
              const Icon = visual.Icon;
              return (
                <button
                  key={s.code}
                  data-testid={`subject-card-${s.code}`}
                  onClick={() => navigate(`/quiz/${s.code}`)}
                  className={`text-left ${visual.bg} nb-border rounded-2xl p-6 nb-shadow-lg nb-hover-lg animate-slide-up group`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-14 h-14 bg-white nb-border rounded-xl flex items-center justify-center nb-shadow-sm">
                      <Icon className="w-7 h-7 text-black" strokeWidth={2.5} />
                    </div>
                    <div className="text-right">
                      <div className="bg-white nb-border rounded-lg px-2 py-1 text-[10px] font-heading font-black tracking-widest">
                        {visual.emoji}
                      </div>
                    </div>
                  </div>

                  <h3 className="font-heading font-black text-xl sm:text-2xl mt-5 leading-tight">
                    {s.name}
                  </h3>
                  <p className="text-sm font-medium text-zinc-800 mt-2">
                    {s.desc}
                  </p>

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex gap-2">
                      <span className="inline-flex items-center gap-1 bg-white nb-border rounded-full px-3 py-1 text-xs font-bold">
                        <FileText className="w-3.5 h-3.5" strokeWidth={2.5} />
                        {s.num_questions} Qs
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white nb-border rounded-full px-3 py-1 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                        {s.duration_min} min
                      </span>
                    </div>
                    <div className="w-10 h-10 bg-black text-white rounded-full nb-border flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* MOCK TEST */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {mock && (
          <div
            data-testid="mock-test-banner"
            className="relative overflow-hidden bg-black text-white nb-border rounded-3xl p-8 sm:p-12 nb-shadow-lg"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, #ffffff 0.5px, transparent 1px), radial-gradient(circle at 80% 50%, #ffffff 0.5px, transparent 1px)",
                backgroundSize: "40px 40px, 60px 60px",
              }}
            />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-yellow-300 text-black nb-border rounded-full px-3 py-1 mb-4">
                  <Zap className="w-4 h-4" strokeWidth={2.5} />
                  <span className="font-heading font-black text-xs uppercase tracking-widest">
                    Ultimate Challenge
                  </span>
                </div>
                <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight">
                  Full Mock Test
                </h2>
                <p className="mt-4 text-white/80 text-base sm:text-lg max-w-lg">
                  Sabhi subjects se mixed questions. Real exam feel. Timer on.
                  Tayyar ho? Let's see your true level!
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="bg-white/10 border-2 border-white/30 rounded-xl px-4 py-2 font-heading font-bold">
                    {mock.num_questions} Questions
                  </div>
                  <div className="bg-white/10 border-2 border-white/30 rounded-xl px-4 py-2 font-heading font-bold">
                    {mock.duration_min} Minutes
                  </div>
                  <div className="bg-white/10 border-2 border-white/30 rounded-xl px-4 py-2 font-heading font-bold">
                    Mixed Subjects
                  </div>
                </div>

                <button
                  data-testid="mock-test-start-btn"
                  onClick={() => navigate("/quiz/MOCK")}
                  className="mt-8 inline-flex items-center gap-2 bg-yellow-300 text-black font-heading font-black px-6 py-3 rounded-xl border-2 border-yellow-300 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.6)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  Shuru karein
                  <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>

              <div className="relative">
                <div className="bg-white/10 border-2 border-white/40 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-yellow-300 text-black nb-border rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-lg">
                        Test Strategy
                      </div>
                      <div className="text-sm text-white/70">
                        Quick tips for best results
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-white/90">
                    <li className="flex gap-2">
                      <span className="text-yellow-300 font-black">→</span>
                      Easy questions pehle attempt karo
                    </li>
                    <li className="flex gap-2">
                      <span className="text-yellow-300 font-black">→</span>
                      Negative marking nahi hai — guess karna OK
                    </li>
                    <li className="flex gap-2">
                      <span className="text-yellow-300 font-black">→</span>
                      Timer watch karte raho, rush mat karo
                    </li>
                    <li className="flex gap-2">
                      <span className="text-yellow-300 font-black">→</span>
                      Submit ke baad detailed review milega
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-10 text-center">
        <p className="text-sm text-zinc-600 font-body">
          Built with <span className="text-red-500">♥</span> for O Level aspirants. All
          the best!
        </p>
      </footer>
    </div>
  );
};

export default Home;
