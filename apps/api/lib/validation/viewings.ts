import { isValidCuid, parsePaginationParams, ValidationResult } from "./common";

export const viewingSortFields = ["scheduledAt", "createdAt"] as const;
export type ViewingSortField = (typeof viewingSortFields)[number];

export const viewingStatuses = ["scheduled", "completed", "cancelled"] as const;
export type ViewingStatus = (typeof viewingStatuses)[number];

export interface ViewingListParams {
  limit: number;
  offset: number;
  sort: ViewingSortField;
  order: "asc" | "desc";
  status?: ViewingStatus;
  listingId?: string;
}

export function parseViewingListParams(searchParams: URLSearchParams): ValidationResult<ViewingListParams> {
  const pagination = parsePaginationParams(searchParams);
  if (!pagination.success) {
    return pagination;
  }

  const rawSort = searchParams.get("sort");
  let sort: ViewingSortField = "scheduledAt";
  if (rawSort !== null) {
    if (!viewingSortFields.includes(rawSort as ViewingSortField)) {
      return {
        success: false,
        error: {
          code: "INVALID_SORT_FIELD",
          message: `Invalid sort field '${rawSort}'. Allowed fields: ${viewingSortFields.join(", ")}.`,
        },
      };
    }
    sort = rawSort as ViewingSortField;
  }

  const rawOrder = searchParams.get("order");
  let order: "asc" | "desc" = "asc";
  if (rawOrder !== null) {
    if (rawOrder !== "asc" && rawOrder !== "desc") {
      return {
        success: false,
        error: {
          code: "INVALID_ORDER_VALUE",
          message: `Invalid order value '${rawOrder}'. Allowed values: asc, desc.`,
        },
      };
    }
    order = rawOrder;
  }

  const rawStatus = searchParams.get("status");
  let status: ViewingStatus | undefined;
  if (rawStatus !== null) {
    if (!viewingStatuses.includes(rawStatus as ViewingStatus)) {
      return {
        success: false,
        error: {
          code: "INVALID_FILTER_VALUE",
          message: `Invalid status '${rawStatus}'. Allowed values: ${viewingStatuses.join(", ")}.`,
        },
      };
    }
    status = rawStatus as ViewingStatus;
  }

  const rawListingId = searchParams.get("listingId");
  let listingId: string | undefined;
  if (rawListingId !== null) {
    if (!isValidCuid(rawListingId)) {
      return {
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Provided listingId is not a valid CUID format.",
        },
      };
    }
    listingId = rawListingId;
  }

  return {
    success: true,
    data: {
      limit: pagination.data.limit,
      offset: pagination.data.offset,
      sort,
      order,
      status,
      listingId,
    },
  };
}
