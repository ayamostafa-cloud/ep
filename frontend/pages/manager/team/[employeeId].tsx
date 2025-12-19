import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";

interface EmployeeProfile {
  _id: string;
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  status?: string;
  dateOfHire?: string;
  workEmail?: string;
  personalEmail?: string;

  primaryDepartmentId?: {
    _id: string;
    name: string;
  };

  primaryPositionId?: {
    _id: string;
    title?: string;
    name?: string;
  };
}

export default function ManagerEmployeeSummaryPage() {
  const router = useRouter();
  const { employeeId } = router.query;

  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;

    async function loadEmployee() {
      try {
        const token = localStorage.getItem("token");
        const managerId = localStorage.getItem("userId");

        if (!token || !managerId) {
          router.push("/login");
          return;
        }

        const res = await api.get(
          `/employee-profile/manager/team/${managerId}/employee/${employeeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setEmployee(res.data);
      } catch (err) {
        console.error("❌ Failed to load employee", err);
      } finally {
        setLoading(false);
      }
    }

    loadEmployee();
  }, [employeeId, router]);

  if (loading) {
    return <p className="text-white text-center mt-10">Loading…</p>;
  }

  if (!employee) {
    return <p className="text-red-400 text-center mt-10">Employee not found</p>;
  }

 return (
  <div className="min-h-screen px-10 py-12 text-white bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">

    {/* ===== BACK BUTTON ===== */}
    <button
      onClick={() => router.back()}
      className="glass-btn px-5 py-2 mb-10"
    >
      ← Back
    </button>

    {/* ===== GLASS CARD ===== */}
    <div className="glass-card p-10 max-w-4xl">

      <h1 className="text-4xl font-semibold mb-10">
        {employee.firstName} {employee.lastName}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 text-lg">

        <div>
          <p className="text-white/60">Employee #</p>
          <p>{employee.employeeNumber || "—"}</p>
        </div>

        <div>
          <p className="text-white/60">Status</p>
          <p>{employee.status || "—"}</p>
        </div>

        <div>
          <p className="text-white/60">Position</p>
          <p>
            {employee.primaryPositionId?.title ||
             employee.primaryPositionId?.name ||
             "—"}
          </p>
        </div>

        <div>
          <p className="text-white/60">Department</p>
          <p>{employee.primaryDepartmentId?.name || "—"}</p>
        </div>

        <div>
          <p className="text-white/60">Date of Hire</p>
          <p>
            {employee.dateOfHire
              ? new Date(employee.dateOfHire).toLocaleDateString()
              : "—"}
          </p>
        </div>

        <div>
          <p className="text-white/60">Work Email</p>
          <p>{employee.workEmail || "—"}</p>
        </div>

        <div>
          <p className="text-white/60">Personal Email</p>
          <p>{employee.personalEmail || "—"}</p>
        </div>

      </div>
    </div>
  </div>
);
}             