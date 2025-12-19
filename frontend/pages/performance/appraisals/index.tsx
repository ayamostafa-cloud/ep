import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "@/api/axios";

export default function ManagerAppraisalsPage() {
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      const cycles = await api.get("/performance/cycles", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const active = cycles.data.find((c: any) => c.status === "ACTIVE");
      if (!active) return;

      const res = await api.get(
        `/performance/cycles/${active._id}/appraisals`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAppraisals(res.data);
    }
    load();
  }, []);

  return (
    <div className="glass-card p-6">
      <h1 className="text-lg font-bold text-white mb-4">
        My Team Appraisals
      </h1>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10">
            <th>Employee</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {appraisals.map((a) => (
            <tr key={a._id} className="border-b border-white/5">
              <td>{a.employeeProfileId?.firstName}</td>
              <td>{a.status}</td>
              <td className="text-right">
                <button
                  onClick={() =>
                    router.push(`/performance/appraisals/${a._id}`)
                  }
                  className="px-3 py-1 bg-cyan-600 rounded"
                >
                  View →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
