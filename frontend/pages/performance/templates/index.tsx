import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../api/axios";
import styles from "../../../styles/CreateTemplate.module.css";
import { useRouter } from "next/router";
import { getCurrentRole } from "../../../utils/routeGuard";

export default function PerformanceTemplatesPage() {
  const router = useRouter();
  // Route guard: HR and Managers can view
  const currentRole = getCurrentRole();
  const isHR = currentRole === "HR";
  const isManager = currentRole === "MANAGER";
  
  // Redirect if not HR or Manager
  useEffect(() => {
    if (!isHR && !isManager) {
      router.push("/dashboard");
    }
  }, [isHR, isManager, router]);
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);

  /* ===============================
     LOAD TEMPLATES (BACKEND)
  =============================== */
  useEffect(() => {
    loadTemplates();
  }, []);

  // Reload templates when router is ready and route changes
  useEffect(() => {
    if (router.isReady) {
      loadTemplates();
    }
  }, [router.isReady]);

  async function loadTemplates() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Not authenticated. Please login again.");
        router.push("/login");
        return;
      }

      const res = await api.get("/performance/templates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Templates API Response:", res.data);

      const data = res.data;

      // ✅ SAFE NORMALIZATION
      const list = Array.isArray(data)
        ? data
        : data?.items ?? data?.data ?? [];

      console.log("Normalized templates list:", list);

      // For managers, filter to show only active templates
      let filteredList = list;
      if (isManager && !isHR) {
        filteredList = list.filter((t: any) => t.isActive !== false);
        console.log("Filtered templates for manager (active only):", filteredList);
      }

      if (filteredList.length === 0 && list.length > 0) {
        setError("No active templates available. Please contact HR.");
      } else if (filteredList.length === 0) {
        setError(null); // No error, just no templates
      }

      setTemplates(filteredList);
    } catch (err: any) {
      console.error("LOAD TEMPLATES ERROR", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      if (err.response?.status === 403) {
        setError("You do not have permission to view templates");
      } else if (err.response?.status === 401) {
        setError("Authentication failed. Please login again.");
        router.push("/login");
      } else {
        setError(err.response?.data?.message || "Failed to load templates. Please check your connection.");
      }
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  /* ===============================
     DELETE TEMPLATE (BACKEND)
  =============================== */
  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;

    try {
      setOperationLoading(`delete-${id}`);
      const token = localStorage.getItem("token");

      await api.delete(`/performance/templates/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      loadTemplates();
    } catch (err: any) {
      console.error("DELETE TEMPLATE ERROR", err);
      if (err.response?.status === 403) {
        setError("You do not have permission");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Failed to delete template");
      } else {
        setError("Failed to delete template");
      }
    } finally {
      setOperationLoading(null);
    }
  }

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ maxWidth: 900 }}>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
        >
          Back
        </button>

        <h1 className={styles.title}>Performance Templates</h1>

        {isHR && (
          <Link href="/performance/templates/create">
            <button className={styles.button} style={{ marginBottom: 20 }}>
              + Create Template
            </button>
          </Link>
        )}

        {isManager && (
          <div style={{ 
            marginBottom: 20, 
            padding: "12px 16px", 
            backgroundColor: "rgba(255, 193, 7, 0.1)",
            border: "1px solid rgba(255, 193, 7, 0.3)",
            borderRadius: "8px",
            color: "#ffc107"
          }}>
            ℹ️ Read-only view. Templates are managed by HR.
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p style={{ color: "rgba(255,255,255,0.7)" }}>Loading templates...</p>
          </div>
        )}
        
        {error && (
          <div style={{
            padding: "16px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            marginBottom: "20px",
            color: "#ef4444"
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && templates.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.7)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
            <p style={{ fontSize: "18px", marginBottom: "8px", fontWeight: "600" }}>No Templates Found</p>
            <p style={{ fontSize: "14px" }}>
              {isHR 
                ? "Create your first performance template to get started."
                : "No templates have been created yet. Please contact HR."}
            </p>
            {isHR && (
              <Link href="/performance/templates/create">
                <button className={styles.button} style={{ marginTop: "20px" }}>
                  + Create Template
                </button>
              </Link>
            )}
          </div>
        )}

        {!loading && templates.length > 0 && (
          <table width="100%" cellPadding={10}>
            <thead>
              <tr>
                <th align="left">Name</th>
                <th align="left">Type</th>
                <th align="left">Scale</th>
                <th align="left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.templateType}</td>
                  <td>{t.ratingScale?.type}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/performance/templates/${t._id}`}>
                        <button className={styles.viewBtn}>
                          View
                        </button>
                      </Link>

                      {isHR && (
                        <button
                          className={styles.deleteBtn}
                          onClick={() => deleteTemplate(t._id)}
                          disabled={operationLoading === `delete-${t._id}`}
                        >
                          {operationLoading === `delete-${t._id}` ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
