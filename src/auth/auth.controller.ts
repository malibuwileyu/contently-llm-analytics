import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthDto } from './dto/auth.dto';
import { AuthResponse } from './types/auth.types';
import { SupabaseGuard } from './guards/supabase.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from './types/auth.types';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

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

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(): Promise<void> {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: any, @Res() res: Response): Promise<void> {
    // Check for authentication error
    if (req.query.error) {
      const clientUrl = this.configService.get<string>('app.clientUrl');
      res.redirect(`${clientUrl}/auth/callback?error=${req.query.error}`);
      return;
    }

    const user = req.user as User;
    
    // Create or update user in Supabase
    const { data, error } = await this.supabaseService.signUp(
      user.email || '',
      // Generate a random password for SSO users
      Math.random().toString(36).slice(-8),
    );

    if (error && error.message !== 'User already registered') {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    // Redirect to frontend with token
    const clientUrl = this.configService.get<string>('app.clientUrl');
    const token = data.session?.access_token;
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  }
}
