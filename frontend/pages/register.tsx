import React, { useState } from "react";
import { useRouter } from "next/router";
import api from "../api/axios";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    candidateNumber: "",
    password: "",
    firstName: "",
    lastName: "",
    nationalId: "",
    resumeUrl: "",
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    try {
      setLoading(true);

      await api.post("/auth/register", {
        candidateNumber: form.candidateNumber,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        nationalId: form.nationalId,
        resumeUrl: form.resumeUrl || undefined,
      });

      alert("Candidate registered successfully ✅");
      router.push("/login");
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Registration failed ❌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="w-full max-w-md glass-card p-8">

        <h1 className="text-3xl font-semibold text-center mb-2">
          Candidate Registration
        </h1>

        <p className="text-center text-white/70 mb-6">
          Apply for a position
        </p>

        <form onSubmit={handleRegister} className="space-y-4">

          {/* CANDIDATE NUMBER */}
          <div>
            <label className="text-sm text-white/70">
              Candidate Number
            </label>
            <input
              className="input"
              placeholder="CAND2025-001"
              value={form.candidateNumber}
              onChange={(e) =>
                update("candidateNumber", e.target.value)
              }
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm text-white/70">
              Password
            </label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </div>

          {/* NAME */}
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="First Name"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="Last Name"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              required
            />
          </div>

          {/* NATIONAL ID */}
          <div>
            <input
              className="input"
              placeholder="National ID"
              value={form.nationalId}
              onChange={(e) =>
                update("nationalId", e.target.value)
              }
              required
            />
          </div>

          {/* RESUME */}
          <div>
            <input
              className="input"
              placeholder="Resume URL (optional)"
              value={form.resumeUrl}
              onChange={(e) =>
                update("resumeUrl", e.target.value)
              }
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="glow-btn w-full mt-2"
          >
            {loading ? "Registering..." : "Apply Now"}
          </button>
        </form>

        {/* ERROR */}
        {msg && (
          <p className="text-center mt-4 text-red-400">
            {msg}
          </p>
        )}

        {/* FOOTER */}
        <p className="text-center text-sm text-white/60 mt-6">
          Already applied?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-cyan-300 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
