import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

export default function DisputeDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadDispute();
  }, [id]);

  async function loadDispute() {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:3001/performance/disputes/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDispute(res.data);
    } catch (e) {
      setError("Dispute not found");
    } finally {
      setLoading(false);
    }
  }

  async function resolveDispute() {
    if (!resolutionSummary.trim()) {
      alert("Please provide a resolution summary");
      return;
    }

    if (!confirm("Are you sure you want to resolve this dispute?")) return;

    try {
      setResolving(true);
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:3001/performance/disputes/${id}/resolve`,
        {
          newStatus: "ADJUSTED",
          resolutionSummary: resolutionSummary,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Dispute resolved successfully!");
      router.push("/performance/disputes");
    } catch (e: any) {
      console.error("Failed to resolve dispute:", e);
      alert(e?.response?.data?.message || "Failed to resolve dispute");
    } finally {
      setResolving(false);
    }
  }

  function getStatusBadge(status: string) {
    const colors: any = {
      OPEN: "bg-red-500/20 text-red-400 border-red-500/30",
      UNDER_REVIEW: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      ADJUSTED: "bg-green-500/20 text-green-400 border-green-500/30",
      REJECTED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[status] || "bg-white/10 text-white/70 border-white/20";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <p className="text-red-400">{error || "Dispute not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-6">
          <h1 className="text-2xl font-bold mb-6">Dispute Details</h1>

          {/* Status Badge */}
          <div className="mb-6">
            <label className="text-sm text-white/60 mb-1 block">Status</label>
            <span
              className={`inline-block px-3 py-1 rounded text-sm font-medium border ${getStatusBadge(
                dispute.status
              )}`}
            >
              {dispute.status}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm text-white/60 mb-1 block">
                Appraisal ID
              </label>
              <p className="text-white font-mono text-sm">
                {String(dispute.appraisalId)}
              </p>
            </div>

            <div>
              <label className="text-sm text-white/60 mb-1 block">
                Cycle ID
              </label>
              <p className="text-white font-mono text-sm">
                {String(dispute.cycleId)}
              </p>
            </div>

            <div>
              <label className="text-sm text-white/60 mb-1 block">
                Raised By Employee ID
              </label>
              <p className="text-white font-mono text-sm">
                {String(dispute.raisedByEmployeeId)}
              </p>
            </div>

            <div>
              <label className="text-sm text-white/60 mb-1 block">Reason</label>
              <p className="text-white">{dispute.reason}</p>
            </div>

            {dispute.details && (
              <div>
                <label className="text-sm text-white/60 mb-1 block">
                  Details
                </label>
                <p className="text-white whitespace-pre-wrap">{dispute.details}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-white/60 mb-1 block">
                Submitted At
              </label>
              <p className="text-white">
                {new Date(dispute.submittedAt).toLocaleString()}
              </p>
            </div>

            {dispute.resolvedAt && (
              <>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">
                    Resolution Summary
                  </label>
                  <p className="text-white whitespace-pre-wrap">
                    {dispute.resolutionSummary}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">
                    Resolved At
                  </label>
                  <p className="text-white">
                    {new Date(dispute.resolvedAt).toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Resolve Form - Only show if status is OPEN */}
          {dispute.status === "OPEN" && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h2 className="text-lg font-semibold mb-4">Resolve Dispute</h2>
              <div className="mb-4">
                <label className="text-sm text-white/60 mb-2 block">
                  Resolution Summary <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="Enter the resolution summary and any actions taken..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  rows={4}
                />
              </div>
              <button
                onClick={resolveDispute}
                disabled={resolving || !resolutionSummary.trim()}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {resolving ? "Resolving..." : "Resolve Dispute"}
              </button>
            </div>
          )}

          {/* Already Resolved Message */}
          {dispute.status !== "OPEN" && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 font-semibold">
                ✓ This dispute has been resolved
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              onClick={() => router.push("/performance/disputes")}
              className="px-4 py-2 text-sm text-white/70 hover:text-white font-medium rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              ← Back to Disputes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}