interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    const apiError = error as ApiError;
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }
    if (apiError.message) {
      return apiError.message;
    }
  }
  return String(error);
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}
