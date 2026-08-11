export interface HttpExceptionOptions {
  message: string;
  statusCode: number;
  cause?: unknown;
  details?: unknown;
}

export class HttpException extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor({ message, statusCode, cause, details }: HttpExceptionOptions) {
    super(message, { cause });

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;

    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestException extends HttpException {
  constructor(message = "Bad Request", details?: unknown) {
    super({
      message,
      statusCode: 400,
      details,
    });
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = "Unauthorized", details?: unknown) {
    super({
      message,
      statusCode: 401,
      details,
    });
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = "Forbidden", details?: unknown) {
    super({
      message,
      statusCode: 403,
      details,
    });
  }
}

export class NotFoundException extends HttpException {
  constructor(message = "Not Found", details?: unknown) {
    super({
      message,
      statusCode: 404,
      details,
    });
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message = "Internal Server Error", details?: unknown) {
    super({
      message,
      statusCode: 500,
      details,
    });
  }
}
