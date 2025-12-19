import React, { useState, useEffect } from "react";
import type { JSX } from "react";
import Link from "next/link";
import {
  Users,
  Network,
  Target,
  Clock,
  UserPlus,
  Calendar,
  DollarSign,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";

/* =====================================================
   MODULES (FULL SYSTEM – LOGGED IN)
===================================================== */
const modules = [
  {
    name: "Employee Profile",
    desc: "Centralized employee records, documents, contracts, and master data.",
    icon: <Users className="w-8 h-8" />,
    gradient: "from-blue-500 to-cyan-500",
    route: "/dashboard",
  },
  {
    name: "Leaves Management",
    desc: "Leave types, balances, accruals, requests, approvals, and policy automation.",
    icon: <Calendar className="w-8 h-8" />,
    gradient: "from-cyan-500 to-teal-500",
    route: "/subsystems/leaves",
  },
  {
    name: "Payroll Configuration",
    desc: "Salary structures, allowances, deductions, tax rules, and payroll settings.",
    icon: <DollarSign className="w-8 h-8" />,
    gradient: "from-blue-600 to-indigo-600",
    route: "/subsystems/payroll-configuration",
  },
  {
    name: "Payroll Execution",
    desc: "Payroll cycle processing, run generation, validations, and salary calculations.",
    icon: <Clock className="w-8 h-8" />,
    gradient: "from-indigo-500 to-purple-500",
    route: "/subsystems/payroll-execution",
  },
  {
    name: "Payroll Tracking",
    desc: "History tracking, pay slips, audit logs, and payroll reports.",
    icon: <Target className="w-8 h-8" />,
    gradient: "from-purple-500 to-pink-500",
    route: "/subsystems/payroll-tracking",
  },
  {
    name: "Recruitment",
    desc: "Job posting, applicant tracking, interviews, evaluations, and hiring pipeline.",
    icon: <UserPlus className="w-8 h-8" />,
    gradient: "from-blue-500 to-indigo-500",
    route: "/subsystems/recruitment",
  },
  {
    name: "Time Management",
    desc: "Attendance, overtime, shifts, schedules, and time exception handling.",
    icon: <Clock className="w-8 h-8" />,
    gradient: "from-teal-500 to-emerald-500",
    route: "/subsystems/time-management",
  },
];

export default function Home(): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [applyMode, setApplyMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  /* =====================================================
     CHECK LOGIN
  ===================================================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserType = localStorage.getItem("userType");

    setIsLoggedIn(!!token);
    setUserType(storedUserType);
  }, []);

  /* =====================================================
     LOGOUT
  ===================================================== */
  function handleLogout() {
    localStorage.clear();
    window.location.href = "/";
  }

  /* =====================================================
     ✅ ONLY FIX — FILTER MODULES BY USER TYPE
  ===================================================== */
  const visibleModules =
    userType === "CANDIDATE"
      ? modules.filter((m) => m.name === "Recruitment")
      : modules;

  /* =====================================================
     GUEST PAGE (NOT LOGGED IN)
  ===================================================== */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">

        {/* NAVBAR */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur-md" />
                <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
              <h1 className="text-2xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                HR System
              </h1>
            </div>

            <div className="hidden lg:flex gap-3">
              <button
                onClick={() => setApplyMode(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-500 rounded-xl"
              >
                Apply
              </button>

              <Link href="/login">
                <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl">
                  Login
                </button>
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>

        {/* CONTENT */}
        <main className="pt-40 px-6 max-w-5xl mx-auto text-center">
          {!applyMode ? (
            <>
              <h2 className="text-6xl font-light mb-6">
                Welcome to the <br />
                <span className="text-blue-300">HR System</span>
              </h2>

              <p className="text-xl text-gray-300 mb-10">
                Apply for jobs or login if you are an employee.
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setApplyMode(true)}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-500 rounded-2xl"
                >
                  Apply Now
                </button>

                <Link href="/login">
                  <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl">
                    Login
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-5xl mb-6">Recruitment</h2>
              <p className="text-gray-400 mb-10">Apply for open positions.</p>

              <Link href="/register">
                <button className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-500 rounded-2xl">
                  Apply as Candidate
                </button>
              </Link>

              <button
                onClick={() => setApplyMode(false)}
                className="block mt-6 text-gray-400 hover:text-white"
              >
                ← Back
              </button>
            </>
          )}
        </main>
      </div>
    );
  }

  /* =====================================================
     LOGGED IN PAGE
  ===================================================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">

      {/* LOGOUT BUTTON */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={handleLogout}
          className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-xl"
        >
          Logout
        </button>
      </div>

      <main className="pt-32 px-6 max-w-7xl mx-auto">
        <h2 className="text-5xl mb-12 text-center">HR System Modules</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleModules.map((m) => (
            <Link key={m.name} href={m.route}>
              <div className="group relative cursor-pointer">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${m.gradient} blur-xl opacity-20 rounded-3xl`}
                />
                <div className="relative bg-white/5 border border-white/10 p-6 rounded-3xl hover:-translate-y-2 transition-all">
                  <div
                    className={`p-3 mb-4 rounded-2xl bg-gradient-to-br ${m.gradient}`}
                  >
                    {m.icon}
                  </div>
                  <h4 className="text-xl mb-2">{m.name}</h4>
                  <p className="text-gray-400 text-sm">{m.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
