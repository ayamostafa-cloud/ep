// pages/performance/appraisals/[id].tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";

/* ================= TYPES ================= */

type TemplateCriterion = {
  key: string;
  title: string;
};

type Template = {
  _id: string;
  name: string;
  criteria: TemplateCriterion[];
};

type AppraisalRecord = {
  _id: string;
  status: "DRAFT" | "MANAGER_SUBMITTED" | "HR_PUBLISHED";
  templateId: string;
  cycleId: string;
  employeeProfileId: string;
  managerProfileId: string;

  ratings?: Record<string, number>;
  managerComment?: string;
  recommendations?: string;
};

/* ================= PAGE ================= */

export default function AppraisalDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  /* ===== ROLE NORMALIZATION (CRITICAL FIX) ===== */
  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")?.toUpperCase().replace(" ", "_")
      : null;

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId")
      : null;

  const isManager = role === "DEPARTMENT_HEAD";

  /* ================= STATE ================= */

  const [record, setRecord] = useState<AppraisalRecord | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [managerComment, setManagerComment] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ===== FINAL EDIT PERMISSION CHECK ===== */
  const canEdit =
    isManager &&
    record?.status === "DRAFT" &&
    record.managerProfileId === userId;

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // 1️⃣ Load appraisal
        const recRes = await api.get(`/performance/appraisals/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const rec: AppraisalRecord = recRes.data;
        setRecord(rec);

        // 2️⃣ Load template
        const tplRes = await api.get(
          `/performance/templates/${rec.templateId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTemplate(tplRes.data);

        // 3️⃣ Hydrate values
        setRatings(rec.ratings || {});
        setManagerComment(rec.managerComment || "");
        setRecommendations(rec.recommendations || "");
      } catch (e: any) {
        alert(e.response?.data?.message || "Failed to load appraisal ❌");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, router]);

  /* ================= ACTIONS ================= */

  function setRating(key: string, value: number) {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }

  async function saveDraft() {
    if (!record) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      await api.patch(
        `/performance/appraisals/${record._id}`,
        { ratings, managerComment, recommendations },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Draft saved ✅");
    } catch (e: any) {
      alert(e.response?.data?.message || "Save failed ❌");
    } finally {
      setSaving(false);
    }
  }

  async function submitToHR() {
    if (!record) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      await api.patch(
        `/performance/appraisals/${record._id}/status`,
        { status: "MANAGER_SUBMITTED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Submitted to HR ✅");
      router.reload();
    } catch (e: any) {
      alert(e.response?.data?.message || "Submission failed ❌");
    } finally {
      setSaving(false);
    }
  }

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Appraisal not found
      </div>
    );
  }

  return (
    <div className="min-h-screen px-8 py-10 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="glass-card p-8 max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Appraisal Details</h1>
            <p className="text-sm text-white/70">
              Status: <b>{record.status}</b>
            </p>

            {!canEdit && (
              <p className="text-xs text-yellow-300 mt-2">
                Read-only. Only the assigned manager can edit while status is DRAFT.
              </p>
            )}
          </div>

          <button onClick={() => router.back()} className="glass-btn px-4 py-2">
            ← Back
          </button>
        </div>

        {/* CRITERIA */}
        <div className="space-y-4">
          {(template?.criteria || []).map((c) => (
            <div key={c.key} className="bg-white/5 p-4 rounded">
              <div className="font-medium mb-2">{c.title}</div>
              <select
                disabled={!canEdit}
                value={ratings[c.key] ?? ""}
                onChange={(e) => setRating(c.key, Number(e.target.value))}
                className="w-full p-3 rounded bg-white/10 disabled:opacity-60"
              >
                <option value="">Select rating</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          ))}

          {/* COMMENTS */}
          <div className="bg-white/5 p-4 rounded">
            <div className="font-medium mb-2">Manager Comment</div>
            <textarea
              disabled={!canEdit}
              value={managerComment}
              onChange={(e) => setManagerComment(e.target.value)}
              className="w-full min-h-[120px] p-3 rounded bg-white/10 disabled:opacity-60"
            />
          </div>

          <div className="bg-white/5 p-4 rounded">
            <div className="font-medium mb-2">Recommendations</div>
            <textarea
              disabled={!canEdit}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="w-full min-h-[120px] p-3 rounded bg-white/10 disabled:opacity-60"
            />
          </div>
        </div>

        {/* ACTIONS */}
        {canEdit && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={saveDraft}
              disabled={saving}
              className="glass-btn px-5 py-2"
            >
              Save Draft
            </button>

            <button
              onClick={submitToHR}
              disabled={saving}
              className="glow-btn px-5 py-2"
            >
              Submit to HR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
