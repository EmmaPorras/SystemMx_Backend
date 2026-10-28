import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Lista curada de contraseñas y patrones comunes o triviales de más de 14 caracteres
 * frecuentemente encontrados en diccionarios de contraseñas expuestas y combinaciones predecibles.
 */
const COMMON_TRIVIAL_PASSWORDS = new Set([
  'password1234567',
  'password12345678',
  'password123456789',
  '123456789012345',
  '1234567890123456',
  'abcdefghijklmno',
  'abcdefghijklmnop',
  'contrasenasegura1',
  'contrasenasegura12',
  'administrator123',
  'systemmxpassword1',
  'qwertyuiopasdfg',
  'correcthorsebatterystaple',
  'iloveyouforever1',
]);

/**
 * Verifica si una contraseña es trivial o de diccionario común:
 * - Longitud entre 15 y 128 caracteres.
 * - Rechaza un único carácter repetido (ej. "aaaaaaaaaaaaaaa").
 * - Rechaza secuencias lineales numéricas o alfabéticas triviales.
 * - Rechaza valores comunes de diccionario de contraseñas conocidas.
 * - Admite frases largas, espacios intermedios/iniciales/finales, símbolos y cualquier carácter Unicode.
 */
export function validatePasswordPolicy(password: unknown): {
  isValid: boolean;
  message?: string;
} {
  if (typeof password !== 'string') {
    return {
      isValid: false,
      message: 'La contraseña debe ser una cadena de texto.',
    };
  }

  // Comprobar longitud exacta sin trim (política de no truncar ni alterar)
  if (password.length < 15) {
    return {
      isValid: false,
      message: 'La contraseña debe tener al menos 15 caracteres.',
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: 'La contraseña no puede exceder 128 caracteres.',
    };
  }

  // Rechazar repetición continua de un único carácter (ej. 'aaaaaaaaaaaaaaa' o '111111111111111')
  if (/^(.)\1+$/.test(password)) {
    return {
      isValid: false,
      message:
        'La contraseña no puede consistir únicamente en la repetición del mismo carácter.',
    };
  }

  // Rechazar diccionario común en minúsculas
  const lower = password.toLowerCase();
  if (COMMON_TRIVIAL_PASSWORDS.has(lower)) {
    return {
      isValid: false,
      message:
        'La contraseña ingresada es demasiado común o predecible. Elige una frase o clave más segura.',
    };
  }

  // Rechazar secuencias numéricas simples de 15 o más caracteres
  const numericSequences = [
    '0123456789012345',
    '1234567890123456',
    '9876543210987654',
  ];
  if (numericSequences.some((seq) => lower.includes(seq.slice(0, 15)))) {
    return {
      isValid: false,
      message:
        'La contraseña no puede contener secuencias numéricas triviales continuas.',
    };
  }

  return { isValid: true };
}

export function IsStrongPasswordPolicy(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPasswordPolicy',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return validatePasswordPolicy(value).isValid;
        },
        defaultMessage(args: ValidationArguments) {
          const res = validatePasswordPolicy(args.value);
          return (
            res.message ||
            'La contraseña debe tener entre 15 y 128 caracteres y no ser trivial.'
          );
        },
      },
    });
  };
}

