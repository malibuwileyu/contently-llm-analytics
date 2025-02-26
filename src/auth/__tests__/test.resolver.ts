import { Resolver, Query, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';

@ObjectType()
class ProtectedData {
  @Field()
  id: string;

  @Field()
  name: string;
}

@Resolver()
export class TestResolver {
  @Query(() => ProtectedData)
  @UseGuards(AuthGuard)
  async protectedData(): Promise<ProtectedData> {
    try {
      return {
        id: 'test-id',
        name: 'Protected Data'
      };
    } catch (error) {
      throw new UnauthorizedException('Unauthorized');
    }
  }
} 