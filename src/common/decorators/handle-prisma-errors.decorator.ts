import { translatePrismaError } from "../../lib/prisma-error.translator.js";

export interface HandlePrismaErrorsOptions {
  entity?: string;
}

export interface HandlePrismaErrorsClassOptions extends HandlePrismaErrorsOptions {
  exclude?: string[];
}

const WRAPPED = Symbol.for("cem.handlePrismaErrors.wrapped");

type AnyFunction = (this: object, ...args: unknown[]) => unknown;

function resolveEntity(className: string, explicit?: string): string {
  if (explicit) return explicit;
  return className.replace(/Repository$/, "") || className;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

function wrap(
  original: AnyFunction,
  getEntity: (self: object) => string,
): AnyFunction {
  const wrapped = function (this: object, ...args: unknown[]): unknown {
    try {
      const result = original.apply(this, args);
      if (isPromiseLike(result)) {
        return Promise.resolve(result).catch((error: unknown) => {
          throw translatePrismaError(error, getEntity(this));
        });
      }
      return result;
    } catch (error) {
      throw translatePrismaError(error, getEntity(this));
    }
  };

  Object.defineProperty(wrapped, "name", { value: original.name });
  Object.defineProperty(wrapped, WRAPPED, { value: true });
  return wrapped;
}

function isWrapped(fn: AnyFunction): boolean {
  return (fn as unknown as Record<symbol, unknown>)[WRAPPED] === true;
}

export function HandlePrismaErrors(
  options: HandlePrismaErrorsClassOptions = {},
): ClassDecorator {
  const exclude = new Set(options.exclude ?? []);

  return (target) => {
    const entity = resolveEntity(target.name, options.entity);
    const prototype = target.prototype as Record<string, unknown>;

    for (const name of Object.getOwnPropertyNames(prototype)) {
      if (name === "constructor" || exclude.has(name)) continue;

      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      if (!descriptor || typeof descriptor.value !== "function") continue; 

      const original = descriptor.value as AnyFunction;
      if (isWrapped(original)) continue;

      Object.defineProperty(prototype, name, {
        ...descriptor,
        value: wrap(original, () => entity),
      });
    }
  };
}

export function HandlePrismaError(
  options: HandlePrismaErrorsOptions = {},
): MethodDecorator {
  return (_target, _propertyKey, descriptor) => {
    const original = descriptor.value as unknown;
    if (typeof original !== "function" || isWrapped(original as AnyFunction)) {
      return descriptor;
    }

    descriptor.value = wrap(original as AnyFunction, (self) =>
      resolveEntity(self.constructor.name, options.entity),
    ) as typeof descriptor.value;

    return descriptor;
  };
}