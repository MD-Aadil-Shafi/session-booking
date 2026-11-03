
import { Request, Response } from "express";
import { prisma } from "@/config/prisma.js";
import { asyncHandler } from "@/utils/asyncHandler.js";

interface WorkingHourInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

function validateHours(hours: WorkingHourInput[]) {
  const days = new Set<number>();

  for (const hour of hours) {
    if (hour.dayOfWeek < 0 || hour.dayOfWeek > 6) {
      throw new Error("Invalid day of week");
    }

    if (days.has(hour.dayOfWeek)) {
      throw new Error("Duplicate weekday");
    }

    days.add(hour.dayOfWeek);

    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (
      !timePattern.test(hour.startTime) ||
      !timePattern.test(hour.endTime)
    ) {
      throw new Error("Invalid working hour format");
    }

    if (hour.startTime >= hour.endTime) {
      throw new Error("End time must be after start time");
    }
  }
}

/*
JS day codes.
Sunday = 0
Monday = 1
Tuesday = 2
...
Saturday = 6
*/
// eg req body:
/*
{
  "hours": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "17:00"
    },
    {
      "dayOfWeek": 2,
      "startTime": "09:00",
      "endTime": "17:00"
    },
    {
      "dayOfWeek": 3,
      "startTime": "10:00",
      "endTime": "18:00"
    },
    {
      "dayOfWeek": 4,
      "startTime": "09:00",
      "endTime": "17:00"
    },
    {
      "dayOfWeek": 5,
      "startTime": "09:00",
      "endTime": "13:00"
    }
  ]
}
*/

// Set professional working hours
export const setWorkingHours = asyncHandler(
  async (req: Request, res: Response) => {
    //is express + ts it can be str or str[] so typecasting.
    // const professionalId = req.params.id;
    const professionalId = String(req.params.id);
    const hours: WorkingHourInput[] = req.body.hours;

    if (!Array.isArray(hours)) {
      return res.status(400).json({
        success: false,
        message: "Hours must be an array",
      });
    }

    validateHours(hours);

    const workingHours = await prisma.$transaction(async (tx) => {
      await tx.professionalHours.deleteMany({
        where: { professionalId },
      });

      await tx.professionalHours.createMany({
        data: hours.map((hour) => ({
          professionalId,
          ...hour,
        })),
      });

      return tx.professionalHours.findMany({
        where: { professionalId },
        orderBy: { dayOfWeek: "asc" },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Working hours updated successfully",
      data: workingHours,
    });
  }
);

// List all professionals
export const listProfessionals = asyncHandler(
  async (_req: Request, res: Response) => {
    const professionals = await prisma.user.findMany({
      where: {
        role: "PROFESSIONAL",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        timezone: true,
        workingHours: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: professionals,
    });
  }
);

// Get professional by ID
export const getProfessional = asyncHandler(
  async (req: Request, res: Response) => {
    const id = String(req.params.id);

    const professional = await prisma.user.findFirst({
      where: {
        id,
        role: "PROFESSIONAL",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        timezone: true,
        workingHours: true,
      },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: professional,
    });
  }
);
