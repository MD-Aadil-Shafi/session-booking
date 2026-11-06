import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Application } from "express";
import {
  getApp,
  memberPayload,
  professionalPayload,
  createAndLogin,
  cleanupUsers,
  workingHoursPayload,
} from "./helpers.js";

describe("Availability routes", () => {
  let app: Application;
  let memberToken: string;
  let professionalToken: string;
  let professionalId: string;
  const emails: string[] = [];

  beforeAll(async () => {
    app = await getApp();

    const mPayload = memberPayload();
    const pPayload = professionalPayload();
    emails.push(mPayload.email, pPayload.email);

    const member = await createAndLogin(app, mPayload);
    memberToken = member.token;

    const prof = await createAndLogin(app, pPayload);
    professionalToken = prof.token;
    professionalId = prof.userId;

    // Give the professional working hours so slots can be computed
    await request(app)
      .put("/api/v1/professional/working-hours")
      .set("Authorization", `Bearer ${professionalToken}`)
      .send(workingHoursPayload());
  });

  afterAll(async () => {
    await cleanupUsers(emails);
  });

  // ── GET /api/v1/availability/:professionalId/available-slots ───────────

  describe("GET /api/v1/availability/:id/available-slots", () => {
    it("returns available slots for a professional (MEMBER)", async () => {
      const res = await request(app)
        .get(
          `/api/v1/availability/${professionalId}/available-slots?timezone=UTC`
        )
        .set("Authorization", `Bearer ${memberToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data?.slots)).toBe(true);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get(
        `/api/v1/availability/${professionalId}/available-slots?timezone=UTC`
      );
      expect(res.status).toBe(401);
    });

    it("returns 401 when called by PROFESSIONAL role", async () => {
      const res = await request(app)
        .get(
          `/api/v1/availability/${professionalId}/available-slots?timezone=UTC`
        )
        .set("Authorization", `Bearer ${professionalToken}`);
      expect(res.status).toBe(401);
    });

    it("returns slots array when professional has no working hours", async () => {
      // create a second professional with no hours
      const p2 = professionalPayload();
      emails.push(p2.email);
      const { token: p2Token, userId: p2Id } = await createAndLogin(app, p2);

      const res = await request(app)
        .get(`/api/v1/availability/${p2Id}/available-slots?timezone=UTC`)
        .set("Authorization", `Bearer ${memberToken}`);
      expect(res.status).toBe(200);
      // no working hours → zero slots, but the shape must still be valid
      expect(Array.isArray(res.body.data?.slots)).toBe(true);
    });
  });
});
