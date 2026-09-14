import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, successSingleResponse } from "@/lib/envelope";
import { validateIdParam } from "@/lib/validation";

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

    const listing = await prisma.listing.findUnique({
      where: { id: validated.data.id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            viewings: {
              where: {
                status: "scheduled",
              },
            },
          },
        },
      },
    });

    if (!listing) {
      return errorResponse("NOT_FOUND", "Listing not found.", 404);
    }

    return successSingleResponse({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      category: listing.category,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      city: listing.city,
      address: listing.address,
      createdAt: listing.createdAt,
      agent: listing.agent,
      viewingCount: listing._count.viewings,
    });
  } catch (error) {
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}
