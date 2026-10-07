export class EnvValidationError extends Error {
  public readonly errors: readonly Error[];

  constructor(message: string, errors: readonly Error[] = []) {
    super(message);
    this.name = "EnvValidationError";
    this.errors = errors;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class EnvMissingKeyError extends EnvValidationError {
  public readonly key: string;

  constructor(key: string, message = `Missing environment variable: ${key}`) {
    super(message);
    this.name = "EnvMissingKeyError";
    this.key = key;
  }
}

export class EnvInvalidKeyError extends EnvValidationError {
  public readonly key: string;

  constructor(key: string, message = `Invalid environment variable: ${key}`) {
    super(message);
    this.name = "EnvInvalidKeyError";
    this.key = key;
  }
}

export class InvalidDirNameError extends EnvValidationError {
  public readonly value: string;

  constructor(
    value: string,
    message = `"${value}" invalide : uniquement lettres, chiffres, "_" et "-" (un seul niveau de dossier)`,
  ) {
    super(message);
    this.name = "InvalidDirNameError";
    this.value = value;
  }
}