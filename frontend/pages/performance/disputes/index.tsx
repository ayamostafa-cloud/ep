import { useEffect, useState } from "react";
import api from "@/api/axios";

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);

  useEffect(() => {
    api
      .get("/performance/disputes", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => setDisputes(res.data));
  }, []);

  return (
    <div className="glass-card p-6">
      <h1 className="text-lg text-white mb-4">
        Team Disputes (Read-Only)
      </h1>

      {disputes.map((d) => (
        <div key={d._id} className="bg-white/5 p-3 rounded mb-2">
          <p className="text-xs text-white">
            Reason: {d.reason}
          </p>
          <p className="text-xs text-white/60">
            Status: {d.status}
          </p>
        </div>
      ))}
    </div>
  );
}
