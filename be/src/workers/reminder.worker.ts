import { prisma } from "@/config/prisma.js"

const POLL_INTERVAL = 30000;//every 30 sec
const BATCH_SIZE = 100;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function processReminders() {
  await prisma.$transaction(async (tx) => {
    const dueReminders = await tx.$queryRaw<
      { id: string }[]
    >`
      SELECT id
      FROM "Reminder"
      WHERE status = 'PENDING'
        AND "scheduledAt" <= NOW()
      ORDER BY "scheduledAt" ASC
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    `;

    for (const item of dueReminders) {
      const reminder = await tx.reminder.findUnique({
        where: { id: item.id },
        include: {
          session: {
            include: {
              member: true,
              professional: true,
            },
          },
          user: true,
        },
      });

      if (!reminder || reminder.status !== "PENDING") {
        continue;
      }

      if (reminder.session.status !== "BOOKED") {
        await tx.reminder.update({
          where: { id: reminder.id },
          data: { status: "CANCELLED" },
        });

        continue;
      }

      const session = reminder.session;

      const otherPerson =
        reminder.userId === session.memberId
          ? session.professional
          : session.member;

      const hours =
        reminder.type === "BEFORE_24_HOURS" ? 24 : 1;

      // The unique reminderId also prevents duplicate notifications.
      await tx.notification.create({
        data: {
          userId: reminder.userId,
          reminderId: reminder.id,
          title: "Upcoming session reminder",
          message:
            `Your session with ${otherPerson.firstName} ${otherPerson.lastName} ` +
            `starts in ${hours} hour(s).`,
        },
      });

      await tx.reminder.update({
        where: { id: reminder.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });
    }
  });
}

async function startWorker() {
  console.log("Reminder worker started");

  while (true) {
    try {
      await processReminders();
    } catch (error) {
      console.error("Reminder worker error:", error);
    }

    await sleep(POLL_INTERVAL);
  }
}

startWorker().catch(async (error) => {
  console.error("Worker startup error:", error);
  await prisma.$disconnect();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});