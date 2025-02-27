import { Role } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';

export interface JwtPayload {
  sub: string;
  email?: string;
  roles?: Role[];
  permissions?: Permission[];
  iat?: number;
  exp?: number;
}

export interface JwtSignOptions {
  secret: string;
  expiresIn?: string | number;
  algorithm?: string;
} 