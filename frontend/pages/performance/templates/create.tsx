import { useState } from "react";
import { useRouter } from "next/router";
import axios from "@/api/axios";
import styles from "../../../styles/CreateTemplate.module.css";

export default function CreateTemplatePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    templateType: "ANNUAL",
    description: "",
    ratingScale: {
      type: "FIVE_POINT",
      min: 1,
      max: 5,
    },
    criteria: [] as { key: string; title: string }[],
  });

  const [newCriterion, setNewCriterion] = useState("");
  const [error, setError] = useState("");

  function addCriterion() {
    if (!newCriterion.trim()) return;

    setForm({
      ...form,
      criteria: [
        ...form.criteria,
        {
          key: newCriterion.toLowerCase().replace(/\s+/g, "_"),
          title: newCriterion,
        },
      ],
    });

    setNewCriterion("");
  }

  function removeCriterion(index: number) {
    const updated = [...form.criteria];
    updated.splice(index, 1);
    setForm({ ...form, criteria: updated });
  }

  async function submit(e: any) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Template name is required");
      return;
    }

    if (form.criteria.length === 0) {
      setError("Add at least one criterion");
      return;
    }

    try {
      await axios.post("/performance/templates", form);
      router.push("/performance/templates");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create template");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Performance Template</h1>

        <form onSubmit={submit}>
          <input
            className={styles.input}
            placeholder="Template Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <select
            className={styles.select}
            value={form.templateType}
            onChange={(e) =>
              setForm({ ...form, templateType: e.target.value })
            }
          >
            <option value="ANNUAL">Annual</option>
            <option value="PROJECT">Project</option>
          </select>

          {/* CRITERIA SECTION */}
          <h3 style={{ marginTop: 20 }}>Criteria</h3>

          <div style={{ display: "flex", gap: 10 }}>
            <input
              className={styles.input}
              placeholder="Criterion title (e.g. Teamwork)"
              value={newCriterion}
              onChange={(e) => setNewCriterion(e.target.value)}
            />
            <button type="button" onClick={addCriterion}>
              Add
            </button>
          </div>

          {form.criteria.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 10 }}>
              <span>{c.title}</span>
              <button type="button" onClick={() => removeCriterion(i)}>
                ❌
              </button>
            </div>
          ))}

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.button}>Create Template</button>
        </form>
      </div>
    </div>
  );
}
