// pages/performance/appraisals/create.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";

type Template = { _id: string; name: string };
type Cycle = { _id: string; name: string; status: string };

export default function CreateAppraisalPage() {
  const router = useRouter();
  const { cycleId, employeeNumber } = router.query;

  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [form, setForm] = useState({
    employeeProfileId: "",
    cycleId: "",
    templateId: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // prefill from query
    const newCycleId = typeof cycleId === "string" ? cycleId : "";
    const newEmployeeNumber = typeof employeeNumber === "string" ? employeeNumber : "";
    
    setForm((p) => ({
      ...p,
      employeeProfileId: newEmployeeNumber || p.employeeProfileId,
      cycleId: newCycleId || p.cycleId,
    }));

    // Load cycle details if cycleId is prefilled
    if (newCycleId) {
      loadCycleDetails(newCycleId);
    }
  }, [cycleId, employeeNumber]);

  async function loadCycleDetails(cycleIdValue: string) {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const cycleRes = await api.get(`/performance/cycles/${cycleIdValue}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedCycle(cycleRes.data);
    } catch (e: any) {
      console.error("Failed to load cycle details:", e);
      setSelectedCycle(null);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const [cyclesRes, templatesRes] = await Promise.all([
          api.get("/performance/cycles", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/performance/templates", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setCycles((cyclesRes.data || []).filter((c: Cycle) => c.status === "ACTIVE"));
        setTemplates(templatesRes.data || []);
      } catch (e: any) {
        setError(e.response?.data?.message || "Failed to load data ❌");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function onChange(e: any) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));

    // When cycle changes, load cycle details to get assigned templates
    if (name === "cycleId") {
      if (value) {
        loadCycleDetails(value);
      } else {
        setSelectedCycle(null);
        // Clear template selection when cycle is cleared
        setForm((p) => ({ ...p, templateId: "" }));
      }
    }
  }

  // Filter templates to only show those assigned to the selected cycle
  const availableTemplates = 
    Array.isArray(selectedCycle?.templateAssignments) && selectedCycle.templateAssignments.length > 0
      ? templates.filter((t) =>
          selectedCycle.templateAssignments.some(
            (ta: any) => ta.templateId?.toString() === t._id
          )
        )
      : [];

  async function submit(e: any) {
    e.preventDefault();
    setError(null);

    if (!form.employeeProfileId || !form.cycleId || !form.templateId) {
      setError("Employee Number, Cycle, and Template are required");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      const res = await api.post(
        "/performance/appraisals",
        {
          employeeProfileId: form.employeeProfileId, // employeeNumber (EMP-00045)
          cycleId: form.cycleId,
          templateId: form.templateId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const createdId = res.data?._id;
      if (createdId) router.push(`/performance/appraisals/${createdId}`);
      else router.push(`/performance/cycles/${form.cycleId}`);
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to create appraisal ❌");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen px-8 py-10 text-white bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="glass-card p-8 max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Create Appraisal</h1>
            <p className="text-white/60 text-sm mt-1">
              Choose ACTIVE cycle + template, then create a DRAFT record.
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="glass-btn px-5 py-2"
          >
            ← Back
          </button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-white/70">Employee Number</label>
            <input
              name="employeeProfileId"
              value={form.employeeProfileId}
              onChange={onChange}
              className="w-full mt-1 px-4 py-3 rounded bg-white/10 border border-white/20 outline-none"
              placeholder="EMP-00045"
            />
          </div>

          <div>
            <label className="text-xs text-white/70">Active Cycle</label>
            <select
              name="cycleId"
              value={form.cycleId}
              onChange={onChange}
              className="w-full mt-1 px-4 py-3 rounded bg-white/10 border border-white/20 outline-none"
            >
              <option value="">Select ACTIVE cycle</option>
              {cycles.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/70">Template</label>
            <select
              name="templateId"
              value={form.templateId}
              onChange={onChange}
              disabled={!form.cycleId}
              className="w-full mt-1 px-4 py-3 rounded bg-white/10 border border-white/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {form.cycleId
                  ? availableTemplates.length === 0
                    ? "No templates assigned to this cycle"
                    : "Select template"
                  : "Select cycle first"}
              </option>
              {availableTemplates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            {form.cycleId && availableTemplates.length === 0 && (
              <p className="text-yellow-400 text-xs mt-1">
                This cycle has no templates assigned. HR must assign templates to the cycle first.
              </p>
            )}
          </div>

          <button
            disabled={saving}
            className="glow-btn px-6 py-3 text-sm disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
