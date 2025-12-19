export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  HR = 'hr',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  avatar?: string;
  department?: string;
  position?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  userId: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: Record<string, string[]>;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}
