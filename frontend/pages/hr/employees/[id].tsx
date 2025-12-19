import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "../../../api/axios";

export default function HREditEmployeePage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [employee, setEmployee] = useState<any>(null);

  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedPositionId, setSelectedPositionId] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    role: "",
    status: "",
  });

  // ============================
  // LOAD EMPLOYEE + BASE DATA
  // ============================
  useEffect(() => {
    if (!id) return;

    async function loadAll() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const [empRes, depRes, posRes] = await Promise.all([
          api.get(`/employee-profile/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(`/organization-structure/departments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(`/organization-structure/positions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const emp = empRes.data;
        setEmployee(emp);

        setDepartments(depRes.data?.items || depRes.data || []);
        setPositions(posRes.data?.items || posRes.data || []);

        setForm({
          firstName: emp.firstName || "",
          lastName: emp.lastName || "",
          role: emp.role || "",
          status: emp.status || "",
        });

        const deptId =
          emp.primaryDepartmentId && typeof emp.primaryDepartmentId === "object"
            ? emp.primaryDepartmentId._id
            : emp.primaryDepartmentId || "";

        const posId =
          emp.primaryPositionId && typeof emp.primaryPositionId === "object"
            ? emp.primaryPositionId._id
            : emp.primaryPositionId || "";

        setSelectedDepartmentId(deptId);
        setSelectedPositionId(posId);

        if (deptId) {
          loadManagersByDepartment(deptId);
        }
      } catch (err) {
        alert("Failed to load employee ❌");
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [id, router]);

  // ============================
  // LOAD MANAGERS (SAME AS CREATE)
  // ============================
  async function loadManagersByDepartment(departmentId: string) {
    const token = localStorage.getItem("token");

    try {
      const res = await api.get(
        `/employee-profile/department/${departmentId}/managers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setManagers(res.data || []);
      setSelectedManagerId("");
    } catch (err) {
      console.error(err);
      setManagers([]);
    }
  }

  // ============================
  // UPDATE BASIC FIELDS
  // ============================
  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ============================
  // SAVE BASIC INFO
  // ============================
  async function save() {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      await api.patch(
        `/employee-profile/${id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Employee updated ✅");
      router.push("/hr/employees");
    } catch {
      alert("Update failed ❌");
    } finally {
      setSaving(false);
    }
  }

  // ============================
  // TOGGLE STATUS
  // ============================
  async function toggleStatus() {
    const token = localStorage.getItem("token");
    const newStatus = form.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    await api.patch(
      `/employee-profile/${id}`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setForm((prev) => ({ ...prev, status: newStatus }));
  }

  // ============================
  // ASSIGN DEPARTMENT
  // ============================
  async function assignDepartment() {
    const token = localStorage.getItem("token");

    await api.patch(
      `/employee-profile/${id}`,
      { primaryDepartmentId: selectedDepartmentId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    loadManagersByDepartment(selectedDepartmentId);
    alert("Department assigned ✅");
  }

  // ============================
  // ASSIGN POSITION
  // ============================
  async function assignPosition() {
    const token = localStorage.getItem("token");

    await api.patch(
      `/employee-profile/${id}`,
      { primaryPositionId: selectedPositionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Position assigned ✅");
  }

  // ============================
  // ASSIGN MANAGER
  // ============================
  async function assignManager() {
    const token = localStorage.getItem("token");

    if (!selectedManagerId) {
      alert("Select manager first ❌");
      return;
    }

    await api.patch(
      `/employee-profile/assign-manager`,
      {
        employeeId: id,
        managerId: selectedManagerId,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Manager assigned ✅");
  }

  if (loading) return <p className="text-white">Loading…</p>;
  if (!employee) return <p className="text-red-400">Employee not found</p>;

  // ============================
  // UI
  // ============================
  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-12 text-white">
    <div className="max-w-4xl mx-auto">

      {/* TITLE */}
      <h1 className="text-4xl font-semibold mb-8">Edit Employee</h1>

      {/* GLASS CARD */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 space-y-8 shadow-[0_0_40px_rgba(56,189,248,0.08)]">

        {/* BASIC INFO */}
        <div>
          <h2 className="text-xl mb-4 font-medium text-blue-300">
            Basic Information
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-1 text-white/70">
                First Name
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={form.firstName}
                onChange={(e) =>
                  updateField("firstName", e.target.value)
                }
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-white/70">
                Last Name
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={form.lastName}
                onChange={(e) =>
                  updateField("lastName", e.target.value)
                }
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm mb-1 text-white/70">
              System Role
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={form.role}
              onChange={(e) =>
                updateField("role", e.target.value)
              }
            >
              <option value="">Select Role</option>
              <option value="DEPARTMENT_EMPLOYEE">Employee</option>
              <option value="DEPARTMENT_HEAD">Department Head</option>
              <option value="HR_EMPLOYEE">HR Employee</option>
              <option value="HR_MANAGER">HR Manager</option>
              <option value="SYSTEM_ADMIN">System Admin</option>
            </select>
          </div>
        </div>

        {/* STATUS */}
        <div>
          <h2 className="text-xl mb-4 font-medium text-blue-300">
            Account Status
          </h2>

          <div className="flex items-center gap-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold
                ${
                  form.status === "ACTIVE"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
            >
              {form.status}
            </span>

            <button
              onClick={toggleStatus}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition"
            >
              {form.status === "ACTIVE"
                ? "Deactivate"
                : "Activate"}
            </button>
          </div>
        </div>

        {/* ASSIGNMENTS */}
        <div>
          <h2 className="text-xl mb-4 font-medium text-blue-300">
            Assignments
          </h2>

          {/* DEPARTMENT */}
          <div className="mb-6">
            <label className="block text-sm mb-1 text-white/70">
              Department
            </label>
            <div className="flex gap-3">
              <select
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20"
                value={selectedDepartmentId}
                onChange={(e) => {
                  setSelectedDepartmentId(e.target.value);
                  loadManagersByDepartment(e.target.value);
                }}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <button
                onClick={assignDepartment}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
              >
                Assign
              </button>
            </div>
          </div>

          {/* POSITION */}
          <div className="mb-6">
            <label className="block text-sm mb-1 text-white/70">
              Position
            </label>
            <div className="flex gap-3">
              <select
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20"
                value={selectedPositionId}
                onChange={(e) =>
                  setSelectedPositionId(e.target.value)
                }
              >
                <option value="">Select Position</option>
                {positions.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title || p.name}
                  </option>
                ))}
              </select>

              <button
                onClick={assignPosition}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
              >
                Assign
              </button>
            </div>
          </div>

          {/* MANAGER */}
          <div>
            <label className="block text-sm mb-1 text-white/70">
              Manager
            </label>
            <div className="flex gap-3">
              <select
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20"
                value={selectedManagerId}
                onChange={(e) =>
                  setSelectedManagerId(e.target.value)
                }
              >
                <option value="">Select Manager</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>

              <button
                onClick={assignManager}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
              >
                Assign
              </button>
            </div>
          </div>
        </div>

        {/* SAVE */}
        <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
          <button
            onClick={() => router.push("/hr/employees")}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 transition"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  </div>
);
}