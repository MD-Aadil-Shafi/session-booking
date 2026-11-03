import { Prisma } from "@prisma/client";

export async function createSessionReminders(
  tx: Prisma.TransactionClient,
  sessionId: string,
  memberId: string,
  professionalId: string,
  startsAt: Date
) {
  const now = new Date();

  const reminderTypes = [
    {
      type: "BEFORE_24_HOURS" as const,
      minutes: 24 * 60,
    },
    {
      type: "BEFORE_1_HOUR" as const,
      minutes: 60,
    },
  ];

  const participants = [memberId, professionalId];

  const reminders = [];

  for (const participantId of participants) {
    for (const reminderType of reminderTypes) {
      const scheduledAt = new Date(
        startsAt.getTime() -
          reminderType.minutes * 60 * 1000
      );

      // not creating reminders whose time has passed.
      if (scheduledAt <= now) continue;

      reminders.push({
        sessionId,
        userId: participantId,
        type: reminderType.type,
        scheduledAt,
        status: "PENDING" as const,
      });
    }
  }

  if (reminders.length) {
    await tx.reminder.createMany({
      data: reminders,
    });
  }
}