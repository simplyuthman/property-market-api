import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, successListResponse } from "@/lib/envelope";
import { maskEmail } from "@/lib/mask-email";
import { parseViewingListParams } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseViewingListParams(searchParams);

    if (!parsed.success) {
      return errorResponse(parsed.error.code, parsed.error.message, 400);
    }

    const { limit, offset, sort, order, status, listingId } = parsed.data;

    const where: Prisma.PropertyViewingWhereInput = {
      ...(status ? { status } : {}),
      ...(listingId ? { listingId } : {}),
    };

    const [total, rawViewings] = await Promise.all([
      prisma.propertyViewing.count({ where }),
      prisma.propertyViewing.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          [sort]: order,
        },
        select: {
          id: true,
          listingId: true,
          visitorName: true,
          visitorEmail: true,
          scheduledAt: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const viewings = rawViewings.map((viewing) => ({
      ...viewing,
      visitorEmail: maskEmail(viewing.visitorEmail),
    }));

    const hasMore = offset + viewings.length < total;

    return successListResponse(viewings, {
      total,
      limit,
      offset,
      hasMore,
    });
  } catch (error) {
    console.error("[GET /api/v1/viewings]", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}
