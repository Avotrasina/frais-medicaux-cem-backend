import 'dotenv/config';
import { cleanEnv, port, str, EnvError, EnvMissingError } from 'envalid';
import {
  EnvValidationError,
  EnvInvalidKeyError,
  EnvMissingKeyError,
} from '../common/errors/env.validation.error.js';

const validators = {

  DB_HOST: str(),
  DB_PORT: port({ default: 5432 }),
  DB_NAME: str(),
  DB_USER: str(),
  DB_PASSWORD: str(),
};

const toError = (key: string, err: unknown): Error => {
  if (err instanceof EnvMissingError) return new EnvMissingKeyError(key);
  if (err instanceof EnvError) return new EnvInvalidKeyError(key, `Invalid environment variable: ${key} - ${err.message}`);
  return new EnvValidationError(`Unexpected error for environment variable: ${key}`);
};

const cleaned = cleanEnv(process.env, validators, {
  reporter: ({ errors }) => {
    const list = Object.entries(errors).map(([key, err]) => toError(key, err));
    if (list.length === 0) return;

    const details = list.map((e) => `  - ${e.message}`).join('\n');
    throw new EnvValidationError(
      `Environment validation failed with ${list.length} error(s):\n${details}`,
      list,
    );
  },
});

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = cleaned;

const DATABASE_URL =
  `postgresql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}` +
  `@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

export const env = Object.freeze({
  ...cleaned,
  DATABASE_URL,
}); 