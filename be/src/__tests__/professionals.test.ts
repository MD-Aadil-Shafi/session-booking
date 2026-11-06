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

describe("Professional routes", () => {
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
  });

  afterAll(async () => {
    await cleanupUsers(emails);
  });

  // ── GET /api/v1/professional ────────────────────────────────────────────

  describe("GET /api/v1/professional", () => {
    it("returns list of professionals for MEMBER", async () => {
      const res = await request(app)
        .get("/api/v1/professional")
        .set("Authorization", `Bearer ${memberToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/v1/professional");
      expect(res.status).toBe(401);
    });

    it("returns 401 when called by PROFESSIONAL role", async () => {
      const res = await request(app)
        .get("/api/v1/professional")
        .set("Authorization", `Bearer ${professionalToken}`);
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/v1/professional/:id ────────────────────────────────────────

  describe("GET /api/v1/professional/:id", () => {
    it("returns a professional profile by id", async () => {
      const res = await request(app)
        .get(`/api/v1/professional/${professionalId}`)
        .set("Authorization", `Bearer ${memberToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data?.id ?? res.body.id).toBeDefined();
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get(
        `/api/v1/professional/${professionalId}`
      );
      expect(res.status).toBe(401);
    });
  });

  // ── PUT /api/v1/professional/working-hours ──────────────────────────────

  describe("PUT /api/v1/professional/working-hours", () => {
    it("sets working hours for PROFESSIONAL", async () => {
      const res = await request(app)
        .put("/api/v1/professional/working-hours")
        .set("Authorization", `Bearer ${professionalToken}`)
        .send(workingHoursPayload());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("returns 401 when called by MEMBER", async () => {
      const res = await request(app)
        .put("/api/v1/professional/working-hours")
        .set("Authorization", `Bearer ${memberToken}`)
        .send(workingHoursPayload());
      expect(res.status).toBe(401);
    });

    it("returns 401 without token", async () => {
      const res = await request(app)
        .put("/api/v1/professional/working-hours")
        .send(workingHoursPayload());
      expect(res.status).toBe(401);
    });
  });
});
