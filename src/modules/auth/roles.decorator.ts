import { SetMetadata } from '@nestjs/common';

import { RolUsuario } from '../usuarios/rol-usuario.enum';

export const ROLES_KEY = 'systemmx:roles';

export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);
