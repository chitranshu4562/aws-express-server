export class AppError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}
