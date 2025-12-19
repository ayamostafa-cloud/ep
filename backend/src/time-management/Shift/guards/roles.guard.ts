import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No roles required, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assuming user is attached to request (from JWT/auth middleware)

    // For Phase 1, if no user/auth system exists, we'll allow access
    // In production, this should check: user?.role && requiredRoles.includes(user.role)
    // For now, we'll simulate by checking a header or allow all (can be restricted later)

    // TODO: Replace with actual JWT authentication check
    // For Phase 1, we'll check if a role header is present (for testing)
    // In production: return user?.role && requiredRoles.includes(user.role);

    const userRole = request.headers['x-user-role'] || user?.role;

    if (!userRole) {
      // If no auth system, allow for Phase 1 (will be restricted in production)
      // Uncomment below to enforce role checking:
      // return false;
      return true; // Phase 1: Allow access, will be restricted when JWT is implemented
    }

    return requiredRoles.includes(userRole);
  }
}
