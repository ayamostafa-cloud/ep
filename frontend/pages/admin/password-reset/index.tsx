// pages/admin/password-reset/index.tsx
// System Admin: Password Management
// Uses existing backend API: POST /employee-profile/set-password/:id
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";

export default function AdminPasswordResetPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    const normalizedRole = (savedRole || "")
      .toUpperCase()
      .replaceAll(" ", "_");

    if (!token || normalizedRole !== "SYSTEM_ADMIN") {
      router.push("/dashboard");
      return;
    }

    loadUsers();
  }, [router]);

  async function loadUsers() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get("/employee-profile", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 },
      });

      const userList = res.data?.items || res.data?.data || res.data || [];
      setUsers(Array.isArray(userList) ? userList : []);
    } catch (error) {
      console.error("Failed to load users:", error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  function openPasswordModal(user: any) {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(true);
  }

  async function resetPassword() {
    if (!selectedUser || !newPassword) {
      alert("Password is required");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (!confirm("Are you sure you want to reset this user's password?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      // Using existing API: POST /employee-profile/set-password/:id
      await api.post(
        `/employee-profile/set-password/${selectedUser._id}`,
        {
          password: newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Password reset successfully");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to reset password");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-white/60">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Password Management</h1>
              <p className="text-white/60 text-sm">Reset user passwords and manage authentication</p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="glass-btn px-4 py-2 text-sm"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white/90">System Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wide">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-white/50">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-sm font-mono text-white/80">
                        {user.employeeNumber || user._id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.status === "ACTIVE"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {user.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openPasswordModal(user)}
                          className="text-sm text-cyan-400 hover:text-cyan-300 underline"
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Password Reset Modal */}
        {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="glass-card w-full max-w-md p-6">
              <h3 className="text-xl font-semibold mb-4">Reset Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 text-white/70">
                    User: {selectedUser.firstName} {selectedUser.lastName}
                  </label>
                  <label className="block text-sm mb-2 text-white/70">
                    ID: {selectedUser.employeeNumber || selectedUser._id.slice(-8)}
                  </label>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-white/70">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="glass-input w-full"
                    placeholder="Enter new password"
                  />
                  <p className="text-xs text-white/50 mt-1">Minimum 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-white/70">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glass-input w-full"
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="glass-btn px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={resetPassword}
                    className="glow-btn px-4 py-2"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

