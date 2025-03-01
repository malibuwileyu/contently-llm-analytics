import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor() {
    super({
      _accessType: 'offline',
      _prompt: 'select_account',
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // If there's an error query _parameter, let the controller handle it
    if (request.query.error) {
      return true;
    }

    try {
      const result = await super.canActivate(context);
      return result as boolean;
    } catch (error) {
      return false;
    }
  }
}
