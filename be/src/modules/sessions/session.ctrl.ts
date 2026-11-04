import { Request, Response } from "express";
import { prisma } from "@/config/prisma.js";
import { Prisma } from "@prisma/client";
import { asyncHandler } from "@/utils/asyncHandler.js";
import { getAvailableSlots } from "../availability/availability.service.js"
import { createSessionReminders } from "./reminder.helper.js";
import { ApiError } from "@/utils/apiError.utils.js";
import { Role } from "@prisma/client";
import { cancelSessionService, getMySessionsService, rescheduleSessionService } from "./session.service.js";
import { success } from "zod";


const SESSION_DURATION = 50;

export async function validateSlot(
  professionalId: string,
  memberTimezone: string,
  startsAt: Date
) {
  if (startsAt <= new Date()) {
    throw new ApiError(400, "Cannot book a session in the past");
  }

  const slots = await getAvailableSlots(
    professionalId,
    memberTimezone
  );

  const isValid = slots.some(
    (slot) =>
      new Date(slot.startsAt).getTime() === startsAt.getTime()
  );

  if (!isValid) {
    throw new ApiError(409, "This slot is no longer available");
  }
}

export const bookSession = asyncHandler(
  async (req: Request, res: Response) => {
    const memberId = req.user?.id;
    const { professionalId, startsAt: startsAtInput } = req.body;

    if (!memberId) {
      throw new ApiError(401, "Unauthorized");
    }

    if (
      typeof professionalId !== "string" ||
      typeof startsAtInput !== "string"
    ) {
      throw new ApiError(
        400,
        "Professional ID and session start time are required"
      );
    }

    const startsAt = new Date(startsAtInput);

    if (Number.isNaN(startsAt.getTime())) {
      throw new ApiError(400, "Invalid session start time");
    }

    // Fetch member
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        timezone: true,
        role: true,
      },
    });

    if (!member || member.role !== Role.MEMBER ) {
      throw new ApiError(404, "Member not found");
    }

    // Validate requested slot
    await validateSlot(
      professionalId,
      member.timezone,
      startsAt
    );

    const endsAt = new Date(
      startsAt.getTime() + SESSION_DURATION * 60_000
    );
console.log("Passed... L: 86")
    try {
      const session = await prisma.$transaction(async (tx) => {
        const createdSession = await tx.session.create({
          data: {
            memberId,
            professionalId,
            startsAt,
            endsAt,
          },
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        await createSessionReminders(
          tx,
          createdSession.id,
          memberId,
          professionalId,
          startsAt
        );

        return createdSession;
      });

      res.status(201).json({
        success: true,
        message: "Session booked successfully",
        data: session,
      });
    } catch (error) {
      console.log("Error::", error)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2004")
      ) {
        throw new ApiError(
          409,
          "This slot is already booked or conflicts with another session"
        );
      }

      throw error;
    }
  }
);


export const cancelSession = asyncHandler(
  async(req: Request, res: Response)=>{
    const data = await cancelSessionService(
      String(req.params.id),
      req.user!.id,
      req.user!.role
    )
    return res.status(200).json({success: true, data})
  }
)

export const reschedule = asyncHandler(
  async(req: Request, res: Response)=>{
    const data = await rescheduleSessionService(
      String(req.params.id),
      req.user!.id,
      req.body.startsAt
    )
    return res.status(200).json({success: true, data})
  }
)

// GET /api/sessions/my?type=upcoming
// GET /api/sessions/my?type=past
export const mySession = asyncHandler(
  async(req: Request, res: Response)=>{
    const type = req.query.type === "past" ? "past" : "upcoming";

    const data = await getMySessionsService(
      req.user!.id,
      req.user!.role,
      type
    )
    return res.status(200).json({success: true, data})
  }
)