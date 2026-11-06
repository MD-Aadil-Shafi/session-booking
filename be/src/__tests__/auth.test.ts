import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Application } from "express";
import { getApp, memberPayload, cleanupUsers } from "./helpers.js";

describe("Auth routes", () => {
  let app: Application;
  const created: string[] = [];

  beforeAll(async () => {
    app = await getApp();
  });

  afterAll(async () => {
    await cleanupUsers(created);
  });

  // ── POST /api/v1/auth/register ──────────────────────────────────────────

  describe("POST /api/v1/auth/register", () => {
    it("registers a new user successfully", async () => {
      const payload = memberPayload();
      created.push(payload.email);
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(payload);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
    });

    it("returns 500 if email already exists", async () => {
      const payload = memberPayload();
      created.push(payload.email);
      await request(app).post("/api/v1/auth/register").send(payload);
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(payload);
      expect(res.status).toBe(500);
    });

    it("returns 400 for missing required fields", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "bad@test.local" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it("returns 400 for invalid email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ ...memberPayload(), email: "not-an-email" });
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid timezone", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ ...memberPayload(), timezone: "Mars/Crater" });
      expect(res.status).toBe(400);
    });

    it("returns 400 when password is too short", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ ...memberPayload(), password: "123" });
      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/v1/auth/login ──────────────────────────────────────────────

  describe("POST /api/v1/auth/login", () => {
    it("logs in and returns tokens + user", async () => {
      const payload = memberPayload();
      created.push(payload.email);
      await request(app).post("/api/v1/auth/register").send(payload);
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: payload.email, password: payload.password });
      expect(res.status).toBe(200);
      expect(typeof res.body.access_token).toBe("string");
      expect(typeof res.body.refresh_token).toBe("string");
      expect(res.body.user.email).toBe(payload.email);
      expect(res.body.user.password).toBeUndefined();
    });

    it("returns 401 for wrong password", async () => {
      const payload = memberPayload();
      created.push(payload.email);
      await request(app).post("/api/v1/auth/register").send(payload);
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: payload.email, password: "wrongpass" });
      expect(res.status).toBe(401);
    });

    it("returns 500 for non-existent user", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "ghost@test.local", password: "Pass1234" });
      expect(res.status).toBe(500);
    });

    it("returns 400 for missing fields", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@test.local" });
      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/v1/auth/refresh ─────────────────────────────────────────────

  describe("GET /api/v1/auth/refresh", () => {
    it("returns new tokens when given a valid refresh token", async () => {
      const payload = memberPayload();
      created.push(payload.email);
      await request(app).post("/api/v1/auth/register").send(payload);
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: payload.email, password: payload.password });
      const refreshToken: string = login.body.refresh_token;

      const res = await request(app)
        .get("/api/v1/auth/refresh")
        .set("refreshtoken", refreshToken);
      expect(res.status).toBe(201);
      expect(typeof res.body.access_token).toBe("string");
    });

    it("returns 400 when refresh token is missing", async () => {
      const res = await request(app).get("/api/v1/auth/refresh");
      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/v1/auth/logout ─────────────────────────────────────────────

  describe("POST /api/v1/auth/logout", () => {
    it("logs out an authenticated user", async () => {
      const payload = memberPayload();
      created.push(payload.email);
      await request(app).post("/api/v1/auth/register").send(payload);
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: payload.email, password: payload.password });
      const token: string = login.body.access_token;

      const res = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).post("/api/v1/auth/logout");
      expect(res.status).toBe(401);
    });
  });
});
