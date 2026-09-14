import { parsePaginationParams, ValidationResult } from "./common";

export const listingSortFields = ["price", "createdAt", "bedrooms"] as const;
export type ListingSortField = (typeof listingSortFields)[number];

export const listingCategories = ["sale", "rent"] as const;
export type ListingCategory = (typeof listingCategories)[number];

export interface ListingListParams {
  limit: number;
  offset: number;
  sort: ListingSortField;
  order: "asc" | "desc";
  category?: ListingCategory;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  bedrooms?: number;
}

export function parseListingListParams(searchParams: URLSearchParams): ValidationResult<ListingListParams> {
  const pagination = parsePaginationParams(searchParams);
  if (!pagination.success) {
    return pagination;
  }

  const rawSort = searchParams.get("sort");
  let sort: ListingSortField = "createdAt";
  if (rawSort !== null) {
    if (!listingSortFields.includes(rawSort as ListingSortField)) {
      return {
        success: false,
        error: {
          code: "INVALID_SORT_FIELD",
          message: `Invalid sort field '${rawSort}'. Allowed fields: ${listingSortFields.join(", ")}.`,
        },
      };
    }
    sort = rawSort as ListingSortField;
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

  const rawCategory = searchParams.get("category");
  let category: ListingCategory | undefined;
  if (rawCategory !== null) {
    if (!listingCategories.includes(rawCategory as ListingCategory)) {
      return {
        success: false,
        error: {
          code: "INVALID_FILTER_VALUE",
          message: `Invalid category '${rawCategory}'. Allowed values: ${listingCategories.join(", ")}.`,
        },
      };
    }
    category = rawCategory as ListingCategory;
  }

  let minPrice: number | undefined;
  const rawMinPrice = searchParams.get("minPrice");
  if (rawMinPrice !== null) {
    const parsed = parseInt(rawMinPrice, 10);
    if (!isNaN(parsed)) {
      minPrice = parsed;
    }
  }

  let maxPrice: number | undefined;
  const rawMaxPrice = searchParams.get("maxPrice");
  if (rawMaxPrice !== null) {
    const parsed = parseInt(rawMaxPrice, 10);
    if (!isNaN(parsed)) {
      maxPrice = parsed;
    }
  }

  let bedrooms: number | undefined;
  const rawBedrooms = searchParams.get("bedrooms");
  if (rawBedrooms !== null) {
    const parsed = parseInt(rawBedrooms, 10);
    if (!isNaN(parsed)) {
      bedrooms = parsed;
    }
  }

  const city = searchParams.get("city") || undefined;

  return {
    success: true,
    data: {
      limit: pagination.data.limit,
      offset: pagination.data.offset,
      sort,
      order,
      category,
      minPrice,
      maxPrice,
      city,
      bedrooms,
    },
  };
}
