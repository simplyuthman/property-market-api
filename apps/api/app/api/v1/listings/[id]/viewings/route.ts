import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, successListResponse } from "@/lib/envelope";
import { maskEmail } from "@/lib/mask-email";
import { parseViewingListParams, validateIdParam } from "@/lib/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const validated = validateIdParam(id);

    if (!validated.success) {
      return errorResponse(validated.error.code, validated.error.message, 400);
    }

    // Check if listing exists first
    const listing = await prisma.listing.findUnique({
      where: { id: validated.data.id },
      select: { id: true },
    });

    if (!listing) {
      return errorResponse("NOT_FOUND", "Listing not found.", 404);
    }

    const { searchParams } = new URL(request.url);
    const parsed = parseViewingListParams(searchParams);

    if (!parsed.success) {
      return errorResponse(parsed.error.code, parsed.error.message, 400);
    }

    const { limit, offset, sort, order, status } = parsed.data;

    const where: Prisma.PropertyViewingWhereInput = {
      listingId: validated.data.id,
      ...(status ? { status } : {}),
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
    console.error("[GET /api/v1/listings/:id/viewings]", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}
