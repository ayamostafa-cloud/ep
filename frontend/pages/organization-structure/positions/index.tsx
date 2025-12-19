import { useEffect, useState } from "react";
import api from "../../../api/axios";
import { useRouter } from "next/router";
/* ================= TYPES ================= */
interface Department {
  _id: string;
  name: string;
}

interface Position {
  _id: string;
  code: string;
  title: string;
  departmentId: string;
  isActive: boolean;
  reportsToPositionId?: string; // ✅ FIX 1
}

/* ================= PAGE ================= */
export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // manager dropdown values
  const [selectedManagers, setSelectedManagers] =
    useState<Record<string, string>>({});

  // create modal
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);

  /* ================= LOAD DATA ================= */
  async function loadData() {
    try {
      setError(null);

      const [posRes, depRes] = await Promise.all([
        api.get("/organization-structure/positions"),
        api.get("/organization-structure/departments"),
      ]);

      setPositions(posRes.data);
      setDepartments(depRes.data);

      // ✅ FIX 2: pre-fill selected managers
      const managers: Record<string, string> = {};
      posRes.data.forEach((p: Position) => {
        if (p.reportsToPositionId) {
          managers[p._id] = p.reportsToPositionId;
        }
      });
      setSelectedManagers(managers);
    } catch (err) {
      console.error(err);
      setError("Failed to load positions ❌");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ================= HELPERS ================= */
  function getDepartmentName(id: string) {
    return departments.find((d) => d._id === id)?.name || "—";
  }

  /* ================= CREATE ================= */
  async function createPosition() {
    if (!code || !title || !departmentId) {
      alert("All fields are required");
      return;
    }

    try {
      setSaving(true);
      await api.post("/organization-structure/positions", {
        code,
        title,
        departmentId,
      });

      setShowModal(false);
      setCode("");
      setTitle("");
      setDepartmentId("");
      await loadData(); // ✅ refresh
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create position ❌");
    } finally {
      setSaving(false);
    }
  }

  /* ================= ACTIVATE / DEACTIVATE ================= */
  async function deactivatePosition(id: string) {
    if (!confirm("Deactivate this position?")) return;
    await api.patch(`/organization-structure/positions/${id}/deactivate`);
    await loadData();
  }

  async function activatePosition(id: string) {
    if (!confirm("Activate this position?")) return;
    await api.patch(`/organization-structure/positions/activate/${id}`);
    await loadData();
  }

  /* ================= SET MANAGER ================= */
  async function setManager(positionId: string) {
    const managerId = selectedManagers[positionId];
    if (!managerId) {
      alert("Please select a manager");
      return;
    }

    try {
      await api.patch(
        `/organization-structure/positions/${positionId}/report-to`,
        { reportsToPositionId: managerId }
      );
      await loadData(); // ✅ FIX 3
      alert("Manager set successfully ✅");
    } catch {
      alert("Failed to set manager ❌");
    }
  }

  /* ================= REMOVE MANAGER ================= */
  async function removeManager(positionId: string) {
    if (!confirm("Remove manager from this position?")) return;

    try {
      await api.patch(
        `/organization-structure/positions/${positionId}/remove-report-to`
      );
      await loadData(); // ✅ FIX 4
      alert("Manager removed ✅");
    } catch {
      alert("Failed to remove manager ❌");
    }
  }

  /* ================= STATES ================= */
  if (loading) return <div className="p-10 text-white">Loading...</div>;
  if (error) return <div className="p-10 text-red-500">{error}</div>;

  /* ================= UI ================= */
             
               return (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white px-10 py-12">

    {/* ===== HEADER ===== */}
    <div className="flex items-center justify-between mb-10">
      <h1 className="text-4xl font-semibold">Positions</h1>

      <div className="flex gap-3">
        <button
          onClick={() => setShowModal(true)}
          className="glow-btn px-5 py-2"
        >
          + Create Position
        </button>

        <button
          onClick={() => router.push("/organization-structure")}
          className="glass-btn px-5 py-2"
        >
          Back
        </button>
      </div>
    </div>

    {/* ===== TABLE CARD ===== */}
    <div className="glass-card overflow-hidden">

      <table className="w-full text-left">
        <thead className="bg-white/10">
          <tr>
            <th className="px-6 py-4">Code</th>
            <th className="px-6 py-4">Title</th>
            <th className="px-6 py-4">Department</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {positions.map((p) => (
            <tr
              key={p._id}
              className="border-t border-white/10 hover:bg-white/5 transition"
            >
              <td className="px-6 py-5 font-medium">{p.code}</td>
              <td className="px-6 py-5">{p.title}</td>
              <td className="px-6 py-5">{getDepartmentName(p.departmentId)}</td>

              <td className="px-6 py-5">
                {p.isActive ? (
                  <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
                    Active
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400">
                    Inactive
                  </span>
                )}
              </td>

              {/* ===== ACTIONS ===== */}
              <td className="px-6 py-5">
                <div className="glass p-4 space-y-3">

                  {p.isActive ? (
                    <button
                      onClick={() => deactivatePosition(p._id)}
                      className="w-full px-4 py-1.5 rounded bg-red-600 hover:bg-red-700"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => activatePosition(p._id)}
                      className="w-full px-4 py-1.5 rounded bg-green-600 hover:bg-green-700"
                    >
                      Activate
                    </button>
                  )}

                  <select
                    className="w-full px-3 py-2 rounded bg-white/10 border border-white/10"
                    value={selectedManagers[p._id] || ""}
                    onChange={(e) =>
                      setSelectedManagers({
                        ...selectedManagers,
                        [p._id]: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Manager</option>
                    {positions
                      .filter(
                        (mgr) =>
                          mgr._id !== p._id &&
                          mgr.departmentId === p.departmentId &&
                          mgr.isActive
                      )
                      .map((mgr) => (
                        <option key={mgr._id} value={mgr._id}>
                          {mgr.title}
                        </option>
                      ))}
                  </select>

                  <button
                    onClick={() => setManager(p._id)}
                    className="w-full px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700"
                  >
                    Set Manager
                  </button>

                  <button
                    onClick={() => removeManager(p._id)}
                    className="w-full px-4 py-1.5 rounded bg-gray-600 hover:bg-gray-700"
                  >
                    Remove Manager
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* ===== CREATE MODAL ===== */}
    {showModal && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="glass-card w-full max-w-md p-8">
          <h2 className="text-2xl font-semibold mb-6">
            Create Position
          </h2>

          <div className="space-y-4">
            <input
              className="glass-input"
              placeholder="Position Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <input
              className="glass-input"
              placeholder="Position Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <select
              className="glass-input"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={() => setShowModal(false)}
              className="glass-btn px-4 py-2"
            >
              Cancel
            </button>

            <button
              onClick={createPosition}
              disabled={saving}
              className="glow-btn px-4 py-2"
            >
              {saving ? "Saving..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}