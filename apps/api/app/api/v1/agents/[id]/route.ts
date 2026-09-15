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

    const agent = await prisma.agent.findUnique({
      where: { id: validated.data.id },
      include: {
        _count: {
          select: { listings: true },
        },
      },
    });

    if (!agent) {
      return errorResponse("NOT_FOUND", "Agent not found.", 404);
    }

    return successSingleResponse({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      city: agent.city,
      createdAt: agent.createdAt,
      listingCount: agent._count.listings,
    });
  } catch (error) {
    console.error("[GET /api/v1/agents/:id]", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", 500);
  }
}
