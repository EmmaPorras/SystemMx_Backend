import { validatePasswordPolicy } from './password-policy.validator';

describe('PasswordPolicyValidator (Fase 3 - Seguridad Avanzada de Contraseñas)', () => {
  describe('Longitud de contraseñas', () => {
    it('debe rechazar contraseñas de 14 caracteres (límite inferior)', () => {
      const password14 = 'A'.repeat(14);
      const result = validatePasswordPolicy(password14);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('al menos 15 caracteres');
    });

    it('debe aceptar contraseñas válidas de 15 caracteres exactos', () => {
      const password15 = 'MiFraseSegura15';
      const result = validatePasswordPolicy(password15);
      expect(result.isValid).toBe(true);
    });

    it('debe aceptar contraseñas válidas de 128 caracteres exactos', () => {
      const password128 = 'FraseSegura'.repeat(11) + '1234567'; // 11*11 + 7 = 128
      expect(password128.length).toBe(128);
      const result = validatePasswordPolicy(password128);
      expect(result.isValid).toBe(true);
    });

    it('debe rechazar contraseñas de 129 caracteres (límite superior excedido)', () => {
      const password129 = 'FraseSegura'.repeat(11) + '12345678'; // 129 chars
      expect(password129.length).toBe(129);
      const result = validatePasswordPolicy(password129);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('no puede exceder 128 caracteres');
    });
  });

  describe('Adhesión a frase larga, espacios, símbolos y Unicode', () => {
    it('debe admitir frases largas con espacios intermedios sin exigir símbolos ni números', () => {
      const passphrase = 'mi frase secreta es bastante segura';
      expect(passphrase.length).toBeGreaterThanOrEqual(15);
      const result = validatePasswordPolicy(passphrase);
      expect(result.isValid).toBe(true);
    });

    it('debe admitir caracteres Unicode como acentos, ñ y caracteres especiales', () => {
      const unicodePassword = '¡ContraseñaConÑyTildesÁÉÍÓÚ!';
      const result = validatePasswordPolicy(unicodePassword);
      expect(result.isValid).toBe(true);
    });

    it('debe admitir símbolos especiales variados', () => {
      const symbolPassword = '#SystemMx_2026!@$*';
      const result = validatePasswordPolicy(symbolPassword);
      expect(result.isValid).toBe(true);
    });

    it('debe admitir espacios iniciales o finales sin trim silencioso', () => {
      const spacedPassword = '  clave con espacios al inicio y final  ';
      const result = validatePasswordPolicy(spacedPassword);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Rechazo de contraseñas triviales, predecibles o comprometidas', () => {
    it('debe rechazar repetición continua de un solo carácter (15 a\'s)', () => {
      const repeatedA = 'a'.repeat(15);
      const result = validatePasswordPolicy(repeatedA);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('repetición del mismo carácter');
    });

    it('debe rechazar repetición continua de un solo número (15 unos)', () => {
      const repeated1 = '1'.repeat(15);
      const result = validatePasswordPolicy(repeated1);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('repetición del mismo carácter');
    });

    it('debe rechazar secuencias numéricas triviales (123456789012345)', () => {
      const sequential = '123456789012345';
      const result = validatePasswordPolicy(sequential);
      expect(result.isValid).toBe(false);
    });

    it('debe rechazar claves de diccionario común (password12345678)', () => {
      const common = 'password12345678';
      const result = validatePasswordPolicy(common);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('demasiado común o predecible');
    });

    it('debe rechazar tipos no string', () => {
      expect(validatePasswordPolicy(null).isValid).toBe(false);
      expect(validatePasswordPolicy(undefined).isValid).toBe(false);
      expect(validatePasswordPolicy(1234567890123456).isValid).toBe(false);
    });
  });
});
