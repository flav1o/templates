import { AuthService } from './auth.service';
import { User } from 'src/graphql/graphql-schema';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { CurrentUser } from 'src/common/decorators/getCurrentUser';
import { Controller, Post, Body, Query, UseGuards, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() userCreation: AuthCredentialsDto) {
    return this.authService.signUp(userCreation);
  }

  @Get('signin')
  async signIn(
    @Body() authCredentials: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredentials);
  }

  @Post('confirmAccount')
  async confirmAccount(
    @Query() query: { token: string; email: string },
  ): Promise<{ accessToken }> {
    const { email, token } = query;
    return await this.authService.confirmAccount(email, token);
  }

  @Get('signin-google')
  async signInGoogle(@Body() body: GoogleAuthDto): Promise<{ accessToken }> {
    return await this.authService.signInGoogle(body.code);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getUser(@CurrentUser() user: User): string {
    return user.email;
  }
}
