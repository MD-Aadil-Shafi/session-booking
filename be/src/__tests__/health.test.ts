import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import type { Application } from "express";
import { getApp } from "./helpers.js";

describe("Health check", () => {
  let app: Application;

  beforeAll(async () => {
    app = await getApp();
  });

  it("GET /health returns 200 with success message", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
