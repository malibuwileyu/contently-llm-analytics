import { Controller, Get, Post, UseGuards, HttpCode } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { Role } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';

@Controller()
export class TestController {
  @Get('protected')
  @UseGuards(AuthGuard)
  getProtected() {
    return { message: 'Protected route accessed successfully' };
  }

  @Get('admin/dashboard')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  getAdminDashboard() {
    return { message: 'Admin dashboard accessed successfully' };
  }

  @Post('system/settings')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Permissions(Permission.MANAGE_SYSTEM)
  updateSystemSettings() {
    return { message: 'System settings updated successfully' };
  }
} 