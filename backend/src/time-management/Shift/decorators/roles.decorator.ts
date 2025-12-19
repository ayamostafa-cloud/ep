import { SetMetadata } from '@nestjs/common';

// Define allowed roles for shift management
export const ROLES_KEY = 'roles';

/**
 * Roles decorator - Used to specify which roles are allowed to access a route
 * @param roles - Array of role names (e.g., 'HR Manager', 'System Admin')
 * @example @Roles('HR Manager', 'System Admin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
