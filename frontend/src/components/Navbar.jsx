import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Rocket } from "lucide-react";

export const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav
      data-testid="main-navbar"
      className="sticky top-0 z-40 bg-[#FDFBF7] border-b-2 border-black"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link
          to="/"
          data-testid="nav-home-link"
          className="flex items-center gap-2 group"
        >
          <div className="w-10 h-10 bg-yellow-300 nb-border rounded-lg flex items-center justify-center nb-shadow-sm nb-hover">
            <GraduationCap className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-heading font-black text-lg tracking-tight">
              OLevel<span className="text-blue-600">.Quiz</span>
            </span>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              Padhai with Passion
            </span>
          </div>
        </Link>

        <button
          data-testid="nav-mock-test-btn"
          onClick={() => navigate("/quiz/MOCK")}
          className="hidden sm:inline-flex items-center gap-2 bg-black text-white font-heading font-bold px-4 py-2 rounded-xl nb-border nb-shadow nb-hover"
        >
          <Rocket className="w-4 h-4" strokeWidth={2.5} />
          Mock Test
        </button>
        <button
          data-testid="nav-mock-test-btn-mobile"
          onClick={() => navigate("/quiz/MOCK")}
          aria-label="Start Mock Test"
          className="sm:hidden inline-flex items-center gap-2 bg-black text-white font-heading font-bold px-3 py-2 rounded-lg nb-border nb-shadow-sm nb-hover"
        >
          <Rocket className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
