import { Request, Response } from "express";
import {prisma} from '@/config/prisma.js'
import { getAvailableSlots } from "./availability.service.js"
import { asyncHandler } from "@/utils/asyncHandler.js";
import { ApiError } from "@/utils/apiError.utils.js";

export const getAvailableSlotsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { professionalId } = req.params;
    // const { timezone: memberTimezone } = req.query;

    // Validate professional ID
    if (typeof professionalId !== "string") {
      throw new ApiError(400, "Invalid professional ID");
    }

    // Validate timezone
    // if (
    //   typeof memberTimezone !== "string" ||
    //   !memberTimezone.trim()
    // ) {
    //   throw new ApiError(400, "Timezone is required");
    // }

    // Validate IANA timezone
    // try {
    //   Intl.DateTimeFormat("en-US", {
    //     timeZone: memberTimezone,
    //   });
    // } catch {
    //   throw new ApiError(400, "Invalid timezone");
    // }
    const member = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      select: { timezone: true },
    });
    const memberTimezone = member.timezone;
    const slots = await getAvailableSlots(
      professionalId,
      memberTimezone
    );

    res.status(200).json({
      success: true,
      message: "Available slots fetched successfully",
      data: {
        professionalId,
        memberTimezone,
        totalSlots: slots.length,
        slots,
      },
    });
  }
);