import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";

export default function HREmployeesPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
     LOAD EMPLOYEES (UNCHANGED)
  =============================== */
  async function loadEmployees() {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await api.get(
        "/employee-profile?page=1&limit=200",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setEmployees(res.data?.items || res.data || []);
    } catch (err) {
      console.error("❌ Load employees error", err);
      alert("Failed to load employees ❌");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  /* ===============================
     ACTIVATE / DEACTIVATE (UNCHANGED)
  =============================== */
  async function deactivateEmployee(id: string) {
    if (!confirm("Deactivate this employee?")) return;

    const token = localStorage.getItem("token");

    await api.delete(`/employee-profile/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    loadEmployees();
  }

  async function activateEmployee(id: string) {
    if (!confirm("Activate this employee?")) return;

    const token = localStorage.getItem("token");

    await api.patch(
      `/employee-profile/${id}`,
      { status: "ACTIVE" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    loadEmployees();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-10 text-white">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-4xl font-semibold">HR – Employees</h1>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition"
            >
              ← Back
            </button>

            <button
              onClick={() => router.push("/hr/employees/create")}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 transition"
            >
              + Create Employee
            </button>
          </div>
        </div>

        {/* TABLE WRAPPER */}
        <div className="overflow-x-auto rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(56,189,248,0.08)]">
          <table className="w-full text-sm">
            <thead className="bg-white/10 text-white">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Role</th>
                <th className="p-4 text-left">Department</th>
                <th className="p-4 text-left">Position</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {employees.map((e) => {
                const role =
                  Array.isArray(e.roles) && e.roles.length > 0
                    ? e.roles.join(", ")
                    : "—";

                const department =
                  e.primaryDepartmentId &&
                  typeof e.primaryDepartmentId === "object"
                    ? e.primaryDepartmentId.name
                    : "—";

                const position =
                  e.primaryPositionId &&
                  typeof e.primaryPositionId === "object"
                    ? e.primaryPositionId.title ||
                      e.primaryPositionId.name
                    : "—";

                return (
                  <tr key={e._id} className="hover:bg-white/5 transition">
                    <td className="p-4 font-medium">
                      {e.firstName} {e.lastName}
                    </td>

                    <td className="p-4">{role}</td>
                    <td className="p-4">{department}</td>
                    <td className="p-4">{position}</td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold
                          ${
                            e.status === "ACTIVE"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                      >
                        {e.status}
                      </span>
                    </td>

                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() =>
                          router.push(`/hr/employees/${e._id}`)
                        }
                        className="px-4 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
                      >
                        Edit
                      </button>

                      {e.status === "ACTIVE" ? (
                        <button
                          onClick={() =>
                            deactivateEmployee(e._id)
                          }
                          className="px-4 py-1 rounded-lg bg-red-600 hover:bg-red-700 transition"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            activateEmployee(e._id)
                          }
                          className="px-4 py-1 rounded-lg bg-green-600 hover:bg-green-700 transition"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {employees.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-white/60"
                  >
                    No employees found
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
