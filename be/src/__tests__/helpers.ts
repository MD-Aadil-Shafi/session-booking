/**
 * Shared test helpers
 *
 * All tests share ONE real Postgres database (the one in DATABASE_URL / .env).
 * Each suite cleans up the users it creates so tests stay independent.
 */
import request from "supertest";
import type { Application } from "express";
import { createApp } from "../app.js";
import { prisma } from "../config/prisma.js";

// ── App singleton ────────────────────────────────────────────────────────────

let _app: Application | null = null;

export async function getApp(): Promise<Application> {
  if (!_app) _app = await createApp();
  return _app;
}

// ── Unique test data helpers ──────────────────────────────────────────────────

let _seq = 0;
const uid = () => `${Date.now()}_${++_seq}`;

export function memberPayload() {
  const id = uid();
  return {
    firstName: "Mem",
    lastName: "Test",
    email: `member_${id}@test.local`,
    password: "Pass1234",
    timezone: "UTC",
    role: "MEMBER",
  };
}

export function professionalPayload() {
  const id = uid();
  return {
    firstName: "Pro",
    lastName: "Test",
    email: `prof_${id}@test.local`,
    password: "Pass1234",
    timezone: "UTC",
    role: "PROFESSIONAL",
  };
}

// ── Register + login in one call ─────────────────────────────────────────────

export async function createAndLogin(
  app: Application,
  payload: ReturnType<typeof memberPayload>
): Promise<{ token: string; userId: string; email: string }> {
  await request(app).post("/api/v1/auth/register").send(payload).expect(200);
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: payload.email, password: payload.password })
    .expect(200);
  return {
    token: res.body.access_token as string,
    userId: res.body.user.id as string,
    email: payload.email,
  };
}

// ── Cleanup helpers ───────────────────────────────────────────────────────────

export async function deleteUserByEmail(email: string) {
  // Delete sessions that reference this user before deleting the user,
  // to avoid FK constraint violations (Session has no CASCADE on User deletion).
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    await prisma.session.deleteMany({
      where: { OR: [{ memberId: user.id }, { professionalId: user.id }] },
    });
  }
  await prisma.user.deleteMany({ where: { email } });
}

export async function cleanupUsers(emails: string[]) {
  for (const e of emails) await deleteUserByEmail(e);
}

// ── Working hours for a professional ─────────────────────────────────────────

export function workingHoursPayload() {
  return {
    hours: [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
    ],
  };
}
