import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";

export default function CreateEmployeePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");

  const [form, setForm] = useState<any>({
    firstName: "",
    lastName: "",
    nationalId: "",
    employeeNumber: "",
    password: "",
    phone: "",
    personalEmail: "",
    dateOfHire: "",
    role: "",
    contractType: undefined,
    workType: undefined,
    status: "ACTIVE",
    primaryDepartmentId: "",
    primaryPositionId: "",
    address: {
      street: "",
      city: "",
      country: "",
    },
  });

  // ===============================
  // LOAD DEPARTMENTS & POSITIONS
  // ===============================
  useEffect(() => {
    async function loadBaseData() {
      const token = localStorage.getItem("token");

      try {
        const [d, p] = await Promise.all([
          api.get("/organization-structure/departments", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/organization-structure/positions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setDepartments(d.data?.items || d.data || []);
        setPositions(p.data?.items || p.data || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load departments or positions ❌");
      }
    }

    loadBaseData();
  }, []);

  // ===============================
  // LOAD MANAGERS BY DEPARTMENT
  // ===============================
  async function loadManagersByDepartment(departmentId: string) {
    const token = localStorage.getItem("token");

    try {
      const res = await api.get(
        `/employee-profile/department/${departmentId}/managers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setManagers(res.data || []);
      setSelectedManagerId("");
    } catch (err) {
      console.error("Failed to load managers", err);
      setManagers([]);
      alert("Failed to load managers ❌");
    }
  }

  // ===============================
  // HELPERS
  // ===============================
  function updateField(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  }

  function updateAddress(field: string, value: string) {
    setForm((prev: any) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  }

  function cleanPayload(data: any) {
    const cleaned = JSON.parse(JSON.stringify(data));

    Object.keys(cleaned).forEach((k) => {
      if (cleaned[k] === "") cleaned[k] = undefined;

      if (
        typeof cleaned[k] === "object" &&
        cleaned[k] !== null
      ) {
        Object.keys(cleaned[k]).forEach((x) => {
          if (cleaned[k][x] === "") cleaned[k][x] = undefined;
        });
      }
    });

    return cleaned;
  }

  // ===============================
  // SUBMIT
  // ===============================
  async function submit() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const payload = cleanPayload(form);

      // 1️⃣ CREATE EMPLOYEE
      const res = await api.post("/employee-profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const employeeId = res.data._id;

      // 2️⃣ ASSIGN MANAGER (OPTIONAL)
      if (selectedManagerId) {
        await api.patch(
          "/employee-profile/assign-manager",
          {
            employeeId,
            managerId: selectedManagerId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      alert("Employee created successfully ✅");
      router.push("/hr/employees");
    } catch (e: any) {
      console.error(e?.response?.data || e);
      alert("Create employee failed ❌");
    } finally {
      setLoading(false);
    }
  }
  function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-sm mb-1 text-white/70">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20
                   focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
    </div>
  );
}

function Select({ label, children, ...props }: any) {
  return (
    <div>
      <label className="block text-sm mb-1 text-white/70">
        {label}
      </label>
      <select
        {...props}
        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20
                   focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        {children}
      </select>
    </div>
  );
}


  // ===============================
  // UI
  // ===============================
  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-12 text-white">
    <div className="max-w-5xl mx-auto">

      {/* TITLE */}
      <h1 className="text-4xl font-semibold mb-10">
        Create Employee
      </h1>

      {/* GLASS CARD */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-[0_0_40px_rgba(56,189,248,0.08)] space-y-10">

        {/* BASIC INFO */}
        <section>
          <h2 className="text-xl mb-6 text-blue-300">
            Basic Information
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Input label="First Name" value={form.firstName}
              onChange={(e:any) => updateField("firstName", e.target.value)} />

            <Input label="Last Name" value={form.lastName}
              onChange={(e:any) => updateField("lastName", e.target.value)} />

            <Input label="National ID" value={form.nationalId}
              onChange={(e:any) => updateField("nationalId", e.target.value)} />
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <Input label="Employee Number" value={form.employeeNumber}
              onChange={(e:any) => updateField("employeeNumber", e.target.value)} />

            <Input label="Password" type="password" value={form.password}
              onChange={(e:any) => updateField("password", e.target.value)} />

            <Input label="Phone" value={form.phone}
              onChange={(e:any) => updateField("phone", e.target.value)} />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <Input label="Personal Email" value={form.personalEmail}
              onChange={(e:any) => updateField("personalEmail", e.target.value)} />

            <Input label="Date of Hire" type="date" value={form.dateOfHire}
              onChange={(e:any) => updateField("dateOfHire", e.target.value)} />
          </div>
        </section>

        {/* ROLE & STRUCTURE */}
        <section>
          <h2 className="text-xl mb-6 text-blue-300">
            Role & Organization
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Select label="System Role" value={form.role}
              onChange={(e:any) => updateField("role", e.target.value)}>
              <option value="">Select Role</option>
              <option value="DEPARTMENT_EMPLOYEE">Department Employee</option>
              <option value="DEPARTMENT_HEAD">Department Head</option>
              <option value="HR_EMPLOYEE">HR Employee</option>
              <option value="HR_MANAGER">HR Manager</option>
              <option value="SYSTEM_ADMIN">System Admin</option>
            </Select>

            <Select label="Department" value={form.primaryDepartmentId}
              onChange={(e:any) => {
                updateField("primaryDepartmentId", e.target.value);
                e.target.value
                  ? loadManagersByDepartment(e.target.value)
                  : setManagers([]);
              }}>
              <option value="">Select Department</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </Select>

            <Select label="Position" value={form.primaryPositionId}
              onChange={(e:any) => updateField("primaryPositionId", e.target.value)}>
              <option value="">Select Position</option>
              {positions.map(p => (
                <option key={p._id} value={p._id}>
                  {p.title || p.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-6">
            <Select label="Manager (Optional)" value={selectedManagerId}
              onChange={(e:any) => setSelectedManagerId(e.target.value)}>
              <option value="">Assign Manager</option>
              {managers.map(m => (
                <option key={m._id} value={m._id}>
                  {m.firstName} {m.lastName} ({m.employeeNumber})
                </option>
              ))}
            </Select>
          </div>
        </section>

        {/* ADDRESS */}
        <section>
          <h2 className="text-xl mb-6 text-blue-300">
            Address
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Input label="Street" value={form.address.street}
              onChange={(e:any) => updateAddress("street", e.target.value)} />

            <Input label="City" value={form.address.city}
              onChange={(e:any) => updateAddress("city", e.target.value)} />

            <Input label="Country" value={form.address.country}
              onChange={(e:any) => updateAddress("country", e.target.value)} />
          </div>
        </section>

        {/* ACTIONS */}
        <div className="pt-8 border-t border-white/10 flex justify-between items-center">
          <button
            onClick={() => router.push("/hr/employees")}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            Back
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="px-10 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 transition"
          >
            {loading ? "Creating…" : "Create Employee"}
          </button>
        </div>

      </div>
    </div>
  </div>
);
}

// ===============================