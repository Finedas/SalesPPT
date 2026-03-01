export class ProviderSelectionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ProviderSelectionError";
    this.statusCode = statusCode;
  }
}

export class ProviderUnavailableError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 503) {
    super(message);
    this.name = "ProviderUnavailableError";
    this.statusCode = statusCode;
  }
}

export class ProviderResponseError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = "ProviderResponseError";
    this.statusCode = statusCode;
  }
}

export class ProviderModelUnavailableError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ProviderModelUnavailableError";
    this.statusCode = statusCode;
  }
}
