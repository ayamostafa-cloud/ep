// pages/employee-profile/index.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../api/axios";

export default function EmployeeProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return router.push("/login");

        const res = await api.get("/employee-profile/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProfile(res.data);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading…</p>;
  if (!profile) return <p>Profile not found ❌</p>;

  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* HEADER */}
      <div className="glass-card p-8 mb-10">
        <h1 className="text-3xl font-semibold mb-1">
          Employee Profile
        </h1>
        <p className="text-white/70">
          Welcome, {fullName} 👋
        </p>
      </div>

      {/* BASIC INFO */}
      <div className="glass-card p-8 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-cyan-300">
          Basic Information
        </h2>

        <div className="space-y-2 text-white/90">
          <p><strong>Employee Number:</strong> {profile.employeeNumber}</p>
          <p><strong>National ID:</strong> {profile.nationalId}</p>
          <p>
            <strong>Date of Hire:</strong>{" "}
            {new Date(profile.dateOfHire).toLocaleDateString()}
          </p>
          <p><strong>Status:</strong> {profile.status}</p>
        </div>
      </div>

      {/* DEPARTMENT & POSITION */}
      <div className="glass-card p-8 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-cyan-300">
          Department & Position
        </h2>

        <div className="space-y-2 text-white/90">
          <p>
            <strong>Department:</strong>{" "}
            {profile.primaryDepartmentId && typeof profile.primaryDepartmentId === 'object'
              ? profile.primaryDepartmentId.name
              : "—"}
          </p>
          <p>
            <strong>Position:</strong>{" "}
            {profile.primaryPositionId && typeof profile.primaryPositionId === 'object'
              ? profile.primaryPositionId.title || profile.primaryPositionId.name || "—"
              : "—"}
          </p>
        </div>
      </div>

      {/* CONTACT INFO */}
      <div className="glass-card p-8 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-cyan-300">
          Contact Information
        </h2>

        <div className="space-y-2 text-white/90">
          <p><strong>Personal Email:</strong> {profile.personalEmail || "—"}</p>
          <p><strong>Work Email:</strong> {profile.workEmail || "—"}</p>
          <p><strong>Phone:</strong> {profile.phone || "—"}</p>
          <p>
            <strong>Address:</strong>{" "}
            {profile.address
              ? `${profile.address.street}, ${profile.address.city}, ${profile.address.country}`
              : "—"}
          </p>
        </div>
      </div>

      {/* BIOGRAPHY */}
      <div className="glass-card p-8 mb-10">
        <h2 className="text-xl font-semibold mb-4 text-cyan-300">
          Biography
        </h2>
        <p className="text-white/90">
          {profile.biography || "—"}
        </p>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => router.push("/employee-profile/update")}
          className="glow-btn px-6 py-2"
        >
          Update Profile
        </button>

        

        <button
          onClick={() => router.push("/dashboard")}
          className="glass-btn px-6 py-2"
        >
          Back
        </button>
      </div>

    </div>
  </div>
);
}