import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../api/axios";

export default function Dashboard() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Dashboard widget data
  const [profile, setProfile] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [lastAppraisal, setLastAppraisal] = useState<any>(null);
  const [widgetsLoading, setWidgetsLoading] = useState(true);

  // System Admin dashboard data
  const [adminData, setAdminData] = useState({
    totalUsers: 0,
    activeDepartments: 0,
    activePositions: 0,
    systemStatus: "Operational",
    users: [] as any[],
    departments: [] as any[],
    positions: [] as any[],
    loading: true,
    error: null as string | null,
  });

  // Role assignment modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRoles, setNewRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  // Department management state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptMode, setDeptMode] = useState<"create" | "edit">("create");
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [deptCode, setDeptCode] = useState("");
  const [deptName, setDeptName] = useState("");
  const [deptDescription, setDeptDescription] = useState("");
  const [savingDept, setSavingDept] = useState(false);

  // Position management state
  const [showPosModal, setShowPosModal] = useState(false);
  const [posMode, setPosMode] = useState<"create" | "edit">("create");
  const [selectedPos, setSelectedPos] = useState<any>(null);
  const [posCode, setPosCode] = useState("");
  const [posTitle, setPosTitle] = useState("");
  const [posDepartmentId, setPosDepartmentId] = useState("");
  const [posDescription, setPosDescription] = useState("");
  const [savingPos, setSavingPos] = useState(false);

  // Access Control collapse state
  const [accessControlExpanded, setAccessControlExpanded] = useState(false);
  const [accessControlSearch, setAccessControlSearch] = useState("");
  const [accessControlDisplayCount, setAccessControlDisplayCount] = useState(10);

  // HR Employee Management state
  const [updatingEmployee, setUpdatingEmployee] = useState<string | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // HR Change Request Management state
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // HR Manager collapsible sections state
  const [hrSections, setHrSections] = useState({
    employees: false,
    changeRequests: false,
    disputes: false,
    organization: false,
    performance: false,
  });

  // Change Requests status filter
  const [changeRequestFilter, setChangeRequestFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");

  // Performance Appraisals section state
  const [performanceExpanded, setPerformanceExpanded] = useState(false);
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [cyclesLoaded, setCyclesLoaded] = useState(false);

  // HR Manager dashboard data
  const [hrData, setHrData] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingRequests: 0,
    disputes: 0,
    totalDepartments: 0,
    totalPositions: 0,
    cycles: [] as any[],
    employees: [] as any[],
    changeRequests: [] as any[],
    departments: [] as any[],
    positions: [] as any[],
    appraisalDisputes: [] as any[], // Appraisal disputes from /performance/disputes
    loading: true,
    error: null as string | null,
  });

  // Disputes UI state
  const [disputeFilter, setDisputeFilter] = useState<"OPEN" | "ADJUSTED">("OPEN");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [resolvingDispute, setResolvingDispute] = useState(false);

  // Manager dashboard state
  const [managerData, setManagerData] = useState({
    activeCycles: [] as any[],
    teamAppraisals: [] as any[],
    loading: true,
    error: null as string | null,
  });


  // Employee Dashboard State
  const [employeeProfile, setEmployeeProfile] = useState<any>(null);
  const [employeeAppraisals, setEmployeeAppraisals] = useState<any[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [profileEditData, setProfileEditData] = useState({
    phone: "",
    personalEmail: "",
    workEmail: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  
  // Change Request Modal State
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [changeRequestField, setChangeRequestField] = useState<"primaryDepartmentId" | "primaryPositionId" | "other" | "">("");
  const [changeRequestOtherField, setChangeRequestOtherField] = useState("");
  const [changeRequestNewValue, setChangeRequestNewValue] = useState("");
  const [changeRequestReason, setChangeRequestReason] = useState("");
  const [changeRequestDetails, setChangeRequestDetails] = useState("");
  const [submittingChangeRequest, setSubmittingChangeRequest] = useState(false);
  const [changeRequestError, setChangeRequestError] = useState<string | null>(null);
  const [changeRequestSuccess, setChangeRequestSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("username");
    const savedRole = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
      return;
    }

    const normalizedRole = (savedRole || "")
      .toUpperCase()
      .replaceAll(" ", "_");

    setUsername(savedUser || "Unknown User");
    setRole(normalizedRole);
    setLoading(false);

    // Load dashboard widgets
    if (normalizedRole === "SYSTEM_ADMIN") {
      loadAdminDashboardData(token);
    } else if (normalizedRole === "HR_MANAGER") {
      loadHRManagerData(token);
    } else if (normalizedRole === "DEPARTMENT_HEAD") {
      loadManagerDashboardData(token);
    } else if (normalizedRole === "DEPARTMENT_EMPLOYEE") {
      loadEmployeeDashboardData(token);
    } else {
      setWidgetsLoading(false);
    }
  }, [router]);

  async function loadDashboardWidgets(token: string) {
    try {
      const [profileRes, requestsRes, appraisalsRes] = await Promise.allSettled([
        api.get("/employee-profile/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/employee-profile/change-requests/my", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/performance/my-appraisals", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value.data);
      }

      if (requestsRes.status === "fulfilled") {
        const requests = requestsRes.value.data || [];
        const pending = requests.filter((r: any) => r.status === "PENDING").length;
        setPendingRequests(pending);
      }

      if (appraisalsRes.status === "fulfilled") {
        const appraisals = appraisalsRes.value.data || [];
        if (Array.isArray(appraisals) && appraisals.length > 0) {
          // Get most recent published appraisal
          const published = appraisals
            .filter((a: any) => a.status === "HR_PUBLISHED")
            .sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt || a.submittedAt || 0);
              const dateB = new Date(b.createdAt || b.submittedAt || 0);
              return dateB.getTime() - dateA.getTime();
            });
          if (published.length > 0) {
            setLastAppraisal(published[0]);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard widgets:", error);
    } finally {
      setWidgetsLoading(false);
    }
  }

  async function loadAdminDashboardData(token: string) {
    try {
      setAdminData(prev => ({ ...prev, loading: true, error: null }));
      
      const [usersRes, deptRes, posRes] = await Promise.allSettled([
        api.get("/employee-profile", {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 },
        }),
        api.get("/organization-structure/departments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/organization-structure/positions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let users: any[] = [];
      let departments: any[] = [];
      let positions: any[] = [];

      if (usersRes.status === "fulfilled") {
        const userList = usersRes.value.data?.items || usersRes.value.data?.data || usersRes.value.data || [];
        users = Array.isArray(userList) ? userList : [];
        
        // Fetch roles for all users to ensure we have the full roles array
        // Backend returns 'role' (single) but we need 'roles' (array) for display
        try {
          const userIds = users.map((u: any) => u._id);
          // For each user, try to get their full role data
          // Since backend returns role as single value, we'll convert it to array format
          users = users.map((user: any) => {
            // If user has roles array, use it; otherwise convert role to array
            if (user.roles && Array.isArray(user.roles)) {
              return user;
            } else if (user.role) {
              return { ...user, roles: [user.role] };
            } else {
              return { ...user, roles: [] };
            }
          });
        } catch (roleError) {
          console.warn("Could not fetch roles, using default:", roleError);
        }
      }

      if (deptRes.status === "fulfilled") {
        departments = Array.isArray(deptRes.value.data) ? deptRes.value.data : [];
      }

      if (posRes.status === "fulfilled") {
        positions = Array.isArray(posRes.value.data) ? posRes.value.data : [];
      }

      const activeDepartments = departments.filter((d: any) => d.isActive !== false).length;
      const activePositions = positions.filter((p: any) => p.isActive !== false).length;

      setAdminData({
        totalUsers: users.length,
        activeDepartments,
        activePositions,
        systemStatus: "Operational",
        users,
        departments,
        positions,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Failed to load admin dashboard data:", error);
      setAdminData(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || "Failed to load data",
      }));
    }
  }

  async function loadHRManagerData(token: string) {
    try {
      setHrData(prev => ({ ...prev, loading: true, error: null }));
      
      const [employeesRes, requestsRes, deptRes, posRes, disputesRes] = await Promise.allSettled([
        api.get("/employee-profile", {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: 1, limit: 200 },
        }),
        api.get("/employee-profile/change-requests/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/organization-structure/departments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/organization-structure/positions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/performance/disputes", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let employees: any[] = [];
      let changeRequests: any[] = [];
      let departments: any[] = [];
      let positions: any[] = [];
      let appraisalDisputes: any[] = [];

      if (employeesRes.status === "fulfilled") {
        const empList = employeesRes.value.data?.items || employeesRes.value.data?.data || employeesRes.value.data || [];
        employees = Array.isArray(empList) ? empList : [];
      }

      if (requestsRes.status === "fulfilled") {
        changeRequests = Array.isArray(requestsRes.value.data) ? requestsRes.value.data : [];
      }

      if (deptRes.status === "fulfilled") {
        departments = Array.isArray(deptRes.value.data) ? deptRes.value.data : [];
      }

      if (posRes.status === "fulfilled") {
        positions = Array.isArray(posRes.value.data) ? posRes.value.data : [];
      }

      if (disputesRes.status === "fulfilled") {
        appraisalDisputes = Array.isArray(disputesRes.value.data) ? disputesRes.value.data : [];
      }

      const activeEmployees = employees.filter((e: any) => e.status === "ACTIVE").length;
      const pendingRequests = changeRequests.filter((r: any) => r.status === "PENDING" && !r.requestDescription?.startsWith("disputeFor:")).length;
      const disputes = appraisalDisputes.filter((d: any) => d.status === "OPEN").length;

      setHrData({
        totalEmployees: employees.length,
        activeEmployees,
        pendingRequests,
        disputes,
        totalDepartments: departments.length,
        totalPositions: positions.length,
        cycles: [], // Cycles loaded separately when section expands
        employees,
        changeRequests,
        departments,
        positions,
        appraisalDisputes,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Failed to load HR Manager dashboard data:", error);
      setHrData(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || "Failed to load data",
      }));
    }
  }

  async function loadManagerDashboardData(token: string) {
    try {
      setManagerData(prev => ({ ...prev, loading: true, error: null }));
      
      const [cyclesRes, appraisalsRes] = await Promise.allSettled([
        api.get("/performance/cycles", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/performance/my-appraisals", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let cycles: any[] = [];
      let appraisals: any[] = [];

      if (cyclesRes.status === "fulfilled") {
        const cyclesList = Array.isArray(cyclesRes.value.data) 
          ? cyclesRes.value.data 
          : cyclesRes.value.data?.items || cyclesRes.value.data?.data || [];
        // Filter out ARCHIVED cycles
        cycles = cyclesList.filter((c: any) => c.status !== "ARCHIVED");
      }

      if (appraisalsRes.status === "fulfilled") {
        appraisals = Array.isArray(appraisalsRes.value.data) ? appraisalsRes.value.data : [];
      }

      setManagerData({
        activeCycles: cycles,
        teamAppraisals: appraisals,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Failed to load Manager dashboard data:", error);
      setManagerData(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || "Failed to load data",
      }));
    }
  }


  async function saveProfileChanges() {
    try {
      setSavingProfile(true);
      setProfileSaveError(null);
      setProfileSaveSuccess(false);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Build payload with ONLY allowed fields: phone, personalEmail, workEmail
      // DO NOT include: department, position, status, primaryDepartmentId, primaryPositionId, etc.
      const updateData: any = {};
      
      // Only include phone if it has a value
      if (profileEditData.phone && profileEditData.phone.trim()) {
        updateData.phone = profileEditData.phone.trim();
      }
      
      // Handle email fields - prioritize personalEmail, then workEmail
      if (profileEditData.personalEmail && profileEditData.personalEmail.trim()) {
        updateData.personalEmail = profileEditData.personalEmail.trim();
      }
      if (profileEditData.workEmail && profileEditData.workEmail.trim()) {
        updateData.workEmail = profileEditData.workEmail.trim();
      }

      // Ensure we're not sending any forbidden fields
      // Explicitly exclude: department, position, status, primaryDepartmentId, primaryPositionId
      const forbiddenFields = [
        'department', 'position', 'status', 'primaryDepartmentId', 
        'primaryPositionId', 'employeeNumber', 'firstName', 'lastName',
        'roles', 'systemRole', 'accessProfileId'
      ];
      forbiddenFields.forEach(field => {
        if (updateData[field] !== undefined) {
          delete updateData[field];
        }
      });

      await api.patch("/employee-profile/self-update", updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfileSaveSuccess(true);
      // Reload profile
      const profileRes = await api.get("/employee-profile/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(profileRes.data);
      // Update edit data with fresh profile data
      setProfileEditData({
        phone: profileRes.data.phone || profileRes.data.phoneNumber || "",
        personalEmail: profileRes.data.personalEmail || "",
        workEmail: profileRes.data.workEmail || "",
      });
      // Reset success message after 3 seconds
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (error: any) {
      // Handle forbidden/unauthorized errors with friendly message
      const status = error.response?.status;
      if (status === 403 || status === 401) {
        setProfileSaveError("Some fields are managed by HR. You can request a profile change instead.");
      } else {
        // For other errors, show generic friendly message (don't expose raw backend errors)
        setProfileSaveError("Failed to update profile. Please try again or request a profile change.");
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitChangeRequest() {
    if (!changeRequestField || !changeRequestNewValue.trim() || !changeRequestReason.trim()) {
      setChangeRequestError("All fields are required");
      return;
    }

    try {
      setSubmittingChangeRequest(true);
      setChangeRequestError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Get employee profile ID
      const profileRes = await api.get("/employee-profile/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const employeeProfileId = profileRes.data._id;

      const body = {
        employeeProfileId,
        field: changeRequestField,
        newValue: changeRequestNewValue.trim(),
        reason: changeRequestReason.trim(),
      };

      await api.post("/employee-profile/change-requests", body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Success - close modal and show banner
      setShowChangeRequestModal(false);
      setChangeRequestSuccess(true);
      
      // Reset form
      setChangeRequestField("");
      setChangeRequestNewValue("");
      setChangeRequestReason("");
      
      // Hide success banner after 5 seconds
      setTimeout(() => setChangeRequestSuccess(false), 5000);
    } catch (error: any) {
      setChangeRequestError(error.response?.data?.message || "Failed to submit change request");
    } finally {
      setSubmittingChangeRequest(false);
    }
  }

  // ===============================
  // LOAD EMPLOYEE DASHBOARD DATA
  // ===============================
  async function loadEmployeeDashboardData(token: string) {
    try {
      setEmployeeLoading(true);
      setEmployeeError(null);

      const [profileRes, appraisalsRes] = await Promise.allSettled([
        api.get("/employee-profile/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/performance/my-appraisals", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Load profile
      if (profileRes.status === "fulfilled") {
        const profileData = profileRes.value.data;
        setEmployeeProfile(profileData);
        setProfileEditData({
          phone: profileData.phone || profileData.phoneNumber || "",
          personalEmail: profileData.personalEmail || "",
          workEmail: profileData.workEmail || "",
        });
      }

      // Load appraisals - FILTER TO PUBLISHED ONLY
      let appraisals: any[] = [];
      if (appraisalsRes.status === "fulfilled") {
        const appraisalsList = Array.isArray(appraisalsRes.value.data)
          ? appraisalsRes.value.data
          : appraisalsRes.value.data?.items || appraisalsRes.value.data?.data || [];
        // Only show PUBLISHED appraisals (hide DRAFT, manager-submitted, archived)
        appraisals = appraisalsList.filter(
          (a: any) => a.status === "HR_PUBLISHED" || a.status === "PUBLISHED"
        );
      }

      setEmployeeAppraisals(appraisals);
    } catch (error: any) {
      console.error("Failed to load Employee dashboard data:", error);
      // Filter out permission-related error messages
      const errorMessage = error.response?.data?.message || "";
      const isPermissionError = error.response?.status === 403 || 
                                error.response?.status === 401 ||
                                errorMessage.toLowerCase().includes("permission") ||
                                errorMessage.toLowerCase().includes("not have permission");
      
      // Show generic error message instead of permission errors
      if (isPermissionError) {
        setEmployeeError("Unable to load profile data. Please refresh the page or contact support.");
      } else {
        setEmployeeError(errorMessage || "Failed to load data");
      }
    } finally {
      setEmployeeLoading(false);
    }
  }

  // ===============================
  // SAVE PROFILE CHANGES
  // ===============================
  async function saveEmployeeProfileChanges() {
    try {
      setSavingProfile(true);
      setProfileSaveError(null);
      setProfileSaveSuccess(false);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Build payload with ONLY editable fields: phone, personalEmail, workEmail
      const updateData: any = {};
      
      // Add phone if provided
      if (profileEditData.phone && profileEditData.phone.trim()) {
        updateData.phone = profileEditData.phone.trim();
      }
      
      // Add email - prefer personalEmail, fallback to workEmail
      if (profileEditData.personalEmail && profileEditData.personalEmail.trim()) {
        updateData.personalEmail = profileEditData.personalEmail.trim();
      } else if (profileEditData.workEmail && profileEditData.workEmail.trim()) {
        updateData.workEmail = profileEditData.workEmail.trim();
      }

      // Only send if there's at least one field to update
      if (Object.keys(updateData).length === 0) {
        setProfileSaveError("Please enter at least one field (email or phone) to update");
        return;
      }

      await api.patch("/employee-profile/self-update", updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Success toast
      setProfileSaveSuccess(true);
      // Reload profile
      await loadEmployeeDashboardData(token);
      // Reset success message after 3 seconds
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (error: any) {
      // Filter out permission-related error messages
      const errorMessage = error.response?.data?.message || "";
      const isPermissionError = error.response?.status === 403 || 
                                error.response?.status === 401 ||
                                errorMessage.toLowerCase().includes("permission") ||
                                errorMessage.toLowerCase().includes("not have permission");
      
      // Show generic error message instead of permission errors
      if (isPermissionError) {
        setProfileSaveError("Unable to update profile. Please contact HR if you need to change your information.");
      } else {
        setProfileSaveError(errorMessage || "Failed to update profile. Please try again.");
      }
      // Auto-hide error after 5 seconds
      setTimeout(() => setProfileSaveError(null), 5000);
    } finally {
      setSavingProfile(false);
    }
  }

  async function loadPerformanceCycles() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setCyclesLoading(true);
      const cyclesRes = await api.get("/performance/cycles", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const cycles = Array.isArray(cyclesRes.data) 
        ? cyclesRes.data 
        : cyclesRes.data?.items || cyclesRes.data?.data || [];

      setHrData(prev => ({
        ...prev,
        cycles: Array.isArray(cycles) ? cycles : [],
      }));
      setCyclesLoaded(true);
    } catch (error: any) {
      console.error("Failed to load performance cycles:", error);
      setHrData(prev => ({
        ...prev,
        cycles: [],
      }));
      setCyclesLoaded(true); // Mark as loaded even on error to prevent infinite retries
    } finally {
      setCyclesLoading(false);
    }
  }

  // Effect to fetch cycles when section expands
  useEffect(() => {
    // Guard: only fetch if expanded AND not already loaded
    if (!performanceExpanded || cyclesLoaded) return;

    // Fetch cycles only when section is expanded for the first time
    loadPerformanceCycles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performanceExpanded, cyclesLoaded]);

  // HR Change Request helper functions
  function isDisputeRequest(req: any): boolean {
    return req.requestDescription?.startsWith("disputeFor:");
  }

  function getRequestField(req: any): string {
    if (req.field) return req.field;
    if (req.requestDescription?.startsWith("{")) {
      try {
        return JSON.parse(req.requestDescription).field || "—";
      } catch {
        return "—";
      }
    }
    if (isDisputeRequest(req)) {
      const originalId = req.requestDescription.replace("disputeFor:", "").trim();
      const original = hrData.changeRequests.find(
        (r: any) => r._id === originalId || r.requestId === originalId
      );
      if (original) return getRequestField(original);
    }
    return "—";
  }

  function getRequestNewValue(req: any): string {
    if (req.newValue) return req.newValue;
    if (req.requestDescription?.startsWith("{")) {
      try {
        return JSON.parse(req.requestDescription).newValue || "—";
      } catch {
        return "—";
      }
    }
    if (isDisputeRequest(req)) {
      const originalId = req.requestDescription.replace("disputeFor:", "").trim();
      const original = hrData.changeRequests.find(
        (r: any) => r._id === originalId || r.requestId === originalId
      );
      if (original) return getRequestNewValue(original);
    }
    return "—";
  }

  // HR Change Request action functions
  async function approveChangeRequest(requestId: string) {
    try {
      setProcessingRequest(requestId);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required");
        return;
      }

      await api.patch(
        `/employee-profile/change-requests/${requestId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await loadHRManagerData(token);
      alert("Request approved successfully ✅");
    } catch (error: any) {
      console.error("Failed to approve request:", error);
      alert(error.response?.data?.message || "Failed to approve request ❌");
    } finally {
      setProcessingRequest(null);
    }
  }

  async function rejectChangeRequest(requestId: string) {
    const reason = prompt("Rejection reason:");
    if (!reason || !reason.trim()) return;

    try {
      setProcessingRequest(requestId);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required");
        return;
      }

      await api.patch(
        `/employee-profile/change-requests/${requestId}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await loadHRManagerData(token);
      alert("Request rejected successfully ✅");
    } catch (error: any) {
      console.error("Failed to reject request:", error);
      alert(error.response?.data?.message || "Failed to reject request ❌");
    } finally {
      setProcessingRequest(null);
    }
  }

  async function resolveAppraisalDispute(disputeId: string) {
  if (!resolutionSummary.trim()) {
    alert("Resolution summary is required");
    return;
  }

  try {
    setResolvingDispute(true);

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    await api.patch(
      `/performance/disputes/${disputeId}/resolve`,
      {
        newStatus: "ADJUSTED",                // ✅ MUST match enum
        resolutionSummary: resolutionSummary.trim(),
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // ✅ UI cleanup
    setShowResolveModal(false);
    setSelectedDispute(null);
    setResolutionSummary("");

    alert("Dispute resolved successfully ✅");

    // ✅ Reload dashboard data safely (THIS caused the 404 before)
    try {
      await loadHRManagerData(token);
    } catch (e) {
      console.warn("Reload failed but dispute resolved:", e);
    }
  } catch (error: any) {
    console.error("Failed to resolve dispute:", error);
    alert(error.response?.data?.message || "Failed to resolve dispute ❌");
  } finally {
    setResolvingDispute(false);
  }
}


  // HR Employee Management functions
  async function activateEmployee(employeeId: string) {
    if (!confirm("Activate this employee?")) return;

    try {
      setUpdatingEmployee(employeeId);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required");
        return;
      }

      await api.patch(
        `/employee-profile/${employeeId}`,
        { status: "ACTIVE" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Reload HR data
      await loadHRManagerData(token);
      alert("Employee activated successfully ✅");
    } catch (error: any) {
      console.error("Failed to activate employee:", error);
      alert(error.response?.data?.message || "Failed to activate employee ❌");
    } finally {
      setUpdatingEmployee(null);
    }
  }

  async function deactivateEmployee(employeeId: string) {
    if (!confirm("Deactivate this employee? This action cannot be undone easily.")) return;

    try {
      setUpdatingEmployee(employeeId);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required");
        return;
      }

      await api.delete(`/employee-profile/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Reload HR data
      await loadHRManagerData(token);
      alert("Employee deactivated successfully ✅");
    } catch (error: any) {
      console.error("Failed to deactivate employee:", error);
      alert(error.response?.data?.message || "Failed to deactivate employee ❌");
    } finally {
      setUpdatingEmployee(null);
    }
  }

  // Role assignment functions - SYSTEM ADMIN ONLY
  function openRoleModal(user: any) {
    // Additional safeguard: Only allow if role is SYSTEM_ADMIN
    if (role !== "SYSTEM_ADMIN") {
      console.warn("Role assignment is only available to SYSTEM_ADMIN");
      return;
    }
    setSelectedUser(user);
    const currentRoles = user.roles || (user.role ? [user.role] : []);
    setNewRoles([...currentRoles]);
    setShowRoleModal(true);
  }

  async function saveUserRoles() {
    if (!selectedUser || !newRoles.length) {
      alert("Please select at least one role");
      return;
    }

    try {
      setSavingRoles(true);
      const token = localStorage.getItem("token");
      
      // Update roles via the employee profile endpoint
      await api.patch(
        `/employee-profile/${selectedUser._id}`,
        { roles: newRoles },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update only the local state for the affected user
      setAdminData(prev => ({
        ...prev,
        users: prev.users.map((user: any) => 
          user._id === selectedUser._id 
            ? { 
                ...user, 
                roles: newRoles,
                role: newRoles[0] || user.role
              }
            : user
        )
      }));
      
      // Show success message
      alert("Roles updated successfully ✅");
      
      // Close modal
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRoles([]);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update roles ❌");
    } finally {
      setSavingRoles(false);
    }
  }

  // Department management functions
  function openDeptModal(mode: "create" | "edit", dept?: any) {
    setDeptMode(mode);
    if (mode === "edit" && dept) {
      setSelectedDept(dept);
      setDeptCode(dept.code || "");
      setDeptName(dept.name || "");
      setDeptDescription(dept.description || "");
    } else {
      setSelectedDept(null);
      setDeptCode("");
      setDeptName("");
      setDeptDescription("");
    }
    setShowDeptModal(true);
  }

  async function saveDepartment() {
    if (!deptCode || !deptName) {
      alert("Code and name are required");
      return;
    }

    try {
      setSavingDept(true);
      const token = localStorage.getItem("token");
      if (deptMode === "create") {
        await api.post(
          "/organization-structure/departments",
          { code: deptCode, name: deptName, description: deptDescription || undefined },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Department created successfully ✅");
      } else {
        await api.patch(
          `/organization-structure/departments/${selectedDept._id}`,
          { code: deptCode, name: deptName, description: deptDescription || undefined },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Department updated successfully ✅");
      }
      setShowDeptModal(false);
      loadAdminDashboardData(token!);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to save department ❌");
    } finally {
      setSavingDept(false);
    }
  }

  async function toggleDepartmentStatus(dept: any) {
    if (!confirm(`Are you sure you want to ${dept.isActive !== false ? "deactivate" : "activate"} ${dept.name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (dept.isActive !== false) {
        await api.patch(
          `/organization-structure/departments/deactivate/${dept._id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await api.patch(
          `/organization-structure/departments/activate/${dept._id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      loadAdminDashboardData(token!);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update department ❌");
    }
  }

  // Position management functions
  function openPosModal(mode: "create" | "edit", pos?: any) {
    setPosMode(mode);
    if (mode === "edit" && pos) {
      setSelectedPos(pos);
      setPosCode(pos.code || "");
      setPosTitle(pos.title || pos.name || "");
      setPosDepartmentId(pos.departmentId?._id || pos.departmentId || "");
      setPosDescription(pos.description || "");
    } else {
      setSelectedPos(null);
      setPosCode("");
      setPosTitle("");
      setPosDepartmentId("");
      setPosDescription("");
    }
    setShowPosModal(true);
  }

  async function savePosition() {
    if (!posCode || !posTitle || !posDepartmentId) {
      alert("Code, title, and department are required");
      return;
    }

    try {
      setSavingPos(true);
      const token = localStorage.getItem("token");
      if (posMode === "create") {
        await api.post(
          "/organization-structure/positions",
          { code: posCode, title: posTitle, departmentId: posDepartmentId, description: posDescription || undefined },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Position created successfully ✅");
      } else {
        await api.patch(
          `/organization-structure/positions/${selectedPos._id}`,
          { code: posCode, title: posTitle, departmentId: posDepartmentId, description: posDescription || undefined },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Position updated successfully ✅");
      }
      setShowPosModal(false);
      loadAdminDashboardData(token!);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to save position ❌");
    } finally {
      setSavingPos(false);
    }
  }

  async function togglePositionStatus(pos: any) {
    if (!confirm(`Are you sure you want to ${pos.isActive !== false ? "deactivate" : "activate"} ${pos.title || pos.name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (pos.isActive !== false) {
        await api.patch(
          `/organization-structure/positions/${pos._id}/deactivate`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await api.patch(
          `/organization-structure/positions/activate/${pos._id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      loadAdminDashboardData(token!);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update position ❌");
    }
  }

  function goBackToModules() {
  router.push("/");
}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8 text-white bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* ================= HEADER ================= */}
        {role !== "SYSTEM_ADMIN" && (
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-white">
              HR System Dashboard
        </h1>
            <div className="flex items-center gap-4 text-white/70">
              <span>Welcome, {username}</span>
              <span className="text-white/40">•</span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-sm font-medium">
                {role.replace(/_/g, " ")}
              </span>
      </div>
      </div>
        )}

      {/* ================= DASHBOARD CONTENT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===== DEPARTMENT EMPLOYEE ===== */}
        {role === "DEPARTMENT_EMPLOYEE" && (
          <div className="lg:col-span-3 max-w-[1200px] mx-auto relative z-10 px-4 sm:px-6">
            {/* Header */}
            <div className="mb-8 sm:mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
                Employee Dashboard
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-white/90 text-base sm:text-lg font-medium">
                  Welcome, {employeeProfile?.firstName && employeeProfile?.lastName
                    ? `${employeeProfile.firstName} ${employeeProfile.lastName}`.trim()
                    : username}
                </p>
                <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-semibold uppercase tracking-wider shadow-lg shadow-cyan-500/10">
                  EMPLOYEE
                </span>
              </div>
            </div>

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* LEFT: My Profile Card */}
              <div 
                className="glass-card p-6 sm:p-8"
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-400/30">
                    <span className="text-xl">👤</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">My Profile</h2>
                </div>
                
                {employeeLoading ? (
                  <div className="space-y-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-3 bg-white/10 rounded-full mb-2.5 w-1/4"></div>
                        <div className="h-10 bg-white/5 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : employeeError ? (
                  <div className="bg-red-500/15 text-red-200 border border-red-500/30 rounded-xl p-4 text-sm backdrop-blur-sm">
                    ⚠️ {employeeError}
                  </div>
                ) : employeeProfile ? (
                  <div className="space-y-5">
                    {/* Success Message */}
                    {profileSaveSuccess && (
                      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-200 border border-green-400/30 rounded-xl px-4 py-3 text-sm backdrop-blur-sm shadow-lg shadow-green-500/10">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">✓</span>
                          <span className="font-medium">Profile updated successfully</span>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {profileSaveError && (
                      <div className="bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-200 border border-red-400/30 rounded-xl px-4 py-3 text-sm backdrop-blur-sm shadow-lg shadow-red-500/10">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⚠️</span>
                          <span className="font-medium">{profileSaveError}</span>
                        </div>
                      </div>
                    )}

                    

                    

                    

                    
                    

                    
                    <button
  onClick={() => router.push("employee-profile/change-request")}
  className="glass-btn w-full text-sm py-3 font-medium rounded-xl hover:bg-white/10 transition-all duration-200"
>
  Request Profile Change
</button>
<button
  onClick={() => router.push("employee-profile/update")}
  className="glass-btn w-full text-sm py-3 font-medium rounded-xl hover:bg-white/10 transition-all duration-200"
>
  update Profile Information
</button>
<button
  onClick={() => router.push("employee-profile")}
  className="glass-btn w-full text-sm py-3 font-medium rounded-xl hover:bg-white/10 transition-all duration-200"
>
  view my Profile Information
</button>



                    </div>
                 
                ) : (
                  <div className="text-center py-6 text-white/60 text-sm">
                    Profile information not available
                  </div>
                )}
              </div>

              {/* RIGHT: My Performance Appraisals Card */}
              <div 
                className="glass-card p-6 sm:p-8"
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-400/30">
                    <span className="text-xl">📊</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">My Performance Appraisals</h2>
                </div>
                
                {employeeLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-white/10 rounded-full mb-2 w-2/3"></div>
                        <div className="h-20 bg-white/5 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : employeeError ? (
                  <div className="bg-red-500/15 text-red-200 border border-red-500/30 rounded-xl p-4 text-sm backdrop-blur-sm">
                    ⚠️ {employeeError}
                  </div>
                ) : employeeAppraisals.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <span className="text-3xl opacity-50">📋</span>
                    </div>
                    <div className="text-white/70 text-base font-medium mb-2">No published appraisals yet</div>
                    <div className="text-white/50 text-sm">Your appraisals will appear here once published by HR</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {employeeAppraisals.map((appraisal: any) => {
                      const cycle = typeof appraisal.cycleId === "object" ? appraisal.cycleId : null;
                      const cycleName = cycle?.name || (cycle?._id ? `Cycle: ${String(cycle._id).slice(-8)}` : "Cycle: —");
                      const publishedDate = appraisal.publishedAt || appraisal.updatedAt || appraisal.createdAt;
                      
                      return (
                        <div 
                          key={appraisal._id} 
                          className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
                          style={{
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="text-base font-semibold text-white mb-1.5">{cycleName}</div>
                              {publishedDate && (
                                <div className="text-xs text-white/50 flex items-center gap-1.5">
                                  <span>📅</span>
                                  <span>Published: {new Date(publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>
                              )}
                            </div>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/30 shadow-lg shadow-green-500/20">
                              PUBLISHED
                            </span>
                          </div>
                          <button
                            onClick={() => router.push(`/performance/my-appraisals/${appraisal._id}`)}
                            className="cyan-glow-btn w-full text-sm px-4 py-2.5 mt-3 rounded-xl font-semibold transition-all duration-200"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <span>View Appraisal</span>
                              <span>→</span>
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Change Request Success Banner */}
            {changeRequestSuccess && (
              <div className="mt-6 bg-blue-500/15 text-blue-200 border border-blue-500/25 rounded-lg px-4 py-2.5 text-sm">
                ℹ️ Your request was sent to HR for review.
              </div>
            )}

            {/* Change Request Modal */}
            {showChangeRequestModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div 
                  className="p-6 rounded-[20px] max-w-md w-full"
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <h2 className="text-lg font-semibold text-white mb-4">Request Profile Change</h2>
                  
                  {changeRequestError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                      ⚠️ {changeRequestError}
                    </div>
                  )}

    <div className="space-y-4">
                    {/* Field to Change */}
                    <div>
                      <label className="block mb-2 text-sm text-white/90">
                        Select field to change <span className="text-red-400">*</span>
                      </label>
                      <select
                        className="glass-input w-full text-sm"
                        value={changeRequestField}
                        onChange={(e) => {
                          setChangeRequestField(e.target.value as any);
                          setChangeRequestError(null);
                        }}
                      >
                        <option value="">Select field...</option>
                        <option value="primaryDepartmentId">Department</option>
                        <option value="primaryPositionId">Position</option>
                        <option value="firstName">First Name</option>
                        <option value="lastName">Last Name</option>
                        <option value="contractType">Contract Type</option>
                        <option value="workType">Work Type</option>
                      </select>
                    </div>

                    {/* New Value */}
                    {changeRequestField && (
                      <div>
                        <label className="block mb-2 text-sm text-white/90">
                          New Value <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          className="glass-input w-full text-sm"
                          value={changeRequestNewValue}
                          onChange={(e) => setChangeRequestNewValue(e.target.value)}
                          placeholder="Enter new value"
                        />
                      </div>
                    )}

                    {/* Reason */}
                    <div>
                      <label className="block mb-2 text-sm text-white/90">
                        Reason <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        className="glass-input w-full text-sm"
                        rows={4}
                        value={changeRequestReason}
                        onChange={(e) => {
                          setChangeRequestReason(e.target.value);
                          setChangeRequestError(null);
                        }}
                        placeholder="Explain why you need this change..."
                        required
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
      <button
                        onClick={() => {
                          setShowChangeRequestModal(false);
                          setChangeRequestField("");
                          setChangeRequestNewValue("");
                          setChangeRequestReason("");
                          setChangeRequestError(null);
                        }}
                        className="glass-btn flex-1 text-sm py-2.5"
                      >
                        Cancel
      </button>
                      <button
                        onClick={submitChangeRequest}
                        disabled={submittingChangeRequest || !changeRequestField || !changeRequestNewValue.trim() || !changeRequestReason.trim()}
                        className="glow-btn flex-1 text-sm py-2.5"
                      >
                        {submittingChangeRequest ? "Submitting..." : "Submit Request"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

{/* ===== DEPARTMENT HEAD (MANAGER) ===== */}
{role === "DEPARTMENT_HEAD" && (
  <div className="lg:col-span-3">

    {/* ===== Manager Header ===== */}
    <div className="glass-card p-5 mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">
            Manager Dashboard
          </h1>
          <p className="text-xs text-white/60">
            Team Overview, Performance & Structure
          </p>
        </div>

        <div className="px-3 py-1.5 rounded bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30">
          <span className="text-xs font-bold text-purple-300 uppercase">
            MANAGER
          </span>
        </div>
      </div>
    </div>

    {/* =====================================================
       1️⃣ EMPLOYEE PROFILE MODULE – MANAGER INSIGHT
       ===================================================== */}
    <div className="glass-card p-4 mb-4">
      <h2 className="text-sm font-semibold text-white mb-2">
        My Team Profiles
      </h2>
      <p className="text-xs text-white/60 mb-3">
        View non-sensitive profile information for your direct and indirect
        subordinates.
      </p>

      <div className="flex justify-between items-center">
        <span className="text-xs text-white/50">
          Read-only • Reporting-line restricted
        </span>

        <button
          onClick={() => router.push("/manager/team")}
          className="px-4 py-2 text-xs font-medium rounded bg-cyan-600 hover:bg-cyan-500 transition"
        >
          View My Team →
        </button>
      </div>
    </div>

    {/* =====================================================
       2️⃣ ORGANIZATION STRUCTURE MODULE – MANAGER VIEW
       ===================================================== */}
    <div className="glass-card p-4 mb-4">
      <h2 className="text-sm font-semibold text-white mb-2">
        Organization Structure
      </h2>
      <p className="text-xs text-white/60 mb-3">
        View departments, positions, and reporting hierarchy.
      </p>

      <div className="flex justify-between items-center">
        <span className="text-xs text-white/50">
          View only • No structural edits
        </span>

        <button
          onClick={() => router.push("/organization-structure/org-chart")}
          className="px-4 py-2 text-xs font-medium rounded bg-indigo-600 hover:bg-indigo-500 transition"
        >
          View Org Chart →
        </button>
      </div>
    </div>

  {/* ================= PERFORMANCE MODULE ================= */}
<div className="glass-card p-4 mb-4">
  <h2 className="text-sm font-semibold text-white mb-2">
    Performance Management
  </h2>

  <p className="text-xs text-white/60 mb-4">
    Manage team appraisals during active performance cycles.
  </p>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    {/* VIEW ACTIVE CYCLES */}
    <div className="bg-white/5 border border-white/10 rounded p-4">
      <h3 className="text-xs font-semibold text-white mb-1">
        Active Cycles
      </h3>
      <p className="text-xs text-white/60 mb-3">
        View currently active appraisal cycles.
      </p>

      <button
        onClick={() => router.push("/performance/cycles")}
        className="w-full px-4 py-2 text-xs rounded bg-indigo-600 hover:bg-indigo-500 text-white"
      >
        View Cycles →
      </button>
    </div>

    {/* MY TEAM APPRAISALS */}
    <div className="bg-white/5 border border-white/10 rounded p-4">
      <h3 className="text-xs font-semibold text-white mb-1">
        Team Appraisals
      </h3>
      <p className="text-xs text-white/60 mb-3">
        Evaluate employees and track appraisal status.
      </p>

      <button
        onClick={() => router.push("/performance/appraisals")}
        className="w-full px-4 py-2 text-xs rounded bg-cyan-600 hover:bg-cyan-500 text-white"
      >
        View Appraisals →
      </button>
    </div>

    {/* 3. Performance Templates - Read Only */}
          <div className="glass-card p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                <h2 className="text-sm font-semibold text-white">Performance Templates</h2>
                <span className="px-1.5 py-0.5 text-xs text-white/50 bg-amber-500/20 border border-amber-500/30 rounded">Read Only</span>
                <p className="text-xs text-white/50">View assigned templates</p>
              </div>
              <button
                onClick={() => router.push("/performance/templates")}
                className="px-2.5 py-1 text-xs text-white font-medium rounded bg-purple-600 hover:bg-purple-500 transition-colors"
              >
                📋 View Templates
              </button>
            </div>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300/90">
              <span className="text-amber-400">ℹ️</span> Templates are created and managed by HR. 
              You can view them to understand the evaluation criteria used in appraisals.
            </div>
          </div>

    {/* CREATE APPRAISAL */}
    <div className="bg-white/5 border border-white/10 rounded p-4 md:col-span-2">
      <h3 className="text-xs font-semibold text-white mb-1">
        Create New Appraisal
      </h3>
      <p className="text-xs text-white/60 mb-3">
        Start a new appraisal for an employee in an active cycle.
      </p>

      <button
        onClick={() => router.push("/performance/appraisals/create")}
        className="w-full px-4 py-2 text-xs rounded bg-green-600 hover:bg-green-500 text-white"
      >
        Create Appraisal →
      </button>
    </div>
  </div>

  {/* STATUS LEGEND */}
  <div className="mt-4 text-xs text-white/50">
    <p>• Draft → Manager still evaluating</p>
    <p>• Manager Submitted → Sent to HR</p>
    <p>• HR Published → Final result</p>
  </div>
</div>
        </div>
        )}




        {/* ===== HR EMPLOYEE ===== */}
        {role === "HR_EMPLOYEE" && (
          <div className="lg:col-span-3">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-6 text-white border-b border-white/10 pb-3">
                HR Panel
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push("/hr/employees")}
                  className="glass-btn h-24 flex flex-col items-center justify-center gap-2 hover:bg-white/12 transition-all"
              >
                  <span className="text-2xl">👤</span>
                  <span className="text-sm font-medium">Manage Employees</span>
              </button>

              <button
                onClick={() => router.push("/organization-structure")}
                  className="glass-btn h-24 flex flex-col items-center justify-center gap-2 hover:bg-white/12 transition-all"
              >
                  <span className="text-2xl">🏢</span>
                  <span className="text-sm font-medium">Organization Structure</span>
              </button>

              <button
                onClick={() => router.push("/hr/change-requests")}
                  className="glow-btn h-24 flex flex-col items-center justify-center gap-2 transition-all"
              >
                  <span className="text-2xl">📄</span>
                  <span className="text-sm font-medium">Approve Requests</span>
              </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== HR MANAGER ===== */}
        {/* HR Manager Dashboard - Only accessible to HR_MANAGER role */}
        {/* HR Manager CANNOT access: Access Control, System Governance, Role Assignment */}
        {role === "HR_MANAGER" && (
          <div className="lg:col-span-3">
            {/* 1. HR MANAGER HEADER */}
            <div className="glass-card p-5 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-white mb-0.5">HR Management Dashboard</h1>
                  <p className="text-xs text-white/60">Employee Operations & Approvals</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <div className="px-3 py-1.5 rounded bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">HR MANAGER</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. HR OVERVIEW - PRIMARY VISIBLE SECTION */}
            <div className="glass-card p-4 mb-4">
              <h2 className="text-sm font-semibold text-white mb-3">At a Glance</h2>
              {hrData.loading ? (
                <div className="text-center py-3 text-white/60 text-xs">Loading...</div>
              ) : hrData.error ? (
                <div className="text-center py-3 text-red-400 text-xs">{hrData.error}</div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
                    onClick={() => {
                      setHrSections(prev => ({ ...prev, employees: true }));
                      setTimeout(() => {
                        document.getElementById('hr-employees-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                    className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer text-left"
                  >
                    <div className="text-xs text-white/60 mb-0.5 uppercase tracking-wide">Total Employees</div>
                    <div className="text-lg font-bold text-white">{hrData.totalEmployees}</div>
      </button>
                  <button
                    onClick={() => {
                      setHrSections(prev => ({ ...prev, employees: true }));
                      setTimeout(() => {
                        document.getElementById('hr-employees-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                    className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer text-left"
                  >
                    <div className="text-xs text-white/60 mb-0.5 uppercase tracking-wide">Active</div>
                    <div className="text-lg font-bold text-green-400">{hrData.activeEmployees}</div>
                  </button>
                  <button
                    onClick={() => {
                      setHrSections(prev => ({ ...prev, changeRequests: true }));
                      setTimeout(() => {
                        document.getElementById('hr-requests-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                    className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer text-left"
                  >
                    <div className="text-xs text-white/60 mb-0.5 uppercase tracking-wide">Pending Requests</div>
                    <div className="text-lg font-bold text-yellow-400">{hrData.pendingRequests}</div>
                  </button>
                  <button
                    onClick={() => {
                      setHrSections(prev => ({ ...prev, changeRequests: true }));
                      setTimeout(() => {
                        document.getElementById('hr-requests-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                    className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer text-left"
                  >
                    <div className="text-xs text-white/60 mb-0.5 uppercase tracking-wide">Disputes</div>
                    <div className="text-lg font-bold text-orange-400">{hrData.disputes}</div>
            </button>
          </div>
        )}
            </div>
hr
            {/* 3. EMPLOYEE MANAGEMENT */}
            <div id="hr-employees-section" className="glass-card p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <h2 className="text-sm font-semibold text-white">Employee Records</h2>
                  <span className="px-1.5 py-0.5 text-xs text-white/50 bg-white/5 border border-white/10 rounded">Operational</span>
                  <p className="text-xs text-white/50">
                    {hrData.loading ? "Loading..." : `${hrData.totalEmployees} total • ${hrData.activeEmployees} active`}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setHrSections(prev => ({ ...prev, employees: !prev.employees }))}
                    className="px-2.5 py-1 text-xs text-white font-medium rounded bg-white/10 hover:bg-white/15 border border-white/20 transition-colors"
                  >
                    {hrSections.employees ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => router.push("/hr/employees/create")}
                    className="px-2.5 py-1 text-xs text-white font-medium rounded bg-cyan-600 hover:bg-cyan-500 transition-colors"
                  >
                    + Create
                  </button>
                </div>
              </div>
              {hrSections.employees && (
                <>
                  {hrData.loading ? (
                    <div className="text-center py-4 text-white/60 text-sm">Loading employees...</div>
                  ) : hrData.error ? (
                    <div className="text-center py-4 text-red-400 text-sm">{hrData.error}</div>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      {/* Search and Filters */}
                      <div className="flex flex-col sm:flex-row gap-2 mb-2">
                        <input
                          type="text"
                          value={employeeSearch}
                          onChange={(e) => setEmployeeSearch(e.target.value)}
                          placeholder="Search by employee number..."
                          className="flex-1 px-3 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setEmployeeStatusFilter("ALL")}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
                              employeeStatusFilter === "ALL"
                                ? "bg-cyan-600 text-white"
                                : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                            }`}
                          >
                            All
                          </button>
                          <button
                            onClick={() => setEmployeeStatusFilter("ACTIVE")}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
                              employeeStatusFilter === "ACTIVE"
                                ? "bg-green-600/80 text-white"
                                : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                            }`}
                          >
                            Active
                          </button>
                          <button
                            onClick={() => setEmployeeStatusFilter("INACTIVE")}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
                              employeeStatusFilter === "INACTIVE"
                                ? "bg-red-600/80 text-white"
                                : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                            }`}
                          >
                            Inactive
                          </button>
                        </div>
                      </div>

                      {/* Filtered and displayed employees */}
                      {(() => {
                        const filtered = hrData.employees.filter((emp: any) => {
                          // Status filter
                          if (employeeStatusFilter === "ACTIVE" && emp.status !== "ACTIVE") return false;
                          if (employeeStatusFilter === "INACTIVE" && emp.status === "ACTIVE") return false;
                          
                          // Search filter
                          if (employeeSearch.trim()) {
                            const searchLower = employeeSearch.toLowerCase().trim();
                            const empNumber = (emp.employeeNumber || "").toLowerCase();
                            return empNumber.includes(searchLower);
                          }
                          
                          return true;
                        });

                        return (
                          <>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="text-xs text-white/70">
                                Showing {Math.min(5, filtered.length)} of {filtered.length}
                              </div>
    <button
      onClick={() => router.push("/hr/employees")}
                                className="px-2.5 py-1 text-xs text-white font-medium rounded bg-cyan-600/80 hover:bg-cyan-600 transition-colors"
    >
                                View Full List
    </button>
                            </div>
                            {filtered.length === 0 ? (
                              <div className="text-center py-3 text-white/60 text-xs">No employees found</div>
                            ) : (
                              <div className="overflow-x-auto -mx-2">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-white/10">
                                      <th className="text-left py-1 px-2 text-xs font-semibold text-white/70 uppercase">Name</th>
                                      <th className="text-left py-1 px-2 text-xs font-semibold text-white/70 uppercase">Employee #</th>
                                      <th className="text-left py-1 px-2 text-xs font-semibold text-white/70 uppercase">Dept</th>
                                      <th className="text-left py-1 px-2 text-xs font-semibold text-white/70 uppercase">Status</th>
                                      <th className="text-right py-1 px-2 text-xs font-semibold text-white/70 uppercase">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filtered.slice(0, 5).map((emp: any) => {
                                      const department = emp.primaryDepartmentId && typeof emp.primaryDepartmentId === "object"
                                        ? emp.primaryDepartmentId.name
                                        : "—";
                                      const isActive = emp.status === "ACTIVE";
                                      const isUpdating = updatingEmployee === emp._id;

                                      return (
                                        <tr key={emp._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                          <td className="py-1 px-2 text-xs text-white font-medium">{emp.firstName} {emp.lastName}</td>
                                          <td className="py-1 px-2 text-xs text-white/70 font-mono">{emp.employeeNumber || "—"}</td>
                                          <td className="py-1 px-2 text-xs text-white/70">{department}</td>
                                          <td className="py-1 px-2">
                                            <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                                              isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                            }`}>
                                              {emp.status || "—"}
                                            </span>
                                          </td>
                                          <td className="py-1 px-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
    <button
                                                onClick={() => router.push(`/hr/employees/${emp._id}`)}
                                                className="px-1.5 py-0.5 text-xs text-white/70 font-normal rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                                                disabled={isUpdating}
    >
                                                Edit
    </button>
                                              {isActive ? (
                                                <button
                                                  onClick={() => deactivateEmployee(emp._id)}
                                                  disabled={isUpdating}
                                                  className="px-1.5 py-0.5 text-xs text-white/70 font-normal rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50"
                                                >
                                                  {isUpdating ? "..." : "Deact"}
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => activateEmployee(emp._id)}
                                                  disabled={isUpdating}
                                                  className="px-1.5 py-0.5 text-xs text-white/70 font-normal rounded bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 transition-colors disabled:opacity-50"
                                                >
                                                  {isUpdating ? "..." : "Act"}
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 4. CHANGE REQUESTS & DISPUTES */}
            <div id="hr-requests-section" className="glass-card p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <h2 className="text-sm font-semibold text-white">Change Requests & Disputes</h2>
                  <span className="px-1.5 py-0.5 text-xs text-white/50 bg-white/5 border border-white/10 rounded">Operational</span>
                  <p className="text-xs text-white/50">
                    {hrData.loading ? "Loading..." : `${hrData.pendingRequests} pending • ${hrData.disputes} disputes`}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setHrSections(prev => ({ ...prev, changeRequests: !prev.changeRequests }))}
                    className="px-2.5 py-1 text-xs text-white font-medium rounded bg-white/10 hover:bg-white/15 border border-white/20 transition-colors"
                  >
                    {hrSections.changeRequests ? "Hide" : "Show"}
                  </button>
    <button
      onClick={() => router.push("/hr/change-requests")}
                    className="px-2.5 py-1 text-xs text-white font-medium rounded bg-white/10 hover:bg-white/15 border border-white/20 transition-colors"
    >
                    View All
    </button>
                </div>
              </div>
              {hrSections.changeRequests && (
                <>
                  {hrData.loading ? (
                    <div className="text-center py-3 text-white/60 text-xs">Loading requests...</div>
                  ) : hrData.error ? (
                    <div className="text-center py-3 text-red-400 text-xs">{hrData.error}</div>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      {hrData.changeRequests.length === 0 ? (
                        <div className="text-center py-3 text-white/60 text-xs">No change requests found</div>
                      ) : (
                        <>
                          {/* Status filter tabs */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <button
                              onClick={() => setChangeRequestFilter("PENDING")}
                              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                changeRequestFilter === "PENDING"
                                  ? "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50"
                                  : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                              }`}
                            >
                              Pending ({hrData.changeRequests.filter((r: any) => r.status === "PENDING" && !isDisputeRequest(r)).length})
                            </button>
                            <button
                              onClick={() => setChangeRequestFilter("APPROVED")}
                              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                changeRequestFilter === "APPROVED"
                                  ? "bg-green-500/30 text-green-300 border border-green-500/50"
                                  : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                              }`}
                            >
                              Approved ({hrData.changeRequests.filter((r: any) => r.status === "APPROVED").length})
                            </button>
                            <button
                              onClick={() => setChangeRequestFilter("REJECTED")}
                              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                changeRequestFilter === "REJECTED"
                                  ? "bg-red-500/30 text-red-300 border border-red-500/50"
                                  : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                              }`}
                            >
                              Rejected ({hrData.changeRequests.filter((r: any) => r.status === "REJECTED").length})
                            </button>
                            <button
                              onClick={() => setChangeRequestFilter("ALL")}
                              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                changeRequestFilter === "ALL"
                                  ? "bg-cyan-600/30 text-cyan-300 border border-cyan-600/50"
                                  : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                              }`}
                            >
                              All ({hrData.changeRequests.length})
                            </button>
                          </div>

                          {/* Requests list - filtered */}
                          <div className="space-y-1.5">
                            {(changeRequestFilter === "ALL"
                              ? hrData.changeRequests
                              : hrData.changeRequests.filter((r: any) => {
                                  if (changeRequestFilter === "PENDING") {
                                    return r.status === "PENDING" && !isDisputeRequest(r);
                                  }
                                  return r.status === changeRequestFilter;
                                })
                            ).slice(0, 8).map((req: any) => {
                              const isDispute = isDisputeRequest(req);
                              const field = getRequestField(req);
                              const newValue = getRequestNewValue(req);
                              const isPending = req.status === "PENDING";
                              const isProcessing = processingRequest === req._id;

                              return (
                                <div key={req._id} className="bg-white/5 rounded p-2 border border-white/10">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                                          isDispute && isPending
                                            ? "bg-orange-500/20 text-orange-400"
                                            : req.status === "APPROVED"
                                            ? "bg-green-500/20 text-green-400"
                                            : req.status === "REJECTED"
                                            ? "bg-red-500/20 text-red-400"
                                            : "bg-yellow-500/20 text-yellow-400"
                                        }`}>
                                          {isDispute && isPending ? "DISPUTE" : req.status || "PENDING"}
                                        </span>
                                        <span className="text-xs text-white/60 truncate">
                                          {field}: {newValue}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1 flex-shrink-0">
                                      {isPending && !isDispute && (
                                        <>
    <button
                                            onClick={() => approveChangeRequest(req._id)}
                                            disabled={isProcessing}
                                            className="px-2 py-0.5 text-xs text-white font-medium rounded bg-green-600/80 hover:bg-green-600 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
                                            {isProcessing ? "..." : "Approve"}
    </button>
                                          <button
                                            onClick={() => rejectChangeRequest(req._id)}
                                            disabled={isProcessing}
                                            className="px-2 py-0.5 text-xs text-white font-medium rounded bg-red-600/80 hover:bg-red-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                                          >
                                            {isProcessing ? "..." : "Reject"}
                                          </button>
                                        </>
                                      )}
                                      {isPending && isDispute && (
  <button
    onClick={() => {
      setSelectedDispute(req);
      setShowResolveModal(true);
    }}
    disabled={isProcessing}
    className="px-2 py-0.5 text-xs text-white font-medium rounded bg-yellow-600/80 hover:bg-yellow-600 transition-colors disabled:opacity-50 whitespace-nowrap"
  >
    {isProcessing ? "..." : "Resolve"}
  </button>
)}

                                      {!isPending && (
                                        <span className="px-2 py-0.5 text-xs text-white/50 text-center">
                                          {req.status === "APPROVED" ? "✓" : req.status === "REJECTED" ? "✗" : "Done"}
                                        </span>
                                      )}
    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {hrData.changeRequests.length > 8 && (
                            <div className="text-center pt-1.5">
                              <button
                                onClick={() => router.push("/hr/change-requests")}
                                className="px-2.5 py-1 text-xs text-white font-medium rounded bg-white/10 hover:bg-white/15 border border-white/20 transition-colors"
                              >
                                View All {hrData.changeRequests.length} Requests
                              </button>
  </div>
)}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 4B. APPRAISAL DISPUTES */}
            <div className="glass-card p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <h2 className="text-sm font-semibold text-white">Appraisal Disputes</h2>
                  <span className="px-1.5 py-0.5 text-xs text-white/50 bg-white/5 border border-white/10 rounded">Operational</span>
                  <p className="text-xs text-white/50">
                    {hrData.loading ? "Loading..." : `${hrData.appraisalDisputes.filter((d: any) => d.status === "OPEN").length} open • ${hrData.appraisalDisputes.filter((d: any) => d.status === "ADJUSTED").length} resolved`}
                  </p>
                </div>
    <button
                  onClick={() => setHrSections(prev => ({ ...prev, disputes: !prev.disputes }))}
                  className="px-2.5 py-1 text-xs text-white font-medium rounded bg-white/10 hover:bg-white/15 border border-white/20 transition-colors"
    >
                  {hrSections.disputes ? "Hide" : "Show"}
    </button>
              </div>
              {hrSections.disputes && (
                <>
                  {hrData.loading ? (
                    <div className="text-center py-3 text-white/60 text-xs">Loading disputes...</div>
                  ) : hrData.error ? (
                    <div className="text-center py-3 text-red-400 text-xs">{hrData.error}</div>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      {/* Tabs */}
                      <div className="flex gap-1.5 mb-2">
                        <button
                          onClick={() => setDisputeFilter("OPEN")}
                          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                            disputeFilter === "OPEN"
                              ? "bg-orange-500/30 text-orange-300 border border-orange-500/50"
                              : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                          }`}
                        >
                          Open ({hrData.appraisalDisputes.filter((d: any) => d.status === "OPEN").length})
                        </button>
                        <button
                          onClick={() => setDisputeFilter("ADJUSTED")}
                          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                            disputeFilter === "ADJUSTED"
                              ? "bg-green-500/30 text-green-300 border border-green-500/50"
                              : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                          }`}
                        >
                          Resolved ({hrData.appraisalDisputes.filter((d: any) => d.status === "ADJUSTED").length})
                        </button>
                      </div>

                      {/* Disputes list */}
                      {hrData.appraisalDisputes.filter((d: any) => d.status === disputeFilter).length === 0 ? (
                        <div className="text-center py-3 text-white/60 text-xs">
                          No {disputeFilter === "OPEN" ? "open" : "resolved"} disputes found
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {hrData.appraisalDisputes
                            .filter((d: any) => d.status === disputeFilter)
                            .map((dispute: any) => {
                              const employee = typeof dispute.raisedByEmployeeId === "object" 
                                ? dispute.raisedByEmployeeId 
                                : null;
                              const employeeName = employee 
                                ? `${employee.firstName || ""} ${employee.lastName || ""}`.trim() 
                                : "Unknown Employee";
                              const appraisalId = typeof dispute.appraisalId === "object" 
                                ? dispute.appraisalId._id 
                                : dispute.appraisalId;

                              return (
                                <div key={dispute._id} className="bg-white/5 rounded p-2.5 border border-white/10">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-xs font-medium text-white">{employeeName}</span>
                                        <span className="text-xs text-white/50">•</span>
                                        <span className="text-xs text-white/60 font-mono">Appraisal: {String(appraisalId).slice(-8)}</span>
                                      </div>
                                      <div className="text-xs text-white/70 mb-1">
                                        <strong>Reason:</strong> {dispute.reason || "—"}
                                      </div>
                                      {dispute.details && (
                                        <div className="text-xs text-white/60">
                                          <strong>Details:</strong> {dispute.details}
                                        </div>
                                      )}
                                      {dispute.status === "ADJUSTED" && dispute.resolutionSummary && (
                                        <div className="text-xs text-green-400/80 mt-1">
                                          <strong>Resolution:</strong> {dispute.resolutionSummary}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-1 flex-shrink-0">
                                      {dispute.status === "OPEN" && (
    <button
                                          onClick={() => {
                                            setSelectedDispute(dispute);
                                            setShowResolveModal(true);
                                          }}
                                          className="px-2.5 py-1 text-xs text-white font-medium rounded bg-cyan-600/80 hover:bg-cyan-600 transition-colors whitespace-nowrap"
                                        >
                                          Resolve
    </button>
                                      )}
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded text-center ${
                                        dispute.status === "OPEN"
                                          ? "bg-orange-500/20 text-orange-400"
                                          : "bg-green-500/20 text-green-400"
                                      }`}>
                                        {dispute.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
  </div>
)}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 5. ORGANIZATION STRUCTURE (VIEW ONLY) */}
            <div className="glass-card p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <h2 className="text-sm font-semibold text-white">Organization Reference</h2>
                  <span className="px-1.5 py-0.5 text-xs text-white/50 bg-white/5 border border-white/10 rounded">Reference Only</span>
                  <p className="text-xs text-white/50">
                    {hrData.loading ? "Loading..." : `${hrData.totalDepartments} depts • ${hrData.totalPositions} positions`}
                  </p>
                </div>
              <button
                  onClick={() => setHrSections(prev => ({ ...prev, organization: !prev.organization }))}
                  className="px-2.5 py-1 text-xs text-white font-medium rounded bg-white/10 hover:bg-white/15 border border-white/20 transition-colors"
              >
                  {hrSections.organization ? "Hide" : "Show"}
              </button>
              </div>
              {hrSections.organization && (
                <>
                  {hrData.loading ? (
                    <div className="text-center py-3 text-white/60 text-xs">Loading organization structure...</div>
                  ) : hrData.error ? (
                    <div className="text-center py-3 text-red-400 text-xs">{hrData.error}</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                      <div>
                        <h3 className="text-xs font-semibold text-white mb-1.5">Departments</h3>
                        {hrData.departments.length === 0 ? (
                          <div className="text-xs text-white/60">No departments</div>
                        ) : (
                          <div className="space-y-1">
                            {hrData.departments.map((dept: any) => (
                              <div key={dept._id} className="bg-white/5 rounded p-1.5 border border-white/10">
                                <div className="text-xs text-white font-medium">{dept.name}</div>
                                <div className="text-xs text-white/50 mt-0.5">
                                  {dept.isActive !== false ? "Active" : "Inactive"}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-white mb-1.5">Positions</h3>
                        {hrData.positions.length === 0 ? (
                          <div className="text-xs text-white/60">No positions</div>
                        ) : (
                          <div className="space-y-1">
                            {hrData.positions.map((pos: any) => (
                              <div key={pos._id} className="bg-white/5 rounded p-1.5 border border-white/10">
                                <div className="text-xs text-white font-medium">{pos.title || pos.name}</div>
                                <div className="text-xs text-white/50 mt-0.5">
                                  {pos.isActive !== false ? "Active" : "Inactive"}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 6. PERFORMANCE MANAGEMENT */}
            <div className="glass-card p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <h2 className="text-sm font-semibold text-white">Performance Management</h2>
                  <span className="px-1.5 py-0.5 text-xs text-white/50 bg-green-500/20 border border-green-500/30 rounded">Full Access</span>
                  <p className="text-xs text-white/50">
                    {performanceExpanded && cyclesLoading 
                      ? "Loading..." 
                      : performanceExpanded && cyclesLoaded
                        ? `${hrData.cycles.length} cycles`
                        : "Manage cycles & templates"}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => router.push("/performance/templates")}
                    className="px-2.5 py-1 text-xs text-white font-medium rounded bg-purple-600 hover:bg-purple-500 transition-colors"
                  >
                    📋 Templates
                  </button>
                  <button
                    onClick={() => router.push("/performance/cycles")}
                    className="px-2.5 py-1 text-xs text-white font-medium rounded bg-blue-600 hover:bg-blue-500 transition-colors"
                  >
                    🔄 Cycles
                  </button>
                  <button
                    onClick={() => router.push("/performance/disputes")}
                    className="px-2.5 py-1 text-xs text-white font-medium rounded bg-orange-600 hover:bg-orange-500 transition-colors"
                  >
                    ⚠️ Disputes
                  </button>
                  <button
                    onClick={() => setPerformanceExpanded(prev => !prev)}
                    disabled={cyclesLoading}
                    className="px-2.5 py-1 text-xs text-white font-medium rounded bg-white/10 hover:bg-white/15 border border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {performanceExpanded ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              {performanceExpanded && (
                <>
                  {cyclesLoading ? (
                    <div className="text-center py-4 text-white/60 text-xs pt-2 border-t border-white/10">
                      <div className="inline-block animate-pulse">Loading performance cycles...</div>
          </div>
                  ) : (
                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      {hrData.cycles.length === 0 ? (
                        <div className="text-center py-4 text-white/60 text-xs">
                          <div className="mb-1">No performance cycles available.</div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-2 p-1.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300/90">
                            <span className="text-blue-400">ℹ</span> Appraisals are viewed per cycle.
                          </div>
                          <div className="space-y-1">
                            {hrData.cycles.map((cycle: any) => (
                              <div key={cycle._id} className="bg-white/5 rounded p-2 border border-white/10">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs text-white font-medium">{cycle.name || "Unnamed Cycle"}</div>
                                    <div className="text-xs text-white/50 mt-0.5">
                                      {cycle.startDate ? new Date(cycle.startDate).toLocaleDateString() : "—"} - {cycle.endDate ? new Date(cycle.endDate).toLocaleDateString() : "—"}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => router.push(`/performance/cycles/${cycle._id}`)}
                                    className="px-2 py-0.5 text-xs text-white font-medium rounded bg-cyan-600 hover:bg-cyan-500 transition-colors ml-2"
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Resolve Dispute Modal */}
            {showResolveModal && selectedDispute && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="glass-card p-6 max-w-md w-full">
                  <h2 className="text-lg font-semibold text-white mb-4">Resolve Dispute</h2>
                  
                  <div className="space-y-3 mb-4">
                    <div className="text-sm text-white/70">
                      <strong>Employee:</strong> {
                        typeof selectedDispute.raisedByEmployeeId === "object"
                          ? `${selectedDispute.raisedByEmployeeId.firstName || ""} ${selectedDispute.raisedByEmployeeId.lastName || ""}`.trim()
                          : "Unknown"
                      }
                    </div>
                    <div className="text-sm text-white/70">
                      <strong>Reason:</strong> {selectedDispute.reason || "—"}
                    </div>
                    {selectedDispute.details && (
                      <div className="text-sm text-white/70">
                        <strong>Details:</strong> {selectedDispute.details}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Resolution Summary <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={resolutionSummary}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                      placeholder="Enter resolution summary..."
                      rows={4}
                      className="glass-input w-full"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
            <button
                      onClick={() => {
                        setShowResolveModal(false);
                        setSelectedDispute(null);
                        setResolutionSummary("");
                      }}
                      className="px-4 py-2 text-sm text-white font-medium rounded bg-white/10 hover:bg-white/15 border border-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => resolveAppraisalDispute(selectedDispute._id)}
                      disabled={resolvingDispute || !resolutionSummary.trim()}
                      className="px-4 py-2 text-sm text-white font-medium rounded bg-cyan-600 hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resolvingDispute ? "Resolving..." : "Resolve"}
            </button>
                  </div>
                </div>
          </div>
        )}
          </div>
        )}

        {/* ===== SYSTEM ADMIN ===== */}
{role === "SYSTEM_ADMIN" && (
          <div className="lg:col-span-3">
            {/* 1. SYSTEM ADMINISTRATION HEADER */}
            <div className="glass-card p-8 mb-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-white">
                      System Administration
                    </h1>
                    <span className="px-3 py-1 text-xs font-semibold text-cyan-300 uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 rounded">
                      SYSTEM ADMIN
                    </span>
                  </div>
                  <p className="text-sm text-white/60 mb-3">
                    System Governance & Access Control
                  </p>
                  <p className="text-xs text-white/50 leading-relaxed max-w-3xl">
                    This interface manages system-level operations including user access control, organization structure, and system governance. This is not for HR operational tasks such as employee profile management, change request approvals, or performance appraisals.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. SYSTEM OVERVIEW (READ-ONLY STATS) */}
            <div className="glass-card p-8 mb-8">
              <div className="mb-6 pb-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">System Overview</h2>
                <p className="text-xs text-white/50 mt-1">Read-only system metrics</p>
              </div>
              {adminData.loading ? (
                <div className="text-white/50 text-sm py-12 text-center">Loading system metrics...</div>
              ) : adminData.error ? (
                <div className="text-red-400 text-sm py-12 text-center">Error: {adminData.error}</div>
              ) : (
                <div className="grid grid-cols-4 gap-6">
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <div className="text-xs text-white/50 mb-2 uppercase tracking-wide font-medium">Total Users</div>
                    <div className="text-3xl font-bold text-white">{adminData.totalUsers}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <div className="text-xs text-white/50 mb-2 uppercase tracking-wide font-medium">Active Departments</div>
                    <div className="text-3xl font-bold text-white">{adminData.activeDepartments}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <div className="text-xs text-white/50 mb-2 uppercase tracking-wide font-medium">Active Positions</div>
                    <div className="text-3xl font-bold text-white">{adminData.activePositions}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <div className="text-xs text-white/50 mb-2 uppercase tracking-wide font-medium">System Status</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      <span className="text-lg font-semibold text-white">{adminData.systemStatus}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. ACCESS CONTROL (USERS & ROLES) */}
            <div className="glass-card p-6 mb-8">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-0.5">Access Control</h2>
                  <p className="text-xs text-white/50">User management and role assignment</p>
                </div>
                <div className="flex gap-2">
    <button
                    onClick={() => setAccessControlExpanded(!accessControlExpanded)}
                    className="px-3 py-1.5 text-xs text-white font-medium rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 transition-colors"
    >
                    {accessControlExpanded ? "Hide" : "Show"}
    </button>
                  <button
                    onClick={() => router.push("/admin/password-reset")}
                    className="px-3 py-1.5 text-xs text-white font-medium rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 transition-colors"
                  >
                    Password Management
                  </button>
                </div>
              </div>
              {!accessControlExpanded && (
                <div className="py-2 text-sm text-white/70">
                  Access Control: {adminData.loading ? "..." : adminData.users.length} users • Click to manage roles
                </div>
              )}
              {accessControlExpanded && (
                <>
                  <div className="mb-4 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-300/90 flex items-center gap-1.5">
                      <span className="text-yellow-400">⚠</span>
                      <span>Role assignments affect system access. Changes are immediate.</span>
                    </p>
                  </div>
                  <div className="mb-4">
                    <input
                      type="text"
                      value={accessControlSearch}
                      onChange={(e) => {
                        setAccessControlSearch(e.target.value);
                        setAccessControlDisplayCount(10); // Reset to first 10 when search changes
                      }}
                      placeholder="Search by name or employee number..."
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
                    />
                  </div>
                  {adminData.loading ? (
                    <div className="text-white/50 text-sm py-8 text-center">Loading user data...</div>
                  ) : adminData.error ? (
                    <div className="text-red-400 text-sm py-8 text-center">Error: {adminData.error}</div>
                  ) : (() => {
                    const filteredUsers = adminData.users.filter((user: any) => {
                      if (!accessControlSearch.trim()) return true;
                      const searchLower = accessControlSearch.toLowerCase().trim();
                      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
                      const employeeNumber = (user.employeeNumber || "").toLowerCase();
                      return fullName.includes(searchLower) || employeeNumber.includes(searchLower);
                    });
                    const displayedUsers = filteredUsers.slice(0, accessControlDisplayCount);
                    const hasMore = filteredUsers.length > accessControlDisplayCount;
                    
                    return filteredUsers.length === 0 ? (
                      <div className="text-white/50 text-sm py-8 text-center">
                        {accessControlSearch.trim() ? "No users match your search" : "No users found"}
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto -mx-2">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left py-2 px-4 text-xs font-semibold text-white/70 uppercase tracking-wide">Name</th>
                                <th className="text-left py-2 px-4 text-xs font-semibold text-white/70 uppercase tracking-wide">Employee #</th>
                                <th className="text-left py-2 px-4 text-xs font-semibold text-white/70 uppercase tracking-wide">System Roles</th>
                                <th className="text-right py-2 px-4 text-xs font-semibold text-white/70 uppercase tracking-wide">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayedUsers.map((user: any) => (
                              <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-2 px-4 text-sm text-white">{user.firstName} {user.lastName}</td>
                                <td className="py-2 px-4 text-xs text-white/60 font-mono">{user.employeeNumber || "—"}</td>
                                <td className="py-2 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {(user.roles || (user.role ? [user.role] : [])).length > 0 ? (
                                      (user.roles || (user.role ? [user.role] : [])).map((r: string) => (
                                        <span key={r} className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-white/80 border border-white/10">
                                          {r.replace(/_/g, " ")}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                                        UNASSIGNED
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-4 text-right">
    <button
                                    onClick={() => openRoleModal(user)}
                                    className="px-2.5 py-1 text-xs text-white/70 hover:text-white font-medium rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                                    title="Assign or modify user system roles"
    >
                                    Roles
    </button>
                                </td>
                              </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {hasMore && (
                          <div className="mt-4 text-center">
                            <button
                              onClick={() => setAccessControlDisplayCount(accessControlDisplayCount + 10)}
                              className="px-4 py-2 text-xs text-white/70 hover:text-white font-medium rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                            >
                              Load More ({filteredUsers.length - accessControlDisplayCount} remaining)
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>

            {/* 4. ORGANIZATION STRUCTURE – FINAL AUTHORITY */}
            <div className="glass-card p-8 mb-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-lg font-semibold text-white">Organization Structure</h2>
                    <span className="px-2.5 py-1 text-xs font-bold text-yellow-400 uppercase tracking-wide bg-yellow-500/20 border border-yellow-500/40 rounded">
                      Final Authority
                    </span>
                  </div>
                  <p className="text-xs text-white/50">Department and position management</p>
                </div>
              </div>
              <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-300/90 flex items-center gap-2">
                  <span className="text-yellow-400">⚠</span>
                  <span>Final authority over organization structure. Changes affect all employees and system operations.</span>
                </p>
              </div>
              {adminData.loading ? (
                <div className="text-white/50 text-sm py-12 text-center">Loading organization structure...</div>
              ) : adminData.error ? (
                <div className="text-red-400 text-sm py-12 text-center">Error: {adminData.error}</div>
              ) : (
                <div className="grid grid-cols-2 gap-8">
                  {/* Departments */}
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Departments</h3>
    <button
                        onClick={() => openDeptModal("create")}
                        className="px-4 py-2 text-xs text-white font-medium rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 transition-colors"
    >
                        Create
    </button>
                    </div>
                    {adminData.departments.length === 0 ? (
                      <div className="text-white/50 text-sm py-8 text-center bg-white/5 rounded-lg border border-white/10">No departments</div>
                    ) : (
                      <div className="space-y-2">
                        {adminData.departments.map((dept: any) => (
                          <div key={dept._id} className="bg-white/5 rounded-lg p-4 border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="text-sm text-white font-medium">{dept.name}</div>
                                <div className="text-xs text-white/50 font-mono mt-0.5">{dept.code}</div>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                dept.isActive !== false 
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                                  : "bg-red-500/20 text-red-300 border border-red-500/30"
                              }`}>
                                {dept.isActive !== false ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openDeptModal("edit", dept)}
                                className="px-3 py-1.5 text-xs text-white font-medium rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 transition-colors"
                                title="Edit department details"
                              >
                                Edit
                              </button>
    <button
                                onClick={() => toggleDepartmentStatus(dept)}
                                className={`px-3 py-1.5 text-xs text-white font-medium rounded-lg border transition-colors ${
                                  dept.isActive !== false 
                                    ? "bg-yellow-600/20 hover:bg-yellow-600/30 border-yellow-500/30" 
                                    : "bg-green-600/20 hover:bg-green-600/30 border-green-500/30"
                                }`}
                                title={dept.isActive !== false ? "Deactivating affects all associated positions and employees" : "Activating makes department available for assignment"}
                              >
                                {dept.isActive !== false ? "Deactivate" : "Activate"}
    </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Positions */}
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Positions</h3>
    <button
                        onClick={() => openPosModal("create")}
                        className="px-4 py-2 text-xs text-white font-medium rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 transition-colors"
    >
                        Create
    </button>
                    </div>
                    {adminData.positions.length === 0 ? (
                      <div className="text-white/50 text-sm py-8 text-center bg-white/5 rounded-lg border border-white/10">No positions</div>
                    ) : (
                      <div className="space-y-2">
                        {adminData.positions.map((pos: any) => (
                          <div key={pos._id} className="bg-white/5 rounded-lg p-4 border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="text-sm text-white font-medium">{pos.title || pos.name}</div>
                                <div className="text-xs text-white/50 font-mono mt-0.5">{pos.code}</div>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                pos.isActive !== false 
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                                  : "bg-red-500/20 text-red-300 border border-red-500/30"
                              }`}>
                                {pos.isActive !== false ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openPosModal("edit", pos)}
                                className="px-3 py-1.5 text-xs text-white font-medium rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 transition-colors"
                                title="Edit position details"
                              >
                                Edit
                              </button>
    <button
                                onClick={() => togglePositionStatus(pos)}
                                className={`px-3 py-1.5 text-xs text-white font-medium rounded-lg border transition-colors ${
                                  pos.isActive !== false 
                                    ? "bg-yellow-600/20 hover:bg-yellow-600/30 border-yellow-500/30" 
                                    : "bg-green-600/20 hover:bg-green-600/30 border-green-500/30"
                                }`}
                                title={pos.isActive !== false ? "Deactivating prevents new employee assignments" : "Activating makes position available for assignment"}
                              >
                                {pos.isActive !== false ? "Deactivate" : "Activate"}
    </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 5. SYSTEM GOVERNANCE (AUDIT LOGS / EMPTY STATE) */}
            <div className="glass-card p-4">
              <div className="mb-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-sm font-semibold text-white">System Governance</h2>
                  <span className="px-2 py-0.5 text-xs text-white/50 bg-white/5 border border-white/10 rounded">
                    Read-only • Requires backend support
                  </span>
                </div>
                <p className="text-xs text-white/50">Audit logs and system activity</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-center py-3">
                  <div className="text-xs text-white/60 mb-1.5 font-medium">No audit data available</div>
                  <div className="text-xs text-white/50 leading-relaxed max-w-xl mx-auto">
                    Audit logs are not available because the backend does not expose a logging endpoint yet.
                  </div>
                  <div className="text-xs text-white/40 mt-2 italic">
                    This is expected behavior, not a frontend issue.
                  </div>
                </div>
              </div>
            </div>

            {/* Role Assignment Modal - SYSTEM ADMIN ONLY */}
            {role === "SYSTEM_ADMIN" && showRoleModal && selectedUser && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="glass-card p-6 max-w-lg w-full mx-4 border border-white/20">
                  <h3 className="text-lg font-semibold mb-1 text-white">
                    Role Assignment
                  </h3>
                  <p className="text-xs text-white/60 mb-4">
                    {selectedUser.firstName} {selectedUser.lastName} • {selectedUser.employeeNumber || "N/A"}
                  </p>
                  <div className="space-y-3 mb-6">
                    <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">System Roles</label>
                    <div className="space-y-2 bg-white/5 rounded p-3 border border-white/10">
                      {["DEPARTMENT_EMPLOYEE", "DEPARTMENT_HEAD", "HR_EMPLOYEE", "HR_MANAGER", "SYSTEM_ADMIN"].map((roleOption) => (
                        <label key={roleOption} className="flex items-center gap-3 cursor-pointer py-1.5">
                          <input
                            type="checkbox"
                            checked={newRoles.includes(roleOption)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRoles([...newRoles, roleOption]);
                              } else {
                                setNewRoles(newRoles.filter((r) => r !== roleOption));
                              }
                            }}
                            className="w-4 h-4 rounded border-white/30"
                          />
                          <span className="text-sm text-white">{roleOption.replace(/_/g, " ")}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
    <button
                      onClick={() => setShowRoleModal(false)}
                      className="px-4 py-2 text-sm text-white/70 hover:text-white rounded bg-white/5 hover:bg-white/10 transition-colors"
    >
                      Cancel
    </button>
    <button
                      onClick={saveUserRoles}
                      disabled={savingRoles || newRoles.length === 0}
                      className="px-4 py-2 text-sm text-white font-medium rounded bg-cyan-600 hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
                      {savingRoles ? "Saving..." : "Save Changes"}
    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Department Modal */}
            {showDeptModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="glass-card p-6 max-w-lg w-full mx-4 border border-white/20">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    {deptMode === "create" ? "Create Department" : "Edit Department"}
                  </h3>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wide">Code *</label>
                      <input
                        type="text"
                        value={deptCode}
                        onChange={(e) => setDeptCode(e.target.value)}
                        className="glass-input"
                        placeholder="DEPT001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wide">Name *</label>
                      <input
                        type="text"
                        value={deptName}
                        onChange={(e) => setDeptName(e.target.value)}
                        className="glass-input"
                        placeholder="Department Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wide">Description</label>
                      <textarea
                        value={deptDescription}
                        onChange={(e) => setDeptDescription(e.target.value)}
                        className="glass-input"
                        rows={3}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
    <button
                      onClick={() => setShowDeptModal(false)}
                      className="px-4 py-2 text-sm text-white/70 hover:text-white rounded bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
    <button
                      onClick={saveDepartment}
                      disabled={savingDept || !deptCode || !deptName}
                      className="px-4 py-2 text-sm text-white font-medium rounded bg-cyan-600 hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
                      {savingDept ? "Saving..." : deptMode === "create" ? "Create" : "Update"}
    </button>
                  </div>
                </div>
  </div>
)}

            {/* Position Modal */}
            {showPosModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="glass-card p-6 max-w-lg w-full mx-4 border border-white/20">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    {posMode === "create" ? "Create Position" : "Edit Position"}
                  </h3>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wide">Code *</label>
                      <input
                        type="text"
                        value={posCode}
                        onChange={(e) => setPosCode(e.target.value)}
                        className="glass-input"
                        placeholder="POS001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wide">Title *</label>
                      <input
                        type="text"
                        value={posTitle}
                        onChange={(e) => setPosTitle(e.target.value)}
                        className="glass-input"
                        placeholder="Position Title"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wide">Department *</label>
                      <select
                        value={posDepartmentId}
                        onChange={(e) => setPosDepartmentId(e.target.value)}
                        className="glass-input"
                      >
                        <option value="">Select Department</option>
                        {adminData.departments.filter((d: any) => d.isActive !== false).map((dept: any) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wide">Description</label>
                      <textarea
                        value={posDescription}
                        onChange={(e) => setPosDescription(e.target.value)}
                        className="glass-input"
                        rows={3}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                    <button
                      onClick={() => setShowPosModal(false)}
                      className="px-4 py-2 text-sm text-white/70 hover:text-white rounded bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
    <button
                      onClick={savePosition}
                      disabled={savingPos || !posCode || !posTitle || !posDepartmentId}
                      className="px-4 py-2 text-sm text-white font-medium rounded bg-cyan-600 hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
                      {savingPos ? "Saving..." : posMode === "create" ? "Create" : "Update"}
    </button>
                  </div>
                </div>
              </div>
            )}
  </div>
)}

      </div>

      {/* ================= LOGOUT ================= */}
        <button
  onClick={goBackToModules}
  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl"
>
  Back to Modules
</button>
      </div>
    </div>
  );
} 