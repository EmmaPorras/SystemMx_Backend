$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:DB_E2E_DATABASE)) {
  $env:DB_E2E_DATABASE = "inventario_motos_systemmx_e2e"
}

if (-not $env:DB_E2E_DATABASE.EndsWith("_e2e")) {
  throw "La BD E2E debe terminar en _e2e."
}

$previousDatabase = $env:DB_DATABASE
$previousNodeEnv = $env:NODE_ENV

try {
  npm run build

  if ($LASTEXITCODE -ne 0) {
    throw "Build falló."
  }

  node dist/scripts/reset-e2e-db.js

  if ($LASTEXITCODE -ne 0) {
    throw "Reset E2E falló."
  }

  $env:DB_DATABASE = $env:DB_E2E_DATABASE
  $env:NODE_ENV = "test"

  npm run migration:run:dist

  if ($LASTEXITCODE -ne 0) {
    throw "migration:run falló."
  }

  npm run bootstrap:user:dist

  if ($LASTEXITCODE -ne 0) {
    throw "bootstrap:user falló."
  }

  npm run test:e2e:systemmx

  if ($LASTEXITCODE -ne 0) {
    throw "SystemMx E2E falló."
  }

  npm run migration:show:dist

  if ($LASTEXITCODE -ne 0) {
    throw "migration:show falló."
  }
}
finally {
  $env:DB_DATABASE = $previousDatabase
  $env:NODE_ENV = $previousNodeEnv
}
