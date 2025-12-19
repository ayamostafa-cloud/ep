import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "../../../api/axios";
import { useRouteGuard } from "../../../utils/routeGuard";

export default function MyAppraisalDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  // Route guard: Employee only
  useRouteGuard("EMPLOYEE");

  const [appraisal, setAppraisal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Acknowledgment state
  const [acknowledgmentComment, setAcknowledgmentComment] = useState("");
  const [acknowledging, setAcknowledging] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [acknowledgeError, setAcknowledgeError] = useState<string | null>(null);

  // 🔹 Dispute state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  
  // 🔹 Dispute data (if exists)
  const [disputeData, setDisputeData] = useState<any>(null);

  // 🔹 Technical details toggle
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await api.get(`/performance/my-appraisals/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Only allow viewing if status is HR_PUBLISHED
      if (res.data.status !== "HR_PUBLISHED") {
        setError("This appraisal is not yet published. It will be visible after HR publishes it.");
        return;
      }

      setAppraisal(res.data);
      // Check if already acknowledged
      if (res.data.employeeAcknowledgedAt) {
        setAcknowledged(true);
        setAcknowledgmentComment(res.data.employeeAcknowledgementComment || "");
      }
      
      // Load disputes for this appraisal if available
      try {
        const disputesRes = await api.get("/performance/disputes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const disputes = Array.isArray(disputesRes.data) ? disputesRes.data : [];
        const userId = localStorage.getItem("userId");
        const myDispute = disputes.find((d: any) => {
          const appraisalId = typeof d.appraisalId === "object" ? d.appraisalId._id : d.appraisalId;
          const raisedBy = typeof d.raisedByEmployeeId === "object" ? d.raisedByEmployeeId._id : d.raisedByEmployeeId;
          return String(appraisalId) === String(id) && String(raisedBy) === String(userId);
        });
        if (myDispute) {
          setDisputeData(myDispute);
        }
      } catch (err) {
        // Disputes not available, ignore
      }
    } catch {
      setError("Appraisal not found");
    } finally {
      setLoading(false);
    }
  }

  /* ===============================
     ACKNOWLEDGE APPRAISAL
  =============================== */
  async function acknowledgeAppraisal() {
    try {
      setAcknowledging(true);
      setAcknowledgeError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      await api.patch(
        `/performance/my-appraisals/${id}`,
        {
          employeeAcknowledgementComment: acknowledgmentComment || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAcknowledged(true);
      setShowAcknowledgeModal(false);
      setAcknowledgmentComment("");
      await load(); // Reload to get updated data
    } catch (error: any) {
      setAcknowledgeError(error.response?.data?.message || "Failed to acknowledge appraisal");
    } finally {
      setAcknowledging(false);
    }
  }
  
  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here if needed
  }

  /* ===============================
     RAISE DISPUTE
  =============================== */
  async function submitDispute() {
    // Frontend validation
    if (!reason.trim() || reason.trim().length < 3) {
      setDisputeError("Reason must be at least 3 characters");
      return;
    }
    if (!details.trim() || details.trim().length < 5) {
      setDisputeError("Details must be at least 5 characters");
      return;
    }

    try {
      setSubmitting(true);
      setDisputeError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      await api.post(
        `/performance/appraisals/${id}/disputes`,
        {
          reason: reason.trim(),
          details: details.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowDisputeModal(false);
      setReason("");
      setDetails("");
      await load(); // Reload to get updated data
    } catch (error: any) {
      setDisputeError(error.response?.data?.message || "Failed to submit dispute");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-64 mb-4"></div>
            <div className="h-4 bg-white/5 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div className="bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg p-6 text-center">
          <div className="text-lg font-semibold mb-2">⚠️ Error</div>
          <div className="text-sm">{error}</div>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 glass-btn px-4 py-2 text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );

  const cycle = typeof appraisal.cycleId === "object" ? appraisal.cycleId : null;
  const cycleName = cycle?.name || (cycle?._id ? `Cycle: ${String(cycle._id).slice(-8)}` : "Cycle: —");
  const employee = typeof appraisal.employeeProfileId === "object" ? appraisal.employeeProfileId : null;
  const employeeName = employee 
    ? `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.employeeNumber || "Employee"
    : (appraisal.employeeProfileId ? `Employee ID: ${String(appraisal.employeeProfileId).slice(-8)}` : "Employee: —");
  const template = typeof appraisal.templateId === "object" ? appraisal.templateId : null;
  const templateName = template?.name || (template?._id ? `Template: ${String(template._id).slice(-8)}` : "Template: —");
  
  const getStatusBadge = (status: string) => {
    const statusUpper = (status || "").toUpperCase();
    if (statusUpper === "DRAFT") {
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    } else if (statusUpper === "SUBMITTED" || statusUpper === "MANAGER_SUBMITTED") {
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    } else if (statusUpper === "HR_PUBLISHED" || statusUpper === "PUBLISHED") {
      return "bg-green-500/20 text-green-300 border-green-500/30";
    } else if (statusUpper === "ARCHIVED") {
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
    return "bg-white/10 text-white/70 border-white/20";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-white/70 hover:text-white text-sm font-medium flex items-center gap-1"
            >
              ← Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded text-xs font-medium bg-white/10 text-white/70 border border-white/20">
                Read-only
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadge(appraisal.status)}`}>
                {appraisal.status === "HR_PUBLISHED" ? "Published" : appraisal.status}
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-4">{cycleName}</h1>
          
          {/* Appraisal Summary */}
          <div 
            className="p-6 mb-6 rounded-[20px]"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.1)',
            }}
          >
            <h2 className="text-base font-semibold text-white mb-4">Appraisal Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-white/60 mb-1 text-xs font-medium">Cycle</div>
                <div className="text-white font-medium">{cycleName}</div>
              </div>
              <div>
                <div className="text-white/60 mb-1 text-xs font-medium">Template</div>
                <div className="text-white font-medium">{templateName}</div>
              </div>
              <div>
                <div className="text-white/60 mb-1 text-xs font-medium">Status</div>
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(appraisal.status)}`}>
                    {appraisal.status === "HR_PUBLISHED" ? "Published" : appraisal.status}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Technical Details (Collapsible) - Hide IDs unless needed */}
            {(appraisal.employeeProfileId || appraisal.templateId || cycle?._id || appraisal._id) && (
              <div className="border-t border-white/10 pt-4 mt-4">
                <button
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="text-xs text-white/60 hover:text-white/80 flex items-center gap-1"
                >
                  {showTechnicalDetails ? "▼" : "▶"} Technical Details
                </button>
                {showTechnicalDetails && (
                  <div className="mt-3 space-y-2 text-xs text-white/70 font-mono">
                    {appraisal.employeeProfileId && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/50">Employee ID:</span>
                        <span className="text-white/80">{String(appraisal.employeeProfileId)}</span>
                        <button
                          onClick={() => copyToClipboard(String(appraisal.employeeProfileId), "Employee ID")}
                          className="text-white/40 hover:text-white/70"
                          title="Copy ID"
                        >
                          📋
                        </button>
                      </div>
                    )}
                    {appraisal.templateId && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/50">Template ID:</span>
                        <span className="text-white/80">{String(appraisal.templateId)}</span>
                        <button
                          onClick={() => copyToClipboard(String(appraisal.templateId), "Template ID")}
                          className="text-white/40 hover:text-white/70"
                          title="Copy ID"
                        >
                          📋
                        </button>
                      </div>
                    )}
                    {cycle?._id && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/50">Cycle ID:</span>
                        <span className="text-white/80">{String(cycle._id)}</span>
                        <button
                          onClick={() => copyToClipboard(String(cycle._id), "Cycle ID")}
                          className="text-white/40 hover:text-white/70"
                          title="Copy ID"
                        >
                          📋
                        </button>
                      </div>
                    )}
                    {appraisal._id && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/50">Appraisal ID:</span>
                        <span className="text-white/80">{String(appraisal._id)}</span>
                        <button
                          onClick={() => copyToClipboard(String(appraisal._id), "Appraisal ID")}
                          className="text-white/40 hover:text-white/70"
                          title="Copy ID"
                        >
                          📋
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Dispute Status Badge if exists */}
            {disputeData && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-xs font-medium">Dispute Status:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    disputeData.status === "OPEN" || disputeData.status === "UNDER_REVIEW"
                      ? "bg-orange-500/20 text-orange-300 border-orange-500/30 shadow-sm shadow-orange-500/20"
                      : disputeData.status === "ADJUSTED"
                      ? "bg-green-500/20 text-green-300 border-green-500/30 shadow-sm shadow-green-500/20"
                      : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                  }`}>
                    {disputeData.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Final Score */}
        {(appraisal.totalScore !== null && appraisal.totalScore !== undefined) || appraisal.overallRatingLabel ? (
          <div 
            className="p-6 mb-6 rounded-[20px]"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.1)',
            }}
          >
            <h2 className="text-base font-semibold text-white mb-4">Final Score</h2>
            <div className="grid grid-cols-2 gap-6">
              {appraisal.totalScore !== null && appraisal.totalScore !== undefined && (
                <div>
                  <div className="text-xs text-white/60 mb-2">Total Score</div>
                  <div className="text-2xl font-bold text-white">{appraisal.totalScore}</div>
                </div>
              )}
              {appraisal.overallRatingLabel && (
                <div>
                  <div className="text-xs text-white/60 mb-2">Overall Rating</div>
                  <div className="text-xl font-semibold text-cyan-300">{appraisal.overallRatingLabel}</div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Ratings */}
        {appraisal.ratings && Array.isArray(appraisal.ratings) && appraisal.ratings.length > 0 && (
          <div 
            className="p-6 mb-6 rounded-[20px]"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.1)',
            }}
          >
            <h2 className="text-base font-semibold text-white mb-4">Ratings</h2>
            <div className="space-y-3">
              {appraisal.ratings.map((rating: any, index: number) => (
                <div key={rating.key || index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-white">{rating.title || rating.key || `Criterion ${index + 1}`}</div>
                    <div className="text-sm font-semibold text-cyan-300">{rating.ratingValue || "—"}</div>
                  </div>
                  {rating.comment && (
                    <div className="text-xs text-white/70 mt-2">{rating.comment}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manager Comments */}
        {appraisal.managerSummary && (
          <div 
            className="p-6 mb-6 rounded-[20px]"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.1)',
            }}
          >
            <h2 className="text-base font-semibold text-white mb-3">Manager Comments</h2>
            <p className="text-white/90 text-sm leading-relaxed">{appraisal.managerSummary}</p>
          </div>
        )}

        {/* Development Notes */}
        {(appraisal.strengths || appraisal.improvementAreas) && (
          <div 
            className="p-6 mb-6 rounded-[20px]"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.1)',
            }}
          >
            <h2 className="text-base font-semibold text-white mb-4">Development Notes</h2>
            <div className="space-y-4">
              {appraisal.strengths && (
                <div>
                  <h3 className="text-sm font-medium text-green-400 mb-2">Strengths</h3>
                  <p className="text-white/90 text-sm leading-relaxed">{appraisal.strengths}</p>
                </div>
              )}
              {appraisal.improvementAreas && (
                <div>
                  <h3 className="text-sm font-medium text-yellow-400 mb-2">Improvement Areas</h3>
                  <p className="text-white/90 text-sm leading-relaxed">{appraisal.improvementAreas}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Acknowledge Appraisal - Only if PUBLISHED and not acknowledged */}
        {appraisal.status === "HR_PUBLISHED" && !acknowledged && (
          <div 
            className="p-6 mb-6 rounded-[20px]"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/95 mb-1">Acknowledge Appraisal</h3>
                <p className="text-xs text-white/60">Review and acknowledge this published appraisal</p>
              </div>
              <button
                className="cyan-glow-btn px-6 py-2"
                onClick={() => setShowAcknowledgeModal(true)}
              >
                Acknowledge
              </button>
            </div>
          </div>
        )}

        {/* Acknowledged Status */}
        {appraisal.status === "HR_PUBLISHED" && acknowledged && (
          <div 
            className="p-6 mb-6 rounded-[20px]"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.1)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400 border border-green-500/30 shadow-sm shadow-green-500/20">
                ✓ Acknowledged
              </span>
              {appraisal.employeeAcknowledgedAt && (
                <span className="text-xs text-white/50">
                  on {new Date(appraisal.employeeAcknowledgedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {appraisal.employeeAcknowledgementComment && (
              <div>
                <strong className="text-cyan-300 text-sm">Your Comment:</strong>
                <p className="text-white/90 text-sm mt-1">{appraisal.employeeAcknowledgementComment}</p>
              </div>
            )}
          </div>
        )}

        {/* Raise Dispute - Only if PUBLISHED, acknowledged, and no existing dispute */}
        {appraisal.status === "HR_PUBLISHED" && acknowledged && !disputeData && (
          <div 
            className="p-6 mb-6 rounded-[20px]"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/95 mb-1">Raise Dispute</h3>
                <p className="text-xs text-white/60">If you disagree with any part of this appraisal</p>
              </div>
              <button
                className="red-glow-btn px-6 py-2"
                onClick={() => setShowDisputeModal(true)}
              >
                Raise Dispute
              </button>
            </div>
          </div>
        )}

        {/* Dispute Status Display (if exists) */}
        {disputeData && (
          <div 
            className="p-6 mb-6 rounded-[20px]"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.1)',
            }}
          >
            <h3 className="text-sm font-semibold text-white/95 mb-3">Dispute Status</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm border ${
                disputeData.status === "OPEN" || disputeData.status === "UNDER_REVIEW"
                  ? "bg-orange-500/20 text-orange-300 border-orange-500/30 shadow-sm shadow-orange-500/20"
                  : disputeData.status === "ADJUSTED"
                  ? "bg-green-500/20 text-green-300 border-green-500/30 shadow-sm shadow-green-500/20"
                  : "bg-gray-500/20 text-gray-300 border-gray-500/30"
              }`}>
                {disputeData.status}
              </span>
              {disputeData.submittedAt && (
                <span className="text-xs text-white/50">
                  Submitted on {new Date(disputeData.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="text-sm text-white/70 mb-2">
              <strong>Reason:</strong> {disputeData.reason || "—"}
            </div>
            {disputeData.details && (
              <div className="text-sm text-white/70 mb-2">
                <strong>Details:</strong> {disputeData.details}
              </div>
            )}
            {disputeData.status === "ADJUSTED" && disputeData.resolutionSummary && (
              <div className="text-sm text-green-400/80 mt-3 pt-3 border-t border-white/10">
                <strong>Resolution:</strong> {disputeData.resolutionSummary}
              </div>
            )}
          </div>
        )}

        {/* Acknowledge Modal */}
        {showAcknowledgeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div 
              className="p-6 max-w-md w-full rounded-[20px]"
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              }}
            >
              <h2 className="text-lg font-semibold text-white mb-4">Acknowledge Appraisal</h2>
              <p className="text-sm text-white/70 mb-4">
                Please review your appraisal and acknowledge it. You can add an optional comment.
              </p>
              
              {acknowledgeError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                  {acknowledgeError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm text-white/90">
                    Comment (optional)
                  </label>
                  <textarea
                    className="glass-input w-full"
                    rows={3}
                    value={acknowledgmentComment}
                    onChange={(e) => setAcknowledgmentComment(e.target.value)}
                    placeholder="Add an optional comment..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    className="cyan-glow-btn flex-1"
                    disabled={acknowledging}
                    onClick={acknowledgeAppraisal}
                  >
                    {acknowledging ? "Acknowledging..." : "Confirm Acknowledge"}
                  </button>
                  <button
                    className="glass-btn px-6"
                    onClick={() => {
                      setShowAcknowledgeModal(false);
                      setAcknowledgeError(null);
                      setAcknowledgmentComment("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Modal */}
        {showDisputeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div 
              className="p-6 max-w-md w-full rounded-[20px]"
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              }}
            >
              <h2 className="text-lg font-semibold text-white mb-4">Raise Dispute</h2>
              <p className="text-sm text-white/70 mb-4">
                If you disagree with any part of this appraisal, you can raise a dispute for HR review.
              </p>
              
              {disputeError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                  {disputeError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm text-white/90">
                    Reason <span className="text-red-400">*</span>
                    <span className="ml-2 text-xs text-white/50">(min. 3 characters)</span>
                  </label>
                  <input
                    className="glass-input w-full"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setDisputeError(null);
                    }}
                    placeholder="Enter reason for dispute"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm text-white/90">
                    Details <span className="text-red-400">*</span>
                    <span className="ml-2 text-xs text-white/50">(min. 5 characters)</span>
                  </label>
                  <textarea
                    className="glass-input w-full"
                    rows={4}
                    value={details}
                    onChange={(e) => {
                      setDetails(e.target.value);
                      setDisputeError(null);
                    }}
                    placeholder="Provide detailed explanation"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    className="red-glow-btn flex-1"
                    disabled={submitting || !reason.trim() || reason.trim().length < 3 || !details.trim() || details.trim().length < 5}
                    onClick={submitDispute}
                  >
                    {submitting ? "Submitting..." : "Submit Dispute"}
                  </button>
                  <button
                    className="glass-btn px-6"
                    onClick={() => {
                      setShowDisputeModal(false);
                      setReason("");
                      setDetails("");
                      setDisputeError(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
        <button
            className="glass-btn px-6 py-2"
            onClick={() => router.push("/dashboard")}
        >
            ← Back to Dashboard
        </button>
        </div>
      </div>
    </div>
  );
}
