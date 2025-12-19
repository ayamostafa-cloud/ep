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
    profilePictureUrl: "",
  });

  const [msg, setMsg] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
        profilePictureUrl: d.profilePictureUrl || "",
      });
      // Set preview if profile picture exists
      if (d.profilePictureUrl) {
        setPreviewImage(d.profilePictureUrl);
      }
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
      // Update preview if it's the profile picture URL
      if (name === "profilePictureUrl") {
        setPreviewImage(value || null);
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMsg("Please select an image file ❌");
      return;
    }

    // Validate file size (max 3MB - base64 encoding increases size by ~33%)
    if (file.size > 3 * 1024 * 1024) {
      setMsg("Image size must be less than 3MB. Please compress the image or use a smaller file ❌");
      return;
    }

    // Convert to base64 data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData((p: any) => ({ ...p, profilePictureUrl: base64String }));
      setPreviewImage(base64String);
      setMsg("Image selected successfully ✅");
    };
    reader.onerror = () => {
      setMsg("Error reading image file ❌");
    };
    reader.readAsDataURL(file);
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
        {/* Profile Picture Upload */}
        <div>
          <label className="block mb-2 text-sm text-white/80">
            Profile Picture
          </label>
          
          {/* Preview */}
          {previewImage && (
            <div className="mb-4">
              <div className="relative inline-block">
                <img
                  src={previewImage}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-cyan-400/50 shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImage(null);
                    setFormData((p: any) => ({ ...p, profilePictureUrl: "" }));
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs flex items-center justify-center border border-white/20"
                  title="Remove photo"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="mb-3">
            <label className="block mb-2 text-xs text-white/60">
              Upload from computer
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-white/80
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-xl file:border-0
                         file:text-sm file:font-semibold
                         file:bg-cyan-500/20 file:text-cyan-300
                         file:border file:border-cyan-400/30
                         hover:file:bg-cyan-500/30
                         file:cursor-pointer
                         cursor-pointer
                         bg-white/5 border border-white/10 rounded-xl px-4 py-2
                         focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition"
            />
            <p className="mt-1 text-xs text-white/50">
              Supported: JPG, PNG, GIF (max 3MB - smaller images recommended)
            </p>
          </div>

          {/* Or URL Input */}
          <div>
            <label className="block mb-2 text-xs text-white/60">
              Or paste image URL
            </label>
            <input
              type="url"
              name="profilePictureUrl"
              value={formData.profilePictureUrl}
              onChange={handleChange}
              placeholder="https://example.com/photo.jpg"
              className="w-full rounded-xl bg-white/5 border border-white/10 
                         px-4 py-3 text-white outline-none text-sm
                         focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition"
            />
          </div>
        </div>

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