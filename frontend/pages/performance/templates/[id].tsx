import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from "../../../styles/CreateTemplate.module.css";

export default function EditTemplatePage() {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ===============================
     LOAD TEMPLATE (BACKEND)
  =============================== */
  useEffect(() => {
    if (id) loadTemplate();
  }, [id]);

  async function loadTemplate() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      const res = await axios.get(
        `/performance/templates/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setForm(res.data);
    } catch (err) {
      console.error("LOAD TEMPLATE ERROR", err);
      setError("Failed to load template");
      setForm(null);
    } finally {
      setLoading(false);
    }
  }

  /* ===============================
     FORM HANDLERS
  =============================== */
  function handleChange(e: any) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  function handleRatingScaleChange(e: any) {
    const { name, value } = e.target;
    setForm({
      ...form,
      ratingScale: {
        ...form.ratingScale,
        [name]: name === "type" ? value : Number(value),
      },
    });
  }

  /* ===============================
     SAVE TEMPLATE (BACKEND)
  =============================== */
  async function save() {
    if (!form.name?.trim()) {
      setError("Name is required");
      return;
    }

    if (form.ratingScale.min >= form.ratingScale.max) {
      setError("Rating scale min must be less than max");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");

      await axios.patch(
        `/performance/templates/${id}`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      router.push("/performance/templates");
    } catch (err: any) {
      console.error("SAVE TEMPLATE ERROR", err);
      setError(err?.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  /* ===============================
     RENDER
  =============================== */
  if (loading) {
    return (
      <div className={styles.page}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className={styles.page}>
        <p>Template not found</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Edit Performance Template</h1>

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
          <label>Template Type</label>
          <select
            className={styles.select}
            name="templateType"
            value={form.templateType}
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
          <label>Rating Scale</label>

          <select
            className={styles.select}
            name="type"
            value={form.ratingScale?.type}
            onChange={handleRatingScaleChange}
          >
            <option value="THREE_POINT">3 Point</option>
            <option value="FIVE_POINT">5 Point</option>
            <option value="TEN_POINT">10 Point</option>
          </select>

          <div className={styles.scaleRow}>
            <input
              className={styles.input}
              type="number"
              name="min"
              value={form.ratingScale?.min}
              onChange={handleRatingScaleChange}
            />
            <input
              className={styles.input}
              type="number"
              name="max"
              value={form.ratingScale?.max}
              onChange={handleRatingScaleChange}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label>Description</label>
          <textarea
            className={styles.textarea}
            name="description"
            value={form.description || ""}
            onChange={handleChange}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.button}
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/performance/templates")}
          className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
        >
          Back
        </button>
      </div>
    </div>
  );
}
