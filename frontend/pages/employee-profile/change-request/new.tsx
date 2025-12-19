import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../../api/axios";

export default function NewChangeRequest() {
  const router = useRouter();

  const [field, setField] = useState("");
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Load employee ID from profile
  useEffect(() => {
    async function loadMe() {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/employee-profile/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setEmployeeId(res.data._id); // save employee profile ID
      } catch (err) {
        console.error(err);
        router.push("/login");
      }
    }
    loadMe();
  }, []);

  async function submitRequest(e: any) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");

      const body = {
        employeeProfileId: employeeId,
        field,
        newValue,
        reason,
      };

      const res = await api.post("/employee-profile/change-requests", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Change Request submitted successfully 🎉");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed ❌");
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Submit Change Request</h1>

      {error && <p className="text-red-400">{error}</p>}
      {success && <p className="text-green-400">{success}</p>}

      <form onSubmit={submitRequest} className="space-y-4 mt-4">
        <div>
          <label className="block font-semibold mb-1">Field to Update</label>
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          >
            <option value="">Select field</option>
            <option value="firstName">First Name</option>
            <option value="lastName">Last Name</option>
            <option value="nationalId">National ID</option>
            <option value="primaryPositionId">Primary Position</option>
            <option value="primaryDepartmentId">Primary Department</option>
            <option value="contractType">Contract Type</option>
            <option value="workType">Work Type</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">New Value</label>
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
            rows={3}
          ></textarea>
        </div>

        <button
          type="submit"
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit Request
        </button>

        <button
          type="button"
          onClick={() => router.push("/employee-profile/change-request")}
          className="ml-4 bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
        >
          Back
        </button>
      </form>
    </div>
  );
}
