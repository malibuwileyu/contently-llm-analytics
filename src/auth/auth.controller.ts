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
import { User } from './types/auth.types';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly _configService: ConfigService,
    private readonly authService: AuthService,
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

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request): Promise<User> {
    return req.user as User;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(): Promise<void> {
    // Guard will handle the auth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { user } = req;
    if (!user) {
      res.redirect('/auth/login?error=authentication_failed');
      return;
    }

    const token = await this.authService.generateToken(user as User);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    res.redirect('/');
  }
}
