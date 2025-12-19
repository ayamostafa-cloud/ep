import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header ❌');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Invalid token format ❌');
    }

    try {
      // Decode JWT → extract payload
      const decoded = this.jwtService.verify(token);

      req.user = {
        id: decoded.id,
        role: decoded.role,
        username: decoded.username,
      };

      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token ❌');
    }
  }
}
