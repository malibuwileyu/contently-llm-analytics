import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * GraphQL Authentication Guard
 * Extends the JWT AuthGuard to work with GraphQL requests
 */
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  /**
   * Get the request from the GraphQL context
   * @param context The execution context
   * @returns The request object
   */
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    return super.canActivate(
      {
        switchToHttp: () => ({
          getRequest: () => req
        })
      } as ExecutionContext
    );
  }
} 