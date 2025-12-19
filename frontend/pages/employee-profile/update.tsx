// pages/employee-profile/update.tsx
// pages/employee-profile/update.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../api/axios";

export default function UpdateProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<any>({
    phone: "",
    personalEmail: "",
    workEmail: "",
    biography: "",
    address: { street: "", city: "", country: "" },
  });

  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");

      const res = await api.get("/employee-profile/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const d = res.data;
      setFormData({
        phone: d.phone || "",
        personalEmail: d.personalEmail || "",
        workEmail: d.workEmail || "",
        biography: d.biography || "",
        address: d.address || { street: "", city: "", country: "" },
      });
    }

    load();
  }, []);

  function handleChange(e: any) {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setFormData((p: any) => ({
        ...p,
        address: { ...p.address, [key]: value },
      }));
    } else {
      setFormData((p: any) => ({ ...p, [name]: value }));
    }
  }

  async function submit(e: any) {
    e.preventDefault();
    const token = localStorage.getItem("token");

    await api.patch("/employee-profile/self-update", formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setMsg("Profile updated successfully ✅");
  }

function Input({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="block mb-2 text-sm text-white/80">
        {label}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl bg-white/5 border border-white/10 
                   px-4 py-3 text-white outline-none
                   focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition"
      />
    </div>
  );
}




return (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
    <div className="max-w-3xl mx-auto px-6 py-14">

      {/* HEADER */}
      <div className="glass-card p-8 mb-8">
        <h1 className="text-3xl font-semibold mb-1">
          Update Profile
        </h1>
        <p className="text-white/70">
          Keep your personal information up to date
        </p>
      </div>

      {msg && (
        <div className="mb-6 glass-card border border-green-400/30 text-green-400 px-6 py-3">
          {msg}
        </div>
      )}

      {/* FORM */}
      <form
        onSubmit={submit}
        className="glass-card p-8 space-y-5"
      >
        <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
        <Input label="Personal Email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} />
        <Input label="Work Email" name="workEmail" value={formData.workEmail} onChange={handleChange} />

        {/* BIO */}
        <div>
          <label className="block mb-2 text-sm text-white/80">
            Biography
          </label>
          <textarea
            name="biography"
            value={formData.biography}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-xl bg-white/5 border border-white/10 
                       px-4 py-3 text-white outline-none
                       focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Input label="Street" name="address.street" value={formData.address.street} onChange={handleChange} />
          <Input label="City" name="address.city" value={formData.address.city} onChange={handleChange} />
          <Input label="Country" name="address.country" value={formData.address.country} onChange={handleChange} />
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap gap-4 pt-4">
          <button
            type="submit"
            className="glow-btn px-8 py-2"
          >
            Save Changes
          </button>

          <button
            type="button"
            onClick={() => router.push("/employee-profile")}
            className="glass-btn px-6 py-2"
          >
            Back
          </button>
        </div>
      </form>

    </div>
  </div>
);
}