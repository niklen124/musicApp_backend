import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Ne throw jamais : si le token est absent/invalide, req.user reste undefined
  // au lieu de renvoyer 401. Le contrôle d'accès fin se fait ensuite dans le service.
  handleRequest<TUser = any>(
    _err: unknown,
    user: TUser,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _info: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ExecutionContext,
  ): TUser {
    return user;
  }

  // Autorise toujours l'activation, même sans token
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as Promise<boolean>;
  }
}
