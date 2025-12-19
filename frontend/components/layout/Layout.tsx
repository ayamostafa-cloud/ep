import { ReactNode } from "react";
import Link from "next/link";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen">

      {/* TOP NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="glass flex items-center justify-between px-5 py-3">

            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="text-xl">⚙️</span>
              <span>HR System</span>
            </Link>

            {/* NAV LINKS */}
            <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
              <Link href="/modules" className="hover:text-white">Modules</Link>
              <Link href="/subsystems/employee-profile" className="hover:text-white">Employee</Link>
              <Link href="/subsystems/recruitment" className="hover:text-white">Recruitment</Link>
              <Link href="/subsystems/time-management" className="hover:text-white">Time</Link>
            </nav>

            {/* LOGIN */}
            <Link
              href="/login"
              className="btn-primary px-4 py-2 rounded-xl text-sm"
            >
              Login →
            </Link>

          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="pt-28">
        <div className="mx-auto max-w-7xl px-6">
          {children}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-24 pb-8 text-center text-white/60">
        © 2025 GIU HR Management System
      </footer>

    </div>
  );
}
