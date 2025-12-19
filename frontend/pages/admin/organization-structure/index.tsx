// pages/admin/organization-structure/index.tsx
// System Admin: Organization Structure Management
// Uses existing backend APIs: /organization-structure/departments and /organization-structure/positions
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";

export default function AdminOrganizationStructurePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"departments" | "positions">("departments");
  
  // Departments state
  const [departments, setDepartments] = useState<any[]>([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptCode, setDeptCode] = useState("");
  const [deptName, setDeptName] = useState("");
  const [deptDescription, setDeptDescription] = useState("");
  
  // Positions state
  const [positions, setPositions] = useState<any[]>([]);
  const [showPosModal, setShowPosModal] = useState(false);
  const [posCode, setPosCode] = useState("");
  const [posTitle, setPosTitle] = useState("");
  const [posDepartmentId, setPosDepartmentId] = useState("");
  const [posDescription, setPosDescription] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    const normalizedRole = (savedRole || "")
      .toUpperCase()
      .replaceAll(" ", "_");

    if (!token || normalizedRole !== "SYSTEM_ADMIN") {
      router.push("/dashboard");
      return;
    }

    loadData();
  }, [router]);

  async function loadData() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const [deptRes, posRes] = await Promise.all([
        api.get("/organization-structure/departments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/organization-structure/positions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      setPositions(Array.isArray(posRes.data) ? posRes.data : []);
    } catch (error) {
      console.error("Failed to load data:", error);
      alert("Failed to load organization structure");
    } finally {
      setLoading(false);
    }
  }

  async function createDepartment() {
    if (!deptCode || !deptName) {
      alert("Code and name are required");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      await api.post(
        "/organization-structure/departments",
        {
          code: deptCode,
          name: deptName,
          description: deptDescription || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setDeptCode("");
      setDeptName("");
      setDeptDescription("");
      setShowDeptModal(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create department");
    } finally {
      setSaving(false);
    }
  }

  async function createPosition() {
    if (!posCode || !posTitle || !posDepartmentId) {
      alert("Code, title, and department are required");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      await api.post(
        "/organization-structure/positions",
        {
          code: posCode,
          title: posTitle,
          departmentId: posDepartmentId,
          description: posDescription || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPosCode("");
      setPosTitle("");
      setPosDepartmentId("");
      setPosDescription("");
      setShowPosModal(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create position");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDepartmentStatus(id: string, isActive: boolean) {
    if (!confirm(`${isActive ? "Deactivate" : "Activate"} this department?`)) return;

    try {
      const token = localStorage.getItem("token");
      if (isActive) {
        await api.patch(
          `/organization-structure/departments/deactivate/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await api.patch(
          `/organization-structure/departments/activate/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      loadData();
    } catch (error) {
      alert("Failed to update department status");
    }
  }

  async function togglePositionStatus(id: string, isActive: boolean) {
    if (!confirm(`${isActive ? "Deactivate" : "Activate"} this position?`)) return;

    try {
      const token = localStorage.getItem("token");
      if (isActive) {
        await api.patch(
          `/organization-structure/positions/${id}/deactivate`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await api.patch(
          `/organization-structure/positions/activate/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      loadData();
    } catch (error) {
      alert("Failed to update position status");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-white/60">Loading organization structure...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Organization Structure</h1>
              <p className="text-white/60 text-sm">Manage departments and positions</p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="glass-btn px-4 py-2 text-sm"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card p-2 mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("departments")}
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition ${
              activeTab === "departments"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab("positions")}
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition ${
              activeTab === "positions"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            Positions ({positions.length})
          </button>
        </div>

        {/* Departments Tab */}
        {activeTab === "departments" && (
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white/90">Departments</h2>
              <button
                onClick={() => setShowDeptModal(true)}
                className="glow-btn px-4 py-2 text-sm"
              >
                + Create Department
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-white/50">
                        No departments found
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept._id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4 text-sm font-mono text-white/80">
                          {dept.code}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">{dept.name}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              dept.isActive
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {dept.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleDepartmentStatus(dept._id, dept.isActive)}
                            className={`text-sm px-3 py-1 rounded ${
                              dept.isActive
                                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            }`}
                          >
                            {dept.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Positions Tab */}
        {activeTab === "positions" && (
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white/90">Positions</h2>
              <button
                onClick={() => setShowPosModal(true)}
                className="glow-btn px-4 py-2 text-sm"
              >
                + Create Position
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {positions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-white/50">
                        No positions found
                      </td>
                    </tr>
                  ) : (
                    positions.map((pos) => {
                      const dept = departments.find((d) => d._id === pos.departmentId?._id || d._id === pos.departmentId);
                      return (
                        <tr key={pos._id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4 text-sm font-mono text-white/80">
                            {pos.code}
                          </td>
                          <td className="px-6 py-4 text-sm text-white">{pos.title}</td>
                          <td className="px-6 py-4 text-sm text-white/70">
                            {dept ? dept.name : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                pos.isActive
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {pos.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => togglePositionStatus(pos._id, pos.isActive)}
                              className={`text-sm px-3 py-1 rounded ${
                                pos.isActive
                                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              }`}
                            >
                              {pos.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Department Modal */}
        {showDeptModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="glass-card w-full max-w-md p-6">
              <h3 className="text-xl font-semibold mb-4">Create Department</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 text-white/70">Code *</label>
                  <input
                    type="text"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="glass-input w-full"
                    placeholder="DEPT001"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-white/70">Name *</label>
                  <input
                    type="text"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="glass-input w-full"
                    placeholder="Department Name"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-white/70">Description</label>
                  <textarea
                    value={deptDescription}
                    onChange={(e) => setDeptDescription(e.target.value)}
                    className="glass-input w-full"
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setShowDeptModal(false);
                      setDeptCode("");
                      setDeptName("");
                      setDeptDescription("");
                    }}
                    className="glass-btn px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createDepartment}
                    disabled={saving}
                    className="glow-btn px-4 py-2"
                  >
                    {saving ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Position Modal */}
        {showPosModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="glass-card w-full max-w-md p-6">
              <h3 className="text-xl font-semibold mb-4">Create Position</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 text-white/70">Code *</label>
                  <input
                    type="text"
                    value={posCode}
                    onChange={(e) => setPosCode(e.target.value)}
                    className="glass-input w-full"
                    placeholder="POS001"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-white/70">Title *</label>
                  <input
                    type="text"
                    value={posTitle}
                    onChange={(e) => setPosTitle(e.target.value)}
                    className="glass-input w-full"
                    placeholder="Position Title"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-white/70">Department *</label>
                  <select
                    value={posDepartmentId}
                    onChange={(e) => setPosDepartmentId(e.target.value)}
                    className="glass-input w-full"
                  >
                    <option value="">Select Department</option>
                    {departments
                      .filter((d) => d.isActive)
                      .map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-white/70">Description</label>
                  <textarea
                    value={posDescription}
                    onChange={(e) => setPosDescription(e.target.value)}
                    className="glass-input w-full"
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setShowPosModal(false);
                      setPosCode("");
                      setPosTitle("");
                      setPosDepartmentId("");
                      setPosDescription("");
                    }}
                    className="glass-btn px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPosition}
                    disabled={saving}
                    className="glow-btn px-4 py-2"
                  >
                    {saving ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

