import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";
import { useRouteGuard } from "../../../utils/routeGuard";

export default function MyAppraisalsPage() {
  const router = useRouter();
  // Route guard: Employee only
  useRouteGuard("EMPLOYEE");

  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMyAppraisals();
  }, []);

  async function loadMyAppraisals() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await api.get("/performance/my-appraisals", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.items ?? res.data?.data ?? [];

      setAppraisals(data);
    } catch (err: any) {
      console.error("❌ Load my appraisals error:", err);
      setError("Failed to load appraisals");
      setAppraisals([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold mb-6">My Performance Appraisals</h1>

        {loading && <p className="text-white/70">Loading...</p>}

        {error && <p className="text-red-400">{error}</p>}

        {!loading && appraisals.length === 0 && (
          <div className="glass-card p-8 text-center text-white/60">
            No appraisals assigned yet.
          </div>
        )}

        {!loading && appraisals.length > 0 && (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">Cycle ID</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Overall Rating</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appraisals.map((a) => (
                  <tr
                    key={a._id}
                    className="border-t border-white/10 hover:bg-white/5 transition"
                  >
                    <td className="px-6 py-4">
                      {typeof a.cycleId === "object" && a.cycleId?.name
                        ? a.cycleId.name
                        : a.cycleId || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          a.status === "HR_PUBLISHED"
                            ? "bg-green-500/20 text-green-400"
                            : a.status === "DRAFT"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {a.overallRatingLabel || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Only show View button for PUBLISHED appraisals */}
                      {a.status === "HR_PUBLISHED" && (
                      <button
                        onClick={() =>
                          router.push(`/performance/my-appraisals/${a._id}`)
                        }
                        className="glass-btn px-4 py-2"
                      >
                        View
                      </button>
                      )}
                      {a.status !== "HR_PUBLISHED" && (
                        <span className="text-white/40 text-sm">Not published</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 glass-btn px-6 py-2"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
