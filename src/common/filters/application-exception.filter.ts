import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import {
  ConstraintError,
  DatabaseConnectionError,
  DatabaseError,
  DatabaseSchemaError,
  FieldError,
  RecordError,
  TransactionError,
  UnknownDatabaseError,
} from "../errors/database.errors.js";
import { UnsupportedImageTypeException } from "../errors/unsupported-image-type.exception.js";
import { env } from "../settings/env.validator.js";

@Catch()
export class ApplicationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApplicationExceptionFilter.name);

  catch(
    exception: unknown,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.getStatus(exception);

    if (env.NODE_ENV === "development") {
      this.logger.error(
        `${this.getExceptionName(exception)} (${status}): ${this.getExceptionMessage(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    if (exception instanceof HttpException) {
      response.status(status).json(exception.getResponse());
      return;
    }

    response.status(status).json({
      statusCode: status,
      error: this.getErrorName(status),
      message:
        exception instanceof DatabaseError
          ? this.getClientMessage(exception)
          : "Une erreur interne est survenue",
    });
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    if (!(exception instanceof DatabaseError) && !(exception instanceof UnsupportedImageTypeException)) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
    if (exception instanceof UnsupportedImageTypeException) {
      return HttpStatus.BAD_REQUEST;
    }
    if (exception instanceof RecordError) return HttpStatus.NOT_FOUND;
    if (exception instanceof FieldError) return HttpStatus.BAD_REQUEST;
    if (exception instanceof ConstraintError || exception instanceof TransactionError) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof DatabaseConnectionError) return HttpStatus.SERVICE_UNAVAILABLE;
    if (exception instanceof DatabaseSchemaError || exception instanceof UnknownDatabaseError) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getClientMessage(exception: DatabaseError): string {
    if (exception instanceof UnknownDatabaseError || exception instanceof DatabaseSchemaError) {
      return "Une erreur interne est survenue";
    }
    return exception.message;
  }

  private getExceptionName(exception: unknown): string {
    return exception instanceof Error ? exception.name : "UnknownException";
  }

  private getExceptionMessage(exception: unknown): string {
    return exception instanceof Error ? exception.message : String(exception);
  }

  private getErrorName(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return "Bad Request";
      case HttpStatus.NOT_FOUND:
        return "Not Found";
      case HttpStatus.CONFLICT:
        return "Conflict";
      case HttpStatus.SERVICE_UNAVAILABLE:
        return "Service Unavailable";
      default:
        return "Internal Server Error";
    }
  }
}
