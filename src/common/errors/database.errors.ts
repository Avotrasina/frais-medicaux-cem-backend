/* ========================================================================== */
/* Classe mère                                                                */
/* ========================================================================== */

export abstract class DatabaseError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    // Le nom de la classe fille (ex. "UniqueConstraintError") sert dans les logs et les réponses.
    this.name = this.constructor.name;
  }
}

/* ========================================================================== */
/* 1. Erreurs de connexion / infrastructure (5xx)                             */
/*    Ne jamais détailler le message technique au client, seulement le logger. */
/* ========================================================================== */

export abstract class DatabaseConnectionError extends DatabaseError {}

/** Base injoignable ou connexion coupée. Prisma : P1001, P1017. */
export class DatabaseUnavailableError extends DatabaseConnectionError {
  constructor(cause?: unknown) {
    super("Base de données indisponible", cause);
  }
}

/** Délai de connexion ou d'opération dépassé. Prisma : P1002, P1008. */
export class DatabaseTimeoutError extends DatabaseConnectionError {
  constructor(cause?: unknown) {
    super("Délai d'attente de la base de données dépassé", cause);
  }
}

/** Pool de connexions épuisé. Prisma : P2024. */
export class ConnectionPoolExhaustedError extends DatabaseConnectionError {
  constructor(cause?: unknown) {
    super("Trop de connexions simultanées à la base de données", cause);
  }
}

/** Identifiants de connexion refusés. Prisma : P1000, SQLSTATE 28P01. */
export class DatabaseAuthenticationError extends DatabaseConnectionError {
  constructor(cause?: unknown) {
    super("Authentification à la base de données refusée", cause);
  }
}

/* ========================================================================== */
/* 2. Erreurs de transaction                                                  */
/* ========================================================================== */

export abstract class TransactionError extends DatabaseError {}

/** Transaction interactive trop longue ou expirée. Prisma : P2028. */
export class TransactionTimeoutError extends TransactionError {
  constructor(cause?: unknown) {
    super("La transaction a expiré", cause);
  }
}

/**
 * Conflit d'écriture, deadlock ou échec de sérialisation.
 * Prisma : P2034, SQLSTATE 40001 / 40P01.
 * La requête peut généralement être rejouée.
 */
export class TransactionConflictError extends TransactionError {
  constructor(cause?: unknown) {
    super("Conflit entre transactions, veuillez réessayer", cause);
  }
}

/* ========================================================================== */
/* 3. Erreurs de contraintes de la base (clé primaire, unicité, clé étrangère, NOT NULL) */
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
 * Doublon sur une clé primaire ou une contrainte d'unicité
 * (matricule, numConjoint, numEnfant, codeCategory...).
 * Prisma : P2002, SQLSTATE 23505.
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
        ? `${entity} existe déjà (${fields.join(", ")})`
        : `${entity} existe déjà`,
      cause,
    );
  }
}

/**
 * Clé étrangère invalide (référence inexistante) ou enregistrement encore référencé
 * (suppression d'une Personne encore liée à un Agent, structureID inexistant...).
 * Prisma : P2003, SQLSTATE 23503.
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
        ? `Référence invalide ou enregistrement encore utilisé (${entity}.${field})`
        : `Référence invalide ou enregistrement encore utilisé (${entity})`,
      cause,
    );
  }
}

/** Champ obligatoire absent (valeur NULL). Prisma : P2011, SQLSTATE 23502. */
export class NotNullConstraintError extends ConstraintError {
  constructor(
    entity: string,
    public readonly fields: string[] = [],
    cause?: unknown,
  ) {
    super(
      entity,
      fields.length > 0
        ? `Champ obligatoire manquant (${entity}: ${fields.join(", ")})`
        : `Champ obligatoire manquant (${entity})`,
      cause,
    );
  }
}

/* ========================================================================== */
/* 4. Erreurs de contraintes CHECK                                            */
/*    Les CHECK sont écrits à la main dans les migrations SQL et doivent avoir */
/*    un nom explicite. Le message lisible vient de CHECK_CONSTRAINT_MESSAGES. */
/* ========================================================================== */

/**
 * Violation d'une contrainte CHECK. SQLSTATE 23514 (Prisma : P2004 ou erreur inconnue).
 * - constraintName : nom de la contrainte SQL (ex. "chk_agent_date_entree")
 * - userMessage    : message lisible associé, s'il existe dans la table de messages
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
      userMessage ??
        `Contrainte non respectée : ${constraintName ?? entity}`,
      cause,
    );
  }
}

/* ========================================================================== */
/* 5. Erreurs de champs (valeur incorrecte pour la colonne)                   */
/*    Souvent le signe d'une validation manquante dans les DTO.               */
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

/** Valeur trop longue pour la colonne (ex. varchar(50) dépassé). Prisma : P2000, SQLSTATE 22001. */
export class ValueTooLongError extends FieldError {
  constructor(entity: string, field?: string, cause?: unknown) {
    super(
      entity,
      field,
      field
        ? `Valeur trop longue pour le champ ${entity}.${field}`
        : `Valeur trop longue (${entity})`,
      cause,
    );
  }
}

/** Valeur numérique ou date hors limites (entier trop grand...). Prisma : P2020, SQLSTATE 22003. */
export class ValueOutOfRangeError extends FieldError {
  constructor(entity: string, field?: string, cause?: unknown) {
    super(
      entity,
      field,
      field
        ? `Valeur hors limites pour le champ ${entity}.${field}`
        : `Valeur hors limites (${entity})`,
      cause,
    );
  }
}

/**
 * Valeur mal formée : mauvais type, date invalide, valeur d'enum inconnue.
 * Prisma : P2023, SQLSTATE 22P02 / 22007 / 22008.
 */
export class InvalidValueFormatError extends FieldError {
  constructor(entity: string, field?: string, cause?: unknown) {
    super(
      entity,
      field,
      field
        ? `Format invalide pour le champ ${entity}.${field}`
        : `Format de valeur invalide (${entity})`,
      cause,
    );
  }
}

/* ========================================================================== */
/* 6. Erreurs d'enregistrement                                                */
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

/** Enregistrement introuvable lors d'un update / delete / findUniqueOrThrow. Prisma : P2025. */
export class RecordNotFoundError extends RecordError {
  constructor(entity: string, cause?: unknown) {
    super(entity, `${entity} introuvable`, cause);
  }
}

/** Enregistrement lié requis introuvable (ex. `connect` vers un id inexistant). Prisma : P2018. */
export class RelatedRecordNotFoundError extends RecordError {
  constructor(entity: string, cause?: unknown) {
    super(entity, `Enregistrement lié introuvable (${entity})`, cause);
  }
}

/** La modification violerait une relation obligatoire entre deux modèles. Prisma : P2014. */
export class RequiredRelationViolationError extends RecordError {
  constructor(entity: string, cause?: unknown) {
    super(entity, `Cette modification violerait une relation obligatoire (${entity})`, cause);
  }
}

/* ========================================================================== */
/* 7. Erreurs de schéma (problème de déploiement, pas de données)             */
/* ========================================================================== */

export abstract class DatabaseSchemaError extends DatabaseError {}

/**
 * Table ou colonne absente : migration non appliquée ou client Prisma désynchronisé.
 * Prisma : P2021, P2022, SQLSTATE 42P01 / 42703.
 */
export class SchemaMismatchError extends DatabaseSchemaError {
  constructor(cause?: unknown) {
    super("Le schéma de la base de données ne correspond pas à l'application", cause);
  }
}

/* ========================================================================== */
/* 8. Erreur non reconnue                                                     */
/* ========================================================================== */

/** Erreur de la base que le traducteur ne sait pas classer. À loguer, jamais détailler au client. */
export class UnknownDatabaseError extends DatabaseError {
  constructor(cause?: unknown) {
    super("Erreur inattendue de la base de données", cause);
  }
}