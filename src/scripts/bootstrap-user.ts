import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { RolUsuario } from '../modules/usuarios/rol-usuario.enum';
import { UsuariosService } from '../modules/usuarios/usuarios.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const usuariosService = app.get(UsuariosService);

    const username = process.env.SYSTEMMX_BOOTSTRAP_USERNAME?.trim();

    const nombre = process.env.SYSTEMMX_BOOTSTRAP_NOMBRE?.trim();

    const password = process.env.SYSTEMMX_BOOTSTRAP_PASSWORD;

    if (!username || !nombre || !password) {
      throw new Error(
        'Faltan variables SYSTEMMX_BOOTSTRAP_USERNAME, SYSTEMMX_BOOTSTRAP_NOMBRE o SYSTEMMX_BOOTSTRAP_PASSWORD.',
      );
    }

    const totalUsuarios = await usuariosService.contarUsuarios();

    if (totalUsuarios > 0) {
      throw new Error(
        'El bootstrap solo puede ejecutarse cuando no existen usuarios.',
      );
    }

    const usuario = await usuariosService.crear({
      username,
      nombre,
      password,
      rol: RolUsuario.ADMIN,
    });

    console.log(`Usuario inicial creado: ${usuario.username}`);
  } finally {
    await app.close();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Error desconocido';

    console.error(`Bootstrap falló: ${message}`);

    process.exit(1);
  });
