import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";

export default function CreateManagerPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nationalId: "",
    employeeNumber: "",
    password: "",
    dateOfHire: "",
    primaryDepartmentId: "",
    primaryPositionId: "",
    address: {
      street: "",
      city: "",
      country: "",
    },
  });

  /* ===============================
     LOAD DEPARTMENTS & POSITIONS
  =============================== */
  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem("token");

        const [depRes, posRes] = await Promise.all([
          api.get("/organization-structure/departments", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/organization-structure/positions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setDepartments(depRes.data || []);
        setPositions(posRes.data || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load departments or positions ❌");
      }
    }

    loadData();
  }, []);

  /* ===============================
     HELPERS
  =============================== */
  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateAddress(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  }

  /* ===============================
     SUBMIT
  =============================== */
  async function submit() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        nationalId: form.nationalId,

        employeeNumber: form.employeeNumber,
        password: form.password,
        dateOfHire: form.dateOfHire,

        // 🔥 THIS IS THE FIX 🔥
        role: "department head",

        status: "ACTIVE",
        primaryDepartmentId: form.primaryDepartmentId,
        primaryPositionId: form.primaryPositionId,

        address: form.address,
      };

      await api.post("/employee-profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Manager created successfully ✅");
      router.push("/hr/employees");

    } catch (err: any) {
      console.error(err?.response?.data || err);
      alert("Create manager failed ❌");
    } finally {
      setLoading(false);
    }
  }

  /* ===============================
     UI
  =============================== */
  return (
    <div className="max-w-3xl mx-auto mt-10 text-white">
      <button
        onClick={() => router.push("/hr/employees")}
        className="mb-4 text-blue-400 hover:underline"
      >
        ← Back 
      </button>

      <h1 className="text-4xl font-bold mb-6">Create Department Manager</h1>

      <div className="space-y-4">

        <input
          className="input"
          placeholder="First Name"
          value={form.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
        />

        <input
          className="input"
          placeholder="Last Name"
          value={form.lastName}
          onChange={(e) => updateField("lastName", e.target.value)}
        />

        <input
          className="input"
          placeholder="National ID"
          value={form.nationalId}
          onChange={(e) => updateField("nationalId", e.target.value)}
        />

        <input
          className="input"
          placeholder="Employee Number"
          value={form.employeeNumber}
          onChange={(e) => updateField("employeeNumber", e.target.value)}
        />

        <input
          type="password"
          className="input"
          placeholder="Password"
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
        />

        <input
          type="date"
          className="input"
          value={form.dateOfHire}
          onChange={(e) => updateField("dateOfHire", e.target.value)}
        />

        {/* DEPARTMENT */}
        <select
          className="input"
          value={form.primaryDepartmentId}
          onChange={(e) =>
            updateField("primaryDepartmentId", e.target.value)
          }
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* POSITION */}
        <select
          className="input"
          value={form.primaryPositionId}
          onChange={(e) =>
            updateField("primaryPositionId", e.target.value)
          }
        >
          <option value="">Select Position</option>
          {positions.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>

        {/* ADDRESS */}
        <input
          className="input"
          placeholder="Street"
          value={form.address.street}
          onChange={(e) => updateAddress("street", e.target.value)}
        />

        <input
          className="input"
          placeholder="City"
          value={form.address.city}
          onChange={(e) => updateAddress("city", e.target.value)}
        />

        <input
          className="input"
          placeholder="Country"
          value={form.address.country}
          onChange={(e) => updateAddress("country", e.target.value)}
        />

        <button
          onClick={submit}
          disabled={loading}
          className="bg-blue-600 px-6 py-3 rounded w-full hover:bg-blue-700"
        >
          {loading ? "Creating…" : "Create Manager"}
        </button>
      </div>
    </div>
  );
}
