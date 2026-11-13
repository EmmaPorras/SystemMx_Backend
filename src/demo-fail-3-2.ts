// Archivo temporal solo para demostrar el fallo del job security (item 3.2, Semgrep) en CI.
export function demoFalloSemgrep(entrada: string): unknown {
  return eval(entrada);
}
