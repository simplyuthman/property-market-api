import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, successListResponse } from "@/lib/envelope";
import { parseAgentListParams } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = parseAgentListParams(searchParams);

    if (!result.success) {
      return errorResponse(result.error.code, result.error.message, 400);
    }

    const { limit, offset, sort, order, city } = result.data;

    const where: Prisma.AgentWhereInput = city
      ? { city: { equals: city, mode: "insensitive" } }
      : {};

    const [total, agents] = await Promise.all([
      prisma.agent.count({ where }),
      prisma.agent.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          [sort]: order,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          createdAt: true,
        },
      }),
    ]);

    const hasMore = offset + agents.length < total;

    return successListResponse(agents, {
      total,
      limit,
      offset,
      hasMore,
    });
  } catch (error) {
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}
