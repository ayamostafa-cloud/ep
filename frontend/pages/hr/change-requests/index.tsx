import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";

export default function HRChangeRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ===============================
  // LOAD ALL CHANGE REQUESTS (HR)
  // ===============================
  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return router.push("/login");

        const res = await api.get(
          "/employee-profile/change-requests/all",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setRequests(res.data || []);
      } catch (e) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  // ===============================
  // HELPERS (UNCHANGED)
  // ===============================
  function isDispute(req: any) {
    return req.requestDescription?.startsWith("disputeFor:");
  }

  function getField(req: any): string {
    if (req.field) return req.field;
    if (req.requestDescription?.startsWith("{")) {
      try {
        return JSON.parse(req.requestDescription).field || "—";
      } catch {
        return "—";
      }
    }
    if (isDispute(req)) {
      const originalId = req.requestDescription.replace("disputeFor:", "").trim();
      const original = requests.find(
        (r) => r._id === originalId || r.requestId === originalId
      );
      if (original) return getField(original);
    }
    return "—";
  }

  function getNewValue(req: any): string {
    if (req.newValue) return req.newValue;
    if (req.requestDescription?.startsWith("{")) {
      try {
        return JSON.parse(req.requestDescription).newValue || "—";
      } catch {
        return "—";
      }
    }
    if (isDispute(req)) {
      const originalId = req.requestDescription.replace("disputeFor:", "").trim();
      const original = requests.find(
        (r) => r._id === originalId || r.requestId === originalId
      );
      if (original) return getNewValue(original);
    }
    return "—";
  }

  // ===============================
  // ACTIONS (UNCHANGED)
  // ===============================
  async function approve(id: string) {
    const token = localStorage.getItem("token");
    await api.patch(
      `/employee-profile/change-requests/${id}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    router.reload();
  }

  async function reject(id: string) {
    const reason = prompt("Rejection reason:");
    if (!reason) return;

    const token = localStorage.getItem("token");
    await api.patch(
      `/employee-profile/change-requests/${id}/reject`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    router.reload();
  }

  async function approveDispute(id: string) {
    const resolution = prompt("Approval comment:");
    if (!resolution) return;

    const token = localStorage.getItem("token");
    await api.patch(
      `/employee-profile/change-requests/${id}/approve-dispute`,
      { resolution },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    router.reload();
  }

  async function resolveDispute(id: string) {
    const resolution = prompt("Resolution comment:");
    if (!resolution) return;

    const token = localStorage.getItem("token");
    await api.patch(
      `/employee-profile/change-requests/${id}/resolve-dispute`,
      { resolution },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    router.reload();
  }

  // ===============================
  // UI
  // ===============================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-10 text-white">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">
            HR – Manage Change Requests
          </h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition"
          >
            ← Back
          </button>
        </div>

        {requests.length === 0 && (
          <p className="text-white/60">No change requests found.</p>
        )}

        {/* REQUESTS */}
        <div className="space-y-6">
          {requests.map((req) => (
            <div
              key={req._id}
              className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-[0_0_40px_rgba(56,189,248,0.08)]"
            >
              <div className="grid md:grid-cols-2 gap-4 text-sm">

                <p><span className="text-white/60">Employee</span><br />{req.employeeProfileId}</p>
                <p><span className="text-white/60">Field</span><br />{getField(req)}</p>
                <p><span className="text-white/60">New Value</span><br />{getNewValue(req)}</p>

                <p>
                  <span className="text-white/60">Status</span><br />
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium
                      ${
                        req.status === "APPROVED"
                          ? "bg-green-500/20 text-green-400"
                          : req.status === "REJECTED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-300"
                      }`}
                  >
                    {isDispute(req)
                      ? req.status === "PENDING"
                        ? "DISPUTE PENDING"
                        : req.status === "APPROVED"
                        ? "DISPUTE APPROVED"
                        : "DISPUTE RESOLVED"
                      : req.status}
                  </span>
                </p>
              </div>

              <p className="mt-4 text-sm">
                <span className="text-white/60">HR Comment</span><br />
                {req.reason || "—"}
              </p>

              {/* ACTIONS */}
              {req.status === "PENDING" && !isDispute(req) && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => approve(req._id)}
                    className="px-5 py-2 rounded-xl bg-green-500 hover:bg-green-600 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(req._id)}
                    className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 transition"
                  >
                    Reject
                  </button>
                </div>
              )}

              {isDispute(req) && req.status === "PENDING" && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => approveDispute(req._id)}
                    className="px-5 py-2 rounded-xl bg-green-500 hover:bg-green-600 transition"
                  >
                    Approve Dispute
                  </button>
                  <button
                    onClick={() => resolveDispute(req._id)}
                    className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-600 transition"
                  >
                    Resolve Dispute
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
