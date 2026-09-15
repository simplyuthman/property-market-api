import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, successListResponse } from "@/lib/envelope";
import { parseListingListParams } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseListingListParams(searchParams);

    if (!parsed.success) {
      return errorResponse(parsed.error.code, parsed.error.message, 400);
    }

    const { limit, offset, sort, order, category, minPrice, maxPrice, city, bedrooms } = parsed.data;

    const where: Prisma.ListingWhereInput = {
      ...(category ? { category } : {}),
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      ...(bedrooms !== undefined ? { bedrooms } : {}),
      ...((minPrice !== undefined || maxPrice !== undefined)
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    };

    const [total, listings] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          [sort]: order,
        },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          category: true,
          bedrooms: true,
          bathrooms: true,
          city: true,
          address: true,
          agentId: true,
          createdAt: true,
        },
      }),
    ]);

    const hasMore = offset + listings.length < total;

    return successListResponse(listings, {
      total,
      limit,
      offset,
      hasMore,
    });
  } catch (error) {
    console.error("[GET /api/v1/listings]", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}
