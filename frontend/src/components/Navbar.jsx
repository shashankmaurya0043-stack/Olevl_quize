import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Rocket, History as HistoryIcon, Sun, Moon, Languages } from "lucide-react";
import { useTheme } from "../lib/theme";
import { useLang, t } from "../lib/lang";

export const Navbar = () => {
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang, isHi } = useLang();
  const isDark = theme === "dark";

  return (
    <nav
      data-testid="main-navbar"
      className="sticky top-0 z-40 bg-[#FDFBF7] border-b-2 border-black"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
        <Link
          to="/"
          data-testid="nav-home-link"
          className="flex items-center gap-2 group min-w-0 shrink"
        >
          <div className="w-10 h-10 bg-yellow-300 nb-border rounded-lg flex items-center justify-center nb-shadow-sm nb-hover shrink-0">
            <GraduationCap className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-heading font-black text-base sm:text-lg tracking-tight truncate">
              OLevel<span className="text-blue-600">.Quiz</span>
            </span>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest truncate">
              {t(lang, "padhai")}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <button
            data-testid="nav-lang-toggle"
            onClick={toggleLang}
            aria-label="Toggle language"
            title={isHi ? "Switch to English" : "हिंदी में बदलें"}
            className="h-10 px-3 bg-white rounded-lg nb-border nb-shadow-sm nb-hover flex items-center gap-1.5 font-heading font-black text-sm"
          >
            <Languages className="w-4 h-4" strokeWidth={2.5} />
            <span className={`${!isHi ? "text-black" : "text-zinc-400"}`}>EN</span>
            <span className="text-zinc-300 text-xs">|</span>
            <span className={`${isHi ? "text-black" : "text-zinc-400"}`}>हिं</span>
          </button>
          <button
            data-testid="nav-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="w-10 h-10 bg-white rounded-lg nb-border nb-shadow-sm nb-hover flex items-center justify-center"
          >
            {isDark ? (
              <Sun className="w-4 h-4" strokeWidth={2.5} />
            ) : (
              <Moon className="w-4 h-4" strokeWidth={2.5} />
            )}
          </button>
          <button
            data-testid="nav-history-btn"
            onClick={() => navigate("/history")}
            aria-label="View history"
            className="hidden sm:inline-flex w-auto h-10 px-3 bg-white rounded-lg nb-border nb-shadow-sm nb-hover items-center justify-center gap-2 font-heading font-bold text-sm"
          >
            <HistoryIcon className="w-4 h-4" strokeWidth={2.5} />
            {t(lang, "history")}
          </button>
          <button
            data-testid="nav-history-btn-mobile"
            onClick={() => navigate("/history")}
            aria-label="View history"
            className="sm:hidden w-10 h-10 bg-white rounded-lg nb-border nb-shadow-sm nb-hover flex items-center justify-center"
          >
            <HistoryIcon className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button
            data-testid="nav-mock-test-btn"
            onClick={() => navigate("/quiz/MOCK")}
            className="hidden md:inline-flex items-center gap-2 bg-black text-white font-heading font-bold px-4 h-10 rounded-xl nb-border nb-shadow nb-hover"
          >
            <Rocket className="w-4 h-4" strokeWidth={2.5} />
            {t(lang, "mock_test")}
          </button>
          <button
            data-testid="nav-mock-test-btn-mobile"
            onClick={() => navigate("/quiz/MOCK")}
            aria-label="Mock Test"
            className="md:hidden w-10 h-10 bg-black text-white rounded-lg nb-border nb-shadow-sm nb-hover flex items-center justify-center"
          >
            <Rocket className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
