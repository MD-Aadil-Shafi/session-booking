import { prisma } from "@/config/prisma.js"
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

export async function getAvailableSlots(
  professionalId: string,
  memberTimezone: string
) {
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
    throw new Error("Professional not found");
  }

  const now = new Date();

  const professionalToday = formatInTimeZone(
    now,
    professional.timezone,
    "yyyy-MM-dd"
  );

  const dates = Array.from({ length: 28 }, (_, index) =>
    format(addDays(parseISO(professionalToday), index), "yyyy-MM-dd")
  );

  const rangeStart = fromZonedTime(
    `${professionalToday}T00:00:00`,
    professional.timezone
  );

  const lastDate = dates[dates.length - 1];

  const rangeEnd = fromZonedTime(
    `${format(addDays(parseISO(lastDate), 1), "yyyy-MM-dd")}T00:00:00`,
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

  return slots;
}