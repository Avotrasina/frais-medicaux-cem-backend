import { Prisma } from "../generated/prisma/client.js";
import {
  CheckConstraintError,
  ConnectionPoolExhaustedError,
  DatabaseAuthenticationError,
  DatabaseError,
  DatabaseTimeoutError,
  DatabaseUnavailableError,
  ForeignKeyError,
  InvalidValueFormatError,
  NotNullConstraintError,
  RecordNotFoundError,
  RelatedRecordNotFoundError,
  RequiredRelationViolationError,
  SchemaMismatchError,
  TransactionConflictError,
  TransactionTimeoutError,
  UniqueConstraintError,
  UnknownDatabaseError,
  ValueOutOfRangeError,
  ValueTooLongError,
} from "../utils/errors/database.errors.js";

import { CHECK_CONSTRAINT_MESSAGES } from "../utils/errors/check-constraint.messages.js";


/* ========================================================================== */
/* Concepts : ce que l'on cherche à reconnaître, quelle que soit la source    */
/* ========================================================================== */

type Concept =
  | "unique"
  | "foreignKey"
  | "notNull"
  | "check"
  | "tooLong"
  | "outOfRange"
  | "invalidFormat"
  | "notFound"
  | "relatedNotFound"
  | "requiredRelation"
  | "conflict"
  | "transactionTimeout"
  | "unavailable"
  | "timeout"
  | "pool"
  | "auth"
  | "schema";

/** SQLSTATE PostgreSQL -> concept. */
const SQLSTATE_MAP: Record<string, Concept> = {
  "23505": "unique",
  "23503": "foreignKey",
  "23502": "notNull",
  "23514": "check",
  "22001": "tooLong",
  "22003": "outOfRange",
  "22P02": "invalidFormat",
  "22007": "invalidFormat",
  "22008": "invalidFormat",
  "40001": "conflict",
  "40P01": "conflict",
  "28000": "auth",
  "28P01": "auth",
  "42P01": "schema",
  "42703": "schema",
  "53300": "pool",
  "57014": "timeout",
  "57P01": "unavailable",
  "57P03": "unavailable",
};

/** « kind » de l'adapter pg de Prisma 7 -> concept (à vérifier avec votre version). */
const ADAPTER_KIND_MAP: Record<string, Concept> = {
  UniqueConstraintViolation: "unique",
  ForeignKeyConstraintViolation: "foreignKey",
  NullConstraintViolation: "notNull",
  ValueOutOfRange: "outOfRange",
  InvalidInputValue: "invalidFormat",
  InconsistentColumnData: "invalidFormat",
  TransactionWriteConflict: "conflict",
  TableDoesNotExist: "schema",
  ColumnNotFound: "schema",
  TooManyConnections: "pool",
  SocketTimeout: "timeout",
  AuthenticationFailed: "auth",
  DatabaseAccessDenied: "auth",
};

/** Code Prisma Pxxxx -> concept. */
const PRISMA_CODE_MAP: Record<string, Concept> = {
  P2002: "unique",
  P2003: "foreignKey",
  P2011: "notNull",
  P2004: "check",
  P2000: "tooLong",
  P2020: "outOfRange",
  P2023: "invalidFormat",
  P2025: "notFound",
  P2018: "relatedNotFound",
  P2014: "requiredRelation",
  P2034: "conflict",
  P2028: "transactionTimeout",
  P2024: "pool",
  P1000: "auth",
  P1001: "unavailable",
  P1017: "unavailable",
  P1002: "timeout",
  P1008: "timeout",
  P2021: "schema",
  P2022: "schema",
};

/* ========================================================================== */
/* Exploration de l'erreur d'origine                                          */
/* ========================================================================== */

type Node = Record<string, unknown>;

const PRISMA_CODE_PATTERN = /^P\d{4}$/;
const SQLSTATE_PATTERN = /^[0-9A-Z]{5}$/;

function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null;
}

/**
 * Parcourt l'erreur et ses sous-objets possibles (meta, driverAdapterError, cause...),
 * en largeur et avec une profondeur limitée, sans boucler sur les références circulaires.
 */
function* walk(root: unknown, maxDepth = 6): Generator<Node> {
  const seen = new Set<unknown>();
  const queue: Array<[unknown, number]> = [[root, 0]];

  while (queue.length > 0) {
    const [value, depth] = queue.shift() as [unknown, number];
    if (!isNode(value) || seen.has(value) || depth > maxDepth) continue;
    seen.add(value);
    yield value;
    for (const key of ["meta", "driverAdapterError", "cause", "originalError"]) {
      queue.push([value[key], depth + 1]);
    }
  }
}

/** SQLSTATE PostgreSQL (5 caractères) trouvé dans l'erreur d'origine. */
function extractSqlState(root: unknown): string | undefined {
  for (const node of walk(root)) {
    for (const key of ["originalCode", "sqlState", "code"]) {
      // Le `code` de l'erreur Prisma racine est un Pxxxx, pas un SQLSTATE.
      if (node === root && key === "code") continue;
      const value = node[key];
      if (
        typeof value === "string" &&
        SQLSTATE_PATTERN.test(value) &&
        !PRISMA_CODE_PATTERN.test(value)
      ) {
        return value;
      }
    }
  }
  return undefined;
}

/** « kind » de l'adapter pg (ex. "UniqueConstraintViolation"). */
function extractAdapterKind(root: unknown): string | undefined {
  for (const node of walk(root)) {
    if (typeof node.kind === "string") return node.kind;
  }
  return undefined;
}

/** Code Prisma Pxxxx de l'erreur. */
function extractPrismaCode(error: unknown): string | undefined {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code;
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return error.errorCode;
  }
  return undefined;
}

/** Nom de la contrainte violée (ex. "chk_agent_date_entree"). */
function extractConstraintName(root: unknown): string | undefined {
  for (const node of walk(root)) {
    const constraint = node.constraint;
    if (typeof constraint === "string") return constraint;
    if (isNode(constraint)) {
      if (typeof constraint.name === "string") return constraint.name;
      if (typeof constraint.index === "string") return constraint.index;
    }
  }
  // Dernier recours : lire le nom dans le message PostgreSQL
  // (ex. `violates check constraint "chk_agent_date_entree"`).
  for (const node of walk(root)) {
    for (const key of ["message", "originalMessage", "detail"]) {
      const text = node[key];
      if (typeof text === "string") {
        const match = /constraint "([^"]+)"/.exec(text);
        if (match) return match[1];
      }
    }
  }
  return undefined;
}

/** Champs concernés (jamais les valeurs, pour ne pas exposer de données). */
function extractFields(root: unknown): string[] {
  for (const node of walk(root)) {
    const constraint = node.constraint;
    if (isNode(constraint) && Array.isArray(constraint.fields)) {
      return constraint.fields.filter((f): f is string => typeof f === "string");
    }
    const target = node.target;
    if (Array.isArray(target)) {
      return target.filter((f): f is string => typeof f === "string");
    }
    if (typeof target === "string") return [target];
    if (typeof node.column === "string") return [node.column];
  }
  // Dernier recours : `Key (matricule)=(...) already exists.`
  for (const node of walk(root)) {
    const detail = node.detail;
    if (typeof detail === "string") {
      const match = /Key \(([^)]+)\)=/.exec(detail);
      if (match) return match[1].split(",").map((f) => f.trim());
    }
  }
  return [];
}

/* ========================================================================== */
/* Construction de l'erreur applicative                                       */
/* ========================================================================== */

function build(concept: Concept, entity: string, error: unknown): DatabaseError {
  switch (concept) {
    case "unique":
      return new UniqueConstraintError(entity, extractFields(error), error);
    case "foreignKey":
      return new ForeignKeyError(entity, extractFields(error)[0], error);
    case "notNull":
      return new NotNullConstraintError(entity, extractFields(error), error);
    case "check": {
      const name = extractConstraintName(error);
      const message = name ? CHECK_CONSTRAINT_MESSAGES[name] : undefined;
      return new CheckConstraintError(entity, name, message, error);
    }
    case "tooLong":
      return new ValueTooLongError(entity, extractFields(error)[0], error);
    case "outOfRange":
      return new ValueOutOfRangeError(entity, extractFields(error)[0], error);
    case "invalidFormat":
      return new InvalidValueFormatError(entity, extractFields(error)[0], error);
    case "notFound":
      return new RecordNotFoundError(entity, error);
    case "relatedNotFound":
      return new RelatedRecordNotFoundError(entity, error);
    case "requiredRelation":
      return new RequiredRelationViolationError(entity, error);
    case "conflict":
      return new TransactionConflictError(error);
    case "transactionTimeout":
      return new TransactionTimeoutError(error);
    case "unavailable":
      return new DatabaseUnavailableError(error);
    case "timeout":
      return new DatabaseTimeoutError(error);
    case "pool":
      return new ConnectionPoolExhaustedError(error);
    case "auth":
      return new DatabaseAuthenticationError(error);
    case "schema":
      return new SchemaMismatchError(error);
  }
}

/* ========================================================================== */
/* Point d'entrée                                                             */
/* ========================================================================== */

function isPrismaError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError
  );
}

/**
 * Convertit une erreur Prisma en erreur applicative.
 *
 * - Déjà une `DatabaseError` : renvoyée telle quelle (évite de traduire deux fois
 *   quand un repository en appelle un autre).
 * - Pas une erreur Prisma (bug de code, `PrismaClientValidationError`, erreur métier...) :
 *   renvoyée telle quelle.
 * - Erreur Prisma non reconnue : `UnknownDatabaseError` (l'erreur d'origine reste dans `cause`).
 *
 * @param error  l'erreur interceptée
 * @param entity nom de l'entité du repository (ex. "Agent"), pour des messages précis
 */
export function translatePrismaError(error: unknown, entity: string): unknown {
  if (error instanceof DatabaseError) return error;
  if (!isPrismaError(error)) return error;

  // 1. SQLSTATE PostgreSQL (le plus précis)
  const sqlState = extractSqlState(error);
  if (sqlState) {
    const concept = SQLSTATE_MAP[sqlState];
    if (concept) return build(concept, entity, error);
    // Classe 08 : exception de connexion
    if (sqlState.startsWith("08")) return build("unavailable", entity, error);
  }

  // 2. « kind » de l'adapter pg
  const kind = extractAdapterKind(error);
  if (kind && ADAPTER_KIND_MAP[kind]) {
    return build(ADAPTER_KIND_MAP[kind], entity, error);
  }

  // 3. Code Prisma Pxxxx
  const code = extractPrismaCode(error);
  if (code && PRISMA_CODE_MAP[code]) {
    return build(PRISMA_CODE_MAP[code], entity, error);
  }

  return new UnknownDatabaseError(error);
}