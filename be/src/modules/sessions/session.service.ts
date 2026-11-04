import {prisma} from '@/config/prisma.js';
import { createSessionReminders } from './reminder.helper.js';
import { validateSlot } from './session.ctrl.js';

export async function cancelSessionService(
  sessionId: string,
  userId: string,
  role: "MEMBER" | "PROFESSIONAL" | "USER"
) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== "BOOKED") {
      throw new Error("Active session not found");
    }

    if (
      role === "MEMBER" &&
      session.memberId !== userId
    ) {
      throw new Error("Unauthorized");
    }

    if (
      role === "PROFESSIONAL" &&
      session.professionalId !== userId
    ) {
      throw new Error("Unauthorized");
    }

    const now = new Date();

    if (session.startsAt <= now) {
      throw new Error("Cannot cancel a session that has started");
    }

    const hoursUntilStart =
      (session.startsAt.getTime() - now.getTime()) /
      3600000;

    if (role === "MEMBER" && hoursUntilStart <= 24) {
      throw new Error(
        "Cancellation is blocked within 24 hours of the session"
      );
    }

    await tx.session.updateMany({
      where: {
        id: sessionId,
        status: "BOOKED",
      },
      data: {
        status: "CANCELLED",
      },
    });

    await tx.reminder.updateMany({
      where: {
        sessionId,
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    return {
      message: "Session cancelled successfully",
    };
  });
}


const SESSION_DURATION = 50;

export async function rescheduleSessionService(
  sessionId: string,
  memberId: string,
  newStartsAtInput: string
) {
  const newStartsAt = new Date(newStartsAtInput);

  if (Number.isNaN(newStartsAt.getTime())) {
    throw new Error("Invalid session start time");
  }

  return prisma.$transaction(async (tx) => {
    // Lock the existing session against concurrent changes.
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM "Session"
      WHERE id = ${sessionId}::uuid
      FOR UPDATE
    `;

    if (!locked.length) {
      throw new Error("Session not found");
    }

    const session = await tx.session.findUnique({
      where: { id: sessionId },
    });

    if (
      !session ||
      session.memberId !== memberId ||
      session.status !== "BOOKED"
    ) {
      throw new Error("Active session not found");
    }

    const now = new Date();

    if (session.startsAt <= now) {
      throw new Error("Cannot reschedule a started session");
    }

    const hoursUntilStart =
      (session.startsAt.getTime() - now.getTime()) /
      3600000;

    if (hoursUntilStart <= 24) {
      throw new Error(
        "Rescheduling is blocked within 24 hours of the session"
      );
    }

    const member = await tx.user.findUniqueOrThrow({
      where: { id: memberId },
      select: { timezone: true },
    });

    if (newStartsAt <= now) {
      throw new Error("Cannot reschedule into the past");
    }

    // Check the new slot using the existing professional.
    await validateSlot(
      session.professionalId,
      member.timezone,
      newStartsAt
    );

    const newEndsAt = new Date(
      newStartsAt.getTime() + SESSION_DURATION * 60000
    );

    // Cancel old pending reminders.
    await tx.reminder.updateMany({
      where: {
        sessionId,
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    // Update the same session, not create a second one.
    const updated = await tx.session.update({
      where: { id: sessionId },
      data: {
        startsAt: newStartsAt,
        endsAt: newEndsAt,
      },
    });

    // Schedule reminders for the new time.
    await createSessionReminders(
      tx,
      sessionId,
      memberId,
      session.professionalId,
      newStartsAt
    );

    return updated;
  });
}


export async function getMySessionsService(
  userId: string,
  role: "MEMBER" | "PROFESSIONAL" | "USER",
  type: "upcoming" | "past"
) {
  const now = new Date();

  const userFilter =
    role === "MEMBER"
      ? { memberId: userId }
      : { professionalId: userId };

  return prisma.session.findMany({
    where: {
      ...userFilter,

      ...(type === "upcoming"
        ? {
            status: "BOOKED",
            startsAt: { gt: now },
          }
        : {
            OR: [
              { startsAt: { lte: now } },
              { status: "CANCELLED" },
            ],
          }),
    },

    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          timezone: true,
        },
      },

      professional: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          timezone: true,
        },
      },
    },

    orderBy: {
      startsAt: type === "upcoming" ? "asc" : "desc",
    },
  });
}