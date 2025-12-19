import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";
import { getCurrentRole } from "../../../utils/routeGuard";

type Cycle = {
  _id: string;
  name: string;
  status: "PLANNED" | "ACTIVE" | "CLOSED" | "ARCHIVED";
  templateAssignments?: Array<{
    templateId: string;
    departmentIds: string[];
  }>;
};

type Template = {
  _id: string;
  name: string;
};

type Department = {
  _id: string;
  name: string;
  code: string;
  isActive?: boolean;
};

type TeamMember = {
  _id: string;
  firstName?: string;
  lastName?: string;
  employeeNumber: string;
};

type Appraisal = {
  _id: string;
  employeeProfileId: string | {
    _id: string;
    firstName?: string;
    lastName?: string;
    employeeNumber?: string;
  };
  status: "DRAFT" | "MANAGER_SUBMITTED" | "HR_PUBLISHED";
};

export default function CycleDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    templateId: "",
    departmentIds: [] as string[],
  });

  const currentRole = getCurrentRole();
  const isHR = currentRole === "HR";
  const isManager = currentRole === "MANAGER";

  async function loadCycleData() {
    if (!id || typeof id !== "string") return;
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const managerId = localStorage.getItem("userId");

      if (!token) {
        router.push("/login");
        return;
      }

      const [cycleRes, templatesRes, deptRes] = await Promise.all([
        api.get(`/performance/cycles/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        isHR ? api.get("/performance/templates", {
          headers: { Authorization: `Bearer ${token}` },
        }) : Promise.resolve({ data: [] }),
        isHR ? api.get("/organization-structure/departments", {
          headers: { Authorization: `Bearer ${token}` },
        }) : Promise.resolve({ data: [] }),
      ]);

      setCycle(cycleRes.data);
      if (isHR) {
        setTemplates(templatesRes.data || []);
        setDepartments((deptRes.data || []).filter((d: Department) => d.isActive !== false));
      }

      const appraisalsRes = await api.get(
        `/performance/cycles/${id}/appraisals`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppraisals(appraisalsRes.data || []);

      if (isManager && managerId) {
        const teamRes = await api.get(
          `/employee-profile/manager/team/${managerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTeam(teamRes.data || []);
      }
    } catch (e: any) {
      if (e.response?.status === 403) {
        setError("You do not have permission");
      } else if (e.response?.status === 400) {
        setError(e.response?.data?.message || "Failed to load cycle");
      } else {
        setError(e.response?.data?.message || "Failed to load cycle ❌");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCycleData();
  }, [id]);

  // HR Actions
  async function activateCycle() {
    if (!id || typeof id !== "string") return;
    try {
      setOperationLoading("activate");
      setError(null);
      const token = localStorage.getItem("token");
      await api.patch(
        `/performance/cycles/${id}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadCycleData();
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError("You do not have permission");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Failed to activate cycle");
      } else {
        setError("Failed to activate cycle");
      }
    } finally {
      setOperationLoading(null);
    }
  }

  async function closeCycle() {
    if (!id || typeof id !== "string") return;
    try {
      setOperationLoading("close");
      setError(null);
      const token = localStorage.getItem("token");
      await api.patch(
        `/performance/cycles/${id}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadCycleData();
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError("You do not have permission");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Failed to close cycle");
      } else {
        setError("Failed to close cycle");
      }
    } finally {
      setOperationLoading(null);
    }
  }

  async function publishCycleResults() {
    if (!id || typeof id !== "string") return;
    if (!confirm("Publish all submitted appraisals in this cycle? Employees will be able to view their appraisals.")) return;
    
    try {
      setOperationLoading("publish");
      setError(null);
      const token = localStorage.getItem("token");
      await api.patch(
        `/performance/cycles/${id}/publish-results`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadCycleData();
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError("You do not have permission");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Failed to publish results");
      } else {
        setError("Failed to publish results");
      }
    } finally {
      setOperationLoading(null);
    }
  }

  async function assignTemplate() {
    if (!id || typeof id !== "string" || !assignForm.templateId) {
      setError("Template is required");
      return;
    }

    // Check if template is already assigned
    const isAlreadyAssigned = Array.isArray(cycle?.templateAssignments) && cycle.templateAssignments.some(
      (ta) => ta.templateId === assignForm.templateId
    );
    if (isAlreadyAssigned) {
      setError("This template is already assigned to this cycle");
      return;
    }

    try {
      setOperationLoading("assign");
      setError(null);
      const token = localStorage.getItem("token");
      
      const currentAssignments = Array.isArray(cycle?.templateAssignments) ? cycle.templateAssignments : [];
      const updatedAssignments = [
        ...currentAssignments,
        {
          templateId: assignForm.templateId,
          departmentIds: assignForm.departmentIds,
        },
      ];

      await api.patch(
        `/performance/cycles/${id}`,
        { templateAssignments: updatedAssignments },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAssignForm({ templateId: "", departmentIds: [] });
      setShowAssignModal(false);
      await loadCycleData();
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError("You do not have permission");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Failed to assign template");
      } else {
        setError("Failed to assign template");
      }
    } finally {
      setOperationLoading(null);
    }
  }

  async function removeTemplateAssignment(templateId: string) {
    if (!id || typeof id !== "string") return;
    if (!confirm("Remove this template assignment?")) return;

    try {
      setOperationLoading("remove");
      setError(null);
      const token = localStorage.getItem("token");
      
      const currentAssignments = Array.isArray(cycle?.templateAssignments) ? cycle.templateAssignments : [];
      const updatedAssignments = currentAssignments.filter(
        (ta) => ta.templateId !== templateId
      );

      await api.patch(
        `/performance/cycles/${id}`,
        { templateAssignments: updatedAssignments },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await loadCycleData();
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError("You do not have permission");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Failed to remove assignment");
      } else {
        setError("Failed to remove assignment");
      }
    } finally {
      setOperationLoading(null);
    }
  }

  function toggleDepartment(deptId: string) {
    setAssignForm((prev) => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(deptId)
        ? prev.departmentIds.filter((id) => id !== deptId)
        : [...prev.departmentIds, deptId],
    }));
  }

  function findAppraisal(employeeId: string) {
    return appraisals.find((a) => a.employeeProfileId === employeeId);
  }

  function getAction(emp: TeamMember) {
    const appraisal = findAppraisal(emp._id);

    // Managers can only evaluate during ACTIVE cycles
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

          <div className="flex gap-2">
            {/* HR Controls */}
            {isHR && cycle.status === "PLANNED" && (
              <button
                onClick={activateCycle}
                disabled={operationLoading === "activate"}
                className="glass-btn px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border-green-500/30"
              >
                {operationLoading === "activate" ? "Activating..." : "Activate Cycle"}
              </button>
            )}
            {isHR && cycle.status === "ACTIVE" && (
              <button
                onClick={publishCycleResults}
                disabled={operationLoading === "publish"}
                className="glass-btn px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30"
              >
                {operationLoading === "publish" ? "Publishing..." : "Publish Results"}
              </button>
            )}
            {isHR && (cycle.status === "ACTIVE" || cycle.status === "CLOSED") && (
              <button
                onClick={closeCycle}
                disabled={operationLoading === "close" || cycle.status === "CLOSED"}
                className="glass-btn px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border-yellow-500/30 disabled:opacity-50"
              >
                {operationLoading === "close" ? "Closing..." : "Close Cycle"}
              </button>
            )}
            <button
              onClick={() => router.push("/performance/cycles")}
              className="glass-btn px-4 py-2"
            >
              ← Back
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* HR View - Cycle Information */}
        {isHR && (
          <>
            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/70 text-sm">
                {cycle.status === "PLANNED" && "Cycle is planned. Assign templates and activate it to allow managers to create appraisals."}
                {cycle.status === "ACTIVE" && "Cycle is active. Managers can now create and submit appraisals."}
                {cycle.status === "CLOSED" && "Cycle is closed. All appraisals should be published."}
                {cycle.status === "ARCHIVED" && "Cycle is archived."}
              </p>
            </div>

            {/* Template Assignments Section */}
            {cycle.status !== "CLOSED" && cycle.status !== "ARCHIVED" && (
              <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Template Assignments</h2>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="glass-btn px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30"
                  >
                    + Assign Template
                  </button>
                </div>

                {Array.isArray(cycle.templateAssignments) && cycle.templateAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {cycle.templateAssignments.map((assignment, idx) => {
                      const template = templates.find((t) => t._id === assignment.templateId);
                      const assignedDepts = assignment.departmentIds
                        .map((deptId) => departments.find((d) => d._id === deptId)?.name)
                        .filter(Boolean);

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-white/5 rounded border border-white/10 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium">{template?.name || "Unknown Template"}</div>
                            <div className="text-xs text-white/60 mt-1">
                              {assignedDepts.length > 0
                                ? `Departments: ${assignedDepts.join(", ")}`
                                : "All departments"}
                            </div>
                          </div>
                          <button
                            onClick={() => removeTemplateAssignment(assignment.templateId)}
                            disabled={operationLoading === "remove"}
                            className="glass-btn px-3 py-1 text-red-400 hover:bg-red-500/20 border-red-500/30 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-white/60 text-sm">
                    No templates assigned. Assign templates to enable appraisal creation.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* HR APPRAISALS TABLE */}
        {isHR && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">All Appraisals in Cycle</h2>
            {appraisals.length > 0 ? (
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
                    {appraisals.map((appraisal: any) => (
                      <tr
                        key={appraisal._id}
                        className="border-b border-white/10 hover:bg-white/5"
                      >
                        <td className="p-3">
                          <div className="font-medium">
                            {appraisal.employeeProfileId?.firstName || ""}{" "}
                            {appraisal.employeeProfileId?.lastName || ""}
                          </div>
                          <div className="text-xs text-white/60">
                            {appraisal.employeeProfileId?.employeeNumber || "N/A"}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              appraisal.status === "HR_PUBLISHED"
                                ? "bg-green-500/20 text-green-300"
                                : appraisal.status === "MANAGER_SUBMITTED"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-gray-500/20 text-gray-300"
                            }`}
                          >
                            {appraisal.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() =>
                              router.push(`/performance/appraisals/${appraisal._id}`)
                            }
                            className="glow-btn px-4 py-1 text-sm"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-white/60 text-sm">
                No appraisals created yet for this cycle.
              </p>
            )}
          </div>
        )}

        {/* MANAGER TABLE */}
        {!isManager ? (
          !isHR && <p className="text-white/60">Access restricted.</p>
        ) : cycle.status === "CLOSED" ? (
          <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
            <p className="text-yellow-300">Cycle is closed. Appraisals are read-only.</p>
          </div>
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
                        {action.onClick && cycle.status === "ACTIVE" ? (
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

      {/* Assign Template Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Assign Template to Cycle</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/70 block mb-1">Template</label>
                <select
                  value={assignForm.templateId}
                  onChange={(e) =>
                    setAssignForm((prev) => ({ ...prev, templateId: e.target.value }))
                  }
                  className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 outline-none"
                >
                  <option value="">Select template</option>
                  {templates
                    .filter(
                      (t) =>
                        !Array.isArray(cycle?.templateAssignments) || !cycle.templateAssignments.some(
                          (ta) => ta.templateId === t._id
                        )
                    )
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/70 block mb-2">
                  Departments (leave empty for all departments)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-white/5 rounded border border-white/10">
                  {departments.map((dept) => (
                    <label
                      key={dept._id}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={assignForm.departmentIds.includes(dept._id)}
                        onChange={() => toggleDepartment(dept._id)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {dept.name} ({dept.code})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={assignTemplate}
                disabled={operationLoading === "assign" || !assignForm.templateId}
                className="glow-btn px-4 py-2 flex-1 disabled:opacity-50"
              >
                {operationLoading === "assign" ? "Assigning..." : "Assign"}
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignForm({ templateId: "", departmentIds: [] });
                }}
                className="glass-btn px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
