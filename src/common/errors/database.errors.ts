/* ========================================================================== */
/* Base class                                                                 */
/* ========================================================================== */

export abstract class DatabaseError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    // The subclass name (e.g. "UniqueConstraintError") is used in logs and responses.
    this.name = this.constructor.name;
  }
}

/* ========================================================================== */
/* 1. Connection / infrastructure errors (5xx)                                */
/*    Never expose technical details to clients; only log them.               */
/* ========================================================================== */

export abstract class DatabaseConnectionError extends DatabaseError {}

/** Database unreachable or connection closed. Prisma: P1001, P1017. */
export class DatabaseUnavailableError extends DatabaseConnectionError {
  constructor(cause?: unknown) {
    super('Database unavailable', cause);
  }
}

/** Connection or operation timed out. Prisma: P1002, P1008. */
export class DatabaseTimeoutError extends DatabaseConnectionError {
  constructor(cause?: unknown) {
    super('Database connection or operation timed out', cause);
  }
}

/** Connection pool exhausted. Prisma: P2024. */
export class ConnectionPoolExhaustedError extends DatabaseConnectionError {
  constructor(cause?: unknown) {
    super('Too many concurrent database connections', cause);
  }
}

/** Database credentials rejected. Prisma: P1000, SQLSTATE 28P01. */
export class DatabaseAuthenticationError extends DatabaseConnectionError {
  constructor(cause?: unknown) {
    super('Database authentication failed', cause);
  }
}

/* ========================================================================== */
/* 2. Transaction errors                                                      */
/* ========================================================================== */

export abstract class TransactionError extends DatabaseError {}

/** Interactive transaction exceeded its time limit or expired. Prisma: P2028. */
export class TransactionTimeoutError extends TransactionError {
  constructor(cause?: unknown) {
    super('The transaction has expired', cause);
  }
}

/**
 * Write conflict, deadlock, or serialization failure.
 * Prisma: P2034, SQLSTATE 40001 / 40P01.
 * The operation can usually be retried.
 */
export class TransactionConflictError extends TransactionError {
  constructor(cause?: unknown) {
    super('Transaction conflict; please retry', cause);
  }
}

/* ========================================================================== */
/* 3. Database constraint errors (primary key, unique, foreign key, NOT NULL) */
/* ========================================================================== */

export abstract class ConstraintError extends DatabaseError {
  constructor(
    public readonly entity: string,
    message: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}

/**
 * Duplicate primary key or unique constraint
 * (matricule, numConjoint, numEnfant, codeCategory...).
 * Prisma: P2002, SQLSTATE 23505.
 */
export class UniqueConstraintError extends ConstraintError {
  constructor(
    entity: string,
    public readonly fields: string[] = [],
    cause?: unknown,
  ) {
    super(
      entity,
      fields.length > 0
        ? `${entity} already exists (${fields.join(', ')})`
        : `${entity} already exists`,
      cause,
    );
  }
}

/**
 * Invalid foreign key (missing reference) or a record that is still referenced
 * (deleting a Personne still linked to an Agent, missing structureID, etc.).
 * Prisma: P2003, SQLSTATE 23503.
 */
export class ForeignKeyError extends ConstraintError {
  constructor(
    entity: string,
    public readonly field?: string,
    cause?: unknown,
  ) {
    super(
      entity,
      field
        ? `Invalid reference or record still in use (${entity}.${field})`
        : `Invalid reference or record still in use (${entity})`,
      cause,
    );
  }
}

/** Required field is missing (NULL value). Prisma: P2011, SQLSTATE 23502. */
export class NotNullConstraintError extends ConstraintError {
  constructor(
    entity: string,
    public readonly fields: string[] = [],
    cause?: unknown,
  ) {
    super(
      entity,
      fields.length > 0
        ? `Required field missing (${entity}: ${fields.join(', ')})`
        : `Required field missing (${entity})`,
      cause,
    );
  }
}

/* ========================================================================== */
/* 4. CHECK constraint errors                                                  */
/*    CHECK constraints are defined manually in SQL migrations and must have   */
/*    an explicit name. The readable message comes from CHECK_CONSTRAINT_MESSAGES. */
/* ========================================================================== */

/**
 * CHECK constraint violation. SQLSTATE 23514 (Prisma: P2004 or unknown error).
 * - constraintName: SQL constraint name (e.g. "chk_agent_date_entree")
 * - userMessage: associated readable message, if one exists in the message map
 */
export class CheckConstraintError extends ConstraintError {
  constructor(
    entity: string,
    public readonly constraintName?: string,
    public readonly userMessage?: string,
    cause?: unknown,
  ) {
    super(
      entity,
      userMessage ?? `Constraint violation: ${constraintName ?? entity}`,
      cause,
    );
  }
}

/* ========================================================================== */
/* 5. Field errors (invalid column value)                                       */
/*    Often indicates missing validation in the DTOs.                          */
/* ========================================================================== */

export abstract class FieldError extends DatabaseError {
  constructor(
    public readonly entity: string,
    public readonly field: string | undefined,
    message: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}

/** Value exceeds the column length (e.g. varchar(50)). Prisma: P2000, SQLSTATE 22001. */
export class ValueTooLongError extends FieldError {
  constructor(entity: string, field?: string, cause?: unknown) {
    super(
      entity,
      field,
      field
        ? `Value too long for field ${entity}.${field}`
        : `Value too long (${entity})`,
      cause,
    );
  }
}

/** Numeric or date value out of range (e.g. integer too large). Prisma: P2020, SQLSTATE 22003. */
export class ValueOutOfRangeError extends FieldError {
  constructor(entity: string, field?: string, cause?: unknown) {
    super(
      entity,
      field,
      field
        ? `Value out of range for field ${entity}.${field}`
        : `Value out of range (${entity})`,
      cause,
    );
  }
}

/**
 * Malformed value: wrong type, invalid date, or unknown enum value.
 * Prisma: P2023, SQLSTATE 22P02 / 22007 / 22008.
 */
export class InvalidValueFormatError extends FieldError {
  constructor(entity: string, field?: string, cause?: unknown) {
    super(
      entity,
      field,
      field
        ? `Invalid format for field ${entity}.${field}`
        : `Invalid value format (${entity})`,
      cause,
    );
  }
}

/* ========================================================================== */
/* 6. Record errors                                                           */
/* ========================================================================== */

export abstract class RecordError extends DatabaseError {
  constructor(
    public readonly entity: string,
    message: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}

/** Record not found during update / delete / findUniqueOrThrow. Prisma: P2025. */
export class RecordNotFoundError extends RecordError {
  constructor(entity: string, cause?: unknown) {
    super(entity, `${entity} not found`, cause);
  }
}

/** Required related record not found (e.g. `connect` to a missing ID). Prisma: P2018. */
export class RelatedRecordNotFoundError extends RecordError {
  constructor(entity: string, cause?: unknown) {
    super(entity, `Related record not found (${entity})`, cause);
  }
}

/** The update would violate a required relation between two models. Prisma: P2014. */
export class RequiredRelationViolationError extends RecordError {
  constructor(entity: string, cause?: unknown) {
    super(
      entity,
      `This update would violate a required relation (${entity})`,
      cause,
    );
  }
}

/* ========================================================================== */
/* 7. Schema errors (deployment issue, not a data issue)                       */
/* ========================================================================== */

export abstract class DatabaseSchemaError extends DatabaseError {}

/**
 * Missing table or column: migration not applied or Prisma client out of sync.
 * Prisma: P2021, P2022, SQLSTATE 42P01 / 42703.
 */
export class SchemaMismatchError extends DatabaseSchemaError {
  constructor(cause?: unknown) {
    super('The database schema does not match the application', cause);
  }
}

/* ========================================================================== */
/* 8. Unrecognized error                                                      */
/* ========================================================================== */

/** Database error the translator cannot classify. Log it; never expose details to clients. */
export class UnknownDatabaseError extends DatabaseError {
  constructor(cause?: unknown) {
    super('Unexpected database error', cause);
  }
}
