import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Resolver()
export class TestResolver {
  @Query(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async testAuth(@Args('input') input: string): Promise<string> {
    if (!input) {
      throw new Error('Input required');
    }
    return `Authenticated with input: ${input}`;
  }
}
