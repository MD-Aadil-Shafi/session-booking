
import { Request, Response } from "express";
import { prisma } from "@/config/prisma.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import { ApiError } from "@/utils/apiError.utils.js";

import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { addDays, parseISO, format } from "date-fns";

const SESSION_MINUTES = 50;
const SLOT_INTERVAL = 60;

interface Slot {
  startsAt: string;
  endsAt: string;
  localStart: string;
  localEnd: string;
  timezone: string;
}

function getWeekday(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

//calculates which 50-minute sessions a member can book with a 
//professional over the next 28 days, considering the 
//professional's working hours, existing bookings, and timezones.

export const getAvailableSlots = asyncHandler(
  async (req: Request, res: Response) => {
    const { professionalId } = req.params;
    //TODO: will grab timezone from auth user
    const { timezone: memberTimezone } = req.query;

    if (typeof professionalId !== "string") {
      throw new ApiError(400, "Invalid professional ID");
    }

    if (
      typeof memberTimezone !== "string" ||
      !memberTimezone.trim()
    ) {
      throw new ApiError(400, "Member timezone is required");
    }

    // Validate timezone
    try {
      Intl.DateTimeFormat("en-US", {
        timeZone: memberTimezone,
      });
    } catch {
      throw new ApiError(400, "Invalid member timezone");
    }

    const professional = await prisma.user.findFirst({
      where: {
        id: professionalId,
        role: "PROFESSIONAL",
      },
      include: {
        workingHours: true,
      },
    });

    if (!professional) {
      throw new ApiError(404, "Professional not found");
    }

    const now = new Date();

    const professionalToday = formatInTimeZone(
      now,
      professional.timezone,
      "yyyy-MM-dd"
    );

    const dates = Array.from({ length: 28 }, (_, index) =>
      format(
        addDays(parseISO(professionalToday), index),
        "yyyy-MM-dd"
      )
    );

    const rangeStart = fromZonedTime(
      `${professionalToday}T00:00:00`,
      professional.timezone
    );

    const lastDate = dates[dates.length - 1];

    const rangeEnd = fromZonedTime(
      `${format(
        addDays(parseISO(lastDate), 1),
        "yyyy-MM-dd"
      )}T00:00:00`,
      professional.timezone
    );

    const existingSessions = await prisma.session.findMany({
      where: {
        professionalId,
        status: "BOOKED",
        startsAt: {
          lt: rangeEnd,
        },
        endsAt: {
          gt: rangeStart,
        },
      },
      select: {
        startsAt: true,
        endsAt: true,
      },
    });

    const slots: Slot[] = [];

    for (const date of dates) {
      const weekday = getWeekday(date);

      const workingHour = professional.workingHours.find(
        (hour) => hour.dayOfWeek === weekday
      );

      if (!workingHour) continue;

      const [startHour, startMinute] =
        workingHour.startTime.split(":").map(Number);

      const [endHour, endMinute] =
        workingHour.endTime.split(":").map(Number);

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      for (
        let minute = startMinutes;
        minute + SESSION_MINUTES <= endMinutes;
        minute += SLOT_INTERVAL
      ) {
        const hour = Math.floor(minute / 60);
        const mins = minute % 60;

        const localTime =
          `${String(hour).padStart(2, "0")}:` +
          `${String(mins).padStart(2, "0")}`;

        const localStart = `${date}T${localTime}:00`;

        const startsAt = fromZonedTime(
          localStart,
          professional.timezone
        );

        const endsAt = new Date(
          startsAt.getTime() + SESSION_MINUTES * 60000
        );

        if (startsAt <= now) continue;

        const isBooked = existingSessions.some(
          (session) =>
            startsAt < session.endsAt &&
            endsAt > session.startsAt
        );

        if (isBooked) continue;

        slots.push({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),

          localStart: formatInTimeZone(
            startsAt,
            memberTimezone,
            "yyyy-MM-dd HH:mm"
          ),

          localEnd: formatInTimeZone(
            endsAt,
            memberTimezone,
            "yyyy-MM-dd HH:mm"
          ),

          timezone: memberTimezone,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Available slots fetched successfully",
      data: {
        professionalId,
        professionalTimezone: professional.timezone,
        memberTimezone,
        slots,
      },
    });
  }
);
