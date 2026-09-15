import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, successSingleResponse } from "@/lib/envelope";
import { maskEmail } from "@/lib/mask-email";
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

    const viewing = await prisma.propertyViewing.findUnique({
      where: { id: validated.data.id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
          },
        },
      },
    });

    if (!viewing) {
      return errorResponse("NOT_FOUND", "Viewing not found.", 404);
    }

    return successSingleResponse({
      id: viewing.id,
      visitorName: viewing.visitorName,
      visitorEmail: maskEmail(viewing.visitorEmail),
      scheduledAt: viewing.scheduledAt,
      status: viewing.status,
      createdAt: viewing.createdAt,
      listing: viewing.listing,
    });
  } catch (error) {
    console.error("[GET /api/v1/viewings/:id]", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}
