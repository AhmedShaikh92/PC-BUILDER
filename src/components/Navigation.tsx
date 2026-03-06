import { Link, useLocation } from "react-router-dom";

export default function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group">
            <span
              className="text-2xl font-light text-neutral-100 hover:text-neutral-300 tracking-tight"
              style={{ fontFamily: "Rubik Distressed" }}
            >
              Build My <span className="font-normal">PC</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            <Link
              to="/build"
              className={`px-4 py-2 text-lg font-light transition-colors ${
                isActive("/build")
                  ? "text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
              style={{ fontFamily: "Special Elite" }}
            >
              Build
            </Link>

            <Link
              to="/recommend"
              className={`px-4 py-2 text-lg font-light transition-colors ${
                isActive("/recommend")
                  ? "text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
              style={{ fontFamily: "Special Elite" }}
            >
              Recommendation
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
