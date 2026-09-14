import { parsePaginationParams, ValidationResult } from "./common";

export const agentSortFields = ["name", "createdAt"] as const;
export type AgentSortField = (typeof agentSortFields)[number];

export interface AgentListParams {
  limit: number;
  offset: number;
  sort: AgentSortField;
  order: "asc" | "desc";
  city?: string;
}

export function parseAgentListParams(searchParams: URLSearchParams): ValidationResult<AgentListParams> {
  const pagination = parsePaginationParams(searchParams);
  if (!pagination.success) {
    return pagination;
  }

  const rawSort = searchParams.get("sort");
  let sort: AgentSortField = "createdAt";
  if (rawSort !== null) {
    if (!agentSortFields.includes(rawSort as AgentSortField)) {
      return {
        success: false,
        error: {
          code: "INVALID_SORT_FIELD",
          message: `Invalid sort field '${rawSort}'. Allowed fields: ${agentSortFields.join(", ")}.`,
        },
      };
    }
    sort = rawSort as AgentSortField;
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

  const city = searchParams.get("city") || undefined;

  return {
    success: true,
    data: {
      limit: pagination.data.limit,
      offset: pagination.data.offset,
      sort,
      order,
      city,
    },
  };
}
