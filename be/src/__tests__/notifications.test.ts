import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Application } from "express";
import { prisma } from "../config/prisma.js";
import {
  getApp,
  memberPayload,
  createAndLogin,
  cleanupUsers,
} from "./helpers.js";

describe("Notification routes", () => {
  let app: Application;
  let memberToken: string;
  let memberId: string;
  let notificationId: string;
  const emails: string[] = [];

  beforeAll(async () => {
    app = await getApp();

    const mPayload = memberPayload();
    emails.push(mPayload.email);

    const member = await createAndLogin(app, mPayload);
    memberToken = member.token;
    memberId = member.userId;

    // Seed a notification directly so we have something to read/mark
    const n = await prisma.notification.create({
      data: {
        userId: memberId,
        title: "Test notification",
        message: "This is a test notification for e2e.",
      },
    });
    notificationId = n.id;
  });

  afterAll(async () => {
    // Notifications are cascade-deleted with the user
    await cleanupUsers(emails);
  });

  // ── GET /api/v1/notifications ─────────────────────────────────────────

  describe("GET /api/v1/notifications", () => {
    it("returns notifications list for authenticated user", async () => {
      const res = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${memberToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/v1/notifications");
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/v1/notifications/unread-count ────────────────────────────

  describe("GET /api/v1/notifications/unread-count", () => {
    it("returns unread count ≥ 1 for user with unread notification", async () => {
      const res = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("Authorization", `Bearer ${memberToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBeGreaterThanOrEqual(1);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get(
        "/api/v1/notifications/unread-count"
      );
      expect(res.status).toBe(401);
    });
  });

  // ── PATCH /api/v1/notifications/:id/read ─────────────────────────────

  describe("PATCH /api/v1/notifications/:id/read", () => {
    it("marks a notification as read", async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set("Authorization", `Bearer ${memberToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("returns error when marking already-read notification", async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set("Authorization", `Bearer ${memberToken}`);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("unread count decreases after marking as read", async () => {
      const res = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("Authorization", `Bearer ${memberToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(0);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).patch(
        `/api/v1/notifications/${notificationId}/read`
      );
      expect(res.status).toBe(401);
    });
  });
});
