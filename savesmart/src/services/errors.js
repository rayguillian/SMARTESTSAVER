export class OpenAIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export class RateLimitError extends OpenAIError {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends OpenAIError {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
