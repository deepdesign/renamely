export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: unknown, _req: unknown, res: any, _next: unknown) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  if (err instanceof Error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message,
    });
  }

  return res.status(500).json({
    error: 'Unknown error occurred',
  });
}

