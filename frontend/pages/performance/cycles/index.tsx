// pages/performance/cycles/index.tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";

type Cycle = {
  _id: string;
  name: string;
  status: "PLANNED" | "ACTIVE" | "CLOSED" | "ARCHIVED";
  startDate?: string;
  endDate?: string;
};

export default function PerformanceCyclesPage() {
  const router = useRouter();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : null;

  const isManager = useMemo(() => role === "DEPARTMENT_HEAD", [role]);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await api.get("/performance/cycles", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCycles(res.data || []);
      } catch (e: any) {
        setError(e.response?.data?.message || "Failed to load cycles ❌");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen px-8 py-10 text-white bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="glass-card p-8 max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold">Performance Cycles</h1>
            <p className="text-white/60 text-sm mt-1">
              {isManager
                ? "Manager view (read-only). Open an ACTIVE cycle to create/continue appraisals."
                : "Cycle management."}
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="glass-btn px-5 py-2"
          >
            ← Back
          </button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/20 text-white/80">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((c) => (
                <tr
                  key={c._id}
                  className="border-t border-white/10 hover:bg-white/5 transition"
                >
                  <td className="p-3">{c.name}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs border ${
                        c.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : c.status === "CLOSED"
                          ? "bg-yellow-500/20 text-yellow-200 border-yellow-500/30"
                          : "bg-white/10 text-white/70 border-white/20"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => router.push(`/performance/cycles/${c._id}`)}
                      className="glow-btn px-4 py-1 text-sm"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}

              {cycles.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-white/60" colSpan={3}>
                    No cycles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
