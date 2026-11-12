# Bloqueo: npm run check sigue fallando tras 3 intentos

- Sesión: demo-2-4
- Fecha: 2026-11-08T10:05:33.808Z
- Reportes completos: reports/

## Último resultado

```

> inventario-motos-backend@0.0.1 check
> node scripts/check.mjs

▶ lint:ci ... FAIL (12.3s)
▶ build ... OK (6.8s)
▶ test ... OK (9.7s)
▶ gitleaks ... OK (1.4s)
▶ semgrep ... OK (6.7s)

=== Resumen de check ===
✘ lint:ci   fail
✔ build     ok
✔ test      ok
✔ gitleaks  ok
✔ semgrep   ok

--- lint:ci (fail) ---
  436:7   warning  Unsafe call of an `any` typed value              @typescript-eslint/no-unsafe-call
  436:19  warning  Unsafe member access .execute on an `any` value  @typescript-eslint/no-unsafe-member-access
  461:7   warning  Unsafe call of an `any` typed value              @typescript-eslint/no-unsafe-call
  461:19  warning  Unsafe member access .getOne on an `any` value   @typescript-eslint/no-unsafe-member-access
  462:7   warning  Unsafe call of an `any` typed value              @typescript-eslint/no-unsafe-call
  462:18  warning  Unsafe member access .getOne on an `any` value   @typescript-eslint/no-unsafe-member-access
  463:7   warning  Unsafe call of an `any` typed value              @typescript-eslint/no-unsafe-call
  463:19  warning  Unsafe member access .execute on an `any` value  @typescript-eslint/no-unsafe-member-access
  471:26  warning  Unsafe member access .setLock on an `any` value  @typescript-eslint/no-unsafe-member-access
  472:25  warning  Unsafe member access .setLock on an `any` value  @typescript-eslint/no-unsafe-member-access

C:\Users\Veldor\Desktop\proyecto seguridad informatica\SystemMx_Backend\src\modules\ventas\ventas.service.spec.ts
   53:49  warning  'entity' is defined but never used             @typescript-eslint/no-unused-vars
   57:26  warning  Unsafe member access .where on an `any` value  @typescript-eslint/no-unsafe-member-access
   66:9   warning  Unsafe return of a value of type `any`         @typescript-eslint/no-unsafe-return
  282:39  warning  Unsafe return of a value of type `any`         @typescript-eslint/no-unsafe-return
  290:15  warning  Unsafe assignment of an `any` value            @typescript-eslint/no-unsafe-assignment
  291:9   warning  Unsafe return of a value of type `any`         @typescript-eslint/no-unsafe-return
  291:16  warning  Unsafe call of an `any` typed value            @typescript-eslint/no-unsafe-call

C:\Users\Veldor\Desktop\proyecto seguridad informatica\SystemMx_Backend\src\tmp-lint-demo.ts
  1:7  error  'sinUsarDemo' is assigned a value but never used  @typescript-eslint/no-unused-vars

✖ 305 problems (1 error, 304 warnings)
  0 errors and 1 warning potentially fixable with the `--fix` option.

```

Requiere intervención humana.
