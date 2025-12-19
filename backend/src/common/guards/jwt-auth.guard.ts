import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header ❌');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid Authorization format ❌');
    }

    try {
      const decoded = this.jwtService.verify(token);

      request.user = {
        id: decoded.id,
        role: decoded.role,
        username: decoded.username,
      };

      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token ❌');
    }
  }
}
