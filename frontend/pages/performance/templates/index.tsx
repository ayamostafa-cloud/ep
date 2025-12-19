import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import styles from "../../../styles/CreateTemplate.module.css";
import { useRouter } from "next/router";

export default function PerformanceTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /* ===============================
     LOAD TEMPLATES (BACKEND)
  =============================== */
  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:3001/performance/templates",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = res.data;

      // ✅ SAFE NORMALIZATION
      const list = Array.isArray(data)
        ? data
        : data?.items ?? data?.data ?? [];

      setTemplates(list);
    } catch (err: any) {
      console.error("LOAD TEMPLATES ERROR", err);
      setError("Failed to load templates");
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
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:3001/performance/templates/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      loadTemplates();
    } catch (err) {
      console.error("DELETE TEMPLATE ERROR", err);
      alert("Failed to delete template");
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

        <Link href="/performance/templates/create">
          <button className={styles.button} style={{ marginBottom: 20 }}>
            + Create Template
          </button>
        </Link>

        {loading && <p>Loading...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!loading && templates.length === 0 && (
          <p>No templates created yet.</p>
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

                      <button
                        className={styles.deleteBtn}
                        onClick={() => deleteTemplate(t._id)}
                      >
                        Delete
                      </button>
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
