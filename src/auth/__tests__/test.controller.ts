import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Controller('test')
export class TestController {
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  async getProtected(): Promise<{ message: string }> {
    return { message: 'Protected route accessed successfully' };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAdminDashboard(): Promise<{ message: string }> {
    return { message: 'Admin dashboard accessed successfully' };
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateSystemSettings(): Promise<{ message: string }> {
    return { message: 'System settings updated successfully' };
  }
}
