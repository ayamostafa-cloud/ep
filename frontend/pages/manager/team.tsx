// pages/manager/team.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../api/axios";

interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  status: string;
  dateOfHire?: string;

  primaryDepartmentId?: {
    _id: string;
    name: string;
  };

  primaryPositionId?: {
    title?: string;
    name?: string;
  };
}

export default function ManagerTeamPage() {
  const router = useRouter();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const managerId = localStorage.getItem("userId");

        if (!token || !managerId) {
          router.push("/login");
          return;
        }

        const res = await api.get(
          `/employee-profile/manager/team/${managerId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setTeam(res.data || []);
      } catch (err: any) {
        setErrorMsg(
          err.response?.data?.message || "Failed to load your team ❌"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen px-10 py-12 text-white bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold">My Team</h1>

        <button
          onClick={() => router.push("/dashboard")}
          className="glass-btn px-5 py-2"
        >
          ← Back
        </button>
      </div>

      {/* ===== ERROR ===== */}
      {errorMsg && (
        <p className="text-red-400 mb-4">
          {errorMsg}
        </p>
      )}

      {/* ===== TABLE CARD ===== */}
      <div className="glass-card p-6 overflow-x-auto">

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/20 text-white/80">
              <th className="p-3 text-left">Employee</th>
              <th className="p-3">Employee #</th>
              <th className="p-3">Department</th>
              <th className="p-3">Position</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date of Hire</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {team.map((emp) => (
              <tr
                key={emp._id}
                className="border-t border-white/10 hover:bg-white/5 transition"
              >
                <td className="p-3">
                  {emp.firstName} {emp.lastName}
                </td>
                <td className="p-3 text-center">
                  {emp.employeeNumber}
                </td>
                <td className="p-3 text-center">
                  {emp.primaryDepartmentId?.name || "—"}
                </td>
                <td className="p-3 text-center">
                  {emp.primaryPositionId?.title ||
                    emp.primaryPositionId?.name ||
                    "—"}
                </td>
                <td className="p-3 text-center">
                  {emp.status}
                </td>
                <td className="p-3 text-center">
                  {emp.dateOfHire
                    ? new Date(emp.dateOfHire).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => router.push(`/manager/team/${emp._id}`)}
                    className="glow-btn px-4 py-1 text-sm"
                  >
                    View Summary
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}
