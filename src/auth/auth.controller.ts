import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { User } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<User> {
    return this.authService.createUser({
      email: registerDto.email,
      password: registerDto.password,
      rawUserMetaData: {
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      },
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard will handle the authentication
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('No user from Google');
    }

    // Create or update user from Google data
    const user = await this.authService.createUser({
      email: req.user.email,
      rawUserMetaData: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        picture: req.user.picture,
      },
    });

    // Login and return token
    return this.authService.login(user.email, null);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
