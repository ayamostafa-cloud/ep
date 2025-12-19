import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";

type Cycle = {
  _id: string;
  name: string;
  status: "PLANNED" | "ACTIVE" | "CLOSED" | "ARCHIVED";
};

type TeamMember = {
  _id: string;
  firstName?: string;
  lastName?: string;
  employeeNumber: string;
};

type Appraisal = {
  _id: string;
  employeeProfileId: string;
  status: "DRAFT" | "MANAGER_SUBMITTED" | "HR_PUBLISHED";
};

export default function CycleDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ CORRECT MANAGER DETECTION
  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : null;

  const isManager =
    role === "department head";

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const managerId = localStorage.getItem("userId"); // MUST be employeeProfileId

        if (!token || !managerId) {
          router.push("/login");
          return;
        }

        // 1️⃣ Load cycle
        const cycleRes = await api.get(`/performance/cycles/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCycle(cycleRes.data);

        // 2️⃣ Load appraisals in this cycle
        const appraisalsRes = await api.get(
          `/performance/cycles/${id}/appraisals`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAppraisals(appraisalsRes.data || []);

        // 3️⃣ Load manager team
        if (isManager) {
          const teamRes = await api.get(
            `/employee-profile/manager/team/${managerId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setTeam(teamRes.data || []);
        }
      } catch (e: any) {
        setError(e.response?.data?.message || "Failed to load cycle ❌");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, isManager, router]);

  function findAppraisal(employeeId: string) {
    return appraisals.find((a) => a.employeeProfileId === employeeId);
  }

  function getAction(emp: TeamMember) {
    const appraisal = findAppraisal(emp._id);

    if (!cycle || cycle.status !== "ACTIVE") {
      return { label: "—", onClick: null };
    }

    if (!appraisal) {
      return {
        label: "Create Appraisal",
        onClick: () =>
          router.push(
            `/performance/appraisals/create?cycleId=${cycle._id}&employeeNumber=${emp.employeeNumber}`
          ),
      };
    }

    if (appraisal.status === "DRAFT") {
      return {
        label: "Continue",
        onClick: () =>
          router.push(`/performance/appraisals/${appraisal._id}`),
      };
    }

    return {
      label: "View",
      onClick: () =>
        router.push(`/performance/appraisals/${appraisal._id}`),
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Cycle not found
      </div>
    );
  }

  return (
    <div className="min-h-screen px-8 py-10 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="glass-card p-8 max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{cycle.name}</h1>
            <p className="text-sm text-white/60">
              Status: <b>{cycle.status}</b>
            </p>
          </div>

          <button
            onClick={() => router.push("/performance/cycles")}
            className="glass-btn px-4 py-2"
          >
            ← Back
          </button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        {/* MANAGER TABLE */}
        {!isManager ? (
          <p className="text-white/60">
            This page is for Manager workflow.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-3">Employee</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-right p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {team.map((emp) => {
                  const appraisal = findAppraisal(emp._id);
                  const action = getAction(emp);

                  return (
                    <tr
                      key={emp._id}
                      className="border-b border-white/10 hover:bg-white/5"
                    >
                      <td className="p-3">
                        <div className="font-medium">
                          {emp.firstName || ""} {emp.lastName || ""}
                        </div>
                        <div className="text-xs text-white/60">
                          {emp.employeeNumber}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        {appraisal?.status || "NO_APPRAISAL"}
                      </td>

                      <td className="p-3 text-right">
                        {action.onClick ? (
                          <button
                            onClick={action.onClick}
                            className="glow-btn px-4 py-1"
                          >
                            {action.label} →
                          </button>
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {team.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center p-6 text-white/60">
                      No team members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
