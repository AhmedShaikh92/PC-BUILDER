import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Darken nav on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { to: "/build", label: "Build" },
    { to: "/recommend", label: "Recommend" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b-gray-500 ${
          scrolled
            ? "bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 shadow-lg shadow-black/30"
            : "bg-neutral-950/70 backdrop-blur-sm border-b border-neutral-900"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo */}
            <Link to="/" className="shrink-0 group">
              <span
                className="md:text-xl text-2xl font-light text-neutral-100 group-hover:text-neutral-300 transition-colors tracking-tight"
                style={{ fontFamily: "Rubik Distressed, serif" }}
              >
                Build My <span className="font-normal">PC</span>
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden sm:flex items-center gap-1">
              {links.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`relative px-4 py-2 text-sm transition-colors tracking-wide ${
                    isActive(to)
                      ? "text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                  style={{ fontFamily: "Special Elite, serif" }}
                >
                  {label}
                  {/* Active underline */}
                  {isActive(to) && (
                    <span className="absolute bottom-0 left-4 right-4 h-px bg-neutral-400 rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              className="sm:hidden flex items-center justify-center w-9 h-9 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer rounded-sm border border-neutral-800 hover:border-neutral-600"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-neutral-800 bg-neutral-950/98 px-4 py-3 flex flex-col gap-1">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                  isActive(to)
                    ? "text-neutral-100 bg-neutral-800/60"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                }`}
                style={{ fontFamily: "Special Elite, serif" }}
              >
                {isActive(to) && (
                  <span className="w-1 h-1 rounded-full bg-neutral-300 shrink-0" />
                )}
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}