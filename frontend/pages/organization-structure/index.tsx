import Link from "next/link";
import { useRouter } from "next/router";
import { Building2, Briefcase, Network, ArrowLeft } from "lucide-react";

export default function OrganizationHome() {
  const router = useRouter();

  return (
    <div className="min-h-screen px-14 py-12 text-white bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">

      {/* ===== TOP BAR ===== */}
      <div className="flex items-center mb-10">
        <button
          onClick={() => router.push("/dashboard")}
          className="glass-btn flex items-center gap-2 px-6 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      {/* ===== HEADER ===== */}
      <div className="glass-card p-10 mb-16 max-w-4xl">
        <h1 className="text-4xl font-semibold mb-3">
          Organization Structure
        </h1>
        <p className="text-white/70 text-lg">
          Manage departments, positions, and reporting structure
        </p>
      </div>

      {/* ===== CARDS GRID ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl">

        {/* Departments */}
        <Link href="/organization-structure/departments">
          <div className="glass-card p-10 cursor-pointer transition hover:scale-[1.03] hover:shadow-cyan-500/20 group">
            <Building2 className="w-10 h-10 mb-6 text-cyan-300 group-hover:text-cyan-200 transition" />
            <h2 className="text-2xl font-semibold mb-2">
              Departments
            </h2>
            <p className="text-white/70">
              Create and manage departments
            </p>
          </div>
        </Link>

        {/* Positions */}
        <Link href="/organization-structure/positions">
          <div className="glass-card p-10 cursor-pointer transition hover:scale-[1.03] hover:shadow-cyan-500/20 group">
            <Briefcase className="w-10 h-10 mb-6 text-cyan-300 group-hover:text-cyan-200 transition" />
            <h2 className="text-2xl font-semibold mb-2">
              Positions
            </h2>
            <p className="text-white/70">
              Manage job positions and titles
            </p>
          </div>
        </Link>

        {/* Org Chart */}
        <Link href="/organization-structure/org-chart">
          <div className="glass-card p-10 cursor-pointer transition hover:scale-[1.03] hover:shadow-cyan-500/20 group">
            <Network className="w-10 h-10 mb-6 text-cyan-300 group-hover:text-cyan-200 transition" />
            <h2 className="text-2xl font-semibold mb-2">
              Org Chart
            </h2>
            <p className="text-white/70">
              View reporting structure
            </p>
          </div>
        </Link>

      </div>
    </div>
  );
}
