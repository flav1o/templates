import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { JwtPayload } from './dto/jwt-payload.interface';
import { GoogleStrategy } from './strategies/google.strategy';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly googleStrategy: GoogleStrategy,
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { password } = authCredentialsDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.usersService.createUser({
      ...authCredentialsDto,
      password: hashedPassword,
      confirmationCode: uuidv4().split('-')[0],
      confirmed: false,
    });
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const user = await this.usersService.findUserByEmail(
      authCredentialsDto.email,
    );

    if (!user)
      throw new HttpException(
        'AUTH.INVALID_CREDENTIALS',
        HttpStatus.UNAUTHORIZED,
      );

    const arePasswordsMatching = await bcrypt.compare(
      authCredentialsDto?.password,
      user?.password,
    );

    if (!arePasswordsMatching)
      throw new HttpException(
        'AUTH.INVALID_CREDENTIALS',
        HttpStatus.UNAUTHORIZED,
      );

    if (!user?.confirmed)
      throw new HttpException(
        'AUTH.USER_NOT_CONFIRMED',
        HttpStatus.UNAUTHORIZED,
      );

    const payload: JwtPayload = { email: user?.email };
    const accessToken: string = await this.jwtService.sign(payload);

    return { accessToken };
  }

  async signInGoogle(code: string): Promise<{ accessToken: string }> {
    const { email } = await this.googleStrategy.validate(code);
    const accessToken = this.jwtService.sign({ email });

    return { accessToken };
  }

  async confirmAccount(email: string, token: string): Promise<{ accessToken }> {
    const user = await this.usersService.confirmUser(email, token);
    const accessToken = await this.jwtService.sign({ email: user?.email });

    return { accessToken };
  }
}
