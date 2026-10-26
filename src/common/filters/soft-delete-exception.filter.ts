import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  DeletionNotPendingError,
  DeletionValidationRequiredError,
  EntityDeletedError,
  HardDeleteForbiddenError,
  SoftDeleteError,
} from '../errors/soft-delete.errors.js';

@Catch(SoftDeleteError)
export class SoftDeleteExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SoftDeleteExceptionFilter.name);

  /** Logs soft-delete violations and serializes their stable API error shape. */
  catch(exception: SoftDeleteError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.getStatus(exception);

    this.logger.error(
      `${exception.name} [${exception.code}] - ${exception.message}`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      error: this.getErrorName(status),
      code: exception.code,
      model: exception.model,
      message: exception.message,
    });
  }

  /** Assigns HTTP status codes according to the soft-delete failure category. */
  private getStatus(exception: SoftDeleteError): number {
    switch (exception.constructor) {
      case EntityDeletedError:
        return HttpStatus.GONE;
      case HardDeleteForbiddenError:
      case DeletionValidationRequiredError:
        return HttpStatus.BAD_REQUEST;
      case DeletionNotPendingError:
        return HttpStatus.CONFLICT;
      default:
        return HttpStatus.CONFLICT;
    }
  }

  private getErrorName(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.GONE:
        return 'Gone';
      default:
        return 'Conflict';
    }
  }
}
