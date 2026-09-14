import { NextResponse } from "next/server";

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ListResponseEnvelope<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface SingleResponseEnvelope<T> {
  data: T;
}

export interface ErrorResponseEnvelope {
  error: {
    code: string;
    message: string;
  };
}

export function successListResponse<T>(
  data: T[],
  meta: PaginationMeta,
  init?: ResponseInit
): NextResponse<ListResponseEnvelope<T>> {
  return NextResponse.json(
    {
      data,
      meta,
    },
    {
      status: 200,
      ...init,
    }
  );
}

export function successSingleResponse<T>(
  data: T,
  init?: ResponseInit
): NextResponse<SingleResponseEnvelope<T>> {
  return NextResponse.json(
    {
      data,
    },
    {
      status: 200,
      ...init,
    }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  init?: ResponseInit
): NextResponse<ErrorResponseEnvelope> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    {
      status,
      ...init,
    }
  );
}
