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
  readonly code = 'ENTITY_DELETED';

  constructor(model: string) {
    super(
      model,
      `Entity "${model}" has been deleted; no operations are allowed.`,
    );
  }
}

export class HardDeleteForbiddenError extends SoftDeleteError {
  readonly code = 'HARD_DELETE_FORBIDDEN';

  constructor(model: string) {
    super(
      model,
      `Hard deletion is forbidden for "${model}"; use soft deletion followed by validation.`,
    );
  }
}

export class DeletionValidationRequiredError extends SoftDeleteError {
  readonly code = 'DELETION_VALIDATION_REQUIRED';

  constructor(model: string) {
    super(
      model,
      `The deletion status of "${model}" can only be set through explicit validation.`,
    );
  }
}

export class DeletionNotPendingError extends SoftDeleteError {
  readonly code = 'DELETION_NOT_PENDING';

  constructor(model: string) {
    super(model, `No pending deletion request for "${model}".`);
  }
}
