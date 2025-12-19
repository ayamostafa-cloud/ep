import { useEffect, useState } from "react";
import api from "../../../api/axios";
import { useRouter } from "next/router";
/* ================================
   Position Node (Recursive)
================================ */

function PositionNode({ node }: { node: any }) {
  const [expanded, setExpanded] = useState(true);
  const router = useRouter();
  
  return (
    <li className="ml-6 mt-4">
      <div
        className="inline-block px-4 py-3 rounded-lg bg-white/10 border border-white/10 cursor-pointer hover:bg-white/20"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="font-medium flex items-center gap-2">
          {node.children && node.children.length > 0 && (
            <span className="text-blue-400">
              {expanded ? "▼" : "▶"}
            </span>
          )}
          {node.title}
        </div>

        {node.reportsTo && (
  <div className="text-sm text-white/60 mt-1">
    Reports to: Manager
  </div>
)}

      </div>

      {expanded && node.children && node.children.length > 0 && (
        <ul className="ml-6 mt-3 border-l border-white/20 pl-4">
          {node.children.map((child: any) => (
            <PositionNode key={child._id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ================================
   Organization Chart Page
================================ */
export default function OrgChartPage() {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Get user role to determine back button destination
  const getBackUrl = () => {
    if (typeof window === "undefined") return "/dashboard";
    const role = localStorage.getItem("role");
    const normalizedRole = (role || "").toUpperCase().replaceAll(" ", "_");
    
    // For managers (DEPARTMENT_HEAD), go back to dashboard
    if (normalizedRole === "DEPARTMENT_HEAD" || normalizedRole === "HR_MANAGER") {
      return "/dashboard";
    }
    
    // For system admin, go to organization structure home
    return "/organization-structure";
  };

  async function loadHierarchy() {
    try {
      const res = await api.get("/organization-structure/hierarchy");
      setHierarchy(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load organization hierarchy ❌");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHierarchy();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading organization chart...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-400">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-10">
      <h1 className="text-3xl font-light mb-8">Organization Chart</h1>
      <button
            type="button"
            onClick={() => router.push(getBackUrl())}
            className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
          >
            ← Back
          </button>
      {hierarchy.map((dept: any, index: number) => (
        <div
          key={dept._id || index}
          className="mb-10 p-6 rounded-xl border border-white/10 bg-black/30"
        >
          <h2 className="text-2xl mb-4">
            Department:{" "}
            <span className="text-blue-400">
              {dept.name}
            </span>
          </h2>

          {dept.positions && dept.positions.length > 0 ? (
            <ul>
              {dept.positions.map((pos: any) => (
                <PositionNode key={pos._id} node={pos} />
              ))}
            </ul>
          ) : (
            <p className="text-white/60">
              No positions in this department
            </p>
          )}
        </div>
      ))}
      
    </div>
  );
}
