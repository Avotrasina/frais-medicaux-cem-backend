export abstract class SoftDeleteError extends Error {
  abstract readonly code: string;

  constructor(
    public readonly model: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class EntityDeletedError extends SoftDeleteError {
  readonly code = "ENTITY_DELETED";

  constructor(model: string) {
    super(
      model,
      `L'entité "${model}" a été supprimée : aucune opération n'est autorisée.`,
    );
  }
}

export class HardDeleteForbiddenError extends SoftDeleteError {
  readonly code = "HARD_DELETE_FORBIDDEN";

  constructor(model: string) {
    super(
      model,
      `Suppression directe interdite sur "${model}" : utilisez la suppression logique puis la validation.`,
    );
  }
}

export class DeletionValidationRequiredError extends SoftDeleteError {
  readonly code = "DELETION_VALIDATION_REQUIRED";

  constructor(model: string) {
    super(
      model,
      `Le statut de suppression de "${model}" ne peut être défini que via la validation explicite.`,
    );
  }
}

export class DeletionNotPendingError extends SoftDeleteError {
  readonly code = "DELETION_NOT_PENDING";

  constructor(model: string) {
    super(
      model,
      `Aucune demande de suppression en attente pour "${model}".`,
    );
  }
}
