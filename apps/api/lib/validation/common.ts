import { z } from "zod";

export const cuidRegex = /^c[a-z0-9]{24}$/;

export function isValidCuid(id: string): boolean {
  return cuidRegex.test(id);
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export interface PaginationParams {
  limit: number;
  offset: number;
}

export function parsePaginationParams(searchParams: URLSearchParams): ValidationResult<PaginationParams> {
  const rawLimit = searchParams.get("limit");
  const rawOffset = searchParams.get("offset");

  let limit = 20;
  if (rawLimit !== null) {
    const parsedLimit = parseInt(rawLimit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      limit = 20;
    } else if (parsedLimit > 100) {
      limit = 100;
    } else {
      limit = parsedLimit;
    }
  }

  let offset = 0;
  if (rawOffset !== null) {
    const parsedOffset = parseInt(rawOffset, 10);
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return {
        success: false,
        error: {
          code: "INVALID_OFFSET",
          message: "Offset must be greater than or equal to 0.",
        },
      };
    }
    offset = parsedOffset;
  }

  return { success: true, data: { limit, offset } };
}

export function validateIdParam(id: string): ValidationResult<{ id: string }> {
  if (!isValidCuid(id)) {
    return {
      success: false,
      error: {
        code: "INVALID_ID",
        message: "Provided ID is not a valid CUID format.",
      },
    };
  }
  return { success: true, data: { id } };
}
