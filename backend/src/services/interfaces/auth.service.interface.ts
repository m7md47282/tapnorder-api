import { AuthenticatedUser, LoginCommand, SignupCommand } from '../../entities/user.entity';

export interface IAuthService {
  signup(command: SignupCommand): Promise<AuthenticatedUser>;
  login(command: LoginCommand): Promise<AuthenticatedUser>;
  getCurrentUser(idToken: string): Promise<AuthenticatedUser>;
}

