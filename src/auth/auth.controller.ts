import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
  Get,
  UseGuards,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthDto } from './dto/auth.dto';
import { AuthResponse } from './types/auth.types';
import { SupabaseGuard } from './guards/supabase.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from './types/auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Post('signup')
  async signUp(@Body() authDto: AuthDto): Promise<AuthResponse> {
    const { data, error } = await this.supabaseService.signUp(
      authDto.email,
      authDto.password,
    );

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    return data;
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() authDto: AuthDto): Promise<AuthResponse> {
    const { data, error } = await this.supabaseService.signIn(
      authDto.email,
      authDto.password,
    );

    if (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }

    return data;
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async signOut(): Promise<{ message: string }> {
    const { error } = await this.supabaseService.signOut();

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { message: 'Signed out successfully' };
  }

  @Get('me')
  @UseGuards(SupabaseGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}
