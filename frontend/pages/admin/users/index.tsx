// pages/admin/users/index.tsx
// System Admin: User & Role Management
// Uses existing backend APIs: GET /employee-profile, PATCH /employee-profile/:id
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoles, setNewRoles] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

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
      // Using existing API: GET /employee-profile with role filter
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

  function openRoleModal(user: any) {
    setSelectedUser(user);
    // Get roles from user.roles array or from role field
    const currentRoles = user.roles || (user.role ? [user.role] : []);
    setNewRoles(currentRoles);
    setShowRoleModal(true);
  }

  async function updateUserRoles() {
    if (!selectedUser || !newRoles.length) {
      alert("Please select at least one role");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      // Using existing API: PATCH /employee-profile/:id with roles array
      await api.patch(
        `/employee-profile/${selectedUser._id}`,
        {
          roles: newRoles,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("User roles updated successfully");
      setShowRoleModal(false);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update roles");
    }
  }

  const roleCounts = users.reduce((acc: any, user: any) => {
    const roles = user.roles || (user.role ? [user.role] : ["UNASSIGNED"]);
    roles.forEach((role: string) => {
      acc[role] = (acc[role] || 0) + 1;
    });
    return acc;
  }, {});

  const filteredUsers = roleFilter === "ALL"
    ? users
    : users.filter((user: any) => {
        const roles = user.roles || (user.role ? [user.role] : []);
        return roles.includes(roleFilter);
      });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-white/60">Loading system users...</div>
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
              <h1 className="text-3xl font-bold mb-2">User & Role Management</h1>
              <p className="text-white/60 text-sm">System access control and role assignment</p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="glass-btn px-4 py-2 text-sm"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Role Overview */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-white/90 border-b border-white/10 pb-2">
            Role Distribution
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(roleCounts).map(([role, count]: [string, any]) => (
              <div
                key={role}
                className="text-center cursor-pointer"
                onClick={() => setRoleFilter(roleFilter === role ? "ALL" : role)}
              >
                <div className={`text-2xl font-bold ${roleFilter === role ? "text-cyan-400" : "text-cyan-400/70"}`}>
                  {count}
                </div>
                <div className="text-xs text-white/60 mt-1">
                  {role.replace(/_/g, " ")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white/90">System Users</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setRoleFilter("ALL")}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  roleFilter === "ALL"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                All
              </button>
            </div>
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
                    System Roles
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-white/50">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const roles = user.roles || (user.role ? [user.role] : []);
                    return (
                      <tr key={user._id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4 text-sm font-mono text-white/80">
                          {user.employeeNumber || user._id.slice(-8)}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {roles.length > 0 ? (
                              roles.map((role: string) => (
                                <span
                                  key={role}
                                  className="px-2 py-1 rounded text-xs font-medium bg-white/10 text-white/80"
                                >
                                  {role}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                                UNASSIGNED
                              </span>
                            )}
                          </div>
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
                            onClick={() => openRoleModal(user)}
                            className="text-sm text-cyan-400 hover:text-cyan-300 underline"
                          >
                            Manage Roles
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="glass-card w-full max-w-md p-6">
              <h3 className="text-xl font-semibold mb-4">Assign System Roles</h3>
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
                    System Roles (select all that apply)
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {[
                      "department employee",
                      "department head",
                      "HR Employee",
                      "HR Manager",
                      "System Admin",
                      "Payroll Specialist",
                      "Payroll Manager",
                      "Legal & Policy Admin",
                      "Recruiter",
                      "Finance Staff",
                      "HR Admin",
                    ].map((role) => (
                      <label
                        key={role}
                        className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={newRoles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRoles([...newRoles, role]);
                            } else {
                              setNewRoles(newRoles.filter((r) => r !== role));
                            }
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500"
                        />
                        <span className="text-sm text-white/90">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="glass-btn px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateUserRoles}
                    className="glow-btn px-4 py-2"
                  >
                    Update Roles
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

