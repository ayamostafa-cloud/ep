// utils/routeGuard.ts
import { useRouter } from "next/router";
import { useEffect } from "react";

type Role = "HR" | "MANAGER" | "EMPLOYEE";

/**
 * Normalizes role from localStorage to standard format
 */
export function normalizeRole(role: string | null): Role | null {
  if (!role) return null;
  
  const normalized = role.toUpperCase().replaceAll(" ", "_");
  
  // HR roles
  if (normalized === "HR_MANAGER" || normalized === "HR_EMPLOYEE" || normalized === "HR_ADMIN") {
    return "HR";
  }
  
  // Manager role
  if (normalized === "DEPARTMENT_HEAD") {
    return "MANAGER";
  }
  
  // Employee role
  if (normalized === "DEPARTMENT_EMPLOYEE") {
    return "EMPLOYEE";
  }
  
  return null;
}

/**
 * Checks if user has required role
 */
export function hasRole(requiredRole: Role): boolean {
  if (typeof window === "undefined") return false;
  
  const role = localStorage.getItem("role");
  const normalized = normalizeRole(role);
  return normalized === requiredRole;
}

/**
 * Hook to guard routes by role
 * Redirects to /dashboard if role doesn't match
 */
export function useRouteGuard(requiredRole: Role) {
  const router = useRouter();
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    const role = localStorage.getItem("role");
    const normalized = normalizeRole(role);
    
    if (normalized !== requiredRole) {
      router.push("/dashboard");
    }
  }, [router, requiredRole]);
}

/**
 * Get current user role
 */
export function getCurrentRole(): Role | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem("role");
  return normalizeRole(role);
}


