import { useState } from "react";
import { useRouter } from "next/router";
import api from "@/api/axios";
import styles from "../../../styles/CreateTemplate.module.css";

export default function CreateCyclePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    cycleType: "ANNUAL",
    startDate: "",
    endDate: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleChange(e: any) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function submit(e: any) {
    e.preventDefault();

    if (!form.name || !form.startDate || !form.endDate) {
      setError("All fields are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");

      await api.post(
        "/performance/cycles",
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ redirect to list
      router.push("/performance/cycles");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create cycle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Performance Cycle</h1>

        <form onSubmit={submit}>
          <div className={styles.field}>
            <label>Name</label>
            <input
              className={styles.input}
              name="name"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label>Cycle Type</label>
            <select
              className={styles.input}
              name="cycleType"
              value={form.cycleType}
              onChange={handleChange}
            >
              <option value="ANNUAL">Annual</option>
              <option value="SEMI_ANNUAL">Semi Annual</option>
              <option value="PROBATIONARY">Probationary</option>
              <option value="PROJECT">Project</option>
              <option value="AD_HOC">Ad Hoc</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Start Date</label>
            <input
              type="date"
              className={styles.input}
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label>End Date</label>
            <input
              type="date"
              className={styles.input}
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.button} disabled={saving}>
            {saving ? "Creating..." : "Create Cycle"}
          </button>
        </form>
      </div>
    </div>
  );
}
