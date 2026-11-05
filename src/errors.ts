export class SivanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SivanError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SivanApiError extends SivanError {
  readonly statusCode: number;
  readonly errorDetails?: any;

  constructor(message: string, statusCode: number, errorDetails?: any) {
    super(message);
    this.name = 'SivanApiError';
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
  }
}

export class SivanAuthenticationError extends SivanApiError {
  constructor(message = 'Invalid or expired Sivan secret key (sk_live_...)') {
    super(message, 401);
    this.name = 'SivanAuthenticationError';
  }
}

export class SivanNetworkError extends SivanError {
  constructor(message: string) {
    super(message);
    this.name = 'SivanNetworkError';
  }
}

