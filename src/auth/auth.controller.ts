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
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '@/supabase/supabase.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { AuthGuard } from './guards/auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Request } from 'express';
import { GoogleAuthDto } from './types/auth.types';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly DISALLOWED_DOMAINS = ['example.com', 'test.com'];

  constructor(private readonly supabaseService: SupabaseService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    try {
      // Validate email domain
      const emailDomain = registerDto.email.split('@')[1]?.toLowerCase();
      if (this.DISALLOWED_DOMAINS.includes(emailDomain)) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid email domain',
            message:
              'Please use a valid email address. Test domains are not allowed.',
            details: {
              email:
                'Test email domains (example.com, test.com) are not allowed',
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const { data, error } = await this.supabaseService.signUp(
        registerDto.email,
        registerDto.password,
        {
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        },
      );

      if (error) {
        // Handle specific Supabase error cases
        if (
          error.message?.includes('Email address') &&
          error.message?.includes('is invalid')
        ) {
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error: 'Invalid email',
              message:
                'Please provide a valid email address that can receive verification emails.',
              details: {
                email:
                  'The email address provided cannot receive verification emails. Please use a real email address.',
              },
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        this.logger.error('Registration error:', error);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: error.message,
            message: 'Registration failed',
            details: error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        message:
          'Registration successful. Please check your email for verification instructions.',
        user: data.user,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Unexpected registration error:', error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Registration failed',
          message:
            error.message || 'An unexpected error occurred during registration',
          details: error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const { data, error } = await this.supabaseService.signIn(
      loginDto.email,
      loginDto.password,
    );

    if (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }

    return data;
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard will handle the auth flow
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request) {
    if (!req.user) {
      throw new HttpException('No user from Google', HttpStatus.UNAUTHORIZED);
    }

    const googleUser = req.user as GoogleAuthDto;
    const { data, error } =
      await this.supabaseService.signInWithGoogle(googleUser);

    if (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }

    return data;
  }
}
