import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import GooeyNav from "./reactbits/GooeyNav";

const navLinks = [
  { path: "/", label: "Accueil" },
  { path: "/formations", label: "Formations" },
  { path: "/nknews", label: "NK NEWS" },
  { path: "/contact", label: "Contact" },
  { path: "/reservations", label: "Ma réservation" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const activeIndex = useMemo(
    () => Math.max(navLinks.findIndex((link) => link.path === pathname), 0),
    [pathname]
  );

  const gooeyItems = useMemo(
    () =>
      navLinks.map((link) => ({
        label: link.label,
        href: link.path,
        onClick: () => {
          navigate(link.path);
          closeMenu();
        },
      })),
    [navigate]
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-brand-midnight/70 shadow-glow-soft backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-white" onClick={closeMenu}>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-dark text-white shadow-glow">
            AT
          </span>
          <div className="leading-tight text-white/80">
            <span className="tracking-wide">Ateliers Théâtre & doublage</span>
            <span className="block text-xs font-normal uppercase text-white/50">Nantes</span>
          </div>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <GooeyNav items={gooeyItems} activeIndex={activeIndex} />
          <Link to="/formations" className="btn-primary text-xs uppercase tracking-[0.38em]">
            Réserver une formation
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-white transition hover:border-brand-primary hover:bg-brand-primary/20 md:hidden"
          onClick={toggleMenu}
          aria-label="Ouvrir le menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={isOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"}
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 bg-brand-midnight/95 shadow-glow md:hidden">
          <nav className="flex flex-col px-6 py-4 text-white/80">
            {navLinks.map((link) => (
              <button
                key={link.path}
                type="button"
                className={`py-2 text-left text-base ${pathname === link.path ? "text-white" : "text-white/70"}`}
                onClick={() => {
                  navigate(link.path);
                  closeMenu();
                }}
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              className="btn-primary mt-4 text-center text-xs uppercase tracking-widest"
              onClick={() => {
                navigate("/formations");
                closeMenu();
              }}
            >
              Réserver une formation
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
