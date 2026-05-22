import { Link } from "react-router-dom";

export default function Header({ logoSrc, homeTo = "/" }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-nu-blue">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          to={homeTo}
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <img
            src={logoSrc}
            alt="NUAI Logo"
            className="h-11 w-auto object-contain sm:h-14"
          />
          <div className="leading-tight">
            <p className="text-xl font-extrabold tracking-wide text-white sm:text-2xl">
              NUAI
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/60 sm:text-[11px]">
              National University Alumni Information
            </p>
          </div>
        </Link>

        <span className="hidden text-sm font-semibold tracking-wide text-white sm:block">
          NU MOA
        </span>
      </div>
      <div className="h-[3px] bg-nu-gold" />
    </header>
  );
}
